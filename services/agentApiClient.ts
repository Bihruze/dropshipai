// =====================================================
// DROPSHIPAI - Agent API Client
// Frontend'den Claude AI API'sine bağlantı
// =====================================================

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

interface TrendAnalysisResult {
  niche: string;
  generatedAt: Date;
  trends: Array<{
    keyword: string;
    searchVolume: number;
    growthRate: number;
    competition: 'low' | 'medium' | 'high';
    seasonality: string[];
    score: number;
  }>;
  insights: string[];
  recommendations: string[];
  topOpportunities: Array<{
    product: string;
    reason: string;
    potentialProfit: number;
    riskLevel: 'low' | 'medium' | 'high';
  }>;
  aiMetrics?: {
    model: string;
    tokens: number;
    cost: number;
  };
}

interface ContentGenerationResult {
  productId: string;
  title: {
    seoOptimized: string;
    variations: string[];
  };
  description: {
    short: string;
    long: string;
    html: string;
  };
  bulletPoints: string[];
  seoKeywords: string[];
  metaDescription: string;
  socialMedia: {
    instagram: string;
    facebook: string;
    tiktok: string;
  };
  aiMetrics?: {
    model: string;
    tokens: number;
    cost: number;
  };
}

interface PriceOptimizationResult {
  productId: string;
  costPrice: number;
  optimalPrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  margin: {
    optimal: number;
    minimum: number;
  };
  recommendation: string;
  confidence: number;
  pricingTiers: {
    economy: { price: number; margin: number };
    standard: { price: number; margin: number };
    premium: { price: number; margin: number };
  };
  aiMetrics?: {
    model: string;
    tokens: number;
    cost: number;
  };
}

interface ProductEvaluationResult {
  productId: string;
  score: number;
  verdict: 'highly_recommended' | 'recommended' | 'neutral' | 'not_recommended';
  pros: string[];
  cons: string[];
  marketPotential: {
    score: number;
    reasoning: string;
  };
  profitability: {
    score: number;
    reasoning: string;
  };
  competition: {
    level: 'low' | 'medium' | 'high';
    reasoning: string;
  };
  risks: string[];
  recommendations: string[];
  aiMetrics?: {
    model: string;
    tokens: number;
    cost: number;
  };
}

interface AgentStatus {
  available: boolean;
  message: string;
  stats: {
    totalCost: string;
    requestCount: number;
  };
  models: Record<string, {
    id: string;
    inputCostPer1M: number;
    outputCostPer1M: number;
    maxTokens: number;
    description: string;
  }>;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  content: string;
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  cost: string;
}

class AgentApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Request failed',
          details: data.details,
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // ==================== STATUS ====================

  async getStatus(): Promise<ApiResponse<AgentStatus>> {
    return this.request<AgentStatus>('/api/agents/status');
  }

  // ==================== TREND ANALYSIS ====================

  async analyzeTrends(
    niche: string,
    depth: 'quick' | 'standard' | 'comprehensive' = 'standard'
  ): Promise<ApiResponse<TrendAnalysisResult>> {
    return this.request<TrendAnalysisResult>('/api/agents/trends/analyze', {
      method: 'POST',
      body: JSON.stringify({ niche, depth }),
    });
  }

  // ==================== CONTENT GENERATION ====================

  async generateContent(
    product: {
      title: string;
      description?: string;
      category?: string;
      price?: number;
      features?: string[];
    },
    style: 'premium' | 'value' | 'conversion-focused' = 'conversion-focused'
  ): Promise<ApiResponse<ContentGenerationResult>> {
    return this.request<ContentGenerationResult>('/api/agents/content/generate', {
      method: 'POST',
      body: JSON.stringify({ product, style }),
    });
  }

  async generateBulkContent(
    products: Array<{
      title: string;
      description?: string;
      category?: string;
      price?: number;
      features?: string[];
    }>,
    style: 'premium' | 'value' | 'conversion-focused' = 'conversion-focused'
  ): Promise<ApiResponse<{ data: ContentGenerationResult[]; summary: { processed: number; totalCost: string } }>> {
    return this.request('/api/agents/bulk/content', {
      method: 'POST',
      body: JSON.stringify({ products, style }),
    });
  }

  // ==================== PRICE OPTIMIZATION ====================

  async optimizePrice(
    product: {
      title: string;
      costPrice: number;
      currentPrice?: number;
      competitorPrices?: number[];
      category?: string;
    },
    strategy: 'premium' | 'competitive' | 'value' | 'penetration' = 'competitive'
  ): Promise<ApiResponse<PriceOptimizationResult>> {
    return this.request<PriceOptimizationResult>('/api/agents/price/optimize', {
      method: 'POST',
      body: JSON.stringify({ product, strategy }),
    });
  }

  // ==================== PRODUCT EVALUATION ====================

  async evaluateProduct(product: {
    title: string;
    description?: string;
    price: number;
    costPrice: number;
    rating?: number;
    reviews?: number;
    sold?: number;
    supplier?: string;
  }): Promise<ApiResponse<ProductEvaluationResult>> {
    return this.request<ProductEvaluationResult>('/api/agents/product/evaluate', {
      method: 'POST',
      body: JSON.stringify({ product }),
    });
  }

  // ==================== CHAT ====================

  async chat(
    messages: ChatMessage[],
    options: {
      model?: 'haiku' | 'sonnet' | 'opus';
      systemPrompt?: string;
      temperature?: number;
    } = {}
  ): Promise<ApiResponse<ChatResponse>> {
    return this.request<ChatResponse>('/api/agents/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages,
        model: options.model || 'sonnet',
        systemPrompt: options.systemPrompt,
        temperature: options.temperature,
      }),
    });
  }

  async *streamChat(
    messages: ChatMessage[],
    options: {
      model?: 'haiku' | 'sonnet' | 'opus';
      systemPrompt?: string;
      temperature?: number;
    } = {}
  ): AsyncGenerator<{ type: 'text' | 'done' | 'error'; content?: string; usage?: any; cost?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/agents/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          model: options.model || 'sonnet',
          systemPrompt: options.systemPrompt,
          temperature: options.temperature,
        }),
      });

      if (!response.ok) {
        yield { type: 'error', error: 'Request failed' };
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        yield { type: 'error', error: 'No response body' };
        return;
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              yield data;
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      yield { type: 'error', error: error instanceof Error ? error.message : 'Stream error' };
    }
  }

  // ==================== WORKFLOWS ====================

  async runProductDiscovery(
    niche: string,
    options: {
      maxProducts?: number;
      minProfitMargin?: number;
    } = {}
  ): Promise<ApiResponse<{
    trends: TrendAnalysisResult;
    evaluations: any[];
    readyToPublish: any[];
  }>> {
    return this.request('/api/agents/workflow/product-discovery', {
      method: 'POST',
      body: JSON.stringify({
        niche,
        maxProducts: options.maxProducts || 5,
        minProfitMargin: options.minProfitMargin || 30,
      }),
    });
  }
}

// Singleton export
export const agentApi = new AgentApiClient();
export default agentApi;
