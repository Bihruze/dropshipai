// =====================================================
// DROPSHIPAI - Claude AI Service
// Anthropic Claude API entegrasyonu
// =====================================================

import Anthropic from '@anthropic-ai/sdk';

// Model tipleri ve maliyetleri
export type ClaudeModel = 'haiku' | 'sonnet' | 'opus';

interface ModelConfig {
  id: string;
  inputCostPer1M: number;
  outputCostPer1M: number;
  maxTokens: number;
  description: string;
}

const MODELS: Record<ClaudeModel, ModelConfig> = {
  haiku: {
    id: 'claude-3-5-haiku-20241022',
    inputCostPer1M: 0.80,
    outputCostPer1M: 4.00,
    maxTokens: 8192,
    description: 'Hızlı ve ekonomik - basit sorgular için',
  },
  sonnet: {
    id: 'claude-sonnet-4-20250514',
    inputCostPer1M: 3.00,
    outputCostPer1M: 15.00,
    maxTokens: 8192,
    description: 'Dengeli - çoğu görev için ideal',
  },
  opus: {
    id: 'claude-opus-4-20250514',
    inputCostPer1M: 15.00,
    outputCostPer1M: 75.00,
    maxTokens: 8192,
    description: 'En güçlü - karmaşık analizler için',
  },
};

// Task tipine göre önerilen model
const TASK_MODEL_MAP: Record<string, ClaudeModel> = {
  // Basit işler - Haiku
  'simple_query': 'haiku',
  'price_check': 'haiku',
  'stock_check': 'haiku',
  'translate': 'haiku',

  // Orta seviye - Sonnet
  'trend_analysis': 'sonnet',
  'product_scout': 'sonnet',
  'content_generation': 'sonnet',
  'price_optimization': 'sonnet',
  'competitor_analysis': 'sonnet',

  // Karmaşık işler - Opus
  'deep_market_analysis': 'opus',
  'strategy_planning': 'opus',
  'complex_reasoning': 'opus',
};

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeResponse {
  content: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  stopReason: string;
}

export interface StreamChunk {
  type: 'text' | 'done' | 'error';
  content?: string;
  response?: ClaudeResponse;
  error?: string;
}

class ClaudeService {
  private client: Anthropic | null = null;
  private totalCost: number = 0;
  private requestCount: number = 0;

  constructor() {
    this.initClient();
  }

  private initClient(): void {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
      console.log('✓ Claude AI client initialized');
    } else {
      console.warn('⚠ ANTHROPIC_API_KEY not set - Claude AI disabled');
    }
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  getRecommendedModel(taskType: string): ClaudeModel {
    return TASK_MODEL_MAP[taskType] || 'sonnet';
  }

  getModelInfo(model: ClaudeModel): ModelConfig {
    return MODELS[model];
  }

  calculateCost(inputTokens: number, outputTokens: number, model: ClaudeModel): number {
    const config = MODELS[model];
    const inputCost = (inputTokens / 1_000_000) * config.inputCostPer1M;
    const outputCost = (outputTokens / 1_000_000) * config.outputCostPer1M;
    return inputCost + outputCost;
  }

  getStats(): { totalCost: number; requestCount: number } {
    return {
      totalCost: this.totalCost,
      requestCount: this.requestCount,
    };
  }

  // ==================== ANA API METODLARI ====================

