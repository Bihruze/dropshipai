import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { createEtsyService, EtsyService } from '../services/etsyService.js';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();
const prisma = new PrismaClient();

// Helper to get Etsy service for user
async function getEtsyService(userId: string) {
  const settings = await prisma.settings.findUnique({ where: { userId } });

  // For now, we'll use environment variables as fallback
  const apiKey = process.env.ETSY_API_KEY;
  const shopId = process.env.ETSY_SHOP_ID;

  if (!apiKey || !shopId) {
    throw new HttpError(400, 'Etsy not configured. Please add your API credentials.');
  }

  // Note: In production, you'd store and retrieve OAuth tokens per user
  const accessToken = process.env.ETSY_ACCESS_TOKEN || '';

  return createEtsyService({
    apiKey,
    shopId,
    accessToken,
  });
}

// GET /api/etsy/auth-url
router.get('/auth-url', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const apiKey = process.env.ETSY_API_KEY;
  const redirectUri = process.env.ETSY_REDIRECT_URI || 'http://localhost:3001/api/etsy/callback';

  if (!apiKey) {
    throw new HttpError(400, 'Etsy API key not configured');
  }

  // Generate a random state for CSRF protection
  const state = Math.random().toString(36).substring(2, 15);

  const authUrl = EtsyService.getAuthUrl(apiKey, redirectUri, state);

  res.json({
    success: true,
    data: { authUrl, state },
  });
}));

// GET /api/etsy/callback - OAuth callback
router.get('/callback', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { code, state } = req.query;

  if (!code || typeof code !== 'string') {
    throw new HttpError(400, 'Missing authorization code');
  }

  // In production, verify the state parameter matches what was stored
  // and exchange the code for tokens
  console.log('Received OAuth callback with code:', code);

  // Redirect to frontend with success
  res.redirect('http://localhost:3000/settings?etsy=connected');
}));

// POST /api/etsy/test
router.post('/test', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const etsy = await getEtsyService(req.user!.userId);
  const result = await etsy.testConnection();
  res.json(result);
}));

// GET /api/etsy/receipts (orders)
router.get('/receipts', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const etsy = await getEtsyService(req.user!.userId);
  const result = await etsy.getReceipts({
    limit: Number(req.query.limit) || 25,
    offset: Number(req.query.offset) || 0,
    was_shipped: req.query.was_shipped === 'true' ? true : req.query.was_shipped === 'false' ? false : undefined,
  });
  res.json(result);
}));

// GET /api/etsy/receipts/:id
router.get('/receipts/:id', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const etsy = await getEtsyService(req.user!.userId);
  const result = await etsy.getReceipt(Number(req.params.id));
  res.json(result);
}));

// POST /api/etsy/receipts/:id/ship
router.post('/receipts/:id/ship', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    trackingCode: z.string(),
    carrierName: z.string(),
  });
  const { trackingCode, carrierName } = schema.parse(req.body);

  const etsy = await getEtsyService(req.user!.userId);
  const result = await etsy.createShipment(Number(req.params.id), trackingCode, carrierName);
  res.json(result);
}));

// GET /api/etsy/listings
router.get('/listings', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const etsy = await getEtsyService(req.user!.userId);
  const result = await etsy.getListings({
    limit: Number(req.query.limit) || 25,
    offset: Number(req.query.offset) || 0,
    state: req.query.state as 'active' | 'inactive' | 'draft' | 'expired',
  });
  res.json(result);
}));

// GET /api/etsy/listings/:id
router.get('/listings/:id', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const etsy = await getEtsyService(req.user!.userId);
  const result = await etsy.getListing(Number(req.params.id));
  res.json(result);
}));

// POST /api/etsy/listings
router.post('/listings', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const etsy = await getEtsyService(req.user!.userId);
  const result = await etsy.createListing(req.body);
  res.json(result);
}));

// PATCH /api/etsy/listings/:id
router.patch('/listings/:id', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const etsy = await getEtsyService(req.user!.userId);
  const result = await etsy.updateListing(Number(req.params.id), req.body);
  res.json(result);
}));

// PUT /api/etsy/listings/:id/inventory
router.put('/listings/:id/inventory', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    quantity: z.number().min(0),
  });
  const { quantity } = schema.parse(req.body);

  const etsy = await getEtsyService(req.user!.userId);
  const result = await etsy.updateInventory(Number(req.params.id), quantity);
  res.json(result);
}));

// DELETE /api/etsy/listings/:id
router.delete('/listings/:id', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const etsy = await getEtsyService(req.user!.userId);
  const result = await etsy.deleteListing(Number(req.params.id));
  res.json(result);
}));

export default router;
