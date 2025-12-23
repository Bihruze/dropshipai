// =====================================================
// DROPSHIPAI - Agent API Routes
// AI Agent işlemleri için API endpoint'leri
// =====================================================

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import claudeService from '../services/claudeService';

const router = Router();

// Helper for async route handlers
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: Function) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ==================== VALIDATION SCHEMAS ====================

const trendAnalysisSchema = z.object({
  niche: z.string().min(2).max(100),
  depth: z.enum(['quick', 'standard', 'comprehensive']).optional().default('standard'),
});

const contentGenerationSchema = z.object({
  product: z.object({
    title: z.string().min(2).max(200),
    description: z.string().optional(),
    category: z.string().optional(),
    price: z.number().optional(),
    features: z.array(z.string()).optional(),
  }),
  style: z.enum(['premium', 'value', 'conversion-focused']).optional().default('conversion-focused'),
});

const priceOptimizationSchema = z.object({
  product: z.object({
    title: z.string().min(2).max(200),
    costPrice: z.number().positive(),
    currentPrice: z.number().optional(),
    competitorPrices: z.array(z.number()).optional(),
    category: z.string().optional(),
  }),
  strategy: z.enum(['premium', 'competitive', 'value', 'penetration']).optional().default('competitive'),
});

const productEvaluationSchema = z.object({
  product: z.object({
    title: z.string().min(2).max(200),
    description: z.string().optional(),
    price: z.number().positive(),
    costPrice: z.number().positive(),
    rating: z.number().min(0).max(5).optional(),
    reviews: z.number().optional(),
    sold: z.number().optional(),
    supplier: z.string().optional(),
  }),
});

const chatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })),
  model: z.enum(['haiku', 'sonnet', 'opus']).optional().default('sonnet'),
  systemPrompt: z.string().optional(),
  temperature: z.number().min(0).max(1).optional(),
});

// ==================== STATUS & INFO ====================

/**
 * GET /api/agents/status
 * Claude AI servis durumunu kontrol et
 */
router.get('/status', (req: Request, res: Response) => {
  const isAvailable = claudeService.isAvailable();
  const stats = claudeService.getStats();

  res.json({
    available: isAvailable,
    message: isAvailable ? 'Claude AI is ready' : 'Claude AI not configured. Set ANTHROPIC_API_KEY.',
    stats: {
      totalCost: `$${stats.totalCost.toFixed(4)}`,
      requestCount: stats.requestCount,
    },
    models: {
      haiku: claudeService.getModelInfo('haiku'),
      sonnet: claudeService.getModelInfo('sonnet'),
      opus: claudeService.getModelInfo('opus'),
    },
  });
});

// ==================== TREND ANALYSIS ====================

/**
 * POST /api/agents/trends/analyze
 * Niş trend analizi yap
 */
router.post('/trends/analyze', asyncHandler(async (req: Request, res: Response) => {
  const validation = trendAnalysisSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      error: 'Validation error',
      details: validation.error.errors,
    });
  }

  const { niche, depth } = validation.data;

  if (!claudeService.isAvailable()) {
    return res.status(503).json({
      error: 'Claude AI not available',
      message: 'Set ANTHROPIC_API_KEY environment variable',
    });
  }

  const result = await claudeService.analyzeTrends(niche, depth);

  res.json({
    success: true,
    data: result,
  });
}));

// ==================== CONTENT GENERATION ====================

/**
 * POST /api/agents/content/generate
 * Ürün içeriği üret
 */
router.post('/content/generate', asyncHandler(async (req: Request, res: Response) => {
  const validation = contentGenerationSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      error: 'Validation error',
      details: validation.error.errors,
    });
  }

  const { product, style } = validation.data;

  if (!claudeService.isAvailable()) {
    return res.status(503).json({
      error: 'Claude AI not available',
    });
  }

  const result = await claudeService.generateProductContent(product, style);

  res.json({
    success: true,
    data: result,
  });
}));

// ==================== PRICE OPTIMIZATION ====================

/**
 * POST /api/agents/price/optimize
 * Fiyat optimizasyonu yap
 */
router.post('/price/optimize', asyncHandler(async (req: Request, res: Response) => {
  const validation = priceOptimizationSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      error: 'Validation error',
      details: validation.error.errors,
    });
  }

  const { product, strategy } = validation.data;

  if (!claudeService.isAvailable()) {
    return res.status(503).json({
      error: 'Claude AI not available',
    });
  }

  const result = await claudeService.optimizePrice(product, strategy);

  res.json({
    success: true,
    data: result,
  });
}));

// ==================== PRODUCT EVALUATION ====================

/**
 * POST /api/agents/product/evaluate
 * Ürün değerlendirmesi yap
 */
router.post('/product/evaluate', asyncHandler(async (req: Request, res: Response) => {
  const validation = productEvaluationSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      error: 'Validation error',
      details: validation.error.errors,
    });
  }

  const { product } = validation.data;

  if (!claudeService.isAvailable()) {
    return res.status(503).json({
      error: 'Claude AI not available',
    });
  }

  const result = await claudeService.evaluateProduct(product);

  res.json({
    success: true,
    data: result,
  });
}));

// ==================== CHAT ====================

/**
 * POST /api/agents/chat
 * Genel AI chat
 */
