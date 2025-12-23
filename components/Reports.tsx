import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, DollarSign, ShoppingCart, Package, BarChart3 } from 'lucide-react';

const Reports: React.FC = () => {
  const { orders, products } = useStore();
  const [dateRange, setDateRange] = useState('7d');

  // Calculate real stats from orders
  const stats = useMemo(() => {
    const now = new Date();
    const daysAgo = dateRange === '30d' ? 30 : 7;
    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    const filteredOrders = orders.filter(o => new Date(o.orderDate) >= cutoffDate);

    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.totalPrice, 0);
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Estimate profit (30% margin assumption for demo)
    const totalProfit = totalRevenue * 0.30;

    return { totalRevenue, totalProfit, totalOrders, avgOrderValue };
  }, [orders, dateRange]);

  // Orders by status for pie chart
  const statusData = useMemo(() => {
    const statusCounts: Record<string, number> = {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    };

    orders.forEach(o => {
      if (statusCounts[o.status] !== undefined) {
        statusCounts[o.status]++;
      }
    });

    return [
      { name: 'Beklemede', value: statusCounts.pending, color: '#f59e0b' },
      { name: 'İşleniyor', value: statusCounts.processing, color: '#f97316' },
      { name: 'Kargoda', value: statusCounts.shipped, color: '#3b82f6' },
      { name: 'Teslim Edildi', value: statusCounts.delivered, color: '#10b981' },
      { name: 'İptal', value: statusCounts.cancelled, color: '#ef4444' },
    ].filter(s => s.value > 0);
  }, [orders]);

  // Products by category for bar chart
  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    products.forEach(p => {
      const cat = p.category || 'Diğer';
      categories[cat] = (categories[cat] || 0) + 1;
    });

    return Object.entries(categories)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [products]);

  // Daily revenue for area chart (last 7 or 30 days)
  const dailyData = useMemo(() => {
    const days = dateRange === '30d' ? 30 : 7;
    const data: { date: string; revenue: number; profit: number; orders: number }[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayOrders = orders.filter(o =>
        o.orderDate.split('T')[0] === dateStr
      );

      const revenue = dayOrders.reduce((sum, o) => sum + o.totalPrice, 0);
      const profit = revenue * 0.30;

      data.push({
        date: date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
        revenue,
        profit,
        orders: dayOrders.length
      });
    }

    return data;
  }, [orders, dateRange]);

  // Top products by quantity in orders
  const topProducts = useMemo(() => {
    const productSales: Record<string, { name: string; sold: number; revenue: number }> = {};

    orders.forEach(order => {
      order.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name: item.title, sold: 0, revenue: 0 };
        }
        productSales[item.productId].sold += item.quantity;
        productSales[item.productId].revenue += item.price * item.quantity;
      });
    });

    return Object.values(productSales)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5)
      .map(p => ({
        ...p,
        profit: p.revenue * 0.30,
        margin: 30
      }));
  }, [orders]);

  const hasData = orders.length > 0 || products.length > 0;

  // Empty State
  if (!hasData) {
    return (
      <div className="p-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analitik</h2>
          <p className="text-gray-500 mt-1">Mağaza performansınızı takip edin</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-10 h-10 text-indigo-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Henüz Veri Yok</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            Siparişler ve ürünler eklendikçe burada analitik veriler görünecek.
          </p>
          <div className="flex justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-500" />
              <span>{products.length} ürün</span>
            </div>
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-green-500" />
              <span>{orders.length} sipariş</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analitik</h2>
          <p className="text-gray-500 mt-1">Mağaza performansınızı takip edin</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="7d">Son 7 Gün</option>
            <option value="30d">Son 30 Gün</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Toplam Gelir</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</p>
        </div>

        <div className="bg-white border border-gray-200 p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Tahmini Kar</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">${stats.totalProfit.toFixed(2)}</p>
        </div>

        <div className="bg-white border border-gray-200 p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">Toplam Sipariş</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
        </div>

        <div className="bg-white border border-gray-200 p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-sm text-gray-500">Ort. Sipariş Değeri</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">${stats.avgOrderValue.toFixed(2)}</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Gelir ve Kar</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} axisLine={false} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Area type="monotone" dataKey="revenue" name="Gelir" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              <Area type="monotone" dataKey="profit" name="Kar" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Status */}
        {statusData.length > 0 && (
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sipariş Durumları</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Products by Category */}
        {categoryData.length > 0 && (
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Kategorilere Göre Ürünler</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} axisLine={false} tickLine={false} />
                  <YAxis dataKey="category" type="category" stroke="#94a3b8" fontSize={11} axisLine={false} tickLine={false} width={100} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="count" name="Ürün Sayısı" fill="#6366f1" radius={[0, 8, 8, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Top Products Table */}
      {topProducts.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">En Çok Satan Ürünler</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs font-medium uppercase">
                <tr>
                  <th className="px-6 py-4">#</th>
                  <th className="px-6 py-4">Ürün</th>
                  <th className="px-6 py-4">Satış</th>
                  <th className="px-6 py-4">Gelir</th>
                  <th className="px-6 py-4">Kar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topProducts.map((prod, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-400">{idx + 1}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{prod.name}</td>
                    <td className="px-6 py-4 text-gray-700">{prod.sold}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">${prod.revenue.toFixed(2)}</td>
                    <td className="px-6 py-4 text-green-600 font-medium">${prod.profit.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info Note */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
        <div className="text-blue-500 mt-0.5">ℹ️</div>
        <div>
          <p className="text-blue-800 font-medium">Veri Notu</p>
          <p className="text-blue-600 text-sm mt-1">
            Kar tahminleri %30 marj üzerinden hesaplanmıştır. Gerçek kar oranları ürüne göre değişebilir.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Reports;
