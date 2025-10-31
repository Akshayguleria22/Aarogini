import { useState, useEffect } from 'react'
import { savePeriodData, getPeriodData, saveDailySymptoms, getSymptomsForRange } from '../../services/periodService'

const PeriodTracker = ({ onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [showPeriodChart, setShowPeriodChart] = useState(false)
  const [periodStartDate, setPeriodStartDate] = useState(null)
  const [currentDayIndex, setCurrentDayIndex] = useState(0)
  const [currentTimeSlot, setCurrentTimeSlot] = useState(0)
  const [loading, setLoading] = useState(true)
  const [currentPeriodId, setCurrentPeriodId] = useState(null)
  
  const [periodData, setPeriodData] = useState({})
  const [symptomTracking, setSymptomTracking] = useState({})

  // Load period data from backend on mount
  useEffect(() => {
    const loadPeriodData = async () => {
      try {
        setLoading(true)
        const response = await getPeriodData()
        
        if (response.success && response.data) {
          const formattedData = {}
          response.data.forEach(period => {
            const date = new Date(period.cycleStartDate).toISOString().split('T')[0]
            formattedData[date] = {
              type: 'period',
              isPeriod: true,
              id: period._id,
              ...period
            }
          })
          setPeriodData(formattedData)
        }
      } catch (error) {
        console.error('Error loading period data:', error)
        const localData = localStorage.getItem('periodData')
        if (localData) setPeriodData(JSON.parse(localData))
      } finally {
        setLoading(false)
      }
    }
    loadPeriodData()
  }, [])

  // Save period data whenever it changes
  useEffect(() => {
    if (loading) return
    try {
      localStorage.setItem('periodData', JSON.stringify(periodData))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }, [periodData, loading])

  const moodEmojis = ['😊', '😢', '😐', '😠', '😌', '😰', '🤗', '😴']
  const symptomTypes = ['Period Cramps', 'Blood Flow', 'Mood Swings', 'Energy Level', 'Bloating', 'Headache', 'Weakness']
  const timeSlots = ['12am', '3am', '6am', '9am', '12pm', '3pm', '6pm', '9pm']

  // Get days in month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    return { daysInMonth, startingDayOfWeek, year, month }
  }

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate)

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December']
  
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Navigate months
  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  // Format date key for storage
  const getDateKey = (day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  // Handle period start
  const handlePeriodStart = async () => {
    const dateKey = getDateKey(selectedDate)
    const newDate = new Date(year, month, selectedDate)
    
    setPeriodData(prev => ({
      ...prev,
      [dateKey]: { type: 'period', isPeriod: true }
    }))
    setPeriodStartDate(newDate)
    setCurrentDayIndex(0)
    setCurrentTimeSlot(0)
    
    // Save to backend
    try {
      const periodEntry = {
        cycleStartDate: newDate.toISOString(),
        cycleLength: 28, // Default value
        periodLength: 5,  // Default value
        flow: 'medium',
        symptoms: [],
        notes: 'Period started'
      }
      
      const response = await savePeriodData(periodEntry)
      if (response.success && response.data && response.data._id) {
        setCurrentPeriodId(response.data._id)
        // Update local state with server ID
        setPeriodData(prev => ({
          ...prev,
          [dateKey]: { 
            ...prev[dateKey], 
            id: response.data._id,
            ...response.data
          }
        }))
      }
      console.log('Period data saved:', response)
    } catch (error) {
      console.error('Error saving period start:', error)
      // Data is still saved locally via localStorage
    }
    
    // Add a small delay for smooth transition
    setTimeout(() => {
      setShowPeriodChart(true)
    }, 100)
    setSelectedDate(null)
  }

  // Handle pre-symptoms
  const handlePreSymptoms = async () => {
    const dateKey = getDateKey(selectedDate)
    const newDate = new Date(year, month, selectedDate)
    
    setPeriodData(prev => ({
      ...prev,
      [dateKey]: { type: 'pre-symptoms', isPeriod: false }
    }))
    
    // Save to backend
    try {
      const periodEntry = {
        cycleStartDate: newDate.toISOString(),
        cycleLength: 28,
        symptoms: ['pre-menstrual'],
        notes: 'Pre-symptoms marked'
      }
      
      const response = await savePeriodData(periodEntry)
      if (response.success && response.data && response.data._id) {
        // Update local state with server ID
        setPeriodData(prev => ({
          ...prev,
          [dateKey]: { 
            ...prev[dateKey], 
            id: response.data._id,
            ...response.data
          }
        }))
      }
      console.log('Pre-symptoms data saved:', response)
    } catch (error) {
      console.error('Error saving pre-symptoms:', error)
      // Data is still saved locally via localStorage
    }
    
    setSelectedDate(null)
  }

  // Update symptom for specific day and time slot
  const updateSymptom = async (dayIndex, symptomType, emoji) => {
    const updatedTracking = {
      ...symptomTracking,
      [`day${dayIndex}`]: {
        ...symptomTracking[`day${dayIndex}`],
        [`slot${currentTimeSlot}`]: {
          ...symptomTracking[`day${dayIndex}`]?.[`slot${currentTimeSlot}`],
          [symptomType]: emoji
        }
      }
    }
    
    setSymptomTracking(updatedTracking)
    
    // Save symptom tracking to localStorage
    try {
      if (periodStartDate) {
        const trackingDate = new Date(periodStartDate)
        trackingDate.setDate(trackingDate.getDate() + dayIndex)
        const dateKey = trackingDate.toISOString().split('T')[0]
        
        await saveDailySymptoms(dateKey, updatedTracking[`day${dayIndex}`])
        console.log('Symptom data saved for:', dateKey)
      }
    } catch (error) {
      console.error('Error saving symptom tracking:', error)
    }
  }

  const symptomEmojis = {
    'Period Cramps': ['😌', '🙂', '😐', '😣', '😫'],
    'Blood Flow': ['🩸0', '🩸1', '🩸2', '🩸3', '🩸4'], // Red droplets with unique identifiers
    'Mood Swings': ['😡', '😔', '😐', '🙂', '😊'],
    'Energy Level': ['😵', '🥱', '😴', '💪', '⚡'],
    'Bloating': ['😌', '🙂', '😐', '😣', '🤰'],
    'Headache': ['😌', '🙂', '😐', '😣', '🤕'],
    'Weakness': ['💪', '🙂', '😐', '😓', '🥵']
  }

  const symptomLabels = {
    'Period Cramps': ['None', 'Mild', 'Moderate', 'Strong', 'Severe'],
    'Blood Flow': ['None', 'Low', 'Neutral', 'High', 'Very High'],
    'Mood Swings': ['Very Angry', 'Sad', 'Neutral', 'Happy', 'Very Happy'],
    'Energy Level': ['Exhausted', 'Very Low', 'Low', 'Good', 'Energetic'],
    'Bloating': ['None', 'Slight', 'Moderate', 'Heavy', 'Severe'],
    'Headache': ['None', 'Mild', 'Moderate', 'Strong', 'Severe'],
    'Weakness': ['Strong', 'Good', 'Normal', 'Weak', 'Very Weak']
  }

  // Flow color intensity based on level - red variations
  const getFlowColor = (level) => {
    const colors = [
      '#fecaca',  // 0: Very light pink/red
      '#fca5a5',  // 1: Light pink/red
      '#f87171',  // 2: Medium red
      '#dc2626',  // 3: Dark red
      '#991b1b'   // 4: Very dark red
    ]
    return colors[level] || colors[2]
  }

  // Get flow emoji with styling
  const getFlowEmoji = (value) => {
    // Extract level from Flow identifier like '🩸2'
    if (value && value.startsWith('🩸')) {
      const level = parseInt(value.replace('🩸', ''))
      if (!isNaN(level)) {
        return { emoji: '🩸', level }
      }
    }
    return { emoji: '🩸', level: 2 } // default neutral
  }

  // Calculate average emoji for a day's symptom
  const calculateDayAverage = (dayIndex, symptomType) => {
    const dayData = symptomTracking[`day${dayIndex}`]
    if (!dayData) return '😐'
    
    const emojis = []
    for (let i = 0; i < 8; i++) {
      const slotData = dayData[`slot${i}`]
      if (slotData && slotData[symptomType]) {
        emojis.push(slotData[symptomType])
      }
    }
    
    if (emojis.length === 0) return '😐'
    // Return most common emoji or first one
    return emojis[0]
  }

  // Back to calendar
  const handleBackToCalendar = () => {
    setShowPeriodChart(false)
    setPeriodStartDate(null)
  }

  // Hygiene tips
  const hygieneTips = [
    { icon: '🩹', tip: 'Change pad/tampon every 4-6 hours', color: 'from-pink-400 to-rose-400' },
    { icon: '🚿', tip: 'Take warm showers to ease cramps', color: 'from-purple-400 to-pink-400' },
    { icon: '💧', tip: 'Stay hydrated - drink 8-10 glasses of water', color: 'from-blue-400 to-cyan-400' },
    { icon: '🧘‍♀️', tip: 'Light exercise can reduce cramps', color: 'from-indigo-400 to-purple-400' },
    { icon: '🛌', tip: 'Get 7-8 hours of sleep', color: 'from-violet-400 to-purple-400' },
    { icon: '🍎', tip: 'Eat iron-rich foods (spinach, lean meat)', color: 'from-green-400 to-emerald-400' }
  ]

  // Render Period Chart View
  const renderPeriodChart = () => {
    const startDate = periodStartDate || new Date()
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-3 h-full">
        {/* Left Side - Chart (4 columns) */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          {/* Header with back button */}
          <div className="flex items-center justify-between bg-white rounded-xl shadow-md p-3">
            <button
              onClick={handleBackToCalendar}
              className="flex items-center space-x-2 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 rounded-lg transition-all duration-300"
            >
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm text-gray-700 font-semibold">Back</span>
            </button>
            <div className="text-xs text-gray-600">
              Started: {startDate.toLocaleDateString()}
            </div>
          </div>

          {/* Period Started Header */}
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
            <h2 className="text-xl font-bold">Period Started</h2>
            <p className="text-xs text-white/90">Track your symptoms every 3 hours</p>
          </div>

          {/* Symptoms Chart */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden" style={{ maxHeight: '400px' }}>
            <div className="overflow-x-auto h-full">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-100 to-pink-100">
                    <th className="px-3 py-1.5 text-left font-bold text-gray-800 sticky left-0 bg-purple-100 text-xs">
                      Symptoms
                    </th>
                    {[...Array(7)].map((_, dayIndex) => {
                      const date = new Date(startDate)
                      date.setDate(date.getDate() + dayIndex)
                      return (
                        <th key={dayIndex} className="px-3 py-1.5 text-center font-semibold text-gray-700 min-w-[80px]">
                          <div className="text-xs">Day {dayIndex + 1}</div>
                          <div className="text-[10px] text-gray-600">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {symptomTypes.map((symptom, symptomIndex) => (
                    <tr key={symptom} className={symptomIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-3 py-2 font-semibold text-gray-700 border-r border-gray-200 sticky left-0 bg-inherit text-xs">
                        {symptom}
                      </td>
                      {[...Array(7)].map((_, dayIndex) => {
                        const currentValue = symptomTracking[`day${dayIndex}`]?.[`slot${currentTimeSlot}`]?.[symptom]
                        
                        // Get flow level for color
                        let flowLevel = 2 // default neutral
                        if (symptom === 'Blood Flow' && currentValue) {
                          const flowInfo = getFlowEmoji(currentValue)
                          flowLevel = flowInfo.level
                        }
                        
                        return (
                          <td key={`${dayIndex}-${symptom}`} className="border border-gray-200 p-2">
                            {symptom === 'Blood Flow' ? (
                              <div 
                                className="text-center text-3xl font-bold"
                                style={{ 
                                  color: getFlowColor(flowLevel),
                                  textShadow: `0 0 8px ${getFlowColor(flowLevel)}, 0 0 12px ${getFlowColor(flowLevel)}`,
                                  filter: `brightness(1.1) saturate(1.3)`
                                }}
                              >
                                🩸
                              </div>
                            ) : (
                              <div className="text-center text-2xl">
                                {currentValue || symptomEmojis[symptom][2]}
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Hygiene Tips & Nutrition - Below chart - Expanded */}
          <div className="bg-white rounded-xl shadow-lg p-3 flex-1 flex flex-col gap-3">
            {/* Hygiene Tips */}
            <div>
              <h3 className="text-xs font-bold text-gray-800 mb-2 flex items-center space-x-1.5">
                <span>💝</span>
                <span>Hygiene & Care Tips</span>
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {hygieneTips.map((item, index) => (
                  <div
                    key={index}
                    className={`p-2.5 rounded-lg bg-gradient-to-r ${item.color} text-white transition-all duration-300 hover:scale-105`}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <span className="text-xl">{item.icon}</span>
                      <p className="text-[9px] font-medium leading-tight text-center">{item.tip}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nutrition Recommendations */}
            <div>
              <h3 className="text-xs font-bold text-gray-800 mb-2 flex items-center space-x-1.5">
                <span>🥗</span>
                <span>Nutrition Recommendations</span>
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-r from-green-400 to-emerald-400 text-white">
                  <div className="flex flex-col items-center space-y-1">
                    <span className="text-xl">🥬</span>
                    <p className="text-[9px] font-medium leading-tight text-center">Leafy greens for iron</p>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-gradient-to-r from-orange-400 to-amber-400 text-white">
                  <div className="flex flex-col items-center space-y-1">
                    <span className="text-xl">🥜</span>
                    <p className="text-[9px] font-medium leading-tight text-center">Nuts for magnesium</p>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-300 text-white">
                  <div className="flex flex-col items-center space-y-1">
                    <span className="text-xl">🍊</span>
                    <p className="text-[9px] font-medium leading-tight text-center">Citrus for vitamin C</p>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-gradient-to-r from-red-400 to-rose-400 text-white">
                  <div className="flex flex-col items-center space-y-1">
                    <span className="text-xl">🍓</span>
                    <p className="text-[9px] font-medium leading-tight text-center">Berries for antioxidants</p>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-400 to-cyan-400 text-white">
                  <div className="flex flex-col items-center space-y-1">
                    <span className="text-xl">🐟</span>
                    <p className="text-[9px] font-medium leading-tight text-center">Fish for omega-3</p>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-400 to-pink-400 text-white">
                  <div className="flex flex-col items-center space-y-1">
                    <span className="text-xl">🍫</span>
                    <p className="text-[9px] font-medium leading-tight text-center">Dark chocolate (small amounts)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Time Slots & Predictions (2 columns) */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          {/* Time Slot Entry */}
          <div className="bg-white rounded-xl shadow-lg p-3 flex-1 overflow-y-auto">
            <h3 className="text-xs font-bold text-gray-800 mb-2 flex items-center justify-between">
              <span>Time Slot Entry</span>
              <span className="text-purple-600">Day {currentDayIndex + 1} - {timeSlots[currentTimeSlot]}</span>
            </h3>
            
            <div className="space-y-3">
              {symptomTypes.map((symptom) => {
                const currentValue = symptomTracking[`day${currentDayIndex}`]?.[`slot${currentTimeSlot}`]?.[symptom]
                let currentIndex = 2 // default to neutral/middle
                
                // Find the current index
                if (currentValue) {
                  const foundIndex = symptomEmojis[symptom].indexOf(currentValue)
                  if (foundIndex !== -1) {
                    currentIndex = foundIndex
                  }
                }
                
                // Get flow level if it's Flow symptom
                let flowLevel = currentIndex
                if (symptom === 'Blood Flow' && currentValue) {
                  const flowInfo = getFlowEmoji(currentValue)
                  flowLevel = flowInfo.level
                  currentIndex = flowLevel
                }
                
                return (
                  <div key={symptom} className="p-2 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                    <div className="font-semibold text-gray-700 mb-2 text-xs">{symptom}</div>
                    <div className="space-y-2">
                      {/* Emoji Display with Flow color variation */}
                      {symptom === 'Blood Flow' ? (
                        <div 
                          className="text-center text-4xl font-bold"
                          style={{ 
                            color: getFlowColor(flowLevel),
                            textShadow: `0 0 10px ${getFlowColor(flowLevel)}, 0 0 15px ${getFlowColor(flowLevel)}`,
                            filter: `brightness(1.2) saturate(1.5)`
                          }}
                        >
                          🩸
                        </div>
                      ) : (
                        <div className="text-center text-3xl">
                          {symptomEmojis[symptom][currentIndex]}
                        </div>
                      )}
                      
                      {/* Slider */}
                      <input
                        type="range"
                        min="0"
                        max="4"
                        value={currentIndex}
                        onChange={(e) => {
                          const newIndex = parseInt(e.target.value)
                          updateSymptom(currentDayIndex, symptom, symptomEmojis[symptom][newIndex])
                        }}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer slider-thumb"
                        style={{
                          background: 'linear-gradient(to right, #e0c3fc, #d8b4fe, #c084fc, #a855f7, #9333ea)'
                        }}
                      />
                      
                      {/* Label */}
                      <div className="text-center text-[10px] text-gray-600 font-medium">
                        {symptomLabels[symptom][currentIndex]}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Time Slot Navigation */}
            <div className="mt-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center">
                  <div className="text-[9px] text-gray-600">Current Day</div>
                  <div className="font-bold text-gray-800 text-xs">{currentDayIndex + 1} of 7</div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] text-gray-600">Time Slot</div>
                  <div className="font-bold text-gray-800 text-xs">{currentTimeSlot + 1} of 8</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setCurrentDayIndex(Math.max(0, currentDayIndex - 1))}
                  disabled={currentDayIndex === 0}
                  className="px-2 py-1.5 text-xs bg-pink-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-600 transition-all duration-300"
                >
                  ← Prev Day
                </button>
                <button
                  onClick={() => setCurrentDayIndex(Math.min(6, currentDayIndex + 1))}
                  disabled={currentDayIndex === 6}
                  className="px-2 py-1.5 text-xs bg-pink-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-600 transition-all duration-300"
                >
                  Next Day →
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setCurrentTimeSlot(Math.max(0, currentTimeSlot - 1))}
                  disabled={currentTimeSlot === 0}
                  className="px-2 py-1.5 text-xs bg-purple-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-600 transition-all duration-300"
                >
                  ← Prev Slot
                </button>
                <button
                  onClick={() => setCurrentTimeSlot(Math.min(7, currentTimeSlot + 1))}
                  disabled={currentTimeSlot === 7}
                  className="px-2 py-1.5 text-xs bg-purple-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-600 transition-all duration-300"
                >
                  Next Slot →
                </button>
              </div>
            </div>
          </div>

          {/* Predictions */}
          <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-3">
            <h4 className="font-bold text-gray-800 mb-2 flex items-center space-x-1.5 text-xs">
              <span>📅</span>
              <span>Predictions</span>
            </h4>
            <div className="space-y-1.5 text-[10px]">
              <p className="flex justify-between">
                <span className="text-gray-600">Next Period:</span>
                <span className="font-semibold text-purple-700">Nov 25, 2025</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-600">Cycle Length:</span>
                <span className="font-semibold text-purple-700">28 days</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-600">Ovulation:</span>
                <span className="font-semibold text-purple-700">Nov 11, 2025</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-6xl h-[88vh] bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-in">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-3 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold">Period Tracker</h2>
                <p className="text-[10px] text-white/80">Track your cycle & wellness</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-300 flex items-center justify-center backdrop-blur-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="h-full animate-fade-in">
            {showPeriodChart ? renderPeriodChart() : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 h-full">
              
              {/* Main Calendar - Left Side (2 columns) */}
              <div className="lg:col-span-2 flex flex-col gap-3 overflow-y-auto">
                <div className="bg-white rounded-xl shadow-lg p-4">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={previousMonth}
                      className="w-8 h-8 rounded-full bg-purple-100 hover:bg-purple-200 transition-all duration-300 flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <h3 className="text-base font-bold text-gray-800">
                      {monthNames[month]} {year}
                    </h3>
                    <button
                      onClick={nextMonth}
                      className="w-8 h-8 rounded-full bg-purple-100 hover:bg-purple-200 transition-all duration-300 flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Weekday Headers */}
                  <div className="grid grid-cols-7 gap-1.5 mb-2">
                    {weekDays.map(day => (
                      <div key={day} className="text-center font-semibold text-gray-600 text-[10px] py-1">
                        {day.substring(0, 3)}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-1.5">
                    {/* Empty cells for days before month starts */}
                    {[...Array(startingDayOfWeek)].map((_, index) => (
                      <div key={`empty-${index}`} className="w-9 h-9"></div>
                    ))}
                    
                    {/* Actual days */}
                    {[...Array(daysInMonth)].map((_, index) => {
                      const day = index + 1
                      const dateKey = getDateKey(day)
                      const dayData = periodData[dateKey]
                      const isToday = new Date().getDate() === day && 
                                     new Date().getMonth() === month && 
                                     new Date().getFullYear() === year

                      return (
                        <div
                          key={day}
                          className={`w-9 h-9 rounded-md cursor-pointer transition-all duration-300 flex items-center justify-center relative ${
                            isToday 
                              ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-md scale-105' 
                              : dayData?.isPeriod
                              ? 'bg-red-500'
                              : dayData?.type === 'pre-symptoms' 
                              ? 'bg-yellow-200'
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                          onClick={() => setSelectedDate(day)}
                        >
                          <span className={`text-xs font-semibold ${
                            isToday || dayData?.isPeriod ? 'text-white' : 'text-gray-700'
                          }`}>
                            {day}
                          </span>
                          {dayData?.isPeriod && (
                            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full"></div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Date Selection Options */}
                  {selectedDate && (
                    <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg animate-fade-in">
                      <p className="text-xs font-semibold text-gray-700 mb-2">
                        {monthNames[month]} {selectedDate}, {year}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={handlePeriodStart}
                          className="p-2 bg-gradient-to-r from-red-400 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 flex flex-col items-center space-y-1"
                        >
                          <span className="text-xl">🩸</span>
                          <span className="text-[10px]">Period Started</span>
                        </button>
                        <button
                          onClick={handlePreSymptoms}
                          className="p-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 flex flex-col items-center space-y-1"
                        >
                          <span className="text-xl">⚠️</span>
                          <span className="text-[10px]">Pre-Symptoms</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Legend */}
                <div className="bg-white rounded-lg shadow-md p-2">
                  <div className="flex items-center justify-center gap-4 text-[10px]">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-2.5 h-2.5 rounded bg-red-500"></div>
                      <span className="text-gray-700">Period</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <div className="w-2.5 h-2.5 rounded bg-yellow-200"></div>
                      <span className="text-gray-700">Pre-Symptoms</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <div className="w-2.5 h-2.5 rounded bg-gradient-to-br from-purple-500 to-pink-500"></div>
                      <span className="text-gray-700">Today</span>
                    </div>
                  </div>
                </div>

                {/* Hygiene Tips - Extends to bottom */}
                <div className="bg-white rounded-xl shadow-lg p-3 flex-1">
                  <h3 className="text-xs font-bold text-gray-800 mb-2 flex items-center space-x-1.5">
                    <span className="text-sm">💝</span>
                    <span>Hygiene Tips</span>
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {hygieneTips.map((item, index) => (
                      <div
                        key={index}
                        className={`p-2 rounded-lg bg-gradient-to-r ${item.color} text-white transition-all duration-300`}
                      >
                        <div className="flex items-start space-x-1.5">
                          <span className="text-base">{item.icon}</span>
                          <p className="text-[9px] font-medium leading-tight">{item.tip}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Sidebar - Predictions & Health Insights (3 columns) */}
              <div className="lg:col-span-3 overflow-y-auto">
                <div className="space-y-3 h-full">
                  {/* Predictions Card */}
                  <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-3">
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center space-x-1.5 text-xs">
                      <span className="text-sm">📅</span>
                      <span>Cycle Predictions</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="bg-white/60 rounded-lg p-2.5">
                        <p className="text-gray-600 font-medium mb-1">Next Period:</p>
                        <p className="font-bold text-purple-700 text-xs">Nov 25, 2025</p>
                      </div>
                      <div className="bg-white/60 rounded-lg p-2.5">
                        <p className="text-gray-600 font-medium mb-1">Cycle Length:</p>
                        <p className="font-bold text-purple-700 text-xs">28 days</p>
                      </div>
                      <div className="bg-white/60 rounded-lg p-2.5">
                        <p className="text-gray-600 font-medium mb-1">Ovulation:</p>
                        <p className="font-bold text-purple-700 text-xs">Nov 11, 2025</p>
                      </div>
                      <div className="bg-white/60 rounded-lg p-2.5">
                        <p className="text-gray-600 font-medium mb-1">Period Duration:</p>
                        <p className="font-bold text-purple-700 text-xs">5 days</p>
                      </div>
                      <div className="bg-white/60 rounded-lg p-2.5">
                        <p className="text-gray-600 font-medium mb-1">Fertile Window:</p>
                        <p className="font-bold text-purple-700 text-xs">Nov 8-13</p>
                      </div>
                      <div className="bg-white/60 rounded-lg p-2.5">
                        <p className="text-gray-600 font-medium mb-1">Cycle Day:</p>
                        <p className="font-bold text-purple-700 text-xs">Day 4 of 28</p>
                      </div>
                    </div>
                  </div>

                  {/* Health Tips Card */}
                  <div className="bg-gradient-to-br from-pink-100 to-rose-100 rounded-xl p-3">
                    <h4 className="font-bold text-gray-800 mb-2 flex items-center space-x-1.5 text-xs">
                      <span className="text-sm">💝</span>
                      <span>Health Tips</span>
                    </h4>
                    <div className="space-y-1.5 text-[10px]">
                      <div className="bg-white/60 rounded-lg p-2 flex items-start space-x-2">
                        <span className="text-base">🥗</span>
                        <p className="text-gray-700 leading-tight">Eat foods rich in iron during menstruation</p>
                      </div>
                      <div className="bg-white/60 rounded-lg p-2 flex items-start space-x-2">
                        <span className="text-base">🧘‍♀️</span>
                        <p className="text-gray-700 leading-tight">Practice yoga to reduce cramps naturally</p>
                      </div>
                      <div className="bg-white/60 rounded-lg p-2 flex items-start space-x-2">
                        <span className="text-base">🌡️</span>
                        <p className="text-gray-700 leading-tight">Track basal body temperature for accuracy</p>
                      </div>
                    </div>
                  </div>

                  {/* Wellness Reminder Card */}
                  <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl p-3">
                    <h4 className="font-bold text-gray-800 mb-2 flex items-center space-x-1.5 text-xs">
                      <span className="text-sm">🌟</span>
                      <span>Wellness Reminders</span>
                    </h4>
                    <div className="space-y-1.5 text-[10px]">
                      <div className="bg-white/60 rounded-lg p-2 flex items-center space-x-2">
                        <span className="text-base">💊</span>
                        <p className="text-gray-700 leading-tight">Take your daily vitamins</p>
                      </div>
                      <div className="bg-white/60 rounded-lg p-2 flex items-center space-x-2">
                        <span className="text-base">💧</span>
                        <p className="text-gray-700 leading-tight">Stay hydrated - 8 glasses today</p>
                      </div>
                      <div className="bg-white/60 rounded-lg p-2 flex items-center space-x-2">
                        <span className="text-base">😴</span>
                        <p className="text-gray-700 leading-tight">Get 7-8 hours of quality sleep</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PeriodTracker
