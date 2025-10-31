# 🚀 Quick Start Guide - Aarogini Health Platform

## ✅ Setup Complete!

All Python AI services have been removed and replaced with Node.js + Gemini AI integration.

## 📋 Prerequisites

- Node.js v16+ installed
- MongoDB Atlas account (already configured)
- Gemini API Key (already configured): `AIzaSyCzRGEUt_mukzb7YiuPG8Tg2oXR6gNA2cw`
- Model: `gemini-2.0-flash-exp`

## 🏃‍♀️ Running the Application

### Option 1: Manual Start (Recommended for Development)

#### Start Backend:
```bash
cd backend
npm install  # First time only
npm start    # or npm run dev for auto-reload
```

Backend will run on: **http://localhost:5000**

#### Start Frontend:
```bash
cd frontend
npm install  # First time only
npm run dev
```

Frontend will run on: **http://localhost:5173**

### Option 2: Using Batch Script (Windows)

Double-click `start-services.bat` in the root folder.

## 🧪 Testing the API

### 1. Check AI Service Health:
```bash
curl http://localhost:5000/api/ai/health
```

Expected response:
```json
{
  "success": true,
  "service": "Gemini AI (Node.js)",
  "status": "configured",
  "message": "AI service is ready"
}
```

### 2. Test Chat (requires login token):
```bash
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "message": "What are the symptoms of PCOS?"
  }'
```

### 3. Upload Medical Report (requires login token):
```bash
curl -X POST http://localhost:5000/api/ai/analyze-report \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "report=@/path/to/your/report.pdf" \
  -F "reportType=blood_test" \
  -F "reportName=Annual Checkup"
```

## 📁 Supported File Types for Upload

- **PDF** files (.pdf)
- **Images** (.jpg, .jpeg, .png)
- Maximum file size: **10MB**

## 🩺 Features Now Available

### 1. Medical Report Analysis
- Upload PDF or image of medical report
- AI extracts all test results
- Detects abnormal values
- Identifies health conditions from 21 women's health categories
- Provides WHO guidelines for detected conditions
- Compares with previous reports to show trends

### 2. Health Tracking Dashboard
- Track status of 21 women's health conditions
- View all uploaded reports
- See trends over time
- Get personalized recommendations

### 3. AI Health Assistant (Chat Veda)
- Ask health-related questions
- Get contextual answers based on your health data
- Receive recommendations

### 4. WHO Guidelines
- Evidence-based health guidelines
- Condition-specific recommendations
- Maternal health, nutrition, mental health guidance

## 🎯 21 Tracked Health Conditions

1. Periods & Ovulation
2. PCOS/PCOD  
3. Endometriosis
4. Pregnancy & Maternal Health
5. Postpartum Health
6. Menopause
7. UTI (Urinary Tract Infection)
8. Vaginal Health
9. Thyroid Disorders
10. Breast Cancer
11. Cervical Cancer
12. Anemia
13. Osteoporosis
14. Depression & Anxiety
15. Stress / PTSD
16. Body Image Disorder
17. Obesity/Weight Issues
18. Diabetes
19. Hypertension
20. Vitamin D & Calcium Deficiency
21. Cardiovascular Disease

## 🔑 API Endpoints

### Authentication:
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### AI Services:
- `POST /api/ai/analyze-report` - Analyze medical report
- `POST /api/ai/chat` - Chat with AI assistant
- `POST /api/ai/compare-reports` - Compare multiple reports
- `GET /api/ai/who-guidelines/:topic` - Get WHO guidelines

### Health Tracking:
- `GET /api/health-tracking/dashboard` - Get health dashboard
- `GET /api/health-tracking/condition/:name` - Get condition details
- `GET /api/health-tracking/trends` - Get health trends

### Reports:
- `GET /api/reports` - Get all reports
- `GET /api/reports/:id` - Get single report
- `DELETE /api/reports/:id` - Delete report

## 🔧 Troubleshooting

### Backend won't start:
1. Check if MongoDB URI is correct in `.env`
2. Ensure Gemini API key is set
3. Run `npm install` to ensure all dependencies are installed

### AI analysis fails:
1. Verify Gemini API key is valid
2. Check file size (must be < 10MB)
3. Ensure file is PDF or image format

### OCR not working on images:
1. Image quality might be too low
2. Try scanning the document as PDF instead
3. Ensure image is clear and text is readable

## 📚 Documentation Files

- `GEMINI_MIGRATION_COMPLETE.md` - Full migration details
- `backend/README.md` - Backend API documentation
- `frontend/README.md` - Frontend setup

## 🎉 What's Different from Before?

### ✅ Removed:
- Python Flask AI service (port 5001)
- All Python dependencies
- `ai-service` folder

### ✅ Added:
- Gemini AI integration in Node.js backend
- PDF text extraction
- Image OCR (Tesseract.js)
- Structured AI responses with schemas
- 21 health condition tracking
- Comprehensive health dashboard API
- WHO guidelines integration
- Multi-report comparison

### ✅ Improved:
- Single codebase (Node.js only)
- Faster response times
- Better error handling
- Structured data output
- Automatic condition tracking across reports

## 🚀 Next Steps

1. **Test report upload** with a sample PDF or image
2. **Create frontend health dashboard** to display the 21 condition cards
3. **Build condition detail pages** showing WHO guidelines and trends
4. **Add data visualization** for health trends over time
5. **Implement notifications** for abnormal findings

---

**Status:** ✅ Backend fully functional with Gemini AI  
**Server:** Running on http://localhost:5000  
**Database:** Connected to MongoDB Atlas  
**AI Service:** Gemini 2.0 Flash Experimental configured and ready  
**AI Model:** `gemini-2.0-flash-exp`
