const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getHealthIndicators,
  getHealthData,
  searchWomenHealthInfo,
  getWomenHealthGuidelines
} = require('../services/whoService');

// @route   GET /api/who/indicators
// @desc    Get WHO health indicators
// @access  Public
router.get('/indicators', async (req, res) => {
  try {
    const { topic } = req.query;
    const result = await getHealthIndicators(topic);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.status(200).json({
      success: true,
      count: result.data.length,
      data: result.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/who/data/:indicatorCode
// @desc    Get WHO health data by indicator
// @access  Public
router.get('/data/:indicatorCode', async (req, res) => {
  try {
    const { country, year } = req.query;
    const result = await getHealthData(req.params.indicatorCode, { country, year });

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.status(200).json({
      success: true,
      count: result.data.length,
      data: result.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/who/search
// @desc    Search WHO women's health information
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const result = await searchWomenHealthInfo(query);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/who/guidelines/:topic
// @desc    Get WHO guidelines for specific health topic
// @access  Public
router.get('/guidelines/:topic', async (req, res) => {
  try {
    const result = await getWomenHealthGuidelines(req.params.topic);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/who/guidelines
// @desc    Get all available WHO guideline topics
// @access  Public
router.get('/guidelines', async (req, res) => {
  try {
    const topics = [
      {
        topic: 'maternal_health',
        title: 'Maternal Health Guidelines',
        description: 'WHO recommendations for antenatal care, childbirth, and postnatal care'
      },
      {
        topic: 'reproductive_health',
        title: 'Reproductive Health Guidelines',
        description: 'WHO guidelines on contraception, family planning, and reproductive health services'
      },
      {
        topic: 'menstrual_health',
        title: 'Menstrual Health Guidelines',
        description: 'WHO recommendations for menstrual health and hygiene management'
      },
      {
        topic: 'nutrition',
        title: 'Nutrition Guidelines for Women',
        description: 'WHO nutritional recommendations for women of reproductive age'
      },
      {
        topic: 'pregnancy',
        title: 'Pregnancy Care Guidelines',
        description: 'WHO recommendations for positive pregnancy experience'
      },
      {
        topic: 'mental_health',
        title: 'Mental Health Guidelines',
        description: 'WHO mental health support guidelines for women'
      }
    ];

    res.status(200).json({
      success: true,
      count: topics.length,
      data: topics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
