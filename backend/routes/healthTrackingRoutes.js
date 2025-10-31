const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const MedicalReport = require('../models/MedicalReport');
const User = require('../models/User');
const PeriodTracker = require('../models/PeriodTracker');

// Women's health conditions to track (21 conditions as per requirement)
const HEALTH_CONDITIONS = [
  'Periods & Ovulation',
  'PCOS/PCOD',
  'Endometriosis',
  'Pregnancy & Maternal Health',
  'Postpartum Health',
  'Menopause',
  'UTI (Urinary Tract Infection)',
  'Vaginal Health',
  'Thyroid Disorders',
  'Breast Cancer',
  'Cervical Cancer',
  'Anemia',
  'Osteoporosis',
  'Depression & Anxiety',
  'Stress / PTSD',
  'Body Image Disorder',
  'Obesity/ Weight Issues',
  'Diabetes',
  'Hypertension',
  'Vitamin D & Calcium Deficiency',
  'Cardiovascular Disease'
];

// @route   GET /api/health-tracking/dashboard
// @desc    Get comprehensive health dashboard data
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
  try {
    // Get user with detected conditions
    const user = await User.findById(req.user.id).lean();

    // Get all medical reports
    const reports = await MedicalReport.find({ user: req.user.id })
      .sort({ uploadDate: -1 })
      .lean();

    // Get period tracker data
    const periodData = await PeriodTracker.find({ userId: req.user.id })
      .sort({ cycleStartDate: -1 })
      .limit(6)
      .lean();

    // Analyze health status for each condition
    const conditionsStatus = HEALTH_CONDITIONS.map(condition => {
      const isDetected = (user.detectedConditions || []).some(c =>
        c.toLowerCase().includes(condition.toLowerCase()) ||
        condition.toLowerCase().includes(c.toLowerCase())
      );

      // Find related reports
      const relatedReports = reports.filter(r =>
        (r.analysis?.detected_conditions || []).some(dc =>
          dc.toLowerCase().includes(condition.toLowerCase()) ||
          condition.toLowerCase().includes(dc.toLowerCase())
        )
      );

      return {
        condition,
        detected: isDetected,
        reportsCount: relatedReports.length,
        lastReportDate: relatedReports[0]?.uploadDate || null,
        severity: relatedReports[0]?.analysis?.abnormal_findings?.[0]?.severity || null,
      };
    });

    // Get recent abnormal findings
    const recentAbnormalities = reports
      .flatMap(r => (r.analysis?.abnormal_findings || []).map(f => ({
        ...f,
        reportId: r._id,
        reportDate: r.uploadDate,
        reportType: r.reportType,
      })))
      .sort((a, b) => new Date(b.reportDate) - new Date(a.reportDate))
      .slice(0, 10);

    // Get tracking recommendations from all reports
    const allRecommendations = [
      ...new Set(
        reports.flatMap(r => r.analysis?.tracking_recommendations || [])
      )
    ].slice(0, 10);

    res.status(200).json({
      success: true,
      data: {
        conditionsStatus,
        summary: {
          totalReports: reports.length,
          detectedConditions: (user.detectedConditions || []).length,
          periodCyclesTracked: periodData.length,
          recentAbnormalities: recentAbnormalities.length,
        },
        recentAbnormalities,
        trackingRecommendations: allRecommendations,
        periodTracking: periodData.slice(0, 3),
      }
    });
  } catch (error) {
    console.error('Health Dashboard Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to load health dashboard',
      error: error.message
    });
  }
});

// @route   GET /api/health-tracking/condition/:name
// @desc    Get detailed info for a specific condition
// @access  Private
router.get('/condition/:name', protect, async (req, res) => {
  try {
    const conditionName = decodeURIComponent(req.params.name);

    // Get related reports
    const reports = await MedicalReport.find({
      user: req.user.id,
      'analysis.detected_conditions': {
        $regex: conditionName,
        $options: 'i'
      }
    })
      .sort({ uploadDate: -1 })
      .lean();

    // Get WHO guidelines from the most recent report
    const whoGuidelines = reports[0]?.whoGuidelines?.filter(g =>
      g.title.toLowerCase().includes(conditionName.toLowerCase())
    ) || [];

    // Extract timeline of test results if available
    const timeline = reports.map(r => ({
      date: r.uploadDate,
      reportId: r._id,
      abnormalFindings: r.analysis?.abnormal_findings?.length || 0,
      summary: r.analysis?.summary,
      tests: r.analysis?.tests || [],
    }));

    res.status(200).json({
      success: true,
      data: {
        condition: conditionName,
        detected: reports.length > 0,
        reportsCount: reports.length,
        whoGuidelines,
        timeline,
        latestReport: reports[0] || null,
      }
    });
  } catch (error) {
    console.error('Condition Details Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get condition details',
      error: error.message
    });
  }
});

// @route   GET /api/health-tracking/trends
// @desc    Get health trends over time
// @access  Private
router.get('/trends', protect, async (req, res) => {
  try {
    const reports = await MedicalReport.find({ user: req.user.id })
      .sort({ uploadDate: 1 })
      .lean();

    if (reports.length < 2) {
      return res.status(200).json({
        success: true,
        message: 'Not enough reports for trend analysis',
        data: { trends: [] }
      });
    }

    // Extract parameter trends from comparisons
    const trends = [];
    reports.forEach(report => {
      if (report.comparison?.trends) {
        report.comparison.trends.forEach(trend => {
          const existing = trends.find(t => t.parameter === trend.parameter);
          if (existing) {
            existing.history.push({
              date: report.uploadDate,
              trend: trend.trend,
              recommendation: trend.recommendation,
            });
          } else {
            trends.push({
              parameter: trend.parameter,
              currentTrend: trend.trend,
              history: [{
                date: report.uploadDate,
                trend: trend.trend,
                recommendation: trend.recommendation,
              }],
            });
          }
        });
      }
    });

    res.status(200).json({
      success: true,
      data: { trends }
    });
  } catch (error) {
    console.error('Trends Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get health trends',
      error: error.message
    });
  }
});

module.exports = router;
