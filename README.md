# Aarogini

<div align="center">
  <img src="frontend/public/logo without bg.png" alt="Aarogini" width="180" />
  <p><strong>Women’s Health & Wellness Platform</strong></p>
  <p>Personalized tracking, curated guidance, and AI-assisted insights for holistic care.</p>
  <p>
    <a href="https://reactjs.org/">React</a> ·
    <a href="https://vitejs.dev/">Vite</a> ·
    <a href="https://tailwindcss.com/">Tailwind CSS</a> ·
    <a href="https://nodejs.org/">Node.js</a>
  </p>
</div>

---

## Overview

Aarogini is a full‑stack health and wellness platform focused on women’s health. It combines a modern React frontend, a Node/Express API, and an optional ML service to deliver personalized tracking, educational content, and AI‑assisted recommendations.

---

## Key Features

- Health dashboard with personalized insights
- Period and ovulation tracking
- Health condition guidance (e.g., PCOS, endometriosis)
- Medical report management and analysis
- AI‑assisted recommendations and summaries
- Nutrition and medicine guidance
- Responsive, modern UI

---

## Architecture

- **frontend/**: React + Vite + Tailwind UI
- **backend/**: Express API, MongoDB, JWT authentication
- **ml-service/**: Optional Python service for ML workflows

---

## Tech Stack

**Frontend**: React, Vite, Tailwind CSS, Axios

**Backend**: Node.js, Express, MongoDB, Mongoose, JWT

**ML (optional)**: Python, FastAPI (uvicorn)

---

## Project Structure

```
Aarogini/
  backend/
  frontend/
  ml-service/
  README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+ (or yarn/pnpm)
- Python 3.10+ (optional for ML service)

### Setup

1) Install dependencies

```
cd frontend
npm install

cd ../backend
npm install
```

2) Configure environment variables

Copy the sample file and fill in values:

```
backend/.env.example → backend/.env
```

### Environment Variables (backend/.env)

- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: JWT secret key
- `JWT_EXPIRE`: Token expiry (e.g., `30d`)
- `CLIENT_URL`: Frontend URL for CORS (e.g., `http://localhost:5173`)
- `GROQ_API_KEY`, `OPENFDA_API_KEY`, `GNEWS_API_KEY`: Optional external APIs
- `ML_BASE_URL`: Optional ML service base URL

### Run Locally

Frontend:

```
cd frontend
npm run dev
```

Backend:

```
cd backend
npm run dev
```

Optional ML service:

```
cd ml-service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## API

- Base URL: `http://localhost:5000/api`
- Auth routes: `/auth/register`, `/auth/login`, `/auth/me`

---

## Deployment Notes

- Ensure `CLIENT_URL` is set to your deployed frontend URL.
- If deploying frontend and backend on different domains, add the frontend domain to CORS allowlist in [backend/index.js](backend/index.js).

---

## Troubleshooting

- **401 Unauthorized**: Token missing/expired. Login again and ensure the token is saved.
- **503 Database unavailable**: MongoDB is not connected. Check `MONGODB_URI`.
- **CORS blocked**: Ensure the frontend domain is included in backend CORS allowlist.

---

## Contributing

Contributions are welcome. Please open an issue or submit a pull request.

---

## License

Specify your license here.
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

## Deployment (Render + Vercel)

### Backend (Render)
1. Create a new Web Service from the `backend` folder.
2. Build command: `npm install`
3. Start command: `node index.js`
4. Add environment variables (Render dashboard):
   - `GROQ_API_KEY`
   - `JWT_SECRET`
   - `JWT_EXPIRE` (example: `30d`)
   - `MONGODB_URI`
   - `CLIENT_URL` (your Vercel frontend URL)
   - `OPENFDA_API_KEY` (optional)
   - `GNEWS_API_KEY` (optional)
   - `ML_BASE_URL` (URL of the ML service)
   - `NODE_ENV=production`
5. If you plan to store uploads, add a Render persistent disk and point `uploads/` to it.

### ML Service (Render)
1. Create a new Web Service from the `ml-service` folder.
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Update backend `ML_BASE_URL` to the Render ML service URL.

### Frontend (Vercel)
1. Import the repository and select the `frontend` folder as the root.
2. Add `VITE_API_URL` as an environment variable set to:
   - `https://<your-backend>.onrender.com/api`
3. Build command: `npm run build`
4. Output directory: `dist`

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
