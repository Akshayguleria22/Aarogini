import express from 'express';
const router = express.Router();
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { protect } from '../middleware/auth.js';
import { compareReportsFlow, analyzeWithGroq, chatFlow, extractLabTestsWithGroq } from '../services/groqClient.js';
import { derivePredictionsFromAnalysis } from '../services/modelService.js';
import { extractText } from '../services/reportExtractor.js';
import { parseTestsFromText, canonicalizeName, parseRange } from '../services/parserService.js';
import { getWomenHealthGuidelines } from '../services/whoService.js';
import MedicalReport from '../models/MedicalReport.js';
import User from '../models/User.js';

const normalizeStatus = (s) => {
  const v = String(s || '').toUpperCase();
  if (['NORMAL', 'HIGH', 'LOW', 'ABNORMAL'].includes(v)) return v;
  if (v === 'H') return 'HIGH';
  if (v === 'L') return 'LOW';
  return 'NORMAL';
};

const EXPLANATIONS = {
  hemoglobin: {
    low: 'Low hemoglobin can indicate anemia or iron deficiency.',
    high: 'High hemoglobin can occur with dehydration or other causes.'
  },
  tsh: {
    high: 'High TSH can suggest an underactive thyroid.',
    low: 'Low TSH can suggest an overactive thyroid.'
  },
  glucose_fasting: {
    high: 'High fasting glucose can indicate impaired glucose control.',
    low: 'Low fasting glucose can indicate hypoglycemia.'
  },
  hba1c: {
    high: 'Elevated HbA1c suggests higher average blood sugar levels.',
    low: 'Low HbA1c is uncommon and may need review.'
  },
  vitamin_d: {
    low: 'Low vitamin D is common and can affect bone and mood.',
    high: 'Very high vitamin D can be harmful.'
  },
  vitamin_b12: {
    low: 'Low B12 can cause fatigue and nerve symptoms.',
    high: 'High B12 is usually from supplements.'
  },
  iron: {
    low: 'Low iron can contribute to fatigue and anemia.',
    high: 'High iron may indicate excess supplementation.'
  },
  cholesterol_total: {
    high: 'High total cholesterol can increase heart risk.'
  },
  ldl: {
    high: 'High LDL increases cardiovascular risk.'
  },
  hdl: {
    low: 'Low HDL reduces protective cholesterol.'
  },
  triglycerides: {
    high: 'High triglycerides can raise heart risk.'
  },
  systolicbp: {
    high: 'Elevated systolic blood pressure may indicate hypertension.'
  },
  diastolicbp: {
    high: 'Elevated diastolic blood pressure may indicate hypertension.'
  }
};

const RECOMMENDATIONS = {
  hemoglobin_low: {
    category: 'short-term',
    action: 'Increase iron-rich foods (leafy greens, lentils, lean meats) and consider iron testing with your clinician.',
    reason: 'Low hemoglobin can be linked to iron deficiency.'
  },
  vitamin_d_low: {
    category: 'short-term',
    action: 'Discuss vitamin D supplementation and safe sunlight exposure.',
    reason: 'Low vitamin D can affect bone and mood health.'
  },
  tsh_high: {
    category: 'short-term',
    action: 'Consider a thyroid panel review with a clinician.',
    reason: 'High TSH can indicate thyroid imbalance.'
  },
  glucose_fasting_high: {
    category: 'short-term',
    action: 'Reduce added sugars and refined carbs; consider repeat fasting glucose or HbA1c.',
    reason: 'High fasting glucose suggests impaired glucose control.'
  },
  hba1c_high: {
    category: 'short-term',
    action: 'Discuss blood sugar management and repeat HbA1c in 3 months.',
    reason: 'HbA1c reflects average blood sugar over time.'
  },
  ldl_high: {
    category: 'long-term',
    action: 'Increase fiber and healthy fats; review lipid profile with your clinician.',
    reason: 'High LDL increases cardiovascular risk.'
  }
};

const CONDITION_MAP = {
  hemoglobin_low: 'Anemia (possible)',
  iron_low: 'Iron deficiency (possible)',
  vitamin_d_low: 'Vitamin D deficiency (possible)',
  vitamin_b12_low: 'Vitamin B12 deficiency (possible)',
  tsh_high: 'Possible hypothyroidism',
  tsh_low: 'Possible hyperthyroidism',
  glucose_fasting_high: 'Elevated fasting glucose',
  hba1c_high: 'Elevated HbA1c',
  ldl_high: 'High LDL cholesterol',
  triglycerides_high: 'High triglycerides'
};

