import React from 'react'

const FeatureCards = ({ activeFeature, setActiveFeature }) => {
  const mainFeatures = [
    { img: '/blood.jpg', name: 'PERIOD TRACKER', color: 'from-pink-400 to-purple-400' },
    { img: '/medicine.jpg', name: 'MEDICINE SEARCH', color: 'from-purple-400 to-purple-500' },
    { img: '/report.jpg', name: 'REPORT RECORD', color: 'from-purple-500 to-indigo-500' },
    { img: '/chat.jpg', name: 'CHAT VEDA (AI CHATBOT)', color: 'from-indigo-400 to-purple-400' },
  ]

  return (
    <div className="grid grid-cols-4 gap-3 animate-fade-in animation-delay-200">
      {mainFeatures.map((feature, index) => (
        <div
          key={index}
          onClick={() => setActiveFeature(index)}
          className={`group relative p-6 rounded-2xl cursor-pointer animate-fade-in-up transition-all duration-500 ${
            activeFeature !== index ? 'hover:shadow-2xl' : ''
          }`}
          style={{
            animationDelay: `${index * 100 + 400}ms`,
            minHeight: '240px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: activeFeature === index 
              ? 'linear-gradient(135deg, #A38AEB 0%, #9370DB 100%)' 
              : '#FFFFFF',
            boxShadow: activeFeature === index
              ? '0 15px 30px rgba(163, 138, 235, 0.4)'
              : '0 8px 20px rgba(0, 0, 0, 0.05)'
          }}
          onMouseEnter={(e) => {
            if (activeFeature !== index) {
              e.currentTarget.style.background = 'linear-gradient(135deg, #A38AEB 0%, #9370DB 100%)'
              const icon = e.currentTarget.querySelector('.feature-icon')
              const text = e.currentTarget.querySelector('.feature-text')
              if (icon) icon.style.color = 'white'
              if (text) text.style.color = 'white'
            }
          }}
          onMouseLeave={(e) => {
            if (activeFeature !== index) {
              e.currentTarget.style.background = '#FFFFFF'
              const icon = e.currentTarget.querySelector('.feature-icon')
              const text = e.currentTarget.querySelector('.feature-text')
              if (icon) icon.style.color = '#9333ea'
              if (text) text.style.color = '#374151'
            }
          }}
        >
          <div className={`feature-icon mb-4 transition-all duration-300 group-hover:scale-110 ${activeFeature === index ? '' : ''
          }`}>
            <img
              src={feature.img}
              alt={feature.name}
              className="w-16 h-16 rounded-full object-cover shadow-md"
            />
          </div>
          <p className={`feature-text text-xs font-semibold tracking-wider uppercase leading-tight text-center ${
            activeFeature === index ? 'text-white' : 'text-gray-700'
          }`}>
            {feature.name}
          </p>
        </div>
      ))}
    </div>
  )
}

export default FeatureCards
