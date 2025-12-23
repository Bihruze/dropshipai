import React, { useState, useMemo } from 'react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

// --- Mock Data Generators ---

interface AnalyticsDataPoint {
  date: string;
  revenue: number;
  profit: number;
  orders: number;
}

const generateAnalyticsData = (days: number = 7): AnalyticsDataPoint[] => {
  const data: AnalyticsDataPoint[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const revenue = Math.floor(Math.random() * 500) + 200;
    const profit = Math.floor(revenue * (0.35 + Math.random() * 0.25));
    const orders = Math.floor(Math.random() * 15) + 5;
    data.push({
      date: date.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      revenue,
      profit,
      orders
    });
  }
  return data;
};

const getOrdersByStatus = () => [
  { name: 'Pending', value: 3, color: '#f59e0b' },
  { name: 'Processing', value: 5, color: '#f97316' },
  { name: 'Shipped', value: 12, color: '#3b82f6' },
  { name: 'Delivered', value: 45, color: '#10b981' },
  { name: 'Cancelled', value: 2, color: '#ef4444' },
];

const getSalesByCategory = () => [
  { category: "Pet Supplies", revenue: 2450 },
  { category: "Car Accessories", revenue: 1820 },
  { category: "Electronics", revenue: 1540 },
  { category: "Home & Garden", revenue: 980 },
  { category: "Beauty", revenue: 650 }
].sort((a, b) => b.revenue - a.revenue);

const getDayOfWeekSales = () => [
  { day: 'Mon', sales: 420 },
  { day: 'Tue', sales: 380 },
  { day: 'Wed', sales: 510 },
  { day: 'Thu', sales: 490 },
  { day: 'Fri', sales: 650 },
  { day: 'Sat', sales: 820 },
  { day: 'Sun', sales: 740 },
];

const getTopProducts = () => [
  { name: "Self-Cleaning Pet Brush", sold: 45, revenue: 1124, profit: 652, margin: 58 },
  { name: "Magnetic Car Mount", sold: 32, revenue: 607, profit: 412, margin: 68 },
  { name: "RGB LED Strip 5m", sold: 28, revenue: 979, profit: 504, margin: 51 },
  { name: "Wireless Earbuds", sold: 24, revenue: 718, profit: 287, margin: 40 },
  { name: "Phone Ring Holder", sold: 56, revenue: 504, profit: 336, margin: 67 }
];

// --- Sub-components ---

const StatCard: React.FC<{ title: string; value: string; trend: string; trendUp: boolean }> = ({ title, value, trend, trendUp }) => (
  <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{title}</p>
    <div className="flex items-end justify-between mt-3">
      <h3 className="text-2xl font-black text-slate-900">{value}</h3>
      <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {trendUp ? (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
        ) : (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
        )}
        {trend}
      </div>
    </div>
    <p className="text-[10px] text-slate-400 mt-2 font-medium">vs previous period</p>
  </div>
);

const Reports: React.FC = () => {
  const [dateRange, setDateRange] = useState('7d');
  const [isExporting, setIsExporting] = useState(false);

  const analyticsData = useMemo(() => generateAnalyticsData(dateRange === '30d' ? 30 : 7), [dateRange]);
  const statusData = useMemo(() => getOrdersByStatus(), []);
  const categoryData = useMemo(() => getSalesByCategory(), []);
  const dayOfWeekData = useMemo(() => getDayOfWeekSales(), []);
  const productsData = useMemo(() => getTopProducts(), []);

  const totals = useMemo(() => {
    const rev = analyticsData.reduce((acc, curr) => acc + curr.revenue, 0);
    const prof = analyticsData.reduce((acc, curr) => acc + curr.profit, 0);
    const ord = analyticsData.reduce((acc, curr) => acc + curr.orders, 0);
    return {
      revenue: rev,
      profit: prof,
      orders: ord,
      aov: ord > 0 ? rev / ord : 0
    };
  }, [analyticsData]);

  const handleExport = (type: 'csv' | 'pdf') => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert(`${type.toUpperCase()} Export started...`);
    }, 1000);
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold heading-font text-slate-900">Reports & Analytics</h2>
          <p className="text-slate-500">Track your store's performance and financial growth.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none cursor-pointer focus:ring-2 ring-blue-500/10"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="month">This Month</option>
          </select>
          <div className="flex gap-2">
            <button 
              onClick={() => handleExport('csv')}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl text-xs font-bold border border-slate-200 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              CSV
            </button>
            <button 
              onClick={() => handleExport('pdf')}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={`$${totals.revenue.toLocaleString()}`} trend="12%" trendUp={true} />
        <StatCard title="Total Profit" value={`$${totals.profit.toLocaleString()}`} trend="8%" trendUp={true} />
        <StatCard title="Total Orders" value={totals.orders.toString()} trend="5" trendUp={true} />
        <StatCard title="Avg Order Value" value={`$${totals.aov.toFixed(2)}`} trend="3%" trendUp={false} />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-black text-slate-900">Revenue vs Profit</h4>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Profit</span>
              </div>
            </div>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData}>
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
                  contentStyle={{ border: 'none', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Orders by Status */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <h4 className="text-lg font-black text-slate-900">Orders by Status</h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ border: 'none', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Category */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <h4 className="text-lg font-black text-slate-900">Sales by Category</h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} axisLine={false} tickLine={false} hide />
                <YAxis dataKey="category" type="category" stroke="#94a3b8" fontSize={11} axisLine={false} tickLine={false} width={100} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ border: 'none', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Sales by Day of Week */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <h4 className="text-lg font-black text-slate-900">Sales by Day of Week</h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeekData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} axisLine={false} tickLine={false} />
                <Tooltip 
                   cursor={{ fill: '#f8fafc' }}
                   contentStyle={{ border: 'none', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="sales" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
          <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h4 className="text-lg font-black text-slate-900">Top Selling Products</h4>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ordered by Volume</span>
          </div>
          <table className="w-full text-left">
            <thead className="bg-white border-b border-slate-100 text-slate-400 text-[9px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">#</th>
                <th className="px-8 py-4">Product</th>
                <th className="px-8 py-4">Sold</th>
                <th className="px-8 py-4">Revenue</th>
                <th className="px-8 py-4">Profit</th>
                <th className="px-8 py-4">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productsData.map((prod, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5 text-xs font-black text-slate-400">{idx + 1}</td>
                  <td className="px-8 py-5 font-bold text-sm text-slate-900">{prod.name}</td>
                  <td className="px-8 py-5 text-sm text-slate-700">{prod.sold}</td>
                  <td className="px-8 py-5 font-bold text-sm text-slate-900">${prod.revenue.toLocaleString()}</td>
                  <td className="px-8 py-5 text-sm text-green-600 font-bold">${prod.profit.toLocaleString()}</td>
                  <td className="px-8 py-5">
                    <span className="px-2 py-1 bg-green-50 text-green-700 text-[10px] font-black rounded-lg">
                      {prod.margin}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;