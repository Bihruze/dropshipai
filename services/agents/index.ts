// =====================================================
// DROPSHIPAI - Multi-Agent System Index
// =====================================================

// Core exports
export { BaseAgent } from './BaseAgent';
export { AgentOrchestrator } from './AgentOrchestrator';
export { orchestrator } from './AgentOrchestrator';

// Specialized agents
export { TrendHunterAgent } from './TrendHunterAgent';
export { ProductScoutAgent } from './ProductScoutAgent';
export { ContentMasterAgent } from './ContentMasterAgent';
export { PriceOptimizerAgent } from './PriceOptimizerAgent';
export { AutoPilotAgent } from './AutoPilotAgent';

// Types
export * from './types';

// Re-export orchestrator as default
import { orchestrator as defaultOrchestrator } from './AgentOrchestrator';
export default defaultOrchestrator;
