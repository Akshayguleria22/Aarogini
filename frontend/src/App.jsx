import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import AnimatedBackground from './components/background/AnimatedBackground'
import ModernHeader from './components/layout/ModernHeader'
import Footer from './components/layout/Footer'
import HeroSection from './components/sections/HeroSection'
import ArticlesSlider from './components/sections/ArticlesSlider'
import FeatureCards from './components/sections/FeatureCards'
import HealthJourney from './components/sections/HealthJourney'
import NotificationsSection from './components/sections/NotificationsSection'
import ChatBot from './components/chatbot/ChatBot'
import PeriodTracker from './components/tracker/PeriodTracker'
import ModernReportAnalyzer from './components/analyzer/ModernReportAnalyzer'
import MedicineSearch from './components/medicine/MedicineSearch'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Profile from './pages/Profile'
import Landing from './pages/Landing'
import { useAuth } from './context/AuthContext'

function Home() {
  const [activeFeature, setActiveFeature] = useState(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 900)
    return () => clearTimeout(timer)
  }, [])

  const isLoading = pageLoading || !imageLoaded

  return (
    <div className="min-h-screen flex flex-col overflow-y-auto overflow-x-hidden bg-[#f7f3ee] dark:bg-[#0f1515]">

      <AnimatedBackground imageLoaded={imageLoaded} setImageLoaded={setImageLoaded} />

      <ModernHeader />

      {/* Main Content - Single View */}
      <main className="relative z-10 flex-1 px-6 lg:px-10 pb-8 flex flex-col pt-24">
        <div className="flex flex-col space-y-3 py-4">
          {/* Top Section: Article Slider (Left) + Hero (Right) */}
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <ArticlesSlider loading={isLoading} />
            <HeroSection loading={isLoading} />
          </div>

          {/* Feature Cards */}
          <FeatureCards activeFeature={activeFeature} setActiveFeature={setActiveFeature} loading={isLoading} />

          {/* Health Journey */}
          <HealthJourney loading={isLoading} />

          {/* Notifications */}
          <NotificationsSection loading={isLoading} />
        </div>
      </main>

      <Footer />

      {/* Period Tracker Modal - Opens when Period Tracker feature card is clicked */}
      {activeFeature === 0 && <PeriodTracker onClose={() => setActiveFeature(null)} />}

      {/* Medicine Search Modal - Opens when Medicine Search feature card is clicked */}
      {activeFeature === 1 && <MedicineSearch onClose={() => setActiveFeature(null)} />}

      {/* Report Analyzer Modal - Opens when Report Record feature card is clicked */}
      {activeFeature === 2 && <ModernReportAnalyzer onClose={() => setActiveFeature(null)} />}

      {/* ChatBot Modal - Opens when Chat Veda feature card is clicked */}
      {activeFeature === 3 && <ChatBot isOpen={true} onClose={() => setActiveFeature(null)} />}
    </div>
  )
}

function App() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Home /> : <Landing />} />
      <Route path="/landing" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
