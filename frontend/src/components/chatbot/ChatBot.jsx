import React, { useState, useRef, useEffect } from 'react'
import { sendChatMessage, generateSessionId, getHealthInsights } from '../../services/chatService'

const ChatBot = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm Chat Veda, your AI-powered health assistant. I'm connected to advanced AI (via OpenRouter) and have access to your health data to provide personalized advice. How can I help you today?",
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [sessionId] = useState(() => {
    // Use existing session or create new one
    const stored = localStorage.getItem('chatSessionId')
    if (stored) return stored
    const newId = generateSessionId()
    localStorage.setItem('chatSessionId', newId)
    return newId
  })
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const quickActions = [
    { icon: '🩸', label: 'Period Tracking', query: 'Tell me about period tracking' },
    { icon: '🤰', label: 'Pregnancy Care', query: 'I need pregnancy care advice' },
    { icon: '💊', label: 'Medicine Info', query: 'Help me with medicine information' },
    { icon: '🧘‍♀️', label: 'Wellness Tips', query: 'Give me wellness tips' },
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Get personalized health insights
  const handleGetInsights = async () => {
    setIsTyping(true)
    setError(null)

    try {
      const result = await getHealthInsights()
      
      if (result.success) {
        const insightMsg = {
          id: messages.length + 1,
          text: `📊 **Your Personalized Health Insights:**\n\n${result.data}`,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        setMessages(prev => [...prev, insightMsg])
      } else {
        setError(result.error || 'Failed to fetch insights')
      }
    } catch (err) {
      console.error('Insights error:', err)
      setError('Failed to fetch health insights')
    } finally {
      setIsTyping(false)
    }
  }

  const handleSendMessage = async () => {
    if (inputMessage.trim() === '') return

    const userMsg = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMsg])
    const messageToSend = inputMessage
    setInputMessage('')
    setIsTyping(true)
    setError(null)

    try {
      // Check if user is authenticated
      const token = localStorage.getItem('token')
      
      if (!token) {
        // If not authenticated, show login message
        const botMsg = {
          id: messages.length + 2,
          text: "To get personalized health insights based on your data, please log in or create an account. I can still answer general health questions!",
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        setMessages(prev => [...prev, botMsg])
        setIsTyping(false)
        return
      }

      // Send message to backend with OpenAI
      const response = await sendChatMessage(sessionId, messageToSend)

      if (response.success && response.data) {
        // Get the bot's response from the API
        const botMessage = response.data.find(msg => msg.sender === 'bot')
        
        if (botMessage) {
          const botMsg = {
            id: messages.length + 2,
            text: botMessage.text,
            sender: 'bot',
            timestamp: new Date(botMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
          setMessages(prev => [...prev, botMsg])
        }
      } else {
        // Fallback to local response if API fails
        const fallbackMsg = {
          id: messages.length + 2,
          text: "I'm having trouble connecting to my AI brain right now. Please try again in a moment. In the meantime, I can still provide basic information about period tracking, wellness, and platform features!",
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        setMessages(prev => [...prev, fallbackMsg])
        setError(response.error)
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMsg = {
        id: messages.length + 2,
        text: "Sorry, I encountered an error. Please check your connection and try again.",
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, errorMsg])
      setError('Failed to send message')
    } finally {
      setIsTyping(false)
    }
  }

  const handleQuickAction = (query) => {
    setInputMessage(query)
    setTimeout(() => handleSendMessage(), 100)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Chat Window */}
      <div className="fixed bottom-4 right-4 z-50 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-fast">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <span className="text-2xl">🤖</span>
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Chat Veda</h3>
              <p className="text-white/80 text-xs">AI Health Assistant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="p-3 bg-purple-50 border-b border-purple-100">
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(action.query)}
                className="flex items-center gap-2 p-2 bg-white rounded-lg hover:bg-purple-100 transition-colors text-sm"
              >
                <span className="text-lg">{action.icon}</span>
                <span className="text-gray-700 font-medium">{action.label}</span>
              </button>
            ))}
          </div>
          
          {/* Health Insights Button */}
          <button
            onClick={handleGetInsights}
            className="w-full mt-2 flex items-center justify-center gap-2 p-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"
          >
            <span>📊</span>
            <span>Get My Health Insights</span>
          </button>

          {/* Error Display */}
          {error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                <div
                  className={`rounded-2xl p-3 ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white'
                      : 'bg-white text-gray-800 shadow-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line leading-relaxed">{message.text}</p>
                </div>
                <p className={`text-xs text-gray-400 mt-1 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  {message.timestamp}
                </p>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl p-3 shadow-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              rows="1"
              style={{ maxHeight: '100px' }}
            />
            <button
              onClick={handleSendMessage}
              disabled={inputMessage.trim() === ''}
              className="bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl px-4 py-2 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Powered by OpenAI GPT. Chat Veda provides personalized information based on your data. Always consult healthcare professionals for medical advice.
          </p>
        </div>
      </div>
    </>
  )
}

export default ChatBot
