const express = require('express');
const router = express.Router();
const PeriodTracker = require('../models/PeriodTracker');
const { protect } = require('../middleware/auth');

// @route   POST /api/periods
// @desc    Create a new period entry
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const periodEntry = await PeriodTracker.create({
      user: req.user.id,
      ...req.body
    });

    res.status(201).json({
      success: true,
      message: 'Period entry created successfully',
      data: periodEntry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/periods
// @desc    Get all period entries for logged in user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const periods = await PeriodTracker.find({ user: req.user.id }).sort({ cycleStartDate: -1 });

    res.status(200).json({
      success: true,
      count: periods.length,
      data: periods
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/periods/:id
// @desc    Get single period entry
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const period = await PeriodTracker.findById(req.params.id);

    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Period entry not found'
      });
    }

    // Make sure user owns the period entry
    if (period.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    res.status(200).json({
      success: true,
      data: period
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/periods/:id
// @desc    Update period entry
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let period = await PeriodTracker.findById(req.params.id);

    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Period entry not found'
      });
    }

    // Make sure user owns the period entry
    if (period.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    period = await PeriodTracker.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Period entry updated successfully',
      data: period
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/periods/:id
// @desc    Delete period entry
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const period = await PeriodTracker.findById(req.params.id);

    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Period entry not found'
      });
    }

    // Make sure user owns the period entry
    if (period.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    await period.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Period entry deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/periods/predictions/next
// @desc    Get next period prediction
// @access  Private
router.get('/predictions/next', protect, async (req, res) => {
  try {
    const lastPeriod = await PeriodTracker.findOne({ user: req.user.id }).sort({ cycleStartDate: -1 });

    if (!lastPeriod) {
      return res.status(404).json({
        success: false,
        message: 'No period data found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        predictedNextPeriod: lastPeriod.predictedNextPeriod,
        predictedOvulation: lastPeriod.predictedOvulation,
        cycleLength: lastPeriod.cycleLength
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
