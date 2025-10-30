import React, { useState } from 'react'
import './App.css'
import AnimatedBackground from './components/background/AnimatedBackground'
import Header from './components/layout/Header'
import HeroSection from './components/sections/HeroSection'
import ArticlesSlider from './components/sections/ArticlesSlider'
import FeatureCards from './components/sections/FeatureCards'
import HealthJourney from './components/sections/HealthJourney'

function App() {
  const [activeFeature, setActiveFeature] = useState(null)
  const [imageLoaded, setImageLoaded] = useState(false)

  return (
    <div className="min-h-screen flex flex-col overflow-y-auto overflow-x-hidden" style={{ background: 'linear-gradient(135deg, #F8F7FC 0%, #EDE7F6 50%, #E8DFF5 100%)' }}>

      <AnimatedBackground imageLoaded={imageLoaded} setImageLoaded={setImageLoaded} />

      <Header />

      {/* Main Content - Single View */}
      <main className="relative z-10 flex-1 px-8 pb-6 flex flex-col pt-24">
        <div className="flex flex-col space-y-3 py-4">
          <HeroSection />
          <ArticlesSlider />
          <FeatureCards activeFeature={activeFeature} setActiveFeature={setActiveFeature} />
          <HealthJourney />
        </div>
      </main>
    </div>
  )
}

export default App
