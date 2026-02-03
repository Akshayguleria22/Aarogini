import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth.js';
import { runHealthAnalysis } from '../services/healthAIEngine.js';
import MedicalReport from '../models/MedicalReport.js';

const router = express.Router();
const upload = multer({ dest: './uploads/' });

// @route   GET /api/reports
// @desc    Get all medical reports for logged in user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const reports = await MedicalReport.find({ user: req.user.id })
      .sort({ uploadDate: -1 });
    
    res.json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch reports'
    });
  }
});

// @route   GET /api/reports/:id
// @desc    Get single report by ID
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

    // Verify ownership
    if (report.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this report'
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch report'
    });
  }
});

// @route   DELETE /api/reports/:id
// @desc    Delete a report
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

    // Verify ownership
    if (report.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this report'
      });
    }

    await report.deleteOne();

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete report'
    });
  }
});

router.post('/upload', protect, upload.single('report'), async (req, res) => {

  try {

    const result = await runHealthAnalysis(
      req.file,
      req.user
    );

    res.json({
      success: true,
      data: result
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: "AI Analysis Failed"
    });
  }
});

export default router;
