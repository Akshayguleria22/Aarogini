import React from 'react'
import { Facebook, Instagram, Linkedin, Twitter, Mail } from 'lucide-react'

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
    { icon: Facebook, name: 'Facebook', href: '#facebook' },
    { icon: Instagram, name: 'Instagram', href: '#instagram' },
    { icon: Twitter, name: 'Twitter', href: '#twitter' },
    { icon: Linkedin, name: 'LinkedIn', href: '#linkedin' },
  ]

  return (
    <footer className="relative z-10 mt-auto bg-gradient-to-br from-[#142022] via-[#1f2a2e] to-[#0f1516] text-[#fdf6ef]">
      <div className="px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="/logooo.png"
                  alt="Aarogini Logo"
                  className="size-12"
                />
                <h3 className="text-2xl font-bold">Aarogini</h3>
              </div>
              <p className="text-[#d7d1c8] text-sm leading-relaxed mb-4">
                Aarogini brings period tracking, report analysis, and wellness guidance into one secure place.
              </p>
              <div className="flex gap-3">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:scale-110"
                    aria-label={social.name}
                  >
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">About</h4>
              <ul className="space-y-2">
                {footerLinks.about.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-[#f6ad55] hover:text-white transition-colors duration-200 text-sm"
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
                      className="text-[#f6ad55] hover:text-white transition-colors duration-200 text-sm"
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
                      className="text-[#f6ad55] hover:text-white transition-colors duration-200 text-sm"
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
                      className="text-[#f6ad55] hover:text-white transition-colors duration-200 text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 mb-8">
            <div className="max-w-md">
              <h4 className="text-lg font-semibold mb-3">Stay in the loop</h4>
              <p className="text-[#d7d1c8] text-sm mb-4">
                Subscribe for product updates, women's health resources, and new feature announcements.
              </p>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-white/10">
                  <Mail className="w-4 h-4 text-[#d7d1c8]" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full bg-transparent text-sm text-white placeholder-[#c9c3ba] focus:outline-none"
                  />
                </div>
                <button className="px-6 py-2 bg-[#f47c6b] text-white rounded-lg font-semibold hover:bg-[#f68d7f] transition-colors duration-200">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-[#c9c3ba] text-sm">
                Copyright {currentYear} Aarogini. All rights reserved.
              </p>
              <div className="flex items-center gap-6">
                <a href="#privacy" className="text-[#c9c3ba] hover:text-white text-sm transition-colors">
                  Privacy
                </a>
                <a href="#terms" className="text-[#c9c3ba] hover:text-white text-sm transition-colors">
                  Terms
                </a>
                <a href="#cookies" className="text-[#c9c3ba] hover:text-white text-sm transition-colors">
                  Cookies
                </a>
              </div>
              <p className="text-[#c9c3ba] text-sm">
                Built for women's health and long-term wellness
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
