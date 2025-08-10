const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const { connectToDatabase } = require('./database/mongodb');
const propertyRoutes = require('./routes/properties');
const authRoutes = require('./routes/auth');
const errorHandler = require('./middleware/errorHandler');
const uploadRoutes = require('./routes/uploads');
const viewsRoutes = require('./routes/views');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3101;

// Security & core middleware
app.use(helmet({
  // Allow serving static images to the frontend on a different port
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  // Do not require cross-origin embedder policy for simple image loads
  crossOriginEmbedderPolicy: false,
}));

// CORS: allow localhost dev and same-origin in prod
const isProd = process.env.NODE_ENV === 'production';
if (!isProd) {
  // In development, allow all localhost origins to avoid CORS friction
  app.use(cors({ origin: true, credentials: true, optionsSuccessStatus: 200 }));
} else {
  const defaultProdOrigins = ['http://localhost:3100'];
  const allowedOrigins = (process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : defaultProdOrigins).map((s) => s.trim());
  const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\\d+)?$/;
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (localhostRegex.test(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    optionsSuccessStatus: 200,
  }));
}

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

// Body parsing (raise limits moderately for forms without giant payloads)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Serve uploaded images statically with permissive resource policy
app.use('/uploads', (req, res, next) => {
  // Explicitly allow loading these resources from other origins (e.g., frontend on 3100)
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  // CORS is not strictly required for <img> tags, but add for completeness
  if (!isProd) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Initialize database
connectToDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/views', viewsRoutes);

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