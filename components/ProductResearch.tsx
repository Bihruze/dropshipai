import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { SupplierProduct } from '../types';
import { Search, Loader2, ShoppingBag, TrendingUp, DollarSign, Package, ExternalLink } from 'lucide-react';

const CATEGORIES = [
  "All", "Electronics", "Home & Garden", "Pet Supplies", "Beauty",
  "Sports", "Car Accessories", "Baby", "Fashion", "Toys"
];

const ProductResearch: React.FC = () => {
  const { importProduct, settings } = useStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<SupplierProduct | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Modal State
  const [sellingPrice, setSellingPrice] = useState<string>('');
  const [shippingCost, setShippingCost] = useState<string>('5.00');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const searchProducts = async () => {
    if (!search.trim()) {
      setError('Lütfen arama terimi girin');
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/cj/products/search?keyword=${encodeURIComponent(search)}&category=${category !== 'All' ? category : ''}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success && data.data) {
        setProducts(data.data);
        if (data.data.length === 0) {
          setError('Ürün bulunamadı. Farklı anahtar kelime deneyin.');
        }
      } else {
        // API bağlı değilse demo veri göster
        setProducts(getDemoProducts(search));
      }
    } catch (err) {
      console.error('Search error:', err);
      // API bağlı değilse demo veri göster
      setProducts(getDemoProducts(search));
    } finally {
      setLoading(false);
    }
  };

  // Demo products for when API is not connected
  const getDemoProducts = (keyword: string): SupplierProduct[] => {
    const k = keyword.toLowerCase();
    const cat = category !== 'All' ? category : 'General';
    const ts = Date.now();

    // Generate varied products based on search
    const baseProducts = [
      { suffix: 'Pro', cost: 15.99, sell: 39.99, rating: 4.7, sold: 2340, ship: "5-10 days", variants: ["Black", "White", "Blue"] },
      { suffix: 'Premium', cost: 22.50, sell: 54.99, rating: 4.9, sold: 5120, ship: "3-7 days", variants: ["Standard", "Deluxe"] },
      { suffix: 'Lite', cost: 8.50, sell: 19.99, rating: 4.3, sold: 1890, ship: "7-14 days", variants: ["One Size"] },
      { suffix: 'Max', cost: 28.00, sell: 69.99, rating: 4.8, sold: 3200, ship: "5-12 days", variants: ["S", "M", "L", "XL"] },
      { suffix: 'Mini', cost: 6.99, sell: 16.99, rating: 4.4, sold: 4500, ship: "10-18 days", variants: ["Red", "Blue", "Green"] },
      { suffix: 'Ultra', cost: 35.00, sell: 89.99, rating: 4.6, sold: 980, ship: "3-8 days", variants: ["Basic", "Advanced"] },
    ];

    return baseProducts.map((p, i) => ({
      id: `demo-${i + 1}-${ts}`,
      title: `${keyword} ${p.suffix}`,
      description: `High quality ${keyword} ${p.suffix.toLowerCase()} version. Perfect for dropshipping with excellent profit margins. Fast shipping available.`,
      images: [`https://picsum.photos/seed/${k}${i}/400/400`],
      costPrice: p.cost,
      suggestedPrice: p.sell,
      category: cat,
      rating: p.rating,
      sold: p.sold,
      shippingTime: p.ship,
      variants: p.variants
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchProducts();
    }
  };

  const handleOpenDetails = (product: SupplierProduct) => {
    setSelectedProduct(product);
    setSellingPrice(product.suggestedPrice.toString());
  };

  const handleImport = (product: SupplierProduct, price: string) => {
    importProduct(product, parseFloat(price));
    setSelectedProduct(null);
    showToast(`"${product.title}" ürünler listesine eklendi!`);
  };

  const calculateProfit = (cost: number, sell: number, ship: number) => {
    const fees = sell * 0.03;
    const profit = sell - cost - ship - fees;
    const margin = (profit / sell) * 100;
    return { profit, margin, fees };
  };

  const profitStats = selectedProduct ? calculateProfit(
    selectedProduct.costPrice,
    parseFloat(sellingPrice) || 0,
    parseFloat(shippingCost) || 0
  ) : null;

  return (
    <div className="p-6 space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg font-medium">
          {toast}
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Ürün Araştırma</h2>
        <p className="text-gray-500 mt-1">CJ Dropshipping'den ürün arayın ve mağazanıza ekleyin</p>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ürün ara... (örn: wireless earbuds, phone case, yoga mat)"
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[180px]"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button
            onClick={searchProducts}
            disabled={loading}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Aranıyor...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Ara
              </>
            )}
          </button>
        </div>

        {/* Quick Search Tags */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-500">Popüler:</span>
          {['Wireless Earbuds', 'Phone Case', 'LED Lights', 'Pet Toys', 'Yoga Mat'].map(tag => (
            <button
              key={tag}
              onClick={() => {
                setSearch(tag);
                setTimeout(() => searchProducts(), 100);
              }}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-600 transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message - only shows for actual errors like no results */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <div className="w-5 h-5 text-yellow-600 mt-0.5">⚠️</div>
          <p className="text-yellow-800">{error}</p>
        </div>
      )}

      {/* Results */}
      {!hasSearched ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-10 h-10 text-indigo-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Ürün Aramaya Başlayın</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            Yukarıdaki arama kutusuna ürün adı yazın ve CJ Dropshipping kataloğunda arama yapın.
          </p>
          <div className="flex justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span>Trend ürünler</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-500" />
              <span>Kar marjı hesaplama</span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-purple-500" />
              <span>Tek tıkla import</span>
            </div>
          </div>
        </div>
      ) : products.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Sonuçlar ({products.length} ürün)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const stats = calculateProfit(product.costPrice, product.suggestedPrice, 5.00);
              return (
                <div key={product.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all">
                  <div className="h-48 bg-gray-100 relative">
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=No+Image';
                      }}
                    />
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
                      ⭐ {product.rating} ({product.sold}+ sold)
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <h4 className="font-semibold text-gray-900 line-clamp-2 min-h-[48px]">
                      {product.title}
                    </h4>

                    <div className="flex justify-between text-sm">
                      <div>
                        <span className="text-gray-500">Maliyet:</span>
                        <span className="font-semibold text-gray-900 ml-1">${product.costPrice.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Satış:</span>
                        <span className="font-semibold text-indigo-600 ml-1">${product.suggestedPrice.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-2 text-center">
                      <span className="text-green-700 font-semibold">
                        💰 ${stats.profit.toFixed(2)} kar ({stats.margin.toFixed(0)}%)
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenDetails(product)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        Detay
                      </button>
                      <button
                        onClick={() => handleImport(product, product.suggestedPrice.toString())}
                        className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                      >
                        + Ekle
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Ürün Bulunamadı</h3>
          <p className="text-gray-500">Farklı anahtar kelimeler veya kategori deneyin.</p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedProduct(null)} />
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full z-10"
            >
              ✕
            </button>

            <div className="p-6 space-y-6">
              {/* Product Image */}
              <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden">
                <img
                  src={selectedProduct.images[0]}
                  alt={selectedProduct.title}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x400?text=No+Image';
                  }}
                />
              </div>

              {/* Product Info */}
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedProduct.title}</h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span>⭐ {selectedProduct.rating}</span>
                  <span>{selectedProduct.sold}+ satış</span>
                  <span>📦 {selectedProduct.shippingTime}</span>
                </div>
                <p className="text-gray-600 mt-3">{selectedProduct.description}</p>
              </div>

              {/* Variants */}
              {selectedProduct.variants.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Varyantlar</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.variants.map(v => (
                      <span key={v} className="px-3 py-1 bg-gray-100 rounded-lg text-sm">{v}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Profit Calculator */}
              <div className="bg-gray-900 rounded-xl p-6 text-white space-y-4">
                <h4 className="font-semibold text-indigo-400">Kar Hesaplama</h4>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-gray-400">Maliyet</label>
                    <div className="text-lg font-bold">${selectedProduct.costPrice.toFixed(2)}</div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Kargo</label>
                    <input
                      type="number"
                      value={shippingCost}
                      onChange={(e) => setShippingCost(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Satış Fiyatı</label>
                    <input
                      type="number"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      className="w-full bg-indigo-600 border border-indigo-500 rounded px-2 py-1 text-white font-bold"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                  <span className="text-gray-400">Tahmini Kar:</span>
                  <span className="text-2xl font-bold text-green-400">
                    ${profitStats?.profit.toFixed(2)} ({profitStats?.margin.toFixed(0)}%)
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleImport(selectedProduct, sellingPrice)}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors"
              >
                Ürünlere Ekle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductResearch;
