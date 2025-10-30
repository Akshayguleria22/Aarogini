# 🌸 Aarogini - Women's Health & Wellness Platform

<div align="center">
  <img src="frontend/public/logo without bg.png" alt="Aarogini Logo" width="200"/>
  
  ### Your Complete Health Companion for Women's Wellness
  
  [![React](https://img.shields.io/badge/React-19.1.1-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.16-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  [![Vite](https://img.shields.io/badge/Vite-7.1.7-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
  [![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
</div>

---

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Usage](#usage)
- [Components](#components)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## 🌟 About

**Aarogini** is a comprehensive women's health and wellness platform designed to empower women with knowledge, tools, and resources for their health journey. From period tracking to pregnancy care, mental wellness to nutrition guidance, Aarogini is your trusted companion for holistic health management.

### 🎯 Mission
To provide accessible, reliable, and personalized health information and tools that support women at every stage of their health journey.

---

## ✨ Features

### 🏠 Core Features
- **Health Dashboard** - Personalized health metrics and insights
- **Period & Ovulation Tracker** - Smart menstrual cycle tracking
- **Pregnancy & Maternal Care** - Comprehensive pregnancy guidance
- **Mental Wellness Support** - Tools for managing stress and anxiety
- **Nutrition Guidance** - Personalized diet plans and recipes
- **Medicine Reminders** - Never miss your medications
- **Expert Consultation** - Connect with healthcare professionals
- **Community Support** - Share experiences and get support

### 🎨 UI/UX Features
- **Glassmorphism Design** - Modern, elegant interface
- **Smooth Animations** - Hardware-accelerated for 60fps performance
- **Responsive Layout** - Works seamlessly on all devices
- **Fixed Transparent Header** - Always accessible navigation
- **Infinite Article Slider** - Continuous content browsing
- **Interactive Health Journey** - 21 comprehensive health topics
- **Sliding Menu & Profile Panels** - Intuitive navigation

### 📊 Health Tracking
Track and manage 21+ health topics including:
- 🩸 Periods & Ovulation
- 🔬 PCOS/PCOD
- 💢 Endometriosis
- 🤰 Pregnancy & Maternal Health
- 👶 Postpartum Health
- 🌡️ Menopause
- 💭 Mental Health
- 💉 Anemia & Nutrition
- ❤️ Cardiovascular Health
- And many more...

---

## 🛠️ Tech Stack

### Frontend
- **React 19.1.1** - Modern React with functional components and hooks
- **Vite 7.1.7** - Lightning-fast build tool and dev server
- **Tailwind CSS 4.1.16** - Utility-first CSS framework
- **ESLint** - Code quality and consistency

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework

### Development Tools
- **Git** - Version control
- **npm/yarn** - Package management
- **VS Code** - Recommended IDE

---

## 📁 Project Structure

```
Aarogini/
├── frontend/
│   ├── public/
│   │   ├── logo without bg.png
│   │   └── women.jpg
│   ├── src/
│   │   ├── components/
│   │   │   ├── background/
│   │   │   │   └── AnimatedBackground.jsx
│   │   │   ├── icons/
│   │   │   │   ├── FeatureIcons.jsx
│   │   │   │   ├── HealthIcons.jsx
│   │   │   │   ├── MenuIcon.jsx
│   │   │   │   └── UserIcon.jsx
│   │   │   ├── layout/
│   │   │   │   ├── Header.jsx
│   │   │   │   ├── MenuPanel.jsx
│   │   │   │   └── ProfilePanel.jsx
│   │   │   └── sections/
│   │   │       ├── ArticlesSlider.jsx
│   │   │       ├── FeatureCards.jsx
│   │   │       ├── HealthJourney.jsx
│   │   │       └── HeroSection.jsx
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── eslint.config.js
├── backend/
│   ├── index.js
│   └── package.json
├── README.md
└── .gitignore
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** (v9 or higher) or **yarn**
- **Git**

### System Requirements
- OS: Windows 10+, macOS 10.15+, or Linux
- RAM: 4GB minimum (8GB recommended)
- Disk Space: 500MB free space

---

## 💻 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Akshayguleria22/Aarogini.git
cd Aarogini
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 3. Install Backend Dependencies

```bash
cd ../backend
npm install
```

---

## 🎮 Usage

### Development Mode

#### Start Frontend (Vite Dev Server)
```bash
cd frontend
npm run dev
```
The frontend will be available at: `http://localhost:5173`

#### Start Backend
```bash
cd backend
npm start
```
The backend will be available at: `http://localhost:3000`

### Production Build

#### Build Frontend
```bash
cd frontend
npm run build
```

#### Preview Production Build
```bash
npm run preview
```

### Linting
```bash
cd frontend
npm run lint
```

---

## 🧩 Components

### Layout Components
- **Header** - Fixed transparent navigation with glassmorphism
- **MenuPanel** - Sliding side panel with 12 navigation items
- **ProfilePanel** - User profile with health stats and quick actions

### Section Components
- **HeroSection** - Main landing section with tagline
- **ArticlesSlider** - Infinite scrolling article cards with images
- **FeatureCards** - 4 main feature cards with hover effects
- **HealthJourney** - Scrollable health topics with progress tracking

### Background Components
- **AnimatedBackground** - Decorative elements with smooth animations

### Icon Components
- **FeatureIcons** - SVG icons for main features
- **HealthIcons** - Emoji-based health topic icons
- **MenuIcon & UserIcon** - Header navigation icons

---

## 🎨 Design System

### Color Palette
- **Primary Purple**: `#9333ea` → `#c026d3`
- **Primary Pink**: `#ec4899` → `#f43f5e`
- **Background Gradient**: `#F8F7FC` → `#EDE7F6` → `#E8DFF5`
- **Text**: `#3B3A60` (dark purple-gray)

### Animations
- **Article Slider**: 25s infinite loop
- **Fade-in**: 0.6s ease
- **Hover Effects**: 200-300ms transitions
- **GPU Accelerated**: All transforms use `translate3d`

### Glassmorphism Effects
- **Backdrop Blur**: `backdrop-blur-md` (12px)
- **Background**: `bg-white/30` to `bg-white/95`
- **Borders**: `border-white/20`

---

## 📱 Responsive Design

- **Desktop**: Full-featured experience with all animations
- **Tablet**: Optimized layout with touch-friendly controls
- **Mobile**: Stack layout with swipe gestures

---

## 🔧 Configuration

### Vite Configuration
```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  }
})
```

### Tailwind Configuration
```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Custom animations and utilities
    }
  }
}
```

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open a Pull Request**

### Code Style Guidelines
- Use functional components with hooks
- Follow ESLint rules
- Write descriptive commit messages
- Add comments for complex logic
- Keep components small and focused

---

## 🐛 Known Issues

- None at the moment. Please report any bugs in the Issues section.

---

## 🔮 Roadmap

- [ ] User authentication and profiles
- [ ] Real-time health data sync
- [ ] Integration with wearable devices
- [ ] AI-powered health insights
- [ ] Multilingual support
- [ ] Native mobile apps (iOS/Android)
- [ ] Telemedicine video consultations
- [ ] Health data export/import

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

- **Developer**: Akshay Guleria
- **Repository**: [github.com/Akshayguleria22/Aarogini](https://github.com/Akshayguleria22/Aarogini)

---

## 📞 Contact

For questions, suggestions, or collaboration opportunities:

- **GitHub**: [@Akshayguleria22](https://github.com/Akshayguleria22)
- **Project Link**: [https://github.com/Akshayguleria22/Aarogini](https://github.com/Akshayguleria22/Aarogini)

---

## 🙏 Acknowledgments

- **React Team** - For the amazing framework
- **Tailwind CSS** - For the utility-first CSS framework
- **Unsplash** - For beautiful placeholder images
- **Icons** - Emoji icons for health topics
- **Community** - For feedback and support

---

<div align="center">
  <p>Made with 💜 for women's health and wellness</p>
  <p>© 2024-2025 Aarogini. All rights reserved.</p>
</div>
