import React from 'react'

const AnimatedBackground = ({ imageLoaded, setImageLoaded }) => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <img
          src="/line.webp"
          alt="Background Art"
          className="w-full h-full object-contain mix-blend-multiply"
          style={{
            opacity: '0.12',
            filter: 'hue-rotate(10deg) saturate(0.6) brightness(1.05)',
            maskImage: 'radial-gradient(circle at center, black 0%, transparent 90%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black 0%, transparent 90%)'
          }}
          onLoad={() => setImageLoaded(true)}
        />
      </div>

      <div className="absolute top-24 left-10 w-64 h-64 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-40 right-16 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-amber-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="absolute top-1/4 left-1/4 w-10 h-10 rounded-full border border-emerald-200/60 animate-float" style={{ animationDelay: '0s' }}></div>
      <div className="absolute top-1/3 right-1/4 w-8 h-8 rounded-full border border-orange-200/60 animate-float" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-1/4 left-1/3 w-6 h-6 rounded-full border border-amber-200/60 animate-float" style={{ animationDelay: '4s' }}></div>

      <div className="absolute left-12 top-1/3 z-0 opacity-25 animate-fade-in">
        <svg width="180" height="180" viewBox="0 0 180 180" className="animate-spin-slow" style={{ animationDelay: '1s', animationDuration: '40s' }}>
          <path
            d="M90,90 Q90,70 110,70 Q130,70 130,90 Q130,120 100,120 Q60,120 60,80 Q60,30 110,30 Q170,30 170,90 Q170,160 100,160"
            stroke="url(#spiralGradient)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity="0.7"
          />
          <defs>
            <linearGradient id="spiralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4FD1C5" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#F6AD55" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#FBD38D" stopOpacity="0.4" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="absolute right-16 bottom-24 z-0 opacity-30 animate-fade-in">
        <svg width="140" height="140" viewBox="0 0 140 140" className="animate-pulse-slow" style={{ animationDelay: '2s' }}>
          <path
            d="M70,110 C70,110 35,85 35,60 C35,45 45,35 55,35 C62,35 68,40 70,45 C72,40 78,35 85,35 C95,35 105,45 105,60 C105,85 70,110 70,110 Z"
            stroke="url(#heartGradient)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient id="heartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F47C6B" stopOpacity="0.7" />
              <stop offset="50%" stopColor="#F6AD55" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#FBD38D" stopOpacity="0.5" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="absolute left-1/4 bottom-32 z-0 opacity-20 animate-fade-in">
        <svg width="150" height="150" viewBox="0 0 150 150" className="animate-float" style={{ animationDelay: '3s' }}>
          <path
            d="M75,20 Q80,40 95,50 Q110,60 110,80 Q110,100 90,110 Q70,120 60,110 Q50,100 55,85 Q60,70 75,70 Q90,70 95,85 Q100,100 90,110"
            stroke="#4FD1C5"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity="0.6"
          />
          <path
            d="M75,20 Q70,40 55,50 Q40,60 40,80"
            stroke="#F6AD55"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity="0.5"
          />
        </svg>
      </div>

      <div className="absolute right-1/4 top-32 z-0 opacity-25 animate-fade-in">
        <svg width="200" height="100" viewBox="0 0 200 100" className="animate-float" style={{ animationDelay: '4s', animationDuration: '6s' }}>
          <path
            d="M50,50 Q30,30 30,50 Q30,70 50,50 Q70,30 90,30 Q110,30 130,50 Q150,70 170,50 Q170,30 150,50"
            stroke="url(#infinityGradient)"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="infinityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4FD1C5" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#63B3ED" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#F6AD55" stopOpacity="0.6" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="absolute top-28 right-24 z-20 animate-fade-in">
        <div className="relative w-72 h-72">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-200 via-orange-100 to-amber-100 rounded-full blur-2xl opacity-40 animate-pulse-slow"></div>
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <img
              src="/women1.png"
              alt="Women"
              className="w-full h-full object-contain rounded-full"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnimatedBackground
