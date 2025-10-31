# Aarogini - Women's Health Tracking Platform

## 🚀 Complete Migration to Node.js + Gemini AI

### ✅ Completed Changes

#### 1. **Removed Python AI Service**
- Deleted entire `ai-service` folder with Python Flask app
- Removed dependencies: `requirements.txt`, `report_analyzer.py`, `who_service.py`
- Integrated all AI functionality directly into Node.js backend

#### 2. **Integrated Google Gemini AI**
- **New Dependencies Added:**
  - `genkit` - Firebase Genkit for structured AI workflows
  - `@genkit-ai/google-genai` - Gemini AI integration
  - `pdf-parse` - Extract text from PDF files
  - `tesseract.js` - OCR for image text extraction (JPG, PNG)
  - `sharp` - Image preprocessing for better OCR results

#### 3. **New Backend Services**

**`services/geminiClient.js`**
- Structured AI flows using Genkit:
  - `analyzeReportFlow` - Comprehensive medical report analysis
  - `chatFlow` - Health assistant chat with context
  - `compareReportsFlow` - Multi-report trend analysis
- Uses Gemini 1.5 Flash model with structured schemas
- Detects 21 women's health conditions

**`services/reportExtractor.js`**
- Extracts text from PDF files
- OCR support for images (JPG, JPEG, PNG)
- Image preprocessing (grayscale, normalize, sharpen) for accurate OCR

**`services/whoService.js`**
- WHO guidelines for women's health
- Evidence-based recommendations
- Maternal health, reproductive health, nutrition, mental health guidelines

#### 4. **Updated Models**

**`models/MedicalReport.js`**
- Added AI analysis fields:
  - `patient_info` - Extracted patient data
  - `tests` - Structured test results with status (NORMAL/HIGH/LOW/ABNORMAL)
  - `abnormal_findings` - Detected issues with severity
  - `health_concerns` - AI-identified concerns
  - `tracking_recommendations` - What to monitor
  - `womens_health_indicators` - Women-specific markers
  - `detected_conditions` - Array of identified conditions
- Added `comparison` field for multi-report trends
- Added `whoGuidelines` field for relevant WHO data
- Added `extractedText` for storing OCR/PDF text

**`models/User.js`**
- Added `detectedConditions` array for tracking user's health conditions across reports
- Added `healthProfile` object:
  - height, weight, bloodType
  - allergies, chronicConditions, medications

#### 5. **Updated Routes**

**`routes/aiRoutes.js`** - Complete rewrite:
- `POST /api/ai/analyze-report` - Upload PDF/image, extract text, analyze with Gemini, save to DB
  - Supports both PDF and images (JPG, PNG)
  - Returns full AI analysis, WHO guidelines, comparison with previous reports
  - Automatically updates user's detected conditions
- `POST /api/ai/chat` - Chat with health assistant (with user context)
- `POST /api/ai/compare-reports` - Compare multiple reports, generate trends
- `GET /api/ai/who-guidelines/:topic` - Get WHO guidelines for specific topic
- `GET /api/ai/health` - Check AI service status

**`routes/healthTrackingRoutes.js`** - NEW:
- `GET /api/health-tracking/dashboard` - Comprehensive health dashboard
  - Status of all 21 health conditions
  - Recent abnormal findings
  - Tracking recommendations
  - Period tracking data
- `GET /api/health-tracking/condition/:name` - Detailed view of specific condition
  - All related reports
  - WHO guidelines
  - Timeline of test results
- `GET /api/health-tracking/trends` - Health parameter trends over time

#### 6. **21 Tracked Health Conditions**

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

#### 7. **Frontend Services Updated**

**`services/reportService.js`**
- Updated timeout for AI analysis (3 minutes)
- Enhanced error handling

**`services/healthTrackingService.js`** - NEW:
- `getHealthDashboard()` - Fetch complete health dashboard
- `getConditionDetails(conditionName)` - Get specific condition info
- `getHealthTrends()` - Get health trends over time

#### 8. **Configuration Updates**

**`backend/.env`**
```env
GEMINI_API_KEY='AIzaSyCzRGEUt_mukzb7YiuPG8Tg2oXR6gNA2cw'
GEMINI_MODEL='gemini-1.5-flash-latest'
```

