const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const MedicalReport = require('../models/MedicalReport');
const User = require('../models/User');
const PeriodTracker = require('../models/PeriodTracker');
const { getWomenHealthGuidelines } = require('../services/whoService');

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

    // Helpers
    const pickTest = (tests = [], nameIncludes) => {
      const idx = tests.findIndex(t => (t.test_name || '').toLowerCase().includes(nameIncludes));
      return idx === -1 ? null : tests[idx];
    };

    const parseBoolPositive = (val) => {
      if (val === true) return true;
      const s = String(val).toLowerCase();
      return ['1', 'true', 'yes', 'positive', 'pcos', 'high'].some(x => s.includes(x));
    };

    const latestRelatedReports = (condition) => (
      reports.filter(r =>
        (r.analysis?.detected_conditions || []).some(dc =>
          dc.toLowerCase().includes(condition.toLowerCase()) ||
          condition.toLowerCase().includes(dc.toLowerCase())
        )
      )
    );

    const buildCard = async (condition) => {
      const detectedFromUser = (user.detectedConditions || []).some(c =>
        c.toLowerCase().includes(condition.toLowerCase()) ||
        condition.toLowerCase().includes(c.toLowerCase())
      );

      const relatedReports = latestRelatedReports(condition);
      const latest = relatedReports[0] || reports[0]; // fallback to most recent report overall
      const tests = latest?.analysis?.tests || [];

      let detected = detectedFromUser;
      let severity = latest?.analysis?.abnormal_findings?.[0]?.severity || null;
      let currentHealth = 'No recent data';
      let aiRecommendations = [];

      // Condition-specific derivations using mlPredictions and key tests
      const preds = latest?.mlPredictions || [];
      const findPred = (key) => preds.find(p => p.model === key);

      const lc = condition.toLowerCase();
      if (lc.includes('pcos')) {
        const p = findPred('pcos');
        if (p) {
          const pos = parseBoolPositive(p.prediction);
          detected = detected || pos;
          severity = pos ? 'moderate' : 'mild';
          currentHealth = pos ? 'PCOS indicators present' : 'No strong PCOS indicators';
          aiRecommendations = pos ? [
            'Consult a gynecologist/endocrinologist for confirmation',
            'Adopt a balanced, low-glycemic diet and regular exercise',
            'Track menstrual cycles and symptoms'
          ] : ['Maintain healthy lifestyle; re-evaluate if symptoms change'];
        }
      } else if (lc.includes('pregnancy') || lc.includes('maternal')) {
        const p = findPred('maternal_health_risk');
        if (p) {
          const lvl = String(p.prediction || '').toLowerCase();
          detected = detected || lvl.length > 0;
          if (lvl.includes('high')) severity = 'severe';
          else if (lvl.includes('mid') || lvl.includes('moderate')) severity = 'moderate';
          else if (lvl.includes('low')) severity = 'mild';
          currentHealth = `Maternal risk: ${p.prediction}`;
          aiRecommendations = [
            'Schedule antenatal check-ups regularly',
            'Monitor blood pressure, glucose, and heart rate',
            'Follow WHO antenatal care recommendations'
          ];
        }
      } else if (lc.includes('diabetes')) {
        const gl = pickTest(tests, 'glucose') || pickTest(tests, 'blood sugar') || pickTest(tests, 'bs');
        if (gl) {
          detected = detected || true;
          const val = parseFloat(gl.value);
          if (Number.isFinite(val)) {
            if (val >= 200) { severity = 'severe'; currentHealth = `High glucose: ${gl.value} ${gl.unit || ''}`.trim(); }
            else if (val >= 140) { severity = 'moderate'; currentHealth = `Elevated glucose: ${gl.value} ${gl.unit || ''}`.trim(); }
            else { severity = severity || 'mild'; currentHealth = `Glucose: ${gl.value} ${gl.unit || ''}`.trim(); }
          }
          aiRecommendations = [
            'Reduce refined carbs and added sugars',
            'Increase physical activity and hydration',
            'Consult a clinician for HbA1c testing if persistently high'
          ];
        }
      } else if (lc.includes('anemia')) {
        const hb = pickTest(tests, 'hemoglobin') || pickTest(tests, 'haemoglobin');
        if (hb) {
          detected = detected || true;
          const val = parseFloat(hb.value);
          if (Number.isFinite(val)) {
            if (val < 8) { severity = 'severe'; currentHealth = `Severely low Hb: ${hb.value} ${hb.unit || ''}`.trim(); }
            else if (val < 12) { severity = 'moderate'; currentHealth = `Low Hb: ${hb.value} ${hb.unit || ''}`.trim(); }
            else { severity = severity || 'mild'; currentHealth = `Hb: ${hb.value} ${hb.unit || ''}`.trim(); }
          }
          aiRecommendations = [
            'Increase iron-rich foods (leafy greens, legumes)',
            'Consider iron and folic acid after consulting a doctor',
            'Recheck hemoglobin in 4–6 weeks'
          ];
        }
      } else if (lc.includes('thyroid')) {
        const tsh = pickTest(tests, 'tsh');
        if (tsh) {
          detected = detected || true;
          const val = parseFloat(tsh.value);
          if (Number.isFinite(val)) {
            if (val > 10) { severity = 'severe'; currentHealth = `High TSH: ${tsh.value} ${tsh.unit || ''}`.trim(); }
            else if (val > 4.5) { severity = 'moderate'; currentHealth = `Elevated TSH: ${tsh.value} ${tsh.unit || ''}`.trim(); }
            else if (val < 0.3) { severity = 'moderate'; currentHealth = `Low TSH: ${tsh.value} ${tsh.unit || ''}`.trim(); }
            else { severity = severity || 'mild'; currentHealth = `TSH: ${tsh.value} ${tsh.unit || ''}`.trim(); }
          }
          aiRecommendations = [
            'Discuss thyroid function with your physician',
            'Adhere to medication if prescribed; avoid sudden dose changes',
            'Re-test TSH/T3/T4 as advised'
          ];
        }
      } else if (lc.includes('cervical cancer')) {
        // Rely on detected conditions; predictions unlikely
        if (detectedFromUser || relatedReports.length > 0) {
          detected = true;
          severity = severity || 'moderate';
          currentHealth = 'Cervical health monitoring recommended';
          aiRecommendations = [
            'Ensure regular Pap smear/HPV screening as per age guidelines',
            'Discuss vaccination and follow-up schedule with your gynecologist'
          ];
        }
      } else {
        // Fallback generic
        if (relatedReports.length > 0) {
          detected = true;
          currentHealth = latest?.analysis?.summary || 'Review recent report analysis';
        }
      }

      // Map severity to a simplified status
      const status = severity === 'severe' ? 'attention' : (severity === 'moderate' ? 'monitor' : (detected ? 'ok' : 'unknown'));

      // WHO guideline snippet (best effort)
      let who = null;
      try {
        const g = await getWomenHealthGuidelines(condition);
        if (g?.success && g.data) {
          who = { title: g.data.title, count: (g.data.recommendations || []).length, source: g.data.source };
        }
      } catch (_) { /* ignore WHO errors */ }

      return {
        condition,
        detected,
        reportsCount: relatedReports.length,
        lastReportDate: relatedReports[0]?.uploadDate || null,
        severity,
        status,
        currentHealth,
        aiRecommendations,
        whoGuidelines: who,
      };
    };

    // Analyze health status for each condition
    const conditionsStatus = [];
    for (const condition of HEALTH_CONDITIONS) {
      // eslint-disable-next-line no-await-in-loop
      const card = await buildCard(condition);
      conditionsStatus.push(card);
    }

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