function buildAbnormalFindings(tests = []) {
  const abnormal = [];
  for (const t of tests) {
    const status = normalizeStatus(t.status);
    if (status === 'NORMAL') continue;
    const canon = canonicalizeName(t.test_name || '');
    const lowHigh = status === 'LOW' ? 'low' : 'high';
    const exp = EXPLANATIONS[canon]?.[lowHigh] || EXPLANATIONS[canon]?.high || EXPLANATIONS[canon]?.low || 'Outside expected range.';

    abnormal.push({
      test: t.test_name || 'Test',
      value: t.value || '',
      normalRange: t.reference_range || 'Not provided',
      status: lowHigh,
      severity: lowHigh === 'low' ? 'moderate' : 'moderate',
      explanation: exp,
      concern: 'Consider discussing this result with a healthcare professional.'
    });
  }
  return abnormal;
}

function buildRecommendations(abnormalFindings = []) {
  const recs = [];
  const add = (key) => {
    if (RECOMMENDATIONS[key]) recs.push(RECOMMENDATIONS[key]);
  };
  for (const f of abnormalFindings) {
    const canon = canonicalizeName(f.test || '');
    const status = f.status === 'low' ? 'low' : 'high';
    add(`${canon}_${status}`);
  }
  return recs.slice(0, 6);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Only PDF and image files (JPEG, JPG, PNG) are allowed!'));
  }
});

