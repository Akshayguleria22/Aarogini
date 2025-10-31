import React, { useState, useEffect } from 'react'
import { uploadReport, getUserReports, compareReports } from '../../services/reportService'

const ReportAnalyzer = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('upload')
  const [reports, setReports] = useState([])
  const [selectedReport, setSelectedReport] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [uploadedFile, setUploadedFile] = useState(null)

  // Load reports on mount
  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      setLoading(true)
      const response = await getUserReports()
      if (response.success) {
        setReports(response.data || [])
      }
    } catch (err) {
      console.error('Failed to load reports:', err)
      setError('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only PDF, JPG, and PNG files are allowed.')
      return
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit.')
      return
    }

    setUploadedFile(file)
    setIsUploading(true)
    setIsAnalyzing(true)
    setUploadProgress(0)
    setError(null)

    try {
      console.log('Starting file upload:', file.name, file.type, file.size);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 300)

      // Upload and analyze report
      const response = await uploadReport(file)
      
      console.log('Upload response:', response);
      
      clearInterval(progressInterval)
      setUploadProgress(100)

      if (response.success) {
        // Add new report to list
        const newReport = transformReportData(response.data)
        setReports(prev => [newReport, ...prev])
        setSelectedReport(newReport)
        setActiveTab('analysis')
        
        setTimeout(() => {
          setIsUploading(false)
          setIsAnalyzing(false)
          setUploadedFile(null)
        }, 500)
      } else {
        throw new Error(response.message || 'Upload failed')
      }
    } catch (err) {
      console.error('Upload failed:', err)
      
      // Extract meaningful error message
      let errorMessage = 'Failed to upload and analyze report'
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      setIsUploading(false)
      setIsAnalyzing(false)
      setUploadedFile(null)
      setUploadProgress(0)
    }
  }

  const transformReportData = (apiData) => {
    const analysis = apiData.analysis || {}
    const tests = analysis.tests || []
    
    // Transform tests array into findings object
    const findings = {}
    tests.forEach(test => {
      const key = test.test_name?.toLowerCase().replace(/\s+/g, '_') || 'unknown'
      findings[key] = {
        value: parseFloat(test.value) || test.value,
        unit: test.unit || '',
        range: test.reference_range || '',
        status: test.status?.toLowerCase() || 'unknown'
      }
    })

    return {
      id: apiData.database_id || apiData.report_id,
      name: apiData.analysis?.patient_info?.name || 'Medical Report',
      date: apiData.upload_date ? new Date(apiData.upload_date).toLocaleDateString() : new Date().toLocaleDateString(),
      type: apiData.category?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'General',
      status: 'reviewed',
      findings: findings,
      recommendations: [
        ...(analysis.tracking_recommendations || []),
        ...(apiData.who_insights?.recommendations || [])
      ],
      rawData: apiData, // Store full API response
      abnormalFindings: analysis.abnormal_findings || [],
      healthConcerns: analysis.health_concerns || [],
      whoComparison: apiData.who_comparison || null,
      periodCorrelation: apiData.period_correlation || null,
      comparison: apiData.comparison || null
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'normal': return 'text-green-600 bg-green-100'
      case 'low': return 'text-orange-600 bg-orange-100'
      case 'high': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status) => {
    switch(status) {
      case 'normal': return '✓'
      case 'low': return '↓'
      case 'high': return '↑'
      default: return '•'
    }
  }

  const renderUploadTab = () => (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">Error</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">×</button>
        </div>
      )}

      {/* Upload Area */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-8 border-2 border-dashed border-purple-300">
        <div className="text-center space-y-4">
          <div className="text-6xl">📄</div>
          <h3 className="text-lg font-bold text-gray-800">Upload Medical Report</h3>
          <p className="text-sm text-gray-600">
            AI-powered analysis with WHO guidelines comparison
          </p>
          <p className="text-xs text-gray-500">Supported formats: PDF, JPG, PNG (Max 10MB)</p>
          
          {uploadedFile && (
            <div className="bg-white rounded-lg p-3 inline-flex items-center space-x-2">
              <span className="text-2xl">📎</span>
              <span className="text-sm font-medium text-gray-700">{uploadedFile.name}</span>
            </div>
          )}
          
          <label className="inline-block">
            <input
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            <span className={`px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold cursor-pointer hover:shadow-lg transition-all duration-300 inline-block ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {isUploading ? 'Analyzing...' : 'Choose File'}
            </span>
          </label>

          {isUploading && (
            <div className="mt-4 space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">
                {isAnalyzing ? `🤖 AI is analyzing your report... ${uploadProgress}%` : `Uploading... ${uploadProgress}%`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Reports</p>
              <p className="text-2xl font-bold text-green-700">{reports.length}</p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">This Month</p>
              <p className="text-2xl font-bold text-blue-700">2</p>
            </div>
            <div className="text-3xl">📅</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">All Normal</p>
              <p className="text-2xl font-bold text-purple-700">85%</p>
            </div>
            <div className="text-3xl">✨</div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderReportsTab = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-3">
            <div className="text-5xl animate-pulse">📊</div>
            <p className="text-sm text-gray-600">Loading your reports...</p>
          </div>
        </div>
      )
    }

    if (reports.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-lg font-medium">No reports yet</p>
          <p className="text-sm mt-2">Upload your first medical report to get started</p>
          <button
            onClick={() => setActiveTab('upload')}
            className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Upload Report
          </button>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">Your Medical Reports ({reports.length})</h3>
          <select className="px-4 py-2 border border-purple-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400">
            <option>All Reports</option>
            <option>Blood Test</option>
            <option>Ultrasound</option>
            <option>Hormone Test</option>
            <option>Other</option>
          </select>
        </div>

        <div className="grid gap-3">
          {reports.map((report) => (
          <div
            key={report.id}
            onClick={() => setSelectedReport(report)}
            className="bg-white rounded-xl p-4 border border-gray-200 hover:border-purple-400 hover:shadow-lg transition-all duration-300 cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  📋
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800 group-hover:text-purple-600 transition-colors">
                    {report.name}
                  </h4>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className="text-xs text-gray-500">📅 {report.date}</span>
                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                      {report.type}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="flex items-center space-x-1">
                      {Object.values(report.findings).filter(f => f.status === 'normal').length > 0 && (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                          {Object.values(report.findings).filter(f => f.status === 'normal').length} Normal
                        </span>
                      )}
                      {Object.values(report.findings).filter(f => f.status === 'low' || f.status === 'high').length > 0 && (
                        <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">
                          {Object.values(report.findings).filter(f => f.status === 'low' || f.status === 'high').length} Attention
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <button className="px-3 py-1 text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors">
                View →
              </button>
            </div>
          </div>
        ))}
        </div>
      </div>
    )
  }

  const renderAnalysisTab = () => {
    if (!selectedReport) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-gray-400">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-lg font-medium">Select a report to view analysis</p>
          <p className="text-sm mt-2">Go to Reports tab and click on any report</p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Report Header */}
        <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-800">{selectedReport.name}</h3>
              <p className="text-sm text-gray-600 mt-1">📅 {selectedReport.date} • {selectedReport.type}</p>
            </div>
            <button
              onClick={() => setSelectedReport(null)}
              className="px-4 py-2 bg-white rounded-lg text-sm font-semibold text-purple-600 hover:bg-purple-50 transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <h4 className="font-bold text-gray-800 mb-4 flex items-center space-x-2">
            <span>🔬</span>
            <span>Test Results</span>
          </h4>
          <div className="space-y-3">
            {Object.entries(selectedReport.findings).map(([key, data]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 text-sm uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Normal Range: {data.range} {data.unit}</p>
                </div>
                <div className="text-right mr-4">
                  <p className="text-lg font-bold text-gray-800">{data.value}</p>
                  <p className="text-xs text-gray-500">{data.unit}</p>
                </div>
                <div className={`px-3 py-1 rounded-full font-semibold text-xs ${getStatusColor(data.status)} flex items-center space-x-1`}>
                  <span>{getStatusIcon(data.status)}</span>
                  <span className="uppercase">{data.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Visual Analysis */}
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <h4 className="font-bold text-gray-800 mb-4 flex items-center space-x-2">
            <span>📈</span>
            <span>Visual Analysis</span>
          </h4>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(selectedReport.findings).map(([key, data]) => {
              const [min, max] = data.range.split('-').map(Number)
              const percentage = ((data.value - min) / (max - min)) * 100
              const clampedPercentage = Math.max(0, Math.min(100, percentage))
              
              return (
                <div key={key} className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-semibold text-gray-700 mb-2 uppercase">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div className="absolute inset-0 flex">
                      <div className="flex-1 bg-gradient-to-r from-green-400 to-green-500"></div>
                    </div>
                    <div
                      className="absolute top-0 left-0 h-full w-1 bg-gray-800 shadow-lg"
                      style={{ left: `${clampedPercentage}%`, transform: 'translateX(-50%)' }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                    <span>{min}</span>
                    <span className="font-semibold text-gray-800">{data.value}</span>
                    <span>{max}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Abnormal Findings */}
        {selectedReport.abnormalFindings && selectedReport.abnormalFindings.length > 0 && (
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-5 border border-orange-200">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center space-x-2">
              <span>⚠️</span>
              <span>Abnormal Findings</span>
            </h4>
            <div className="space-y-2">
              {selectedReport.abnormalFindings.map((finding, index) => (
                <div key={index} className="bg-white rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 text-sm">{finding.test}</p>
                      <p className="text-xs text-gray-600 mt-1">{finding.concern}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      finding.severity === 'severe' ? 'bg-red-100 text-red-700' :
                      finding.severity === 'moderate' ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {finding.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WHO Comparison */}
        {selectedReport.whoComparison && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center space-x-2">
              <span>🌍</span>
              <span>WHO Guidelines Comparison</span>
            </h4>
            <div className="space-y-2">
              {selectedReport.whoComparison.comparisons?.map((comp, index) => (
                <div key={index} className="bg-white rounded-lg p-3 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 text-sm">{comp.parameter}</p>
                    <p className="text-xs text-gray-600">WHO: {comp.who_guideline}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-gray-800">{comp.value}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      comp.status === 'within' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {comp.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Recommendations */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-200">
          <h4 className="font-bold text-gray-800 mb-4 flex items-center space-x-2">
            <span>🤖</span>
            <span>AI-Powered Recommendations</span>
          </h4>
          <div className="space-y-2">
            {selectedReport.recommendations && selectedReport.recommendations.length > 0 ? (
              selectedReport.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg">
                  <span className="text-blue-500 font-bold text-sm">{index + 1}.</span>
                  <p className="text-sm text-gray-700 flex-1">{rec}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-600 text-center py-4">No specific recommendations at this time.</p>
            )}
          </div>
        </div>

        {/* Period Correlation (if available) */}
        {selectedReport.periodCorrelation?.has_correlation && (
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-5 border border-pink-200">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center space-x-2">
              <span>🩸</span>
              <span>Period Cycle Correlation</span>
            </h4>
            <div className="space-y-2">
              {selectedReport.periodCorrelation.correlation?.correlations_found?.map((corr, index) => (
                <div key={index} className="bg-white rounded-lg p-3">
                  <p className="font-semibold text-gray-800 text-sm">{corr.finding}</p>
                  <p className="text-xs text-gray-600 mt-1">{corr.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300">
            📥 Download Report
          </button>
          <button className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300">
            📧 Share with Doctor
          </button>
        </div>
      </div>
    )
  }

  const renderInsightsTab = () => (
    <div className="space-y-6">
      {/* Health Score */}
      <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
          <span>💚</span>
          <span>Overall Health Score</span>
        </h3>
        <div className="flex items-center justify-center">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="#e5e7eb"
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="url(#gradient)"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${85 * 4.4} 440`}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-green-700">85</span>
              <span className="text-sm text-gray-600">out of 100</span>
            </div>
          </div>
        </div>
        <p className="text-center text-sm text-gray-600 mt-4">
          Your health metrics are looking great! Keep up the good work.
        </p>
      </div>

      {/* Trends */}
      <div className="bg-white rounded-xl p-5 border border-gray-200">
        <h4 className="font-bold text-gray-800 mb-4 flex items-center space-x-2">
          <span>📊</span>
          <span>Health Trends (Last 3 Months)</span>
        </h4>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Hemoglobin Levels</span>
              <span className="text-xs text-green-600 font-semibold">↑ Improving</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-400 to-green-500 w-4/5"></div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Iron Levels</span>
              <span className="text-xs text-orange-600 font-semibold">→ Stable (Low)</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500 w-2/5"></div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Thyroid Function</span>
              <span className="text-xs text-green-600 font-semibold">✓ Optimal</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-400 to-green-500 w-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Tests */}
      <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-5">
        <h4 className="font-bold text-gray-800 mb-4 flex items-center space-x-2">
          <span>📅</span>
          <span>Recommended Tests</span>
        </h4>
        <div className="space-y-2">
          <div className="bg-white rounded-lg p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">Iron Panel</p>
              <p className="text-xs text-gray-500">Due to low iron levels</p>
            </div>
            <span className="text-xs px-3 py-1 bg-orange-100 text-orange-700 rounded-full font-medium">
              Recommended
            </span>
          </div>
          
          <div className="bg-white rounded-lg p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">Complete Blood Count</p>
              <p className="text-xs text-gray-500">Regular checkup</p>
            </div>
            <span className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
              Routine
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-6xl h-[90vh] bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center space-x-2">
                <span>📊</span>
                <span>Medical Report Analyzer</span>
              </h2>
              <p className="text-sm text-purple-100 mt-1">Track, analyze, and understand your health reports</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-300 hover:rotate-90"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 px-5">
          <div className="flex space-x-1">
            {['upload', 'reports', 'analysis', 'insights'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-semibold capitalize transition-all duration-300 ${
                  activeTab === tab
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'upload' && '📤 '}
                {tab === 'reports' && '📋 '}
                {tab === 'analysis' && '🔬 '}
                {tab === 'insights' && '💡 '}
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'upload' && renderUploadTab()}
          {activeTab === 'reports' && renderReportsTab()}
          {activeTab === 'analysis' && renderAnalysisTab()}
          {activeTab === 'insights' && renderInsightsTab()}
        </div>
      </div>
    </div>
  )
}

export default ReportAnalyzer
