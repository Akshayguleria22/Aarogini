import express from 'express';
const router = express.Router();
import ChatMessage from '../models/ChatMessage.js';
import { protect } from '../middleware/auth.js';
import { chatFlow } from '../services/groqClient.js';
import User from '../models/User.js';
import PeriodTracker from '../models/PeriodTracker.js';
import HealthJournal from '../models/HealthJournal.js';
import Medicine from '../models/Medicine.js';

// Helper function to get user context
const getUserContext = async (userId) => {
  const user = await User.findById(userId).select('name email healthProfile detectedConditions');
  const periods = await PeriodTracker.find({ user: userId }).sort({ cycleStartDate: -1 }).limit(3).lean();
  const journals = await HealthJournal.find({ user: userId }).sort({ date: -1 }).limit(5).lean();
  const medicines = await Medicine.find({ user: userId, isActive: true }).lean();

  let contextStr = '';
  if (user) {
    contextStr += `User: ${user.name}\n`;
    if (user.detectedConditions && user.detectedConditions.length > 0) {
      contextStr += `Detected Health Conditions: ${user.detectedConditions.join(', ')}\n`;
    }
  }

  if (periods && periods.length > 0) {
    contextStr += '\nRecent Menstrual Cycles:\n';
    periods.forEach((period, idx) => {
      const date = new Date(period.cycleStartDate).toLocaleDateString();
      contextStr += `- Cycle ${idx + 1}: Started ${date}, Length: ${period.cycleLength || 28} days`;
      if (period.symptoms && period.symptoms.length > 0) {
        contextStr += `, Symptoms: ${period.symptoms.join(', ')}`;
      }
      contextStr += '\n';
    });
  }

  if (journals && journals.length > 0) {
    contextStr += '\nRecent Health Journal Entries:\n';
    journals.slice(0, 3).forEach((entry) => {
      const date = new Date(entry.date).toLocaleDateString();
      contextStr += `- ${date}: ${entry.entry.substring(0, 100)}${entry.entry.length > 100 ? '...' : ''}\n`;
    });
  }

  if (medicines && medicines.length > 0) {
    contextStr += '\nCurrent Medications:\n';
    medicines.forEach((med) => {
      contextStr += `- ${med.name}: ${med.dosage}, ${med.frequency}\n`;
    });
  }

  return contextStr;
};

// @route   POST /api/chat/message
// @desc    Send a chat message and get response from trained QA retriever
// @access  Private
router.post('/message', protect, async (req, res) => {
  try {
    const { sessionId, text } = req.body;
    if (!sessionId || !text || text.trim() === '') {
      return res.status(400).json({ success: false, message: 'sessionId and text are required' });
    }

    let chatSession = await ChatMessage.findOne({ user: req.user.id, sessionId });
    if (!chatSession) {
      chatSession = await ChatMessage.create({ user: req.user.id, sessionId, messages: [] });
    }

    // Add user message
    chatSession.messages.push({ sender: 'user', text, timestamp: new Date() });

    // Use GROQ AI exclusively - no fallbacks to predefined responses
    let botText = '';

    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'AI service is not configured. Please contact support.'
      });
    }

    try {
      const userCtx = await getUserContext(req.user.id);

      console.log(`[chatRoutes] Using GROQ AI for user ${req.user.id} session ${sessionId}`);

      const resp = await chatFlow({
        message: text,
        conversationHistory: chatSession.messages.map(m => `${m.sender}: ${m.text}`).join('\n'),
        userContext: userCtx
      });

      botText = (resp && resp.response) ? resp.response : (typeof resp === 'string' ? resp : '');

      if (!botText || botText.trim() === '') {
        throw new Error('Empty response from Groq AI');
      }

      console.log(`[chatRoutes] GROQ response: ${botText.substring(0, 200)}...`);

    } catch (gErr) {
      console.error('GROQ AI error:', gErr.message);
      return res.status(500).json({
        success: false,
        message: 'AI service temporarily unavailable. Please try again in a moment.',
        error: gErr.message
      });
    }

    chatSession.messages.push({ sender: 'bot', text: botText, timestamp: new Date() });
    chatSession.lastMessageAt = new Date();
    await chatSession.save();

    res.status(200).json({ success: true, data: chatSession.messages.slice(-2) });
  } catch (error) {
    console.error('Chat message error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/chat/insights
// @desc    Get personalized health insights using Gemini AI
// @access  Private
router.post('/insights', protect, async (req, res) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({ success: false, message: 'AI service is not configured' });
    }
    const ctx = await getUserContext(req.user.id);
    const prompt = `Provide 5 concise, personalized health insights based on this user context. Use bullet points, each on a new line, and avoid medical diagnosis claims.\n\nUser Context:\n${ctx}`;
    const resp = await chatFlow({ message: prompt, userContext: ctx });
    res.status(200).json({ success: true, data: resp.response });
  } catch (error) {
    console.error('Insights generation error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate insights. Please try again later.' });
  }
});

// @route   GET /api/chat/history/:sessionId
// @desc    Get chat history
// @access  Private
router.get('/history/:sessionId', protect, async (req, res) => {
  try {
    const chatSession = await ChatMessage.findOne({
      user: req.user.id,
      sessionId: req.params.sessionId
    });

    if (!chatSession) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    res.status(200).json({
      success: true,
      data: chatSession.messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/chat/sessions
// @desc    Get all chat sessions for user
// @access  Private
router.get('/sessions', protect, async (req, res) => {
  try {
    const sessions = await ChatMessage.find({ user: req.user.id, isActive: true })
      .sort({ lastMessageAt: -1 })
      .select('sessionId lastMessageAt messages');

    res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/chat/session/:sessionId
// @desc    Delete chat session
// @access  Private
router.delete('/session/:sessionId', protect, async (req, res) => {
  try {
    const chatSession = await ChatMessage.findOne({
      user: req.user.id,
      sessionId: req.params.sessionId
    });

    if (!chatSession) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    chatSession.isActive = false;
    await chatSession.save();

    res.status(200).json({
      success: true,
      message: 'Chat session deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
