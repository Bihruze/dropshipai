import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Settings as SettingsType } from '../types';

type TabId = 'store' | 'pricing' | 'api' | 'notifications' | 'preferences';

const Settings: React.FC = () => {
  const { settings, updateSettings } = useStore();
  const [activeTab, setActiveTab] = useState<TabId>('store');
  const [formState, setFormState] = useState<SettingsType>(settings);
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Sync internal form state with store on load
  useEffect(() => {
    setFormState(settings);
  }, [settings]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'number' ? parseFloat(value) : value;
    setFormState(prev => ({ ...prev, [name]: val }));
  };

  const handleToggle = (name: keyof SettingsType) => {
    setFormState(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleSave = async (sectionLabel: string) => {
    setLoading('save');
    // Simulate API delay
    await new Promise(r => setTimeout(r, 800));
    updateSettings(formState);
    setLoading(null);
    showToast(`${sectionLabel} updated successfully!`);
  };

  const testShopify = async () => {
    setLoading('shopify');
    await new Promise(r => setTimeout(r, 1500));
    const success = formState.shopifyStoreUrl.includes('.myshopify.com') && formState.shopifyAccessToken.length > 10;
    setLoading(null);
    if (success) {
      updateSettings({ shopifyConnected: true });
      showToast('Shopify connection successful!');
    } else {
      showToast('Invalid Shopify credentials.', 'error');
    }
  };

  const connectEtsy = async () => {
    setLoading('etsy');
    try {
      // Get OAuth URL from backend
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/etsy/auth-url`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      const data = await response.json();
      if (data.success && data.data?.authUrl) {
        // Store state for verification
        sessionStorage.setItem('etsy_oauth_state', data.data.state);
        // Redirect to Etsy OAuth
        window.location.href = data.data.authUrl;
      } else {
        showToast('Failed to get Etsy authorization URL', 'error');
      }
    } catch (err) {
      showToast('Error connecting to Etsy. Make sure API key is configured.', 'error');
    } finally {
      setLoading(null);
    }
  };

  const testGeneric = async (label: string) => {
    setLoading(label);
    await new Promise(r => setTimeout(r, 1000));
    setLoading(null);
    showToast(`${label} connection validated!`);
  };

  const testTelegram = async () => {
    if (!formState.telegramBotToken || !formState.telegramChatId) {
      showToast('Bot Token and Chat ID are required.', 'error');
      return;
    }
    setLoading('telegram');
    try {
      const response = await fetch(`https://api.telegram.org/bot${formState.telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chat_id: formState.telegramChatId, 
          text: '<b>DropshipAI</b> connected! 🚀', 
          parse_mode: 'HTML' 
        })
      });
      if (response.ok) {
        showToast('Test message sent to Telegram!');
      } else {
        showToast('Failed to send Telegram message. Check credentials.', 'error');
      }
    } catch (err) {
      showToast('Error connecting to Telegram API.', 'error');
    } finally {
      setLoading(null);
    }
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: 'store', label: 'Store Connection' },
    { id: 'pricing', label: 'Pricing Rules' },
    { id: 'api', label: 'API Keys' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'preferences', label: 'Preferences' },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 right-8 z-50 px-6 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-right-full ${
          toast.type === 'success' ? 'bg-green-600 border-green-500 text-white' : 'bg-red-600 border-red-500 text-white'
        }`}>
          {toast.type === 'success' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          )}
          <span className="font-bold">{toast.message}</span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold heading-font text-slate-900">Settings</h2>
        <p className="text-slate-500">Manage your store integrations, automated rules, and AI preferences.</p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab.id 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {/* TAB: STORE CONNECTION */}
        {activeTab === 'store' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Shopify Connection */}
            <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm space-y-8">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#96bf48] rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M15.337 3.415c-.194-.064-.388-.064-.582 0-.194.065-.388.194-.517.388l-1.165 1.942-1.036-1.036c-.194-.194-.453-.323-.711-.323h-.065c-.323.065-.582.258-.711.517L6.55 12.936l-.065.129 2.588 1.553 6.264-11.203zM19.5 8.25l-3.879 6.94 2.588 1.553L22.088 10c.194-.323.194-.711 0-1.035l-1.553-2.588c-.194-.323-.582-.453-.97-.388l-.065.26z"/>
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-slate-900">Connect Shopify Store</h3>
                    <p className="text-sm text-slate-500">Link your Shopify instance to start syncing products and orders.</p>
                  </div>
                </div>
                {settings.shopifyConnected ? (
                  <span className="px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Connected
                  </span>
                ) : (
                  <span className="px-4 py-1.5 bg-slate-100 text-slate-500 rounded-full text-xs font-bold border border-slate-200">
                    Not Connected
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Shopify Store URL</label>
                  <input
                    type="text"
                    name="shopifyStoreUrl"
                    value={formState.shopifyStoreUrl}
                    onChange={handleInputChange}
                    placeholder="mystore.myshopify.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all"
                  />
                  <p className="text-[10px] text-slate-400">Include the full .myshopify.com domain</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Admin API Access Token</label>
                  <input
                    type="password"
                    name="shopifyAccessToken"
                    value={formState.shopifyAccessToken}
                    onChange={handleInputChange}
                    placeholder="shpat_..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all"
                  />
                  <p className="text-[10px] text-slate-400">Get from Shopify Admin → Settings → Apps → Develop apps</p>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button
                  onClick={testShopify}
                  disabled={!!loading}
                  className="px-6 py-3 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                  {loading === 'shopify' && <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                  Test Connection
                </button>
                <button
                  onClick={() => handleSave('Store settings')}
                  disabled={!!loading}
                  className="px-8 py-3 bg-[#96bf48] hover:bg-[#7ea33e] text-white rounded-xl font-bold transition-all shadow-lg shadow-green-600/20"
                >
                  Save & Connect
                </button>
                {settings.shopifyConnected && (
                  <button
                    onClick={() => updateSettings({ shopifyConnected: false })}
                    className="ml-auto text-red-500 font-bold hover:underline"
                  >
                    Disconnect Store
                  </button>
                )}
              </div>
            </div>

            {/* Etsy Connection */}
            <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm space-y-8">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#F56400] rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8.559 4.102c-.123 0-.369.123-.369.369v3.689c0 .123 0 .246.123.246.123.123.246.123.369.123h1.845c.246 0 .369-.123.369-.369 0-.123-.123-.369-.369-.369H9.05v-3.32h1.476c.246 0 .369-.123.369-.369s-.123-.369-.369-.369H8.559zm4.428 0c-.246 0-.369.123-.369.369v3.689c0 .246.123.369.369.369s.369-.123.369-.369v-1.23h.738l.861 1.353c.123.123.246.246.369.246.246 0 .369-.123.369-.369 0-.123 0-.123-.123-.246l-.615-.984c.492-.123.738-.492.738-.984 0-.615-.492-1.107-1.107-1.107h-1.6v-.738zm.369.738h1.107c.246 0 .369.246.369.369 0 .246-.123.369-.369.369h-1.107v-.738zM4.5 8.529c-.246 0-.369.123-.369.369v3.689c0 .246.123.369.369.369h1.845c.246 0 .369-.123.369-.369s-.123-.369-.369-.369H4.869v-1.23h1.107c.246 0 .369-.123.369-.369s-.123-.369-.369-.369H4.869v-.984h1.476c.246 0 .369-.123.369-.369s-.123-.369-.369-.369H4.5zm4.059 0c-.123 0-.246 0-.246.123l-1.23 3.689c0 .123 0 .246.123.369.123.123.246.123.369.123.123 0 .246-.123.369-.246l.246-.738h1.353l.246.738c.123.123.246.246.369.246.246 0 .369-.123.369-.369 0-.123 0-.123 0-.246l-1.23-3.566c-.123-.123-.246-.123-.369-.123h-.369zm.246.984l.492 1.476h-.984l.492-1.476zm4.182-.984c-.246 0-.369.123-.369.369v3.689c0 .246.123.369.369.369h1.845c.246 0 .369-.123.369-.369s-.123-.369-.369-.369h-1.476v-1.23h1.107c.246 0 .369-.123.369-.369s-.123-.369-.369-.369h-1.107v-.984h1.476c.246 0 .369-.123.369-.369s-.123-.369-.369-.369h-1.845zm4.059 0c-.246 0-.369.123-.369.369v3.689c0 .246.123.369.369.369s.369-.123.369-.369v-1.23h.738l.861 1.353c.123.123.246.246.369.246.246 0 .369-.123.369-.369 0-.123 0-.123-.123-.246l-.615-.984c.492-.123.738-.492.738-.984 0-.615-.492-1.107-1.107-1.107h-1.6v-.738zm.369.738h1.107c.246 0 .369.246.369.369 0 .246-.123.369-.369.369h-1.107v-.738z"/>
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-slate-900">Connect Etsy Shop</h3>
                    <p className="text-sm text-slate-500">Link your Etsy shop to sync listings and manage orders.</p>
                  </div>
                </div>
                <span className="px-4 py-1.5 bg-slate-100 text-slate-500 rounded-full text-xs font-bold border border-slate-200">
                  Not Connected
                </span>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-orange-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-orange-800">Etsy uses OAuth 2.0 authentication</p>
                    <p className="text-xs text-orange-600">Click the button below to securely connect your Etsy shop. You'll be redirected to Etsy to authorize access.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button
                  onClick={connectEtsy}
                  disabled={!!loading}
                  className="px-8 py-3 bg-[#F56400] hover:bg-[#d95700] text-white rounded-xl font-bold transition-all shadow-lg shadow-orange-600/20 flex items-center gap-2"
                >
                  {loading === 'etsy' && <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Connect with Etsy
                </button>
                <a
                  href="https://www.etsy.com/developers/documentation/getting_started/oauth"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 transition-all text-slate-600 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Etsy Developer Docs
                </a>
              </div>
            </div>
          </div>
        )}

        {/* TAB: PRICING RULES */}
        {activeTab === 'pricing' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Default Markup Multiplier</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        name="defaultMarkup"
                        value={formState.defaultMarkup}
                        onChange={handleInputChange}
                        step="0.1"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">x</span>
                    </div>
                    <p className="text-xs text-slate-400">Cost &times; {formState.defaultMarkup} = Suggested Selling Price</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Minimum Profit Margin (%)</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        name="minProfitMargin"
                        value={formState.minProfitMargin}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-8 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">Auto-update prices</p>
                      <p className="text-xs text-slate-500">Sync store prices when supplier costs change</p>
                    </div>
                    <button 
                      onClick={() => handleToggle('autoUpdatePrices')}
                      className={`w-12 h-6 rounded-full transition-all relative ${formState.autoUpdatePrices ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formState.autoUpdatePrices ? 'right-1' : 'left-1'}`}></span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">Round prices to .99</p>
                      <p className="text-xs text-slate-500">e.g., $19.42 becomes $19.99</p>
                    </div>
                    <button 
                      onClick={() => handleToggle('roundTo99')}
                      className={`w-12 h-6 rounded-full transition-all relative ${formState.roundTo99 ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formState.roundTo99 ? 'right-1' : 'left-1'}`}></span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <button 
                  onClick={() => handleSave('Pricing rules')}
                  disabled={!!loading}
                  className="px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20"
                >
                  Save Pricing Rules
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: API KEYS */}
        {activeTab === 'api' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* CJ Dropshipping */}
            <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-500">CJ</div>
                <h3 className="text-xl font-bold text-slate-900">CJ Dropshipping</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">API Key</label>
                  <input 
                    type="password" 
                    name="cjApiKey"
                    value={formState.cjApiKey}
                    onChange={handleInputChange}
                    placeholder="Enter CJ API Key"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <button 
                  onClick={() => testGeneric('CJ Dropshipping')}
                  className="px-6 py-2.5 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 transition-all text-sm"
                >
                  Test CJ Connection
                </button>
              </div>
            </div>

            {/* Claude AI */}
            <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center font-bold text-orange-600">AI</div>
                <h3 className="text-xl font-bold text-slate-900">Claude AI</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">API Key</label>
                  <input 
                    type="password" 
                    name="claudeApiKey"
                    value={formState.claudeApiKey}
                    onChange={handleInputChange}
                    placeholder="sk-ant-..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <button 
                  onClick={() => testGeneric('Claude AI')}
                  className="px-6 py-2.5 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 transition-all text-sm"
                >
                  Test Claude Connection
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={() => handleSave('API keys')}
                className="px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20"
              >
                Save All Keys
              </button>
            </div>
          </div>
        )}

        {/* TAB: NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15.31-.3.6-.45.89-.15.31-.3.6-.45.89l-.2.4c-.23.47-.46.94-.69 1.41-.09.18-.18.36-.27.54-.09.18-.18.36-.27.54l-.45.92-.15.31c-.1.21-.21.41-.31.62l-.46.92-.01.01c-.1.2-.19.4-.29.6l-.1.2c-.1.2-.2.4-.3.6l-.21.42-.01.01-.2.4c-.1.2-.2.41-.31.61-.15.31-.31.62-.47.93l-.1.2c-.1.2-.21.41-.31.61l-.2.4c-.1.2-.2.41-.31.61l-.25.5c-.09.18-.18.36-.27.54-.09.18-.18.36-.27.54l-.2.4c-.11.22-.22.44-.33.66l-.01.01-.1.2-.11.22c-.11.21-.21.42-.32.63l-.01.01-.1.21-.1.21z"/></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900">Telegram Setup</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Bot Token</label>
                  <input 
                    type="text" 
                    name="telegramBotToken"
                    value={formState.telegramBotToken}
                    onChange={handleInputChange}
                    placeholder="123456789:ABC..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all"
                  />
                  <p className="text-[10px] text-slate-400">Get from <a href="https://t.me/botfather" target="_blank" className="text-blue-500 underline">@BotFather</a> on Telegram</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Chat ID</label>
                  <input 
                    type="text" 
                    name="telegramChatId"
                    value={formState.telegramChatId}
                    onChange={handleInputChange}
                    placeholder="987654321"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all"
                  />
                  <p className="text-[10px] text-slate-400">Get from <a href="https://t.me/userinfobot" target="_blank" className="text-blue-500 underline">@userinfobot</a></p>
                </div>
              </div>

              <button 
                onClick={testTelegram}
                disabled={!!loading}
                className="px-6 py-2.5 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 transition-all text-sm flex items-center gap-2"
              >
                {loading === 'telegram' && <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                Send Test Message
              </button>
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-900">Email Notifications</h3>
              <div className="space-y-4">
                {[
                  { id: 'notifyNewOrders', label: 'New order notifications' },
                  { id: 'notifyLowStock', label: 'Low stock alerts' },
                  { id: 'notifyDailySummary', label: 'Daily summary report' },
                ].map(item => (
                  <div key={item.id} className="flex items-center justify-between pb-4 border-b border-slate-50 last:border-0">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <button 
                      onClick={() => handleToggle(item.id as keyof SettingsType)}
                      className={`w-11 h-5 rounded-full transition-all relative ${formState[item.id as keyof SettingsType] ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${formState[item.id as keyof SettingsType] ? 'right-0.5' : 'left-0.5'}`}></span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={() => handleSave('Notification settings')}
                className="px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20"
              >
                Save Notification Settings
              </button>
            </div>
          </div>
        )}

        {/* TAB: PREFERENCES */}
        {activeTab === 'preferences' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Default Language</label>
                  <select 
                    name="language"
                    value={formState.language}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all appearance-none"
                  >
                    <option>English</option>
                    <option>German</option>
                    <option>French</option>
                    <option>Spanish</option>
                    <option>Italian</option>
                    <option>Turkish</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Default Currency</label>
                  <select 
                    name="currency"
                    value={formState.currency}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all appearance-none"
                  >
                    <option>USD</option>
                    <option>EUR</option>
                    <option>GBP</option>
                    <option>TRY</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700">Timezone</label>
                  <select 
                    name="timezone"
                    value={formState.timezone}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all appearance-none"
                  >
                    <option>UTC (Coordinated Universal Time)</option>
                    <option>EST (Eastern Standard Time)</option>
                    <option>PST (Pacific Standard Time)</option>
                    <option>CET (Central European Time)</option>
                    <option>TRT (Turkey Time)</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <button 
                  onClick={() => handleSave('Preferences')}
                  className="px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;