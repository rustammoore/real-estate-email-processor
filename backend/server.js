const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const { connectToDatabase } = require('./database/mongodb');
const propertyRoutes = require('./routes/properties');
const authRoutes = require('./routes/auth');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3101;

// Security & core middleware
app.use(helmet());

// CORS: allow localhost dev and same-origin in prod
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3100').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Basic rate limiting (disabled in development; always skip health checks)
const rateLimitMax = process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX, 10) : 300;
const enableRateLimit = (process.env.NODE_ENV === 'production') && rateLimitMax > 0;

if (enableRateLimit) {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS' || req.path === '/api/health',
  });
  app.use(limiter);
}

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database
connectToDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Real Estate Email Processor is running' });
});

// Centralized error handler (must be after routes)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
}); 