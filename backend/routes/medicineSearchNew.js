import express from 'express';
const router = express.Router();
import { protect } from '../middleware/auth.js';
import { chatFlow } from '../services/groqClient.js';
import { searchDrugDetails, searchDrugEvents } from '../services/openFdaService.js';
const OPENFDA_API_KEY = process.env.OPENFDA_API_KEY;

router.post('/', protect, async (req, res) => {
  try {
    const { medicineName, query } = req.body;
    if (!medicineName && !query) return res.status(400).json({ success: false, message: 'Medicine name or search query is required' });
    const searchQuery = medicineName || query;
    const prompt = `Provide comprehensive information about the medicine: "${searchQuery}"\n\nInclude: Generic & Brand names, Category, Uses, How it works, Dosage, When to take, Side effects, Precautions, Interactions, Storage.`;
    if (!process.env.GROQ_API_KEY) return res.status(200).json({ success: true, data: { searchTerm: searchQuery, information: `Demo info for ${searchQuery}`, source: 'dummy' } });
    const response = await chatFlow({ message: prompt, userContext: 'User is searching for medicine information' });
    res.status(200).json({ success: true, data: { searchTerm: searchQuery, information: response.response, suggestions: response.suggestions || [] } });
  } catch (error) {
    console.error('Medicine Search Error:', error.message);
    res.status(200).json({ success: true, data: { searchTerm: 'Sample Medicine', information: 'Demo info', suggestions: ['fallback demo'], source: 'dummy' } });
  }
});

router.post('/compare', async (req, res) => {
  try {
    const { medicines } = req.body;
    if (!medicines || !Array.isArray(medicines) || medicines.length < 2) return res.status(400).json({ success: false, message: 'At least 2 medicine names required for comparison' });
    const prompt = `Compare these medicines: ${medicines.join(', ')}\n\nProvide purpose, effectiveness, side effects, cost, availability, key differences, and recommendation.`;
    if (!process.env.GROQ_API_KEY) return res.status(200).json({ success: true, data: { medicines, comparison: 'Demo comparison', source: 'dummy' } });
    const response = await chatFlow({ message: prompt, userContext: 'User is comparing multiple medicines' });
    res.status(200).json({ success: true, data: { medicines, comparison: response.response } });
  } catch (error) {
    console.error('Medicine Compare Error:', error.message);
    res.status(200).json({ success: true, data: { medicines: req.body?.medicines || [], comparison: 'Demo comparison', source: 'dummy' } });
  }
});