router.post('/chat', asyncHandler(async (req: Request, res: Response) => {
  const validation = chatSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      error: 'Validation error',
      details: validation.error.errors,
    });
  }

  const { messages, model, systemPrompt, temperature } = validation.data;

  if (!claudeService.isAvailable()) {
    return res.status(503).json({
      error: 'Claude AI not available',
    });
  }

  const result = await claudeService.chat(messages, {
    model,
    systemPrompt,
    temperature,
  });

  res.json({
    success: true,
    data: {
      content: result.content,
      model: result.model,
      usage: {
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        totalTokens: result.inputTokens + result.outputTokens,
      },
      cost: `$${result.cost.toFixed(6)}`,
    },
  });
}));

// ==================== STREAMING CHAT ====================

/**
 * POST /api/agents/chat/stream
 * Streaming AI chat (Server-Sent Events)
 */
router.post('/chat/stream', asyncHandler(async (req: Request, res: Response) => {
  const validation = chatSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      error: 'Validation error',
      details: validation.error.errors,
    });
  }

  const { messages, model, systemPrompt, temperature } = validation.data;

  if (!claudeService.isAvailable()) {
    return res.status(503).json({
      error: 'Claude AI not available',
    });
  }

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    for await (const chunk of claudeService.stream(messages, {
      model,
      systemPrompt,
      temperature,
    })) {
      if (chunk.type === 'text') {
        res.write(`data: ${JSON.stringify({ type: 'text', content: chunk.content })}\n\n`);
      } else if (chunk.type === 'done') {
        res.write(`data: ${JSON.stringify({
          type: 'done',
          usage: {
            inputTokens: chunk.response?.inputTokens,
            outputTokens: chunk.response?.outputTokens,
          },
          cost: `$${chunk.response?.cost.toFixed(6)}`,
        })}\n\n`);
      } else if (chunk.type === 'error') {
        res.write(`data: ${JSON.stringify({ type: 'error', error: chunk.error })}\n\n`);
      }
    }
  } catch (error) {
    res.write(`data: ${JSON.stringify({ type: 'error', error: 'Stream error' })}\n\n`);
  }

  res.end();
}));

// ==================== BULK OPERATIONS ====================

/**
 * POST /api/agents/bulk/content
 * Toplu içerik üretimi
 */
router.post('/bulk/content', asyncHandler(async (req: Request, res: Response) => {
  const { products, style } = req.body;

  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({
      error: 'Products array is required',
    });
  }

  if (products.length > 10) {
    return res.status(400).json({
      error: 'Maximum 10 products per request',
    });
  }

  if (!claudeService.isAvailable()) {
    return res.status(503).json({
      error: 'Claude AI not available',
    });
  }

  const results = [];
  let totalCost = 0;

  for (const product of products) {
    const result = await claudeService.generateProductContent(product, style || 'conversion-focused');
    results.push(result);
    if (result.aiMetrics?.cost) {
      totalCost += result.aiMetrics.cost;
    }
  }

  res.json({
    success: true,
    data: results,
    summary: {
      processed: results.length,
      totalCost: `$${totalCost.toFixed(4)}`,
    },
  });
}));

/**
 * POST /api/agents/workflow/product-discovery
 * Tam ürün keşif workflow'u
 */
router.post('/workflow/product-discovery', asyncHandler(async (req: Request, res: Response) => {
  const { niche, maxProducts = 5, minProfitMargin = 30 } = req.body;

  if (!niche) {
    return res.status(400).json({
      error: 'Niche is required',
    });
  }

  if (!claudeService.isAvailable()) {
    return res.status(503).json({
      error: 'Claude AI not available',
    });
  }

  // Step 1: Trend Analysis
  const trends = await claudeService.analyzeTrends(niche, 'comprehensive');

  // Step 2: Get top opportunities and evaluate them
  const evaluations = [];
  const topProducts = trends.topOpportunities?.slice(0, maxProducts) || [];

  for (const opportunity of topProducts) {
    // Simulate product data (in real app, this would come from supplier API)
    const mockProduct = {
      title: opportunity.product,
      description: `High-quality ${opportunity.product} for dropshipping`,
      price: Math.floor(Math.random() * 50) + 20,
      costPrice: Math.floor(Math.random() * 20) + 5,
      rating: 4 + Math.random(),
      reviews: Math.floor(Math.random() * 500) + 50,
      sold: Math.floor(Math.random() * 5000) + 100,
    };

    const evaluation = await claudeService.evaluateProduct(mockProduct);
    evaluations.push({
      ...mockProduct,
      evaluation,
    });
  }

  // Step 3: Generate content for high-scoring products
  const productsWithContent = [];
  for (const product of evaluations) {
    if (product.evaluation.score >= 70) {
      const content = await claudeService.generateProductContent({
        title: product.title,
        description: product.description,
        price: product.price,
      });

      const pricing = await claudeService.optimizePrice({
        title: product.title,
        costPrice: product.costPrice,
        currentPrice: product.price,
      });

      productsWithContent.push({
        ...product,
        content,
        pricing,
      });
    }
  }

  res.json({
    success: true,
    workflow: 'product-discovery',
    data: {
      trends,
      evaluations,
      readyToPublish: productsWithContent,
    },
    summary: {
      trendsFound: trends.trends?.length || 0,
      productsEvaluated: evaluations.length,
      readyToPublish: productsWithContent.length,
    },
  });
}));

export default router;
