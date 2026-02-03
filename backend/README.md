# 🌸 Aarogini Backend Setup Guide

## Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn
 - Python 3.10+ (only required if you run the ML service locally)

## 📦 Installation Steps

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. MongoDB Setup

#### Option A: Local MongoDB
1. Install MongoDB Community Edition from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Start MongoDB service:
   ```bash
   # Windows
   net start MongoDB
   
   # Mac
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

#### Option B: MongoDB Atlas (Cloud)
1. Create free account at [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a new cluster
3. Get your connection string
4. Update `.env` file with your connection string

### 3. Environment Variables
Copy `.env.example` to `.env` and set values:
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/aarogini
JWT_SECRET=your_secret
JWT_EXPIRE=30d
CLIENT_URL=http://localhost:5173
GROQ_API_KEY=your_groq_key
OPENFDA_API_KEY=optional
GNEWS_API_KEY=optional
ML_BASE_URL=http://127.0.0.1:8000
```

### 4. Start the Server

#### Development Mode (with auto-reload):
```bash
npm run dev
```

#### Production Mode:
```bash
npm start
```

Server will run on: **http://localhost:5000**

## 📚 Database Models Created

### 1. **User** - User authentication and profiles
- Email/password authentication
- JWT token-based auth
- Profile management

### 2. **PeriodTracker** - Period cycle tracking
- Cycle dates and length
- Symptoms and mood tracking
- Predictions for next period and ovulation

### 3. **MedicalReport** - Medical report storage
- Upload and manage reports
- Test results tracking
- Share reports with doctors

### 4. **Medicine** - Medicine database
- Medicine information
- Search functionality
- Dosage and side effects

### 5. **ChatMessage** - Chatbot conversations
- Save chat history
- Session management
- AI response storage

### 6. **HealthJournal** - Daily health tracking
- Health metrics (weight, BP, heart rate)
- Mood and sleep tracking
- Exercise and nutrition logs

### 7. **Article** - Wellness articles
- Educational content
- Categories and tags
- Views and likes tracking

## 🛣️ API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `GET /me` - Get current user
- `PUT /updatepassword` - Update password

### User Routes (`/api/users`)
- `GET /profile` - Get user profile
- `PUT /profile` - Update profile
- `DELETE /profile` - Delete account

### Period Tracker Routes (`/api/periods`)
- `POST /` - Create period entry
- `GET /` - Get all entries
- `GET /:id` - Get single entry
- `PUT /:id` - Update entry
- `DELETE /:id` - Delete entry
- `GET /predictions/next` - Get predictions

### Medical Reports Routes (`/api/reports`)
- `POST /` - Upload report
- `GET /` - Get all reports
- `GET /:id` - Get single report
- `PUT /:id` - Update report
- `DELETE /:id` - Delete report

### Medicine Routes (`/api/medicines`)
- `GET /search` - Search medicines
- `GET /` - Get all medicines
- `GET /:id` - Get single medicine
- `POST /` - Create medicine (Admin)
- `PUT /:id` - Update medicine (Admin)
- `DELETE /:id` - Delete medicine (Admin)

### Chat Routes (`/api/chat`)
- `POST /message` - Send message
- Note: Chat uses Groq (Llama) only when configured
- `GET /history/:sessionId` - Get chat history
- `GET /sessions` - Get all sessions
- `DELETE /session/:sessionId` - Delete session

### Health Journal Routes (`/api/health`)
- `POST /` - Create entry
- `GET /` - Get all entries
- `GET /:id` - Get single entry
- `PUT /:id` - Update entry
- `DELETE /:id` - Delete entry

### Article Routes (`/api/articles`)
- `GET /` - Get all articles
- `GET /:slug` - Get single article
- `POST /` - Create article (Admin)
- `PUT /:id` - Update article (Admin)
- `DELETE /:id` - Delete article (Admin)
- `POST /:id/like` - Like article

## 🔐 Authentication
Most routes require JWT authentication. Include token in headers:
```javascript
headers: {
  'Authorization': 'Bearer YOUR_JWT_TOKEN'
}
```

## 🧪 Testing the API

### Using Postman or Thunder Client:

1. **Register a user:**
   ```
   POST http://localhost:5000/api/auth/register
   Body: {
     "name": "Test User",
     "email": "test@example.com",
     "password": "password123"
   }
   ```

2. **Login:**
   ```
   POST http://localhost:5000/api/auth/login
   Body: {
     "email": "test@example.com",
     "password": "password123"
   }
   ```

3. **Use the returned token** in Authorization header for protected routes

## 📁 Project Structure
```
backend/
├── config/
│   └── database.js          # MongoDB connection
├── middleware/
│   └── auth.js              # Authentication middleware
├── models/
│   ├── User.js              # User model
│   ├── PeriodTracker.js     # Period tracking model
│   ├── MedicalReport.js     # Medical reports model
│   ├── Medicine.js          # Medicine database model
│   ├── ChatMessage.js       # Chat history model
│   ├── HealthJournal.js     # Health journal model
│   └── Article.js           # Articles model
├── routes/
│   ├── authRoutes.js        # Authentication routes
│   ├── userRoutes.js        # User profile routes
│   ├── periodRoutes.js      # Period tracker routes
│   ├── reportRoutes.js      # Medical reports routes
│   ├── medicineRoutes.js    # Medicine search routes
│   ├── chatRoutes.js        # Chatbot routes
│   ├── healthRoutes.js      # Health journal routes
│   └── articleRoutes.js     # Articles routes
├── .env                     # Environment variables
├── .env.example            # Example environment file
├── index.js                # Server entry point
└── package.json            # Dependencies
```

## 🚀 Next Steps

1. Install dependencies: `npm install`
2. Make sure MongoDB is running
3. Start the server: `npm run dev`
4. Test the API endpoints
5. Connect frontend to backend API

## 🔧 Troubleshooting

### MongoDB Connection Error
- Make sure MongoDB is running
- Check connection string in `.env`
- For Atlas: Check if your IP is whitelisted

### Port Already in Use
- Change PORT in `.env` file
- Or kill the process using port 5000

### JWT Token Errors
- Make sure to include Bearer token in headers
- Check if token is expired (default: 7 days)

## 📝 Notes

- The backend is now fully set up with all necessary routes
- All models have validation and error handling
- JWT authentication is implemented
- CORS is configured for frontend connection
- Ready to integrate with React frontend!
- ML integration: the API will look for trained models under `Aarogini/models` and use `Aarogini/inference.py`. Report analysis responses include `mlPredictions` when sufficient features are present (e.g., Maternal Health Risk). 
