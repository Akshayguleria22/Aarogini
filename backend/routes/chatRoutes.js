const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/ChatMessage');
const { protect } = require('../middleware/auth');
const { chatFlow } = require('../services/geminiClient');
const User = require('../models/User');
const PeriodTracker = require('../models/PeriodTracker');
const HealthJournal = require('../models/HealthJournal');
const Medicine = require('../models/Medicine');

// Helper function to get user context
const getUserContext = async (userId) => {
  try {
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

    if (!contextStr) {
      return 'This is a new user with no health data logged yet. Guide them on how to get started with the platform features: Period Tracker, Health Journal, Medicine Tracker, and Report Analyzer.';
    }

    return contextStr;
  } catch (error) {
    console.error('Error fetching user context:', error);
    return '';
  }
};

// @route   POST /api/chat/message
// @desc    Send a chat message with Gemini AI
// @access  Private
router.post('/message', protect, async (req, res) => {
  try {
    const { sessionId, text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message text is required'
      });
    }

    let chatSession = await ChatMessage.findOne({ user: req.user.id, sessionId });

    if (!chatSession) {
      chatSession = await ChatMessage.create({
        user: req.user.id,
        sessionId,
        messages: []
      });
    }

    // Prepare conversation history (BEFORE adding new message)
    const conversationHistory = chatSession.messages
      .slice(-10)
      .map(msg => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
      .join('\n');

    // Add user message
    chatSession.messages.push({
      sender: 'user',
      text,
      timestamp: new Date()
    });

    try {
      // Get user context
      const userContext = await getUserContext(req.user.id);

      // Call Gemini AI via chatFlow
      console.log('Calling Gemini AI chatFlow...');
      const aiResponse = await chatFlow({
        message: text,
        conversationHistory,
        userContext
      });

      // Add AI response
      chatSession.messages.push({
        sender: 'bot',
        text: aiResponse.response,
        timestamp: new Date()
      });

      console.log('Gemini AI Response received successfully');

    } catch (aiError) {
      console.error('Gemini AI Error:', aiError.message);
      
      // Fallback to rule-based response if AI service fails
      const fallbackResponse = generateBotResponse(text);
      chatSession.messages.push({
        sender: 'bot',
        text: fallbackResponse + "\n\n_(Note: AI service is temporarily unavailable. This is a fallback response.)_",
        timestamp: new Date()
      });
    }

    chatSession.lastMessageAt = new Date();
    await chatSession.save();

    res.status(200).json({
      success: true,
      data: chatSession.messages.slice(-2) // Return last 2 messages (user + bot)
    });
  } catch (error) {
    console.error('Chat message error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/chat/insights
// @desc    Get personalized health insights using Gemini AI
// @access  Private
router.post('/insights', protect, async (req, res) => {
  try {
    // Get user context
    const userContext = await getUserContext(req.user.id);

    // Call Gemini AI for insights
    const response = await chatFlow({
      message: "Generate personalized health insights and recommendations based on my health data. Provide 3-5 specific, actionable insights.",
      userContext
    });

    res.status(200).json({
      success: true,
      data: response.response
    });
  } catch (error) {
    console.error('Insights generation error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate insights. Please try again later.'
    });
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
