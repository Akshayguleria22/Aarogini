import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  LinearProgress,
  Alert,
  AlertTitle,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Tab,
  Tabs,
} from '@mui/material'
import {
  CloudUpload,
  Assessment,
  TrendingUp,
  Warning,
  CheckCircle,
  Info,
  Restaurant,
  FitnessCenter,
  LocalHospital,
  ExpandMore,
  ShowChart,
} from '@mui/icons-material'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'
import { uploadReport, getUserReports } from '../../services/reportService'

const COLORS = {
  normal: '#4CAF50',
  warning: '#FF9800',
  critical: '#F44336',
  info: '#2196F3',
}

const buildFallbackInsights = (analysis = {}) => {
  const tests = analysis.tests || []
  const abnormal = analysis.abnormal_findings || []
  const riskScore = Math.min(100, (abnormal.length || 0) * 15)
  const urgencyLevel = abnormal.some((f) => f.severity === 'severe')
    ? 'high'
    : abnormal.some((f) => f.severity === 'moderate')
    ? 'medium'
    : 'low'

  const chartData = {
    categories: tests.map((t) => t.test_name || 'Test'),
    values: tests.map((t) => Number(t.value) || 0),
    status: tests.map((t) => {
      const s = String(t.status || '').toUpperCase()
      if (s === 'HIGH' || s === 'LOW') return 'warning'
      if (s === 'ABNORMAL') return 'critical'
      return 'normal'
    })
  }

  return {
    riskScore,
    urgencyLevel,
    conditions: [],
    abnormalFindings: abnormal.map((f) => ({
      test: f.test || 'Test',
      value: f.value || '—',
      normalRange: f.normalRange || '—',
      status: f.status === 'high' || f.status === 'low'
        ? f.status
        : (f.severity === 'severe' ? 'high' : 'low'),
      explanation: f.explanation || 'Outside expected range',
      concern: f.concern || 'Please review with your clinician'
    })),
    recommendations: (analysis.tracking_recommendations || []).map((r) => ({
      category: 'long-term',
      action: r,
      reason: ''
    })),
    dietPlan: null,
    lifestyle: null,
    followUp: null,
    healthUpdates: null,
    chartData,
    summary: analysis.summary || 'Report analysis completed.'
  }
}

const sanitizeInsights = (insights) => {
  if (!insights) return null
  return {
    ...insights,
    conditions: Array.isArray(insights.conditions) ? insights.conditions : [],
    abnormalFindings: Array.isArray(insights.abnormalFindings) ? insights.abnormalFindings : [],
    recommendations: Array.isArray(insights.recommendations) ? insights.recommendations : [],
    dietPlan: insights.dietPlan || { toEat: [], toAvoid: [], supplements: [] },
    lifestyle: insights.lifestyle || { exercise: [], sleep: '', stress: '', habits: [] },
    followUp: insights.followUp || { tests: [], timeline: '', doctorVisit: '', specialistNeeded: '' },
    chartData: insights.chartData || { categories: [], values: [], status: [] },
  }
}

const normalizeAnalysisResult = (data) => {
  if (!data) return null
  if (data.aiInsights) return sanitizeInsights(data.aiInsights)
  if (data.analysis) return buildFallbackInsights(data.analysis)
  if (data.riskScore !== undefined || data.chartData) return sanitizeInsights(data)
  return null
}

