import React, { useState, useEffect } from 'react';
import { getPurchaseOrdersList } from '../services/api';
const PurchaseOrders = () => {
    const [poList, setPoList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPo, setSelectedPo] = useState(null);
    useEffect(() => {
        fetchPOs();
    }, []);
    const fetchPOs = async () => {
        setLoading(true);
        try {
            const res = await getPurchaseOrdersList();
            setPoList(res.data || []);
            if (res.data && res.data.length > 0) {
                setSelectedPo(res.data[0]);
            }
        } catch (err) {
            console.error("Failed to fetch POs:", err);
        } finally {
            setLoading(false);
        }
    };
    const storeInfo = {
        name: "Pharmacy Store",
        address: "Hospital Premises, Main Road",
        gstin: "27AADCP0000X0Z0"
    };
    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <span className="material-symbols-outlined animate-spin text-4xl text-[#006591]">progress_activity</span>
                    <p className="mt-4 text-slate-600 font-medium">Loading Autonomous PO Workspace...</p>
                </div>
            </div>
        );
    }
    if (!selectedPo) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-6">
                <div className="bg-white p-12 rounded-sm border border-slate-200 shadow-sm text-center max-w-md">
                    <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">inventory_2</span>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">No Purchase Orders Found</h2>
                    <p className="text-sm text-slate-500 mb-6">The AI agent hasn't generated any restock orders yet. This usually happens when stock levels are healthy.</p>
                    <button onClick={fetchPOs} className="bg-[#006591] text-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-sm shadow-sm flex items-center gap-2 mx-auto">
                        <span className="material-symbols-outlined text-[18px]">refresh</span>
                        Check Again
                    </button>
                </div>
            </div>
        );
    }
    const taxable_amount = parseFloat(selectedPo.total_amount) || 0;
    const cgst_amount = taxable_amount * 0.06;
    const sgst_amount = taxable_amount * 0.06;
    const total_amount_with_tax = taxable_amount + cgst_amount + sgst_amount;
    return (
        <div className="flex-1 flex gap-6 p-6 overflow-hidden animate-in fade-in duration-500 h-[calc(100vh-80px)]">
            {/* Left Column: PO Preview */}
            <div className="w-[70%] bg-white shadow-sm border border-slate-200 rounded-sm flex flex-col overflow-hidden">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-bold">
                    <div className="flex items-center gap-4">
                        <h2 className="uppercase tracking-widest flex items-center gap-2 text-slate-800">
                            <span className="material-symbols-outlined text-[16px] text-[#006591]">receipt_long</span>
                            Purchase Order Preview
                        </h2>
                        <select
                            className="bg-white border border-slate-300 px-2 py-1 rounded-sm outline-none"
                            value={selectedPo.id}
                            onChange={(e) => setSelectedPo(poList.find(p => p.id === parseInt(e.target.value)))}
                        >
                            {poList.map(p => (
                                <option key={p.id} value={p.id}>{p.po_number}</option>
                            ))}
                        </select>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-tighter rounded-sm ${selectedPo.status === 'Draft' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {selectedPo.status}
                    </span>
                </div>
                <div className="flex-1 overflow-y-auto p-8 bg-white print:p-0 print:overflow-visible">
                    <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{selectedPo.hospital_name || storeInfo.name}</h1>
                            <p className="text-xs text-slate-500 mt-1 max-w-sm">{selectedPo.hospital_address || storeInfo.address}</p>
                            <p className="text-xs font-bold text-slate-800 mt-2">GSTIN: <span className="font-normal">{selectedPo.hospital_gstin || storeInfo.gstin}</span></p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-xl font-bold text-[#006591] uppercase tracking-widest">Purchase Order</h2>
                            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-left">
                                <span className="font-bold text-slate-500 uppercase">PO No:</span>
                                <span className="font-mono font-bold text-slate-900">{selectedPo.po_number}</span>
                                <span className="font-bold text-slate-500 uppercase">Date:</span>
                                <span className="font-medium text-slate-900">{new Date(selectedPo.po_date || selectedPo.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mb-8 p-4 bg-slate-50 rounded-sm border border-slate-200">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">To (Supplier):</p>
                        <h3 className="text-sm font-bold text-slate-800 uppercase">{selectedPo.supplier_name || 'UNKNOWN VENDOR'}</h3>
                        <p className="text-xs text-slate-600 mt-0.5 italic text-slate-400">Vendor master record linked via ID: {selectedPo.vendor_id}</p>
                    </div>
                    {/* Itemized Detail Table */}
                    <div className="mb-6 border border-slate-200 rounded-sm overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#eff4ff] border-b border-slate-200">
                                <tr>
                                    <th className="px-3 py-2 text-[10px] uppercase tracking-wider font-bold text-[#006591] border-r border-[#006591]/10">#</th>
                                    <th className="px-3 py-2 text-[10px] uppercase tracking-wider font-bold text-[#006591] border-r border-[#006591]/10">Product/Item Details</th>
                                    <th className="px-3 py-2 text-[10px] uppercase tracking-wider font-bold text-[#006591] border-r border-[#006591]/10 text-center">HSN</th>
                                    <th className="px-3 py-2 text-[10px] uppercase tracking-wider font-bold text-[#006591] border-r border-[#006591]/10 text-right">Qty</th>
                                    <th className="px-3 py-2 text-[10px] uppercase tracking-wider font-bold text-[#006591] border-r border-[#006591]/10 text-right">Unit Price</th>
                                    <th className="px-3 py-2 text-[10px] uppercase tracking-wider font-bold text-[#006591] text-right">Total (Ex.Tax)</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs bg-white tabular-nums">
                                <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="px-3 py-2 border-r border-slate-100 text-slate-500">1</td>
                                    <td className="px-3 py-2 border-r border-slate-100 font-bold text-slate-800">Critical Supply Batch (Paracetamol / Antibiotics)</td>
                                    <td className="px-3 py-2 border-r border-slate-100 text-slate-500 text-center">300490</td>
                                    <td className="px-3 py-2 border-r border-slate-100 text-right">500 Box</td>
                                    <td className="px-3 py-2 border-r border-slate-100 text-right">₹{((taxable_amount * 0.4) / 500).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="px-3 py-2 text-right font-medium">₹{(taxable_amount * 0.4).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                </tr>
                                <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="px-3 py-2 border-r border-slate-100 text-slate-500">2</td>
                                    <td className="px-3 py-2 border-r border-slate-100 font-bold text-slate-800">General Ward Essentials (Syringes / Fluids)</td>
                                    <td className="px-3 py-2 border-r border-slate-100 text-slate-500 text-center">901840</td>
                                    <td className="px-3 py-2 border-r border-slate-100 text-right">1000 Pcs</td>
                                    <td className="px-3 py-2 border-r border-slate-100 text-right">₹{((taxable_amount * 0.4) / 1000).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="px-3 py-2 text-right font-medium">₹{(taxable_amount * 0.4).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                </tr>
                                <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="px-3 py-2 border-r border-slate-100 text-slate-500">3</td>
                                    <td className="px-3 py-2 border-r border-slate-100 font-bold text-[#006591]">AI Seasonal Adjustment (Flu/Fever Kit)</td>
                                    <td className="px-3 py-2 border-r border-slate-100 text-slate-500 text-center">MULT</td>
                                    <td className="px-3 py-2 border-r border-slate-100 text-right">Bulk Assorted</td>
                                    <td className="px-3 py-2 border-r border-slate-100 text-right italic font-normal text-slate-400">Variable</td>
                                    <td className="px-3 py-2 text-right font-medium">₹{(taxable_amount * 0.2).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-end print:w-full mt-12">
                        <div className="w-1/2 border border-slate-200 rounded-sm p-4 bg-white shadow-sm print:w-full print:border-none print:p-0 print:shadow-none">
                            <div className="flex justify-between mb-2 text-xs">
                                <span className="font-bold text-slate-500">Taxable Value:</span>
                                <span className="font-medium tabular-nums">₹{taxable_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between mb-2 text-xs">
                                <span className="font-bold text-slate-500">Estimated GST (12%):</span>
                                <span className="font-medium tabular-nums">₹{(taxable_amount * 0.12).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-sm border-t border-slate-200 pt-3 mt-3">
                                <span className="font-black text-slate-900 uppercase">Total Value:</span>
                                <span className="font-black text-slate-900 tabular-nums">₹{(taxable_amount * 1.12).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Right Column: AI Reason */}
            <div className="w-[30%] bg-white shadow-sm border border-slate-200 rounded-sm flex flex-col overflow-hidden print:hidden">
                <div className="px-4 py-4 bg-[#006591] text-white border-b border-[#006591]/20 flex items-center gap-3">
                    <span className="material-symbols-outlined text-[24px]">smart_toy</span>
                    <div>
                        <h2 className="text-sm font-bold leading-tight">Restock Intelligence</h2>
                        <p className="text-[10px] text-[#c9e6ff] font-medium uppercase tracking-wider">Automated Inventory Logic</p>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-50">
                    <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-[#006591] mb-2 flex items-center gap-1">
                            <span className="material-symbols-outlined !text-[14px]">psychology</span>
                            Trigger Reasoning
                        </p>
                        <p className="text-xs text-slate-800 leading-relaxed">
                            {selectedPo.ai_reason || "The AI agent detected dynamic shifts in historical consumption and seasonal demand. This PO was generated to prevent inventory stockouts."}
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm mt-auto">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-red-600 mb-1 flex items-center gap-1">
                            <span className="material-symbols-outlined !text-[14px]">gavel</span>
                            Verification Checklist
                        </p>
                        <ul className="text-[10px] text-slate-600 space-y-1 list-disc ml-4">
                            <li>Verify HSN code compliance</li>
                            <li>Check vendor's last fulfilment time</li>
                            <li>Validate tax slab (Central vs State)</li>
                        </ul>
                    </div>
                </div>
                <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <button className="w-full bg-white border border-slate-300 text-slate-700 px-4 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-slate-50 transition-colors rounded-sm shadow-sm flex items-center justify-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-[16px]">print</span>
                        Export PDF
                    </button>
                    <button className="w-full bg-[#006591] text-white px-4 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#004c6e] transition-colors rounded-sm shadow-sm flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">send</span>
                        Approve & Dispatch
                    </button>
                </div>
            </div>
        </div>
    );
};
export default PurchaseOrders;
