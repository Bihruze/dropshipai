
import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { ViewType } from '../types';

const Sidebar: React.FC = () => {
  const { view, setView, orders } = useStore();

  const pendingCount = useMemo(() => orders.filter(o => o.status === 'pending').length, [orders]);

  const menuItems: { id: ViewType; label: string; icon: string; badge?: number }[] = [
    { id: 'dashboard', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'orders', label: 'Orders', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z', badge: pendingCount },
    { id: 'products', label: 'Products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { id: 'research', label: 'Product Research', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
    { id: 'agents', label: 'AI Agents', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { id: 'ai-content', label: 'AI Content', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { id: 'reports', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  ];

  return (
    <div className="w-60 bg-[#1a1c1d] h-screen sticky top-0 flex flex-col text-[#babec3]">
      <div className="p-5 mb-4">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
              <svg className="w-6 h-6 text-[#1a1c1d]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
           </div>
           <span className="text-white font-bold text-lg tracking-tight">Dropship<span className="text-[#008060]">AI</span></span>
        </div>
      </div>
      
      <nav className="flex-1 px-3 space-y-0.5">
        {menuItems.map((item) => {
          const isActive = view === item.id || (view === 'inventory' && item.id === 'products') || (view === 'studio' && item.id === 'ai-content') || (view === 'product-edit' && item.id === 'products') || (view === 'product-new' && item.id === 'products') || (view === 'agent-dashboard' && item.id === 'agents');
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center justify-between gap-3 px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
                isActive
                  ? 'bg-[#353739] text-white' 
                  : 'hover:bg-[#2c2e30] hover:text-[#d2d5d9]'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className={`w-5 h-5 ${isActive ? 'text-[#008060]' : 'text-[#babec3]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                <span>{item.label}</span>
              </div>
              {item.badge ? (
                <span className="bg-[#cc3300] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#2c2e30]">
        <div className="flex items-center gap-3 p-2 rounded-md hover:bg-[#2c2e30] cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-shopify-green flex items-center justify-center text-white text-xs font-bold">
            DY
          </div>
          <div className="text-xs overflow-hidden">
             <p className="text-white font-medium truncate">Demo Store</p>
             <p className="text-[#babec3] truncate">Premium</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
