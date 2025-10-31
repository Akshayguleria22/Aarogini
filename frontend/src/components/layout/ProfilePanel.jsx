import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const ProfilePanel = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()

  const handleLogout = () => {
    logout()
    onClose()
    navigate('/')
  }

  if (!isAuthenticated) {
    return (
      <>
        <div className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
        <div className={`fixed top-0 right-0 h-full w-96 bg-white/95 backdrop-blur-xl shadow-2xl z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex flex-col items-center justify-center h-full px-8">
            <div className="text-6xl mb-6">👤</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Login Required</h3>
            <p className="text-gray-600 text-center mb-8">Please login to view your profile</p>
            <div className="space-y-3 w-full">
              <button onClick={() => { onClose(); navigate('/login'); }} className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg">Login</button>
              <button onClick={() => { onClose(); navigate('/signup'); }} className="w-full py-3 px-6 border-2 border-purple-600 text-purple-600 rounded-xl font-semibold">Sign Up</button>
            </div>
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <div className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <div className={`fixed top-0 right-0 h-full w-96 bg-gradient-to-br from-white/95 to-purple-50/95 backdrop-blur-xl shadow-2xl z-50 overflow-y-auto transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="relative h-40 bg-gradient-to-r from-purple-500 to-pink-500">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full z-10">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="relative -mt-16 flex justify-center px-6">
          <div className="relative w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
            <span className="text-6xl">👤</span>
            <div className="absolute bottom-2 right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white"></div>
          </div>
        </div>
        <div className="text-center mt-4 px-6">
          <h2 className="text-2xl font-bold text-gray-800">{user?.name || 'User'}</h2>
          <p className="text-gray-500 text-sm mt-1">{user?.email}</p>
        </div>
        <div className="px-6 mt-6 pb-6">
          <button onClick={handleLogout} className="w-full p-3 rounded-xl bg-white/60 flex items-center justify-center space-x-2 hover:shadow-md">
            <span>🚪</span><span className="font-medium">Log Out</span>
          </button>
        </div>
      </div>
    </>
  )
}

export default ProfilePanel
