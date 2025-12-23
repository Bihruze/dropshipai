import React, { useState, useEffect, useCallback } from 'react';
import {
  Bot,
  Brain,
  TrendingUp,
  Search,
  FileText,
  DollarSign,
  Zap,
  Play,
  Pause,
  Settings,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  ChevronRight,
  RefreshCw,
  BarChart3,
  Target,
  Sparkles,
} from 'lucide-react';
import { AgentOrchestrator } from '../services/agents/AgentOrchestrator';
import {
  AgentState,
  AgentEvent,
  AgentMessage,
  TrendReport,
  ProductScoutResult,
  AutoPilotConfig,
} from '../services/agents/types';

// Initialize orchestrator
const orchestrator = new AgentOrchestrator();

interface AgentCardProps {
  agent: AgentState;
  onAction: (agentType: string, action: string) => void;
}

const statusColors: Record<string, string> = {
  idle: 'bg-gray-500',
  thinking: 'bg-yellow-500 animate-pulse',
  working: 'bg-blue-500 animate-pulse',
  completed: 'bg-green-500',
  error: 'bg-red-500',
  paused: 'bg-orange-500',
};

const statusLabels: Record<string, string> = {
  idle: 'Hazır',
  thinking: 'Düşünüyor...',
  working: 'Çalışıyor...',
  completed: 'Tamamlandı',
  error: 'Hata',
  paused: 'Duraklatıldı',
};

const agentIcons: Record<string, React.ReactNode> = {
  'trend-hunter': <TrendingUp className="w-6 h-6" />,
  'product-scout': <Search className="w-6 h-6" />,
  'content-master': <FileText className="w-6 h-6" />,
  'price-optimizer': <DollarSign className="w-6 h-6" />,
  'auto-pilot': <Zap className="w-6 h-6" />,
};

