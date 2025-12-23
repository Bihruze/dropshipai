import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Order, OrderStatus } from '../types';

type OrderTab = 'all' | OrderStatus;

const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const styles: Record<OrderStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    approved: 'bg-blue-100 text-blue-700 border-blue-200',
    processing: 'bg-orange-100 text-orange-700 border-orange-200',
    shipped: 'bg-green-100 text-green-700 border-green-200',
    delivered: 'bg-slate-100 text-slate-700 border-slate-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${styles[status]}`}>
      {status}
    </span>
  );
};

const Orders: React.FC = () => {
  const { orders, approveOrder, rejectOrder, processOrder, shipOrder, seedOrders } = useStore();
  const [activeTab, setActiveTab] = useState<OrderTab>('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const pendingCount = orders.filter(o => o.status === 'pending').length;

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesTab = activeTab === 'all' || o.status === activeTab;
      const matchesSearch = 
        o.orderNumber.toLowerCase().includes(search.toLowerCase()) || 
        o.customerName.toLowerCase().includes(search.toLowerCase()) ||
        o.customerEmail.toLowerCase().includes(search.toLowerCase());
      return matchesTab && matchesSearch;
    }).sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
  }, [orders, activeTab, search]);

  const handleProcessOrder = async (id: string) => {
    setLoading(id);
    const order = orders.find(o => o.id === id);
    await new Promise(r => setTimeout(r, 1500));
    processOrder(id);
    setLoading(null);
    showToast('Order sent to supplier for fulfillment');

    // Simulate shipping after a few seconds
    setTimeout(() => {
      const trackNum = "YT" + Math.floor(Math.random() * 1000000000);
      shipOrder(id, {
        number: trackNum,
        carrier: 'YunExpress',
        url: `https://track.yunexpress.com/track?tracking=${trackNum}`
      });
      showToast(`Order ${order?.orderNumber || id} has been shipped!`);
    }, 5000);
  };

  const handleApprove = (id: string) => {
    approveOrder(id);
    showToast('Order approved');
  };

  const handleReject = (id: string) => {
    if(confirm('Reject this order and cancel it?')) {
      rejectOrder(id);
      showToast('Order cancelled');
    }
  };

  const getProfit = (order: Order) => {
    const totalCost = order.items.reduce((sum, item) => sum + item.cost * item.quantity, 0);
    return order.totalPrice - totalCost;
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      {toast && (
        <div className="fixed top-20 right-8 z-[200] bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl font-bold border border-slate-700 animate-in slide-in-from-right-full">
          {toast}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold heading-font text-slate-900">Orders</h2>
          <p className="text-slate-500">Manage customer orders and fulfillment status.</p>
        </div>
        <button 
          onClick={seedOrders}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-all"
        >
          Seed Mock Orders
        </button>
      </div>

      {pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div>
              <p className="font-bold text-amber-900">Pending Approval</p>
              <p className="text-sm text-amber-700">You have {pendingCount} orders waiting for your manual review.</p>
            </div>
          </div>
          <button 
            onClick={() => orders.filter(o => o.status === 'pending').forEach(o => handleApprove(o.id))}
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-600/20 transition-all"
          >
            Process All
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-hide">
        {(['all', 'pending', 'approved', 'processing', 'shipped', 'delivered', 'cancelled'] as OrderTab[]).map(tab => {
          const count = orders.filter(o => tab === 'all' ? true : o.status === tab).length;
          return (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-sm font-bold transition-all border-b-2 capitalize whitespace-nowrap flex items-center gap-2 ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              {tab}
              {count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="w-full md:w-96 relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input 
            type="text" 
            placeholder="Search by order #, customer name..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-blue-500 transition-all text-sm"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto ml-auto">
          <input type="date" className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none" />
          <select className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none">
            <option>All Stores</option>
            <option>Shopify Main</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Order #</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4 text-center">Items</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4">Profit</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOrders.map((order) => {
              const profit = getProfit(order);
              return (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-black text-slate-900">{order.orderNumber}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs">
                      <p className="font-bold text-slate-700">{new Date(order.orderDate).toLocaleDateString()}</p>
                      <p className="text-slate-400">{new Date(order.orderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs">
                      <p className="font-bold text-slate-900">{order.customerName}</p>
                      <p className="text-slate-400">{order.shippingAddress.city}, {order.shippingAddress.country}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs font-bold text-slate-700">{order.items.length}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-black text-slate-900">${order.totalPrice.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-green-600">+${profit.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {order.status === 'pending' && (
                        <>
                          <button onClick={() => handleApprove(order.id)} title="Approve" className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></button>
                          <button onClick={() => handleReject(order.id)} title="Reject" className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </>
                      )}
                      {order.status === 'approved' && (
                        <button 
                          onClick={() => handleProcessOrder(order.id)} 
                          className="px-3 py-1.5 bg-blue-600 text-white text-[10px] font-black rounded-lg hover:bg-blue-700 transition-all flex items-center gap-1"
                        >
                          {loading === order.id ? 'Sending...' : 'Process'}
                        </button>
                      )}
                      <button onClick={() => setSelectedOrder(order)} className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-lg transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredOrders.length === 0 && (
          <div className="p-20 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-400">No orders found</h3>
            <p className="text-slate-400">Your customer orders will appear here once your store is synced.</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}></div>
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-black text-slate-900">Order {selectedOrder.orderNumber}</h3>
                  <StatusBadge status={selectedOrder.status} />
                </div>
                <p className="text-xs font-bold text-slate-400">Shopify ID: {selectedOrder.shopifyOrderId} • placed on {new Date(selectedOrder.orderDate).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-white rounded-full text-slate-400 transition-colors border border-transparent hover:border-slate-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto scrollbar-hide p-8 space-y-10">
              {/* Status Timeline */}
              <div className="relative flex justify-between items-center px-4 max-w-2xl mx-auto">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -z-10 -translate-y-1/2"></div>
                {['pending', 'approved', 'processing', 'shipped'].map((st, idx) => {
                  const isDone = ['pending', 'approved', 'processing', 'shipped'].indexOf(selectedOrder.status) >= idx;
                  return (
                    <div key={st} className="flex flex-col items-center gap-2">
                      <div className={`w-8 h-8 rounded-full border-4 flex items-center justify-center transition-all ${isDone ? 'bg-blue-600 border-blue-100 scale-110' : 'bg-white border-slate-100'}`}>
                        {isDone && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-wider ${isDone ? 'text-blue-600' : 'text-slate-300'}`}>{st}</span>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Customer Details</h4>
                  <div className="bg-slate-50 p-6 rounded-3xl space-y-3">
                    <p className="font-bold text-slate-900">{selectedOrder.customerName}</p>
                    <p className="text-sm text-blue-600 font-medium underline">{selectedOrder.customerEmail}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Shipping Address</h4>
                  <div className="bg-slate-50 p-6 rounded-3xl text-sm text-slate-600 leading-relaxed">
                    <p>{selectedOrder.shippingAddress.address1}</p>
                    {selectedOrder.shippingAddress.address2 && <p>{selectedOrder.shippingAddress.address2}</p>}
                    <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.zip}</p>
                    <p className="font-bold text-slate-900">{selectedOrder.shippingAddress.country}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Order Items</h4>
                <div className="border border-slate-100 rounded-3xl divide-y divide-slate-100 overflow-hidden">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <img src={item.imageUrl} className="w-14 h-14 rounded-xl object-cover border border-slate-200" alt="" />
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{item.title}</p>
                          <p className="text-xs text-slate-400">Quantity: {item.quantity}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900 text-sm">${item.price.toFixed(2)}</p>
                        <p className="text-[10px] text-slate-400 font-bold">Cost: ${item.cost.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tracking Info</h4>
                  <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-3xl">
                    {selectedOrder.trackingNumber ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-blue-800">Carrier: {selectedOrder.carrier}</span>
                          <span className="text-xs font-mono font-bold text-blue-600 bg-white px-2 py-1 rounded-lg border border-blue-100">{selectedOrder.trackingNumber}</span>
                        </div>
                        <a 
                          href={selectedOrder.trackingUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="w-full py-3 bg-blue-600 text-white rounded-xl text-center text-xs font-black block hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                        >
                          Track Package
                        </a>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 font-medium italic">Tracking will be available once the order is shipped by the supplier.</p>
                    )}
                  </div>
                </div>

                <div className="bg-slate-900 p-8 rounded-[2rem] text-white space-y-4">
                  <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span className="text-white">${selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <span>Shipping</span>
                    <span className="text-white">${selectedOrder.shippingTotal.toFixed(2)}</span>
                  </div>
                  <div className="pt-4 border-t border-slate-800 flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Estimated Profit</p>
                      <p className="text-3xl font-black text-green-400">+${getProfit(selectedOrder).toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Grand Total</p>
                      <p className="text-xl font-black text-white">${selectedOrder.totalPrice.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
              {selectedOrder.status === 'pending' && (
                <>
                  <button onClick={() => { handleApprove(selectedOrder.id); setSelectedOrder(null); }} className="flex-1 py-4 bg-green-600 text-white font-black rounded-2xl hover:bg-green-700 transition-all shadow-xl shadow-green-600/20">Approve Order</button>
                  <button onClick={() => { handleReject(selectedOrder.id); setSelectedOrder(null); }} className="px-8 py-4 border border-red-200 text-red-600 font-bold rounded-2xl hover:bg-red-50 transition-all">Reject Order</button>
                </>
              )}
              {selectedOrder.status === 'approved' && (
                <button onClick={() => { handleProcessOrder(selectedOrder.id); setSelectedOrder(null); }} className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20">Send to Supplier</button>
              )}
              <button className="flex-1 py-4 bg-white border border-slate-200 text-slate-900 font-bold rounded-2xl hover:bg-slate-100 transition-all">Contact Customer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;