// @route   POST /api/ai/analyze-report
// @desc    Upload and analyze medical report (local OCR + parser + ML models)
// @access  Private
router.post('/analyze-report', protect, upload.single('report'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    console.log('Analyzing report:', req.file.filename, 'for user:', req.user.id);
    const { reportName, reportType } = req.body;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    const isImage = ['.jpg', '.jpeg', '.png'].includes(fileExt);

    // Extract text via OCR or PDF parser
    let extractedText = '';
    try {
      extractedText = await extractText(req.file.path, fileExt);
      if (!extractedText || extractedText.trim().length < 20) {
        throw new Error('Insufficient text extracted from the report');
      }
    } catch (err) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      console.error('Report text extraction error:', err.message);
      return res.status(500).json({ success: false, message: 'Failed to extract text from report', error: err.message });
    }

    // Parse tests and build local analysis
    const parsed = parseTestsFromText(extractedText);

    let groqExtracted = [];
    if ((parsed.tests || []).length < 4 && process.env.GROQ_API_KEY) {
      const groqRes = await extractLabTestsWithGroq(extractedText);
      if (groqRes.ok) groqExtracted = groqRes.tests || [];
    }

    const mergedMap = new Map();
    (parsed.tests || []).forEach((t) => {
      const key = canonicalizeName(t.test_name || '');
      mergedMap.set(key || t.test_name, t);
    });
    for (const t of groqExtracted) {
      const name = t.test_name || t.name || '';
      const key = canonicalizeName(name || '');
      if (!key || mergedMap.has(key)) continue;
      const valueNum = Number.isFinite(Number(t.value)) ? String(t.value) : String(t.value || '');
      mergedMap.set(key, {
        test_name: name,
        value: valueNum,
        unit: t.unit || '',
        reference_range: t.reference_range || '',
        status: t.flag || '',
        category: 'general'
      });
    }

    const combinedTests = Array.from(mergedMap.values()).map((t) => {
      const val = parseFloat(String(t.value || '').replace(/[<>]/g, ''));
      let status = normalizeStatus(t.status);
      const range = parseRange(t.reference_range || '');
      if (range && Number.isFinite(val)) {
        if (val < range.min) status = 'LOW';
        else if (val > range.max) status = 'HIGH';
        else status = 'NORMAL';
      }
      return {
        ...t,
        status
      };
    });

    let analysis = {
      patient_info: { name: null, age: null, gender: null, report_date: null },
      tests: combinedTests,
      abnormal_findings: [],
      health_concerns: [],
      tracking_recommendations: [],
      womens_health_indicators: [],
      summary: 'Auto-generated report summary based on extracted values and model predictions.',
      detected_conditions: [],
    };

    // Detect report type/category heuristically
    const detectReportType = (text, tests) => {
      const t = (text || '').toLowerCase();
      const names = (tests || []).map(x => (x.test_name || '').toLowerCase());
      const hasTest = (kw) => names.some(n => n.includes(kw));

      if ((tests || []).length > 0) {
        if (hasTest('tsh') || hasTest('t3') || hasTest('t4') || hasTest('testosterone')) return 'hormone_test';
        return 'blood_test';
      }
      if (t.includes('urine')) return 'urine_test';
      if (t.includes('stool')) return 'stool_test';
      if (t.includes('ultrasound')) return 'ultrasound';
      if (t.includes('x-ray') || t.includes('xray')) return 'x-ray';
      if (t.includes('mri')) return 'mri';
      if (t.includes('ct')) return 'ct_scan';
      if (t.includes('prescription')) return 'prescription';
      if (t.includes('diagnosis')) return 'diagnosis';
      return 'general';
    };
    const detectedType = detectReportType(extractedText, parsed.tests);

    // ML predictions based on parsed tests
    let mlPredictions = [];
    try {
      mlPredictions = await derivePredictionsFromAnalysis({ tests: combinedTests });
      for (const p of mlPredictions) {
        if (p.model === 'pcos' && (p.prediction === 1 || p.prediction === '1')) {
          analysis.detected_conditions.push('PCOS');
        }
        if (p.model === 'maternal_health_risk') {
          analysis.detected_conditions.push(`Maternal ${String(p.prediction)}`);
        }
      }
    } catch (e) {
      console.warn('ML prediction derivation failed:', e.message);
    }

    // Previous reports and comparison (optional)
    const previousReports = await MedicalReport.find({ user: req.user.id })
      .sort({ uploadDate: -1 })
      .limit(5)
      .lean();

    let comparison = null;
    if (previousReports.length > 0) {
      const reportsForComparison = previousReports.map(r => ({
        date: r.uploadDate.toISOString(),
        tests: r.analysis?.tests || [],
      }));
      reportsForComparison.push({ date: new Date().toISOString(), tests: analysis.tests });
      try {
        comparison = await compareReportsFlow({ reports: reportsForComparison });
      } catch (err) {
        console.error('Comparison error:', err.message);
      }
    }

    // WHO guidelines for detected conditions
    const whoGuidelines = [];
    if (analysis.detected_conditions && analysis.detected_conditions.length > 0) {
      for (const condition of analysis.detected_conditions.slice(0, 3)) {
        const guideline = await getWomenHealthGuidelines(condition);
        if (guideline.success) whoGuidelines.push(guideline.data);
      }
    }

    // Abnormal findings + recommendations
    analysis.abnormal_findings = buildAbnormalFindings(analysis.tests);
    analysis.health_concerns = Array.from(new Set(analysis.abnormal_findings.map(f => f.test))).slice(0, 6);
    analysis.tracking_recommendations = buildRecommendations(analysis.abnormal_findings).map(r => r.action);
    analysis.womens_health_indicators = Array.from(new Set(analysis.tests.map(t => t.category).filter(Boolean))).slice(0, 6);

    for (const f of analysis.abnormal_findings) {
      const canon = canonicalizeName(f.test || '');
      const key = `${canon}_${f.status || ''}`;
      if (CONDITION_MAP[key]) {
        analysis.detected_conditions.push(CONDITION_MAP[key]);
      }
    }
    analysis.detected_conditions = Array.from(new Set(analysis.detected_conditions));

    if (analysis.abnormal_findings.length > 0) {
      analysis.summary = `Detected ${analysis.abnormal_findings.length} abnormal finding(s). Review highlighted tests and consider follow-up.`;
    } else if (analysis.tests.length === 0) {
      analysis.summary = 'No lab tests were detected in the uploaded report.';
    }

    // Groq AI insights (structured recommendations)
    let aiInsights = null;
    try {
      const userProfile = await User.findById(req.user.id)
        .select('name email dateOfBirth healthProfile detectedConditions')
        .lean();
      aiInsights = await analyzeWithGroq({
        profile: userProfile || {},
        report: analysis,
        ml: mlPredictions,
        comparison: comparison || null
      });

      if (aiInsights?.summary) {
        analysis.summary = aiInsights.summary;
      }
      if (Array.isArray(aiInsights?.healthUpdates?.detectedConditions) && aiInsights.healthUpdates.detectedConditions.length > 0) {
        analysis.detected_conditions = Array.from(new Set([
          ...(analysis.detected_conditions || []),
          ...aiInsights.healthUpdates.detectedConditions
        ]));
      }
    } catch (e) {
      console.warn('Groq insights error:', e.message);
    }

    // Persist
    const reportDoc = new MedicalReport({
      user: req.user.id,
      reportType: reportType || detectedType || 'general',
      reportName: reportName || req.file.originalname,
      uploadDate: new Date(),
      analysis,
      comparison,
      whoGuidelines,
      mlPredictions,
      aiInsights,
      filePath: req.file.path,
      extractedText: extractedText.substring(0, 5000),
    });
    await reportDoc.save();

    // Update user profile with detected conditions
    if (analysis.detected_conditions && analysis.detected_conditions.length > 0) {
      await User.findByIdAndUpdate(req.user.id, {
        $addToSet: { detectedConditions: { $each: analysis.detected_conditions } },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        reportId: reportDoc._id,
        analysis,
        comparison,
        whoGuidelines,
        mlPredictions,
        aiInsights,
        previousReportsCount: previousReports.length,
        analysisMethod: isImage ? 'ocr_image' : 'text_extraction',
        extractedText: extractedText.substring(0, 5000),
      },
    });

  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('AI Report Analysis Error:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Failed to analyze report' });
  }
});

