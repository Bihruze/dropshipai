import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { SupplierProduct } from '../types';

const CATEGORIES = [
  "All", "Electronics", "Home & Garden", "Pet Supplies", "Beauty", 
  "Sports", "Car Accessories", "Baby", "Fashion"
];

const MOCK_SUPPLIER_PRODUCTS: SupplierProduct[] = [
  {
    id: "cj-001",
    title: "Self-Cleaning Pet Slicker Brush",
    description: "Professional pet grooming brush with one-click cleaning. Perfect for removing loose fur, dander, and trapped dirt from cats and dogs of all sizes.",
    images: ["https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=500&h=500&fit=crop"],
    costPrice: 8.50,
    suggestedPrice: 24.99,
    category: "Pet Supplies",
    rating: 4.8,
    sold: 12500,
    shippingTime: "7-15 days",
    variants: ["Blue", "Pink", "Green"]
  },
  {
    id: "cj-002", 
    title: "Magnetic Car Phone Holder Mount",
    description: "Universal magnetic phone mount for car dashboard. Features powerful magnets and a 360-degree rotation base for optimal viewing angles.",
    images: ["https://images.unsplash.com/photo-1586105251261-72a756657311?w=500&h=500&fit=crop"],
    costPrice: 5.20,
    suggestedPrice: 18.99,
    category: "Car Accessories",
    rating: 4.6,
    sold: 8900,
    shippingTime: "7-12 days",
    variants: ["Black", "Silver"]
  },
  {
    id: "cj-003",
    title: "Mini Desktop Humidifier",
    description: "Ultra-quiet USB-powered humidifier for home or office. Improves air quality and skin hydration in personal spaces.",
    images: ["https://images.unsplash.com/photo-1585672841585-780d6034f40f?w=500&h=500&fit=crop"],
    costPrice: 12.40,
    suggestedPrice: 29.99,
    category: "Home & Garden",
    rating: 4.7,
    sold: 5200,
    shippingTime: "8-14 days",
    variants: ["White", "Navy", "Gray"]
  },
  {
    id: "cj-004",
    title: "Wireless Sleep Headphones",
    description: "Comfortable headband with built-in Bluetooth speakers. Ideal for side sleepers, insomnia, and listening to white noise.",
    images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop"],
    costPrice: 15.00,
    suggestedPrice: 39.99,
    category: "Electronics",
    rating: 4.5,
    sold: 11000,
    shippingTime: "10-15 days",
    variants: ["Black", "Gray"]
  },
  {
    id: "cj-005",
    title: "Reusable Silicone Food Bags",
    description: "Eco-friendly, leak-proof storage bags for snacks, leftovers, and freezing. Dishwasher and microwave safe.",
    images: ["https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=500&h=500&fit=crop"],
    costPrice: 4.50,
    suggestedPrice: 15.99,
    category: "Home & Garden",
    rating: 4.9,
    sold: 21000,
    shippingTime: "7-12 days",
    variants: ["Clear", "Assorted"]
  },
  {
    id: "cj-006",
    title: "Smart Water Bottle with LED Reminder",
    description: "Tracks your hydration and glows to remind you to drink water. Syncs with a mobile app for detailed health metrics.",
    images: ["https://images.unsplash.com/photo-1602143399827-7214fe73076f?w=500&h=500&fit=crop"],
    costPrice: 24.00,
    suggestedPrice: 59.99,
    category: "Electronics",
    rating: 4.4,
    sold: 3400,
    shippingTime: "12-18 days",
    variants: ["Space Gray", "Mint"]
  },
  {
    id: "cj-007",
    title: "Electric Milk Frother & Steamer",
    description: "Create barista-quality foam for lattes and cappuccinos in seconds. Compact design with stainless steel finish.",
    images: ["https://images.unsplash.com/photo-1544923246-77307dd654ca?w=500&h=500&fit=crop"],
    costPrice: 14.50,
    suggestedPrice: 34.99,
    category: "Home & Garden",
    rating: 4.8,
    sold: 15600,
    shippingTime: "7-14 days",
    variants: ["Black", "Silver"]
  },
  {
    id: "cj-008",
    title: "Muscle Massage Gun",
    description: "Powerful percussion massager for deep tissue relief. Comes with 6 interchangeable heads and variable speeds.",
    images: ["https://images.unsplash.com/photo-1544117518-33ef4f6a44a7?w=500&h=500&fit=crop"],
    costPrice: 45.00,
    suggestedPrice: 129.99,
    category: "Sports",
    rating: 4.7,
    sold: 8700,
    shippingTime: "10-20 days",
    variants: ["Carbon Fiber", "Black"]
  },
  {
    id: "cj-009",
    title: "Travel Jewelry Organizer",
    description: "Compact and stylish case for rings, necklaces, and earrings. Prevents tangling and keeps jewelry secure on the go.",
    images: ["https://images.unsplash.com/photo-1584305116359-ef81daaf1fd9?w=500&h=500&fit=crop"],
    costPrice: 9.00,
    suggestedPrice: 24.99,
    category: "Fashion",
    rating: 4.6,
    sold: 6200,
    shippingTime: "7-12 days",
    variants: ["Champagne", "Black"]
  },
  {
    id: "cj-010",
    title: "Solar Power Bank 20000mAh",
    description: "Rugged external battery with solar charging capability. Waterproof and features a built-in LED flashlight.",
    images: ["https://images.unsplash.com/photo-1620339656058-2bb8d83e39b9?w=500&h=500&fit=crop"],
    costPrice: 21.00,
    suggestedPrice: 49.99,
    category: "Electronics",
    rating: 4.5,
    sold: 9100,
    shippingTime: "12-18 days",
    variants: ["Orange", "Blue"]
  }
];

