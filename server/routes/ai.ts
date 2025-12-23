import { Router, Request, Response } from 'express';
import { createAIService } from '../services/aiService.js';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';

const router = Router();

function getAIService() {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    throw new HttpError(400, 'Claude API key not configured. Add CLAUDE_API_KEY to environment.');
  }
  return createAIService(apiKey);
}

// POST /api/ai/trend - Trend Analysis
router.post('/trend', asyncHandler(async (req: Request, res: Response) => {
  const { product } = req.body;
  if (!product) throw new HttpError(400, 'Product is required');

  const ai = getAIService();
  const result = await ai.analyzeTrend(product);
  res.json({ success: true, data: result });
}));

// POST /api/ai/research - Product Research
router.post('/research', asyncHandler(async (req: Request, res: Response) => {
  const { product } = req.body;
  if (!product) throw new HttpError(400, 'Product is required');

  const ai = getAIService();
  const result = await ai.researchProduct(product);
  res.json({ success: true, data: result });
}));

// POST /api/ai/content - Content Generation
router.post('/content', asyncHandler(async (req: Request, res: Response) => {
  const { product, type = 'full' } = req.body;
  if (!product) throw new HttpError(400, 'Product is required');

  const ai = getAIService();
  const result = await ai.generateContent(product, type);
  res.json({ success: true, data: result });
}));

// POST /api/ai/price - Price Optimization
router.post('/price', asyncHandler(async (req: Request, res: Response) => {
  const { product, cost } = req.body;
  if (!product) throw new HttpError(400, 'Product is required');

  const ai = getAIService();
  const result = await ai.optimizePrice(product, cost);
  res.json({ success: true, data: result });
}));

// POST /api/ai/competitors - Competitor Analysis
router.post('/competitors', asyncHandler(async (req: Request, res: Response) => {
  const { product } = req.body;
  if (!product) throw new HttpError(400, 'Product is required');

  const ai = getAIService();
  const result = await ai.analyzeCompetitors(product);
  res.json({ success: true, data: result });
}));

// POST /api/ai/marketing - Marketing Copy
router.post('/marketing', asyncHandler(async (req: Request, res: Response) => {
  const { product, platform = 'facebook' } = req.body;
  if (!product) throw new HttpError(400, 'Product is required');

  const ai = getAIService();
  const result = await ai.generateMarketingCopy(product, platform);
  res.json({ success: true, data: result });
}));

// POST /api/ai/seo - SEO Optimization
router.post('/seo', asyncHandler(async (req: Request, res: Response) => {
  const { product } = req.body;
  if (!product) throw new HttpError(400, 'Product is required');

  const ai = getAIService();
  const result = await ai.optimizeSEO(product);
  res.json({ success: true, data: result });
}));

// GET /api/ai/test - Test Connection
router.get('/test', asyncHandler(async (req: Request, res: Response) => {
  const ai = getAIService();
  const result = await ai.testConnection();
  res.json(result);
}));

export default router;
