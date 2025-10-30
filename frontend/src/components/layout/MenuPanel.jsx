import React from 'react'

const MenuPanel = ({ isOpen, onClose }) => {
  const menuItems = [
    { icon: '🏠', label: 'Home', link: '#home' },
    { icon: '📊', label: 'Health Dashboard', link: '#dashboard' },
    { icon: '📝', label: 'Health Journal', link: '#journal' },
    { icon: '💊', label: 'Medications', link: '#medications' },
    { icon: '📅', label: 'Appointments', link: '#appointments' },
    { icon: '🔔', label: 'Reminders', link: '#reminders' },
    { icon: '📚', label: 'Articles & Resources', link: '#articles' },
    { icon: '👥', label: 'Community', link: '#community' },
    { icon: '💬', label: 'Ask an Expert', link: '#expert' },
    { icon: '⚙️', label: 'Settings', link: '#settings' },
    { icon: '❓', label: 'Help & Support', link: '#help' },
    { icon: '📱', label: 'Contact Us', link: '#contact' },
  ]

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-80 bg-gradient-to-br from-white/95 to-purple-50/95 backdrop-blur-xl shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-purple-200/50">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            Menu
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-purple-100/50 rounded-full transition-colors duration-200"
          >
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Menu Items */}
        <div className="overflow-y-auto h-[calc(100%-5rem)] p-4">
          <div className="space-y-2">
            {menuItems.map((item, index) => (
              <a
                key={index}
                href={item.link}
                className="flex items-center space-x-4 p-4 rounded-2xl hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 transition-all duration-300 group"
                onClick={onClose}
              >
                <span className="text-3xl transform group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </span>
                <span className="text-gray-700 font-medium group-hover:text-purple-700 transition-colors duration-300">
                  {item.label}
                </span>
              </a>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-8 p-4 bg-gradient-to-r from-purple-100/50 to-pink-100/50 rounded-2xl">
            <p className="text-sm text-gray-600 text-center">
              💜 Aarogini - Your Health Companion
            </p>
            <p className="text-xs text-gray-500 text-center mt-2">
              Version 1.0.0
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default MenuPanel
