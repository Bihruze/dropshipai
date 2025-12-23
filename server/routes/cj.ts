import { Router, Response } from 'express';
import { z } from 'zod';
import { createCJService } from '../services/cjService.js';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

// Helper to get CJ service
function getCJService() {
  const apiKey = process.env.CJ_API_KEY;
  const email = process.env.CJ_EMAIL;

  if (!apiKey || !email) {
    throw new HttpError(400, 'CJ Dropshipping not configured. Please add your API credentials.');
  }

  return createCJService({ apiKey, email });
}

// POST /api/cj/test
router.post('/test', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const cj = getCJService();
  const result = await cj.testConnection();
  res.json(result);
}));

// GET /api/cj/products/search (public - read only)
router.get('/products/search', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const cj = getCJService();
  const result = await cj.searchProducts({
    keyword: req.query.keyword as string,
    categoryId: req.query.categoryId as string,
    pageNum: Number(req.query.page) || 1,
    pageSize: Number(req.query.limit) || 20,
  });
  res.json(result);
}));

// GET /api/cj/products/:id (public - read only)
router.get('/products/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const cj = getCJService();
  const result = await cj.getProduct(req.params.id);
  res.json(result);
}));

// GET /api/cj/categories (public - read only)
router.get('/categories', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const cj = getCJService();
  const result = await cj.getCategories();
  res.json(result);
}));

// GET /api/cj/stock/:variantId
router.get('/stock/:variantId', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const cj = getCJService();
  const result = await cj.checkStock(req.params.variantId);
  res.json(result);
}));

// POST /api/cj/orders
router.post('/orders', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    orderNumber: z.string(),
    shippingZip: z.string(),
    shippingCountry: z.string(),
    shippingCountryCode: z.string(),
    shippingProvince: z.string(),
    shippingCity: z.string(),
    shippingAddress: z.string(),
    shippingCustomerName: z.string(),
    shippingPhone: z.string(),
    products: z.array(z.object({
      vid: z.string(),
      quantity: z.number(),
    })),
  });

  const orderData = schema.parse(req.body);
  const cj = getCJService();
  const result = await cj.createOrder(orderData);
  res.json(result);
}));

// GET /api/cj/orders
router.get('/orders', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const cj = getCJService();
  const result = await cj.getOrders({
    status: req.query.status as 'CREATED' | 'IN_CART' | 'UNPAID' | 'UNSHIPPED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED',
    pageNum: Number(req.query.page) || 1,
    pageSize: Number(req.query.limit) || 20,
  });
  res.json(result);
}));

// GET /api/cj/orders/:id
router.get('/orders/:id', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const cj = getCJService();
  const result = await cj.getOrder(req.params.id);
  res.json(result);
}));

// GET /api/cj/tracking/:orderId
router.get('/tracking/:orderId', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const cj = getCJService();
  const result = await cj.getTracking(req.params.orderId);
  res.json(result);
}));

// POST /api/cj/shipping/calculate
router.post('/shipping/calculate', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    endCountry: z.string(),
    weight: z.number(),
    startCountry: z.string().optional(),
  });

  const { endCountry, weight, startCountry } = schema.parse(req.body);
  const cj = getCJService();
  const result = await cj.getShippingMethods({ endCountry, weight, startCountry });
  res.json(result);
}));

export default router;
