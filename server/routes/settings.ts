import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();
const prisma = new PrismaClient();

// Validation schema
const settingsSchema = z.object({
  shopifyStoreUrl: z.string().optional(),
  shopifyAccessToken: z.string().optional(),
  shopifyConnected: z.boolean().optional(),
  defaultMarkup: z.number().min(1).optional(),
  minProfitMargin: z.number().min(0).max(100).optional(),
  autoUpdatePrices: z.boolean().optional(),
  roundTo99: z.boolean().optional(),
  cjApiKey: z.string().optional(),
  claudeApiKey: z.string().optional(),
  telegramBotToken: z.string().optional(),
  telegramChatId: z.string().optional(),
  notifyNewOrders: z.boolean().optional(),
  notifyLowStock: z.boolean().optional(),
  notifyDailySummary: z.boolean().optional(),
  language: z.string().optional(),
  currency: z.string().optional(),
  timezone: z.string().optional(),
});

// GET /api/settings
router.get('/', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  let settings = await prisma.settings.findUnique({
    where: { userId: req.user!.userId },
  });

  if (!settings) {
    // Create default settings
    settings = await prisma.settings.create({
      data: {
        userId: req.user!.userId,
      },
    });
  }

  // Don't send sensitive tokens to frontend
  const safeSettings = {
    ...settings,
    shopifyAccessToken: settings.shopifyAccessToken ? '••••••••' : '',
    cjApiKey: settings.cjApiKey ? '••••••••' : '',
    claudeApiKey: settings.claudeApiKey ? '••••••••' : '',
    telegramBotToken: settings.telegramBotToken ? '••••••••' : '',
  };

  res.json({ success: true, data: safeSettings });
}));

// PUT /api/settings
router.put('/', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const updates = settingsSchema.parse(req.body);

  const settings = await prisma.settings.upsert({
    where: { userId: req.user!.userId },
    update: updates,
    create: {
      userId: req.user!.userId,
      ...updates,
    },
  });

  res.json({
    success: true,
    data: settings,
    message: 'Settings updated successfully',
  });
}));

// POST /api/settings/test-telegram
router.post('/test-telegram', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const settings = await prisma.settings.findUnique({
    where: { userId: req.user!.userId },
  });

  if (!settings?.telegramBotToken || !settings?.telegramChatId) {
    throw new HttpError(400, 'Telegram not configured');
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: settings.telegramChatId,
          text: '✅ DropshipAI connection test successful!',
          parse_mode: 'HTML',
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Telegram API returned error');
    }

    res.json({ success: true, message: 'Test message sent successfully' });
  } catch (error) {
    throw new HttpError(400, 'Failed to send test message. Check your credentials.');
  }
}));

export default router;