const ProductResearch: React.FC = () => {
  const { importProduct } = useStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<SupplierProduct | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Modal State
  const [sellingPrice, setSellingPrice] = useState<string>('');
  const [shippingCost, setShippingCost] = useState<string>('5.00');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const filteredProducts = useMemo(() => {
    return MOCK_SUPPLIER_PRODUCTS.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'All' || p.category === category;
      const matchesMin = minPrice === '' || p.costPrice >= parseFloat(minPrice);
      const matchesMax = maxPrice === '' || p.costPrice <= parseFloat(maxPrice);
      return matchesSearch && matchesCategory && matchesMin && matchesMax;
    });
  }, [search, category, minPrice, maxPrice]);

  const handleOpenDetails = (product: SupplierProduct) => {
    setSelectedProduct(product);
    setSellingPrice(product.suggestedPrice.toString());
  };

  const handleImport = (product: SupplierProduct, price: string) => {
    importProduct(product, parseFloat(price));
    setSelectedProduct(null);
    showToast(`"${product.title}" imported to My Products!`);
  };

  const calculateProfit = (cost: number, sell: number, ship: number) => {
    const fees = sell * 0.03; // 3% platform fee
    const profit = sell - cost - ship - fees;
    const margin = (profit / sell) * 100;
    return { profit, margin, fees };
  };

  const profitStats = useMemo(() => {
    if (!selectedProduct) return null;
    return calculateProfit(
      selectedProduct.costPrice, 
      parseFloat(sellingPrice) || 0, 
      parseFloat(shippingCost) || 0
    );
  }, [selectedProduct, sellingPrice, shippingCost]);

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-[1400px] mx-auto">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-8 z-50 bg-green-600 text-white px-6 py-3 rounded-2xl shadow-xl font-bold border border-green-500 animate-in slide-in-from-right-full">
          {toast}
        </div>
      )}

      <div>
        <h2 className="text-3xl font-extrabold heading-font text-slate-900">Product Research</h2>
        <p className="text-slate-500">Discover and source winning products directly from global suppliers.</p>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Search products..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 focus:border-blue-500 outline-none transition-all text-slate-800"
            />
          </div>
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-blue-500 transition-all text-slate-800"
          >
            {CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
          </select>
          <div className="flex gap-2">
            <input 
              type="number" 
              placeholder="Min $" 
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-blue-500 transition-all text-slate-800"
            />
            <input 
              type="number" 
              placeholder="Max $" 
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-blue-500 transition-all text-slate-800"
            />
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={() => { setSearch(''); setCategory('All'); setMinPrice(''); setMaxPrice(''); }} className="text-slate-500 font-bold text-sm hover:underline">
            Clear Filters
          </button>
        </div>
      </div>

      {/* Trending Horizontal Row */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <span>🔥</span> Trending Products
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {MOCK_SUPPLIER_PRODUCTS.slice(0, 10).map((product) => (
            <div key={product.id} className="min-w-[240px] bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition-all group shrink-0">
               <div className="h-40 overflow-hidden relative">
                <img src={product.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                <div className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg">TRENDING</div>
               </div>
               <div className="p-4 space-y-1">
                <h4 className="font-bold text-slate-900 text-sm truncate">{product.title}</h4>
                <p className="text-xs text-slate-500">Cost: ${product.costPrice.toFixed(2)}</p>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-blue-600 font-bold text-sm">${product.suggestedPrice}</span>
                  <button onClick={() => handleOpenDetails(product)} className="text-[10px] font-bold bg-slate-100 px-3 py-1 rounded-lg hover:bg-slate-200 transition-colors uppercase">Details</button>
                </div>
               </div>
            </div>
          ))}
        </div>
      </section>

      {/* Main Grid Results */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold text-slate-900">All Results ({filteredProducts.length})</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const stats = calculateProfit(product.costPrice, product.suggestedPrice, 5.00);
            return (
              <div key={product.id} className="bg-white border border-gray-100 rounded-3xl overflow-hidden hover:border-blue-500/50 hover:shadow-xl transition-all group flex flex-col">
                <div className="h-56 overflow-hidden relative">
                  <img src={product.images[0]} className="w-full h-full object-cover" alt="" />
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-lg font-bold">
                    ⭐ {product.rating} ({ (product.sold/1000).toFixed(1) }k sold)
                  </div>
                </div>
                <div className="p-6 space-y-4 flex-1 flex flex-col">
                  <h4 className="font-bold text-slate-900 text-lg leading-tight line-clamp-2">{product.title}</h4>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-slate-50">
                    <div>
                      <p className="text-slate-400 text-xs">Cost</p>
                      <p className="font-bold text-slate-700">${product.costPrice.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Price</p>
                      <p className="font-bold text-slate-900">${product.suggestedPrice.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-2xl">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-blue-500 font-bold">Est. Profit</span>
                      <span className="bg-blue-600 text-white px-2 py-0.5 rounded-lg font-bold">{stats.margin.toFixed(0)}% Margin</span>
                    </div>
                    <p className="text-blue-700 font-extrabold text-lg mt-1">${stats.profit.toFixed(2)}</p>
                  </div>

                  <div className="flex gap-2 pt-2 mt-auto">
                    <button 
                      onClick={() => handleOpenDetails(product)}
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      View Details
                    </button>
                    <button 
                      onClick={() => handleImport(product, product.suggestedPrice.toString())}
                      className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-600/20"
                    >
                      + Import
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* DETAIL MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setSelectedProduct(null)}></div>
          <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-in zoom-in-95 duration-300">
            {/* Left: Images */}
            <div className="md:w-1/2 bg-slate-50 flex items-center justify-center p-8 overflow-y-auto scrollbar-hide">
              <div className="space-y-4 w-full">
                <img src={selectedProduct.images[0]} className="w-full aspect-square object-cover rounded-3xl border border-slate-200 shadow-lg" alt="" />
                <div className="grid grid-cols-4 gap-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="aspect-square bg-slate-200 rounded-xl overflow-hidden border border-slate-300">
                      <img src={`https://picsum.photos/seed/${selectedProduct.id}${i}/300/300`} className="w-full h-full object-cover" alt="" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Info & Calculator */}
            <div className="md:w-1/2 p-10 overflow-y-auto scrollbar-hide space-y-8">
              <button onClick={() => setSelectedProduct(null)} className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider">CJ Dropshipping</span>
                  <span className="text-slate-400 text-sm">{selectedProduct.category}</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900">{selectedProduct.title}</h3>
                <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                  <span className="flex items-center gap-1 text-orange-500">⭐ {selectedProduct.rating}</span>
                  <span>{selectedProduct.sold} sold</span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {selectedProduct.shippingTime} delivery
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 uppercase tracking-widest text-xs">Description</h4>
                <p className="text-slate-500 text-sm leading-relaxed">{selectedProduct.description}</p>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 uppercase tracking-widest text-xs">Variants</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.variants.map(v => (
                    <span key={v} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700">{v}</span>
                  ))}
                </div>
              </div>

              {/* Profit Calculator */}
              <div className="bg-slate-900 p-8 rounded-[2rem] text-white space-y-6">
                <h4 className="font-bold text-blue-400 uppercase tracking-widest text-xs flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  Profit Calculator
                </h4>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Supplier Cost</label>
                    <div className="bg-slate-800 border border-slate-700 rounded-xl py-2 px-4 text-slate-300 font-bold">
                      ${selectedProduct.costPrice.toFixed(2)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Shipping Cost</label>
                    <input 
                      type="number" 
                      value={shippingCost}
                      onChange={(e) => setShippingCost(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-4 text-white font-bold outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Your Selling Price</label>
                    <input 
                      type="number" 
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      className="w-full bg-blue-600 border border-blue-500 rounded-xl py-3 px-6 text-white text-xl font-extrabold outline-none focus:ring-4 ring-blue-500/20 transition-all"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-800 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Platform Fees (3%)</p>
                    <p className="text-lg font-bold">${profitStats?.fees.toFixed(2)}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Profit Margin</p>
                    <p className="text-lg font-bold text-green-400">{profitStats?.margin.toFixed(1)}%</p>
                  </div>
                </div>

                <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-2xl flex justify-between items-center">
                  <span className="font-bold text-green-400">Total Profit Per Sale</span>
                  <span className="text-2xl font-black text-green-400">${profitStats?.profit.toFixed(2)}</span>
                </div>

                <button 
                  onClick={() => handleImport(selectedProduct, sellingPrice)}
                  className="w-full py-4 bg-white hover:bg-slate-100 text-slate-900 font-black rounded-2xl transition-all shadow-xl shadow-white/5 active:scale-[0.98]"
                >
                  Import This Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductResearch;