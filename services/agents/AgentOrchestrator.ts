// =====================================================
// DROPSHIPAI - Agent Orchestrator
// Coordinates all AI agents and manages workflows
// =====================================================

import {
  AgentType,
  AgentState,
  AgentEvent,
  AgentEventHandler,
  Workflow,
  WorkflowStep,
  AgentMessage,
} from './types';
import { BaseAgent } from './BaseAgent';

// Import specialized agents
import { TrendHunterAgent } from './TrendHunterAgent';
import { ProductScoutAgent } from './ProductScoutAgent';
import { ContentMasterAgent } from './ContentMasterAgent';
import { PriceOptimizerAgent } from './PriceOptimizerAgent';
import { AutoPilotAgent } from './AutoPilotAgent';

export class AgentOrchestrator {
  private agents: Map<AgentType, BaseAgent> = new Map();
  private workflows: Map<string, Workflow> = new Map();
  private eventHandlers: AgentEventHandler[] = [];
  private messageQueue: AgentMessage[] = [];

  constructor() {
    this.initializeAgents();
    this.setupEventRouting();
  }

  // ==================== INITIALIZATION ====================

  private initializeAgents(): void {
    // Initialize all specialized agents
    this.agents.set('trend-hunter', new TrendHunterAgent());
    this.agents.set('product-scout', new ProductScoutAgent());
    this.agents.set('content-master', new ContentMasterAgent());
    this.agents.set('price-optimizer', new PriceOptimizerAgent());
    this.agents.set('auto-pilot', new AutoPilotAgent(this));

    console.log('🤖 Agent Orchestrator initialized with', this.agents.size, 'agents');
  }

  private setupEventRouting(): void {
    // Subscribe to all agent events and route them
    this.agents.forEach((agent, type) => {
      agent.on((event) => {
        // Forward to orchestrator event handlers
        this.emit(event);

        // Route messages between agents
        if (event.type === 'agent:message') {
          this.routeMessage(event.data as AgentMessage);
        }
      });
    });
  }

  // ==================== AGENT ACCESS ====================

  getAgent<T extends BaseAgent>(type: AgentType): T | undefined {
    return this.agents.get(type) as T | undefined;
  }

  getAllAgentStates(): AgentState[] {
    const states: AgentState[] = [];
    this.agents.forEach((agent) => {
      states.push(agent.getState());
    });
    return states;
  }

  // ==================== EVENT SYSTEM ====================

  on(handler: AgentEventHandler): () => void {
    this.eventHandlers.push(handler);
    return () => {
      this.eventHandlers = this.eventHandlers.filter((h) => h !== handler);
    };
  }

