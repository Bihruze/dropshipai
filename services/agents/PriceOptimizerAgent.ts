// =====================================================
// DROPSHIPAI - PriceOptimizer Agent
// Analyzes market pricing and optimizes for profit
// =====================================================

import { BaseAgent } from './BaseAgent';
import {
  AgentTask,
  AgentMessage,
  ScoutedProduct,
  PriceAnalysis,
  PricingStrategy,
} from './types';

interface CompetitorPrice {
  store: string;
  price: number;
  shipping: number;
  totalPrice: number;
  inStock: boolean;
  lastUpdated: Date;
}

interface PriceHistoryPoint {
  date: Date;
  price: number;
  sales: number;
}

interface DynamicPricingRule {
  id: string;
  name: string;
  condition: 'stock_low' | 'competitor_undercut' | 'high_demand' | 'seasonal' | 'time_based';
  adjustment: number; // Percentage
  enabled: boolean;
}

export class PriceOptimizerAgent extends BaseAgent {
  private dynamicRules: DynamicPricingRule[] = [];

  constructor() {
    super('price-optimizer', 'PriceOptimizer', [
      'Analyze competitor pricing',
      'Calculate optimal margins',
      'Track price history',
      'Dynamic pricing rules',
      'A/B test pricing',
      'Profit forecasting',
    ]);

    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    this.dynamicRules = [
      {
        id: 'rule-low-stock',
        name: 'Low Stock Premium',
        condition: 'stock_low',
        adjustment: 10,
        enabled: true,
      },
      {
        id: 'rule-competitor',
        name: 'Competitor Match',
        condition: 'competitor_undercut',
        adjustment: -5,
        enabled: true,
      },
      {
        id: 'rule-high-demand',
        name: 'High Demand Premium',
        condition: 'high_demand',
        adjustment: 15,
        enabled: true,
      },
      {
        id: 'rule-seasonal',
        name: 'Seasonal Adjustment',
        condition: 'seasonal',
        adjustment: 20,
        enabled: true,
      },
    ];
  }

  protected handleMessage(message: AgentMessage): void {
    if (message.type === 'request' && message.from === 'product-scout') {
      this.log(`Received products for price optimization`);
    }
  }

