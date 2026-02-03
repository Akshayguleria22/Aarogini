import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import connectDatabase from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import userRoutes from './routes/userRoutes.js';
import periodRoutes from './routes/periodRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import medicineRoutes from './routes/medicineRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import healthTrackingRoutes from './routes/healthTrackingRoutes.js';
import articleRoutes from './routes/articleRoutes.js';
import whoRoutes from './routes/whoRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import medicineSearchNew from './routes/medicineSearchNew.js';
import newsRoutes from './routes/newsRoutes.js';


const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDatabase();

// Middleware
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'https://aarogini.vercel.app',
        'https://aarogini.onrender.com',
        process.env.CLIENT_URL
    ].filter(Boolean),
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
});

// Routes
app.get('/', (req, res) => {
    res.json({
        message: '🌸 Aarogini Wellness API',
        version: '1.0.0',
        status: 'active',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            periods: '/api/periods',
            reports: '/api/reports',
            medicines: '/api/medicines',
            chat: '/api/chat',
            health: '/api/health',
            articles: '/api/articles',
            who: '/api/who',
            ai: '/api/ai'
        }
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/users', userRoutes);
app.use('/api/periods', periodRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/health-tracking', healthTrackingRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/who', whoRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/medicine-search', medicineSearchNew);
app.use('/api/news', newsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

app.listen(PORT, () => {
    console.log(`\n🚀 Server is running on http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📱 Client URL: ${process.env.CLIENT_URL}\n`);
});
