import React, { useState } from 'react'
import MenuIcon from '../icons/MenuIcon'
import UserIcon from '../icons/UserIcon'
import MenuPanel from './MenuPanel'
import ProfilePanel from './ProfilePanel'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-20 py-3 backdrop-blur-md bg-white/30 border-b border-white/20 shadow-sm transition-all duration-300">
        {/* Logo with creative animated background */}
        <div className="relative group cursor-pointer">
          <div className="absolute -inset-3 bg-gradient-to-r from-purple-300 to-pink-200 rounded-full blur-lg opacity-30 group-hover:opacity-50 animate-spin-slow transition-opacity duration-500"></div>
          <img 
            src="/logo without bg.png" 
            alt="Aarogini Logo" 
            className="size-22 relative z-10"
          />
        </div>

        {/* Right icons */}
        <div className="flex items-center space-x-4">
          <div className="relative group cursor-pointer" onClick={() => setIsProfileOpen(true)}>
            <div className="absolute -inset-2 bg-purple-300 rounded-full blur opacity-0 group-hover:opacity-40 transition-opacity duration-300"></div>
            <div className="relative bg-white/70 backdrop-blur-sm p-2 rounded-full shadow-md hover:shadow-lg transition-all duration-300">
              <UserIcon />
            </div>
          </div>
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
