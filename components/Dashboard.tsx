
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from '../store/useStore';

const StatCard: React.FC<{ title: string; value: string; trend: string; trendUp: boolean }> = ({ title, value, trend, trendUp }) => (
  <div className="polaris-card p-5">
    <p className="text-[#6d7175] text-[11px] font-bold uppercase tracking-wider">{title}</p>
    <div className="flex items-end justify-between mt-2">
      <h3 className="text-xl font-bold text-[#202223]">{value}</h3>
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${trendUp ? 'bg-[#e3f1df] text-[#008060]' : 'bg-[#fff4f4] text-[#cc3300]'}`}>
        {trend}
      </span>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const { products, orders, setView } = useStore();

  const stats = useMemo(() => {
    const totalSales = orders.reduce((acc, curr) => acc + curr.totalPrice, 0);
    const totalOrders = orders.length;
    const activeItems = products.filter(p => p.status === 'active').length;
    const totalProfit = orders.reduce((acc, order) => {
      const cost = order.items.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
      return acc + (order.totalPrice - cost);
    }, 0);
    const margin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
    return { totalSales, totalOrders, activeItems, margin };
  }, [products, orders]);

  // Generate chart data based on actual orders or use stable seed
  const chartData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date().getDay();

    // Use orders data to generate realistic chart data
    const ordersByDay = days.map((day, index) => {
      const dayOrders = orders.filter(order => {
        const orderDay = new Date(order.orderDate).getDay();
        // Convert Sunday=0 to match our Mon=0 format
        const normalizedOrderDay = orderDay === 0 ? 6 : orderDay - 1;
        return normalizedOrderDay === index;
      });

      const daySales = dayOrders.reduce((sum, order) => sum + order.totalPrice, 0);

      // If no real data, use a stable baseline value based on day index
      // This prevents random regeneration on every render
      const baselineSales = daySales || (120 + (index * 15) + (index % 2 ? 30 : 0));

      return {
        name: day,
        sales: Math.round(baselineSales),
      };
    });

    return ordersByDay;
  }, [orders]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-4">
         <h1 className="text-xl font-bold text-[#202223]">Performance Overview</h1>
         <div className="flex gap-2">
            <button className="bg-white border border-[#babec3] text-[#202223] px-3 py-1.5 rounded-md text-xs font-bold hover:bg-[#f6f6f7]">Last 7 days</button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Sales" value={`$${stats.totalSales.toFixed(2)}`} trend="+12.5%" trendUp={true} />
        <StatCard title="Total Orders" value={stats.totalOrders.toString()} trend="+4.3%" trendUp={true} />
        <StatCard title="Active Products" value={stats.activeItems.toString()} trend="+2" trendUp={true} />
        <StatCard title="Gross Margin" value={`${stats.margin.toFixed(1)}%`} trend="+0.2%" trendUp={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="polaris-card p-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-sm font-bold text-[#202223]">Sales over time</h4>
            <span className="text-xs text-[#6d7175]">Total: $1,245.00</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" vertical={false} />
                <XAxis dataKey="name" stroke="#6d7175" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#6d7175" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e1e3e5', borderRadius: '4px', fontSize: '10px' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#008060" strokeWidth={2} fill="#e3f1df" fillOpacity={0.4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="polaris-card p-6 flex flex-col justify-between">
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-[#202223]">Daily Checklist</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-[#f6f6f7] rounded-md border border-[#e1e3e5]">
                 <div className="w-4 h-4 rounded-full border-2 border-[#008060] flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-[#008060]"></div>
                 </div>
                 <span className="text-xs font-medium text-[#202223]">Approve {orders.filter(o => o.status === 'pending').length} pending orders</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#f6f6f7] rounded-md border border-[#e1e3e5]">
                 <div className="w-4 h-4 rounded-full border-2 border-[#babec3]"></div>
                 <span className="text-xs font-medium text-[#202223]">Research niche: Home Decor</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setView('orders')}
            className="w-full mt-6 bg-[#008060] hover:bg-[#006e52] text-white py-2 rounded-md text-xs font-bold transition-colors"
          >
            Review all tasks
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