  async chat(
    messages: ClaudeMessage[],
    options: {
      model?: ClaudeModel;
      systemPrompt?: string;
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): Promise<ClaudeResponse> {
    if (!this.client) {
      throw new Error('Claude AI client not initialized. Set ANTHROPIC_API_KEY.');
    }

    const model = options.model || 'sonnet';
    const modelConfig = MODELS[model];

    const response = await this.client.messages.create({
      model: modelConfig.id,
      max_tokens: options.maxTokens || modelConfig.maxTokens,
      system: options.systemPrompt,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options.temperature,
    });

    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const cost = this.calculateCost(inputTokens, outputTokens, model);

    this.totalCost += cost;
    this.requestCount++;

    const textContent = response.content.find(c => c.type === 'text');

    return {
      content: textContent?.type === 'text' ? textContent.text : '',
      model: modelConfig.id,
      inputTokens,
      outputTokens,
      cost,
      stopReason: response.stop_reason || 'unknown',
    };
  }

  async *stream(
    messages: ClaudeMessage[],
    options: {
      model?: ClaudeModel;
      systemPrompt?: string;
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): AsyncGenerator<StreamChunk> {
    if (!this.client) {
      yield { type: 'error', error: 'Claude AI client not initialized' };
      return;
    }

    const model = options.model || 'sonnet';
    const modelConfig = MODELS[model];

    try {
      const stream = this.client.messages.stream({
        model: modelConfig.id,
        max_tokens: options.maxTokens || modelConfig.maxTokens,
        system: options.systemPrompt,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature: options.temperature,
      });

      let fullContent = '';
      let inputTokens = 0;
      let outputTokens = 0;

      for await (const event of stream) {
        if (event.type === 'content_block_delta') {
          const delta = event.delta;
          if ('text' in delta) {
            fullContent += delta.text;
            yield { type: 'text', content: delta.text };
          }
        } else if (event.type === 'message_delta') {
          if ('usage' in event && event.usage) {
            outputTokens = event.usage.output_tokens;
          }
        } else if (event.type === 'message_start') {
          if (event.message?.usage) {
            inputTokens = event.message.usage.input_tokens;
          }
        }
      }

      const cost = this.calculateCost(inputTokens, outputTokens, model);
      this.totalCost += cost;
      this.requestCount++;

      yield {
        type: 'done',
        response: {
          content: fullContent,
          model: modelConfig.id,
          inputTokens,
          outputTokens,
          cost,
          stopReason: 'end_turn',
        },
      };
    } catch (error) {
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ==================== DROPSHIPAI ÖZEL METODLARI ====================

  async analyzeTrends(niche: string, depth: 'quick' | 'standard' | 'comprehensive' = 'standard'): Promise<any> {
    const model = depth === 'comprehensive' ? 'sonnet' : 'haiku';

    const systemPrompt = `Sen bir e-ticaret ve dropshipping uzmanısın.
Verilen niş için trend analizi yapacaksın.
Yanıtını JSON formatında ver.`;

    const userPrompt = `"${niche}" nişi için ${depth === 'comprehensive' ? 'detaylı' : 'hızlı'} trend analizi yap.

Şu bilgileri JSON olarak döndür:
{
  "niche": "niş adı",
  "trends": [
    {
      "keyword": "trend anahtar kelime",
      "searchVolume": tahmini aylık arama (sayı),
      "growthRate": büyüme oranı yüzdesi (sayı, pozitif veya negatif),
      "competition": "low" | "medium" | "high",
      "seasonality": ["spring", "summer", "fall", "winter"] (uygun mevsimler),
      "score": 0-100 arası puan
    }
  ],
  "insights": ["içgörü 1", "içgörü 2", ...],
  "recommendations": ["öneri 1", "öneri 2", ...],
  "topOpportunities": [
    {
      "product": "ürün adı",
      "reason": "neden fırsat",
      "potentialProfit": tahmini kar marjı yüzdesi,
      "riskLevel": "low" | "medium" | "high"
    }
  ]
}

Sadece JSON döndür, başka açıklama ekleme.`;

    const response = await this.chat(
      [{ role: 'user', content: userPrompt }],
      { model, systemPrompt, temperature: 0.7 }
    );

    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return {
          ...JSON.parse(jsonMatch[0]),
          generatedAt: new Date(),
          aiMetrics: {
            model: response.model,
            tokens: response.inputTokens + response.outputTokens,
            cost: response.cost,
          },
        };
      }
    } catch (e) {
      console.error('JSON parse error:', e);
    }

    return {
      niche,
      trends: [],
      insights: ['Analiz yapılamadı'],
      recommendations: [],
      topOpportunities: [],
      generatedAt: new Date(),
      error: 'Parse error',
    };
  }

  async generateProductContent(
    product: {
      title: string;
      description?: string;
      category?: string;
      price?: number;
      features?: string[];
    },
    style: 'premium' | 'value' | 'conversion-focused' = 'conversion-focused'
  ): Promise<any> {
    const systemPrompt = `Sen bir e-ticaret içerik uzmanısın.
Ürünler için SEO uyumlu, satış odaklı içerikler üretiyorsun.
${style === 'premium' ? 'Lüks ve premium bir ton kullan.' : ''}
${style === 'value' ? 'Değer ve tasarruf vurgula.' : ''}
${style === 'conversion-focused' ? 'Satın alma kararını tetikleyici, aciliyet yaratan bir ton kullan.' : ''}
Yanıtını JSON formatında ver.`;

    const userPrompt = `Bu ürün için içerik üret:

Ürün: ${product.title}
${product.description ? `Açıklama: ${product.description}` : ''}
${product.category ? `Kategori: ${product.category}` : ''}
${product.price ? `Fiyat: $${product.price}` : ''}
${product.features ? `Özellikler: ${product.features.join(', ')}` : ''}

Şu JSON formatında döndür:
{
  "title": {
    "seoOptimized": "SEO uyumlu başlık",
    "variations": ["varyasyon 1", "varyasyon 2", "varyasyon 3"]
  },
  "description": {
    "short": "kısa açıklama (max 160 karakter)",
    "long": "detaylı açıklama (2-3 paragraf)",
    "html": "HTML formatında açıklama"
  },
  "bulletPoints": ["madde 1", "madde 2", "madde 3", "madde 4", "madde 5"],
  "seoKeywords": ["anahtar1", "anahtar2", ...],
  "metaDescription": "meta açıklama (max 155 karakter)",
  "socialMedia": {
    "instagram": "Instagram postu",
    "facebook": "Facebook postu",
    "tiktok": "TikTok açıklaması"
  }
}

Sadece JSON döndür.`;

    const response = await this.chat(
      [{ role: 'user', content: userPrompt }],
      { model: 'sonnet', systemPrompt, temperature: 0.8 }
    );

    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return {
          productId: product.title.toLowerCase().replace(/\s+/g, '-'),
          ...JSON.parse(jsonMatch[0]),
          aiMetrics: {
            model: response.model,
            tokens: response.inputTokens + response.outputTokens,
            cost: response.cost,
          },
        };
      }
    } catch (e) {
      console.error('JSON parse error:', e);
    }

    return { error: 'Content generation failed' };
  }

