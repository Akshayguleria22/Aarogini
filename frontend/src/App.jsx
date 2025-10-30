import React, { useEffect, useState } from 'react'
import './App.css'

// Icon Components with SVG paths
const MenuIcon = () => (
  <svg className="w-6 h-6 text-purple-900 hover:text-purple-600 transition-colors duration-300 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)

const UserIcon = () => (
  <svg className="w-6 h-6 text-purple-900 hover:text-purple-600 transition-colors duration-300 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const CalendarIcon = () => (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const MedicineIcon = () => (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
)

const ChartIcon = () => (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const ChatIcon = () => (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
)

// Small icons for health journey
const SmileIcon = () => <span className="text-2xl">😊</span>
const YogaIcon = () => <span className="text-2xl">🧘</span>
const WaterIcon = () => <span className="text-2xl">💧</span>
const FlowerIcon = () => <span className="text-2xl">🌸</span>
const ClockIcon = () => <span className="text-2xl">⏰</span>
const DollarIcon = () => <span className="text-2xl">💰</span>
const SleepIcon = () => <span className="text-2xl">😴</span>
const FoodIcon = () => <span className="text-2xl">🥗</span>

function App() {
  const [scrollY, setScrollY] = useState(0)
  const [activeFeature, setActiveFeature] = useState(1)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const mainFeatures = [
    { icon: CalendarIcon, name: "PERIOD TRACKER", color: "from-pink-400 to-purple-400" },
    { icon: MedicineIcon, name: "MEDICINE SEARCH", color: "from-purple-400 to-purple-500" },
    { icon: ChartIcon, name: "REPORT RECORD", color: "from-purple-500 to-indigo-500" },
    { icon: ChatIcon, name: "CHAT VEDA (AI CHATBOT)", color: "from-indigo-400 to-purple-400" },
  ]

  const healthJourney = [
    { icon: SmileIcon, name: "Mood Journal" },
    { icon: YogaIcon, name: "Yoga & Fitness" },
    { icon: WaterIcon, name: "Water Tracker" },
    { icon: FlowerIcon, name: "First Period Guide" },
    { icon: ClockIcon, name: "Appointment Hub" },
    { icon: DollarIcon, name: "Financial Wellness" },
    { icon: SleepIcon, name: "Sleep Tracker" },
    { icon: FoodIcon, name: "Nutrition Guide" },
  ]

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{background: 'linear-gradient(135deg, #F8F7FC 0%, #EDE7F6 50%, #E8DFF5 100%)'}}>
      
      {/* Animated Background Shapes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        
        {/* Floating leaves */}
        <div className="absolute top-1/4 left-1/4 animate-float text-purple-200 opacity-40 text-6xl" style={{animationDelay: '0s'}}>🍃</div>
        <div className="absolute top-1/3 right-1/4 animate-float text-purple-200 opacity-40 text-5xl" style={{animationDelay: '2s'}}>🌿</div>
        <div className="absolute bottom-1/4 left-1/3 animate-float text-purple-200 opacity-40 text-4xl" style={{animationDelay: '4s'}}>🍃</div>
      </div>

      {/* Pregnant Woman Illustration - Top Right Corner */}
      <div className="absolute top-6 right-6 z-20 animate-fade-in">
        <div className="relative w-32 h-32">
          {/* Animated glow background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-300 via-pink-200 to-purple-200 rounded-full blur-2xl opacity-40 animate-pulse-slow"></div>
          
          {/* Main circle with gradient border */}
          <div className="absolute inset-2 bg-white/60 backdrop-blur-md rounded-full border-2 border-purple-200/50 shadow-xl animate-spin-very-slow"></div>
          
          {/* Floating leaves */}
          <div className="absolute -top-2 -left-2 text-2xl animate-float" style={{animationDelay: '0s'}}>🍃</div>
          <div className="absolute -top-1 -right-2 text-xl animate-float" style={{animationDelay: '1s'}}>🌿</div>
          
          {/* Pregnant woman illustration */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="relative animate-bounce-slow scale-75">
              {/* Head */}
              <div className="relative w-10 h-10 mx-auto mb-1">
                {/* Hair */}
                <div className="absolute -top-1 -left-1 w-12 h-8 rounded-full animate-pulse" style={{background: '#5D4C84'}}></div>
                {/* Face */}
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-8 h-6 rounded-full" style={{background: 'linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%)'}}></div>
                {/* Eyes */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex space-x-1">
                  <div className="w-1 h-1 bg-purple-900 rounded-full animate-blink"></div>
                  <div className="w-1 h-1 bg-purple-900 rounded-full animate-blink"></div>
                </div>
              </div>
              
              {/* Body */}
              <div className="relative">
                {/* Torso with gradient */}
                <div className="w-8 h-12 rounded-t-3xl mx-auto relative overflow-hidden" style={{background: 'linear-gradient(135deg, #B2A5E3 0%, #9B7EE3 100%)'}}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 animate-shimmer"></div>
                </div>
                
                {/* Arms */}
                <div className="absolute top-2 -left-4 w-6 h-2 rounded-full transform rotate-45 animate-wave" style={{background: '#B2A5E3'}}></div>
                <div className="absolute top-2 -right-4 w-6 h-2 rounded-full transform -rotate-45 animate-wave animation-delay-1000" style={{background: '#B2A5E3'}}></div>
                
                {/* Belly (pregnancy) */}
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full" style={{background: 'linear-gradient(135deg, #C8BBF3 0%, #B2A5E3 100%)'}}></div>
                
                {/* Legs (sitting cross-legged) */}
                <div className="relative mt-1">
                  <div className="w-10 h-4 rounded-full mx-auto" style={{background: 'linear-gradient(135deg, #8B6FF0 0%, #7C3AED 100%)'}}></div>
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-12 h-3 rounded-full" style={{background: 'linear-gradient(135deg, #8B6FF0 0%, #7C3AED 100%)'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center px-8 py-4">
        {/* Logo with creative animated background */}
        <div className="relative group cursor-pointer">
          <div className="absolute -inset-4 bg-gradient-to-r from-purple-400 via-pink-300 to-purple-300 rounded-full blur-xl opacity-40 group-hover:opacity-70 animate-pulse-slow transition-opacity duration-500"></div>
          <div className="absolute -inset-3 bg-gradient-to-r from-purple-300 to-pink-200 rounded-full blur-lg opacity-30 group-hover:opacity-60 animate-spin-slow transition-opacity duration-500"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg group-hover:shadow-2xl transition-all duration-300 transform group-hover:scale-105">
            <img 
              src="/logof.png" 
              alt="Aarogini Logo" 
              className="h-12 w-auto object-contain"
            />
          </div>
        </div>

        {/* Right icons */}
        <div className="flex items-center space-x-4">
          <div className="relative group">
            <div className="absolute -inset-2 bg-purple-300 rounded-full blur opacity-0 group-hover:opacity-40 transition-opacity duration-300"></div>
            <div className="relative bg-white/70 backdrop-blur-sm p-2 rounded-full shadow-md hover:shadow-lg transition-all duration-300">
              <UserIcon />
            </div>
          </div>
          <div className="relative group">
            <div className="absolute -inset-2 bg-purple-300 rounded-full blur opacity-0 group-hover:opacity-40 transition-opacity duration-300"></div>
            <div className="relative bg-white/70 backdrop-blur-sm p-2 rounded-full shadow-md hover:shadow-lg transition-all duration-300">
              <MenuIcon />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Single View */}
      <main className="relative z-10 flex-1 px-8 pb-8 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col space-y-6">
          
          {/* Hero Text - Compact */}
          <div className="space-y-2 animate-slide-in-left">
            <h1 className="text-4xl font-bold leading-tight" style={{color: '#3B3A60'}}>
              Holistic Wellness: <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">Your Daily Guide</span>
            </h1>
            <p className="text-base leading-relaxed max-w-3xl" style={{color: '#8B8A9D'}}>
              Empowering women through personalized health tracking, expert guidance, and holistic wellness solutions for every stage of life.
            </p>
          </div>

          {/* Main Feature Cards - Single Row */}
          <div className="grid grid-cols-4 gap-4 animate-fade-in animation-delay-200">
            {mainFeatures.map((feature, index) => (
              <div
                key={index}
                onClick={() => setActiveFeature(index)}
                className={`group relative p-6 rounded-3xl cursor-pointer transform transition-all duration-500 hover:scale-105 animate-fade-in-up`}
                style={{
                  animationDelay: `${index * 100 + 400}ms`,
                  background: activeFeature === index 
                    ? 'linear-gradient(135deg, #A38AEB 0%, #9370DB 100%)' 
                    : '#FFFFFF',
                  boxShadow: activeFeature === index
                    ? '0 20px 40px rgba(163, 138, 235, 0.4)'
                    : '0 10px 25px rgba(0, 0, 0, 0.05)'
                }}
              >
                {/* Shine effect on hover */}
                <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                
                <div className={`mb-3 transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-12 ${activeFeature === index ? 'text-white' : 'text-purple-600'}`}>
                  <feature.icon />
                </div>
                <p className={`text-xs font-semibold tracking-wider uppercase ${activeFeature === index ? 'text-white' : 'text-gray-700'}`}>
                  {feature.name}
                </p>
              </div>
            ))}
          </div>

          {/* Health Journey Section - 4 Column Grid with Horizontal Scroll */}
          <div className="flex-1 flex flex-col space-y-3 animate-fade-in animation-delay-600 overflow-hidden">
            <h2 className="text-2xl font-bold" style={{color: '#3B3A60'}}>Your Health Journey</h2>
            
            {/* Scrollable Health Cards - 4 Rows x Multiple Columns */}
            <div className="relative flex-1 overflow-hidden">
              <div className="grid grid-rows-2 grid-flow-col gap-4 overflow-x-auto overflow-y-hidden pb-2 scrollbar-hide h-full auto-cols-[minmax(140px,1fr)]">
                {healthJourney.map((item, index) => (
                  <div
                    key={index}
                    className="group snap-center animate-fade-in-up h-full"
                    style={{animationDelay: `${index * 60 + 800}ms`}}
                  >
                    <div className="bg-white p-4 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:scale-105 hover:-translate-y-1 h-full flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-2 group-hover:rotate-12 transition-transform duration-500">
                        <div className="transform group-hover:scale-125 transition-transform duration-300">
                          <item.icon />
                        </div>
                      </div>
                      <p className="text-xs font-medium text-center" style={{color: '#3B3A60'}}>{item.name}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Gradient fade on sides */}
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#F8F7FC] to-transparent pointer-events-none"></div>
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#F8F7FC] to-transparent pointer-events-none"></div>
            </div>

            {/* Pagination Dots */}
            <div className="flex justify-center space-x-3">
              {[0, 1, 2, 3].map((dot, index) => (
                <div 
                  key={index}
                  className={`h-2 rounded-full transition-all duration-500 ${
                    index === 1 
                      ? 'w-8 bg-gradient-to-r from-purple-500 to-pink-500' 
                      : 'w-2 bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
