import { useState, useEffect } from 'react'
import { savePeriodData, getPeriodData, saveDailySymptoms, trackDailySymptoms, getPeriodRecommendations, getDailyTracking } from '../../services/periodService'

const SYMPTOM_TYPES = ['Period Cramps', 'Blood Flow', 'Mood Swings', 'Energy Level', 'Bloating', 'Headache', 'Weakness']
const TIME_SLOTS = ['12am', '3am', '6am', '9am', '12pm', '3pm', '6pm', '9pm']

const PeriodTracker = ({ onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [showPeriodChart, setShowPeriodChart] = useState(false)
  const [periodStartDate, setPeriodStartDate] = useState(null)
  const [currentDayIndex, setCurrentDayIndex] = useState(0)
  const [currentTimeSlot, setCurrentTimeSlot] = useState(0)
  const [loading, setLoading] = useState(true)
  const [currentPeriodId, setCurrentPeriodId] = useState(null)
  const [lastCycleStart, setLastCycleStart] = useState(null)
  const [cycleLength, setCycleLength] = useState(28)
  const [periodLength, setPeriodLength] = useState(5)
  const [predictions, setPredictions] = useState({ nextPeriod: null, ovulation: null, fertile: null, cycleDay: null })
  
  const [periodData, setPeriodData] = useState({})
  const [symptomTracking, setSymptomTracking] = useState({})
  const [aiRecommendations, setAiRecommendations] = useState([])
  const [aiSummary, setAiSummary] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  const toDateKey = (date) => {
    const d = new Date(date)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  // Load period data from backend on mount
  useEffect(() => {
    const loadPeriodData = async () => {
      try {
        setLoading(true)
        const response = await getPeriodData()
        
        if (response.success && response.data) {
          const formattedData = {}
          response.data.forEach(period => {
            const start = new Date(period.cycleStartDate)
            const length = Number(period.periodLength || 5)
            for (let i = 0; i < length; i += 1) {
              const d = new Date(start)
              d.setDate(d.getDate() + i)
              const dateKey = toDateKey(d)
              formattedData[dateKey] = {
                type: 'period',
                isPeriod: true,
                id: period._id,
                cycleStartDate: start.toISOString(),
                dayIndex: i,
                ...period
              }
            }
          })
          setPeriodData(formattedData)
          // compute latest start and defaults
          if (response.data.length > 0) {
            const latest = response.data.reduce((a, b) => new Date(a.cycleStartDate) > new Date(b.cycleStartDate) ? a : b)
            setLastCycleStart(new Date(latest.cycleStartDate))
            setCurrentPeriodId(latest._id)
            if (latest.cycleLength) setCycleLength(latest.cycleLength)
            if (latest.periodLength) setPeriodLength(latest.periodLength)
          }
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
  // compute predictions whenever inputs change
  useEffect(() => {
    const start = periodStartDate || lastCycleStart
    if (!start) {
      setPredictions({ nextPeriod: null, ovulation: null, fertile: null, cycleDay: null })
      return
    }
    const addDays = (d, days) => { const x = new Date(d); x.setDate(x.getDate() + days); return x }
    const next = addDays(start, Number(cycleLength || 28))
    const ovu = addDays(start, Number(cycleLength || 28) - 14)
    const fertile = { from: addDays(ovu, -3), to: addDays(ovu, 2) }
    const today = new Date()
    const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1
    const day = diff > 0 ? ((diff - 1) % Number(cycleLength || 28)) + 1 : 1
    setPredictions({ nextPeriod: next, ovulation: ovu, fertile, cycleDay: day })
  }, [periodStartDate, lastCycleStart, cycleLength])

  useEffect(() => {
    const loadRecommendations = async () => {
      if (!currentPeriodId || !showPeriodChart) return
      try {
        setAiLoading(true)
        setAiError('')
        const resp = await getPeriodRecommendations(currentPeriodId)
        if (resp?.success) {
          setAiRecommendations(resp.data?.recommendations || [])
          setAiSummary(resp.data?.summary || '')
        }
      } catch (error) {
        console.error('Failed to load AI recommendations:', error)
        setAiError('AI recommendations unavailable')
      } finally {
        setAiLoading(false)
      }
    }
    loadRecommendations()
  }, [currentPeriodId, showPeriodChart])

  useEffect(() => {
    if (!showPeriodChart) return
    const total = Math.max(1, Number(periodLength || 5))
    if (currentDayIndex > total - 1) {
      setCurrentDayIndex(total - 1)
    }
  }, [periodLength, showPeriodChart, currentDayIndex])

  useEffect(() => {
    const loadDailyTracking = async () => {
      if (!currentPeriodId || !periodStartDate || !showPeriodChart) return
      try {
        const dayPromises = [...Array(7)].map(async (_, dayIndex) => {
          const trackingDate = new Date(periodStartDate)
          trackingDate.setDate(trackingDate.getDate() + dayIndex)
          const dateKey = toDateKey(trackingDate)
          const resp = await getDailyTracking(currentPeriodId, dateKey)
          if (!resp?.success || !resp.data) return null

          const daySlots = {}
          const flowToLevel = { none: 0, spotting: 1, light: 2, medium: 3, heavy: 4, very_heavy: 4 }
          const moodToLevel = { angry: 0, sad: 1, neutral: 2, irritable: 3, happy: 4, energetic: 4, tired: 1, anxious: 1 }

          resp.data.timeSlots.forEach((slot) => {
            const slotIndex = TIME_SLOTS.indexOf(slot.time)
            if (slotIndex === -1) return
            daySlots[`slot${slotIndex}`] = {
              'Blood Flow': flowToLevel[slot.flow] ?? 2,
              'Period Cramps': Math.min(4, Math.max(0, Math.round((slot.cramps ?? 0) / 2.5))),
              'Mood Swings': moodToLevel[slot.mood] ?? 2,
              'Energy Level': Math.min(4, Math.max(0, Math.round((slot.energyLevel ?? 5) / 2.5))),
              'Bloating': (slot.symptoms || []).includes('bloating') ? 4 : 0,
              'Headache': (slot.symptoms || []).includes('headache') ? 4 : 0,
              'Weakness': (slot.symptoms || []).includes('fatigue') ? 4 : 0,
            }
          })

          return { dayIndex, daySlots }
        })

        const results = await Promise.all(dayPromises)
        const merged = results.filter(Boolean)
        if (merged.length === 0) return

        setSymptomTracking(prev => {
          const next = { ...prev }
          merged.forEach(({ dayIndex, daySlots }) => {
            next[`day${dayIndex}`] = { ...daySlots, ...next[`day${dayIndex}`] }
          })
          return next
        })
      } catch (error) {
        console.error('Error loading daily tracking:', error)
      }
    }

    loadDailyTracking()
  }, [currentPeriodId, periodStartDate, showPeriodChart])

  const fmt = (d, opts = { month: 'short', day: 'numeric', year: 'numeric' }) => d ? new Date(d).toLocaleDateString('en-US', opts) : '—'

  // Save period data whenever it changes
  useEffect(() => {
    if (loading) return
    try {
      localStorage.setItem('periodData', JSON.stringify(periodData))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }, [periodData, loading])

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

  const handleDateClick = (day) => {
    const dateKey = getDateKey(day)
    const dayData = periodData[dateKey]
    if (dayData?.isPeriod) {
      const clickedDate = new Date(year, month, day)
      const start = dayData.cycleStartDate ? new Date(dayData.cycleStartDate) : clickedDate
      const offset = Math.max(0, Math.floor((clickedDate - start) / (1000 * 60 * 60 * 24)))
      setPeriodStartDate(start)
      setCurrentPeriodId(dayData.id || currentPeriodId)
      setCurrentDayIndex(Number.isFinite(dayData.dayIndex) ? dayData.dayIndex : offset)
      setCurrentTimeSlot(0)
      setSelectedDate(null)
      setShowPeriodChart(true)
      return
    }
    setSelectedDate(day)
  }

  // Handle period start
  const handlePeriodStart = async () => {
    const newDate = new Date(year, month, selectedDate)
    const buildRange = (startDate, length, meta = {}) => {
      const range = {}
      const total = Math.max(1, Number(length || 5))
      for (let i = 0; i < total; i += 1) {
        const d = new Date(startDate)
        d.setDate(d.getDate() + i)
        const key = toDateKey(d)
        range[key] = {
          type: 'period',
          isPeriod: true,
          cycleStartDate: startDate.toISOString(),
          dayIndex: i,
          ...meta
        }
      }
      return range
    }

    setPeriodData(prev => ({
      ...prev,
      ...buildRange(newDate, periodLength)
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
        // sync cycle parameters for predictions
        if (response.data.cycleLength) setCycleLength(response.data.cycleLength)
        if (response.data.periodLength) setPeriodLength(response.data.periodLength)
        setLastCycleStart(newDate)
        // Update local state with server ID and period range
        const length = response.data.periodLength || periodLength
        setPeriodData(prev => ({
          ...prev,
          ...buildRange(newDate, length, { id: response.data._id, ...response.data })
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
    setPeriodData(prev => ({
      ...prev,
      [dateKey]: { type: 'pre-symptoms', isPeriod: false }
    }))
    
    // Pre-symptoms are stored locally (not a new cycle entry)
    setSelectedDate(null)
  }

  // Update symptom for specific day and time slot
  const updateSymptom = async (dayIndex, symptomType, valueIndex) => {
    const numericValue = typeof valueIndex === 'number' ? valueIndex : Number(valueIndex)
    const updatedTracking = {
      ...symptomTracking,
      [`day${dayIndex}`]: {
        ...symptomTracking[`day${dayIndex}`],
        [`slot${currentTimeSlot}`]: {
          ...symptomTracking[`day${dayIndex}`]?.[`slot${currentTimeSlot}`],
          [symptomType]: Number.isNaN(numericValue) ? 2 : numericValue
        }
      }
    }
    
    setSymptomTracking(updatedTracking)
    
    // Save symptom tracking to localStorage
    try {
      if (periodStartDate) {
        const trackingDate = new Date(periodStartDate)
        trackingDate.setDate(trackingDate.getDate() + dayIndex)
        const dateKey = toDateKey(trackingDate)
        
        await saveDailySymptoms(dateKey, updatedTracking[`day${dayIndex}`])
        console.log('Symptom data saved for:', dateKey)

        if (currentPeriodId) {
          const slot = updatedTracking[`day${dayIndex}`]?.[`slot${currentTimeSlot}`] || {}
          const flowMap = ['none', 'spotting', 'light', 'medium', 'heavy']
          const moodMap = ['angry', 'sad', 'neutral', 'irritable', 'happy']

          const trackingPayload = {
            date: trackingDate.toISOString(),
            timeSlot: TIME_SLOTS[currentTimeSlot],
            flow: flowMap[Math.min(4, Math.max(0, Number(slot['Blood Flow'] ?? 2)))],
            cramps: Math.round((Number(slot['Period Cramps'] ?? 2)) * 2.5),
            mood: moodMap[Math.min(4, Math.max(0, Number(slot['Mood Swings'] ?? 2)))],
            energyLevel: Math.round((Number(slot['Energy Level'] ?? 2)) * 2.5),
            symptoms: [
              Number(slot['Bloating'] ?? 0) >= 3 ? 'bloating' : null,
              Number(slot['Headache'] ?? 0) >= 3 ? 'headache' : null,
              Number(slot['Weakness'] ?? 0) >= 3 ? 'fatigue' : null
            ].filter(Boolean)
          }

          await trackDailySymptoms(currentPeriodId, trackingPayload)
        }
      }
    } catch (error) {
      console.error('Error saving symptom tracking:', error)
    }
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

  const getFlowLevel = (value) => {
    if (typeof value === 'number' && !Number.isNaN(value)) return value
    return 2
  }


  // Back to calendar
  const handleBackToCalendar = () => {
    setShowPeriodChart(false)
    setPeriodStartDate(null)
  }

  // Hygiene tips
  const hygieneTips = [
    { tip: 'Change pad/tampon every 4-6 hours', color: 'from-pink-400 to-rose-400' },
    { tip: 'Take warm showers to ease cramps', color: 'from-purple-400 to-pink-400' },
    { tip: 'Stay hydrated - drink 8-10 glasses of water', color: 'from-blue-400 to-cyan-400' },
    { tip: 'Light exercise can reduce cramps', color: 'from-indigo-400 to-purple-400' },
    { tip: 'Get 7-8 hours of sleep', color: 'from-violet-400 to-purple-400' },
    { tip: 'Eat iron-rich foods (spinach, lean meat)', color: 'from-green-400 to-emerald-400' }
  ]

  // Render Period Chart View
  const renderPeriodChart = () => {
    const startDate = periodStartDate || new Date()
    const totalDays = Math.max(1, Number(periodLength || 5))
    const safeDayIndex = Math.min(Math.max(currentDayIndex, 0), totalDays - 1)
    const dayIndices = [safeDayIndex]
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-3 h-full">
        {/* Left Side - Chart (4 columns) */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          {/* Header with back button */}
          <div className="flex items-center justify-between bg-white dark:bg-zinc-900 rounded-xl shadow-md p-3">
            <button
              onClick={handleBackToCalendar}
              className="flex items-center space-x-2 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition-all duration-300"
            >
              <svg className="w-4 h-4 text-purple-600 dark:text-pink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm text-gray-700 dark:text-zinc-200 font-semibold">Back</span>
            </button>
            <div className="text-xs text-gray-600 dark:text-zinc-400">
              Started: {startDate.toLocaleDateString()}
            </div>
          </div>

          {/* Period Started Header */}
          <div className="bg-linear-to-r from-pink-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
            <h2 className="text-xl font-bold">Period Started</h2>
            <p className="text-xs text-white/90">Track your symptoms every 3 hours</p>
          </div>

          {/* Symptoms Chart */}
          <div className="bg-white dark:bg-zinc-950 rounded-xl shadow-lg overflow-hidden" style={{ maxHeight: '400px' }}>
            <div className="overflow-x-auto h-full">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-linear-to-r from-purple-100 to-pink-100 dark:from-zinc-900 dark:to-zinc-800">
                    <th className="px-3 py-1.5 text-left font-bold text-gray-800 dark:text-zinc-100 sticky left-0 bg-purple-100 dark:bg-zinc-900 text-xs">
                      Symptoms
                    </th>
                    {dayIndices.map((dayIndex) => {
                      const date = new Date(startDate)
                      date.setDate(date.getDate() + dayIndex)
                      return (
                        <th key={dayIndex} className="px-3 py-1.5 text-center font-semibold text-gray-700 dark:text-zinc-200 min-w-20">
                          <div className="text-xs">Day {dayIndex + 1}</div>
                          <div className="text-[10px] text-gray-600 dark:text-zinc-400">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {SYMPTOM_TYPES.map((symptom, symptomIndex) => (
                    <tr key={symptom} className={symptomIndex % 2 === 0 ? 'bg-gray-50 dark:bg-zinc-900' : 'bg-white dark:bg-zinc-950'}>
                      <td className="px-3 py-2 font-semibold text-gray-700 dark:text-zinc-200 border-r border-gray-200 dark:border-zinc-800 sticky left-0 bg-inherit text-xs">
                        {symptom}
                      </td>
                      {dayIndices.map((dayIndex) => {
                        const currentValue = symptomTracking[`day${dayIndex}`]?.[`slot${currentTimeSlot}`]?.[symptom]
                        
                        // Get flow level for color
                        let flowLevel = 2 // default neutral
                        if (symptom === 'Blood Flow') {
                          flowLevel = getFlowLevel(currentValue)
                        }
                        
                        return (
                          <td key={`${dayIndex}-${symptom}`} className="border border-gray-200 dark:border-zinc-800 p-2">
                            {symptom === 'Blood Flow' ? (
                              <div className="flex flex-col items-center gap-1">
                                <div
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: getFlowColor(flowLevel) }}
                                ></div>
                                <span className="text-[10px] text-gray-600 dark:text-zinc-400">
                                  {symptomLabels['Blood Flow'][flowLevel]}
                                </span>
                              </div>
                            ) : (
                                <div className="text-center text-[11px] text-gray-700 dark:text-zinc-200 font-medium">
                                  {symptomLabels[symptom][typeof currentValue === 'number' ? currentValue : 2]}
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
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-3 flex-1 flex flex-col gap-3">
            {/* Hygiene Tips */}
            <div>
              <h3 className="text-xs font-bold text-gray-800 dark:text-zinc-100 mb-2">
                Hygiene & Care Tips
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {hygieneTips.map((item, index) => (
                  <div
                    key={index}
                    className={`p-2.5 rounded-lg bg-linear-to-r ${item.color} text-white transition-all duration-300 hover:scale-105`}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-white/80"></div>
                      <p className="text-[9px] font-medium leading-tight text-center">{item.tip}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nutrition Recommendations */}
            <div>
              <h3 className="text-xs font-bold text-gray-800 dark:text-zinc-100 mb-2">
                Nutrition Recommendations
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  'Leafy greens for iron',
                  'Nuts for magnesium',
                  'Citrus for vitamin C',
                  'Berries for antioxidants',
                  'Fish for omega-3',
                  'Dark chocolate (small amounts)'
                ].map((label, index) => (
                  <div
                    key={label}
                    className={`p-2 rounded-lg text-white ${[
                      'bg-linear-to-r from-green-400 to-emerald-400',
                      'bg-linear-to-r from-orange-400 to-amber-400',
                      'bg-linear-to-r from-yellow-400 to-orange-300',
                      'bg-linear-to-r from-red-400 to-rose-400',
                      'bg-linear-to-r from-blue-400 to-cyan-400',
                      'bg-linear-to-r from-purple-400 to-pink-400'
                    ][index]}`}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-white/80"></div>
                      <p className="text-[9px] font-medium leading-tight text-center">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Time Slots & Predictions (2 columns) */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          {/* Time Slot Entry */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-3 flex-1 overflow-y-auto">
            <h3 className="text-xs font-bold text-gray-800 dark:text-zinc-100 mb-2 flex items-center justify-between">
              <span>Time Slot Entry</span>
              <span className="text-purple-600 dark:text-pink-300">Day {currentDayIndex + 1} - {TIME_SLOTS[currentTimeSlot]}</span>
            </h3>
            
            <div className="space-y-3">
              {SYMPTOM_TYPES.map((symptom) => {
                const currentValue = symptomTracking[`day${currentDayIndex}`]?.[`slot${currentTimeSlot}`]?.[symptom]
                let currentIndex = typeof currentValue === 'number' ? currentValue : 2
                
                // Get flow level if it's Flow symptom
                let flowLevel = currentIndex
                if (symptom === 'Blood Flow') {
                  flowLevel = getFlowLevel(currentValue)
                  currentIndex = flowLevel
                }
                
                return (
                  <div key={symptom} className="p-2 bg-linear-to-br from-purple-50 to-pink-50 dark:from-zinc-900 dark:to-zinc-800 rounded-lg">
                    <div className="font-semibold text-gray-700 dark:text-zinc-200 mb-2 text-xs">{symptom}</div>
                    <div className="space-y-2">
                      {/* Emoji Display with Flow color variation */}
                      {symptom === 'Blood Flow' ? (
                        <div className="flex flex-col items-center gap-1">
                          <div
                            className="w-6 h-6 rounded-full"
                            style={{ backgroundColor: getFlowColor(flowLevel) }}
                          ></div>
                          <span className="text-[11px] text-gray-600 dark:text-zinc-400">
                            {symptomLabels['Blood Flow'][flowLevel]}
                          </span>
                        </div>
                      ) : (
                          <div className="text-center text-[12px] text-gray-700 dark:text-zinc-200 font-medium">
                            {symptomLabels[symptom][currentIndex]}
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
                          updateSymptom(currentDayIndex, symptom, newIndex)
                        }}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer slider-thumb"
                        style={{
                          background: 'linear-gradient(to right, #e0c3fc, #d8b4fe, #c084fc, #a855f7, #9333ea)'
                        }}
                      />
                      
                      {/* Label */}
                      <div className="text-center text-[10px] text-gray-600 dark:text-zinc-400 font-medium">
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
                  <div className="text-[9px] text-gray-600 dark:text-zinc-400">Current Day</div>
                  <div className="font-bold text-gray-800 dark:text-zinc-100 text-xs">{safeDayIndex + 1} of {totalDays}</div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] text-gray-600 dark:text-zinc-400">Time Slot</div>
                  <div className="font-bold text-gray-800 dark:text-zinc-100 text-xs">{currentTimeSlot + 1} of 8</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setCurrentDayIndex(Math.max(0, safeDayIndex - 1))}
                  disabled={safeDayIndex === 0}
                  className="px-2 py-1.5 text-xs bg-pink-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-600 transition-all duration-300"
                >
                  ← Prev Day
                </button>
                <button
                  onClick={() => setCurrentDayIndex(Math.min(totalDays - 1, safeDayIndex + 1))}
                  disabled={safeDayIndex >= totalDays - 1}
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
          <div className="bg-linear-to-br from-purple-100 to-pink-100 dark:from-zinc-900 dark:to-zinc-800 rounded-xl p-3">
            <h4 className="font-bold text-gray-800 dark:text-zinc-100 mb-2 text-xs">
              Predictions
            </h4>
            <div className="space-y-1.5 text-[10px]">
              <p className="flex justify-between"><span className="text-gray-600 dark:text-zinc-400">Next Period:</span><span className="font-semibold text-purple-700 dark:text-pink-400">{fmt(predictions.nextPeriod)}</span></p>
              <p className="flex justify-between"><span className="text-gray-600 dark:text-zinc-400">Cycle Length:</span><span className="font-semibold text-purple-700 dark:text-pink-400">{cycleLength} days</span></p>
              <p className="flex justify-between"><span className="text-gray-600 dark:text-zinc-400">Ovulation:</span><span className="font-semibold text-purple-700 dark:text-pink-400">{fmt(predictions.ovulation)}</span></p>
            </div>
          </div>

        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-6xl h-[88vh] bg-linear-to-br from-pink-50 to-purple-50 dark:from-zinc-950 dark:to-zinc-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-in">
        
        {/* Header */}
  <div className="bg-linear-to-r from-pink-500 to-purple-600 p-3 text-white">
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
                  <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-4">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={previousMonth}
                        className="w-8 h-8 rounded-full bg-purple-100 hover:bg-purple-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-all duration-300 flex items-center justify-center"
                    >
                        <svg className="w-4 h-4 text-purple-600 dark:text-pink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                      <h3 className="text-base font-bold text-gray-800 dark:text-zinc-100">
                      {monthNames[month]} {year}
                    </h3>
                    <button
                      onClick={nextMonth}
                        className="w-8 h-8 rounded-full bg-purple-100 hover:bg-purple-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-all duration-300 flex items-center justify-center"
                    >
                        <svg className="w-4 h-4 text-purple-600 dark:text-pink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Weekday Headers */}
                  <div className="grid grid-cols-7 gap-1.5 mb-2">
                    {weekDays.map(day => (
                      <div key={day} className="text-center font-semibold text-gray-600 dark:text-zinc-400 text-[10px] py-1">
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
                              ? 'bg-linear-to-br from-purple-500 to-pink-500 shadow-md scale-105'
                              : dayData?.isPeriod
                              ? 'bg-red-500'
                              : dayData?.type === 'pre-symptoms' 
                              ? 'bg-yellow-200'
                                : 'bg-gray-50 hover:bg-gray-100 dark:bg-zinc-900/60 dark:hover:bg-zinc-800'
                          }`}
                          onClick={() => handleDateClick(day)}
                        >
                          <span className={`text-xs font-semibold ${
                            isToday || dayData?.isPeriod ? 'text-white' : 'text-gray-700 dark:text-zinc-200'
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
                      <div className="mt-3 p-3 bg-linear-to-r from-purple-50 to-pink-50 dark:from-zinc-900 dark:to-zinc-800 rounded-lg animate-fade-in">
                        <p className="text-xs font-semibold text-gray-700 dark:text-zinc-200 mb-2">
                        {monthNames[month]} {selectedDate}, {year}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={handlePeriodStart}
                          className="p-2 bg-linear-to-r from-red-400 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 flex flex-col items-center space-y-1"
                        >
                            <div className="w-3 h-3 rounded-full bg-white/90"></div>
                          <span className="text-[10px]">Period Started</span>
                        </button>
                        <button
                          onClick={handlePreSymptoms}
                          className="p-2 bg-linear-to-r from-yellow-400 to-orange-400 text-white rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 flex flex-col items-center space-y-1"
                        >
                            <div className="w-3 h-3 rounded-full bg-white/90"></div>
                          <span className="text-[10px]">Pre-Symptoms</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Legend */}
                  <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-2">
                  <div className="flex items-center justify-center gap-4 text-[10px]">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-2.5 h-2.5 rounded bg-red-500"></div>
                        <span className="text-gray-700 dark:text-zinc-200">Period</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <div className="w-2.5 h-2.5 rounded bg-yellow-200"></div>
                        <span className="text-gray-700 dark:text-zinc-200">Pre-Symptoms</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <div className="w-2.5 h-2.5 rounded bg-linear-to-br from-purple-500 to-pink-500"></div>
                        <span className="text-gray-700 dark:text-zinc-200">Today</span>
                    </div>
                  </div>
                </div>

                {/* Hygiene Tips - Extends to bottom */}
                  <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-3 flex-1">
                    <h3 className="text-xs font-bold text-gray-800 dark:text-zinc-100 mb-2">
                      Hygiene Tips
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {hygieneTips.map((item, index) => (
                      <div
                        key={index}
                        className={`p-2 rounded-lg bg-linear-to-r ${item.color} text-white transition-all duration-300`}
                      >
                        <div className="flex items-start space-x-1.5">
                          <div className="w-2 h-2 rounded-full bg-white/80 mt-1"></div>
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
                    <div className="bg-linear-to-br from-purple-100 to-pink-100 dark:from-zinc-900 dark:to-zinc-800 rounded-xl p-3">
                      <h4 className="font-bold text-gray-800 dark:text-zinc-100 mb-3 text-xs">
                        Cycle Predictions
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="bg-white/60 dark:bg-zinc-900/60 rounded-lg p-2.5">
                          <p className="text-gray-600 dark:text-zinc-400 font-medium mb-1">Next Period:</p>
                          <p className="font-bold text-purple-700 dark:text-pink-400 text-xs">{fmt(predictions.nextPeriod)}</p>
                      </div>
                        <div className="bg-white/60 dark:bg-zinc-900/60 rounded-lg p-2.5">
                          <p className="text-gray-600 dark:text-zinc-400 font-medium mb-1">Cycle Length:</p>
                          <p className="font-bold text-purple-700 dark:text-pink-400 text-xs">{cycleLength} days</p>
                        </div>
                        <div className="bg-white/60 dark:bg-zinc-900/60 rounded-lg p-2.5">
                          <p className="text-gray-600 dark:text-zinc-400 font-medium mb-1">Ovulation:</p>
                          <p className="font-bold text-purple-700 dark:text-pink-400 text-xs">{fmt(predictions.ovulation)}</p>
                        </div>
                        <div className="bg-white/60 dark:bg-zinc-900/60 rounded-lg p-2.5">
                          <p className="text-gray-600 dark:text-zinc-400 font-medium mb-1">Period Duration:</p>
                          <p className="font-bold text-purple-700 dark:text-pink-400 text-xs">{periodLength} days</p>
                      </div>
                        <div className="bg-white/60 dark:bg-zinc-900/60 rounded-lg p-2.5">
                          <p className="text-gray-600 dark:text-zinc-400 font-medium mb-1">Fertile Window:</p>
                          <p className="font-bold text-purple-700 dark:text-pink-400 text-xs">{predictions.fertile ? `${new Date(predictions.fertile.from).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(predictions.fertile.to).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : '—'}</p>
                      </div>
                        <div className="bg-white/60 dark:bg-zinc-900/60 rounded-lg p-2.5">
                          <p className="text-gray-600 dark:text-zinc-400 font-medium mb-1">Cycle Day:</p>
                          <p className="font-bold text-purple-700 dark:text-pink-400 text-xs">{predictions.cycleDay ? `Day ${predictions.cycleDay} of ${cycleLength}` : `— of ${cycleLength}`}</p>
                      </div>
                    </div>
                  </div>

                    {/* AI Recommendations Card */}
                    <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 shadow-md">
                      <h4 className="font-bold text-gray-800 dark:text-zinc-100 mb-2 text-xs">AI Recommendations</h4>
                      {aiLoading && <p className="text-[10px] text-gray-500 dark:text-zinc-400">Generating recommendations…</p>}
                      {aiError && <p className="text-[10px] text-red-500">{aiError}</p>}
                      {!aiLoading && !aiError && (
                        <>
                          {aiSummary && <p className="text-[10px] text-gray-600 dark:text-zinc-300 mb-2">{aiSummary}</p>}
                          <ul className="space-y-1.5 text-[10px]">
                            {(aiRecommendations || []).slice(0, 4).map((rec, idx) => (
                              <li key={idx} className="text-gray-700 dark:text-zinc-200">• {rec.title ? `${rec.title}: ${rec.detail || ''}` : rec}</li>
                            ))}
                          </ul>
                        </>
                      )}
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
