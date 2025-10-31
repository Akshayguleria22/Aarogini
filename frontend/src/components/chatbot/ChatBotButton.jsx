import React from 'react'

import { useState, useRef, useEffect } from 'react'

const ChatBot = ({ onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm Chat Veda, your AI wellness assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const quickReplies = [
    "Period tracking tips",
    "Wellness advice",
    "Stress management",
    "Healthy lifestyle"
  ]

  const getBotResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase()
    
    if (lowerMessage.includes('period') || lowerMessage.includes('menstrual')) {
      return "I can help you track your period and understand your cycle better. The Period Tracker feature allows you to log your cycle dates, symptoms, and mood. Would you like tips on managing period symptoms?"
    } else if (lowerMessage.includes('stress') || lowerMessage.includes('anxiety')) {
      return "Managing stress is crucial for overall wellness. Try these tips: Practice deep breathing, maintain a regular sleep schedule, engage in physical activity, and consider meditation. Would you like more specific guidance?"
    } else if (lowerMessage.includes('medicine') || lowerMessage.includes('medication')) {
      return "You can use our Medicine Search feature to find information about medications. Always consult with a healthcare professional before starting any new medication. Is there something specific you'd like to know?"
    } else if (lowerMessage.includes('health') || lowerMessage.includes('wellness')) {
      return "Holistic wellness includes physical, mental, and emotional health. I recommend: regular exercise, balanced nutrition, adequate sleep, stress management, and regular health check-ups. What aspect would you like to explore?"
    } else if (lowerMessage.includes('report') || lowerMessage.includes('record')) {
      return "Our Report Record feature helps you maintain all your medical reports in one place. Keeping organized health records is important for tracking your wellness journey. Would you like guidance on what to track?"
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return "Hello! I'm here to support your wellness journey. Feel free to ask me about period tracking, stress management, healthy habits, or any wellness-related questions!"
    } else if (lowerMessage.includes('thank')) {
      return "You're welcome! I'm always here to help with your wellness journey. Is there anything else you'd like to know?"
    } else {
      return "That's an interesting question! While I'm here to help with wellness, period tracking, stress management, and healthy lifestyle tips, I recommend consulting with healthcare professionals for specific medical advice. How else can I assist you today?"
    }
  }

  const handleSend = () => {
    if (inputValue.trim() === '') return

    const userMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages([...messages, userMessage])
    setInputValue('')
    setIsTyping(true)

    // Simulate bot typing and response
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: getBotResponse(inputValue),
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botResponse])
      setIsTyping(false)
    }, 1500)
  }

  const handleQuickReply = (reply) => {
    setInputValue(reply)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl h-[85vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">Chat Veda</h2>
                <p className="text-sm text-white/80">AI Wellness Assistant</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-300 flex items-center justify-center backdrop-blur-sm"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-purple-50/30 to-pink-50/30">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-5 py-3 ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white'
                    : 'bg-white shadow-md text-gray-800 border border-purple-100'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.text}</p>
                <p className={`text-xs mt-1 ${
                  message.sender === 'user' ? 'text-white/70' : 'text-gray-400'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-white shadow-md rounded-2xl px-5 py-3 border border-purple-100">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies */}
        {messages.length <= 2 && (
          <div className="px-6 py-3 bg-white/80 backdrop-blur-sm border-t border-purple-100">
            <p className="text-xs text-gray-500 mb-2">Quick replies:</p>
            <div className="flex flex-wrap gap-2">
              {quickReplies.map((reply, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickReply(reply)}
                  className="px-4 py-2 text-xs bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 text-purple-700 rounded-full transition-all duration-300 font-medium"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-purple-100">
          <div className="flex space-x-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 px-5 py-3 bg-gray-50 border border-purple-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 text-sm"
            />
            <button
              onClick={handleSend}
              disabled={inputValue.trim() === ''}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-full hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatBot
