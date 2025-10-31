import React, { useState, useRef, useEffect } from 'react'

const HealthJourney = () => {
  const [activeDot, setActiveDot] = useState(0)
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
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
              style={{ 
                width: `${((activeDot + 1) / totalPages) * 100}%` 
              }}
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
                  style={{
                    minHeight: '240px',
                    height: '100%'
                  }}
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform duration-300">
                    <div className="transform group-hover:scale-125 transition-transform duration-200 text-4xl">
                      {item.icon}
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-center leading-tight" style={{ color: '#3B3A60' }}>{item.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Gradient fade on sides */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#F8F7FC] to-transparent pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#F8F7FC] to-transparent pointer-events-none"></div>
      </div>
    </div>
  )
}

export default HealthJourney
