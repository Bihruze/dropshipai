import React from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ProductResearch from './components/ProductResearch';
import Inventory from './components/Inventory';
import ProductEdit from './components/ProductEdit';
import AIStudio from './components/AIStudio';
import AgentDashboard from './components/AgentDashboard';
import Orders from './components/Orders';
import Reports from './components/Reports';
import Settings from './components/Settings';
import Login from './components/Login';
import { useStore } from './store/useStore';

const App: React.FC = () => {
  const { view, isAuthenticated } = useStore();

  // Admin-only access - redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  if (view === 'login') return <Login />;

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard />;
      case 'research':
        return <ProductResearch />;
      case 'inventory':
      case 'products':
        return <Inventory />;
      case 'product-edit':
      case 'product-new':
        return <ProductEdit />;
      case 'ai-content':
      case 'studio':
        return <AIStudio />;
      case 'agents':
      case 'agent-dashboard':
        return <AgentDashboard />;
      case 'orders':
        return <Orders />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#030712] text-gray-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto scrollbar-hide bg-white/5">
          <div className="max-w-[1600px] mx-auto">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;