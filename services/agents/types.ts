// =====================================================
// DROPSHIPAI MULTI-AGENT SYSTEM - Type Definitions
// =====================================================

export type AgentStatus = 'idle' | 'thinking' | 'working' | 'completed' | 'error' | 'paused';

export type AgentType =
  | 'orchestrator'
  | 'trend-hunter'
  | 'product-scout'
  | 'content-master'
  | 'price-optimizer'
  | 'competitor-spy'
  | 'auto-pilot';

export interface AgentMessage {
  id: string;
  timestamp: Date;
  from: AgentType | 'orchestrator';
  to: AgentType | 'user' | 'all';
  type: 'info' | 'request' | 'response' | 'error' | 'progress' | 'alert';
  content: string;
  data?: any;
}

export interface AgentTask {
  id: string;
  type: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number; // 0-100
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
}

export interface AgentState {
  id: string;
  type: AgentType;
  name: string;
  status: AgentStatus;
  currentTask?: AgentTask;
  taskHistory: AgentTask[];
  messages: AgentMessage[];
  capabilities: string[];
  stats: {
    tasksCompleted: number;
    tasksFailed: number;
    avgTaskTime: number;
    successRate: number;
  };
}

export interface AgentConfig {
  enabled: boolean;
  autoStart: boolean;
  maxConcurrentTasks: number;
  retryAttempts: number;
  timeout: number; // ms
  customPrompt?: string;
}

// ==================== AGENT-SPECIFIC TYPES ====================

// TrendHunter Agent
export interface TrendData {
  keyword: string;
  searchVolume: number;
  growthRate: number; // percentage
  competition: 'low' | 'medium' | 'high';
  seasonality: string[];
  relatedKeywords?: string[]; // Optional - not always returned by API
  score: number; // 0-100
}

export interface TrendReport {
  generatedAt: Date;
  niche: string;
  trends: TrendData[];
  insights: string[];
  recommendations: string[];
  topOpportunities: {
    product: string;
    reason: string;
    potentialProfit: number;
    riskLevel: 'low' | 'medium' | 'high';
  }[];
}

// ProductScout Agent
export interface ScoutedProduct {
  id: string;
  title: string;
  description: string;
  images: string[];
  sourceUrl: string;
  supplier: string;
  costPrice: number;
  suggestedPrice: number;
  profitMargin: number;
  rating: number;
  reviews: number;
  sold: number;
  shippingTime: string;
  variants: string[];
  score: number; // AI calculated score 0-100
  pros: string[];
  cons: string[];
  competitorCount: number;
}

export interface ProductScoutResult {
  query: string;
  totalFound: number;
  products: ScoutedProduct[];
  filters: {
    minProfit?: number;
    maxPrice?: number;
    minRating?: number;
  };
  summary: string;
}

// ContentMaster Agent
export interface GeneratedContent {
  productId: string;
  title: {
    original: string;
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
  emailTemplate: string;
  translations?: {
    [lang: string]: {
      title: string;
      description: string;
    };
  };
}

// PriceOptimizer Agent
export type PricingStrategy = 'premium' | 'competitive' | 'value' | 'penetration' | 'skimming';

export interface PriceAnalysis {
  productId: string;
  currentPrice: number;
  costPrice: number;
  optimalPrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  competitorPrices: {
    store: string;
    price: number;
  }[];
  margin: {
    current: number;
    optimal: number;
    minimum: number;
    maximum: number;
  };
  recommendation: string;
  confidence: number;
  pricingTiers: {
    economy: { price: number; margin: number; expectedSales: string };
    standard: { price: number; margin: number; expectedSales: string };
    premium: { price: number; margin: number; expectedSales: string };
  };
  profitProjection: {
    daily: { sales: number; revenue: number; profit: number };
    weekly: { sales: number; revenue: number; profit: number };
    monthly: { sales: number; revenue: number; profit: number };
  };
  dynamicAdjustments: Array<{
    rule: string;
    adjustment: number;
    reason: string;
  }>;
}

// CompetitorSpy Agent
export interface CompetitorData {
  name: string;
  url: string;
  products: {
    title: string;
    price: number;
    url: string;
  }[];
  priceRange: { min: number; max: number; avg: number };
  strengths: string[];
  weaknesses: string[];
  marketShare: number; // estimated
}

export interface CompetitorReport {
  generatedAt: Date;
  niche: string;
  competitors: CompetitorData[];
  marketOverview: string;
  opportunities: string[];
  threats: string[];
  recommendations: string[];
}

// AutoPilot Agent
export interface AutoPilotConfig {
  enabled?: boolean;
  mode: 'conservative' | 'balanced' | 'aggressive';
  niches: string[];
  maxProductsPerDay?: number;
  minProfitMargin?: number;
  minProductScore?: number;
  autoPublish?: boolean;
  autoPricing?: boolean;
  contentStyle?: 'premium' | 'value' | 'conversion-focused';
  dailyBudget?: number;
  excludeKeywords?: string[];
  notifications?: {
    onProductFound: boolean;
    onProductAdded: boolean;
    onPriceChange: boolean;
    dailySummary: boolean;
  };
}

export interface AutoPilotSession {
  id: string;
  startedAt: Date;
  endedAt?: Date;
  status: 'running' | 'paused' | 'completed' | 'error';
  config: AutoPilotConfig;
  stats: {
    productsScanned: number;
    productsAdded: number;
    productsSkipped: number;
    totalProfit: number;
    errors: number;
  };
  actions: {
    timestamp: Date;
    type: string;
    description: string;
    result: 'success' | 'failure';
  }[];
}

// Workflow Types
export interface WorkflowStep {
  id: string;
  agent: AgentType;
  action: string;
  input?: any;
  output?: any;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  duration?: number;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  status: 'idle' | 'running' | 'completed' | 'failed' | 'paused';
  currentStep: number;
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
}

// Event Types for real-time updates
export type AgentEventType =
  | 'agent:status_changed'
  | 'agent:task_started'
  | 'agent:task_progress'
  | 'agent:task_completed'
  | 'agent:task_failed'
  | 'agent:message'
  | 'agent:decision'
  | 'workflow:started'
  | 'workflow:step_completed'
  | 'workflow:completed'
  | 'autopilot:product_found'
  | 'autopilot:product_added';

export interface AgentEvent {
  type: AgentEventType;
  timestamp: Date;
  agent?: AgentType;
  data: any;
}

export type AgentEventHandler = (event: AgentEvent) => void;
