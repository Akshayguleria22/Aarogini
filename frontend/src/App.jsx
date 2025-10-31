import React, { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import './App.css'
import AnimatedBackground from './components/background/AnimatedBackground'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import HeroSection from './components/sections/HeroSection'
import ArticlesSlider from './components/sections/ArticlesSlider'
import FeatureCards from './components/sections/FeatureCards'
import HealthJourney from './components/sections/HealthJourney'
import ChatBot from './components/chatbot/ChatBotButton'
import PeriodTracker from './components/tracker/PeriodTracker'
import ReportAnalyzer from './components/analyzer/ReportAnalyzer'
import MedicineSearch from './components/medicine/MedicineSearch'
import Login from './pages/Login'
import SignUp from './pages/SignUp'

function Home() {
  const [activeFeature, setActiveFeature] = useState(null)
  const [imageLoaded, setImageLoaded] = useState(false)

  return (
    <div className="min-h-screen flex flex-col overflow-y-auto overflow-x-hidden" style={{ background: 'linear-gradient(135deg, #F8F7FC 0%, #EDE7F6 50%, #E8DFF5 100%)' }}>

      <AnimatedBackground imageLoaded={imageLoaded} setImageLoaded={setImageLoaded} />

      <Header />

      {/* Main Content - Single View */}
      <main className="relative z-10 flex-1 px-8 pb-6 flex flex-col pt-24">
        <div className="flex flex-col space-y-3 py-4">
          {/* Top Section: Article Slider (Left) + Hero (Right) */}
          <div className="flex gap-6 items-start">
            <ArticlesSlider />
            <HeroSection />
          </div>

          {/* Feature Cards */}
          <FeatureCards activeFeature={activeFeature} setActiveFeature={setActiveFeature} />

          {/* Health Journey */}
          <HealthJourney />
        </div>
      </main>

      <Footer />

      {/* Period Tracker Modal - Opens when Period Tracker feature card is clicked */}
      {activeFeature === 0 && <PeriodTracker onClose={() => setActiveFeature(null)} />}

      {/* Medicine Search Modal - Opens when Medicine Search feature card is clicked */}
      {activeFeature === 1 && <MedicineSearch onClose={() => setActiveFeature(null)} />}

      {/* Report Analyzer Modal - Opens when Report Record feature card is clicked */}
      {activeFeature === 2 && <ReportAnalyzer onClose={() => setActiveFeature(null)} />}

      {/* ChatBot Modal - Opens when Chat Veda feature card is clicked */}
      {activeFeature === 3 && <ChatBot onClose={() => setActiveFeature(null)} />}
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
    </Routes>
  )
}

export default App
