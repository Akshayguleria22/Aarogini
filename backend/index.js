require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDatabase = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDatabase();

// Middleware
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
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
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/periods', require('./routes/periodRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/medicines', require('./routes/medicineRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/health', require('./routes/healthRoutes'));
app.use('/api/health-tracking', require('./routes/healthTrackingRoutes'));
app.use('/api/articles', require('./routes/articleRoutes'));
app.use('/api/who', require('./routes/whoRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/medicine-search', require('./routes/medicineSearchRoutes'));

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
