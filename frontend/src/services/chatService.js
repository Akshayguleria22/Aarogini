import api from '../utils/api';

// Send a chat message
export const sendChatMessage = async (sessionId, message) => {
  try {
    const response = await api.post('/chat/message', {
      sessionId,
      text: message
    });
    return response.data;
  } catch (error) {
    console.error('Error sending chat message:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to send message'
    };
  }
};

// Get chat history
export const getChatHistory = async (sessionId) => {
  try {
    const response = await api.get(`/chat/history/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch chat history'
    };
  }
};

// Get all chat sessions
export const getChatSessions = async () => {
  try {
    const response = await api.get('/chat/sessions');
    return response.data;
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch chat sessions'
    };
  }
};

// Delete chat session
export const deleteChatSession = async (sessionId) => {
  try {
    const response = await api.delete(`/chat/session/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting chat session:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to delete chat session'
    };
  }
};

// Get personalized health insights
export const getHealthInsights = async () => {
  try {
    const response = await api.post('/chat/insights');
    return response.data;
  } catch (error) {
    console.error('Error fetching health insights:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch health insights'
    };
  }
};

// Generate a unique session ID
export const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