const AgentCard: React.FC<AgentCardProps> = ({ agent, onAction }) => {
  const icon = agentIcons[agent.type] || <Bot className="w-6 h-6" />;
  const statusColor = statusColors[agent.status] || 'bg-gray-500';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white">
            {icon}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">{agent.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${statusColor}`} />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {statusLabels[agent.status]}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {agent.status === 'paused' ? (
            <button
              onClick={() => onAction(agent.type, 'resume')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Devam Et"
            >
              <Play className="w-4 h-4 text-green-500" />
            </button>
          ) : agent.status === 'working' || agent.status === 'thinking' ? (
            <button
              onClick={() => onAction(agent.type, 'pause')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Duraklat"
            >
              <Pause className="w-4 h-4 text-orange-500" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Progress bar */}
      {agent.currentTask && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400 truncate max-w-[200px]">
              {agent.currentTask.description}
            </span>
            <span className="text-indigo-600 dark:text-indigo-400 font-medium">
              {agent.currentTask.progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${agent.currentTask.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Capabilities */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
          Yetenekler
        </h4>
        <div className="flex flex-wrap gap-1">
          {agent.capabilities.slice(0, 3).map((cap, i) => (
            <span
              key={i}
              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full"
            >
              {cap}
            </span>
          ))}
          {agent.capabilities.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 text-xs rounded-full">
              +{agent.capabilities.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {agent.stats.tasksCompleted}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Tamamlanan</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-500">
            {agent.stats.successRate.toFixed(0)}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Başarı</div>
        </div>
      </div>
    </div>
  );
};

const AgentDashboard: React.FC = () => {
  const [agents, setAgents] = useState<AgentState[]>([]);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [autoPilotActive, setAutoPilotActive] = useState(false);
  const [selectedNiche, setSelectedNiche] = useState('electronics');
  const [isLoading, setIsLoading] = useState(false);
  const [activeWorkflow, setActiveWorkflow] = useState<string | null>(null);
  const [workflowResult, setWorkflowResult] = useState<any>(null);

  // AutoPilot config
  const [autoPilotConfig, setAutoPilotConfig] = useState<AutoPilotConfig>({
    mode: 'balanced',
    niches: ['electronics', 'home decor'],
    maxProductsPerDay: 10,
    minProfitMargin: 30,
    autoPublish: false,
    autoPricing: true,
  });

  // Subscribe to orchestrator events
  useEffect(() => {
    const unsubscribe = orchestrator.on((event: AgentEvent) => {
      setEvents((prev) => [...prev.slice(-49), event]);

      if (event.type === 'agent:message') {
        setMessages((prev) => [...prev.slice(-29), event.data as AgentMessage]);
      }

      // Update agent states
      setAgents(orchestrator.getAllAgentStates());
    });

    // Initialize agents
    orchestrator.startAll().then(() => {
      setAgents(orchestrator.getAllAgentStates());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleAgentAction = useCallback((agentType: string, action: string) => {
    const agent = orchestrator.getAgent(agentType as any);
    if (!agent) return;

    switch (action) {
      case 'pause':
        agent.pause();
        break;
      case 'resume':
        agent.resume();
        break;
    }

    setAgents(orchestrator.getAllAgentStates());
  }, []);

  const runTrendAnalysis = async () => {
    setIsLoading(true);
    setActiveWorkflow('trend-analysis');
    try {
      const result = await orchestrator.analyzeTrends(selectedNiche);
      setWorkflowResult(result);
    } catch (error) {
      console.error('Trend analysis failed:', error);
    }
    setIsLoading(false);
    setActiveWorkflow(null);
  };

  const runProductDiscovery = async () => {
    setIsLoading(true);
    setActiveWorkflow('product-discovery');
    try {
      const result = await orchestrator.runProductDiscoveryWorkflow(selectedNiche, {
        maxProducts: 10,
        minProfitMargin: 30,
      });
      setWorkflowResult(result);
    } catch (error) {
      console.error('Product discovery failed:', error);
    }
    setIsLoading(false);
    setActiveWorkflow(null);
  };

  const toggleAutoPilot = async () => {
    if (autoPilotActive) {
      await orchestrator.stopAutoPilot();
      setAutoPilotActive(false);
    } else {
      await orchestrator.startAutoPilot(autoPilotConfig);
      setAutoPilotActive(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Brain className="w-8 h-8 text-indigo-500" />
              AI Agent Kontrol Merkezi
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Tüm AI agent'larınızı tek bir yerden yönetin
            </p>
          </div>

          {/* AutoPilot Toggle */}
          <div className="flex items-center gap-4">
            <select
              value={selectedNiche}
              onChange={(e) => setSelectedNiche(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200"
            >
              <option value="electronics">Elektronik</option>
              <option value="home decor">Ev Dekorasyonu</option>
              <option value="beauty">Güzellik</option>
              <option value="fitness">Fitness</option>
              <option value="pet supplies">Evcil Hayvan</option>
            </select>

            <button
              onClick={toggleAutoPilot}
              className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all ${
                autoPilotActive
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white'
              }`}
            >
              <Zap className={`w-5 h-5 ${autoPilotActive ? 'animate-pulse' : ''}`} />
              {autoPilotActive ? 'AutoPilot Durdur' : 'AutoPilot Başlat'}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button
          onClick={runTrendAnalysis}
          disabled={isLoading}
          className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all flex items-center gap-4 disabled:opacity-50"
        >
          <div className="p-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl text-white">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-900 dark:text-white">Trend Analizi</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedNiche} trendlerini analiz et
            </p>
          </div>
          {activeWorkflow === 'trend-analysis' && (
            <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin ml-auto" />
          )}
        </button>

        <button
          onClick={runProductDiscovery}
          disabled={isLoading}
          className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all flex items-center gap-4 disabled:opacity-50"
        >
          <div className="p-3 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl text-white">
            <Search className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-900 dark:text-white">Ürün Keşfi</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tam workflow çalıştır
            </p>
          </div>
          {activeWorkflow === 'product-discovery' && (
            <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin ml-auto" />
          )}
        </button>

        <button
          onClick={() => setWorkflowResult(null)}
          className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all flex items-center gap-4"
        >
          <div className="p-3 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl text-white">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-900 dark:text-white">Rakip Analizi</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Rakipleri incele
            </p>
          </div>
        </button>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} onAction={handleAgentAction} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              Aktivite Akışı
            </h2>
            <span className="text-sm text-gray-500">{events.length} olay</span>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {events.slice().reverse().map((event, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div
                  className={`p-2 rounded-lg ${
                    event.type.includes('completed')
                      ? 'bg-green-100 text-green-600'
                      : event.type.includes('failed')
                      ? 'bg-red-100 text-red-600'
                      : event.type.includes('started')
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {event.type.includes('completed') ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : event.type.includes('failed') ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : event.type.includes('message') ? (
                    <MessageSquare className="w-4 h-4" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                      {event.agent || 'System'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {typeof event.data === 'object'
                      ? event.data.content || event.data.description || event.type
                      : event.type}
                  </p>
                </div>
              </div>
            ))}

            {events.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Henüz aktivite yok. Bir workflow başlatın!
              </div>
            )}
          </div>
        </div>

        {/* Messages & Results Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-indigo-500" />
            Agent Mesajları
          </h2>

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {messages.slice().reverse().map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg ${
                  msg.type === 'error'
                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                    : msg.type === 'progress'
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                    : 'bg-gray-50 dark:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-indigo-600 dark:text-indigo-400">
                    {msg.from}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-sm text-gray-600 dark:text-gray-300">
                    {msg.to}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{msg.content}</p>
              </div>
            ))}

            {messages.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Agent mesajları burada görünecek
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Modal */}
      {workflowResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-indigo-500" />
                  Workflow Sonuçları
                </h2>
                <button
                  onClick={() => setWorkflowResult(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Trend Report */}
              {workflowResult.trends && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Trend Analizi: {workflowResult.niche}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {workflowResult.trends.slice(0, 6).map((trend: any, i: number) => (
                        <div
                          key={i}
                          className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {trend.keyword}
                            </span>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                trend.growthRate > 50
                                  ? 'bg-green-100 text-green-700'
                                  : trend.growthRate > 0
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {trend.growthRate > 0 ? '+' : ''}
                              {trend.growthRate}%
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Hacim: {trend.searchVolume.toLocaleString()}</span>
                            <span>Rekabet: {trend.competition}</span>
                          </div>
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div
                                className="bg-indigo-500 h-2 rounded-full"
                                style={{ width: `${trend.score}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">
                              Skor: {trend.score}/100
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Insights */}
                  {workflowResult.insights && (
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                        Öngörüler
                      </h3>
                      <ul className="space-y-2">
                        {workflowResult.insights.map((insight: string, i: number) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-gray-600 dark:text-gray-300"
                          >
                            <Target className="w-4 h-4 text-indigo-500 mt-1 flex-shrink-0" />
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations */}
                  {workflowResult.recommendations && (
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                        Öneriler
                      </h3>
                      <ul className="space-y-2">
                        {workflowResult.recommendations.map((rec: string, i: number) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-gray-600 dark:text-gray-300"
                          >
                            <Sparkles className="w-4 h-4 text-purple-500 mt-1 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Product Results */}
              {workflowResult.products && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Bulunan Ürünler ({workflowResult.products.length})
                  </h3>
                  <div className="space-y-3">
                    {workflowResult.products.slice(0, 5).map((product: any, i: number) => (
                      <div
                        key={i}
                        className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center gap-4"
                      >
                        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                          <Search className="w-6 h-6 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {product.title}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                            <span>Maliyet: ${product.costPrice}</span>
                            <span>Satış: ${product.suggestedPrice}</span>
                            <span className="text-green-600">
                              Kar: %{product.profitMargin}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-indigo-600">
                            {product.score}
                          </div>
                          <div className="text-xs text-gray-500">Skor</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AutoPilot Status Bar */}
      {autoPilotActive && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 animate-pulse" />
            <span className="font-medium">AutoPilot Aktif</span>
            <span className="text-indigo-200">
              | Mod: {autoPilotConfig.mode} | Niş: {autoPilotConfig.niches.join(', ')}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-indigo-200">
              Hedef kar marjı: %{autoPilotConfig.minProfitMargin}
            </span>
            <button
              onClick={toggleAutoPilot}
              className="px-4 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              Durdur
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentDashboard;
