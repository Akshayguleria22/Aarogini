import React from 'react'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    about: [
      { label: 'About Us', href: '#about' },
      { label: 'Our Mission', href: '#mission' },
      { label: 'Team', href: '#team' },
      { label: 'Careers', href: '#careers' },
    ],
    resources: [
      { label: 'Health Articles', href: '#articles' },
      { label: 'Blog', href: '#blog' },
      { label: 'FAQs', href: '#faq' },
      { label: 'Support Center', href: '#support' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '#privacy' },
      { label: 'Terms of Service', href: '#terms' },
      { label: 'Cookie Policy', href: '#cookies' },
      { label: 'Disclaimer', href: '#disclaimer' },
    ],
    connect: [
      { label: 'Contact Us', href: '#contact' },
      { label: 'Feedback', href: '#feedback' },
      { label: 'Community', href: '#community' },
      { label: 'Newsletter', href: '#newsletter' },
    ],
  }

  const socialLinks = [
    { icon: '📘', name: 'Facebook', href: '#facebook' },
    { icon: '📸', name: 'Instagram', href: '#instagram' },
    { icon: '🐦', name: 'Twitter', href: '#twitter' },
    { icon: '💼', name: 'LinkedIn', href: '#linkedin' },
  ]

  return (
    <footer className="relative z-10 mt-auto bg-gradient-to-br from-purple-900/95 to-pink-900/95 backdrop-blur-xl text-white">
      {/* Main Footer Content */}
      <div className="px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src="/logooo.png" 
                  alt="Aarogini Logo" 
                  className="size-16"
                />
                <h3 className="text-2xl font-bold">Aarogini</h3>
              </div>
              <p className="text-purple-200 text-sm leading-relaxed mb-4">
                Your trusted companion for women's health and wellness. Empowering you with knowledge and tools for a healthier life.
              </p>
              {/* Social Links */}
              <div className="flex gap-3">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:scale-110"
                    aria-label={social.name}
                  >
                    <span className="text-xl">{social.icon}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Links Sections */}
            <div>
              <h4 className="text-lg font-semibold mb-4">About</h4>
              <ul className="space-y-2">
                {footerLinks.about.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-purple-200 hover:text-white transition-colors duration-200 text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                {footerLinks.resources.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-purple-200 hover:text-white transition-colors duration-200 text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                {footerLinks.legal.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-purple-200 hover:text-white transition-colors duration-200 text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Connect</h4>
              <ul className="space-y-2">
                {footerLinks.connect.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-purple-200 hover:text-white transition-colors duration-200 text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Newsletter Section */}
          <div className="border-t border-white/20 pt-8 mb-8">
            <div className="max-w-md">
              <h4 className="text-lg font-semibold mb-3">Subscribe to Our Newsletter</h4>
              <p className="text-purple-200 text-sm mb-4">
                Get the latest health tips and wellness advice delivered to your inbox.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                <button className="px-6 py-2 bg-white text-purple-900 rounded-lg font-semibold hover:bg-purple-100 transition-colors duration-200">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/20 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-purple-200 text-sm">
                © {currentYear} Aarogini. All rights reserved.
              </p>
              <div className="flex items-center gap-6">
                <a href="#privacy" className="text-purple-200 hover:text-white text-sm transition-colors">
                  Privacy
                </a>
                <a href="#terms" className="text-purple-200 hover:text-white text-sm transition-colors">
                  Terms
                </a>
                <a href="#cookies" className="text-purple-200 hover:text-white text-sm transition-colors">
                  Cookies
                </a>
              </div>
              <p className="text-purple-200 text-sm flex items-center gap-2">
                Made with <span className="text-pink-400">💜</span> for Women's Wellness
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
