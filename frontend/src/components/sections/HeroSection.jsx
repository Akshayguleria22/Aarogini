import React from 'react'

const HeroSection = () => {
  return (
    <div className="space-y-3 animate-slide-in-left pt-2 flex-1">
      <h1 className="text-5xl font-bold leading-tight tracking-tight" style={{ color: '#3B3A60' }}>
        Aarogini: <br />
        <span className="bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Your Daily Guide
        </span>
      </h1>
      <p className="text-lg leading-relaxed max-w-2xl" style={{ color: '#6B6A7D' }}>
        Empowering women through personalized health tracking, expert guidance, and holistic wellness solutions for every stage of life. 
        From menstrual cycle tracking to pregnancy care, postpartum support to menopause management.
        Connect with healthcare professionals, access curated articles, and discover personalized wellness plans designed specifically
        for women's unique health needs.
      </p>
    </div>
  )
}

export default HeroSection
