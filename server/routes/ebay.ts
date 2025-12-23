import { Router, Request, Response } from 'express';
import { createEbayService } from '../services/ebayService.js';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';

const router = Router();

function getEbayService() {
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new HttpError(400, 'eBay API not configured. Please add EBAY_CLIENT_ID and EBAY_CLIENT_SECRET.');
  }

  return createEbayService({ clientId, clientSecret });
}

// GET /api/ebay/products/search (public)
router.get('/products/search', asyncHandler(async (req: Request, res: Response) => {
  const ebay = getEbayService();

  const result = await ebay.searchProducts({
    keyword: req.query.keyword as string || '',
    category: req.query.category as string,
    limit: Number(req.query.limit) || 20,
    offset: Number(req.query.offset) || 0,
    minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
    maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
  });

  // Transform to standard format
  const products = result.data.map(item => ({
    id: item.id,
    title: item.title,
    description: `${item.condition} - Seller: ${item.seller.name} (${item.seller.rating}% positive)`,
    images: [item.image],
    costPrice: item.price * 0.7, // Estimate cost as 70% of price
    suggestedPrice: item.price * 1.3, // Suggest 30% markup
    category: item.category,
    rating: item.seller.rating / 20, // Convert to 5-star scale
    sold: item.seller.feedbackScore,
    shippingTime: item.shipping === 'Free' ? '3-7 days' : '5-10 days',
    variants: [item.condition],
    source: 'ebay',
    sourceUrl: item.url,
  }));

  res.json({
    success: result.success,
    data: products,
    total: result.total,
    error: result.error,
  });
}));

// GET /api/ebay/products/:id (public)
router.get('/products/:id', asyncHandler(async (req: Request, res: Response) => {
  const ebay = getEbayService();
  const result = await ebay.getItem(req.params.id);

  if (!result.success || !result.data) {
    throw new HttpError(404, result.error || 'Product not found');
  }

  const item = result.data;
  res.json({
    success: true,
    data: {
      id: item.id,
      title: item.title,
      description: `${item.condition} - Seller: ${item.seller.name}`,
      images: [item.image],
      costPrice: item.price * 0.7,
      suggestedPrice: item.price * 1.3,
      category: item.category,
      rating: item.seller.rating / 20,
      sold: item.seller.feedbackScore,
      shippingTime: '5-10 days',
      variants: [item.condition],
      source: 'ebay',
      sourceUrl: item.url,
    },
  });
}));

// GET /api/ebay/test (public)
router.get('/test', asyncHandler(async (req: Request, res: Response) => {
  const ebay = getEbayService();
  const result = await ebay.testConnection();
  res.json(result);
}));

export default router;