router.post('/interactions', async (req, res) => {
  try {
    const { medicines, conditions } = req.body;
    if (!medicines || !Array.isArray(medicines) || medicines.length < 1) return res.status(400).json({ success: false, message: 'At least one medicine name is required' });
    let prompt = `Check potential interactions for: ${medicines.join(', ')}`;
    if (conditions && conditions.length > 0) prompt += `\n\nPatient conditions: ${conditions.join(', ')}`;
    if (!process.env.GROQ_API_KEY) return res.status(200).json({ success: true, data: { medicines, conditions: conditions || [], interactions: '**Demo interactions**', source: 'dummy' } });
    const response = await chatFlow({ message: prompt, userContext: 'User is checking medicine interactions for safety' });
    res.status(200).json({ success: true, data: { medicines, conditions: conditions || [], interactions: response.response } });
  } catch (error) {
    console.error('Medicine Interactions Error:', error.message);
    res.status(200).json({ success: true, data: { medicines: req.body?.medicines || [], interactions: 'Demo interactions', source: 'dummy' } });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const categories = [
      { name: 'Pain Relief', icon: '💊', examples: ['Ibuprofen', 'Paracetamol', 'Aspirin'], description: 'Analgesics for pain management' },
      { name: 'Antibiotics', icon: '🦠', examples: ['Amoxicillin', 'Azithromycin', 'Ciprofloxacin'], description: 'Treats bacterial infections' },
      { name: 'Hormonal', icon: '💉', examples: ['Birth Control Pills', 'Thyroid Medications'], description: 'Hormone regulation and contraception' }
    ];
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    console.error('Categories Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
});

router.get('/openfda', async (req, res) => {
  try {
    const q = (req.query.q || req.query.query || '').trim();
    if (!q) return res.status(400).json({ success: false, message: 'Query parameter q is required' });
    const result = await searchDrugDetails(q);
    if (result.ok) return res.status(200).json({ success: true, data: result.data });
    const dummy = buildDummyDetails(q);
    return res.status(200).json({ success: true, data: dummy, source: 'dummy' });
  } catch (error) {
    console.error('OpenFDA Search Error:', error.message);
    const q = (req.query?.q || req.query?.query || 'Sample Medicine').trim();
    const dummy = buildDummyDetails(q);
    res.status(200).json({ success: true, data: dummy, source: 'dummy' });
  }
});

router.get('/openfda/health', async (req, res) => {
  res.status(200).json({ success: true, service: 'OpenFDA', apiKeyConfigured: Boolean(OPENFDA_API_KEY), docs: 'https://open.fda.gov/apis/drug/', endpoints: { details: '/api/medicine-search/openfda?q=<query>', events: '/api/medicine-search/openfda/events?q=<query>' } });
});

router.get('/openfda/events', async (req, res) => {
  try {
    const q = (req.query.q || req.query.query || '').trim();
    if (!q) return res.status(400).json({ success: false, message: 'Query parameter q is required' });
    const result = await searchDrugEvents(q);
    if (result.ok) return res.status(200).json({ success: true, data: result.data });
    const dummy = buildDummyEvents(q);
    return res.status(200).json({ success: true, data: dummy, source: 'dummy' });
  } catch (error) {
    console.error('OpenFDA Events Error:', error.message);
    const q = (req.query?.q || req.query?.query || 'Sample Medicine').trim();
    const dummy = buildDummyEvents(q);
    res.status(200).json({ success: true, data: dummy, source: 'dummy' });
  }
});

function buildDummyDetails(q) {
  const name = (q || 'Sample Medicine').trim();
  return {
    query: name,
    names: { brand: [name.toUpperCase()], generic: [name] },
    regulatory: { prescriptionRequired: false, marketingCategory: 'OTC MONOGRAPH NOT FINAL', applicationNumber: null, sponsorName: 'Demo Pharma Inc.', productType: 'HUMAN OTC DRUG' },
    composition: { activeIngredients: [{ name: 'Acetaminophen', strength: '500 mg/1' }, { name: 'Caffeine', strength: '65 mg/1' }], activeIngredientLabel: 'Acetaminophen 500 mg; Caffeine 65 mg', route: ['ORAL'], dosageForm: 'TABLET' },
    label: { indications_and_usage: 'Temporarily relieves minor aches and pains due to headache, cold, and flu. Reduces fever.', dosage_and_administration: 'Adults: take 1–2 tablets every 6 hours as needed. Do not exceed 8 tablets in 24 hours.', warnings: 'Liver warning: This product contains acetaminophen. Severe liver damage may occur if you take more than 4000 mg in 24 hours.', boxed_warning: undefined, adverse_reactions: 'Common: nausea, dizziness, nervousness (from caffeine).', contraindications: 'Severe liver disease, known hypersensitivity to components.', drug_interactions: 'Avoid with other acetaminophen-containing products. Limit caffeine intake from other sources.', clinical_pharmacology: 'Acetaminophen is an analgesic and antipyretic. Caffeine is a CNS stimulant.', pregnancy: 'Consult a healthcare professional before use during pregnancy.', nursing_mothers: 'Caffeine is excreted in breast milk; use with caution.', storage_and_handling: 'Store at 20°–25°C (68°–77°F). Keep tightly closed.' },
    meta: { sources: { label: 'dummy', ndc: 'dummy', drugsfda: 'dummy' } },
    summary: 'Uses: Temporarily relieves minor aches and pains.\n\nWarning: Contains acetaminophen. Do not exceed recommended dose.'
  };
}

function buildDummyEvents(q) {
  const name = (q || 'Sample Medicine').trim();
  return { query: name, reactions: [{ term: 'HEADACHE', count: 142 }, { term: 'NAUSEA', count: 96 }, { term: 'DIZZINESS', count: 73 }, { term: 'INSOMNIA', count: 31 }], recent: [{ safetyReportId: 'DUMMY-001', received: '2025-10-21', reactions: ['NAUSEA'], seriousness: { death: false, hospitalization: false, lifeThreatening: false } }, { safetyReportId: 'DUMMY-002', received: '2025-09-30', reactions: ['DIZZINESS', 'HEADACHE'], seriousness: { death: false, hospitalization: false, lifeThreatening: false } }] };
}

export default router;
