import { useState, useEffect, useCallback, useMemo } from 'react';
import { agentApi } from '../services/agentApiClient';
import { AgentOrchestrator, orchestrator as defaultOrchestrator } from '../services/agents';
import {
  AgentState,
  AgentEvent,
  AgentMessage,
  AgentType,
  TrendReport,
  ProductScoutResult,
  GeneratedContent,
  PriceAnalysis,
  AutoPilotConfig,
} from '../services/agents/types';

// API kullanılabilirlik durumu
interface ApiStatus {
  available: boolean;
  message: string;
  totalCost: string;
  requestCount: number;
}

interface UseAgentsOptions {
  orchestrator?: AgentOrchestrator;
  autoStart?: boolean;
  useRealApi?: boolean; // Gerçek Claude API kullan
}

interface UseAgentsReturn {
  // State
  agents: AgentState[];
  events: AgentEvent[];
  messages: AgentMessage[];
  isLoading: boolean;
  error: string | null;
  autoPilotActive: boolean;
  apiStatus: ApiStatus | null;

  // Actions
  analyzeTrends: (niche: string) => Promise<TrendReport>;
  scoutProducts: (query: string, options?: any) => Promise<ProductScoutResult>;
  generateContent: (product: any, options?: any) => Promise<GeneratedContent>;
  optimizePrice: (product: any) => Promise<PriceAnalysis>;
  runProductDiscovery: (niche: string, options?: any) => Promise<any>;
  runQuickImport: (productUrl: string) => Promise<any>;
  runCompetitorAnalysis: (niche: string) => Promise<any>;

  // AutoPilot
  startAutoPilot: (config: AutoPilotConfig) => Promise<void>;
  stopAutoPilot: () => Promise<void>;

  // Agent Control
  pauseAgent: (agentType: AgentType) => void;
  resumeAgent: (agentType: AgentType) => void;
  getAgentState: (agentType: AgentType) => AgentState | undefined;

  // Utilities
  clearEvents: () => void;
  clearMessages: () => void;
  clearError: () => void;
}

