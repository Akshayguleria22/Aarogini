const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/ChatMessage');
const { protect } = require('../middleware/auth');
const { qaAnswer } = require('../services/modelService');
const User = require('../models/User');
const PeriodTracker = require('../models/PeriodTracker');
const HealthJournal = require('../models/HealthJournal');
const Medicine = require('../models/Medicine');

// Helper function to get user context
const getUserContext = async (userId) => {
  const user = await User.findById(userId).select('name email healthProfile detectedConditions');
  const periods = await PeriodTracker.find({ userId }).sort({ cycleStartDate: -1 }).limit(3).lean();
  const journals = await HealthJournal.find({ userId }).sort({ date: -1 }).limit(5).lean();
  const medicines = await Medicine.find({ userId, isActive: true }).lean();

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

    // Use trained QA model only
    let botText = '';
    try {
      botText = await qaAnswer(text);
    } catch (mlErr) {
      console.warn('QA model failed:', mlErr.message);
      botText = generateBotResponse(text);
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
    const ctx = await getUserContext(req.user.id);
    const tips = [];
    if (ctx.includes('Detected Health Conditions')) tips.push('Review your detected conditions and follow the WHO guidelines we surface in the reports tab.');
    if (ctx.includes('Recent Menstrual Cycles')) tips.push('Track cycle symptoms to identify patterns and discuss with your provider if needed.');
    if (ctx.includes('Current Medications')) tips.push('Keep your medication list up to date and set reminders to maintain adherence.');
    if (tips.length < 3) {
      tips.push('Aim for 7–8 hours of sleep, balanced meals, and regular physical activity.');
      tips.push('Schedule periodic health checkups and record results in the app to see trends.');
      tips.push('Manage stress with brief daily mindfulness or breathing exercises.');
    }
    res.status(200).json({ success: true, data: tips.slice(0, 5).join('\n• ') });
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

// Helper function to generate bot responses
function generateBotResponse(userMessage) {
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('period') || lowerMessage.includes('menstrual')) {
    return "I can help you track your period and understand your cycle better. The Period Tracker feature allows you to log your cycle dates, symptoms, and mood. Would you like tips on managing period symptoms?";
  } else if (lowerMessage.includes('stress') || lowerMessage.includes('anxiety')) {
    return "Managing stress is crucial for overall wellness. Try these tips: Practice deep breathing, maintain a regular sleep schedule, engage in physical activity, and consider meditation. Would you like more specific guidance?";
  } else if (lowerMessage.includes('medicine') || lowerMessage.includes('medication')) {
    return "You can use our Medicine Search feature to find information about medications. Always consult with a healthcare professional before starting any new medication. Is there something specific you'd like to know?";
  } else if (lowerMessage.includes('health') || lowerMessage.includes('wellness')) {
    return "Holistic wellness includes physical, mental, and emotional health. I recommend: regular exercise, balanced nutrition, adequate sleep, stress management, and regular health check-ups. What aspect would you like to explore?";
  } else if (lowerMessage.includes('report') || lowerMessage.includes('record')) {
    return "Our Report Record feature helps you maintain all your medical reports in one place. Keeping organized health records is important for tracking your wellness journey. Would you like guidance on what to track?";
  } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hello! I'm here to support your wellness journey. Feel free to ask me about period tracking, stress management, healthy habits, or any wellness-related questions!";
  } else if (lowerMessage.includes('thank')) {
    return "You're welcome! I'm always here to help with your wellness journey. Is there anything else you'd like to know?";
  } else {
    return "That's an interesting question! While I'm here to help with wellness, period tracking, stress management, and healthy lifestyle tips, I recommend consulting with healthcare professionals for specific medical advice. How else can I assist you today?";
  }
}

module.exports = router;
