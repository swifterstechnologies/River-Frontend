import React, { useState, useMemo } from 'react';
import { deleteProduct, updateProduct, addProduct } from '../services/api';
const Inventory = ({ inventory, fetchData }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [editingProduct, setEditingProduct] = useState(null);
    const { totalSkus, lowStockCount, expiringBatchesCount, inventoryValuation } = useMemo(() => {
        const total = inventory.length;
        const low = inventory.filter(i => i.stock_quantity < (i.min_stock_level || 10)).length;
        const expiring = inventory.filter(i => {
            if (!i.last_expiry) return false;
            const days = (new Date(i.last_expiry) - new Date()) / (1000 * 60 * 60 * 24);
            return days < 60 && days > 0;
        }).length;
        const valuation = inventory.reduce((sum, i) => sum + (i.stock_quantity * i.unit_price), 0);
        return { totalSkus: total, lowStockCount: low, expiringBatchesCount: expiring, inventoryValuation: valuation };
    }, [inventory]);
    const filteredInventory = useMemo(() => {
        return inventory.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.hsn_code && item.hsn_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (item.last_batch && item.last_batch.toLowerCase().includes(searchTerm.toLowerCase()));
            let matchesStatus = true;
            if (statusFilter === 'low') matchesStatus = item.stock_quantity < (item.min_stock_level || 10);
            if (statusFilter === 'optimal') matchesStatus = item.stock_quantity >= (item.min_stock_level || 10);
            return matchesSearch && matchesStatus;
        });
    }, [inventory, searchTerm, statusFilter]);
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to remove this product from inventory?")) return;
        try {
            await deleteProduct(id);
            fetchData();
        } catch (err) {
            alert("Delete failed.");
        }
    };
    const handleSaveEdit = async () => {
        if (!editingProduct.name) return alert("Product Name is required");
        if (!editingProduct.category) return alert("Category is required");
        if (editingProduct.unit_price < 0) return alert("Price cannot be negative");
        if (!editingProduct.id && editingProduct.stock_quantity > 0 && !editingProduct.last_expiry) {
            return alert("Expiry Date is required if stock is being added");
        }
        try {
            if (editingProduct.id) {
                await updateProduct(editingProduct.id, editingProduct);
            } else {
                await addProduct(editingProduct);
            }
            setEditingProduct(null);
            fetchData();
        } catch (err) {
            alert("Save failed: " + err.message);
        }
    };
    return (
        <div className="flex-1 flex flex-col overflow-hidden gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Current Stock List</h2>
                    <p className="text-xs text-slate-500 mt-1">View all available medicines, their stock levels, and details.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => fetchData()} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-slate-50 transition-colors rounded-sm shadow-sm flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">refresh</span>
                        Refresh Data
                    </button>
                    <button onClick={() => setEditingProduct({ name: '', sku: '', hsn_code: '', category: 'GENERAL', unit_price: 0, mrp: 0, gst_percent: 0, stock_quantity: 0, min_stock_level: 10, manufacturer: '', composition: '', last_batch: '', last_expiry: '', uom: 'STRIP', pack_size: '10', location: '' })} className="bg-[#006591] text-white px-5 py-2 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity rounded-sm shadow-sm flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Manual Entry
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white p-4 border-l-4 border-[#006591] shadow-sm rounded-sm">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Total Different Items</p>
                    <p className="text-2xl font-bold tabular-nums text-slate-900">{totalSkus}</p>
                </div>
                <div className="bg-white p-4 border-l-4 border-amber-500 shadow-sm rounded-sm">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Low Stock Alerts</p>
                    <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold tabular-nums text-amber-600">{lowStockCount}</p>
                        {lowStockCount > 0 && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 font-bold rounded-sm uppercase">Action Req</span>}
                    </div>
                </div>
                <div className="bg-white p-4 border-l-4 border-rose-700 shadow-sm rounded-sm">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Expiring &lt; 60 Days</p>
                    <p className="text-2xl font-bold tabular-nums text-rose-700">{expiringBatchesCount}</p>
                </div>
                <div className="bg-white p-4 border-l-4 border-emerald-600 shadow-sm rounded-sm">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Estimated Valuation</p>
                    <p className="text-2xl font-bold tabular-nums text-slate-900">₹{inventoryValuation.toLocaleString()}</p>
                </div>
            </div>
            <div className="flex-1 bg-white shadow-sm border border-slate-200 flex flex-col overflow-hidden rounded-sm">
                <div className="px-4 py-3 bg-slate-50 flex justify-between items-center border-b border-slate-200">
                    <div className="flex items-center gap-4 relative w-full max-w-2xl">
                        <div className="relative flex-1">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                            <input
                                type="text"
                                placeholder="Search by name, SKU, or batch..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white border border-slate-300 text-xs font-semibold text-slate-700 focus:ring-1 focus:ring-[#006591] focus:border-[#006591] py-1.5 pl-9 pr-3 rounded-sm outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-slate-400 text-[18px]">filter_alt</span>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-white border border-slate-300 text-xs font-semibold text-slate-700 focus:ring-1 focus:ring-[#006591] focus:border-[#006591] py-1.5 pl-3 pr-8 rounded-sm outline-none"
                            >
                                <option value="all">All Statuses</option>
                                <option value="optimal">Optimal Stock</option>
                                <option value="low">Low Stock</option>
                            </select>
                        </div>
                    </div>
                    <button className="bg-white border border-slate-300 px-3 py-1.5 text-[10px] font-bold uppercase hover:bg-slate-100 transition-colors text-slate-700 rounded-sm shadow-sm flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">download</span>
                        Export CSV
                    </button>
                </div>
                <div className="flex-1 overflow-x-auto overflow-y-auto">
                    <table className="hidden md:table w-full text-left border-collapse min-w-[1100px]">
                        <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10 shadow-sm">
                            <tr>
                                <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-r border-slate-200 w-1/4">Product & Category</th>
                                <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-r border-slate-200">Item Code / Batch</th>
                                <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-r border-slate-200 text-right">Stock Level</th>
                                <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-r border-slate-200 text-center">Expiry Date</th>
                                <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-r border-slate-200 text-right">Rate / MRP (₹)</th>
                                <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-r border-slate-200 text-center">Status</th>
                                <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs tabular-nums bg-white">
                            {filteredInventory.map(item => {
                                const isLowStock = item.stock_quantity < item.min_stock_level;
                                const stockPercentage = Math.min(100, Math.max(0, (item.stock_quantity / (item.min_stock_level * 3)) * 100));
                                const daysToExpiry = item.expiry_date ? Math.ceil((new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)) : Infinity;
                                const isRedAlert = daysToExpiry > 0 && daysToExpiry <= 90;
                                const isYellowAlert = daysToExpiry > 90 && daysToExpiry <= 180;
                                let rowClass = 'border-b border-slate-100 hover:bg-slate-50 transition-colors group ';
                                if (isRedAlert) {
                                    rowClass += 'bg-red-50 hover:bg-red-100/80 border-l-4 border-l-red-500';
                                } else if (isYellowAlert) {
                                    rowClass += 'bg-amber-50 hover:bg-amber-100/80 border-l-4 border-l-amber-500';
                                } else if (isLowStock) {
                                    rowClass += 'bg-red-50/20';
                                }
                                return (
                                    <tr key={item.id} className={rowClass}>
                                        <td className="px-4 py-3 border-r border-slate-200">
                                            <p className="font-bold text-[#006591] text-[13px]">{item.name}</p>
                                            <p className="text-[10px] text-slate-500 font-medium italic mb-1">{item.composition || 'Salt composition not recorded'}</p>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-500 bg-slate-100 px-1 rounded-sm">MEDICINE</span>
                                                {item.manufacturer && <span className="text-[9px] font-bold text-[#006591] flex items-center gap-0.5"><span className="material-symbols-outlined text-[10px]">factory</span>{item.manufacturer}</span>}
                                                {item.hsn_code && <span className="text-[9px] bg-slate-50 text-slate-400 px-1 rounded-sm border border-slate-100">HSN: {item.hsn_code}</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 border-r border-slate-200">
                                            <p className="font-mono text-slate-500 text-[11px] mb-0.5">SKU: {item.id}</p>
                                            <p className="font-mono text-slate-800 font-semibold text-[11px]">BCH: {item.last_batch || 'N/A'}</p>
                                        </td>
                                        <td className="px-4 py-3 border-r border-slate-200 text-right">
                                            <p className="font-bold text-[14px] text-slate-900 mb-1">{item.stock_quantity} <span className="text-[10px] font-normal text-slate-500">Units</span></p>
                                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex justify-end">
                                                <div className={`${isLowStock ? 'bg-red-500' : 'bg-emerald-500'} h-full`} style={{ width: `${stockPercentage}%` }}></div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 border-r border-slate-200 text-center">
                                            <p className="font-semibold text-slate-800">{item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : 'N/A'}</p>
                                        </td>
                                        <td className="px-4 py-3 border-r border-slate-200 text-right">
                                            <p className="font-semibold text-slate-900">₹{item.unit_price}</p>
                                            {item.mrp && <p className="text-[10px] text-slate-400 line-through decoration-slate-300 mt-0.5">₹{item.mrp}</p>}
                                        </td>
                                        <td className="px-4 py-3 border-r border-slate-200 text-center">
                                            <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-tighter rounded-sm ${isLowStock ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                                {isLowStock ? 'LOW STOCK' : 'OPTIMAL'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button onClick={() => setEditingProduct(item)} className="text-slate-400 hover:text-[#006591] transition-colors p-1 rounded-sm hover:bg-slate-100" title="Edit Product">
                                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded-sm hover:bg-red-50 ml-1" title="Delete Product">
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredInventory.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="py-20 text-center text-slate-400 font-medium italic">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="material-symbols-outlined text-[48px] opacity-20">inventory_2</span>
                                            <p className="text-sm">No products found in Master Inventory.</p>
                                            <p className="text-[10px] font-normal not-italic opacity-60 max-w-[200px] mx-auto">Start by adding items via Inbound GRN or use the "Manual Entry" button above.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    <div className="md:hidden flex flex-col divide-y divide-slate-100">
                        {filteredInventory.map(item => {
                            const isLowStock = item.stock_quantity < item.min_stock_level;
                            return (
                                <div key={item.id} onClick={() => setEditingProduct(item)} className="p-4 active:bg-slate-50 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-bold text-[#006591] text-sm">{item.name}</p>
                                            <p className="text-[10px] text-slate-500 font-medium italic">{item.composition || 'No composition'}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 text-[8px] font-bold uppercase rounded-sm ${isLowStock ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {isLowStock ? 'Low' : 'OK'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-y-3 mt-3">
                                        <div>
                                            <p className="text-[9px] uppercase font-bold text-slate-400">Stock</p>
                                            <p className="text-sm font-bold text-slate-900">{item.stock_quantity} <span className="text-[10px] font-normal text-slate-500">{item.uom || 'Units'}</span></p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] uppercase font-bold text-slate-400">Batch</p>
                                            <p className="text-sm font-mono font-semibold text-slate-700">{item.last_batch || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] uppercase font-bold text-slate-400">Expiry</p>
                                            <p className="text-sm font-semibold text-slate-800">{item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] uppercase font-bold text-slate-400">Rate</p>
                                            <p className="text-sm font-bold text-slate-900">₹{item.unit_price}</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-50">
                                        <button onClick={(e) => { e.stopPropagation(); setEditingProduct(item); }} className="text-slate-500 flex items-center gap-1 text-[10px] font-bold uppercase">
                                            <span className="material-symbols-outlined text-[16px]">edit</span> Edit
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="text-red-500 flex items-center gap-1 text-[10px] font-bold uppercase ml-4">
                                            <span className="material-symbols-outlined text-[16px]">delete</span> Del
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="px-4 py-3 bg-white border-t border-slate-200 flex justify-between items-center shadow-sm">
                    <p className="text-xs text-slate-500 font-medium">Showing <span className="font-bold text-slate-800">1</span> to <span className="font-bold text-slate-800">{filteredInventory.length}</span> of <span className="font-bold text-slate-800">{inventory.length}</span> products</p>
                    <div className="flex gap-1">
                        <button className="px-2 py-1 bg-white border border-slate-300 text-slate-500 hover:bg-slate-50 rounded-sm shadow-sm disabled:opacity-50 text-[11px] font-bold">Prev</button>
                        <button className="px-2 py-1 bg-white border border-slate-300 text-slate-500 hover:bg-slate-50 rounded-sm shadow-sm disabled:opacity-50 text-[11px] font-bold">Next</button>
                    </div>
                </div>
            </div>
            {editingProduct && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white rounded-t-lg sm:rounded-sm shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in fade-in slide-in-from-bottom-10 sm:zoom-in duration-300">
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#006591]">{editingProduct.id ? 'edit' : 'add_box'}</span>
                                {editingProduct.id ? 'Edit Product Metadata' : 'Manual Inventory Entry'}
                            </h3>
                            <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-slate-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
                            <div className="col-span-2">
                                <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Product Name</label>
                                <input
                                    type="text"
                                    value={editingProduct.name}
                                    onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                    className="w-full border border-slate-300 rounded-sm px-3 py-2 text-sm focus:ring-1 focus:ring-[#006591] outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">SKU / Code</label>
                                <input
                                    type="text"
                                    value={editingProduct.sku || ''}
                                    onChange={e => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                                    className="w-full border border-slate-300 rounded-sm px-3 py-2 text-sm focus:ring-1 focus:ring-[#006591] outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">HSN Code</label>
                                <input
                                    type="text"
                                    value={editingProduct.hsn_code || ''}
                                    onChange={e => setEditingProduct({ ...editingProduct, hsn_code: e.target.value })}
                                    className="w-full border border-slate-300 rounded-sm px-3 py-2 text-sm focus:ring-1 focus:ring-[#006591] outline-none"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Salt / Formula</label>
                                <textarea
                                    value={editingProduct.composition || ''}
                                    onChange={e => setEditingProduct({ ...editingProduct, composition: e.target.value })}
                                    className="w-full border border-slate-300 rounded-sm px-3 py-2 text-sm focus:ring-1 focus:ring-[#006591] outline-none h-20 resize-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Manufacturer</label>
                                <input
                                    type="text"
                                    value={editingProduct.manufacturer || ''}
                                    onChange={e => setEditingProduct({ ...editingProduct, manufacturer: e.target.value })}
                                    className="w-full border border-slate-300 rounded-sm px-3 py-2 text-sm focus:ring-1 focus:ring-[#006591] outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Category</label>
                                <input
                                    type="text"
                                    value={editingProduct.category || ''}
                                    onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                                    className="w-full border border-slate-300 rounded-sm px-3 py-2 text-sm focus:ring-1 focus:ring-[#006591] outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Purchase Rate (₹)</label>
                                <input
                                    type="number"
                                    value={editingProduct.unit_price || 0}
                                    onChange={e => setEditingProduct({ ...editingProduct, unit_price: parseFloat(e.target.value) })}
                                    className="w-full border border-slate-300 rounded-sm px-3 py-2 text-sm focus:ring-1 focus:ring-[#006591] outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">MRP (₹)</label>
                                <input
                                    type="number"
                                    value={editingProduct.mrp || 0}
                                    onChange={e => setEditingProduct({ ...editingProduct, mrp: parseFloat(e.target.value) })}
                                    className="w-full border border-slate-300 rounded-sm px-3 py-2 text-sm focus:ring-1 focus:ring-[#006591] outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">GST %</label>
                                <input
                                    type="number"
                                    value={editingProduct.gst_percent || 0}
                                    onChange={e => setEditingProduct({ ...editingProduct, gst_percent: parseFloat(e.target.value) })}
                                    className="w-full border border-slate-300 rounded-sm px-3 py-2 text-sm focus:ring-1 focus:ring-[#006591] outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Min Stock Level</label>
                                <input
                                    type="number"
                                    value={editingProduct.min_stock_level || 0}
                                    onChange={e => setEditingProduct({ ...editingProduct, min_stock_level: parseInt(e.target.value) })}
                                    className="w-full border border-slate-300 rounded-sm px-3 py-2 text-sm focus:ring-1 focus:ring-[#006591] outline-none"
                                />
                            </div>
                            <div className="border-t border-slate-100 col-span-2 my-2 pt-4">
                                <p className="text-[10px] font-bold text-[#006591] mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[14px]">label</span>
                                    ENRICHED METADATA
                                </p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Unit (Strip, Box, etc.)</label>
                                <input
                                    type="text"
                                    value={editingProduct.uom || ''}
                                    onChange={e => setEditingProduct({ ...editingProduct, uom: e.target.value })}
                                    className="w-full border border-slate-300 rounded-sm px-3 py-2 text-sm focus:ring-1 focus:ring-[#006591] outline-none"
                                    placeholder="e.g. STRIP, BOTTLE"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Pack Size</label>
                                <input
                                    type="text"
                                    value={editingProduct.pack_size || ''}
                                    onChange={e => setEditingProduct({ ...editingProduct, pack_size: e.target.value })}
                                    className="w-full border border-slate-300 rounded-sm px-3 py-2 text-sm focus:ring-1 focus:ring-[#006591] outline-none"
                                    placeholder="e.g. 10, 15, 100ml"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Storage Location (Shelf/Aisle)</label>
                                <input
                                    type="text"
                                    value={editingProduct.location || ''}
                                    onChange={e => setEditingProduct({ ...editingProduct, location: e.target.value })}
                                    className="w-full border border-slate-300 rounded-sm px-3 py-2 text-sm focus:ring-1 focus:ring-[#006591] outline-none"
                                    placeholder="e.g. Shelf A-1, Cold Storage"
                                />
                            </div>
                            <div className="border-t border-slate-100 col-span-2 my-2 pt-4">
                                <p className="text-[10px] font-bold text-[#006591] mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[14px]">inventory_2</span>
                                    CURRENT BATCH & STOCK INFO
                                </p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Current Stock Qty</label>
                                <input
                                    type="number"
                                    value={editingProduct.stock_quantity || 0}
                                    onChange={e => setEditingProduct({ ...editingProduct, stock_quantity: parseInt(e.target.value) })}
                                    className="w-full border border-emerald-300 bg-emerald-50/20 rounded-sm px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none font-bold"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Batch Number</label>
                                <input
                                    type="text"
                                    placeholder="e.g. BT1234"
                                    value={editingProduct.last_batch || ''}
                                    onChange={e => setEditingProduct({ ...editingProduct, last_batch: e.target.value })}
                                    className="w-full border border-slate-300 rounded-sm px-3 py-2 text-sm focus:ring-1 focus:ring-[#006591] outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Expiry Date</label>
                                <input
                                    type="date"
                                    value={editingProduct.last_expiry ? (editingProduct.last_expiry.includes('T') ? editingProduct.last_expiry.split('T')[0] : editingProduct.last_expiry) : ''}
                                    onChange={e => setEditingProduct({ ...editingProduct, last_expiry: e.target.value })}
                                    className="w-full border border-slate-300 rounded-sm px-3 py-2 text-sm focus:ring-1 focus:ring-[#006591] outline-none"
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                            <button
                                onClick={() => setEditingProduct(null)}
                                className="px-4 py-2 text-xs font-bold uppercase text-slate-600 hover:text-slate-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="bg-[#006591] text-white px-6 py-2 text-xs font-bold uppercase tracking-wider rounded-sm shadow-sm hover:opacity-90"
                            >
                                {editingProduct.id ? 'Save Changes' : 'Add to Inventory'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default Inventory;
