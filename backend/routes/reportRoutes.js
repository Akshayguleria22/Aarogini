const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const MedicalReport = require('../models/MedicalReport');
const { protect } = require('../middleware/auth');
const { analyzeReportWithWHO } = require('../services/whoService');

// @route   POST /api/reports
// @desc    Create a new medical report
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const report = await MedicalReport.create({
      user: req.user.id,
      ...req.body
    });

    res.status(201).json({
      success: true,
      message: 'Medical report created successfully',
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/reports
// @desc    Get all reports for logged in user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { reportType, search } = req.query;
    
    let query = { user: req.user.id };
    
    if (reportType) {
      query.reportType = reportType;
    }
    
    if (search) {
      query.$or = [
        { reportName: { $regex: search, $options: 'i' } },
        { doctorName: { $regex: search, $options: 'i' } },
        { hospital: { $regex: search, $options: 'i' } }
      ];
    }

    const reports = await MedicalReport.find(query).sort({ dateOfTest: -1 });

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/reports/:id
// @desc    Get single report
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const report = await MedicalReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    if (report.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/reports/:id/download
// @desc    Download original uploaded file for a report
// @access  Private
router.get('/:id/download', protect, async (req, res) => {
  try {
    const report = await MedicalReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    if (!report.filePath) {
      return res.status(404).json({ success: false, message: 'No file associated with this report' });
    }

    const absolutePath = path.isAbsolute(report.filePath)
      ? report.filePath
      : path.join(__dirname, '..', report.filePath);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ success: false, message: 'File not found on server' });
    }

    const filename = report.fileName || path.basename(absolutePath);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    const stream = fs.createReadStream(absolutePath);
    stream.pipe(res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/reports/:id
// @desc    Update report
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let report = await MedicalReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    if (report.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    report = await MedicalReport.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Report updated successfully',
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/reports/:id
// @desc    Delete report
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const report = await MedicalReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    if (report.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    await report.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/reports/:id/analyze
// @desc    Analyze report with WHO guidelines
// @access  Private
router.post('/:id/analyze', protect, async (req, res) => {
  try {
    const report = await MedicalReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    if (report.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Analyze report with WHO guidelines
    const analysis = await analyzeReportWithWHO({
      findings: report.findings,
      notes: report.notes,
      reportType: report.reportType
    });

    res.status(200).json({
      success: true,
      message: 'Report analyzed with WHO guidelines',
      data: {
        report: report,
        whoAnalysis: analysis
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
