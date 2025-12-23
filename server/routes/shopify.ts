import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { createShopifyService } from '../services/shopifyService.js';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();
const prisma = new PrismaClient();

// Helper to get Shopify service for user
async function getShopifyService(userId: string) {
  const settings = await prisma.settings.findUnique({ where: { userId } });
  if (!settings?.shopifyStoreUrl || !settings?.shopifyAccessToken) {
    throw new HttpError(400, 'Shopify not configured. Please add your credentials in Settings.');
  }
  return createShopifyService({
    storeUrl: settings.shopifyStoreUrl,
    accessToken: settings.shopifyAccessToken,
    apiVersion: process.env.SHOPIFY_API_VERSION || '2024-01',
  });
}

// POST /api/shopify/test
router.post('/test', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const shopify = await getShopifyService(req.user!.userId);
  const result = await shopify.testConnection();
  res.json(result);
}));

// GET /api/shopify/orders
router.get('/orders', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const shopify = await getShopifyService(req.user!.userId);
  const result = await shopify.getOrders({
    status: req.query.status as 'open' | 'closed' | 'cancelled' | 'any',
    fulfillment_status: req.query.fulfillment_status as 'fulfilled' | 'unfulfilled' | 'partial' | 'any',
    limit: Number(req.query.limit) || 50,
  });
  res.json(result);
}));

// GET /api/shopify/orders/:id
router.get('/orders/:id', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const shopify = await getShopifyService(req.user!.userId);
  const result = await shopify.getOrder(Number(req.params.id));
  res.json(result);
}));

// POST /api/shopify/orders/:id/fulfill
router.post('/orders/:id/fulfill', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    trackingNumber: z.string(),
    trackingCompany: z.string(),
  });
  const { trackingNumber, trackingCompany } = schema.parse(req.body);

  const shopify = await getShopifyService(req.user!.userId);
  const result = await shopify.fulfillOrder(Number(req.params.id), trackingNumber, trackingCompany);
  res.json(result);
}));

// GET /api/shopify/products
router.get('/products', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const shopify = await getShopifyService(req.user!.userId);
  const result = await shopify.getProducts({
    limit: Number(req.query.limit) || 50,
    status: req.query.status as 'active' | 'archived' | 'draft',
  });
  res.json(result);
}));

// POST /api/shopify/products
router.post('/products', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const shopify = await getShopifyService(req.user!.userId);
  const result = await shopify.createProduct(req.body);
  res.json(result);
}));

// PUT /api/shopify/products/:id
router.put('/products/:id', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const shopify = await getShopifyService(req.user!.userId);
  const result = await shopify.updateProduct(Number(req.params.id), req.body);
  res.json(result);
}));

// DELETE /api/shopify/products/:id
router.delete('/products/:id', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const shopify = await getShopifyService(req.user!.userId);
  const result = await shopify.deleteProduct(Number(req.params.id));
  res.json(result);
}));

// POST /api/shopify/inventory
router.post('/inventory', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    inventoryItemId: z.number(),
    locationId: z.number(),
    quantity: z.number(),
  });
  const { inventoryItemId, locationId, quantity } = schema.parse(req.body);

  const shopify = await getShopifyService(req.user!.userId);
  const result = await shopify.updateInventory(inventoryItemId, locationId, quantity);
  res.json(result);
}));

// GET /api/shopify/locations
router.get('/locations', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const shopify = await getShopifyService(req.user!.userId);
  const result = await shopify.getLocations();
  res.json(result);
}));

// Webhook handler for Shopify with HMAC verification
router.post('/webhook', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const topic = req.headers['x-shopify-topic'] as string;
  const shopDomain = req.headers['x-shopify-shop-domain'] as string;
  const hmacHeader = req.headers['x-shopify-hmac-sha256'] as string;

  // Verify webhook authenticity
  const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (webhookSecret) {
    const crypto = await import('crypto');
    const rawBody = JSON.stringify(req.body);
    const hash = crypto.createHmac('sha256', webhookSecret)
      .update(rawBody, 'utf8')
      .digest('base64');

    if (hash !== hmacHeader) {
      console.error('Webhook HMAC verification failed');
      res.status(401).json({ error: 'Unauthorized webhook request' });
      return;
    }
  } else if (process.env.NODE_ENV === 'production') {
    console.warn('SECURITY WARNING: SHOPIFY_WEBHOOK_SECRET not set in production!');
  }

  console.log(`Received verified Shopify webhook: ${topic} from ${shopDomain}`);

  // Handle different webhook topics
  try {
    switch (topic) {
      case 'orders/create':
        console.log('New order received:', req.body.id);
        // TODO: Find user by shop domain and create local order
        // await processNewOrder(shopDomain, req.body);
        break;
      case 'orders/updated':
        console.log('Order updated:', req.body.id);
        // TODO: Update local order status
        // await updateOrderStatus(shopDomain, req.body);
        break;
      case 'products/update':
        console.log('Product updated:', req.body.id);
        // TODO: Sync product changes
        // await syncProductChanges(shopDomain, req.body);
        break;
      case 'orders/fulfilled':
        console.log('Order fulfilled:', req.body.id);
        break;
      case 'orders/cancelled':
        console.log('Order cancelled:', req.body.id);
        break;
      default:
        console.log('Unhandled webhook topic:', topic);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Still return 200 to prevent retries for processing errors
    res.status(200).json({ received: true, processing_error: true });
  }
}));

export default router;
