import React from 'react'
import Skeleton from '../ui/Skeleton'

const HeroSection = ({ loading }) => {
  if (loading) {
    return (
      <div className="space-y-3 pt-2 flex-1">
        <Skeleton className="h-10 w-2/3 rounded-xl" />
        <Skeleton className="h-10 w-1/2 rounded-xl" />
        <Skeleton className="h-5 w-full rounded-lg" />
        <Skeleton className="h-5 w-5/6 rounded-lg" />
        <Skeleton className="h-5 w-3/4 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-slide-in-left pt-2 flex-1">
      <h1 className="text-5xl font-bold leading-tight tracking-tight font-display" style={{ color: '#1f2a2e' }}>
        Aarogini: <br />
        <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-orange-400 bg-clip-text text-transparent">
          Your Daily Health Guide
        </span>
      </h1>
      <p className="text-lg leading-relaxed max-w-2xl text-zinc-600 dark:text-zinc-300">
        Personalized health tracking, expert guidance, and holistic wellness support for every stage of life.
        From cycle insights to pregnancy care, postpartum recovery to menopause support, Aarogini keeps your health journey organized,
        clear, and actionable.
      </p>
    </div>
  )
}

export default HeroSection
