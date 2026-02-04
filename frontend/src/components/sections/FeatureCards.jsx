import React from 'react'
import { cn } from '../../lib/utils'
import Skeleton from '../ui/Skeleton'

const FeatureCards = ({ activeFeature, setActiveFeature, loading }) => {
  const mainFeatures = [
    { img: '/blood.jpg', name: 'Period Tracker', description: 'Cycle predictions, daily symptoms, and personalized insights.', accent: 'from-emerald-500 to-teal-500' },
    { img: '/medicine.jpg', name: 'Medicine Search', description: 'Clear summaries, interactions, and safety guidance.', accent: 'from-orange-500 to-amber-500' },
    { img: '/report.jpg', name: 'Report Analyzer', description: 'Lab extraction, abnormal flags, and next steps.', accent: 'from-sky-500 to-cyan-500' },
    { img: '/chat.jpg', name: 'Chat Veda', description: 'Long-form answers with context from your health profile.', accent: 'from-rose-500 to-orange-500' },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in animation-delay-200">
      {mainFeatures.map((feature, index) => (
        <div
          key={index}
          onClick={() => setActiveFeature(index)}
          className={cn(
            "group relative p-6 rounded-2xl cursor-pointer transition-all duration-300 hover:translate-y-[-4px]",
            "bg-white/80 dark:bg-zinc-900/70 border border-white/60 dark:border-zinc-800",
            "shadow-lg hover:shadow-2xl",
            activeFeature === index && "ring-2 ring-emerald-400/60",
            "min-h-[260px] flex flex-col justify-between"
          )}
          style={{
            animationDelay: `${index * 100 + 400}ms`,
          }}
        >
          <div className="flex items-center gap-3">
            <div className={cn("p-[2px] rounded-2xl bg-gradient-to-r", feature.accent)}>
              <img
                src={feature.img}
                alt={feature.name}
                className="w-14 h-14 rounded-2xl object-cover shadow-md bg-white"
              />
            </div>
            <div>
              <p className={cn(
                "text-sm font-semibold tracking-tight",
                "text-zinc-800 dark:text-zinc-100",
                activeFeature === index && "text-emerald-600 dark:text-emerald-300"
              )}>
                {feature.name}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Tap to open
              </p>
            </div>
          </div>

          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed mt-4">
            {feature.description}
          </p>

          <div className={cn("h-1 w-full rounded-full bg-gradient-to-r opacity-70", feature.accent)}></div>
        </div>
      ))}
    </div>
  )
}

export default FeatureCards
