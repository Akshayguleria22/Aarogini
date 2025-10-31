const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const { analyzeReportFlow, chatFlow, compareReportsFlow } = require('../services/geminiClient');
const { extractText } = require('../services/reportExtractor');
const { getWomenHealthGuidelines } = require('../services/whoService');
const MedicalReport = require('../models/MedicalReport');
const User = require('../models/User');

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
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow PDF and image files
    const allowedTypes = /pdf|jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF and image files (JPEG, JPG, PNG) are allowed!'));
    }
  }
});

// @route   POST /api/ai/analyze-report
// @desc    Upload and analyze medical report with Gemini AI (supports direct image analysis)
// @access  Private
router.post('/analyze-report', protect, upload.single('report'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    console.log('Analyzing report:', req.file.filename, 'for user:', req.user.id);

    const { reportName, reportType } = req.body;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    const isImage = ['.jpg', '.jpeg', '.png'].includes(fileExt);

    let analysis;

    // For images, use direct multimodal analysis with Gemini (faster and more accurate)
    if (isImage) {
      console.log('Using direct image analysis with Gemini...');
      
      try {
        // Convert image to base64
        const imageBuffer = fs.readFileSync(req.file.path);
        const base64Image = imageBuffer.toString('base64');

        // Analyze image directly with Gemini
        analysis = await analyzeReportFlow({
          imageData: base64Image,
          reportType: reportType || 'general',
        });

        console.log('Direct image analysis completed');

      } catch (err) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        console.error('Direct image analysis error:', err.message);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to analyze image with AI', 
          error: err.message 
        });
      }
    } 
    // For PDFs, extract text first then analyze
    else if (fileExt === '.pdf') {
      console.log('Extracting text from PDF...');
      
      let extractedText = '';
      try {
        extractedText = await extractText(req.file.path, fileExt);
        
        if (!extractedText || extractedText.trim().length < 50) {
          fs.unlinkSync(req.file.path);
          return res.status(400).json({ 
            success: false, 
            message: 'Could not extract sufficient text from PDF. Please ensure the file is readable.' 
          });
        }
      } catch (err) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        console.error('PDF text extraction error:', err.message);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to extract text from PDF', 
          error: err.message 
        });
      }

      // Analyze extracted text with Gemini AI
      try {
        analysis = await analyzeReportFlow({
          reportText: extractedText,
          reportType: reportType || 'general',
        });
      } catch (err) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        console.error('AI analysis error:', err.message);
        return res.status(500).json({ 
          success: false, 
          message: 'AI analysis failed', 
          error: err.message 
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Unsupported file type. Only PDF, JPG, and PNG are supported.'
      });
    }

    // Get previous reports for comparison
    const previousReports = await MedicalReport.find({ user: req.user.id })
      .sort({ uploadDate: -1 })
      .limit(5)
      .lean();

    // Compare with previous reports if available
    let comparison = null;
    if (previousReports.length > 0) {
      const reportsForComparison = previousReports.map(r => ({
        date: r.uploadDate.toISOString(),
        tests: r.analysis?.tests || [],
      }));
      reportsForComparison.push({
        date: new Date().toISOString(),
        tests: analysis.tests,
      });

      try {
        comparison = await compareReportsFlow({ reports: reportsForComparison });
      } catch (err) {
        console.error('Comparison error:', err.message);
      }
    }

    // Get WHO guidelines for detected conditions
    const whoGuidelines = [];
    if (analysis.detected_conditions && analysis.detected_conditions.length > 0) {
      for (const condition of analysis.detected_conditions.slice(0, 3)) {
        const guideline = await getWomenHealthGuidelines(condition);
        if (guideline.success) {
          whoGuidelines.push(guideline.data);
        }
      }
    }

    // Save to database
    const reportDoc = new MedicalReport({
      user: req.user.id,
      reportType: reportType || 'general',
      reportName: reportName || req.file.originalname,
      uploadDate: new Date(),
      analysis: analysis,
      comparison: comparison,
      whoGuidelines: whoGuidelines,
      filePath: req.file.path,
      extractedText: isImage ? '[Image-based analysis]' : analysis.summary?.substring(0, 5000), // Store summary for images
    });

    await reportDoc.save();

    // Update user's health tracking if conditions detected
    if (analysis.detected_conditions && analysis.detected_conditions.length > 0) {
      await User.findByIdAndUpdate(req.user.id, {
        $addToSet: { detectedConditions: { $each: analysis.detected_conditions } }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        reportId: reportDoc._id,
        analysis,
        comparison,
        whoGuidelines,
        previousReportsCount: previousReports.length,
        analysisMethod: isImage ? 'direct_image' : 'text_extraction',
      }
    });

  } catch (error) {
    // Clean up file if exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('AI Report Analysis Error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to analyze report'
    });
  }
});

// @route   POST /api/ai/chat
// @desc    Chat with AI health assistant (with user context)
// @access  Private
router.post('/chat', protect, async (req, res) => {
  try {
    const { message, conversation_history } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Get user context
    const user = await User.findById(req.user.id).lean();
    const recentReports = await MedicalReport.find({ user: req.user.id })
      .sort({ uploadDate: -1 })
      .limit(3)
      .lean();

    const userContext = `User has ${recentReports.length} medical reports. ${
      user.detectedConditions && user.detectedConditions.length > 0
        ? `Known conditions: ${user.detectedConditions.join(', ')}.`
        : ''
    }`;

    // Build conversation history string
    const historyText = Array.isArray(conversation_history)
      ? conversation_history.map(m => `${m.role || 'user'}: ${m.content || m.message || ''}`).join('\n')
      : '';

    // Call Gemini AI
    const response = await chatFlow({
      message,
      conversationHistory: historyText,
      userContext,
    });

    res.status(200).json({
      success: true,
      data: response,
    });

  } catch (error) {
    console.error('AI Chat Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get AI response',
      error: error.message,
    });
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
    const hasGeminiKey = !!process.env.GEMINI_API_KEY;
    res.status(200).json({
      success: true,
      service: 'Gemini AI (Node.js)',
      status: hasGeminiKey ? 'configured' : 'not configured',
      message: hasGeminiKey ? 'AI service is ready' : 'GEMINI_API_KEY not set',
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      service: 'offline',
      message: error.message,
    });
  }
});

module.exports = router;
