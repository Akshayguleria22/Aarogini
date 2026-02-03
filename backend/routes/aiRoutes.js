import express from 'express';
const router = express.Router();
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { protect } from '../middleware/auth.js';
import { compareReportsFlow, analyzeWithGroq } from '../services/groqClient.js';
import { derivePredictionsFromAnalysis } from '../services/modelService.js';
import { extractText } from '../services/reportExtractor.js';
import { parseTestsFromText } from '../services/parserService.js';
import { getWomenHealthGuidelines } from '../services/whoService.js';
import MedicalReport from '../models/MedicalReport.js';
import User from '../models/User.js';

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
    const normalizeStatus = (s) => {
      const v = String(s || '').toUpperCase();
      if (['NORMAL', 'HIGH', 'LOW', 'ABNORMAL'].includes(v)) return v;
      if (v === 'H') return 'HIGH';
      if (v === 'L') return 'LOW';
      return 'NORMAL';
    };
    let analysis = {
      patient_info: { name: null, age: null, gender: null, report_date: null },
      tests: (parsed.tests || []).map((t) => ({
        ...t,
        status: normalizeStatus(t.status)
      })),
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
      mlPredictions = await derivePredictionsFromAnalysis({ tests: parsed.tests });
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
    const groqClient = (await import('../services/groqClient.js')).default;
    const resp = await groqClient.chatFlow({ message });
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
