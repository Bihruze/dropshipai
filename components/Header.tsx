
import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';

const Header: React.FC = () => {
  const { view, user, logout, notifications, markNotificationRead, markAllNotificationsRead } = useStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const getTitle = () => {
    switch (view) {
      case 'dashboard': return 'Home';
      case 'research': return 'Product Research';
      case 'ai-content': return 'AI Content Studio';
      case 'products': return 'Products';
      case 'orders': return 'Orders';
      case 'reports': return 'Analytics';
      case 'settings': return 'Settings';
      default: return 'DropshipAI';
    }
  };

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  return (
    <header className="h-14 border-b border-[#e1e3e5] flex items-center justify-between px-6 bg-white text-[#202223] sticky top-0 z-20">
      <h2 className="text-sm font-bold">{getTitle()}</h2>

      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <div className="relative">
          <button 
            onClick={() => { setShowNotifDropdown(!showNotifDropdown); setShowDropdown(false); }}
            className="p-1.5 text-[#5c5f62] hover:bg-[#f6f6f7] rounded-md transition-colors relative"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#cc3300] rounded-full border border-white"></span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-[#e1e3e5] rounded-md shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-3 bg-[#f6f6f7] border-b border-[#e1e3e5] flex justify-between items-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6d7175]">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllNotificationsRead} className="text-[11px] font-bold text-[#008060] hover:underline">Mark read</button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-[#e1e3e5]">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-xs text-[#6d7175]">No new notifications</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-3 hover:bg-[#f6f6f7] transition-colors cursor-pointer flex gap-3 ${!n.isRead ? 'bg-[#f1f8f5]' : ''}`}
                    >
                      <div className="space-y-0.5">
                        <p className={`text-xs ${!n.isRead ? 'font-bold' : ''}`}>{n.title}</p>
                        <p className="text-[11px] text-[#6d7175] line-clamp-2">{n.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button 
            onClick={() => { setShowDropdown(!showDropdown); setShowNotifDropdown(false); }}
            className="flex items-center gap-2 p-1.5 hover:bg-[#f6f6f7] rounded-md transition-colors"
          >
             <div className="w-6 h-6 rounded-md bg-[#5c5f62] text-white flex items-center justify-center font-bold text-[10px]">
              {user?.name?.split(' ').map(n => n[0]).join('') || 'DA'}
            </div>
            <span className="text-xs font-medium">{user?.name || 'Demo'}</span>
            <svg className="w-3 h-3 text-[#5c5f62]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-[#e1e3e5] rounded-md shadow-lg overflow-hidden">
              <button className="w-full text-left px-4 py-2 text-xs hover:bg-[#f6f6f7]">Account settings</button>
              <button className="w-full text-left px-4 py-2 text-xs hover:bg-[#f6f6f7]">Support</button>
              <div className="border-t border-[#e1e3e5]"></div>
              <button 
                onClick={logout}
                className="w-full text-left px-4 py-2 text-xs text-[#cc3300] hover:bg-[#fff4f4] font-bold"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