  async optimizePrice(
    product: {
      title: string;
      costPrice: number;
      currentPrice?: number;
      competitorPrices?: number[];
      category?: string;
    },
    strategy: 'premium' | 'competitive' | 'value' | 'penetration' = 'competitive'
  ): Promise<any> {
    const systemPrompt = `Sen bir fiyatlandırma uzmanısın.
E-ticaret ürünleri için optimal fiyat stratejileri belirliyorsun.
Yanıtını JSON formatında ver.`;

    const userPrompt = `Bu ürün için fiyat optimizasyonu yap:

Ürün: ${product.title}
Maliyet: $${product.costPrice}
${product.currentPrice ? `Mevcut Fiyat: $${product.currentPrice}` : ''}
${product.competitorPrices ? `Rakip Fiyatları: $${product.competitorPrices.join(', $')}` : ''}
${product.category ? `Kategori: ${product.category}` : ''}
Strateji: ${strategy}

Şu JSON formatında döndür:
{
  "optimalPrice": optimal fiyat (sayı),
  "priceRange": {
    "min": minimum fiyat,
    "max": maximum fiyat
  },
  "margin": {
    "optimal": optimal kar marjı yüzdesi,
    "minimum": minimum kabul edilebilir marj
  },
  "recommendation": "fiyatlandırma önerisi açıklaması",
  "confidence": 0-100 arası güven skoru,
  "pricingTiers": {
    "economy": { "price": fiyat, "margin": marj },
    "standard": { "price": fiyat, "margin": marj },
    "premium": { "price": fiyat, "margin": marj }
  },
  "dynamicPricingRules": [
    { "condition": "koşul", "adjustment": yüzde değişim, "reason": "neden" }
  ]
}

Sadece JSON döndür.`;

    const response = await this.chat(
      [{ role: 'user', content: userPrompt }],
      { model: 'haiku', systemPrompt, temperature: 0.3 }
    );

    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return {
          productId: product.title.toLowerCase().replace(/\s+/g, '-'),
          costPrice: product.costPrice,
          ...JSON.parse(jsonMatch[0]),
          aiMetrics: {
            model: response.model,
            tokens: response.inputTokens + response.outputTokens,
            cost: response.cost,
          },
        };
      }
    } catch (e) {
      console.error('JSON parse error:', e);
    }

    return { error: 'Price optimization failed' };
  }

  async evaluateProduct(
    product: {
      title: string;
      description?: string;
      price: number;
      costPrice: number;
      rating?: number;
      reviews?: number;
      sold?: number;
      supplier?: string;
    }
  ): Promise<any> {
    const systemPrompt = `Sen bir dropshipping ürün değerlendirme uzmanısın.
Ürünlerin satış potansiyelini, karlılığını ve risklerini analiz ediyorsun.
Yanıtını JSON formatında ver.`;

    const userPrompt = `Bu ürünü değerlendir:

Ürün: ${product.title}
${product.description ? `Açıklama: ${product.description}` : ''}
Satış Fiyatı: $${product.price}
Maliyet: $${product.costPrice}
Kar Marjı: %${(((product.price - product.costPrice) / product.price) * 100).toFixed(1)}
${product.rating ? `Puan: ${product.rating}/5` : ''}
${product.reviews ? `Yorum Sayısı: ${product.reviews}` : ''}
${product.sold ? `Satış Adedi: ${product.sold}` : ''}
${product.supplier ? `Tedarikçi: ${product.supplier}` : ''}

Şu JSON formatında döndür:
{
  "score": 0-100 arası genel puan,
  "verdict": "highly_recommended" | "recommended" | "neutral" | "not_recommended",
  "pros": ["artı 1", "artı 2", ...],
  "cons": ["eksi 1", "eksi 2", ...],
  "marketPotential": {
    "score": 0-100,
    "reasoning": "açıklama"
  },
  "profitability": {
    "score": 0-100,
    "reasoning": "açıklama"
  },
  "competition": {
    "level": "low" | "medium" | "high",
    "reasoning": "açıklama"
  },
  "risks": ["risk 1", "risk 2", ...],
  "recommendations": ["öneri 1", "öneri 2", ...]
}

Sadece JSON döndür.`;

    const response = await this.chat(
      [{ role: 'user', content: userPrompt }],
      { model: 'haiku', systemPrompt, temperature: 0.5 }
    );

    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return {
          productId: product.title.toLowerCase().replace(/\s+/g, '-'),
          ...JSON.parse(jsonMatch[0]),
          aiMetrics: {
            model: response.model,
            tokens: response.inputTokens + response.outputTokens,
            cost: response.cost,
          },
        };
      }
    } catch (e) {
      console.error('JSON parse error:', e);
    }

    return { error: 'Product evaluation failed' };
  }
}

// Singleton export
export const claudeService = new ClaudeService();
export default claudeService;
