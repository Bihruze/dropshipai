import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { generateToken, authMiddleware } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';
import { authLimiter, registrationLimiter } from '../middleware/rateLimiter.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();
const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// POST /api/auth/login
// Rate limited: 5 attempts per 15 minutes per IP
router.post('/login', authLimiter, asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new HttpError(401, 'Invalid email or password');
  }

  // Check password
  if (!user.passwordHash) {
    // Legacy user without password - require password reset
    throw new HttpError(401, 'Please reset your password to continue');
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    throw new HttpError(401, 'Invalid email or password');
  }

  const token = generateToken({ userId: user.id, email: user.email });

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    },
  });
}));

// POST /api/auth/register
// Rate limited: 3 registrations per hour per IP
router.post('/register', registrationLimiter, asyncHandler(async (req: Request, res: Response) => {
  const { email, name, password } = registerSchema.parse(req.body);

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new HttpError(400, 'User already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { email, name, passwordHash },
  });

  // Create default settings for new user
  await prisma.settings.create({
    data: { userId: user.id },
  });

  const token = generateToken({ userId: user.id, email: user.email });

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    },
  });
}));

// GET /api/auth/me
router.get('/me', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: { settings: true },
  });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      settings: user.settings,
    },
  });
}));

// POST /api/auth/logout
router.post('/logout', authMiddleware, (req: Request, res: Response) => {
  // JWT tokens are stateless, so we just return success
  // In production, you might want to blacklist the token
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
