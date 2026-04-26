import React, { useState } from 'react';
const Dashboard = ({ inventory, stats }) => {
    const localInventoryValue = inventory.reduce((sum, item) => sum + (item.stock_quantity * item.unit_price), 0);
    const localLowStockCount = inventory.filter(i => i.stock_quantity <= i.min_stock_level).length;
    const displayValuation = stats?.total_valuation || localInventoryValue;
    const displayLowStock = stats?.low_stock_count || localLowStockCount;
    const displaySKUs = stats?.total_skus || inventory.length;
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-3 border-l-4 border-[#006591] shadow-sm">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Total Inventory Value</p>
                    <p className="text-xl font-bold tabular-nums text-slate-900">₹{parseFloat(displayValuation).toLocaleString()}</p>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-[#006591] font-semibold">
                        <span className="material-symbols-outlined !text-[14px]">inventory_2</span>
                        <span>{displaySKUs} Active SKUs</span>
                    </div>
                </div>
                <div className="bg-white p-3 border-l-4 border-[#0ea5e9] shadow-sm">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Active Suppliers</p>
                    <p className="text-xl font-bold tabular-nums text-slate-900">{stats?.total_suppliers || 0}</p>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-600 font-semibold">
                        <span className="material-symbols-outlined !text-[14px]">local_shipping</span>
                        <span>Registered</span>
                    </div>
                </div>
                <div className="bg-white p-3 border-l-4 border-[#b02d21] shadow-sm">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Low Stock Alerts</p>
                    <p className="text-xl font-bold tabular-nums text-[#b02d21]">{displayLowStock}</p>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-[#b02d21] font-semibold">
                        <span className="material-symbols-outlined !text-[14px]">warning</span>
                        <span>Immediate restock</span>
                    </div>
                </div>
                <div className="bg-white p-3 border-l-4 border-slate-800 shadow-sm">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Total Purchase Volume</p>
                    <p className="text-xl font-bold tabular-nums text-slate-900">₹{(stats?.recent_revenue || 0).toLocaleString()}</p>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-600 font-semibold">
                        <span className="material-symbols-outlined !text-[14px]">wallet</span>
                        <span>Last 10 GRNs</span>
                    </div>
                </div>
            </div>
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="w-full bg-white shadow-sm flex flex-col border border-slate-200">
                    <div className="px-4 py-3 bg-slate-50 flex flex-col md:flex-row justify-between items-center border-b border-slate-200 gap-4">
                        <h2 className="text-xs font-extrabold uppercase tracking-widest flex items-center gap-2 text-slate-800">
                            <span className="w-1.5 h-1.5 bg-[#0ea5e9]"></span>
                            Inventory Overview
                        </h2>
                        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                            <button className="bg-white border border-slate-300 px-3 py-1.5 text-[10px] font-bold uppercase hover:bg-slate-100 transition-colors text-slate-700 rounded-sm shadow-sm flex items-center gap-1.5 w-full md:w-auto justify-center">
                                <span className="material-symbols-outlined text-[14px]">download</span>
                                Export CSV
                            </button>
                            <button className="bg-[#006591] text-white px-3 py-1.5 text-[10px] font-bold uppercase hover:opacity-90 transition-opacity rounded-sm shadow-sm w-full md:w-auto">Full View</button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-200">
                                    <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-r border-slate-200/50">Product Name</th>
                                    <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-r border-slate-200/50">Category</th>
                                    <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-r border-slate-200/50">Stock</th>
                                    <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">Value (Rate)</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs tabular-nums text-slate-800">
                                {inventory.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-4 py-8 text-center text-slate-400 font-medium italic">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="material-symbols-outlined text-[32px] opacity-20">inventory</span>
                                                <span>No products in stock. Start by adding items via Inbound GRN or Manual Entry.</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    inventory.slice(0, 10).map((row, idx) => (
                                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 border-r border-slate-100 font-semibold text-[#006591]">{row.name}</td>
                                            <td className="px-4 py-3 border-r border-slate-100">{row.category}</td>
                                            <td className="px-4 py-3 border-r border-slate-100 text-right">
                                                <span className={`px-2 py-0.5 rounded-sm font-bold ${row.stock_quantity <= row.min_stock_level ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                    {row.stock_quantity}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-right">₹{parseFloat(row.unit_price).toFixed(2)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Dashboard;
