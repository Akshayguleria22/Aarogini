import express from 'express';
import axios from 'axios';

const router = express.Router();

const fallbackArticles = [
  {
    title: 'Women’s health: building healthier futures',
    description: 'A look at current priorities in women’s health and wellness research.',
    url: 'https://www.who.int/health-topics/womens-health',
    image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=1200&h=800&fit=crop',
    source: { name: 'WHO' },
    publishedAt: new Date().toISOString()
  },
  {
    title: 'Nutrition essentials for women’s health',
    description: 'Evidence-based nutrition guidance for different life stages.',
    url: 'https://www.cdc.gov/nutrition/index.html',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&h=800&fit=crop',
    source: { name: 'CDC' },
    publishedAt: new Date().toISOString()
  }
];

// @route   GET /api/news
// @desc    Fetch external health news articles
// @access  Public
router.get('/', async (req, res) => {
  const query = req.query.q || 'women health wellness';
  const limit = Math.min(parseInt(req.query.limit || '10', 10), 10);
  const apiKey = process.env.GNEWS_API_KEY;

  if (!apiKey) {
    return res.status(200).json({
      success: false,
      message: 'GNEWS_API_KEY not configured. Using fallback articles.',
      data: fallbackArticles
    });
  }

  try {
    const response = await axios.get('https://gnews.io/api/v4/search', {
      params: {
        q: query,
        lang: 'en',
        max: limit,
        token: apiKey
      }
    });

    return res.status(200).json({
      success: true,
      data: response.data.articles || []
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error.response?.data?.message || 'Failed to fetch news. Using fallback articles.',
      data: fallbackArticles
    });
  }
});

export default router;
