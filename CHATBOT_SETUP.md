# ChatBot OpenAI Integration - Setup Guide

## Overview
Chat Veda is now powered by OpenAI's GPT model and has access to user health data for personalized responses.

## Features Implemented

### 🤖 AI-Powered Responses
- **GPT-3.5-turbo** integration for intelligent, context-aware responses
- Natural language understanding of health queries
- Empathetic and culturally sensitive communication

### 📊 User Data Integration
The chatbot can access and analyze:
- **Period Tracking Data**: Recent cycles, symptoms, patterns
- **Health Journal Entries**: Mood, symptoms, daily wellness notes
- **Medicine Information**: Current medications and schedules
- **Medical Reports**: (Future enhancement)

### 💬 Conversation Features
- **Session Management**: Persistent chat sessions across page refreshes
- **Conversation History**: AI remembers context from previous messages in the session
- **Quick Actions**: Pre-defined queries for common health topics
- **Health Insights**: AI-generated personalized health recommendations

### 🔐 Security & Privacy
- **JWT Authentication**: Secure API access
- **User-specific Data**: Only accesses logged-in user's data
- **Privacy-first**: Health data never leaves the secure backend

## Setup Instructions

### 1. Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to **API Keys** section
4. Click **"Create new secret key"**
5. Copy the key (it starts with `sk-`)

### 2. Configure Backend

Add your OpenAI API key to `backend/.env`:

```env
OPENAI_API_KEY=sk-your-actual-api-key-here
```

**Important**: Never commit this file to Git!

### 3. Install Dependencies

Backend dependencies are already installed:
- `openai` package for OpenAI API integration

### 4. Start Backend Server

```bash
cd backend
node index.js
```

You should see:
```
🚀 Server is running on http://localhost:5000
```

### 5. Start Frontend

```bash
cd frontend
npm run dev
```

## How It Works

### Architecture

```
User Message → Frontend ChatBot Component
                    ↓
              Chat Service API
                    ↓
           Backend Chat Routes
                    ↓
          OpenAI Service Layer
                    ↓
    [Fetch User Data] + [OpenAI API Call]
                    ↓
        AI-Generated Response
                    ↓
         Save to Database
                    ↓
      Return to Frontend
```

### AI Training & Context

The chatbot is "trained" through:

1. **System Prompt** (`services/openaiService.js`):
   - Defines Chat Veda's personality and knowledge areas
   - Sets guidelines for medical advice (always recommend professionals)
   - Specifies response formatting and tone

2. **User Context Injection**:
   ```javascript
   // AI receives this with every message:
   - User's recent period cycles
   - Health journal entries
   - Current medications
   - Symptoms history
   ```

3. **Conversation Memory**:
   - Last 10 messages are sent to OpenAI for context
   - Enables coherent multi-turn conversations

### API Endpoints

#### 1. Send Message
```http
POST /api/chat/message
Authorization: Bearer <token>
Content-Type: application/json

{
  "sessionId": "session_123456",
  "text": "What can you tell me about my period cycle?"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "sender": "user",
      "text": "What can you tell me about my period cycle?",
      "timestamp": "2025-10-31T10:30:00Z"
    },
    {
      "sender": "bot",
      "text": "Based on your data, I can see you've tracked 3 cycles...",
      "timestamp": "2025-10-31T10:30:02Z"
    }
  ]
}
```

#### 2. Get Health Insights
```http
POST /api/chat/insights
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": "Based on your health data:\n\n1. Your menstrual cycle appears regular...\n2. Consider tracking more symptoms..."
}
```

#### 3. Get Chat History
```http
GET /api/chat/history/:sessionId
Authorization: Bearer <token>
```

## Customization

### Modify AI Behavior

Edit `backend/services/openaiService.js`:

```javascript
const SYSTEM_PROMPT = `You are "Chat Veda"...
// Add your custom instructions here
- Be more technical
- Focus on specific health areas
- Change tone and style
`;
```

### Change AI Model

In `openaiService.js`:

```javascript
const completion = await openai.chat.completions.create({
  model: "gpt-4", // Upgrade to GPT-4 for better responses
  // or "gpt-3.5-turbo" for faster/cheaper
});
```

### Adjust Response Length

```javascript
max_tokens: 500, // Increase for longer responses
temperature: 0.7, // 0.0 = focused, 1.0 = creative
```

## Cost Management

### OpenAI Pricing (as of 2024)
- **GPT-3.5-turbo**: ~$0.002 per 1K tokens (~750 words)
- **GPT-4**: ~$0.03 per 1K tokens

### Cost Optimization
1. **Token Limits**: Set `max_tokens` appropriately
2. **Conversation History**: Limited to last 10 messages
3. **Caching**: Future enhancement - cache common responses
4. **Rate Limiting**: Add rate limits per user

## Testing

### Test Chat Without Login
The chatbot detects if the user is logged in:
- **Not logged in**: Provides general health information
- **Logged in**: Accesses user data for personalized responses

### Test with User Data

1. **Login/Register** on the platform
2. **Add Period Data**: Use Period Tracker
3. **Add Health Journal**: Log some daily entries
4. **Chat with AI**: Ask "What can you tell me about my health?"

### Sample Test Queries

```
"Tell me about my recent period cycles"
"What symptoms have I been tracking?"
"Give me wellness tips based on my data"
"What medicines am I currently taking?"
"Help me understand my menstrual cycle patterns"
```

## Troubleshooting

### Error: "Invalid API key"
- Check `.env` file has correct `OPENAI_API_KEY`
- Restart backend server after adding the key
- Verify key format: `sk-...`

### Error: "Rate limit exceeded"
- OpenAI has usage limits per minute/day
- Wait a few moments and try again
- Check your OpenAI account quota

### Error: "Failed to send message"
- Check backend server is running
- Verify user is logged in (JWT token present)
- Check browser console for detailed errors

### No Personalized Responses
- Ensure user has added health data (periods, journal, medicines)
- Check backend logs for data fetching errors
- Verify MongoDB connection is active

## Future Enhancements

### Planned Features
- [ ] **Voice Input**: Speak to Chat Veda
- [ ] **Multi-language Support**: Hindi, Spanish, etc.
- [ ] **Medical Report Analysis**: AI can read uploaded reports
- [ ] **Appointment Scheduling**: Integration with calendar
- [ ] **Emergency Detection**: Detect urgent concerns and suggest action
- [ ] **Symptom Checker**: Interactive symptom assessment
- [ ] **Nutrition Recommendations**: Meal planning based on health data
- [ ] **Exercise Plans**: Personalized workout suggestions

### RAG (Retrieval-Augmented Generation)
Train the bot with medical documents:
```javascript
// Future implementation
- Vector database (Pinecone, Weaviate)
- Medical literature embeddings
- Custom health knowledge base
```

## Security Best Practices

1. **Never expose API keys** in frontend code
2. **Rate limit** chat endpoints to prevent abuse
3. **Validate user input** before sending to OpenAI
4. **Monitor costs** - set up OpenAI usage alerts
5. **HIPAA Compliance** - consider OpenAI's data policies
6. **User consent** - inform users about AI usage

## Support

For issues or questions:
- Check backend logs: `backend/` terminal
- Check frontend console: Browser DevTools
- Review OpenAI API status: https://status.openai.com/

## License & Compliance

- OpenAI API usage subject to OpenAI Terms of Service
- User health data handled per platform privacy policy
- AI responses are informational, not medical advice

---

**Note**: Always remind users to consult healthcare professionals for medical decisions. The AI is a wellness assistant, not a replacement for medical care.