// @route   POST /api/ai/chat
// @desc    Chat with AI health assistant (with user context)
// @access  Private
router.post('/chat', protect, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }
    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({ success: false, message: 'AI service is not configured' });
    }
    const resp = await chatFlow({ message });
    res.status(200).json({ success: true, data: { response: resp.response } });
  } catch (error) {
    console.error('AI Chat (ML) Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to get response from trained model', error: error.message });
  }
});

// @route   POST /api/ai/compare-reports
// @desc    Compare multiple reports and generate trends
// @access  Private
router.post('/compare-reports', protect, async (req, res) => {
  try {
    const { report_ids } = req.body;

    if (!report_ids || !Array.isArray(report_ids) || report_ids.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 report IDs are required for comparison'
      });
    }

    // Fetch reports from database
    const reports = await MedicalReport.find({
      _id: { $in: report_ids },
      user: req.user.id,
    }).sort({ uploadDate: 1 }).lean();

    if (reports.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Could not find enough reports for comparison'
      });
    }

    // Prepare data for comparison
    const reportsForAI = reports.map(r => ({
      date: r.uploadDate.toISOString(),
      tests: r.analysis?.tests || [],
    }));

    // Generate AI comparison
    const comparison = await compareReportsFlow({ reports: reportsForAI });

    res.status(200).json({
      success: true,
      data: {
        comparison,
        reports_analyzed: reports.length,
        date_range: {
          first: reports[0].uploadDate,
          last: reports[reports.length - 1].uploadDate,
        },
      },
    });

  } catch (error) {
    console.error('AI Report Comparison Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to compare reports',
      error: error.message,
    });
  }
});

// @route   GET /api/ai/who-guidelines/:topic
// @desc    Get WHO guidelines for specific health topic
// @access  Private
router.get('/who-guidelines/:topic', protect, async (req, res) => {
  try {
    const { topic } = req.params;
    const guideline = await getWomenHealthGuidelines(topic);

    if (!guideline.success) {
      return res.status(404).json(guideline);
    }

    res.status(200).json(guideline);
  } catch (error) {
    console.error('WHO Guidelines Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch WHO guidelines',
      error: error.message,
    });
  }
});

// @route   GET /api/ai/health
// @desc    Check AI service health
// @access  Public
router.get('/health', async (req, res) => {
  try {
    const hasGroqKey = !!process.env.GROQ_API_KEY;
    res.status(200).json({
      success: true,
      service: 'AI service',
      status: hasGroqKey ? 'configured' : 'not configured',
      message: hasGroqKey ? 'AI service is ready' : 'GROQ_API_KEY not set',
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      service: 'offline',
      message: error.message,
    });
  }
});

export default router;
