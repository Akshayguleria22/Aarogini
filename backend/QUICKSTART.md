# 🎯 Aarogini Backend - Quick Start

## ⚡ Quick Setup (3 Steps)

### Step 1: Install MongoDB
**Choose one option:**

**Option A - Local MongoDB:**
- Download: https://www.mongodb.com/try/download/community
- Install and start MongoDB service

**Option B - MongoDB Atlas (Free Cloud):**
- Sign up: https://www.mongodb.com/cloud/atlas/register
- Create free cluster
- Get connection string
- Update in `.env` file

### Step 2: Start Backend Server
```powershell
cd backend
npm run dev
```

Server will run on: http://localhost:5000

### Step 3: Seed Database (Optional)
```powershell
npm run seed
```

This adds sample medicines and articles to the database.

## ✅ Verify Setup

Open browser and visit: http://localhost:5000

You should see:
```json
{
  "message": "🌸 Aarogini Wellness API",
  "version": "1.0.0",
  "status": "active"
}
```

## 📋 What's Been Created

### ✨ 7 Database Models:
1. **User** - Authentication & profiles
2. **PeriodTracker** - Period cycle tracking
3. **MedicalReport** - Medical records
4. **Medicine** - Medicine database
5. **ChatMessage** - Chatbot history
6. **HealthJournal** - Health tracking
7. **Article** - Wellness articles

### 🛣️ 8 API Route Groups:
- `/api/auth` - Login, Register, Password
- `/api/users` - Profile management
- `/api/periods` - Period tracking
- `/api/reports` - Medical reports
- `/api/medicines` - Medicine search
- `/api/chat` - Chatbot messages
- `/api/health` - Health journal
- `/api/articles` - Wellness articles

### 🔐 Security Features:
- JWT authentication
- Password hashing (bcrypt)
- Protected routes
- CORS configuration
- Input validation

## 🧪 Test API (Using Postman/Thunder Client)

### 1. Register User
```
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123",
  "phone": "1234567890"
}
```

### 2. Login
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

Copy the `token` from response.

### 3. Get Profile (Protected)
```
GET http://localhost:5000/api/users/profile
Authorization: Bearer YOUR_TOKEN_HERE
```

## 🔧 Configuration Files

- **`.env`** - Environment variables (MongoDB, JWT, etc.)
- **`.env.example`** - Template for environment variables
- **`README.md`** - Full documentation
- **`seed.js`** - Sample data seeder

## 📁 Folder Structure
```
backend/
├── config/          # Database configuration
├── middleware/      # Auth middleware
├── models/          # Mongoose models (7 models)
├── routes/          # API routes (8 route files)
├── .env            # Environment variables
├── index.js        # Server entry point
├── seed.js         # Database seeder
└── package.json    # Dependencies
```

## 🚀 Commands

```powershell
npm run dev      # Start development server (auto-reload)
npm start        # Start production server
npm run seed     # Populate database with sample data
```

## 💡 Next Steps

1. ✅ Backend is complete and running
2. 🔄 Connect React frontend to API
3. 🧪 Test all endpoints
4. 📱 Build frontend features with API integration

## 🆘 Common Issues

**MongoDB Connection Error:**
- Make sure MongoDB is running
- Check `.env` MONGODB_URI

**Port Already in Use:**
- Change PORT in `.env`
- Or: `netstat -ano | findstr :5000` (find process)
- Kill process: `taskkill /PID <process_id> /F`

**Module Not Found:**
- Run: `npm install`

## 📞 Support

Full documentation: `backend/README.md`
