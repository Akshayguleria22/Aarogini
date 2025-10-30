import React from 'react'

const ArticlesSlider = () => {
  const articles = [
    { 
      title: "Prenatal Yoga Benefits", 
      description: "Discover how yoga can help during pregnancy",
      time: "2h ago", 
      tag: "Wellness",
      image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop"
    },
    { 
      title: "Iron-Rich Foods Guide", 
      description: "Essential nutrition for women's health",
      time: "5h ago", 
      tag: "Nutrition",
      image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=300&fit=crop"
    },
    { 
      title: "Managing Morning Sickness", 
      description: "Tips and remedies for early pregnancy",
      time: "8h ago", 
      tag: "Health",
      image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&h=300&fit=crop"
    },
    { 
      title: "Sleep Tips for Expecting Moms", 
      description: "Better rest during pregnancy journey",
      time: "12h ago", 
      tag: "Wellness",
      image: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400&h=300&fit=crop"
    },
    { 
      title: "Understanding Fetal Development", 
      description: "Week by week pregnancy guide",
      time: "15h ago", 
      tag: "Info",
      image: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&h=300&fit=crop"
    },
    { 
      title: "Postpartum Recovery Guide", 
      description: "Healing and wellness after childbirth",
      time: "18h ago", 
      tag: "Health",
      image: "https://images.unsplash.com/photo-1566004100631-35d015d6a491?w=400&h=300&fit=crop"
    },
    { 
      title: "Healthy Pregnancy Diet", 
      description: "Complete nutritional guide for moms",
      time: "1d ago", 
      tag: "Nutrition",
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop"
    },
    { 
      title: "Mental Health During Pregnancy", 
      description: "Coping strategies and support systems",
      time: "1d ago", 
      tag: "Wellness",
      image: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=400&h=300&fit=crop"
    },
    { 
      title: "Exercise Safety Guidelines", 
      description: "Safe workouts for expectant mothers",
      time: "2d ago", 
      tag: "Fitness",
      image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop"
    },
    { 
      title: "Baby Nursery Preparation", 
      description: "Essential items and setup tips",
      time: "2d ago", 
      tag: "Info",
      image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=300&fit=crop"
    },
  ]

  // Duplicate articles for seamless loop
  const duplicatedArticles = [...articles, ...articles]

  return (
    <div className="relative overflow-hidden animate-fade-in animation-delay-100 py-3">
      <div className="flex space-x-4 animate-slide-infinite hw-accelerate">
        {duplicatedArticles.map((article, index) => (
          <div
            key={index}
            className="flex-shrink-0 bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-200 cursor-pointer group"
            style={{ minWidth: '320px' }}
          >
            {/* Image */}
            <div className="relative h-40 overflow-hidden">
              <img 
                src={article.image} 
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute top-3 left-3">
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm text-purple-600 shadow-sm">
                  {article.tag}
                </span>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-gray-800 group-hover:text-purple-600 transition-colors duration-200">
                  {article.title}
                </h3>
                <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{article.time}</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {article.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ArticlesSlider
