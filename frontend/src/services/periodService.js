import api from '../utils/api'

// Save or update period data
export const savePeriodData = async (periodData) => {
  try {
    // If there's an ID, update existing entry
    if (periodData.id) {
      const response = await api.put(`/periods/${periodData.id}`, periodData)
      return response.data
    }
    // Otherwise create new entry
    const response = await api.post('/periods', periodData)
    return response.data
  } catch (error) {
    console.error('Error saving period data:', error)
    // Return mock success for development without auth
    if (error.response?.status === 401) {
      console.warn('Authentication required. Using local storage fallback.')
      localStorage.setItem('periodData', JSON.stringify(periodData))
      return { success: true, data: periodData, local: true }
    }
    throw error
  }
}

// Get all period entries for user
export const getPeriodData = async () => {
  try {
    const response = await api.get('/periods')
    return response.data
  } catch (error) {
    console.error('Error fetching period data:', error)
    // Fallback to local storage if auth fails
    if (error.response?.status === 401) {
      console.warn('Authentication required. Using local storage fallback.')
      const localData = localStorage.getItem('periodData')
      if (localData) {
        const data = JSON.parse(localData)
        return { success: true, data: Array.isArray(data) ? data : [data], local: true }
      }
      return { success: true, data: [], local: true }
    }
    throw error
  }
}

// Get latest period entry
export const getLatestPeriod = async () => {
  try {
    const response = await api.get('/periods')
    const periods = response.data.data || []
    return periods.length > 0 ? periods[0] : null
  } catch (error) {
    console.error('Error fetching latest period:', error)
    // Fallback to local storage
    if (error.response?.status === 401) {
      const localData = localStorage.getItem('periodData')
      if (localData) {
        const data = JSON.parse(localData)
        return Array.isArray(data) ? data[0] : data
      }
      return null
    }
    throw error
  }
}

// Update period entry
export const updatePeriodData = async (id, updates) => {
  try {
    const response = await api.put(`/periods/${id}`, updates)
    return response.data
  } catch (error) {
    console.error('Error updating period data:', error)
    if (error.response?.status === 401) {
      console.warn('Authentication required. Using local storage fallback.')
      const localData = localStorage.getItem('periodData')
      if (localData) {
        const data = JSON.parse(localData)
        const updated = { ...data, ...updates }
        localStorage.setItem('periodData', JSON.stringify(updated))
        return { success: true, data: updated, local: true }
      }
    }
    throw error
  }
}

// Delete period entry
export const deletePeriodData = async (id) => {
  try {
    const response = await api.delete(`/periods/${id}`)
    return response.data
  } catch (error) {
    console.error('Error deleting period data:', error)
    throw error
  }
}

// Get predictions
export const getPredictions = async () => {
  try {
    const response = await api.get('/periods/predictions/next')
    return response.data
  } catch (error) {
    console.error('Error fetching predictions:', error)
    // Return default predictions if auth fails
    if (error.response?.status === 401) {
      const today = new Date()
      const nextPeriod = new Date(today)
      nextPeriod.setDate(nextPeriod.getDate() + 28)
      const ovulation = new Date(nextPeriod)
      ovulation.setDate(ovulation.getDate() - 14)
      
      return {
        success: true,
        data: {
          predictedNextPeriod: nextPeriod.toISOString(),
          predictedOvulation: ovulation.toISOString(),
          cycleLength: 28
        },
        local: true
      }
    }
    throw error
  }
}

// Save daily symptom tracking
export const saveDailySymptoms = async (date, symptoms) => {
  try {
    // Store in local storage for now since backend model needs extension
    const key = `symptoms_${date}`
    localStorage.setItem(key, JSON.stringify(symptoms))
    return { success: true, data: symptoms }
  } catch (error) {
    console.error('Error saving symptoms:', error)
    throw error
  }
}

// Get daily symptom tracking
export const getDailySymptoms = async (date) => {
  try {
    const key = `symptoms_${date}`
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Error fetching symptoms:', error)
    throw error
  }
}

// Get symptoms for date range
export const getSymptomsForRange = async (startDate, endDate) => {
  try {
    const symptoms = {}
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0]
      const key = `symptoms_${dateStr}`
      const data = localStorage.getItem(key)
      if (data) {
        symptoms[dateStr] = JSON.parse(data)
      }
    }
    
    return { success: true, data: symptoms }
  } catch (error) {
    console.error('Error fetching symptoms range:', error)
    throw error
  }
}

// Track daily symptoms at specific time slot (new API)
export const trackDailySymptoms = async (periodId, trackingData) => {
  try {
    const response = await api.post(`/periods/${periodId}/track-daily`, trackingData)
    return response.data
  } catch (error) {
    console.error('Error tracking daily symptoms:', error)
    if (error.response?.status === 401) {
      // Fallback to local storage
      const key = `tracking_${trackingData.date}_${trackingData.timeSlot}`
      localStorage.setItem(key, JSON.stringify(trackingData))
      return { success: true, data: trackingData, local: true }
    }
    throw error
  }
}

// Get daily tracking for a specific date
export const getDailyTracking = async (periodId, date) => {
  try {
    const response = await api.get(`/periods/${periodId}/daily/${date}`)
    return response.data
  } catch (error) {
    console.error('Error getting daily tracking:', error)
    if (error.response?.status === 401) {
      return { success: true, data: null, local: true }
    }
    throw error
  }
}

// Get AI recommendations for a period cycle
export const getPeriodRecommendations = async (periodId) => {
  try {
    const response = await api.get(`/periods/${periodId}/recommendations`)
    return response.data
  } catch (error) {
    console.error('Error getting recommendations:', error)
    throw error
  }
}

// Check if user needs reminder to track
export const checkReminder = async () => {
  try {
    const response = await api.get('/periods/check-reminder')
    return response.data
  } catch (error) {
    console.error('Error checking reminder:', error)
    if (error.response?.status === 401) {
      return { success: true, needsReminder: false, local: true }
    }
    throw error
  }
}
