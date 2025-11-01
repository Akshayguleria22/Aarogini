import React, { useState, useRef, useEffect } from 'react'
import { getHealthDashboard, getConditionDetails } from '../../services/healthTrackingService'

const HealthJourney = () => {
  const [activeDot, setActiveDot] = useState(0)
  const [cardsStatus, setCardsStatus] = useState({})
  const [trackerOpen, setTrackerOpen] = useState(false)
  const [selectedCondition, setSelectedCondition] = useState(null)
  const [conditionDetails, setConditionDetails] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const scrollContainerRef = useRef(null)

  const healthJourney = [
    { icon: "🩸", name: "Periods & Ovulation" },
    { icon: "🔬", name: "PCOS/PCOD" },
    { icon: "💢", name: "Endometriosis" },
    { icon: "🤰", name: "Pregnancy & Maternal Health" },
    { icon: "👶", name: "Postpartum Health" },
    { icon: "🌡️", name: "Menopause" },
    { icon: "🚽", name: "UTI (Urinary Tract Infection)" },
    { icon: "🌸", name: "Vaginal Health" },
    { icon: "🦋", name: "Thyroid Disorders" },
    { icon: "🎗️", name: "Breast Cancer" },
    { icon: "🎀", name: "Cervical Cancer" },
    { icon: "💉", name: "Anemia" },
    { icon: "🦴", name: "Osteoporosis" },
    { icon: "💭", name: "Depression & Anxiety" },
    { icon: "🧠", name: "Stress / PTSD" },
    { icon: "🪞", name: "Body Image Disorder" },
    { icon: "⚖️", name: "Obesity/ Weight Issues" },
    { icon: "🍬", name: "Diabetes" },
    { icon: "❤️", name: "Hypertension" },
    { icon: "☀️", name: "Vitamin D & Calcium Deficiency" },
    { icon: "💓", name: "Cardiovascular Disease" },
  ]

  // Compute a simple health index (0-100) from status/severity to power a mini tracker bar
  const getHealthIndex = (card) => {
    if (!card) return 0
    // If there's no evidence or reports for this condition, show 0% (no symptoms)
    if (!card.detected && (!card.reportsCount || card.reportsCount === 0)) return 0
    let base = 50
    switch (card.status) {
      case 'ok': base = 92; break
      case 'monitor': base = 60; break
      case 'attention': base = 25; break
      default: base = card.reportsCount > 0 ? 50 : 0
    }
    if (card.severity === 'severe') base -= 15
    else if (card.severity === 'moderate') base -= 7
    else if (card.severity === 'mild') base += 3
    // Add a tiny deterministic jitter per condition for visual variety (stable across renders)
    const hash = (s) => s.split('').reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7)
    const jitter = ((hash(card.condition || 'x') % 7) - 3) // -3..+3
    return Math.max(0, Math.min(100, base + jitter))
  }

  const getStatusMessage = (card) => {
    if (!card) return 'No data'
    if (!card.detected && (!card.reportsCount || card.reportsCount === 0)) return 'No symptoms reported'
    if (card.status === 'ok') return 'All good'
    if (card.status === 'attention') return card.currentHealth ? `Needs attention — ${card.currentHealth}` : 'Needs attention'
    if (card.status === 'monitor') return card.currentHealth ? `Monitor — ${card.currentHealth}` : 'Monitor'
    return card.currentHealth || 'No recent data'
  }

  const openTracker = async (conditionName) => {
    setSelectedCondition(conditionName)
    setTrackerOpen(true)
    setDetailsLoading(true)
    setConditionDetails(null)
    try {
      const resp = await getConditionDetails(conditionName)
      if (resp?.success) setConditionDetails(resp.data)
    } catch {
      // noop, UI will show minimal info
    } finally {
      setDetailsLoading(false)
    }
  }

  // Calculate number of dots needed for 2 rows x 4 columns = 8 cards per page
  const cardsPerPage = 8
  const totalPages = Math.ceil(healthJourney.length / cardsPerPage)

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft
      const scrollWidth = container.scrollWidth - container.clientWidth
      const scrollPercentage = scrollLeft / scrollWidth
      const newActiveDot = Math.round(scrollPercentage * (totalPages - 1))
      setActiveDot(newActiveDot)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [totalPages])

  // Load health dashboard statuses
  useEffect(() => {
    let isMounted = true
    const load = async () => {
      try {
        const resp = await getHealthDashboard()
        if (!resp?.success) return
        const map = {}
          ; (resp.data?.conditionsStatus || []).forEach(c => {
            map[c.condition] = c
          })
        if (isMounted) setCardsStatus(map)
      } catch {
        // ignore errors for homepage widget
      }
    }
    load()
    return () => { isMounted = false }
  }, [])

  const scrollLeft = () => {
    const container = scrollContainerRef.current
    if (!container) return
    
    const scrollAmount = container.clientWidth
    container.scrollBy({
      left: -scrollAmount,
      behavior: 'auto'
    })
  }

  const scrollRight = () => {
    const container = scrollContainerRef.current
    if (!container) return
    
    const scrollAmount = container.clientWidth
    container.scrollBy({
      left: scrollAmount,
      behavior: 'auto'
    })
  }

  return (
    <>
    <div className="flex flex-col space-y-2.5 animate-fade-in animation-delay-600 mt-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: '#3B3A60' }}>Your Health Journey</h2>
        
        {/* Card Progress Indicator */}
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold text-purple-600">
            {Math.min(activeDot * cardsPerPage + 1, healthJourney.length)}-{Math.min((activeDot + 1) * cardsPerPage, healthJourney.length)} <span className="text-gray-400">of {healthJourney.length}</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
                style={{ width: `${((activeDot + 1) / totalPages) * 100}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Scrollable Health Cards - 2 Rows x 4 Columns Sliding Horizontally */}
      <div className="relative" style={{ height: '520px' }}>
        {/* Left Arrow Button */}
        <button
          onClick={scrollLeft}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white shadow-lg hover:shadow-xl rounded-full p-3 transition-all duration-300 group"
          aria-label="Scroll left"
        >
          <svg 
            className="w-5 h-5 text-purple-600 group-hover:text-purple-700 transition-colors" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Right Arrow Button */}
        <button
          onClick={scrollRight}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white shadow-lg hover:shadow-xl rounded-full p-3 transition-all duration-300 group"
          aria-label="Scroll right"
        >
          <svg 
            className="w-5 h-5 text-purple-600 group-hover:text-purple-700 transition-colors" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <div 
          ref={scrollContainerRef}
          className="overflow-x-auto overflow-y-hidden scrollbar-hide h-full snap-x snap-mandatory hw-accelerate"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          <div className="inline-grid grid-rows-2 grid-flow-col gap-3 h-full pb-2">
            {healthJourney.map((item, index) => (
              <div
                key={index}
                className="group snap-start animate-fade-in-up"
                style={{
                  animationDelay: `${index * 40 + 600}ms`,
                  width: 'calc((100vw - 120px) / 4)',
                  minWidth: '200px',
                  maxWidth: '300px'
                }}
              >
                <div
                  className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 hover:-translate-y-1 flex flex-col items-center justify-center"
                  onClick={() => openTracker(item.name)}
                  style={{
                    minHeight: '240px',
                    height: '100%'
                  }}
                >
                  <div className="w-16 h-16 bg-linear-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform duration-300">
                    <div className="transform group-hover:scale-125 transition-transform duration-200 text-4xl">
                      {item.icon}
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-center leading-tight" style={{ color: '#3B3A60' }}>{item.name}</p>
                  {cardsStatus[item.name] && (
                    <div className="mt-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full ${cardsStatus[item.name].status === 'attention' ? 'bg-red-100 text-red-700' :
                            cardsStatus[item.name].status === 'monitor' ? 'bg-yellow-100 text-yellow-700' :
                              cardsStatus[item.name].detected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                            }`}
                          title={cardsStatus[item.name].severity || ''}
                        >
                          {cardsStatus[item.name].status === 'attention' ? 'Attention' :
                            cardsStatus[item.name].status === 'monitor' ? 'Monitor' :
                              cardsStatus[item.name].detected ? 'OK' : 'Unknown'}
                        </span>
                        {cardsStatus[item.name].reportsCount > 0 && (
                          <span className="text-[11px] text-gray-500">{cardsStatus[item.name].reportsCount} report{cardsStatus[item.name].reportsCount > 1 ? 's' : ''}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-600 mt-1 line-clamp-2">
                        {getStatusMessage(cardsStatus[item.name])}
                      </p>
                      {/* Mini tracker bar */}
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                          <span>Tracker</span>
                          <span>{getHealthIndex(cardsStatus[item.name])}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${getHealthIndex(cardsStatus[item.name])}%`, background: 'linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #10b981 100%)' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Gradient fade on sides */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-linear-to-r from-[#F8F7FC] to-transparent pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-linear-to-l from-[#F8F7FC] to-transparent pointer-events-none"></div>
        </div>
      </div >

      {/* Tracker Modal */}
      {
        trackerOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="px-5 py-4 bg-linear-to-r from-purple-500 to-pink-500 text-white flex items-center justify-between">
                <h3 className="text-lg font-bold">{selectedCondition || 'Tracker'}</h3>
                <button onClick={() => setTrackerOpen(false)} className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-full">×</button>
              </div>
              <div className="p-5 space-y-4">
                {detailsLoading ? (
                  <p className="text-sm text-gray-600">Loading…</p>
                ) : (
                  <>
                    {/* Summary Row */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-lg border p-3">
                        <p className="text-[11px] text-gray-500">Reports</p>
                        <p className="font-semibold text-gray-800 text-lg">{cardsStatus[selectedCondition]?.reportsCount ?? 0}</p>
                      </div>
                      <div className="rounded-lg border p-3">
                        <p className="text-[11px] text-gray-500">Status</p>
                        <p className="font-semibold text-gray-800 text-sm capitalize">{cardsStatus[selectedCondition]?.status || 'unknown'}</p>
                      </div>
                      <div className="rounded-lg border p-3">
                        <p className="text-[11px] text-gray-500">Tracker</p>
                        <div className="mt-1">
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${getHealthIndex(cardsStatus[selectedCondition])}%`, background: 'linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #10b981 100%)' }} />
                          </div>
                          <p className="text-[11px] text-gray-600 mt-1">{getHealthIndex(cardsStatus[selectedCondition])}% — {getStatusMessage(cardsStatus[selectedCondition])}</p>
                        </div>
                      </div>
                    </div>

                    {/* Current */}
                    <div className="rounded-lg border p-4">
                      <p className="text-[11px] text-gray-500">Current</p>
                      <p className="text-sm text-gray-800 mt-1">{cardsStatus[selectedCondition]?.currentHealth || 'No recent data'}</p>
                    </div>

                    {/* WHO & Recommendations */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border p-4">
                        <p className="text-[11px] text-gray-500">WHO</p>
                        <p className="text-sm text-gray-800 mt-1">{cardsStatus[selectedCondition]?.whoGuidelines ? `${cardsStatus[selectedCondition].whoGuidelines.title} (${cardsStatus[selectedCondition].whoGuidelines.count})` : '—'}</p>
                      </div>
                      <div className="rounded-lg border p-4">
                        <p className="text-[11px] text-gray-500">Recommendations</p>
                        <p className="text-sm text-gray-800 mt-1">{(cardsStatus[selectedCondition]?.aiRecommendations || []).slice(0, 2).join('; ') || '—'}</p>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="rounded-lg border p-4">
                      <p className="text-[11px] text-gray-500 mb-2">Recent Timeline</p>
                      {conditionDetails?.timeline?.length ? (
                        <div className="space-y-2 max-h-40 overflow-auto pr-1">
                          {conditionDetails.timeline.slice(0, 5).map((t, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">{new Date(t.date).toLocaleDateString()}</span>
                              <span className="text-gray-800">{t.abnormalFindings} abnormal finding(s)</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">No historical data.</p>
                      )}
                    </div>
                  </>
                )}
              </div>
              <div className="p-4 pt-0 flex items-center justify-end">
                <button onClick={() => setTrackerOpen(false)} className="px-4 py-2 rounded-lg bg-linear-to-r from-purple-500 to-pink-500 text-white font-semibold">Close</button>
              </div>
            </div>
          </div>
        )}
    </>
  )
}

export default HealthJourney
