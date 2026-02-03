import React from 'react'
import { cn } from '../../lib/utils'
import Skeleton from '../ui/Skeleton'

const FeatureCards = ({ activeFeature, setActiveFeature, loading }) => {
  const mainFeatures = [
    { img: '/blood.jpg', name: 'PERIOD TRACKER' },
    { img: '/medicine.jpg', name: 'MEDICINE SEARCH' },
    { img: '/report.jpg', name: 'REPORT RECORD' },
    { img: '/chat.jpg', name: 'CHAT VEDA (AI CHATBOT)' },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 min-h-[240px]"
          >
            <Skeleton className="w-16 h-16 rounded-full mb-4" />
            <Skeleton className="h-4 w-3/4 rounded-md" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-4 gap-3 animate-fade-in animation-delay-200">
      {mainFeatures.map((feature, index) => (
        <div
          key={index}
          onClick={() => setActiveFeature(index)}
          className={cn(
            "group relative p-6 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105",
            "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800",
            "hover:shadow-2xl hover:border-pink-500 dark:hover:border-pink-500",
            activeFeature === index && "border-pink-500 dark:border-pink-500 shadow-2xl shadow-pink-500/20",
            "min-h-[240px] flex flex-col justify-center items-center"
          )}
          style={{
            animationDelay: `${index * 100 + 400}ms`,
          }}
        >
          <div className="mb-4 transition-all duration-300 group-hover:scale-110">
            <img
              src={feature.img}
              alt={feature.name}
              className="w-16 h-16 rounded-full object-cover shadow-md ring-2 ring-pink-500/50"
            />
          </div>
          <p className={cn(
            "text-xs font-semibold tracking-wider uppercase leading-tight text-center",
            "text-zinc-700 dark:text-zinc-300",
            activeFeature === index && "text-pink-600 dark:text-pink-400"
          )}>
            {feature.name}
          </p>
        </div>
      ))}
    </div>
  )
}

export default FeatureCards
