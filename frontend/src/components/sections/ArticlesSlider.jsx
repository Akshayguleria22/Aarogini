import React, { useState, useEffect, useMemo } from 'react'
import Skeleton from '../ui/Skeleton'
import api from '../../utils/api'

const ArticlesSlider = ({ loading }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [imageLoaded, setImageLoaded] = useState(false)

  const fallbackArticles = [
    { 
      title: "Holistic Wellness Approach",
      description: "Comprehensive guide to mind, body, and spirit wellness for women",
      time: "1h ago",
      tag: "Holistic",
      image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop",
      url: "https://www.who.int/health-topics/womens-health"
    },
    { 
      title: "Prenatal Yoga Benefits", 
      description: "Discover how yoga can help during pregnancy",
      time: "2h ago", 
      tag: "Wellness",
      image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop",
      url: "https://www.cdc.gov/nutrition/index.html"
    },
    { 
      title: "Iron-Rich Foods Guide", 
      description: "Essential nutrition for women's health",
      time: "5h ago", 
      tag: "Nutrition",
      image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=600&fit=crop"
    },
    { 
      title: "Managing Morning Sickness", 
      description: "Tips and remedies for early pregnancy",
      time: "8h ago", 
      tag: "Health",
      image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&h=600&fit=crop"
    },
    { 
      title: "Sleep Tips for Expecting Moms", 
      description: "Better rest during pregnancy journey",
      time: "12h ago", 
      tag: "Wellness",
      image: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800&h=600&fit=crop"
    },
    { 
      title: "Understanding Fetal Development", 
      description: "Week by week pregnancy guide",
      time: "15h ago", 
      tag: "Info",
      image: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&h=600&fit=crop"
    },
    { 
      title: "Postpartum Recovery Guide", 
      description: "Healing and wellness after childbirth",
      time: "18h ago", 
      tag: "Health",
      image: "https://images.unsplash.com/photo-1566004100631-35d015d6a491?w=800&h=600&fit=crop"
    },
    { 
      title: "Healthy Pregnancy Diet", 
      description: "Complete nutritional guide for moms",
      time: "1d ago", 
      tag: "Nutrition",
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop"
    },
    { 
      title: "Mental Health During Pregnancy", 
      description: "Coping strategies and support systems",
      time: "1d ago", 
      tag: "Wellness",
      image: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&h=600&fit=crop"
    },
    { 
      title: "Exercise Safety Guidelines", 
      description: "Safe workouts for expectant mothers",
      time: "2d ago", 
      tag: "Fitness",
      image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=600&fit=crop"
    },
  ]

  const [newsArticles, setNewsArticles] = useState([])

  const articles = useMemo(() => {
    if (newsArticles.length > 0) return newsArticles
    return fallbackArticles
  }, [newsArticles])

  useEffect(() => {
    let isMounted = true
    const loadNews = async () => {
      try {
        const response = await api.get('/news', {
          params: { q: 'women health wellness', limit: 10 }
        })
        const items = response.data?.data || []
        if (isMounted && items.length) {
          const mapped = items.map((item) => ({
            title: item.title,
            description: item.description || 'Read the full article to learn more.',
            time: item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : 'Recent',
            tag: item.source?.name || 'News',
            image: item.image || 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop',
            url: item.url
          }))
          setNewsArticles(mapped)
        }
      } catch {
        // fallback silently
      }
    }
    loadNews()
    return () => { isMounted = false }
  }, [])

  // Auto-slide effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % articles.length)
    }, 4000) // Change slide every 4 seconds

    return () => clearInterval(interval)
  }, [articles.length])

  useEffect(() => {
    setImageLoaded(false)
  }, [currentIndex])

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + articles.length) % articles.length)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % articles.length)
  }

  if (loading) {
    return (
      <div className="relative w-full lg:w-[45%] bg-white/70 backdrop-blur-sm rounded-3xl p-5 shadow-lg border border-white/60">
        <Skeleton className="h-6 w-48 rounded-lg mb-4" />
        <Skeleton className="h-[350px] w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="relative w-full lg:w-[45%] bg-white/70 backdrop-blur-sm rounded-3xl p-5 shadow-lg animate-fade-in animation-delay-100 border border-white/60">
      <h2 className="text-lg font-bold mb-3 text-zinc-800">Latest Health Articles</h2>

      {/* Single Article Display with Full Image Background */}
      <div className="relative overflow-hidden rounded-2xl" style={{ height: '350px' }}>
        {/* Article Card */}
        <div className="relative w-full h-full">
          {!imageLoaded && <Skeleton className="absolute inset-0 rounded-2xl" />}
          <a href={articles[currentIndex].url} target="_blank" rel="noreferrer" className="block w-full h-full">
            <img
              src={articles[currentIndex].image}
              alt={articles[currentIndex].title}
              className={`w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
            />
          </a>

          {/* Dark Overlay for Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

          {/* Text Content Overlay */}
          <div className="absolute inset-0 flex flex-col justify-end p-6">
            <div className="mb-2">
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm text-emerald-700 shadow-sm">
                {articles[currentIndex].tag}
              </span>
            </div>
            
            <a href={articles[currentIndex].url} target="_blank" rel="noreferrer" className="block">
              <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">
                {articles[currentIndex].title}
              </h3>

              <p className="text-base text-white/90 leading-relaxed mb-2 drop-shadow-md">
                {articles[currentIndex].description}
              </p>

              <span className="text-xs text-white/70">{articles[currentIndex].time}</span>
            </a>
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white shadow-lg hover:shadow-xl rounded-full p-2 transition-all duration-300 group"
          aria-label="Previous article"
        >
          <svg
            className="w-5 h-5 text-emerald-700 group-hover:text-emerald-800 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={goToNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white shadow-lg hover:shadow-xl rounded-full p-2 transition-all duration-300 group"
          aria-label="Next article"
        >
          <svg
            className="w-5 h-5 text-emerald-700 group-hover:text-emerald-800 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {articles.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`transition-all duration-300 rounded-full ${index === currentIndex
                ? 'w-6 h-1.5 bg-white'
                : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/70'
                }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default ArticlesSlider
