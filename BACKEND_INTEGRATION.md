# Period Tracker Backend Integration

## 🎯 Features Implemented

### Frontend to Backend Connection
- ✅ Period dates are now **persisted to MongoDB** via the backend API
- ✅ Data **automatically loads** when you open the Period Tracker
- ✅ Data **survives page refreshes** and browser restarts
- ✅ **LocalStorage fallback** when backend is unavailable
- ✅ **Symptom tracking** saved with timestamps

### What Gets Saved
1. **Period Start Dates** - When you click "Period Started"
2. **Pre-Symptoms** - When you mark dates with symptoms before period
3. **7-Day Symptom Tracking** - All symptoms recorded in the tracker chart
4. **Cycle Information** - Cycle length, period duration, predictions

## 🚀 Setup Instructions

### 1. Backend Setup

```powershell
# Navigate to backend folder
cd backend

# Install dependencies (if not already done)
npm install

# Make sure MongoDB is running
# Start the backend server
npm start
```

The backend will run on `http://localhost:5000`

### 2. Frontend Setup

```powershell
# Navigate to frontend folder
cd frontend

# Dependencies are already installed (axios added)

# Start the frontend development server
npm run dev
```

The frontend will run on `http://localhost:5173`

## 📝 How It Works

### Data Flow

1. **When you mark a period date:**
   - Click on any date in the calendar
   - Choose "Period Started" or "Pre Symptoms"
   - Data is **instantly saved** to:
     - MongoDB (via backend API)
     - LocalStorage (as backup)

2. **When you track symptoms:**
   - Navigate through the 7-day tracker
   - Select symptoms at different time slots
   - Each selection is **automatically saved**

3. **When you reload the page:**
   - Period Tracker **automatically fetches** your data
   - All marked dates are **restored**
   - Symptom tracking is **preserved**

### Authentication Handling

Currently, the app has **graceful degradation**:
- If backend is available → Data saved to MongoDB
- If authentication fails → Data saved to LocalStorage
- If backend is down → Data saved to LocalStorage

This ensures your data is **never lost**, even without authentication!

## 🔧 Technical Details

### API Endpoints Used
- `POST /api/periods` - Save new period entry
- `GET /api/periods` - Fetch all period entries
- `PUT /api/periods/:id` - Update existing entry
- `GET /api/periods/predictions/next` - Get cycle predictions

### Data Structure
```javascript
{
  cycleStartDate: "2025-10-31T00:00:00.000Z",
  cycleLength: 28,
  periodLength: 5,
  flow: "medium",
  symptoms: ["cramps", "mood_swings"],
  notes: "Period started",
  predictedNextPeriod: "2025-11-28T00:00:00.000Z",
  predictedOvulation: "2025-11-14T00:00:00.000Z"
}
```

### Files Modified/Created

**Frontend:**
- ✅ `src/utils/api.js` - Axios configuration with interceptors
- ✅ `src/services/periodService.js` - Period API service functions
- ✅ `src/components/tracker/PeriodTracker.jsx` - Updated with backend integration
- ✅ `.env` - API URL configuration
- ✅ `package.json` - Added axios dependency

**Backend:** (Already existed)
- `routes/periodRoutes.js` - Period CRUD endpoints
- `models/PeriodTracker.js` - Period data schema
- `middleware/auth.js` - Authentication middleware

## 🧪 Testing

### Test the Integration

1. **Start both servers:**
   ```powershell
   # Terminal 1 - Backend
   cd backend
   npm start

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. **Open the app:**
   - Navigate to `http://localhost:5173`
   - Click on "PERIOD TRACKER" feature card

3. **Mark a date:**
   - Click any date in the calendar
   - Click "Period Started"
   - Check browser console for "Period data saved" message

4. **Verify persistence:**
   - Close the Period Tracker modal
   - Refresh the browser page
   - Open Period Tracker again
   - **Your marked date should still be there!** 🎉

5. **Test symptom tracking:**
   - Mark a period date
   - Navigate through the 7-day tracker
   - Select different symptoms
   - Check console for "Symptom data saved" messages

### Expected Console Logs

When everything works:
```
Period data saved: { success: true, data: {...} }
Symptom data saved for: 2025-10-31
```

If backend is unavailable:
```
Authentication required. Using local storage fallback.
```

## 🔐 Future Enhancements

To enable full authentication:
1. Implement user login/signup
2. Store JWT token after login
3. Backend will then associate periods with specific users
4. Data will be fully secure and user-specific

## 💡 Tips

- Data is saved **automatically** - no save button needed!
- Even without backend, data persists in **LocalStorage**
- Open browser DevTools (F12) → Console to see save confirmations
- Check Application → Local Storage to see stored data

## 🆘 Troubleshooting

### "Cannot connect to backend"
- Make sure backend is running on port 5000
- Check MongoDB is connected
- Verify `.env` file has correct API URL

### "Authentication required"
- This is normal without login system
- Data still saves to LocalStorage
- Everything works, just locally

### Data not persisting
- Check browser console for errors
- Verify LocalStorage is not disabled
- Clear cache and try again

## ✅ Success Criteria

Your integration is working if:
- ✅ Marked dates appear when you reopen the tracker
- ✅ Console shows "Period data saved" messages
- ✅ No JavaScript errors in console
- ✅ Data survives page refresh

---

**Integration Complete! 🎉** Your Period Tracker now has full backend connectivity with automatic persistence.
