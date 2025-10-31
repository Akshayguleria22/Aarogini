import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import MenuIcon from '../icons/MenuIcon'
import UserIcon from '../icons/UserIcon'
import MenuPanel from './MenuPanel'
import ProfilePanel from './ProfilePanel'

const Header = () => {
  const location = useLocation()
  const { user, isAuthenticated } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  // Don't show header on login/signup pages
  if (location.pathname === '/login' || location.pathname === '/signup') {
    return null
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-25 py-1 backdrop-blur-md bg-white/30 border-b border-white/20 shadow-sm transition-all duration-300">
        {/* Logo with creative animated background */}
        <Link to="/" className="relative group cursor-pointer">
          <div className="absolute -inset-3 bg-linear-to-r from-purple-300 to-pink-200 rounded-full blur-lg opacity-30 group-hover:opacity-50 animate-spin-slow transition-opacity duration-500"></div>
          <img 
            src="/logooo.png" 
            alt="Aarogini Logo" 
            className="size-23 w-27 relative z-10"
          />
        </Link>

        {/* Right icons */}
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              {/* User Info */}
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full shadow-md">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">
                  {user?.name || 'User'}
                </span>
              </div>

              <div className="relative group cursor-pointer" onClick={() => setIsProfileOpen(true)}>
                <div className="absolute -inset-2 bg-purple-300 rounded-full blur opacity-0 group-hover:opacity-40 transition-opacity duration-300"></div>
                <div className="relative bg-white/70 backdrop-blur-sm p-2 rounded-full shadow-md hover:shadow-lg transition-all duration-300">
                  <UserIcon />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Login Button */}
              <Link to="/login">
                <button className="px-6 py-2 text-purple-600 font-semibold hover:text-purple-700 transition-colors duration-200">
                  Login
                </button>
              </Link>

              {/* Sign Up Button */}
              <Link to="/signup">
                <button className="px-6 py-2 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                  Sign Up
                </button>
              </Link>
            </>
          )}

          <div className="relative group cursor-pointer" onClick={() => setIsMenuOpen(true)}>
            <div className="absolute -inset-2 bg-purple-300 rounded-full blur opacity-0 group-hover:opacity-40 transition-opacity duration-300"></div>
            <div className="relative bg-white/70 backdrop-blur-sm p-2 rounded-full shadow-md hover:shadow-lg transition-all duration-300">
              <MenuIcon />
            </div>
          </div>
        </div>
      </header>

      {/* Sliding Panels */}
      <MenuPanel isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <ProfilePanel isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  )
}

export default Header
