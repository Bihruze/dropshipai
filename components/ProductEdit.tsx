import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Product } from '../types';

const CATEGORIES = [
  "Electronics", "Home & Garden", "Pet Supplies", "Beauty",
  "Sports", "Car Accessories", "Baby", "Fashion", "Kitchenware", "Home Decor"
];

const ProductEdit: React.FC = () => {
  const { products, editingProductId, updateProduct, addProduct, setView, setEditingProduct } = useStore();
  const isNewProduct = !editingProductId;
  const existingProduct = editingProductId ? products.find(p => p.id === editingProductId) : null;

  const [formData, setFormData] = useState<Partial<Product>>({
    title: '',
    description: '',
    price: 0,
    costPrice: 0,
    compareAtPrice: undefined,
    category: CATEGORIES[0],
    imageUrl: '',
    status: 'draft',
    sku: '',
    stock: 0,
    lowStockThreshold: 5,
    bulletPoints: [],
    seoTags: [],
    metaDescription: '',
  });

  const [bulletInput, setBulletInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingProduct) {
      setFormData({
        title: existingProduct.title,
        description: existingProduct.description,
        price: existingProduct.price,
        costPrice: existingProduct.costPrice,
        compareAtPrice: existingProduct.compareAtPrice,
        category: existingProduct.category,
        imageUrl: existingProduct.imageUrl,
        status: existingProduct.status,
        sku: existingProduct.sku,
        stock: existingProduct.stock,
        lowStockThreshold: existingProduct.lowStockThreshold,
        bulletPoints: existingProduct.bulletPoints || [],
        seoTags: existingProduct.seoTags || [],
        metaDescription: existingProduct.metaDescription || '',
      });
    }
  }, [existingProduct]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const addBulletPoint = () => {
    if (bulletInput.trim()) {
      setFormData(prev => ({
        ...prev,
        bulletPoints: [...(prev.bulletPoints || []), bulletInput.trim()]
      }));
      setBulletInput('');
    }
  };

  const removeBulletPoint = (index: number) => {
    setFormData(prev => ({
      ...prev,
      bulletPoints: (prev.bulletPoints || []).filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (tagInput.trim()) {
      setFormData(prev => ({
        ...prev,
        seoTags: [...(prev.seoTags || []), tagInput.trim().toLowerCase().replace(/\s+/g, '-')]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      seoTags: (prev.seoTags || []).filter(t => t !== tag)
    }));
  };

  const calculateProfit = () => {
    const price = formData.price || 0;
    const cost = formData.costPrice || 0;
    const profit = price - cost;
    const margin = price > 0 ? (profit / price) * 100 : 0;
    return { profit, margin };
  };

  const handleSave = async () => {
    if (!formData.title) {
      showToast('Product title is required');
      return;
    }

    setSaving(true);
    await new Promise(r => setTimeout(r, 500)); // Simulate API delay

    if (isNewProduct) {
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        title: formData.title || '',
        description: formData.description || '',
        price: formData.price || 0,
        costPrice: formData.costPrice || 0,
        compareAtPrice: formData.compareAtPrice,
        category: formData.category || CATEGORIES[0],
        imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
        status: formData.status || 'draft',
        aiScore: 85,
        createdAt: new Date().toISOString(),
        sku: formData.sku || `SKU-${Date.now()}`,
        stock: formData.stock || 0,
        lowStockThreshold: formData.lowStockThreshold || 5,
        bulletPoints: formData.bulletPoints,
        seoTags: formData.seoTags,
        metaDescription: formData.metaDescription,
      };
      addProduct(newProduct);
      showToast('Product created successfully!');
    } else {
      updateProduct(editingProductId!, formData);
      showToast('Product updated successfully!');
    }

    setSaving(false);
    setTimeout(() => {
      setEditingProduct(null);
      setView('products');
    }, 500);
  };

  const handleCancel = () => {
    setEditingProduct(null);
    setView('products');
  };

  const { profit, margin } = calculateProfit();

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {toast && (
        <div className="fixed top-20 right-8 z-50 bg-green-600 text-white px-6 py-3 rounded-2xl shadow-xl font-bold animate-in slide-in-from-right-full">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={handleCancel} className="p-2 hover:bg-[#f6f6f7] rounded-md transition-colors">
            <svg className="w-5 h-5 text-[#5c5f62]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-[#202223]">
            {isNewProduct ? 'Add product' : 'Edit product'}
          </h1>
        </div>
        <div className="flex gap-3">
          <button onClick={handleCancel} className="px-4 py-2 border border-[#babec3] rounded-md text-sm font-bold hover:bg-[#f6f6f7] transition-colors">
            Discard
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-[#008060] text-white rounded-md text-sm font-bold hover:bg-[#006e52] transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="polaris-card p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#202223]">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Short sleeve t-shirt"
                className="w-full bg-white border border-[#babec3] rounded-md px-3 py-2 text-sm focus:ring-2 ring-[#008060] outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#202223]">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Write a compelling product description..."
                rows={4}
                className="w-full bg-white border border-[#babec3] rounded-md px-3 py-2 text-sm focus:ring-2 ring-[#008060] outline-none resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#202223]">Key Features (Bullet Points)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={bulletInput}
                  onChange={(e) => setBulletInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addBulletPoint())}
                  placeholder="Add a feature..."
                  className="flex-1 bg-white border border-[#babec3] rounded-md px-3 py-2 text-sm focus:ring-2 ring-[#008060] outline-none"
                />
                <button onClick={addBulletPoint} className="px-4 py-2 bg-[#f6f6f7] border border-[#babec3] rounded-md text-sm font-bold hover:bg-[#e1e3e5]">
                  Add
                </button>
              </div>
              <ul className="space-y-2 mt-2">
                {(formData.bulletPoints || []).map((bullet, idx) => (
                  <li key={idx} className="flex items-center gap-2 bg-[#f6f6f7] p-2 rounded-md">
                    <span className="text-[#008060]">•</span>
                    <span className="flex-1 text-sm">{bullet}</span>
                    <button onClick={() => removeBulletPoint(idx)} className="text-[#cc3300] hover:underline text-xs">
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Media */}
          <div className="polaris-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-[#202223]">Media</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#6d7175]">Image URL</label>
              <input
                type="text"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
                className="w-full bg-white border border-[#babec3] rounded-md px-3 py-2 text-sm focus:ring-2 ring-[#008060] outline-none"
              />
            </div>
            {formData.imageUrl && (
              <div className="w-32 h-32 rounded-md border border-[#e1e3e5] overflow-hidden">
                <img src={formData.imageUrl} alt="Product" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="polaris-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-[#202223]">Pricing</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#6d7175]">Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6d7175]">$</span>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full bg-white border border-[#babec3] rounded-md pl-7 pr-3 py-2 text-sm focus:ring-2 ring-[#008060] outline-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#6d7175]">Compare-at price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6d7175]">$</span>
                  <input
                    type="number"
                    name="compareAtPrice"
                    value={formData.compareAtPrice || ''}
                    onChange={handleInputChange}
                    step="0.01"
                    placeholder="0.00"
                    className="w-full bg-white border border-[#babec3] rounded-md pl-7 pr-3 py-2 text-sm focus:ring-2 ring-[#008060] outline-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#6d7175]">Cost per item</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6d7175]">$</span>
                  <input
                    type="number"
                    name="costPrice"
                    value={formData.costPrice}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full bg-white border border-[#babec3] rounded-md pl-7 pr-3 py-2 text-sm focus:ring-2 ring-[#008060] outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="bg-[#e3f1df] p-4 rounded-md flex justify-between items-center">
              <span className="text-sm font-medium text-[#008060]">Profit per unit</span>
              <div className="text-right">
                <span className="text-lg font-bold text-[#008060]">${profit.toFixed(2)}</span>
                <span className="text-xs text-[#008060] ml-2">({margin.toFixed(1)}% margin)</span>
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div className="polaris-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-[#202223]">Inventory</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#6d7175]">SKU</label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  placeholder="SKU-001"
                  className="w-full bg-white border border-[#babec3] rounded-md px-3 py-2 text-sm focus:ring-2 ring-[#008060] outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#6d7175]">Quantity</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-[#babec3] rounded-md px-3 py-2 text-sm focus:ring-2 ring-[#008060] outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#6d7175]">Low stock alert</label>
                <input
                  type="number"
                  name="lowStockThreshold"
                  value={formData.lowStockThreshold}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-[#babec3] rounded-md px-3 py-2 text-sm focus:ring-2 ring-[#008060] outline-none"
                />
              </div>
            </div>
          </div>

          {/* SEO */}
          <div className="polaris-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-[#202223]">Search engine listing</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#6d7175]">Meta description</label>
              <textarea
                name="metaDescription"
                value={formData.metaDescription}
                onChange={handleInputChange}
                placeholder="Brief description for search engines..."
                rows={2}
                maxLength={155}
                className="w-full bg-white border border-[#babec3] rounded-md px-3 py-2 text-sm focus:ring-2 ring-[#008060] outline-none resize-none"
              />
              <p className="text-xs text-[#6d7175]">{(formData.metaDescription || '').length}/155</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#6d7175]">SEO Tags</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add a tag..."
                  className="flex-1 bg-white border border-[#babec3] rounded-md px-3 py-2 text-sm focus:ring-2 ring-[#008060] outline-none"
                />
                <button onClick={addTag} className="px-4 py-2 bg-[#f6f6f7] border border-[#babec3] rounded-md text-sm font-bold hover:bg-[#e1e3e5]">
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {(formData.seoTags || []).map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-[#f6f6f7] border border-[#e1e3e5] rounded text-xs">
                    #{tag}
                    <button onClick={() => removeTag(tag)} className="text-[#6d7175] hover:text-[#cc3300]">×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="polaris-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-[#202223]">Status</h3>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full bg-white border border-[#babec3] rounded-md px-3 py-2 text-sm focus:ring-2 ring-[#008060] outline-none"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Organization */}
          <div className="polaris-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-[#202223]">Organization</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#6d7175]">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full bg-white border border-[#babec3] rounded-md px-3 py-2 text-sm focus:ring-2 ring-[#008060] outline-none"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Preview */}
          {formData.title && (
            <div className="polaris-card p-6 space-y-4">
              <h3 className="text-sm font-bold text-[#202223]">Preview</h3>
              <div className="space-y-3">
                {formData.imageUrl && (
                  <img src={formData.imageUrl} alt="Preview" className="w-full aspect-square object-cover rounded-md border border-[#e1e3e5]" />
                )}
                <div className="space-y-1">
                  <h4 className="font-bold text-[#202223] text-sm">{formData.title}</h4>
                  <p className="text-[#008060] font-bold">${(formData.price || 0).toFixed(2)}</p>
                  {formData.compareAtPrice && formData.compareAtPrice > (formData.price || 0) && (
                    <p className="text-xs text-[#6d7175] line-through">${formData.compareAtPrice.toFixed(2)}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductEdit;