**`start-services.bat`**
- Removed Python Flask service startup
- Only starts Node.js backend

### 🔧 How to Run

#### Backend Setup:
```bash
cd backend
npm install
npm start
```

#### Frontend Setup:
```bash
cd frontend
npm install
npm run dev
```

### 📡 API Endpoints

#### AI Services:
- `POST /api/ai/analyze-report` - Upload and analyze medical report (PDF/Image)
- `POST /api/ai/chat` - Chat with health assistant
- `POST /api/ai/compare-reports` - Compare multiple reports
- `GET /api/ai/who-guidelines/:topic` - Get WHO guidelines
- `GET /api/ai/health` - Check AI service health

#### Health Tracking:
- `GET /api/health-tracking/dashboard` - Complete health dashboard
- `GET /api/health-tracking/condition/:name` - Condition details
- `GET /api/health-tracking/trends` - Health trends

#### Reports:
- `GET /api/reports` - Get all user reports
- `GET /api/reports/:id` - Get single report
- `DELETE /api/reports/:id` - Delete report

### 🎯 Key Features

1. **Multi-Format Support**: Upload PDF or images (JPG, PNG) for analysis
2. **OCR Technology**: Extract text from images using Tesseract.js
3. **AI-Powered Analysis**: Gemini 1.5 Flash analyzes reports with structured output
4. **Disease Detection**: Automatically identifies 21 women's health conditions
5. **WHO Integration**: Fetches relevant WHO guidelines for detected conditions
6. **Trend Analysis**: Compare multiple reports to track health parameters over time
7. **Smart Tracking**: System remembers detected conditions across reports
8. **Conversational AI**: Chat assistant with user health context

### 🗄️ Database Schema

**MedicalReport Collection:**
- User reference
- Report metadata (type, name, date)
- Extracted text from file
- AI analysis (structured)
- Comparison with previous reports
- WHO guidelines
- Detected conditions

**User Collection:**
- Basic info
- Detected conditions array
- Health profile (height, weight, bloodType, allergies, etc.)

### 🚀 Next Steps for Frontend

1. **Create Health Dashboard Page:**
   - Display all 21 condition cards
   - Show status (detected/not detected)
   - Link to detailed condition pages

2. **Create Condition Detail Page:**
   - Show all related reports
   - Display WHO guidelines
   - Show timeline/trends
   - Recommendations

3. **Update Report Upload:**
   - Add file type validation (PDF, JPG, PNG)
   - Show analysis results with detected conditions
   - Display WHO guidelines
   - Show comparison with previous reports

4. **Add Trends Visualization:**
   - Charts for health parameters over time
   - Color-coded trends (improving/worsening/stable)

### 📦 Package.json Dependencies

```json
{
  "dependencies": {
    "@genkit-ai/google-genai": "^1.22.0",
    "genkit": "^1.22.0",
    "pdf-parse": "^1.1.1",
    "tesseract.js": "^5.0.0",
    "sharp": "^0.33.0",
    "axios": "^1.13.1",
    "express": "^5.1.0",
    "mongoose": "^8.19.2",
    "multer": "^2.0.2",
    // ... other existing dependencies
  }
}
```

### ✨ Environment Variables Required

```env
# Gemini AI
GEMINI_API_KEY=AIzaSyCzRGEUt_mukzb7YiuPG8Tg2oXR6gNA2cw
GEMINI_MODEL=gemini-1.5-flash-latest

# MongoDB
MONGODB_URI=mongodb+srv://...

# JWT
JWT_SECRET=...
JWT_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### 🎉 Success Indicators

✅ Backend starts without errors  
✅ MongoDB connects successfully  
✅ Gemini AI integration configured  
✅ PDF text extraction works  
✅ Image OCR works  
✅ Report analysis with structured output  
✅ Disease detection functional  
✅ WHO guidelines integration  
✅ Multi-report comparison  
✅ Health tracking dashboard API ready  
✅ All 21 conditions tracked  

---

**Status:** ✅ **Backend migration complete and tested**  
**Next:** Frontend UI development for health dashboard and condition tracking