const ModernReportAnalyzer = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState(0)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [reports, setReports] = useState([])
  const [selectedReport, setSelectedReport] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [analysisError, setAnalysisError] = useState(null)

  useEffect(() => {
    if (selectedReport) {
      const normalized = normalizeAnalysisResult(selectedReport)
      setAnalysisResult(normalized)
    }
  }, [selectedReport])

  const loadReports = useCallback(async () => {
    try {
      const response = await getUserReports()
      if (response.success) {
        setReports(response.data || [])
        if (response.data && response.data.length > 0) {
          setSelectedReport(response.data[0])
          // Extract analysis from the report
          const normalized = normalizeAnalysisResult(response.data[0])
          setAnalysisResult(normalized)
        }
      }
    } catch (error) {
      console.error('Failed to load reports:', error)
      setAnalysisError('Failed to load reports')
    }
  }, [])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      setUploading(true)
      setAnalyzing(true)

      const response = await uploadReport(selectedFile)

      if (response.success) {
        const normalized = normalizeAnalysisResult(response.data)
        setAnalysisResult(normalized)
        await loadReports()
        setActiveTab(1) // Switch to results tab
        window.dispatchEvent(new CustomEvent('reportsUpdated'))
      }
    } catch (error) {
      console.error('Upload failed:', error)
      setAnalysisError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      setAnalyzing(false)
    }
  }

  const getRiskColor = (score) => {
    if (score < 30) return COLORS.normal
    if (score < 60) return COLORS.warning
    return COLORS.critical
  }

  const renderCharts = () => {
    if (!analysisResult || !analysisResult.chartData) return null

    const { chartData } = analysisResult
    if (!chartData.categories || chartData.categories.length === 0) return null

    const barData = chartData.categories.map((cat, idx) => ({
      name: cat,
      value: chartData.values[idx] || 0,
      status: chartData.status[idx] || 'normal',
    }))

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShowChart /> Test Results Overview
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <RechartsTooltip />
              <Bar dataKey="value" fill="#E91E63">
                {barData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.status === 'critical'
                        ? COLORS.critical
                        : entry.status === 'warning'
                        ? COLORS.warning
                        : COLORS.normal
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    )
  }

  const renderRiskScore = () => {
    if (!analysisResult || typeof analysisResult.riskScore === 'undefined') return null

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Overall Health Risk Assessment
          </Typography>
          <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
            <CircularProgress
              variant="determinate"
              value={analysisResult.riskScore}
              size={120}
              thickness={5}
              sx={{ color: getRiskColor(analysisResult.riskScore) }}
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="h4" component="div" color="text.secondary">
                {analysisResult.riskScore}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={analysisResult.urgencyLevel?.toUpperCase() || 'UNKNOWN'}
            color={
              analysisResult.urgencyLevel === 'critical' || analysisResult.urgencyLevel === 'high'
                ? 'error'
                : analysisResult.urgencyLevel === 'medium'
                ? 'warning'
                : 'success'
            }
            sx={{ ml: 2 }}
          />
          {analysisResult.summary && (
            <Typography variant="body2" sx={{ mt: 2 }}>
              {analysisResult.summary}
            </Typography>
          )}
        </CardContent>
      </Card>
    )
  }

  const renderAbnormalFindings = () => {
    if (!analysisResult || !analysisResult.abnormalFindings || analysisResult.abnormalFindings.length === 0)
      return null

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning color="warning" /> Abnormal Findings
          </Typography>
          <List>
            {analysisResult.abnormalFindings.map((finding, idx) => (
              <React.Fragment key={idx}>
                <ListItem>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" fontWeight="medium">
                        {finding.test}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Current: {finding.value} | Normal Range: {finding.normalRange}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          <strong>What this means:</strong> {finding.explanation}
                        </Typography>
                        <Typography variant="body2" color="error.main" sx={{ mt: 0.5 }}>
                          <strong>Concern:</strong> {finding.concern}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {idx < analysisResult.abnormalFindings.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>
    )
  }

  const renderRecommendations = () => {
    if (!analysisResult || !analysisResult.recommendations || analysisResult.recommendations.length === 0)
      return null

    const grouped = {
      immediate: [],
      'short-term': [],
      'long-term': [],
    }

    analysisResult.recommendations.forEach((rec) => {
      const category = rec.category || 'long-term'
      if (grouped[category]) {
        grouped[category].push(rec)
      }
    })

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle color="success" /> Recommendations
          </Typography>
          {Object.entries(grouped).map(([category, recs]) => {
            if (recs.length === 0) return null
            return (
              <Accordion key={category} defaultExpanded={category === 'immediate'}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1" fontWeight="medium" textTransform="capitalize">
                    {category.replace('-', ' ')} Actions ({recs.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    {recs.map((rec, idx) => (
                      <ListItem key={idx}>
                        <ListItemIcon>
                          <CheckCircle fontSize="small" color={category === 'immediate' ? 'error' : 'primary'} />
                        </ListItemIcon>
                        <ListItemText
                          primary={rec.action}
                          secondary={rec.reason}
                        />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            )
          })}
        </CardContent>
      </Card>
    )
  }

  const renderDietPlan = () => {
    if (!analysisResult || !analysisResult.dietPlan) return null

    const { toEat, toAvoid, supplements } = analysisResult.dietPlan

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Restaurant /> Personalized Diet Plan
          </Typography>
          <Grid container spacing={2}>
            {toEat && toEat.length > 0 && (
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.lighter' }}>
                  <Typography variant="subtitle2" fontWeight="medium" color="success.dark" gutterBottom>
                    ✓ Foods to Include
                  </Typography>
                  <List dense>
                    {toEat.map((food, idx) => (
                      <ListItem key={idx}>
                        <ListItemText primary={food} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>
            )}
            {toAvoid && toAvoid.length > 0 && (
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'error.lighter' }}>
                  <Typography variant="subtitle2" fontWeight="medium" color="error.dark" gutterBottom>
                    ✗ Foods to Avoid
                  </Typography>
                  <List dense>
                    {toAvoid.map((food, idx) => (
                      <ListItem key={idx}>
                        <ListItemText primary={food} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>
            )}
            {supplements && supplements.length > 0 && (
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'info.lighter' }}>
                  <Typography variant="subtitle2" fontWeight="medium" color="info.dark" gutterBottom>
                    💊 Recommended Supplements
                  </Typography>
                  <List dense>
                    {supplements.map((supp, idx) => (
                      <ListItem key={idx}>
                        <ListItemText primary={supp} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
    )
  }

  const renderLifestyleSuggestions = () => {
    if (!analysisResult || !analysisResult.lifestyle) return null

    const { exercise, sleep, stress, habits } = analysisResult.lifestyle

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FitnessCenter /> Lifestyle Recommendations
          </Typography>
          <Grid container spacing={2}>
            {exercise && exercise.length > 0 && (
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                  Exercise
                </Typography>
                <List dense>
                  {exercise.map((ex, idx) => (
                    <ListItem key={idx}>
                      <ListItemIcon>
                        <FitnessCenter fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={ex} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            )}
            <Grid item xs={12} md={6}>
              {sleep && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                    Sleep
                  </Typography>
                  <Typography variant="body2">{sleep}</Typography>
                </Box>
              )}
              {stress && (
                <Box>
                  <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                    Stress Management
                  </Typography>
                  <Typography variant="body2">{stress}</Typography>
                </Box>
              )}
              {habits && habits.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                    Habits to Improve
                  </Typography>
                  <List dense>
                    {habits.map((habit, idx) => (
                      <ListItem key={idx}>
                        <ListItemText primary={habit} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    )
  }

  const renderFollowUp = () => {
    if (!analysisResult || !analysisResult.followUp) return null

    const { tests, timeline, doctorVisit, specialistNeeded } = analysisResult.followUp

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalHospital /> Follow-up Actions
          </Typography>
          {tests && tests.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                Tests to Repeat:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {tests.map((test, idx) => (
                  <Chip key={idx} label={test} size="small" />
                ))}
              </Box>
            </Box>
          )}
          {timeline && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Timeline:</strong> {timeline}
            </Typography>
          )}
          {doctorVisit && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Doctor Visit:</strong> {doctorVisit}
            </Typography>
          )}
          {specialistNeeded && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <AlertTitle>Specialist Consultation Recommended</AlertTitle>
              {specialistNeeded}
            </Alert>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-6xl h-[88vh] overflow-y-auto rounded-2xl bg-white dark:bg-zinc-950 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-zinc-100 p-2 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          aria-label="Close"
        >
          ✕
        </button>
        <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Upload Report" />
          <Tab label="Analysis Results" disabled={!analysisResult} />
          <Tab label="Report History" />
        </Tabs>
      </Box>

      {analysisError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {analysisError}
        </Alert>
      )}

      {activeTab === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Upload Medical Report
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Upload your medical reports (PDF, JPG, PNG) and get AI-powered health insights
            </Typography>

            <Box sx={{ textAlign: 'center', py: 4 }}>
              <input
                accept=".pdf,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                id="report-file-input"
                type="file"
                onChange={handleFileSelect}
              />
              <label htmlFor="report-file-input">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUpload />}
                  size="large"
                >
                  Select File
                </Button>
              </label>

              {selectedFile && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Selected: {selectedFile.name}
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={handleUpload}
                    disabled={uploading}
                    startIcon={<Assessment />}
                    sx={{ mt: 2 }}
                  >
                    {uploading ? 'Uploading & Analyzing...' : 'Upload & Analyze'}
                  </Button>
                  {analyzing && <LinearProgress sx={{ mt: 2 }} />}
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {activeTab === 1 && analysisResult && (
        <Box>
          {renderRiskScore()}
          {renderCharts()}
          {renderAbnormalFindings()}
          {renderRecommendations()}
          {renderDietPlan()}
          {renderLifestyleSuggestions()}
          {renderFollowUp()}
        </Box>
      )}
      {activeTab === 1 && !analysisResult && (
        <Alert severity="info">No analysis available for this report yet.</Alert>
      )}

      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Your Report History
            </Typography>
            {reports.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No reports uploaded yet
              </Typography>
            ) : (
              <List>
                {reports.map((report, idx) => (
                  <ListItem key={idx} disablePadding>
                    <ListItemButton
                      onClick={() => {
                        setSelectedReport(report)
                        const normalized = normalizeAnalysisResult(report)
                        setAnalysisResult(normalized)
                        setActiveTab(1)
                      }}
                    >
                      <ListItemIcon>
                        <Assessment />
                      </ListItemIcon>
                      <ListItemText
                        primary={report.reportName || `Report ${idx + 1}`}
                        secondary={new Date(report.uploadDate).toLocaleDateString()}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      )}
        </Box>
      </div>
    </div>
  )
}

export default ModernReportAnalyzer
