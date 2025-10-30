import React from 'react'

const ProfilePanel = ({ isOpen, onClose }) => {
  // Sample user data - replace with actual user data
  const userData = {
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    age: 28,
    bloodType: 'O+',
    height: '165 cm',
    weight: '58 kg',
    memberSince: 'January 2024'
  }

  const healthStats = [
    { label: 'Period Cycle', value: 'Day 12', icon: '🌸' },
    { label: 'Water Intake', value: '1.8L / 2.5L', icon: '💧' },
    { label: 'Steps Today', value: '6,543', icon: '👟' },
    { label: 'Sleep', value: '7.5 hrs', icon: '😴' },
  ]

  const quickActions = [
    { icon: '📝', label: 'Edit Profile', color: 'from-purple-500 to-pink-500' },
    { icon: '🔐', label: 'Privacy Settings', color: 'from-blue-500 to-purple-500' },
    { icon: '🔔', label: 'Notifications', color: 'from-pink-500 to-red-500' },
    { icon: '🚪', label: 'Log Out', color: 'from-gray-500 to-gray-600' },
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

      {/* Profile Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-96 bg-gradient-to-br from-white/95 to-purple-50/95 backdrop-blur-xl shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="relative h-40 bg-gradient-to-r from-purple-500 to-pink-500 overflow-hidden">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors duration-200 z-10"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Profile Picture */}
        <div className="relative -mt-16 flex justify-center px-6">
          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-lg opacity-60"></div>
            <div className="relative w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
              <span className="text-6xl">👤</span>
            </div>
            <div className="absolute bottom-2 right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white"></div>
          </div>
        </div>

        {/* User Info */}
        <div className="text-center mt-4 px-6">
          <h2 className="text-2xl font-bold text-gray-800">{userData.name}</h2>
          <p className="text-gray-500 text-sm mt-1">{userData.email}</p>
          <p className="text-xs text-gray-400 mt-2">Member since {userData.memberSince}</p>
        </div>

        {/* Health Stats */}
        <div className="px-6 mt-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Today's Health Stats</h3>
          <div className="grid grid-cols-2 gap-3">
            {healthStats.map((stat, index) => (
              <div 
                key={index}
                className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-purple-100/50 hover:shadow-md transition-shadow duration-200"
              >
                <span className="text-2xl">{stat.icon}</span>
                <p className="text-xs text-gray-600 mt-1">{stat.label}</p>
                <p className="text-sm font-semibold text-purple-700">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Personal Info */}
        <div className="px-6 mt-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Personal Information</h3>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-purple-100/50 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Age</span>
              <span className="font-medium text-gray-800">{userData.age} years</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Blood Type</span>
              <span className="font-medium text-gray-800">{userData.bloodType}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Height</span>
              <span className="font-medium text-gray-800">{userData.height}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Weight</span>
              <span className="font-medium text-gray-800">{userData.weight}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-6 mt-6 pb-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className="w-full flex items-center space-x-3 p-3 rounded-xl bg-white/60 backdrop-blur-sm border border-purple-100/50 hover:shadow-md transition-all duration-200 group"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform duration-200`}>
                  {action.icon}
                </div>
                <span className="text-gray-700 font-medium group-hover:text-purple-700 transition-colors duration-200">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default ProfilePanel
