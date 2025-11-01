import React, { useState, useEffect } from 'react';
import {
  searchMedicine,
  compareMedicines,
  checkInteractions,
  getMedicineCategories,
  fetchOpenFdaDetails,
  fetchOpenFdaEvents
} from '../../services/medicineSearchService.js';

const MedicineSearch = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('search'); // search, compare, interactions
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [fdaDetails, setFdaDetails] = useState(null);
  const [fdaEvents, setFdaEvents] = useState(null);

  // Compare state
  const [compareMeds, setCompareMeds] = useState(['', '']);
  const [compareResult, setCompareResult] = useState(null);

  // Interactions state
  const [interactionMeds, setInteractionMeds] = useState(['']);
  const [conditions, setConditions] = useState(['']);
  const [interactionResult, setInteractionResult] = useState(null);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await getMedicineCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  // Search medicine
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setError('Please enter a medicine name');
      return;
    }

    setLoading(true);
    setError('');
    setSearchResult(null);
    setFdaDetails(null);
    setFdaEvents(null);

    try {
      // Run AI summary (private) and OpenFDA (public) in parallel, but don't fail the whole view if one fails
      const aiPromise = searchMedicine(searchQuery).catch((e) => e);
      const fdaDetailsPromise = fetchOpenFdaDetails(searchQuery).catch((e) => e);
      const fdaEventsPromise = fetchOpenFdaEvents(searchQuery).catch((e) => e);

      const [aiRes, fdaDetRes, fdaEvtRes] = await Promise.all([aiPromise, fdaDetailsPromise, fdaEventsPromise]);

      if (aiRes?.success) {
        setSearchResult(aiRes.data);
      }
      if (fdaDetRes?.success) {
        setFdaDetails(fdaDetRes.data);
      }
      if (fdaEvtRes?.success) {
        setFdaEvents(fdaEvtRes.data);
      }

      if (!aiRes?.success && !fdaDetRes?.success) {
        // If both sources failed, surface a friendly error
        const msg = aiRes?.message || fdaDetRes?.message || 'No results available';
        setError(typeof msg === 'string' ? msg : 'No results available');
      }
    } catch (err) {
      setError(err.message || 'Failed to search medicine');
    } finally {
      setLoading(false);
    }
  };

  // Compare medicines
  const handleCompare = async (e) => {
    e.preventDefault();
    const validMeds = compareMeds.filter(m => m.trim());
    
    if (validMeds.length < 2) {
      setError('Please enter at least 2 medicine names to compare');
      return;
    }

    setLoading(true);
    setError('');
    setCompareResult(null);

    try {
      const response = await compareMedicines(validMeds);
      if (response.success) {
        setCompareResult(response.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to compare medicines');
    } finally {
      setLoading(false);
    }
  };

  // Check interactions
  const handleCheckInteractions = async (e) => {
    e.preventDefault();
    const validMeds = interactionMeds.filter(m => m.trim());
    
    if (validMeds.length < 1) {
      setError('Please enter at least one medicine name');
      return;
    }

    const validConditions = conditions.filter(c => c.trim());

    setLoading(true);
    setError('');
    setInteractionResult(null);

    try {
      const response = await checkInteractions(validMeds, validConditions);
      if (response.success) {
        setInteractionResult(response.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to check interactions');
    } finally {
      setLoading(false);
    }
  };

  // Add medicine input for compare
  const addCompareMedicine = () => {
    setCompareMeds([...compareMeds, '']);
  };

  // Add medicine input for interactions
  const addInteractionMedicine = () => {
    setInteractionMeds([...interactionMeds, '']);
  };

  // Add condition input
  const addCondition = () => {
    setConditions([...conditions, '']);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative bg-linear-to-br from-pink-50 via-purple-50 to-blue-50 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-purple-800 mb-2">
            💊 Medicine Search
          </h1>
          <p className="text-gray-600">
            Search medicines, compare options, and check interactions
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b">
            <button
              onClick={() => {
                setActiveTab('search');
                setError('');
              }}
              className={`flex-1 py-4 px-6 font-medium transition-colors ${
                activeTab === 'search'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-purple-500'
              }`}
            >
              🔍 Search Medicine
            </button>
            <button
              onClick={() => {
                setActiveTab('compare');
                setError('');
              }}
              className={`flex-1 py-4 px-6 font-medium transition-colors ${
                activeTab === 'compare'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-purple-500'
              }`}
            >
              ⚖️ Compare Medicines
            </button>
            <button
              onClick={() => {
                setActiveTab('interactions');
                setError('');
              }}
              className={`flex-1 py-4 px-6 font-medium transition-colors ${
                activeTab === 'interactions'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-purple-500'
              }`}
            >
              ⚠️ Check Interactions
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            {/* Medicine Categories */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Browse by Category
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categories.map((category, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSearchQuery(category.examples[0])}
                    className="p-4 bg-linear-to-br from-purple-50 to-pink-50 rounded-lg hover:shadow-lg transition-all text-left"
                  >
                    <div className="text-3xl mb-2">{category.icon}</div>
                    <div className="font-semibold text-gray-800">
                      {category.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {category.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Search Form */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medicine Name
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="E.g., Paracetamol, Ibuprofen, Amoxicillin"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Searching...' : '🔍 Search Medicine'}
                </button>
              </form>
            </div>

            {/* Search Results */}
              {(searchResult || fdaDetails) && (
              <div className="bg-white rounded-lg shadow-md p-6">
                  {searchResult && (
                    <>
                      <h3 className="text-2xl font-bold text-purple-800 mb-4">
                        AI Summary for: {searchResult.searchTerm}
                      </h3>
                      <div className="prose max-w-none">
                        <div
                          className="text-gray-700 whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{
                            __html: searchResult.information.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          }}
                        />
                      </div>
                      {searchResult.suggestions && searchResult.suggestions.length > 0 && (
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-semibold text-blue-800 mb-2">
                            Related Suggestions:
                          </h4>
                          <ul className="list-disc list-inside text-blue-700">
                            {searchResult.suggestions.map((suggestion, idx) => (
                              <li key={idx}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <hr className="my-6" />
                    </>
                  )}

                  {fdaDetails && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-green-600 text-xl">✔</span>
                        <h3 className="text-2xl font-bold text-green-800">
                          Verified FDA Data
                        </h3>
                      </div>
                      {(fdaDetails.names?.brand?.length || fdaDetails.names?.generic?.length) && (
                        <p className="text-gray-700 mb-2">
                          <span className="font-semibold">Names:</span> {[...(fdaDetails.names.brand || []), ...(fdaDetails.names.generic || [])].join(', ')}
                        </p>
                      )}
                      {fdaDetails.label?.indications_and_usage && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-800">Uses</h4>
                          <p className="text-gray-700 whitespace-pre-wrap">{fdaDetails.label.indications_and_usage}</p>
                        </div>
                      )}
                      {fdaDetails.label?.dosage_and_administration && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-800">Dosage & Administration</h4>
                          <p className="text-gray-700 whitespace-pre-wrap">{fdaDetails.label.dosage_and_administration}</p>
                        </div>
                      )}
                      {(fdaDetails.composition?.activeIngredients?.length || fdaDetails.composition?.activeIngredientLabel) && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-800">Ingredients</h4>
                          {fdaDetails.composition.activeIngredients?.length > 0 ? (
                            <ul className="list-disc list-inside text-gray-700">
                              {fdaDetails.composition.activeIngredients.map((ing, i) => (
                                <li key={i}>{ing.name} {ing.strength ? `- ${ing.strength}` : ''}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-gray-700">{fdaDetails.composition.activeIngredientLabel}</p>
                          )}
                        </div>
                      )}
                      {fdaDetails.label?.warnings && (
                        <div className="mb-2 p-3 bg-red-50 border border-red-200 rounded">
                          <h4 className="font-semibold text-red-800">Warnings</h4>
                          <p className="text-red-700 whitespace-pre-wrap">{fdaDetails.label.warnings}</p>
                        </div>
                      )}
                      <div className="mt-4 text-xs text-gray-500">Source: OpenFDA (or fallback demo)</div>
                    </div>
                  )}

                  {fdaEvents && (
                    <div className="mt-6">
                      <h4 className="font-semibold text-gray-800 mb-2">Adverse Events (OpenFDA)</h4>
                      {fdaEvents.reactions?.length > 0 && (
                        <div className="mb-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {fdaEvents.reactions.slice(0, 9).map((r, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2 text-sm">
                                <span className="text-gray-700">{r.term}</span>
                                <span className="text-gray-500">{r.count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {fdaEvents.recent?.length > 0 && (
                        <div className="text-xs text-gray-600">
                          <div className="font-semibold mb-1">Recent Reports:</div>
                          <ul className="list-disc list-inside">
                            {fdaEvents.recent.slice(0, 5).map((e, idx) => (
                              <li key={idx}>{e.received}: {e.reactions?.join(', ')}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
              </div>
            )}
          </div>
        )}

        {/* Compare Tab */}
        {activeTab === 'compare' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Compare Medicines
              </h2>
              <form onSubmit={handleCompare} className="space-y-4">
                {compareMeds.map((med, idx) => (
                  <div key={idx}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Medicine {idx + 1}
                    </label>
                    <input
                      type="text"
                      value={med}
                      onChange={(e) => {
                        const newMeds = [...compareMeds];
                        newMeds[idx] = e.target.value;
                        setCompareMeds(newMeds);
                      }}
                      placeholder={`Enter medicine ${idx + 1} name`}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addCompareMedicine}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  + Add Another Medicine
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Comparing...' : '⚖️ Compare Medicines'}
                </button>
              </form>
            </div>

            {/* Compare Results */}
            {compareResult && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-2xl font-bold text-purple-800 mb-4">
                  Comparison: {compareResult.medicines.join(' vs ')}
                </h3>
                <div className="prose max-w-none">
                  <div
                    className="text-gray-700 whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                      __html: compareResult.comparison.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Interactions Tab */}
        {activeTab === 'interactions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Check Medicine Interactions
              </h2>
              <form onSubmit={handleCheckInteractions} className="space-y-6">
                {/* Medicines */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">
                    Medicines Being Taken
                  </h3>
                  {interactionMeds.map((med, idx) => (
                    <div key={idx} className="mb-3">
                      <input
                        type="text"
                        value={med}
                        onChange={(e) => {
                          const newMeds = [...interactionMeds];
                          newMeds[idx] = e.target.value;
                          setInteractionMeds(newMeds);
                        }}
                        placeholder={`Medicine ${idx + 1}`}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addInteractionMedicine}
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    + Add Another Medicine
                  </button>
                </div>

                {/* Conditions */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">
                    Medical Conditions (Optional)
                  </h3>
                  {conditions.map((condition, idx) => (
                    <div key={idx} className="mb-3">
                      <input
                        type="text"
                        value={condition}
                        onChange={(e) => {
                          const newConditions = [...conditions];
                          newConditions[idx] = e.target.value;
                          setConditions(newConditions);
                        }}
                        placeholder={`Condition ${idx + 1} (e.g., Diabetes, Hypertension)`}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addCondition}
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    + Add Another Condition
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Checking...' : '⚠️ Check Interactions'}
                </button>
              </form>
            </div>

            {/* Interaction Results */}
            {interactionResult && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-2xl font-bold text-purple-800 mb-4">
                  Interaction Check Results
                </h3>
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
                  <p className="text-yellow-800 font-medium">
                    ⚠️ This is AI-generated information. Always consult with a healthcare professional for medical advice.
                  </p>
                </div>
                <div className="prose max-w-none">
                  <div
                    className="text-gray-700 whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                      __html: interactionResult.interactions.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Disclaimer */}
        {/* Disclaimer */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Medical Disclaimer:</strong> This information is AI-generated and for educational purposes only. 
            It is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of 
            your physician or other qualified health provider with any questions you may have regarding medications or 
            medical conditions.
          </p>
        </div>
        </div>
      </div>
    </div>
  );
};

export default MedicineSearch;
