import React from 'react'

const HeroSection = () => {
  return (
    <div className="space-y-2 animate-slide-in-left pt-2">
      <h1 className="text-4xl font-bold leading-tight tracking-tight" style={{ color: '#3B3A60' }}>
        Holistic Wellness: <br />
        <span className="bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Your Daily Guide
        </span>
      </h1>
      <p className="text-base leading-relaxed max-w-2xl" style={{ color: '#6B6A7D' }}>
        Empowering women through personalized health tracking, expert guidance, and holistic wellness solutions for every stage of life.
      </p>
    </div>
  )
}

export default HeroSection
