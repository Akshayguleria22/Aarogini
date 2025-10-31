const express = require('express');
const router = express.Router();
const Article = require('../models/Article');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/articles
// @desc    Get all published articles
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, featured, page = 1, limit = 10 } = req.query;

    let query = { isPublished: true };
    
    if (category) {
      query.category = category;
    }
    
    if (featured) {
      query.isFeatured = true;
    }

    const articles = await Article.find(query)
      .populate('author', 'name avatar')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ publishedAt: -1 });

    const count = await Article.countDocuments(query);

    res.status(200).json({
      success: true,
      count: articles.length,
      total: count,
      pages: Math.ceil(count / limit),
      currentPage: page,
      data: articles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/articles/:slug
// @desc    Get single article by slug
// @access  Public
router.get('/:slug', async (req, res) => {
  try {
    const article = await Article.findOne({ slug: req.params.slug }).populate('author', 'name avatar');

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    // Increment views
    article.views += 1;
    await article.save();

    res.status(200).json({
      success: true,
      data: article
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/articles
// @desc    Create a new article (Admin only)
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const article = await Article.create({
      ...req.body,
      author: req.user.id,
      publishedAt: req.body.isPublished ? new Date() : null
    });

    res.status(201).json({
      success: true,
      message: 'Article created successfully',
      data: article
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/articles/:id
// @desc    Update article (Admin only)
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Article updated successfully',
      data: article
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/articles/:id
// @desc    Delete article (Admin only)
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Article deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/articles/:id/like
// @desc    Like an article
// @access  Public
router.post('/:id/like', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    article.likes += 1;
    await article.save();

    res.status(200).json({
      success: true,
      data: { likes: article.likes }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
