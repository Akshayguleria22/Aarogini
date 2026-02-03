import React from 'react'
import { Link } from 'react-router-dom'
import ModernHeader from '../components/layout/ModernHeader'
import Footer from '../components/layout/Footer'
import { useAuth } from '../context/AuthContext'

const Landing = () => {
  const { isAuthenticated } = useAuth()
  const featureList = [
    {
      title: 'Cycle & Symptom Tracking',
      desc: 'Track periods, ovulation, symptoms, and patterns with gentle reminders.'
    },
    {
      title: 'AI Health Companion',
      desc: 'Ask questions, get insights, and understand health reports with Chat Veda.'
    },
    {
      title: 'Smart Wellness Library',
      desc: 'Curated articles for every stage: puberty, pregnancy, postpartum, and menopause.'
    },
    {
      title: 'Medicine Search',
      desc: 'Quickly search medicines, safety info, and alternative recommendations.'
    },
  ]

  const steps = [
    { title: 'Create your profile', desc: 'Tell us a few basics to personalize your journey.' },
    { title: 'Track daily health', desc: 'Log symptoms and cycles in just a few taps.' },
    { title: 'Receive insights', desc: 'Get actionable tips and reminders tailored to you.' },
  ]

  return (
    <div className="min-h-screen flex flex-col overflow-y-auto overflow-x-hidden bg-[#f7f3ee] dark:bg-[#0f1515] relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-28 right-10 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 left-10 w-96 h-96 bg-orange-200/30 rounded-full blur-3xl"></div>
      </div>
      <ModernHeader />

      <main className="relative z-10 flex-1 px-8 pb-10 flex flex-col pt-24">
        {/* Hero */}
        <section className="flex flex-col lg:flex-row items-center gap-10">
          <div className="flex-1">
            <p className="text-sm uppercase tracking-widest text-emerald-700 font-semibold">Aarogini</p>
            <h1 className="text-5xl font-bold leading-tight text-zinc-900 dark:text-zinc-100 mt-3">
              A calm, caring space for your
              <span className="block bg-linear-to-r from-emerald-600 via-teal-500 to-orange-400 bg-clip-text text-transparent">
                everyday health journey
              </span>
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-300 mt-4 max-w-2xl">
              Aarogini helps women track cycles, understand reports, and stay supported with
              personalized insights, expert-backed content, and a friendly AI companion.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <Link to={isAuthenticated ? "/" : "/signup"} className="px-6 py-3 rounded-full bg-linear-to-r from-emerald-600 to-orange-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all">
                Get Started
              </Link>
              {!isAuthenticated && (
                <Link to="/login" className="px-6 py-3 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold hover:bg-white/70 dark:hover:bg-zinc-900">
                  Log in
                </Link>
              )}
              {isAuthenticated && (
                <Link to="/" className="px-6 py-3 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold hover:bg-white/70 dark:hover:bg-zinc-900">
                  Home
                </Link>
              )}
            </div>
            <div className="mt-6 flex items-center gap-6 text-sm text-zinc-500">
              <span>Private & secure</span>
              <span>Clinically-informed content</span>
              <span>Made for every life stage</span>
            </div>
          </div>

          <div className="flex-1">
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Today in your journey</h3>
              <p className="text-sm text-zinc-500 mt-1">A preview of your personalized dashboard</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {['Cycle status', 'Energy', 'Mood', 'Hydration'].map((label) => (
                  <div key={label} className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900">
                    <p className="text-xs text-zinc-500">{label}</p>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-1">Looks good</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 rounded-2xl bg-linear-to-r from-emerald-600 to-orange-500 text-white">
                <p className="text-sm">Your next cycle prediction is in 5 days.</p>
                <p className="text-xs opacity-80 mt-1">Enable reminders after you sign up.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Why women choose Aarogini</h2>
          <p className="text-zinc-500 mt-2">A gentle, data-informed approach to women's health.</p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {featureList.map((feature) => (
              <div key={feature.title} className="p-5 rounded-2xl bg-white/80 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{feature.title}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-2">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {steps.map((step, index) => (
            <div key={step.title} className="p-6 rounded-2xl bg-white/80 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800">
              <span className="text-xs font-semibold text-emerald-700">Step {index + 1}</span>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-2">{step.title}</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-2">{step.desc}</p>
            </div>
          ))}
        </section>

        {/* CTA */}
        <section className="mt-12 rounded-3xl bg-linear-to-r from-emerald-600 to-orange-500 text-white p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold">Start your personalized health journey</h3>
            <p className="text-sm text-white/90 mt-2">Create a free account and unlock your dashboard, trackers, and insights.</p>
          </div>
          <Link to={isAuthenticated ? "/" : "/signup"} className="px-6 py-3 rounded-full bg-white text-emerald-700 font-semibold shadow-lg">
            {isAuthenticated ? 'Go to Home' : 'Create account'}
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default Landing

