
import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Product } from '../types';

const Inventory: React.FC = () => {
  const { products, setView, setEditingProduct, updateProduct, deleteProduct } = useStore();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'draft'>('all');

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchesTab = activeTab === 'all' || p.status === activeTab;
      const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [products, activeTab, search]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-[#202223]">Products</h1>
        <div className="flex gap-2">
           <button className="bg-white border border-[#babec3] text-[#202223] px-3 py-1.5 rounded-md text-xs font-bold hover:bg-[#f6f6f7]">Export</button>
           <button className="bg-white border border-[#babec3] text-[#202223] px-3 py-1.5 rounded-md text-xs font-bold hover:bg-[#f6f6f7]">Import</button>
           <button 
            onClick={() => setView('product-new')}
            className="bg-[#008060] text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-[#006e52]"
           >
            Add product
           </button>
        </div>
      </div>

      <div className="polaris-card overflow-hidden">
        <div className="flex border-b border-[#e1e3e5]">
           {['all', 'active', 'draft'].map(tab => (
             <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-3 text-xs font-bold capitalize transition-colors border-b-2 ${activeTab === tab ? 'border-[#008060] text-[#008060]' : 'border-transparent text-[#6d7175]'}`}
             >
              {tab}
             </button>
           ))}
        </div>

        <div className="p-3 border-b border-[#e1e3e5] bg-white">
          <div className="relative max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6d7175]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Filter products"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#f6f6f7] border border-[#babec3] rounded-md py-1.5 pl-9 pr-4 text-xs focus:ring-1 ring-[#008060] outline-none"
            />
          </div>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-bold uppercase text-[#6d7175] border-b border-[#e1e3e5] bg-[#fcfcfc]">
              <th className="px-4 py-2 w-10"><input type="checkbox" className="rounded" /></th>
              <th className="px-4 py-2">Product</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Inventory</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2 text-right">Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e1e3e5] text-xs">
            {filtered.map(p => (
              <tr key={p.id} onClick={() => setEditingProduct(p.id)} className="hover:bg-[#f6f6f7] cursor-pointer transition-colors group">
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}><input type="checkbox" className="rounded" /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={p.imageUrl} className="w-10 h-10 rounded border border-[#e1e3e5] object-cover" />
                    <span className="font-bold text-[#202223] group-hover:underline">{p.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                   <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${p.status === 'active' ? 'bg-[#e3f1df] text-[#008060]' : 'bg-[#f6f6f7] text-[#6d7175]'}`}>
                    {p.status}
                   </span>
                </td>
                <td className={`px-4 py-3 font-medium ${p.stock <= p.lowStockThreshold ? 'text-[#cc3300]' : 'text-[#6d7175]'}`}>
                  {p.stock} in stock
                </td>
                <td className="px-4 py-3 text-[#6d7175]">{p.category}</td>
                <td className="px-4 py-3 text-right font-bold">${p.price.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filtered.length === 0 && (
          <div className="p-12 text-center text-[#6d7175]">
             <p className="text-sm">No products found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;
