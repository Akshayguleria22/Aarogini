const express = require('express');
const router = express.Router();
const HealthJournal = require('../models/HealthJournal');
const { protect } = require('../middleware/auth');

// @route   POST /api/health
// @desc    Create a new health journal entry
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const entry = await HealthJournal.create({
      user: req.user.id,
      ...req.body
    });

    res.status(201).json({
      success: true,
      message: 'Health journal entry created successfully',
      data: entry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/health
// @desc    Get all health journal entries
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { category, startDate, endDate } = req.query;
    
    let query = { user: req.user.id };
    
    if (category) {
      query.category = category;
    }
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const entries = await HealthJournal.find(query).sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: entries.length,
      data: entries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/health/:id
// @desc    Get single health journal entry
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const entry = await HealthJournal.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found'
      });
    }

    if (entry.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    res.status(200).json({
      success: true,
      data: entry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/health/:id
// @desc    Update health journal entry
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let entry = await HealthJournal.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found'
      });
    }

    if (entry.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    entry = await HealthJournal.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Entry updated successfully',
      data: entry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/health/:id
// @desc    Delete health journal entry
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const entry = await HealthJournal.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found'
      });
    }

    if (entry.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    await entry.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Entry deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
