import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Product } from '../types';

const TONES = ['Professional', 'Friendly', 'Luxury', 'Casual', 'Urgent'];
const LANGUAGES = ['English', 'German', 'French', 'Spanish', 'Italian', 'Turkish'];
const CATEGORIES = ["Electronics", "Home & Garden", "Pet Supplies", "Beauty", "Sports", "Car Accessories", "Baby", "Fashion"];

// Mock AI Service for realistic content generation
const generateMockContent = async (input: {
  productName: string;
  category: string;
  features: string;
  audience: string;
  tone: string;
  language: string;
}) => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  return {
    title: `${input.productName} - Premium Quality ${input.category} | Free Shipping`,
    bulletPoints: [
      `✅ PREMIUM QUALITY - Made with high-grade materials for long-lasting durability in ${input.category.toLowerCase()} products.`,
      `🚀 EASY TO USE - Simple setup and intuitive design for a hassle-free experience with your ${input.productName}.`,
      `💯 SATISFACTION GUARANTEED - 30-day money-back guarantee if not completely satisfied with this ${input.category}.`,
      `🎁 PERFECT GIFT - Ideal present for ${input.audience || 'anyone looking for quality'} who values great ${input.tone.toLowerCase()} style.`,
      `📦 FAST SHIPPING - Ships within 24 hours with tracking included for your peace of mind.`
    ],
    description: `Introducing the ${input.productName}, your new must-have ${input.category.toLowerCase()} essential!\n\nAre you looking for a reliable, high-quality solution? Look no further! Our ${input.productName} is designed with you in mind, combining functionality with a ${input.tone.toLowerCase()} style.\n\n${input.features ? `Key features include: ${input.features}.` : ''}\n\nPerfect for ${input.audience || 'everyday use'}, this product has been crafted to exceed your expectations in the ${input.category} space. Join thousands of satisfied customers who have already made the smart choice.\n\nOrder now and experience the difference! With our 30-day satisfaction guarantee, you have nothing to lose.`,
    seoTags: [
      input.productName.toLowerCase().replace(/\s+/g, '-'),
      input.category.toLowerCase().replace(/\s+/g, '-'),
      'free-shipping',
      'best-seller',
      'premium-quality'
    ],
    metaDescription: `Shop ${input.productName} - Premium ${input.category} with free shipping. ✓ Top quality ✓ Fast delivery ✓ 30-day guarantee. Optimized for ${input.audience || 'global customers'}. Order now!`
  };
};