  protected async performTask(task: AgentTask): Promise<any> {
    switch (task.type) {
      case 'optimize_pricing':
        return this.optimizePricing(task as any);
      case 'analyze_competitors':
        return this.analyzeCompetitors(task as any);
      case 'forecast_profit':
        return this.forecastProfit(task as any);
      case 'dynamic_pricing':
        return this.applyDynamicPricing(task as any);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  async execute(input: {
    product?: ScoutedProduct;
    products?: ScoutedProduct[];
    strategy?: PricingStrategy;
    targetMargin?: number;
    competitorAnalysis?: boolean;
  }): Promise<PriceAnalysis | PriceAnalysis[]> {
    const products = input.products || (input.product ? [input.product] : []);

    if (products.length === 0) {
      throw new Error('No products provided for price optimization');
    }

    if (products.length === 1) {
      const task = this.createTask(
        'optimize_pricing',
        `Optimizing price for: ${products[0].title}`,
        'high'
      );
      await this.think(`Analyzing market data for optimal pricing...`);
      return this.executeTask({
        ...task,
        product: products[0],
        strategy: input.strategy || 'competitive',
        targetMargin: input.targetMargin || 30,
        competitorAnalysis: input.competitorAnalysis !== false,
      } as any);
    }

    // Multiple products
    const results: PriceAnalysis[] = [];
    for (const product of products) {
      const analysis = await this.optimizeSingleProduct(
        product,
        input.strategy || 'competitive',
        input.targetMargin || 30
      );
      results.push(analysis);
    }
    return results;
  }

  // ==================== CORE METHODS ====================

  private async optimizePricing(
    task: AgentTask & {
      product: ScoutedProduct;
      strategy: PricingStrategy;
      targetMargin: number;
      competitorAnalysis: boolean;
    }
  ): Promise<PriceAnalysis> {
    const { product, strategy, targetMargin, competitorAnalysis } = task;

    this.sendMessage('user', 'progress', `Analyzing pricing for "${product.title}"...`);
    this.updateProgress(10);

    // Fetch competitor prices
    let competitors: CompetitorPrice[] = [];
    if (competitorAnalysis) {
      this.sendMessage('user', 'progress', 'Scanning competitor prices...');
      competitors = await this.fetchCompetitorPrices(product);
      this.updateProgress(30);
    }

    // Analyze price history
    this.sendMessage('user', 'progress', 'Analyzing price trends...');
    const priceHistory = this.generatePriceHistory(product);
    this.updateProgress(45);

    // Calculate optimal price
    this.sendMessage('user', 'progress', 'Calculating optimal price...');
    const optimalPrice = this.calculateOptimalPrice(product, competitors, strategy, targetMargin);
    this.updateProgress(60);

    // Generate pricing tiers
    this.sendMessage('user', 'progress', 'Generating pricing strategies...');
    const pricingTiers = this.generatePricingTiers(product, optimalPrice);
    this.updateProgress(75);

    // Calculate profit projections
    this.sendMessage('user', 'progress', 'Projecting profit scenarios...');
    const profitProjection = this.calculateProfitProjection(product, optimalPrice);
    this.updateProgress(90);

    // Apply dynamic pricing rules
    const dynamicAdjustments = this.calculateDynamicAdjustments(product);

    this.updateProgress(100);

    const analysis: PriceAnalysis = {
      productId: product.id,
      currentPrice: product.suggestedPrice,
      costPrice: product.costPrice,
      optimalPrice: optimalPrice.recommended,
      priceRange: optimalPrice.range,
      competitorPrices: competitors.map((c) => ({
        store: c.store,
        price: c.totalPrice,
      })),
      margin: {
        current: this.calculateMargin(product.suggestedPrice, product.costPrice),
        optimal: this.calculateMargin(optimalPrice.recommended, product.costPrice),
        minimum: this.calculateMargin(optimalPrice.range.min, product.costPrice),
        maximum: this.calculateMargin(optimalPrice.range.max, product.costPrice),
      },
      recommendation: this.generateRecommendation(product, optimalPrice, competitors),
      confidence: this.calculateConfidence(competitors, priceHistory),
      pricingTiers,
      profitProjection,
      dynamicAdjustments,
    };

    this.sendMessage(
      'user',
      'info',
      `Price optimization complete! Recommended: $${optimalPrice.recommended.toFixed(2)} (${analysis.margin.optimal.toFixed(1)}% margin)`
    );

    return analysis;
  }

  private async optimizeSingleProduct(
    product: ScoutedProduct,
    strategy: PricingStrategy,
    targetMargin: number
  ): Promise<PriceAnalysis> {
    const task = this.createTask('optimize_pricing', `Optimizing: ${product.title}`, 'medium');
    return this.executeTask({ ...task, product, strategy, targetMargin, competitorAnalysis: true } as any);
  }

  private async analyzeCompetitors(task: AgentTask): Promise<any> {
    // Deep competitor analysis
    return { competitors: [] };
  }

  private async forecastProfit(task: AgentTask): Promise<any> {
    // Profit forecasting
    return { forecast: [] };
  }

  private async applyDynamicPricing(task: AgentTask): Promise<any> {
    // Apply dynamic pricing rules
    return { adjustments: [] };
  }

  // ==================== PRICING CALCULATIONS ====================

  private async fetchCompetitorPrices(product: ScoutedProduct): Promise<CompetitorPrice[]> {
    await this.simulateAPICall();

    const competitors = ['Amazon', 'eBay', 'Walmart', 'Target', 'AliExpress'];
    const basePrice = product.suggestedPrice;

    return competitors.map((store) => {
      const variance = (Math.random() - 0.5) * 0.4; // ±20% variance
      const price = basePrice * (1 + variance);
      const shipping = Math.random() < 0.5 ? 0 : Math.floor(Math.random() * 10) + 3;

      return {
        store,
        price: Math.round(price * 100) / 100,
        shipping,
        totalPrice: Math.round((price + shipping) * 100) / 100,
        inStock: Math.random() > 0.2,
        lastUpdated: new Date(),
      };
    });
  }

  private generatePriceHistory(product: ScoutedProduct): PriceHistoryPoint[] {
    const history: PriceHistoryPoint[] = [];
    const basePrice = product.suggestedPrice;
    const now = new Date();

    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      const variance = (Math.random() - 0.5) * 0.2;
      const price = basePrice * (1 + variance);
      const sales = Math.floor(Math.random() * 50) + 10;

      history.push({
        date,
        price: Math.round(price * 100) / 100,
        sales,
      });
    }

    return history;
  }

  private calculateOptimalPrice(
    product: ScoutedProduct,
    competitors: CompetitorPrice[],
    strategy: PricingStrategy,
    targetMargin: number
  ): { recommended: number; range: { min: number; max: number } } {
    const costPrice = product.costPrice;
    const currentPrice = product.suggestedPrice;

    // Calculate minimum price based on target margin
    const minViablePrice = costPrice * (1 + targetMargin / 100);

    // Get competitor average
    const competitorAvg =
      competitors.length > 0
        ? competitors.reduce((acc, c) => acc + c.totalPrice, 0) / competitors.length
        : currentPrice;

    let recommendedPrice: number;

    switch (strategy) {
      case 'premium':
        // Price 15-25% above market average
        recommendedPrice = competitorAvg * (1.15 + Math.random() * 0.1);
        break;

      case 'competitive':
        // Price slightly below or at market average
        recommendedPrice = competitorAvg * (0.95 + Math.random() * 0.05);
        break;

      case 'value':
        // Price 10-20% below market average
        recommendedPrice = competitorAvg * (0.8 + Math.random() * 0.1);
        break;

      case 'penetration':
        // Aggressive low pricing for market entry
        recommendedPrice = Math.max(minViablePrice * 1.1, competitorAvg * 0.7);
        break;

      case 'skimming':
        // High initial price
        recommendedPrice = competitorAvg * 1.3;
        break;

      default:
        recommendedPrice = competitorAvg;
    }

    // Ensure minimum margin
    recommendedPrice = Math.max(recommendedPrice, minViablePrice);

    // Calculate price range
    const range = {
      min: Math.max(minViablePrice, recommendedPrice * 0.85),
      max: recommendedPrice * 1.25,
    };

    return {
      recommended: Math.round(recommendedPrice * 100) / 100,
      range: {
        min: Math.round(range.min * 100) / 100,
        max: Math.round(range.max * 100) / 100,
      },
    };
  }

  private generatePricingTiers(
    product: ScoutedProduct,
    optimalPrice: { recommended: number; range: { min: number; max: number } }
  ): PriceAnalysis['pricingTiers'] {
    return {
      economy: {
        price: optimalPrice.range.min,
        margin: this.calculateMargin(optimalPrice.range.min, product.costPrice),
        expectedSales: 'High volume, lower profit per unit',
      },
      standard: {
        price: optimalPrice.recommended,
        margin: this.calculateMargin(optimalPrice.recommended, product.costPrice),
        expectedSales: 'Balanced volume and profit',
      },
      premium: {
        price: optimalPrice.range.max,
        margin: this.calculateMargin(optimalPrice.range.max, product.costPrice),
        expectedSales: 'Lower volume, higher profit per unit',
      },
    };
  }

  private calculateProfitProjection(
    product: ScoutedProduct,
    optimalPrice: { recommended: number; range: { min: number; max: number } }
  ): PriceAnalysis['profitProjection'] {
    const dailySales = Math.floor(product.sold / 30) || 10;
    const profitPerUnit = optimalPrice.recommended - product.costPrice;

    return {
      daily: {
        sales: dailySales,
        revenue: dailySales * optimalPrice.recommended,
        profit: dailySales * profitPerUnit,
      },
      weekly: {
        sales: dailySales * 7,
        revenue: dailySales * 7 * optimalPrice.recommended,
        profit: dailySales * 7 * profitPerUnit,
      },
      monthly: {
        sales: dailySales * 30,
        revenue: dailySales * 30 * optimalPrice.recommended,
        profit: dailySales * 30 * profitPerUnit,
      },
    };
  }

  private calculateDynamicAdjustments(product: ScoutedProduct): PriceAnalysis['dynamicAdjustments'] {
    const adjustments: PriceAnalysis['dynamicAdjustments'] = [];

    for (const rule of this.dynamicRules.filter((r) => r.enabled)) {
      let applies = false;
      let reason = '';

      switch (rule.condition) {
        case 'stock_low':
          applies = Math.random() < 0.3;
          reason = 'Inventory running low - increase price to maximize profit';
          break;
        case 'competitor_undercut':
          applies = Math.random() < 0.4;
          reason = 'Competitor lowered price - adjust to stay competitive';
          break;
        case 'high_demand':
          applies = product.sold > 5000;
          reason = 'High demand detected - premium pricing opportunity';
          break;
        case 'seasonal':
          applies = this.isSeasonalPeak();
          reason = 'Seasonal demand increase - adjust pricing';
          break;
      }

      if (applies) {
        adjustments.push({
          rule: rule.name,
          adjustment: rule.adjustment,
          reason,
        });
      }
    }

    return adjustments;
  }

  private isSeasonalPeak(): boolean {
    const month = new Date().getMonth();
    // Q4 (Oct-Dec) and summer (Jun-Aug) are peak seasons
    return [5, 6, 7, 9, 10, 11].includes(month);
  }

  // ==================== HELPERS ====================

  private calculateMargin(sellingPrice: number, costPrice: number): number {
    return ((sellingPrice - costPrice) / sellingPrice) * 100;
  }

  private generateRecommendation(
    product: ScoutedProduct,
    optimalPrice: { recommended: number; range: { min: number; max: number } },
    competitors: CompetitorPrice[]
  ): string {
    const currentMargin = this.calculateMargin(product.suggestedPrice, product.costPrice);
    const optimalMargin = this.calculateMargin(optimalPrice.recommended, product.costPrice);
    const priceDiff = optimalPrice.recommended - product.suggestedPrice;

    let recommendation = '';

    if (Math.abs(priceDiff) < 1) {
      recommendation = `Current price is optimal. Maintain at $${product.suggestedPrice.toFixed(2)} for ${currentMargin.toFixed(1)}% margin.`;
    } else if (priceDiff > 0) {
      recommendation = `Increase price by $${priceDiff.toFixed(2)} to $${optimalPrice.recommended.toFixed(2)}. This improves margin from ${currentMargin.toFixed(1)}% to ${optimalMargin.toFixed(1)}%.`;
    } else {
      recommendation = `Consider reducing price by $${Math.abs(priceDiff).toFixed(2)} to $${optimalPrice.recommended.toFixed(2)} to stay competitive. New margin: ${optimalMargin.toFixed(1)}%.`;
    }

    if (competitors.length > 0) {
      const lowestCompetitor = competitors.reduce((min, c) =>
        c.totalPrice < min.totalPrice ? c : min
      );
      if (optimalPrice.recommended > lowestCompetitor.totalPrice * 1.1) {
        recommendation += ` Note: ${lowestCompetitor.store} offers lower price at $${lowestCompetitor.totalPrice.toFixed(2)}.`;
      }
    }

    return recommendation;
  }

  private calculateConfidence(
    competitors: CompetitorPrice[],
    priceHistory: PriceHistoryPoint[]
  ): number {
    let confidence = 70; // Base confidence

    // More competitor data = higher confidence
    if (competitors.length >= 5) confidence += 15;
    else if (competitors.length >= 3) confidence += 10;
    else if (competitors.length >= 1) confidence += 5;

    // Price stability in history = higher confidence
    if (priceHistory.length > 0) {
      const prices = priceHistory.map((p) => p.price);
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const variance =
        prices.reduce((acc, p) => acc + Math.pow(p - avgPrice, 2), 0) / prices.length;
      const stability = Math.max(0, 15 - variance);
      confidence += stability;
    }

    return Math.min(100, Math.max(0, confidence));
  }

  private async simulateAPICall(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 600));
  }

  // ==================== PUBLIC API ====================

  setDynamicRule(ruleId: string, enabled: boolean, adjustment?: number): void {
    const rule = this.dynamicRules.find((r) => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
      if (adjustment !== undefined) {
        rule.adjustment = adjustment;
      }
    }
  }

  getDynamicRules(): DynamicPricingRule[] {
    return [...this.dynamicRules];
  }

  addDynamicRule(rule: Omit<DynamicPricingRule, 'id'>): DynamicPricingRule {
    const newRule: DynamicPricingRule = {
      ...rule,
      id: `rule-custom-${Date.now()}`,
    };
    this.dynamicRules.push(newRule);
    return newRule;
  }
}

export default PriceOptimizerAgent;
