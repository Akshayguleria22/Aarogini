import React, { useState, useEffect } from 'react'
import { uploadReport, getUserReports, deleteReport, downloadReport } from '../../services/reportService'
import { getHealthInsights } from '../../services/chatService'

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
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [insightsText, setInsightsText] = useState('')
  // Prescription toggle + data
  const [showPrescription, setShowPrescription] = useState(false)
  const [prescriptions, setPrescriptions] = useState([])
  const [rxVersion, setRxVersion] = useState(0)

  // Helper: identify metadata fields that shouldn't be treated as tests
  const isMetaField = (name = '', value = '') => {
    const n = String(name || '').toLowerCase().trim()
    const v = String(value ?? '').toLowerCase().trim()

    // Common metadata keywords
    const nameKeywords = [
      'age', 'gender', 'sex', 'country', 'city', 'state', 'address', 'phone', 'mobile', 'email',
      'patient', 'patient name', 'patient id', 'uhid', 'mrn', 'opd', 'ipd', 'lab no', 'lab number',
      'sample id', 'sample', 'specimen', 'barcode',
      'collected', 'collected on', 'collection', 'collection date', 'received', 'received on',
      'report date', 'reported on', 'reporting date', 'issued on',
      'doctor', 'referral', 'referred', 'consultant', 'physician', 'technician',
      'hospital', 'clinic', 'centre', 'center', 'department', 'ward', 'bed',
      'order id', 'invoice', 'bill', 'payment', 'due'
    ]

    // If the field name contains any obvious meta keywords
    if (nameKeywords.some(k => n.includes(k))) return true
    if (/\b(id|uhid|mrn|order|invoice|bill|lab\s*no\.?|patient)\b/i.test(n)) return true

    // Value-based heuristics: dates, times, gender, phone-like numbers
    const dateRegex1 = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/ // 12/01/2024, 12-01-24
    const dateRegex2 = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/ // 2024-01-12
    const monthRegex = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\b/i
    const timeRegex = /\b\d{1,2}:\d{2}(:\d{2})?\b/
    const phoneRegex = /(\+?\d{1,3}[-\s]?)?\d{10,}/

    if (v && (dateRegex1.test(v) || dateRegex2.test(v) || monthRegex.test(v) || timeRegex.test(v))) return true
    if (['male', 'female', 'other', 'm', 'f'].includes(v)) return true
    if (v && phoneRegex.test(v)) return true

    return false
  }

  // Load reports on mount
  const loadReports = async () => {
    try {
      setLoading(true)
      const response = await getUserReports()
      if (response.success) {
        const docs = response.data || []
        const mapped = docs.map((doc) => {
          const tests = doc.analysis?.tests || []
          const findings = {}
          tests.forEach((t) => {
            if (isMetaField(t.test_name, t.value)) return
            const key = (t.test_name || 'unknown').toLowerCase().replace(/\s+/g, '_')
            findings[key] = {
              value: parseFloat(t.value) || t.value,
              unit: t.unit || '',
              range: t.reference_range || '',
              status: (t.status || 'unknown').toLowerCase()
            }
          })
          return {
            id: doc._id,
            name: doc.reportName || 'Medical Report',
            date: doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString() : new Date().toLocaleDateString(),
            type: doc.reportType || 'General',
            status: 'reviewed',
            findings,
            recommendations: doc.analysis?.tracking_recommendations || [],
            rawData: { analysis: doc.analysis, comparison: doc.comparison, whoGuidelines: doc.whoGuidelines, extractedText: doc.extractedText },
            abnormalFindings: doc.analysis?.abnormal_findings || [],
            healthConcerns: doc.analysis?.health_concerns || [],
            whoComparison: null,
            periodCorrelation: null,
            comparison: doc.comparison || null,
            mlPredictions: doc.mlPredictions || [],
          }
        })
        setReports(mapped)
      }
    } catch (err) {
      console.error('Failed to load reports:', err)
      setError('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])



  // loadReports moved above and memoized

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
    const mlPreds = apiData.mlPredictions || []
    
    // Transform tests array into findings object
    const findings = {}
    tests.forEach(test => {
      if (isMetaField(test.test_name, test.value)) return
      const key = test.test_name?.toLowerCase().replace(/\s+/g, '_') || 'unknown'
      findings[key] = {
        value: parseFloat(test.value) || test.value,
        unit: test.unit || '',
        range: test.reference_range || '',
        status: test.status?.toLowerCase() || 'unknown'
      }
    })

    return {
      id: apiData.reportId || apiData.database_id || apiData.report_id,
      name: analysis?.patient_info?.name || 'Medical Report',
      date: new Date().toLocaleDateString(),
      type: (apiData.reportType || 'General').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
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
      comparison: apiData.comparison || null,
      mlPredictions: mlPreds,
    }
  }

  // --- Demo Prescription Generator (UI-only, not medical advice) ---
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
  const choice = (arr) => arr[Math.floor(Math.random() * arr.length)]

  const generatePrescription = (report) => {
    const rx = []
    const f = report?.findings || {}
    const abnormal = (report?.abnormalFindings || []).map(a => (a.test || '').toLowerCase())

    const isLow = (key) => (f[key]?.status === 'low')
    const isHigh = (key) => (f[key]?.status === 'high')
    const hasTest = (name) => Object.keys(f).some(k => k.includes(name)) || abnormal.some(t => t.includes(name))

    // Anemia / Low Hb
    if (hasTest('hemoglobin') && isLow('hemoglobin')) {
      rx.push({
        category: 'Anemia',
        drug: choice(['Tab. Iron Folic Acid', 'Tab. Ferrous Ascorbate', 'Cap. Iron + Folic Acid']),
        dose: choice(['60 mg Fe + 400 mcg FA', '100 mg Fe + 1 mg FA']),
        frequency: choice(['OD after lunch', 'OD after dinner']),
        duration: `${rand(21, 45)} days`,
        notes: 'Take with water or orange juice. Avoid tea/coffee within 1 hour. Recheck Hb later.'
      })
      rx.push({
        category: 'Supplement',
        drug: 'Tab. Vitamin C',
        dose: '500 mg',
        frequency: 'OD',
        duration: `${rand(21, 45)} days`,
        notes: 'Improves iron absorption.'
      })
    }

    // Thyroid
    if (hasTest('tsh') && (isHigh('tsh') || isLow('tsh'))) {
      rx.push({
        category: 'Thyroid',
        drug: 'Tab. Levothyroxine',
        dose: choice(['25 mcg', '50 mcg', '75 mcg']),
        frequency: 'OD empty stomach (morning)',
        duration: `${rand(28, 56)} days`,
        notes: 'Take 30 min before breakfast; keep consistent. Recheck TSH as advised.'
      })
    }

    // Glucose / HbA1c
    if ((hasTest('glucose') && (isHigh('glucose') || isHigh('fasting_glucose'))) || hasTest('hba1c')) {
      rx.push({
        category: 'Glycemic Control',
        drug: 'Tab. Metformin',
        dose: choice(['500 mg', '500 mg SR']),
        frequency: choice(['BD after meals', 'OD with dinner']),
        duration: `${rand(28, 56)} days`,
        notes: 'Monitor sugars regularly. Watch for GI upset initially.'
      })
    }

    // Blood Pressure
    if (hasTest('bp') || hasTest('blood_pressure')) {
      rx.push({
        category: 'Blood Pressure',
        drug: choice(['Tab. Amlodipine', 'Tab. Telmisartan']),
        dose: choice(['5 mg', '40 mg']),
        frequency: 'OD',
        duration: `${rand(28, 56)} days`,
        notes: 'Maintain BP log; low-salt diet; follow up for titration.'
      })
    }

    // Inflammatory / Infection markers
    if (hasTest('wbc') || hasTest('crp')) {
      rx.push({
        category: 'Symptomatic Relief',
        drug: 'Tab. Paracetamol',
        dose: '650 mg',
        frequency: 'SOS (max TDS)',
        duration: `${rand(3, 7)} days`,
        notes: 'Hydration and rest. Seek evaluation if persistent/worsening.'
      })
    }

    // Vitamin D
    if (hasTest('vitamin_d') || hasTest('25(oh)d')) {
      rx.push({
        category: 'Supplement',
        drug: 'Cap. Cholecalciferol',
        dose: '60,000 IU',
        frequency: 'Once weekly',
        duration: `${choice(['4 weeks', '8 weeks'])}`,
        notes: 'Take after a meal. Sunlight exposure as feasible.'
      })
    }

    // Default supportive set if none added
    if (rx.length === 0) {
      rx.push(
        {
          category: 'Wellness',
          drug: 'Tab. Multivitamin',
          dose: '—',
          frequency: 'OD',
          duration: `${rand(21, 30)} days`,
          notes: 'Balanced diet, exercise, sleep hygiene.'
        },
        {
          category: 'Supplement',
          drug: 'Cap. Vitamin D3',
          dose: '60,000 IU',
          frequency: 'Once weekly',
          duration: '4 weeks',
          notes: 'Consult physician for continuation.'
        }
      )
    }

    // Shuffle lightly for variety
    return rx.sort(() => Math.random() - 0.5).slice(0, rand(2, Math.min(4, rx.length)))
  }

  // Targeted generator for a single test key
  const generatePrescriptionForKey = (key, data) => {
    const k = String(key || '').toLowerCase()
    const out = []
    const push = (obj) => out.push(obj)

    if (k.includes('hemoglobin') && (data.status === 'low')) {
      push({ category: 'Anemia', drug: choice(['Tab. Iron Folic Acid', 'Tab. Ferrous Ascorbate']), dose: choice(['60 mg Fe + 400 mcg FA', '100 mg Fe + 1 mg FA']), frequency: 'OD after meals', duration: `${rand(21, 45)} days`, notes: 'Avoid tea/coffee near dose; recheck Hb later.' })
    }
    if (k.includes('tsh')) {
      push({ category: 'Thyroid', drug: 'Tab. Levothyroxine', dose: choice(['25 mcg', '50 mcg']), frequency: 'OD empty stomach (morning)', duration: `${rand(28, 56)} days`, notes: 'Take 30 min before breakfast.' })
    }
    if (k.includes('glucose') || k.includes('hba1c')) {
      push({ category: 'Glycemic Control', drug: 'Tab. Metformin', dose: choice(['500 mg', '500 mg SR']), frequency: 'OD with dinner', duration: `${rand(28, 56)} days`, notes: 'Monitor sugars; watch GI tolerance.' })
    }
    if (k.includes('bp') || k.includes('blood_pressure')) {
      push({ category: 'Blood Pressure', drug: choice(['Tab. Amlodipine', 'Tab. Telmisartan']), dose: choice(['5 mg', '40 mg']), frequency: 'OD', duration: `${rand(28, 56)} days`, notes: 'Low-salt diet; follow up for titration.' })
    }
    if (k.includes('wbc') || k.includes('crp')) {
      push({ category: 'Symptomatic Relief', drug: 'Tab. Paracetamol', dose: '650 mg', frequency: 'SOS (max TDS)', duration: `${rand(3, 7)} days`, notes: 'Hydration and rest.' })
    }
    if (k.includes('vitamin_d') || k.includes('25(oh)d') || k.includes('vitamin d')) {
      push({ category: 'Supplement', drug: 'Cap. Cholecalciferol', dose: '60,000 IU', frequency: 'Once weekly', duration: `${choice(['4 weeks', '8 weeks'])}`, notes: 'Take after a meal.' })
    }

    if (out.length === 0) {
      push({ category: 'Wellness', drug: 'Tab. Multivitamin', dose: '—', frequency: 'OD', duration: `${rand(21, 30)} days`, notes: 'Balanced diet, exercise, sleep hygiene.' })
    }
    return out
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
      <div className="bg-linear-to-br from-purple-50 to-pink-50 rounded-xl p-8 border-2 border-dashed border-purple-300">
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
            <span className={`px-6 py-3 bg-linear-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold cursor-pointer hover:shadow-lg transition-all duration-300 inline-block ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {isUploading ? 'Analyzing...' : 'Choose File'}
            </span>
          </label>

          {isUploading && (
            <div className="mt-4 space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-linear-to-r from-purple-500 to-pink-500 transition-all duration-300"
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
        <div className="bg-linear-to-br from-green-100 to-emerald-100 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Reports</p>
              <p className="text-2xl font-bold text-green-700">{reports.length}</p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>
        
        <div className="bg-linear-to-br from-blue-100 to-cyan-100 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">This Month</p>
              <p className="text-2xl font-bold text-blue-700">2</p>
            </div>
            <div className="text-3xl">📅</div>
          </div>
        </div>
        
        <div className="bg-linear-to-br from-purple-100 to-pink-100 rounded-xl p-4">
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
            className="mt-4 px-6 py-2 bg-linear-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
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
              onClick={() => { setSelectedReport(report); setActiveTab('analysis'); }}
            className="bg-white rounded-xl p-4 border border-gray-200 hover:border-purple-400 hover:shadow-lg transition-all duration-300 cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                  <div className="w-12 h-12 bg-linear-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
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
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-1 text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors">
                    View →
                  </button>
                  <button
                    title="Delete report"
                    onClick={async (e) => {
                      e.stopPropagation()
                      if (!confirm('Delete this report? This action cannot be undone.')) return
                      try {
                        await deleteReport(report.id)
                        setReports(prev => prev.filter(r => r.id !== report.id))
                        if (selectedReport?.id === report.id) {
                          setSelectedReport(null)
                        }
                      } catch (err) {
                        console.error('Delete failed', err)
                        alert('Failed to delete report')
                      }
                    }}
                    className="px-2 py-1 text-xs font-semibold text-red-600 hover:text-red-800"
                  >
                    🗑️
                  </button>
                </div>
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
        <div className="bg-linear-to-br from-purple-100 to-pink-100 rounded-xl p-5">
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

        {/* Patient Details */}
        {selectedReport.rawData?.analysis?.patient_info && (
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center space-x-2">
              <span>🧑‍⚕️</span>
              <span>Patient Details</span>
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {Object.entries(selectedReport.rawData.analysis.patient_info).map(([k, v]) => (
                v ? (
                  <div key={k} className="bg-gray-50 rounded p-3">
                    <p className="text-gray-500 capitalize">{k.replace(/_/g, ' ')}</p>
                    <p className="font-semibold text-gray-800">{String(v)}</p>
                  </div>
                ) : null
              ))}
            </div>
          </div>
        )}

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
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full font-semibold text-xs ${getStatusColor(data.status)} flex items-center space-x-1`}>
                    <span>{getStatusIcon(data.status)}</span>
                    <span className="uppercase">{data.status}</span>
                  </div>
                  {/* Per-test Rx demo switch */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-600">Rx</span>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          const on = e.target.checked
                          if (on) {
                            const items = generatePrescriptionForKey(key, data)
                            if (items.length) {
                              setPrescriptions(prev => [...items, ...prev])
                              setShowPrescription(true)
                              setRxVersion(v => v + 1)
                            }
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="relative w-8 h-4 bg-gray-200 rounded-full peer-checked:bg-green-400 transition-colors">
                        <span className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Model-specific details */}
        {selectedReport.mlPredictions && selectedReport.mlPredictions.length > 0 && (
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center space-x-2">
              <span>🔎</span>
              <span>Model Details</span>
            </h4>
            <div className="space-y-3">
              {selectedReport.mlPredictions.map((p, idx) => {
                const featureEntries = Object.entries(p.features || {}).filter(([, v]) => v !== undefined)
                return (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-800 capitalize">{p.model.replace(/_/g, ' ')}</p>
                      <p className="text-sm"><span className="text-gray-500">Prediction:</span> <span className="font-bold text-gray-800">{String(p.prediction)}</span></p>
                    </div>
                    {featureEntries.length > 0 && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {featureEntries.map(([k, v]) => {
                          const key = k.toLowerCase().replace(/\s+/g, '_')
                          const fromFinding = selectedReport.findings[key]
                          return (
                            <div key={k} className="text-xs bg-white rounded border border-gray-200 p-2">
                              <p className="font-semibold text-gray-700">{k}</p>
                              <p className="text-gray-600">Value: {String(v)}{fromFinding?.unit ? ` ${fromFinding.unit}` : ''}</p>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Quick Trackers (chips) */}
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <h4 className="font-bold text-gray-800 mb-3 flex items-center space-x-2">
            <span>🎯</span>
            <span>Quick Trackers</span>
          </h4>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {Object.entries(selectedReport.findings).map(([key, data]) => (
              <div key={`chip-${key}`} className={`shrink-0 px-3 py-1 rounded-full border text-xs font-semibold ${getStatusColor(data.status)}`}>
                <span className="uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span className="ml-2 text-gray-700">{data.value} {data.unit}</span>
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
              // Parse reference range numbers robustly (e.g., "12 - 16 g/dL")
              const nums = String(data.range || '')
                .replace(/[,]/g, ' ')
                .match(/-?\d*\.?\d+/g) || []
              const min = Number(nums[0])
              const max = Number(nums[1])
              const val = Number(data.value)
              const hasRange = Number.isFinite(min) && Number.isFinite(max) && max > min
              const percentage = hasRange && Number.isFinite(val) ? ((val - min) / (max - min)) * 100 : null
              const clamped = percentage !== null ? Math.max(0, Math.min(100, percentage)) : null
              return (
                <div key={key} className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-semibold text-gray-700 mb-2 uppercase">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  {hasRange && clamped !== null ? (
                    <>
                      <div className="relative w-full h-3 rounded-full overflow-hidden" style={{ background: 'linear-gradient(90deg, #f87171 0%, #34d399 50%, #f87171 100%)' }}>
                        <div
                          className={`absolute top-1/2 h-4 w-4 rounded-full border-2 border-white shadow -mt-2`}
                          style={{ left: `${clamped}%`, transform: 'translateX(-50%)', backgroundColor: data.status === 'normal' ? '#10b981' : (data.status === 'low' ? '#fb923c' : '#ef4444') }}
                          title={`${data.status.toUpperCase()} • ${data.value} ${data.unit}`}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                        <span>{min}</span>
                        <span className="font-semibold text-gray-800">{data.value} {data.unit}</span>
                        <span>{max}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1 text-[10px] text-gray-500">
                        <span className="text-red-500">Low</span>
                        <span className="text-green-600">Normal</span>
                        <span className="text-red-500">High</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Value</span>
                      <span className="font-semibold text-gray-800">{data.value} {data.unit}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Abnormal Findings */}
        {selectedReport.abnormalFindings && selectedReport.abnormalFindings.length > 0 && (
          <div className="bg-linear-to-br from-orange-50 to-red-50 rounded-xl p-5 border border-orange-200">
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

        {/* ML Predictions */}
        {selectedReport.mlPredictions && selectedReport.mlPredictions.length > 0 && (
          <div className="bg-linear-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-200">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center space-x-2">
              <span>🧠</span>
              <span>Model Predictions</span>
            </h4>
            <div className="space-y-2">
              {selectedReport.mlPredictions.map((p, idx) => (
                <div key={idx} className="bg-white rounded-lg p-3 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 text-sm capitalize">{p.model.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-600 mt-1">Features used: {Object.entries(p.features || {}).filter(([, v]) => v !== undefined).map(([k]) => k).join(', ') || 'n/a'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Prediction</p>
                    <p className="text-lg font-bold text-gray-800">{String(p.prediction)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WHO Comparison */}
        {selectedReport.whoComparison && (
          <div className="bg-linear-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
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
        <div className="bg-linear-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-gray-800 flex items-center space-x-2">
              <span>🤖</span>
              <span>AI-Powered Recommendations</span>
            </h4>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-600">Show Prescription (demo)</span>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPrescription}
                    onChange={(e) => {
                      const next = e.target.checked
                      setShowPrescription(next)
                      if (next) {
                        const rx = generatePrescription(selectedReport)
                        setPrescriptions(rx)
                        setRxVersion((v) => v + 1)
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="relative w-10 h-5 bg-gray-200 rounded-full peer-checked:bg-green-400 transition-colors">
                    <span className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></span>
                  </div>
                </label>
              </div>
              {showPrescription && (
                <button
                  className="px-3 py-1.5 text-xs bg-white rounded-md border border-blue-200 font-semibold text-blue-700 hover:bg-blue-50"
                  onClick={() => {
                    const rx = generatePrescription(selectedReport)
                    setPrescriptions(rx)
                    setRxVersion((v) => v + 1)
                  }}
                  title="Generate a different sample prescription"
                >
                  Regenerate
                </button>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <p className="text-xs uppercase text-gray-500">For You</p>
              {(selectedReport.recommendations && selectedReport.recommendations.length > 0) ? (
                selectedReport.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg">
                    <span className="text-blue-500 font-bold text-sm">{index + 1}.</span>
                    <p className="text-sm text-gray-700 flex-1">{rec}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600">No specific lifestyle recommendations.</p>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase text-gray-500">For Your Doctor</p>
              {(() => {
                const items = []
                  ; (selectedReport.abnormalFindings || []).forEach(f => {
                    items.push(`Review ${f.test}: ${f.value || ''} — ${f.concern}`)
                  })
                  ; (selectedReport.mlPredictions || []).forEach(p => {
                    if (p.model === 'pcos' && String(p.prediction) === '1') items.push('Evaluate for PCOS (consider ultrasound/hormonal panel)')
                    if (p.model === 'maternal_health_risk' && String(p.prediction).toLowerCase() !== 'low') items.push('Assess maternal risk factors (BP, BS, HR) and antenatal plan')
                  })
                if (items.length === 0) items.push('No physician-specific actions suggested based on this report.')
                return items.slice(0, 6).map((text, i) => (
                  <div key={`doc-${i}`} className="flex items-start space-x-3 p-3 bg-white rounded-lg">
                    <span className="text-blue-500 font-bold text-sm">{i + 1}.</span>
                    <p className="text-sm text-gray-700 flex-1">{text}</p>
                  </div>
                ))
              })()}
            </div>
          </div>

          {/* Sample Prescription (full width) */}
          {showPrescription && (
            <div className="mt-4 bg-white rounded-xl border border-blue-200 p-3 md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs uppercase text-gray-500">Sample Prescription • v{rxVersion}</p>
                <span className="text-[10px] text-gray-500">Auto-generated for demo only</span>
              </div>
              <div className="space-y-2">
                {prescriptions.map((rx, idx) => (
                  <div key={`rx-${idx}`} className="p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-800 text-sm">{rx.drug}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{rx.category}</span>
                    </div>
                    <p className="text-xs text-gray-700 mt-1">Dose: <span className="font-semibold">{rx.dose}</span></p>
                    <p className="text-xs text-gray-700">Frequency: <span className="font-semibold">{rx.frequency}</span> • Duration: <span className="font-semibold">{rx.duration}</span></p>
                    {rx.notes && <p className="text-[11px] text-gray-600 mt-1">Notes: {rx.notes}</p>}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-gray-500">Disclaimer: This is an auto-generated sample for UI demonstration. Not medical advice. Please consult your physician before taking any medication.</p>
            </div>
          )}
        </div>

        {/* Period Correlation (if available) */}
        {selectedReport.periodCorrelation?.has_correlation && (
          <div className="bg-linear-to-br from-pink-50 to-purple-50 rounded-xl p-5 border border-pink-200">
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
          <button
            onClick={async () => {
              try {
                await downloadReport(selectedReport.id)
              } catch (e) {
                alert(e?.message || 'Failed to download report')
              }
            }}
            className="flex-1 px-4 py-3 bg-linear-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
          >
            📥 Download Report
          </button>
          <button className="flex-1 px-4 py-3 bg-linear-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300">
            📧 Share with Doctor
          </button>
        </div>
      </div>
    )
  }

  useEffect(() => {
    const fetchInsights = async () => {
      if (activeTab !== 'insights') return
      setInsightsLoading(true)
      setInsightsText('')
      try {
        const res = await getHealthInsights()
        if (res.success) {
          setInsightsText(res.data)
        } else {
          setInsightsText('No insights available yet.')
        }
      } catch {
        setInsightsText('Failed to load insights.')
      } finally {
        setInsightsLoading(false)
      }
    }
    fetchInsights()
  }, [activeTab])

  const renderInsightsTab = () => (
    <div className="space-y-6">
      {/* Health Score */}
      <div className="bg-linear-to-br from-green-100 to-emerald-100 rounded-xl p-6">
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

      {/* AI Insights (from trained/local endpoint) */}
      <div className="bg-white rounded-xl p-5 border border-gray-200">
        <h4 className="font-bold text-gray-800 mb-2 flex items-center space-x-2">
          <span>💡</span>
          <span>Personalized Insights</span>
        </h4>
        {insightsLoading ? (
          <p className="text-sm text-gray-600">Loading insights…</p>
        ) : (
          <div className="text-sm text-gray-700 whitespace-pre-line">{insightsText || 'No insights available.'}</div>
        )}
      </div>

      {selectedReport && (
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <h4 className="font-bold text-gray-800 mb-2 flex items-center space-x-2">
            <span>🩺</span>
            <span>Report-specific Recommendations</span>
          </h4>
          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
            {(selectedReport.mlPredictions || []).map((p, idx) => {
              let text = ''
              if (p.model === 'pcos' && String(p.prediction) === '1') {
                text = 'PCOS risk indicated; consider consulting a gynecologist and tracking menstrual irregularities.'
              }
              if (p.model === 'maternal_health_risk' && String(p.prediction).toLowerCase() !== 'low') {
                text = 'Elevated maternal health risk; monitor BP, blood sugar, and follow up with your obstetrician.'
              }
              return text ? <li key={idx}>{text}</li> : null
            })}
            {selectedReport.rawData?.whoGuidelines?.slice(0, 3).map((g, i) => (
              <li key={`who-${i}`}>
                <span className="font-semibold">{g.title}:</span> {(g.recommendations || []).slice(0, 2).join('; ')}
              </li>
            ))}
            {(!selectedReport.mlPredictions || selectedReport.mlPredictions.length === 0) && (!selectedReport.rawData?.whoGuidelines || selectedReport.rawData.whoGuidelines.length === 0) && (
              <li>No specific recommendations for this report.</li>
            )}
          </ul>
        </div>
      )}

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
              <div className="h-full bg-linear-to-r from-green-400 to-green-500 w-4/5"></div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Iron Levels</span>
              <span className="text-xs text-orange-600 font-semibold">→ Stable (Low)</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-linear-to-r from-orange-400 to-orange-500 w-2/5"></div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Thyroid Function</span>
              <span className="text-xs text-green-600 font-semibold">✓ Optimal</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-linear-to-r from-green-400 to-green-500 w-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Tests */}
      <div className="bg-linear-to-br from-purple-100 to-pink-100 rounded-xl p-5">
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
      <div className="relative w-full max-w-6xl h-[90vh] bg-linear-to-br from-pink-50 to-purple-50 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="bg-linear-to-r from-purple-500 to-pink-500 p-5 text-white">
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
