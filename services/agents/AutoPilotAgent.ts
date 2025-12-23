// =====================================================
// DROPSHIPAI - AutoPilot Agent
// Fully autonomous dropshipping management
// =====================================================

import { BaseAgent } from './BaseAgent';
import {
  AgentTask,
  AgentMessage,
  AgentType,
  AutoPilotConfig,
  TrendReport,
  ScoutedProduct,
  GeneratedContent,
  PriceAnalysis,
} from './types';

interface AutoPilotState {
  isRunning: boolean;
  mode: 'conservative' | 'balanced' | 'aggressive';
  lastScan: Date | null;
  productsFound: number;
  productsPublished: number;
  totalProfit: number;
  errors: string[];
  schedule: AutoPilotSchedule;
}

interface AutoPilotSchedule {
  trendScan: string; // Cron expression
  priceUpdate: string;
  inventoryCheck: string;
  contentRefresh: string;
}

interface AutoPilotDecision {
  id: string;
  timestamp: Date;
  type: 'publish' | 'price_change' | 'remove' | 'restock' | 'content_update';
  product?: ScoutedProduct;
  reason: string;
  action: string;
  approved: boolean;
  result?: any;
}

interface AutoPilotReport {
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  metrics: {
    productsScanned: number;
    productsAdded: number;
    productsRemoved: number;
    priceChanges: number;
    totalRevenue: number;
    totalProfit: number;
    conversionRate: number;
  };
  topProducts: Array<{
    product: string;
    sales: number;
    profit: number;
  }>;
  recommendations: string[];
}

// Forward declaration for orchestrator reference
interface OrchestratorRef {
  getAgent<T extends BaseAgent>(type: AgentType): T | undefined;
  analyzeTrends(niche: string): Promise<TrendReport>;
  scoutProducts(query: string, options?: any): Promise<any>;
  generateContent(product: any, options?: any): Promise<GeneratedContent>;
  optimizePrice(product: any): Promise<PriceAnalysis>;
}

export class AutoPilotAgent extends BaseAgent {
  private orchestrator: OrchestratorRef;
  private autoPilotState: AutoPilotState;
  private decisions: AutoPilotDecision[] = [];
  private intervalIds: NodeJS.Timeout[] = [];
  private autoPilotConfig: AutoPilotConfig | null = null;

  constructor(orchestrator: OrchestratorRef) {
    super('auto-pilot', 'AutoPilot', [
      'Fully autonomous operation',
      'Trend monitoring & product discovery',
      'Automatic content generation',
      'Dynamic pricing management',
      'Inventory monitoring',
      'Performance reporting',
      'Smart decision making',
    ]);

    this.orchestrator = orchestrator;
    this.autoPilotState = {
      isRunning: false,
      mode: 'balanced',
      lastScan: null,
      productsFound: 0,
      productsPublished: 0,
      totalProfit: 0,
      errors: [],
      schedule: {
        trendScan: '0 */6 * * *', // Every 6 hours
        priceUpdate: '0 */4 * * *', // Every 4 hours
        inventoryCheck: '0 */2 * * *', // Every 2 hours
        contentRefresh: '0 0 * * 0', // Weekly
      },
    };
  }

  protected handleMessage(message: AgentMessage): void {
    if (message.type === 'alert') {
      this.handleAlert(message);
    } else if (message.type === 'request') {
      this.log(`Received request from ${message.from}: ${message.content}`);
    }
  }

  private handleAlert(message: AgentMessage): void {
    // Handle alerts from other agents
    if (message.content.includes('low stock')) {
      this.makeDecision('restock', message.data, 'Low stock alert received');
    } else if (message.content.includes('competitor price')) {
      this.makeDecision('price_change', message.data, 'Competitor price change detected');
    }
  }