  private emit(event: AgentEvent): void {
    this.eventHandlers.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error('Orchestrator event handler error:', error);
      }
    });
  }

  // ==================== MESSAGE ROUTING ====================

  private routeMessage(message: AgentMessage): void {
    if (message.to === 'all') {
      // Broadcast to all agents
      this.agents.forEach((agent, type) => {
        if (type !== message.from) {
          agent.receiveMessage(message);
        }
      });
    } else if (message.to !== 'user') {
      // Route to specific agent
      const targetAgent = this.agents.get(message.to as AgentType);
      if (targetAgent) {
        targetAgent.receiveMessage(message);
      }
    }
    // Messages to 'user' are handled by UI through event system
  }

  sendToAgent(agentType: AgentType, message: string, data?: any): void {
    const msg: AgentMessage = {
      id: `msg-orch-${Date.now()}`,
      timestamp: new Date(),
      from: 'orchestrator',
      to: agentType,
      type: 'request',
      content: message,
      data,
    };
    this.routeMessage(msg);
  }

  // ==================== WORKFLOW MANAGEMENT ====================

  createWorkflow(name: string, description: string, steps: Omit<WorkflowStep, 'id' | 'status'>[]): Workflow {
    const workflow: Workflow = {
      id: `workflow-${Date.now()}`,
      name,
      description,
      steps: steps.map((step, index) => ({
        ...step,
        id: `step-${index}-${Date.now()}`,
        status: 'pending',
      })),
      status: 'idle',
      currentStep: 0,
    };

    this.workflows.set(workflow.id, workflow);
    return workflow;
  }

  async executeWorkflow(workflowId: string): Promise<any> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    workflow.status = 'running';
    workflow.startedAt = new Date();

    this.emit({
      type: 'workflow:started',
      timestamp: new Date(),
      data: { workflowId, name: workflow.name },
    });

    let lastOutput: any = null;

    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      workflow.currentStep = i;

      try {
        step.status = 'running';
        const agent = this.agents.get(step.agent);

        if (!agent) {
          throw new Error(`Agent ${step.agent} not found`);
        }

        // Pass previous step output as input if available
        const input = step.input || lastOutput;
        const output = await agent.execute(input);

        step.output = output;
        step.status = 'completed';
        lastOutput = output;

        this.emit({
          type: 'workflow:step_completed',
          timestamp: new Date(),
          data: { workflowId, stepId: step.id, stepIndex: i, output },
        });
      } catch (error) {
        step.status = 'failed';
        workflow.status = 'failed';

        throw error;
      }
    }

    workflow.status = 'completed';
    workflow.completedAt = new Date();
    workflow.result = lastOutput;

    this.emit({
      type: 'workflow:completed',
      timestamp: new Date(),
      data: { workflowId, result: lastOutput },
    });

    return lastOutput;
  }

  // ==================== PREDEFINED WORKFLOWS ====================

  /**
   * Complete product discovery workflow:
   * 1. Find trends in niche
   * 2. Scout products based on trends
   * 3. Generate content for top products
   * 4. Optimize pricing
   */
  async runProductDiscoveryWorkflow(niche: string, options?: {
    maxProducts?: number;
    minProfitMargin?: number;
    autoPublish?: boolean;
  }): Promise<any> {
    const workflow = this.createWorkflow(
      'Product Discovery',
      `Discover trending products in ${niche}`,
      [
        {
          agent: 'trend-hunter',
          action: 'analyzeTrends',
          input: { niche, depth: 'comprehensive' },
        },
        {
          agent: 'product-scout',
          action: 'scoutProducts',
          input: { maxProducts: options?.maxProducts || 10 },
        },
        {
          agent: 'content-master',
          action: 'generateContent',
          input: { style: 'premium', languages: ['en'] },
        },
        {
          agent: 'price-optimizer',
          action: 'optimizePricing',
          input: { strategy: 'competitive', minMargin: options?.minProfitMargin || 30 },
        },
      ]
    );

    return this.executeWorkflow(workflow.id);
  }

  /**
   * Quick product import workflow:
   * 1. Scout specific product
   * 2. Generate content
   * 3. Set competitive price
   */
  async runQuickImportWorkflow(productUrl: string): Promise<any> {
    const workflow = this.createWorkflow(
      'Quick Import',
      `Import product from ${productUrl}`,
      [
        {
          agent: 'product-scout',
          action: 'importProduct',
          input: { url: productUrl },
        },
        {
          agent: 'content-master',
          action: 'generateContent',
          input: { style: 'conversion-focused' },
        },
        {
          agent: 'price-optimizer',
          action: 'suggestPrice',
          input: { strategy: 'competitive' },
        },
      ]
    );

    return this.executeWorkflow(workflow.id);
  }

  /**
   * Competitor analysis workflow:
   * 1. Identify competitors
   * 2. Analyze their pricing
   * 3. Find gaps and opportunities
   */
  async runCompetitorAnalysisWorkflow(niche: string): Promise<any> {
    const workflow = this.createWorkflow(
      'Competitor Analysis',
      `Analyze competitors in ${niche}`,
      [
        {
          agent: 'trend-hunter',
          action: 'findCompetitors',
          input: { niche },
        },
        {
          agent: 'price-optimizer',
          action: 'analyzeCompetitorPricing',
        },
        {
          agent: 'content-master',
          action: 'generateCompetitiveAnalysis',
        },
      ]
    );

    return this.executeWorkflow(workflow.id);
  }

  // ==================== DIRECT AGENT EXECUTION ====================

  async analyzeTrends(niche: string): Promise<any> {
    const agent = this.getAgent<TrendHunterAgent>('trend-hunter');
    if (!agent) throw new Error('TrendHunter agent not available');
    return agent.execute({ niche, depth: 'comprehensive' });
  }

  async scoutProducts(query: string, options?: any): Promise<any> {
    const agent = this.getAgent<ProductScoutAgent>('product-scout');
    if (!agent) throw new Error('ProductScout agent not available');
    return agent.execute({ query, ...options });
  }

  async generateContent(product: any, options?: any): Promise<any> {
    const agent = this.getAgent<ContentMasterAgent>('content-master');
    if (!agent) throw new Error('ContentMaster agent not available');
    return agent.execute({ product, ...options });
  }

  async optimizePrice(product: any): Promise<any> {
    const agent = this.getAgent<PriceOptimizerAgent>('price-optimizer');
    if (!agent) throw new Error('PriceOptimizer agent not available');
    return agent.execute(product);
  }

  async startAutoPilot(config: any): Promise<any> {
    const agent = this.getAgent<AutoPilotAgent>('auto-pilot');
    if (!agent) throw new Error('AutoPilot agent not available');
    return agent.execute(config);
  }

  async stopAutoPilot(): Promise<void> {
    const agent = this.getAgent<AutoPilotAgent>('auto-pilot');
    if (agent) {
      agent.stop();
    }
  }

  // ==================== LIFECYCLE ====================

  async startAll(): Promise<void> {
    console.log('🚀 Starting all agents...');
    for (const [type, agent] of this.agents) {
      await agent.start();
      console.log(`  ✓ ${type} agent started`);
    }
  }

  async stopAll(): Promise<void> {
    console.log('🛑 Stopping all agents...');
    for (const [type, agent] of this.agents) {
      await agent.stop();
      console.log(`  ✓ ${type} agent stopped`);
    }
  }
}

// Singleton instance
export const orchestrator = new AgentOrchestrator();
export default AgentOrchestrator;
