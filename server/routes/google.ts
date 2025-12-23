import { Router, Request, Response } from 'express';
import { searchGoogleShopping } from '../services/serpApiService.js';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/google/products/search (public)
router.get('/products/search', asyncHandler(async (req: Request, res: Response) => {
  const apiKey = process.env.SERPAPI_KEY;

  if (!apiKey) {
    throw new HttpError(400, 'Google Shopping API not configured. Add SERPAPI_KEY to environment.');
  }

  const keyword = req.query.keyword as string;
  if (!keyword) {
    throw new HttpError(400, 'Keyword is required');
  }

  const result = await searchGoogleShopping({
    query: keyword,
    apiKey,
    limit: Number(req.query.limit) || 20,
  });

  // Transform to standard format
  const products = result.data.map(item => ({
    id: item.id,
    title: item.title,
    description: `From ${item.source} - ${item.delivery}`,
    images: [item.image],
    costPrice: item.price * 0.6, // Estimate wholesale at 60%
    suggestedPrice: item.price * 1.2, // 20% markup for dropship
    category: 'General',
    rating: item.rating || 4.0,
    sold: item.reviews || 0,
    shippingTime: item.delivery || '5-10 days',
    variants: ['Default'],
    source: 'google',
    sourceUrl: item.url,
  }));

  res.json({
    success: result.success,
    data: products,
    error: result.error,
  });
}));

export default router;