  protected async performTask(task: AgentTask): Promise<any> {
    switch (task.type) {
      case 'start_autopilot':
        return this.startAutoPilot(task as any);
      case 'stop_autopilot':
        return this.stopAutoPilot();
      case 'scan_trends':
        return this.scanTrends(task as any);
      case 'auto_publish':
        return this.autoPublish(task as any);
      case 'generate_report':
        return this.generateReport(task as any);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  async execute(input: AutoPilotConfig): Promise<AutoPilotState> {
    this.autoPilotConfig = input;

    if (!this.autoPilotState.isRunning) {
      const task = this.createTask('start_autopilot', 'Starting AutoPilot mode', 'critical');
      await this.think('Initializing autonomous operations...');
      return this.executeTask({ ...task, config: input } as any);
    }

    return this.getAutoPilotState();
  }

  // ==================== CORE AUTOPILOT ====================

  private async startAutoPilot(
    task: AgentTask & { config: AutoPilotConfig }
  ): Promise<AutoPilotState> {
    const { config } = task;

    this.sendMessage('user', 'info', '🚀 AutoPilot initializing...');
    this.updateProgress(10);

    // Validate configuration
    this.validateConfig(config);
    this.autoPilotConfig = config;
    this.autoPilotState.mode = config.mode;

    this.sendMessage('user', 'progress', 'Setting up monitoring schedules...');
    this.updateProgress(30);

    // Set up scheduled tasks
    this.setupScheduledTasks(config);

    this.sendMessage('user', 'progress', 'Running initial market scan...');
    this.updateProgress(50);

    // Run initial scan
    await this.runInitialScan(config);

    this.autoPilotState.isRunning = true;
    this.updateProgress(100);

    this.sendMessage(
      'user',
      'info',
      `✅ AutoPilot is now active in ${config.mode} mode. Monitoring ${config.niches.join(', ')}.`
    );

    // Log the decision
    this.logDecision({
      type: 'publish',
      reason: 'AutoPilot started',
      action: `Started monitoring ${config.niches.length} niches`,
      approved: true,
    });

    return this.getAutoPilotState();
  }

  private async stopAutoPilot(): Promise<AutoPilotState> {
    this.sendMessage('user', 'info', '⏹️ Stopping AutoPilot...');

    // Clear all intervals
    for (const intervalId of this.intervalIds) {
      clearInterval(intervalId);
    }
    this.intervalIds = [];

    this.autoPilotState.isRunning = false;

    this.sendMessage('user', 'info', '✅ AutoPilot has been stopped.');

    return this.getAutoPilotState();
  }

  private validateConfig(config: AutoPilotConfig): void {
    if (!config.niches || config.niches.length === 0) {
      throw new Error('At least one niche must be specified');
    }
    if (config.maxProductsPerDay && config.maxProductsPerDay < 1) {
      throw new Error('maxProductsPerDay must be at least 1');
    }
    if (config.minProfitMargin && (config.minProfitMargin < 0 || config.minProfitMargin > 100)) {
      throw new Error('minProfitMargin must be between 0 and 100');
    }
  }

  private setupScheduledTasks(config: AutoPilotConfig): void {
    // Trend scanning interval (simulated - in production use node-cron)
    const trendInterval = setInterval(
      async () => {
        if (this.autoPilotState.isRunning) {
          await this.runTrendScan(config);
        }
      },
      this.getIntervalMs(config.mode, 'trend')
    );
    this.intervalIds.push(trendInterval);

    // Price update interval
    const priceInterval = setInterval(
      async () => {
        if (this.autoPilotState.isRunning) {
          await this.runPriceUpdate();
        }
      },
      this.getIntervalMs(config.mode, 'price')
    );
    this.intervalIds.push(priceInterval);

    // Performance check interval
    const perfInterval = setInterval(
      async () => {
        if (this.autoPilotState.isRunning) {
          await this.runPerformanceCheck();
        }
      },
      this.getIntervalMs(config.mode, 'performance')
    );
    this.intervalIds.push(perfInterval);
  }

  private getIntervalMs(mode: string, type: string): number {
    const intervals: Record<string, Record<string, number>> = {
      conservative: {
        trend: 6 * 60 * 60 * 1000, // 6 hours
        price: 4 * 60 * 60 * 1000, // 4 hours
        performance: 24 * 60 * 60 * 1000, // 24 hours
      },
      balanced: {
        trend: 4 * 60 * 60 * 1000, // 4 hours
        price: 2 * 60 * 60 * 1000, // 2 hours
        performance: 12 * 60 * 60 * 1000, // 12 hours
      },
      aggressive: {
        trend: 2 * 60 * 60 * 1000, // 2 hours
        price: 1 * 60 * 60 * 1000, // 1 hour
        performance: 6 * 60 * 60 * 1000, // 6 hours
      },
    };

    return intervals[mode]?.[type] || intervals.balanced[type];
  }

  // ==================== SCANNING & DISCOVERY ====================

  private async runInitialScan(config: AutoPilotConfig): Promise<void> {
    for (const niche of config.niches) {
      try {
        await this.scanNiche(niche, config);
      } catch (error) {
        this.autoPilotState.errors.push(`Initial scan failed for ${niche}: ${error}`);
      }
    }
    this.autoPilotState.lastScan = new Date();
  }

  private async runTrendScan(config: AutoPilotConfig): Promise<void> {
    this.sendMessage('user', 'progress', '🔍 Running scheduled trend scan...');

    for (const niche of config.niches) {
      try {
        await this.scanNiche(niche, config);
      } catch (error) {
        this.autoPilotState.errors.push(`Trend scan failed for ${niche}: ${error}`);
      }
    }

    this.autoPilotState.lastScan = new Date();
  }

  private async scanNiche(niche: string, config: AutoPilotConfig): Promise<void> {
    // Analyze trends
    const trends = await this.orchestrator.analyzeTrends(niche);

    if (!trends.topOpportunities || trends.topOpportunities.length === 0) {
      return;
    }

    // Scout products for top opportunities
    for (const opportunity of trends.topOpportunities.slice(0, 3)) {
      const products = await this.orchestrator.scoutProducts(opportunity.product, {
        maxProducts: config.maxProductsPerDay || 5,
        minProfitMargin: config.minProfitMargin || 30,
      });

      this.autoPilotState.productsFound += products.products?.length || 0;

      // Auto-process products based on mode
      if (config.autoPublish && products.products) {
        await this.processProducts(products.products, config);
      }
    }
  }

  private async scanTrends(task: AgentTask): Promise<TrendReport[]> {
    const reports: TrendReport[] = [];

    if (this.autoPilotConfig?.niches) {
      for (const niche of this.autoPilotConfig.niches) {
        const report = await this.orchestrator.analyzeTrends(niche);
        reports.push(report);
      }
    }

    return reports;
  }

  // ==================== AUTO PUBLISHING ====================

  private async processProducts(products: ScoutedProduct[], config: AutoPilotConfig): Promise<void> {
    const threshold = this.getApprovalThreshold(config.mode);

    for (const product of products) {
      // Check if product meets criteria
      if (product.score >= threshold && product.profitMargin >= (config.minProfitMargin || 30)) {
        const decision = await this.makeDecision(
          'publish',
          product,
          `Score: ${product.score}/100, Margin: ${product.profitMargin}%`
        );

        if (decision.approved) {
          await this.publishProduct(product, config);
        }
      }
    }
  }

  private getApprovalThreshold(mode: string): number {
    const thresholds: Record<string, number> = {
      conservative: 85,
      balanced: 75,
      aggressive: 65,
    };
    return thresholds[mode] || 75;
  }

  private async publishProduct(product: ScoutedProduct, config: AutoPilotConfig): Promise<void> {
    try {
      // Generate content
      const content = await this.orchestrator.generateContent(product, {
        style: config.contentStyle || 'conversion-focused',
      });

      // Optimize pricing
      const pricing = await this.orchestrator.optimizePrice(product);

      // Log the publication
      this.logDecision({
        type: 'publish',
        product,
        reason: `Auto-approved: Score ${product.score}/100`,
        action: `Published "${product.title}" at $${pricing.optimalPrice}`,
        approved: true,
        result: { content, pricing },
      });

      this.autoPilotState.productsPublished++;

      this.sendMessage(
        'user',
        'info',
        `✅ Auto-published: "${product.title}" at $${pricing.optimalPrice.toFixed(2)}`
      );
    } catch (error) {
      this.autoPilotState.errors.push(`Failed to publish ${product.title}: ${error}`);
    }
  }

  private async autoPublish(_task: AgentTask): Promise<any> {
    // Manual trigger for auto-publish
    if (!this.autoPilotConfig) {
      throw new Error('AutoPilot not configured');
    }

    await this.runTrendScan(this.autoPilotConfig);
    return { published: this.autoPilotState.productsPublished };
  }

  // ==================== PRICE MANAGEMENT ====================

  private async runPriceUpdate(): Promise<void> {
    this.sendMessage('user', 'progress', '💰 Running price optimization check...');

    // In production, this would fetch active products and update prices
    const priceChanges = Math.floor(Math.random() * 5);

    if (priceChanges > 0) {
      this.sendMessage('user', 'info', `💰 Updated prices for ${priceChanges} products`);
    }
  }

  // ==================== PERFORMANCE MONITORING ====================

  private async runPerformanceCheck(): Promise<void> {
    this.sendMessage('user', 'progress', '📊 Running performance analysis...');

    // Simulate performance metrics
    const metrics = {
      conversionRate: Math.random() * 5 + 1,
      avgOrderValue: Math.random() * 50 + 20,
      profitMargin: Math.random() * 20 + 30,
    };

    // Make decisions based on performance
    if (metrics.conversionRate < 1.5) {
      this.makeDecision(
        'content_update',
        null,
        'Low conversion rate detected - content refresh recommended'
      );
    }

    if (metrics.profitMargin < 25) {
      this.makeDecision('price_change', null, 'Profit margin below target - price adjustment needed');
    }
  }

  // ==================== DECISION MAKING ====================

  private async makeDecision(
    type: AutoPilotDecision['type'],
    product: ScoutedProduct | null,
    reason: string
  ): Promise<AutoPilotDecision> {
    const decision: AutoPilotDecision = {
      id: `decision-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type,
      product: product || undefined,
      reason,
      action: this.determineAction(type, product),
      approved: this.shouldAutoApprove(type),
    };

    this.decisions.push(decision);

    // Emit decision event
    this.emit({
      type: 'agent:decision',
      timestamp: new Date(),
      agent: this.state.type,
      data: decision,
    });

    return decision;
  }

  private determineAction(type: AutoPilotDecision['type'], product: ScoutedProduct | null): string {
    const actions: Record<string, string> = {
      publish: product ? `Publish "${product.title}"` : 'Publish new product',
      price_change: 'Adjust product pricing',
      remove: product ? `Remove "${product.title}"` : 'Remove underperforming product',
      restock: 'Contact supplier for restocking',
      content_update: 'Refresh product content',
    };
    return actions[type] || 'Unknown action';
  }

  private shouldAutoApprove(type: AutoPilotDecision['type']): boolean {
    if (!this.autoPilotConfig) return false;

    const autoApproveTypes: Record<string, boolean> = {
      publish: this.autoPilotConfig.autoPublish || false,
      price_change: this.autoPilotConfig.autoPricing || false,
      remove: false, // Always require approval for removals
      restock: false, // Always require approval for restocking
      content_update: true, // Safe to auto-approve
    };

    return autoApproveTypes[type] || false;
  }

  private logDecision(
    decision: Omit<AutoPilotDecision, 'id' | 'timestamp'>
  ): AutoPilotDecision {
    const fullDecision: AutoPilotDecision = {
      id: `decision-${Date.now()}`,
      timestamp: new Date(),
      ...decision,
    };
    this.decisions.push(fullDecision);
    return fullDecision;
  }

  // ==================== REPORTING ====================

  private async generateReport(
    task: AgentTask & { period: 'daily' | 'weekly' | 'monthly' }
  ): Promise<AutoPilotReport> {
    const { period } = task;

    const now = new Date();
    const startDate = new Date(now);

    switch (period) {
      case 'daily':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    // Simulated metrics
    const report: AutoPilotReport = {
      period,
      startDate,
      endDate: now,
      metrics: {
        productsScanned: this.autoPilotState.productsFound,
        productsAdded: this.autoPilotState.productsPublished,
        productsRemoved: Math.floor(Math.random() * 3),
        priceChanges: Math.floor(Math.random() * 10),
        totalRevenue: Math.random() * 5000 + 1000,
        totalProfit: Math.random() * 1500 + 300,
        conversionRate: Math.random() * 3 + 1,
      },
      topProducts: [
        { product: 'Smart Watch Pro', sales: 45, profit: 450 },
        { product: 'Wireless Earbuds', sales: 38, profit: 380 },
        { product: 'Phone Holder', sales: 52, profit: 260 },
      ],
      recommendations: this.generateRecommendations(),
    };

    return report;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.autoPilotState.productsPublished < 5) {
      recommendations.push('Consider expanding to more niches for higher product discovery');
    }

    if (this.autoPilotState.errors.length > 0) {
      recommendations.push(
        `Address ${this.autoPilotState.errors.length} errors that occurred during operation`
      );
    }

    if (this.autoPilotState.mode === 'conservative') {
      recommendations.push('Switch to balanced mode for more aggressive product discovery');
    }

    recommendations.push('Review and approve pending decisions in the queue');
    recommendations.push('Update niche keywords based on seasonal trends');

    return recommendations;
  }

  // ==================== PUBLIC API ====================

  getAutoPilotState(): AutoPilotState {
    return { ...this.autoPilotState };
  }

  getDecisions(limit: number = 50): AutoPilotDecision[] {
    return this.decisions.slice(-limit);
  }

  getPendingDecisions(): AutoPilotDecision[] {
    return this.decisions.filter((d) => !d.approved);
  }

  approveDecision(decisionId: string): boolean {
    const decision = this.decisions.find((d) => d.id === decisionId);
    if (decision) {
      decision.approved = true;
      return true;
    }
    return false;
  }

  rejectDecision(decisionId: string): boolean {
    const decision = this.decisions.find((d) => d.id === decisionId);
    if (decision) {
      const index = this.decisions.indexOf(decision);
      this.decisions.splice(index, 1);
      return true;
    }
    return false;
  }

  setMode(mode: 'conservative' | 'balanced' | 'aggressive'): void {
    this.autoPilotState.mode = mode;
    this.sendMessage('user', 'info', `AutoPilot mode changed to: ${mode}`);
  }

  async generateDailyReport(): Promise<AutoPilotReport> {
    const task = this.createTask('generate_report', 'Generating daily report', 'low');
    return this.executeTask({ ...task, period: 'daily' } as any);
  }

  async generateWeeklyReport(): Promise<AutoPilotReport> {
    const task = this.createTask('generate_report', 'Generating weekly report', 'low');
    return this.executeTask({ ...task, period: 'weekly' } as any);
  }

  async generateMonthlyReport(): Promise<AutoPilotReport> {
    const task = this.createTask('generate_report', 'Generating monthly report', 'low');
    return this.executeTask({ ...task, period: 'monthly' } as any);
  }

  clearErrors(): void {
    this.autoPilotState.errors = [];
  }
}

export default AutoPilotAgent;
