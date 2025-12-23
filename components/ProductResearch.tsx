import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { SupplierProduct } from '../types';

const CATEGORIES = [
  "All", "Electronics", "Home & Garden", "Pet Supplies", "Beauty",
  "Sports", "Car Accessories", "Baby", "Fashion"
];

// Products will be loaded from CJ Dropshipping API when connected
const SUPPLIER_PRODUCTS: SupplierProduct[] = [];

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
    return SUPPLIER_PRODUCTS.filter(p => {
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
    <div className="p-6 space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg font-medium">
          {toast}
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Product Research</h2>
        <p className="text-gray-500 mt-1">Discover and source winning products directly from global suppliers.</p>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
          >
            {CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
          </select>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min $"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-1/2 bg-gray-50 border border-gray-200 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
            />
            <input
              type="number"
              placeholder="Max $"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-1/2 bg-gray-50 border border-gray-200 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
            />
          </div>
        </div>
        <button
          onClick={() => { setSearch(''); setCategory('All'); setMinPrice(''); setMaxPrice(''); }}
          className="text-gray-500 font-medium text-sm hover:text-indigo-600"
        >
          Clear Filters
        </button>
      </div>

      {/* Trending Horizontal Row */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-orange-500">Trending</span> Products
        </h3>
        {SUPPLIER_PRODUCTS.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">No Products Yet</h4>
            <p className="text-gray-500 text-sm mb-4">Connect your CJ Dropshipping API in Settings to discover trending products.</p>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
              Go to Settings
            </button>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {SUPPLIER_PRODUCTS.slice(0, 10).map((product) => (
              <div key={product.id} className="min-w-[220px] bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all group shrink-0">
                 <div className="h-36 overflow-hidden relative">
                  <img src={product.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="" />
                  <div className="absolute top-2 right-2 bg-indigo-600 text-white text-xs font-medium px-2 py-1 rounded-lg">TRENDING</div>
                 </div>
                 <div className="p-4 space-y-2">
                  <h4 className="font-semibold text-gray-900 text-sm truncate">{product.title}</h4>
                  <p className="text-xs text-gray-500">Cost: ${product.costPrice.toFixed(2)}</p>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-indigo-600 font-bold text-sm">${product.suggestedPrice}</span>
                    <button onClick={() => handleOpenDetails(product)} className="text-xs font-medium bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors">Details</button>
                  </div>
                 </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Main Grid Results */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">All Results ({filteredProducts.length})</h3>
        {filteredProducts.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-900 text-lg mb-2">No Products Found</h4>
            <p className="text-gray-500 mb-6">Connect your CJ Dropshipping API key in Settings to start discovering products.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const stats = calculateProfit(product.costPrice, product.suggestedPrice, 5.00);
              return (
                <div key={product.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all group flex flex-col">
                  <div className="h-48 overflow-hidden relative">
                    <img src={product.images[0]} className="w-full h-full object-cover" alt="" />
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg font-medium">
                      {product.rating} ({(product.sold/1000).toFixed(1)}k sold)
                    </div>
                  </div>
                  <div className="p-5 space-y-4 flex-1 flex flex-col">
                    <h4 className="font-semibold text-gray-900 leading-tight line-clamp-2">{product.title}</h4>

                    <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-gray-100">
                      <div>
                        <p className="text-gray-400 text-xs">Cost</p>
                        <p className="font-semibold text-gray-700">${product.costPrice.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Price</p>
                        <p className="font-semibold text-gray-900">${product.suggestedPrice.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="bg-indigo-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-indigo-600 font-medium">Est. Profit</span>
                        <span className="bg-indigo-600 text-white px-2 py-0.5 rounded font-medium">{stats.margin.toFixed(0)}% Margin</span>
                      </div>
                      <p className="text-indigo-700 font-bold text-lg mt-1">${stats.profit.toFixed(2)}</p>
                    </div>

                    <div className="flex gap-2 pt-2 mt-auto">
                      <button
                        onClick={() => handleOpenDetails(product)}
                        className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors text-gray-700"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleImport(product, product.suggestedPrice.toString())}
                        className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all"
                      >
                        + Import
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* DETAIL MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedProduct(null)}></div>
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
            {/* Left: Images */}
            <div className="md:w-1/2 bg-gray-50 flex items-center justify-center p-6 overflow-y-auto">
              <div className="space-y-4 w-full">
                <img src={selectedProduct.images[0]} className="w-full aspect-square object-cover rounded-xl border border-gray-200" alt="" />
                <div className="grid grid-cols-4 gap-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                      <img src={`https://picsum.photos/seed/${selectedProduct.id}${i}/300/300`} className="w-full h-full object-cover" alt="" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Info & Calculator */}
            <div className="md:w-1/2 p-6 overflow-y-auto space-y-6">
              <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="bg-indigo-600 text-white text-xs font-medium px-2 py-1 rounded">CJ Dropshipping</span>
                  <span className="text-gray-400 text-sm">{selectedProduct.category}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">{selectedProduct.title}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="text-yellow-500">{selectedProduct.rating}</span>
                  <span>{selectedProduct.sold.toLocaleString()} sold</span>
                  <span>{selectedProduct.shippingTime}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 text-sm">Description</h4>
                <p className="text-gray-500 text-sm leading-relaxed">{selectedProduct.description}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 text-sm">Variants</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.variants.map(v => (
                    <span key={v} className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700">{v}</span>
                  ))}
                </div>
              </div>

              {/* Profit Calculator */}
              <div className="bg-gray-900 p-6 rounded-xl text-white space-y-4">
                <h4 className="font-semibold text-indigo-400 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  Profit Calculator
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400">Supplier Cost</label>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-gray-300 font-medium">
                      ${selectedProduct.costPrice.toFixed(2)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400">Shipping Cost</label>
                    <input
                      type="number"
                      value={shippingCost}
                      onChange={(e) => setShippingCost(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white font-medium outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-xs text-gray-400">Your Selling Price</label>
                    <input
                      type="number"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      className="w-full bg-indigo-600 border border-indigo-500 rounded-lg py-3 px-4 text-white text-lg font-bold outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-800 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400">Platform Fees (3%)</p>
                    <p className="text-lg font-semibold">${profitStats?.fees.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Profit Margin</p>
                    <p className="text-lg font-semibold text-green-400">{profitStats?.margin.toFixed(1)}%</p>
                  </div>
                </div>

                <div className="bg-green-500/20 border border-green-500/30 p-4 rounded-lg flex justify-between items-center">
                  <span className="font-medium text-green-400">Total Profit Per Sale</span>
                  <span className="text-2xl font-bold text-green-400">${profitStats?.profit.toFixed(2)}</span>
                </div>

                <button
                  onClick={() => handleImport(selectedProduct, sellingPrice)}
                  className="w-full py-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-lg transition-all"
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