export function useAgents(options: UseAgentsOptions = {}): UseAgentsReturn {
  const { orchestrator = defaultOrchestrator, autoStart = true, useRealApi = true } = options;

  const [agents, setAgents] = useState<AgentState[]>([]);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoPilotActive, setAutoPilotActive] = useState(false);
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);

  // Check API status on mount
  useEffect(() => {
    if (useRealApi) {
      agentApi.getStatus().then((response) => {
        if (response.success && response.data) {
          setApiStatus({
            available: response.data.available,
            message: response.data.message,
            totalCost: response.data.stats.totalCost,
            requestCount: response.data.stats.requestCount,
          });
        }
      }).catch(() => {
        setApiStatus({
          available: false,
          message: 'API not reachable',
          totalCost: '$0',
          requestCount: 0,
        });
      });
    }
  }, [useRealApi]);

  // Subscribe to orchestrator events
  useEffect(() => {
    const unsubscribe = orchestrator.on((event: AgentEvent) => {
      // Add event to list
      setEvents((prev) => [...prev.slice(-99), event]);

      // Extract messages
      if (event.type === 'agent:message') {
        setMessages((prev) => [...prev.slice(-49), event.data as AgentMessage]);
      }

      // Update agent states
      setAgents(orchestrator.getAllAgentStates());

      // Handle errors
      if (event.type === 'agent:task_failed') {
        setError(event.data?.error || 'An error occurred');
      }
    });

    // Auto-start agents
    if (autoStart) {
      orchestrator.startAll().then(() => {
        setAgents(orchestrator.getAllAgentStates());
      });
    }

    return () => {
      unsubscribe();
    };
  }, [orchestrator, autoStart]);

  // Analyze trends - uses real API if available
  const analyzeTrends = useCallback(
    async (niche: string): Promise<TrendReport> => {
      setIsLoading(true);
      setError(null);
      try {
        // Try real API first
        if (useRealApi && apiStatus?.available) {
          const response = await agentApi.analyzeTrends(niche, 'comprehensive');
          if (response.success && response.data) {
            return {
              generatedAt: new Date(response.data.generatedAt),
              niche: response.data.niche,
              trends: response.data.trends,
              insights: response.data.insights,
              recommendations: response.data.recommendations,
              topOpportunities: response.data.topOpportunities,
            };
          }
        }
        // Fallback to local orchestrator
        const result = await orchestrator.analyzeTrends(niche);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to analyze trends';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [orchestrator, useRealApi, apiStatus]
  );

  // Scout products
  const scoutProducts = useCallback(
    async (query: string, options?: any): Promise<ProductScoutResult> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await orchestrator.scoutProducts(query, options);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to scout products';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [orchestrator]
  );

  // Generate content
  const generateContent = useCallback(
    async (product: any, options?: any): Promise<GeneratedContent> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await orchestrator.generateContent(product, options);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to generate content';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [orchestrator]
  );

  // Optimize price
  const optimizePrice = useCallback(
    async (product: any): Promise<PriceAnalysis> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await orchestrator.optimizePrice(product);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to optimize price';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [orchestrator]
  );

  // Run product discovery workflow
  const runProductDiscovery = useCallback(
    async (niche: string, options?: any): Promise<any> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await orchestrator.runProductDiscoveryWorkflow(niche, options);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Product discovery failed';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [orchestrator]
  );

  // Run quick import workflow
  const runQuickImport = useCallback(
    async (productUrl: string): Promise<any> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await orchestrator.runQuickImportWorkflow(productUrl);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Quick import failed';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [orchestrator]
  );

  // Run competitor analysis workflow
  const runCompetitorAnalysis = useCallback(
    async (niche: string): Promise<any> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await orchestrator.runCompetitorAnalysisWorkflow(niche);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Competitor analysis failed';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [orchestrator]
  );

  // Start AutoPilot
  const startAutoPilot = useCallback(
    async (config: AutoPilotConfig): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        await orchestrator.startAutoPilot(config);
        setAutoPilotActive(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to start AutoPilot';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [orchestrator]
  );

  // Stop AutoPilot
  const stopAutoPilot = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await orchestrator.stopAutoPilot();
      setAutoPilotActive(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to stop AutoPilot';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [orchestrator]);

  // Pause agent
  const pauseAgent = useCallback(
    (agentType: AgentType): void => {
      const agent = orchestrator.getAgent(agentType);
      if (agent) {
        agent.pause();
        setAgents(orchestrator.getAllAgentStates());
      }
    },
    [orchestrator]
  );

  // Resume agent
  const resumeAgent = useCallback(
    (agentType: AgentType): void => {
      const agent = orchestrator.getAgent(agentType);
      if (agent) {
        agent.resume();
        setAgents(orchestrator.getAllAgentStates());
      }
    },
    [orchestrator]
  );

  // Get agent state
  const getAgentState = useCallback(
    (agentType: AgentType): AgentState | undefined => {
      return agents.find((a) => a.type === agentType);
    },
    [agents]
  );

  // Clear events
  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    agents,
    events,
    messages,
    isLoading,
    error,
    autoPilotActive,
    apiStatus,

    // Actions
    analyzeTrends,
    scoutProducts,
    generateContent,
    optimizePrice,
    runProductDiscovery,
    runQuickImport,
    runCompetitorAnalysis,

    // AutoPilot
    startAutoPilot,
    stopAutoPilot,

    // Agent Control
    pauseAgent,
    resumeAgent,
    getAgentState,

    // Utilities
    clearEvents,
    clearMessages,
    clearError,
  };
}

// Hook for individual agent
export function useAgent(agentType: AgentType) {
  const { agents, pauseAgent, resumeAgent, getAgentState } = useAgents({ autoStart: false });

  const agent = useMemo(() => getAgentState(agentType), [agentType, getAgentState]);

  return {
    agent,
    pause: () => pauseAgent(agentType),
    resume: () => resumeAgent(agentType),
    isIdle: agent?.status === 'idle',
    isWorking: agent?.status === 'working' || agent?.status === 'thinking',
    hasError: agent?.status === 'error',
    isPaused: agent?.status === 'paused',
  };
}

// Hook for AutoPilot
export function useAutoPilot() {
  const { autoPilotActive, startAutoPilot, stopAutoPilot, isLoading, error } = useAgents({
    autoStart: false,
  });

  const toggle = useCallback(
    async (config?: AutoPilotConfig) => {
      if (autoPilotActive) {
        await stopAutoPilot();
      } else if (config) {
        await startAutoPilot(config);
      }
    },
    [autoPilotActive, startAutoPilot, stopAutoPilot]
  );

  return {
    isActive: autoPilotActive,
    isLoading,
    error,
    start: startAutoPilot,
    stop: stopAutoPilot,
    toggle,
  };
}

export default useAgents;