const AIStudio: React.FC = () => {
  const { products, updateProduct, addProduct } = useStore();
  
  // Input States
  const [sourceMode, setSourceMode] = useState<'my-products' | 'manual'>('manual');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [formData, setFormData] = useState({
    productName: '',
    category: CATEGORIES[0],
    features: '',
    audience: '',
    tone: TONES[0],
    language: LANGUAGES[0]
  });

  // Output States
  const [generatedContent, setGeneratedContent] = useState<{
    title: string;
    bulletPoints: string[];
    description: string;
    seoTags: string[];
    metaDescription: string;
  } | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Sync Form when a product is selected
  useEffect(() => {
    if (sourceMode === 'my-products' && selectedProductId) {
      const product = products.find(p => p.id === selectedProductId);
      if (product) {
        setFormData(prev => ({
          ...prev,
          productName: product.title,
          category: product.category,
          features: product.description || '',
        }));
      }
    }
  }, [selectedProductId, sourceMode, products]);

  const handleGenerateAll = async () => {
    if (!formData.productName) return;
    setLoading(true);
    try {
      const content = await generateMockContent(formData);
      setGeneratedContent(content);
      showToast('AI Content Generated Successfully!');
    } catch (err) {
      showToast('Error generating content.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToProduct = () => {
    if (!generatedContent || !selectedProductId) return;
    updateProduct(selectedProductId, {
      title: generatedContent.title,
      description: generatedContent.description,
      bulletPoints: generatedContent.bulletPoints,
      seoTags: generatedContent.seoTags,
      metaDescription: generatedContent.metaDescription
    });
    showToast('Saved to Product Inventory!');
  };

  const handleCreateNewProduct = () => {
    if (!generatedContent) return;
    // Fix: Added missing required properties (costPrice, sku, stock, lowStockThreshold) to satisfy the Product interface
    addProduct({
      id: `ai-${Date.now()}`,
      title: generatedContent.title,
      description: generatedContent.description,
      bulletPoints: generatedContent.bulletPoints,
      seoTags: generatedContent.seoTags,
      metaDescription: generatedContent.metaDescription,
      price: 29.99,
      category: formData.category,
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
      status: 'draft',
      aiScore: 95,
      createdAt: new Date().toISOString(),
      costPrice: 0,
      sku: `AI-${Math.floor(Math.random() * 10000)}`,
      stock: 0,
      lowStockThreshold: 5,
    });
    showToast('New Draft Product Created!');
  };

  const copyToClipboard = () => {
    if (!generatedContent) return;
    const text = `
Title: ${generatedContent.title}
---
Bullets:
${generatedContent.bulletPoints.join('\n')}
---
Description:
${generatedContent.description}
---
SEO Tags: ${generatedContent.seoTags.join(', ')}
    `.trim();
    navigator.clipboard.writeText(text);
    showToast('Copied to Clipboard!');
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      {toast && (
        <div className="fixed top-20 right-8 z-50 bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-xl font-bold border border-blue-500 animate-in slide-in-from-right-full">
          {toast}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-extrabold heading-font text-slate-900">AI Content Generator</h2>
        <p className="text-slate-500">Generate SEO-optimized product content with intelligent AI models.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT: INPUT PANEL */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Product Source</h3>
              <div className="flex gap-4 p-1 bg-slate-50 rounded-2xl border border-slate-100">
                <button 
                  onClick={() => setSourceMode('my-products')}
                  className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all ${sourceMode === 'my-products' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  My Products
                </button>
                <button 
                  onClick={() => setSourceMode('manual')}
                  className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all ${sourceMode === 'manual' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  Manual Entry
                </button>
              </div>

              {sourceMode === 'my-products' && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                  <label className="text-sm font-bold text-slate-700">Select Draft Product</label>
                  <select 
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-all appearance-none"
                  >
                    <option value="">-- Choose Product --</option>
                    {products.filter(p => p.status === 'draft').map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Product Name</label>
                <input 
                  type="text" 
                  value={formData.productName}
                  onChange={(e) => setFormData({...formData, productName: e.target.value})}
                  placeholder="e.g. Ergonomic Standing Desk"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Category</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-all appearance-none"
                  >
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Tone</label>
                  <select 
                    value={formData.tone}
                    onChange={(e) => setFormData({...formData, tone: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-all appearance-none"
                  >
                    {TONES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Key Features</label>
                <textarea 
                  value={formData.features}
                  onChange={(e) => setFormData({...formData, features: e.target.value})}
                  placeholder="Comma separated features..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 h-24 outline-none focus:border-blue-500 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Target Audience</label>
                  <input 
                    type="text" 
                    value={formData.audience}
                    onChange={(e) => setFormData({...formData, audience: e.target.value})}
                    placeholder="e.g. Office workers"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Language</label>
                  <select 
                    value={formData.language}
                    onChange={(e) => setFormData({...formData, language: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-all appearance-none"
                  >
                    {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <button 
              onClick={handleGenerateAll}
              disabled={loading || !formData.productName}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.25rem] font-black transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 disabled:bg-slate-200 disabled:shadow-none"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Thinking...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Generate All Content
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT: OUTPUT PANEL */}
        <div className="lg:col-span-7 space-y-6">
          {generatedContent ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                {/* Title Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span className="p-1 bg-blue-100 text-blue-600 rounded-lg">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </span>
                      SEO Optimized Title
                    </label>
                    <span className={`text-[10px] font-bold ${generatedContent.title.length > 70 ? 'text-red-500' : 'text-slate-400'}`}>
                      {generatedContent.title.length}/70
                    </span>
                  </div>
                  <input 
                    type="text" 
                    value={generatedContent.title}
                    onChange={(e) => setGeneratedContent({...generatedContent, title: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-all font-bold text-slate-800"
                  />
                </div>

                {/* Bullet Points */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-slate-900">Key Features (Bullets)</label>
                    <button className="text-[10px] text-blue-600 font-bold hover:underline">Regenerate</button>
                  </div>
                  <div className="space-y-2">
                    {generatedContent.bulletPoints.map((bullet, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="cursor-grab text-slate-300">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
                        </div>
                        <input 
                          type="text" 
                          value={bullet}
                          onChange={(e) => {
                            const newBullets = [...generatedContent.bulletPoints];
                            newBullets[idx] = e.target.value;
                            setGeneratedContent({...generatedContent, bulletPoints: newBullets});
                          }}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-slate-900">Product Description</label>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {generatedContent.description.split(/\s+/).length} words
                    </span>
                  </div>
                  <textarea 
                    value={generatedContent.description}
                    onChange={(e) => setGeneratedContent({...generatedContent, description: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] px-6 py-4 h-60 text-sm leading-relaxed outline-none focus:border-blue-500 transition-all"
                  />
                </div>

                {/* SEO Tags */}
                <div className="space-y-4">
                  <label className="text-sm font-bold text-slate-900">SEO Tags</label>
                  <div className="flex flex-wrap gap-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    {generatedContent.seoTags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-xs font-bold flex items-center gap-2 capitalize">
                        #{tag}
                        <button onClick={() => setGeneratedContent({...generatedContent, seoTags: generatedContent.seoTags.filter(t => t !== tag)})}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </span>
                    ))}
                    <input 
                      type="text" 
                      placeholder="+ Add Tag" 
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = (e.target as HTMLInputElement).value;
                          if (val) {
                            setGeneratedContent({...generatedContent, seoTags: [...generatedContent.seoTags, val.replace(/\s+/g, '-')]});
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                      className="bg-transparent text-xs font-bold outline-none text-slate-400 ml-2" 
                    />
                  </div>
                </div>

                {/* Meta Description */}
                <div className="space-y-4">
                   <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-slate-900">Meta Description</label>
                    <span className={`text-[10px] font-bold ${generatedContent.metaDescription.length > 155 ? 'text-red-500' : 'text-slate-400'}`}>
                      {generatedContent.metaDescription.length}/155
                    </span>
                  </div>
                  <textarea 
                    value={generatedContent.metaDescription}
                    onChange={(e) => setGeneratedContent({...generatedContent, metaDescription: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 h-20 text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button 
                  onClick={copyToClipboard}
                  className="flex-1 py-4 bg-slate-900 text-white rounded-[1.25rem] font-bold transition-all flex items-center justify-center gap-2 shadow-xl"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                  Copy All
                </button>
                {sourceMode === 'my-products' && selectedProductId ? (
                  <button 
                    onClick={handleSaveToProduct}
                    className="flex-1 py-4 bg-blue-600 text-white rounded-[1.25rem] font-bold transition-all shadow-xl shadow-blue-600/20"
                  >
                    Save to Product
                  </button>
                ) : (
                  <button 
                    onClick={handleCreateNewProduct}
                    className="flex-1 py-4 bg-green-600 text-white rounded-[1.25rem] font-bold transition-all shadow-xl shadow-green-600/20"
                  >
                    Create New Product
                  </button>
                )}
              </div>

              {/* Google Preview Panel */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Google Search Preview</h4>
                 <div className="space-y-1">
                    <p className="text-[#1a0dab] text-xl hover:underline cursor-pointer truncate">{generatedContent.title}</p>
                    <p className="text-[#006621] text-sm">https://mystore.myshopify.com › products › {formData.productName.toLowerCase().replace(/\s+/g, '-')}</p>
                    <p className="text-[#4d5156] text-sm line-clamp-2">{generatedContent.metaDescription}</p>
                 </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem]">
              <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-400">Your AI-generated content will appear here</h3>
              <p className="text-slate-400 mt-2">Fill out the form and click "Generate All Content" to start.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIStudio;
