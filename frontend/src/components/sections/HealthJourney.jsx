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

  // Calculate number of dots needed (assuming 6-7 cards visible at a time)
  const totalDots = Math.ceil(healthJourney.length / 3)

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft
      const scrollWidth = container.scrollWidth - container.clientWidth
      const scrollPercentage = scrollLeft / scrollWidth
      const newActiveDot = Math.round(scrollPercentage * (totalDots - 1))
      setActiveDot(newActiveDot)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [totalDots])

  const scrollLeft = () => {
    const container = scrollContainerRef.current
    if (!container) return
    
    const scrollAmount = container.clientWidth * 0.8
    container.scrollBy({
      left: -scrollAmount,
      behavior: 'auto'
    })
  }

  const scrollRight = () => {
    const container = scrollContainerRef.current
    if (!container) return
    
    const scrollAmount = container.clientWidth * 0.8
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
            {Math.min(Math.floor(activeDot * 3) + 1, healthJourney.length)}-{Math.min(Math.floor(activeDot * 3) + 7, healthJourney.length)} <span className="text-gray-400">of {healthJourney.length}</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
              style={{ 
                width: `${((activeDot + 1) / totalDots) * 100}%` 
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Scrollable Health Cards - Single Row with Fixed Height */}
      <div className="relative" style={{ height: '180px' }}>
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
          className="flex gap-4 overflow-x-auto overflow-y-hidden pb-2 scrollbar-hide h-full snap-x snap-mandatory hw-accelerate"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {healthJourney.map((item, index) => (
            <div
              key={index}
              className="group snap-start animate-fade-in-up shrink-0"
              style={{ animationDelay: `${index * 40 + 600}ms`, width: '180px' }}
            >
              <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 hover:-translate-y-1 h-full flex flex-col items-center justify-center">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-2.5 group-hover:rotate-12 transition-transform duration-300">
                  <div className="transform group-hover:scale-125 transition-transform duration-200 text-3xl">
                    {item.icon}
                  </div>
                </div>
                <p className="text-sm font-medium text-center leading-tight" style={{ color: '#3B3A60' }}>{item.name}</p>
              </div>
            </div>
          ))}
        </div>
        
        {/* Gradient fade on sides */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#F8F7FC] to-transparent pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#F8F7FC] to-transparent pointer-events-none"></div>
      </div>
    </div>
  )
}

export default HealthJourney
