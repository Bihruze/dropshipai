import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';

// Import routes
import authRoutes from './routes/auth.js';
import settingsRoutes from './routes/settings.js';
import shopifyRoutes from './routes/shopify.js';
import etsyRoutes from './routes/etsy.js';
import cjRoutes from './routes/cj.js';
import agentRoutes from './routes/agents.js';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { generalLimiter, webhookLimiter } from './middleware/rateLimiter.js';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Trust proxy for rate limiting behind reverse proxy (Nginx, etc.)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS configuration - Allow multiple origins for production
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'https://dropshipai.vercel.app',
  /\.vercel\.app$/,  // Allow all Vercel preview deployments
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) return allowed.test(origin);
      return allowed === origin;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// General rate limiting for all API routes
app.use('/api/', generalLimiter);

// Webhook routes have separate, more permissive rate limiting
app.use('/api/shopify/webhook', webhookLimiter);
app.use('/api/etsy/webhook', webhookLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/shopify', shopifyRoutes);
app.use('/api/etsy', etsyRoutes);
app.use('/api/cj', cjRoutes);
app.use('/api/agents', agentRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║       🚀 DropshipAI API Server             ║
╠════════════════════════════════════════════╣
║  Port: ${PORT}                                 ║
║  Mode: ${process.env.NODE_ENV || 'development'}                       ║
║  Time: ${new Date().toLocaleTimeString()}                           ║
╚════════════════════════════════════════════╝
  `);
  console.log('Available endpoints:');
  console.log('  POST /api/auth/login');
  console.log('  POST /api/auth/register');
  console.log('  GET  /api/auth/me');
  console.log('  GET  /api/settings');
  console.log('  PUT  /api/settings');
  console.log('  *    /api/shopify/*');
  console.log('  *    /api/etsy/*');
  console.log('  *    /api/cj/*');
  console.log('');
  console.log('🤖 AI Agent endpoints:');
  console.log('  GET  /api/agents/status');
  console.log('  POST /api/agents/trends/analyze');
  console.log('  POST /api/agents/content/generate');
  console.log('  POST /api/agents/price/optimize');
  console.log('  POST /api/agents/product/evaluate');
  console.log('  POST /api/agents/chat');
  console.log('  POST /api/agents/chat/stream');
  console.log('  POST /api/agents/workflow/product-discovery');
  console.log('');
});

export default app;
