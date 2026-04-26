import React, { useState, useEffect } from 'react';
import { addProduct, getSuppliers, autoProcessGRN } from '../services/api';
import { X } from 'lucide-react';
const GRNStepper = ({
    step, setStep,
    inputText, setInputText,
    handleProcessInput, handleFileUpload,
    startVoiceInput, stopVoiceInput, isRecording,
    extractedItems, setExtractedItems, handleCommit,
    loading, committing,
    selectedVendor, setSelectedVendor,
    suppliers = [],
    invoiceNumber, setInvoiceNumber,
    invoiceDate, setInvoiceDate,
    paymentMode, setPaymentMode,
    showToast
}) => {
    const [catalogModalItem, setCatalogModalItem] = useState(null);
    const [catalogFormData, setCatalogFormData] = useState({ category: 'Tablet', hsn_code: '3004', dosage_forms: 'Tablet, Capsule, Syrup', manufacturer: '', composition: '' });
    const [savingCatalog, setSavingCatalog] = useState(false);
    const [localSuppliers, setLocalSuppliers] = useState(suppliers);
    const [isAutoProcessing, setIsAutoProcessing] = useState(false);
    const [autoInvoice, setAutoInvoice] = useState(null); 
    const [autoSupplier, setAutoSupplier] = useState(null); 
    const [batchCategory, setBatchCategory] = useState('Tablet');
    const [batchHSN, setBatchHSN] = useState('3004');
    useEffect(() => {
        getSuppliers().then(res => {
            if (res.data) setLocalSuppliers(res.data);
        }).catch(console.error);
    }, []);
    const handleAutoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsAutoProcessing(true);
        try {
            const res = await autoProcessGRN(file);
            if (res.success) {
                if (res.invoice) {
                    setAutoInvoice(res.invoice);
                    if (res.invoice.invoiceNumber) setInvoiceNumber(res.invoice.invoiceNumber);
                    if (res.invoice.invoiceDate) setInvoiceDate(res.invoice.invoiceDate);
                }
                if (res.supplier) {
                    setAutoSupplier(res.supplier);
                    setSelectedVendor(String(res.supplier.id));
                    getSuppliers().then(r => { if (r.data) setLocalSuppliers(r.data); });
                }
                setExtractedItems(res.items || []);
                if (res.newProductsCount > 0) {
                    showToast(`${res.newProductsCount} new products auto-created in catalog`, 'info');
                }
                setStep(2);
            } else {
                showToast(res.message || 'Auto-processing failed. Please try manual entry.', 'error');
            }
        } catch (err) {
            showToast('Auto-process failed: ' + err.message, 'error');
        } finally {
            setIsAutoProcessing(false);
        }
    };
    const onCommit = async (vendorName) => {
        const success = await handleCommit(vendorName);
        if (success) {
            setTimeout(() => showToast('Synced to Zoho Books', 'zoho'), 600);
            setAutoInvoice(null);
            setAutoSupplier(null);
        }
    };
    const moveNext = () => setStep(prev => prev + 1);
    const moveBack = () => setStep(prev => prev - 1);
    const handleSaveCatalog = async () => {
        if (!catalogFormData.category || !catalogFormData.hsn_code) { showToast('Please fill in Category and HSN code.', 'error'); return; }
        setSavingCatalog(true);
        try {
            const newItem = {
                name: catalogModalItem.name, category: catalogFormData.category,
                hsn: catalogFormData.hsn_code, dosage_forms: catalogFormData.dosage_forms.split(',').map(s => s.trim()).filter(Boolean),
                manufacturer: catalogFormData.manufacturer,
                composition: catalogFormData.composition
            };
            await addProduct(newItem);
            const newItems = [...extractedItems];
            newItems[catalogModalItem.index] = {
                ...newItems[catalogModalItem.index],
                matched: true, matchedName: newItem.name, category: newItem.category,
                hsn_code: newItem.hsn, dosage_forms: newItem.dosage_forms, selectedForm: newItem.dosage_forms[0] || '',
                manufacturer: newItem.manufacturer,
                composition: newItem.composition
            };
            setExtractedItems(newItems);
            setCatalogModalItem(null);
            showToast(`Registered ${newItem.name} in master catalog`, 'success');
        } catch (err) { showToast('Failed to save: ' + err.message, 'error'); }
        finally { setSavingCatalog(false); }
    };
    const handleBulkMapNewItems = () => {
        const unmatched = extractedItems.filter(i => !i.matched);
        if (unmatched.length === 0) return;
        const newItems = extractedItems.map(item => {
            if (!item.matched) {
                return {
                    ...item,
                    matched: true,
                    category: batchCategory || item.category || 'Tablet',
                    hsn_code: batchHSN || item.hsn_code || '3004',
                    dosage_forms: item.dosage_forms || ['Tablet'],
                    selectedForm: (item.dosage_forms && item.dosage_forms[0]) || 'Tablet',
                    is_new_catalog_item: true
                };
            }
            return item;
        });
        setExtractedItems(newItems);
        showToast(`Commonly mapped ${unmatched.length} items as "${batchCategory}" with HSN "${batchHSN}".`, 'success');
    };
    const addItemManually = () => {
        const newItem = {
            name: '',
            batch: '',
            expiry_date: '',
            quantity: 1,
            rate: 0,
            mrp: 0,
            gst: 12,
            uom: 'STRIP',
            pack_size: '10',
            hsn_code: '3004',
            matched: false,
            dosage_forms: ['Tablet', 'Capsule', 'Syrup'],
            selectedForm: 'Tablet'
        };
        setExtractedItems(prev => [...prev, newItem]);
    };
    const removeRow = (index) => {
        const newItems = [...extractedItems];
        newItems.splice(index, 1);
        setExtractedItems(newItems);
    };
    const exceptionCount = extractedItems.filter(i => !i.matched).length;
    const totalValue = extractedItems.reduce((sum, item) => {
        const qty = parseFloat(item.quantity) || 0;
        const rate = parseFloat(item.rate) || 0;
        return sum + (qty * rate);
    }, 0);
    return (
        <div className="flex-1 flex flex-col h-full animate-in fade-in duration-500">
            {step === 1 && (
                <div id="view-capture" className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
                    <div className="w-full max-w-3xl flex flex-col items-center">
                        <h2 className="text-xl font-extrabold text-slate-900 mb-1 tracking-tight">Add Purchase Bill</h2>
                        <p className="text-xs text-slate-500 mb-8 font-medium">Capture bill data via PDF or Image to update stock.</p>
                        <div className="w-full bg-white p-8 shadow-sm border border-slate-200 flex flex-col items-center">
                            <label className="w-full border-2 border-dashed border-slate-300 hover:border-[#006591] transition-colors p-14 bg-slate-50 flex flex-col items-center justify-center cursor-pointer mb-6 rounded-sm relative">
                                {isAutoProcessing && (
                                    <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-10 rounded-sm">
                                        <span className="material-symbols-outlined animate-spin text-[#006591] text-[36px] mb-2">progress_activity</span>
                                        <p className="text-xs font-bold text-[#006591]">AI Reading Invoice...</p>
                                        <p className="text-[10px] text-slate-500 mt-1">Extracting items, matching catalog, resolving supplier</p>
                                    </div>
                                )}
                                <span className="material-symbols-outlined text-[40px] text-slate-400 mb-3">document_scanner</span>
                                <p className="text-sm font-bold text-slate-700">Drag & drop supplier invoice</p>
                                <p className="text-[11px] text-slate-500 mt-1">Accepts PDF, JPG, or PNG</p>
                                <input type="file" accept=".pdf,image/*" className="hidden" onChange={handleAutoUpload} />
                            </label>
                            <button
                                onClick={handleProcessInput}
                                disabled={loading || !inputText.trim()}
                                className="mt-8 bg-[#006591] text-white px-8 py-3 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity w-full rounded-sm shadow-sm disabled:opacity-50 flex justify-center"
                            >
                                {loading ? 'Reading Bill...' : 'Process Bill Details'}
                            </button>
                            <button
                                onClick={() => {
                                    setExtractedItems([]);
                                    setStep(2);
                                }}
                                className="mt-4 text-[#006591] text-xs font-bold uppercase tracking-wider hover:underline transition-all"
                            >
                                Skip & Enter Manually
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {step === 2 && (
                <div id="view-verify" className="flex-1 flex flex-col p-6 overflow-y-auto animate-in slide-in-from-right-8 duration-300">
                    <div className="flex flex-col gap-4 mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 border border-slate-200 shadow-sm rounded-sm">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">Supplier / Distributor</label>
                                <select
                                    value={selectedVendor}
                                    onChange={(e) => setSelectedVendor(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 text-sm font-bold text-[#006591] focus:ring-1 focus:ring-[#006591] focus:border-[#006591] py-2 px-3 rounded-sm outline-none transition-all"
                                >
                                    <option value="">-- Select Supplier --</option>
                                    {localSuppliers.map(v => <option key={v.id || v.name} value={v.id}>{v.name}</option>)}
                                    <option value="Other / Manual Entry">Other / Manual Entry</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">Invoice Number</label>
                                <input
                                    type="text"
                                    value={invoiceNumber || ''}
                                    onChange={(e) => setInvoiceNumber(e.target.value)}
                                    placeholder="e.g. INV/24/089"
                                    className="border border-slate-200 bg-slate-50 rounded-sm px-3 py-2 text-sm outline-none focus:border-[#006591] focus:ring-1 focus:ring-[#006591] transition-all font-medium"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">Invoice Date</label>
                                <input
                                    type="date"
                                    value={invoiceDate || ''}
                                    onChange={(e) => setInvoiceDate(e.target.value)}
                                    className="border border-slate-200 bg-slate-50 rounded-sm px-3 py-2 text-sm outline-none focus:border-[#006591] focus:ring-1 focus:ring-[#006591] transition-all font-medium"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">Payment Mode</label>
                                <select
                                    value={paymentMode}
                                    onChange={(e) => setPaymentMode(e.target.value)}
                                    className="border border-slate-200 bg-slate-50 rounded-sm px-3 py-2 text-sm outline-none focus:border-[#006591] focus:ring-1 focus:ring-[#006591] transition-all font-bold text-slate-700"
                                >
                                    <option value="CREDIT">Credit / Due</option>
                                    <option value="CASH">Cash Payment</option>
                                    <option value="UPI">UPI / Digital</option>
                                    <option value="OTHERS">Others</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center justify-between px-4 py-3 bg-white border border-slate-200 shadow-sm rounded-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <p className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">Financial Summary</p>
                            </div>
                            <div className="flex items-center gap-8">
                                <div className="text-right">
                                    <p className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Total Taxable</p>
                                    <p className="text-sm font-bold tabular-nums text-slate-700">₹{(totalValue / 1.12).toFixed(2)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] uppercase tracking-wider font-bold text-slate-400">GST (Estimated)</p>
                                    <p className="text-sm font-bold tabular-nums text-slate-700">₹{(totalValue - (totalValue / 1.12)).toFixed(2)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] uppercase tracking-wider font-bold text-[#006591]">Net Payable</p>
                                    <p className="text-lg font-black tabular-nums text-[#006591]">₹{totalValue.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-[#eff4ff] border-l-4 border-[#006591] px-4 py-3 flex items-center gap-3 mb-4 shadow-sm rounded-r-sm">
                        <span className="material-symbols-outlined text-[#006591] text-lg">check_circle</span>
                        <p className="text-xs font-bold text-slate-800">{extractedItems.length - exceptionCount} items auto-matched against master catalog successfully.</p>
                    </div>
                    <div className="flex-1 min-h-[600px] bg-white shadow-sm border border-slate-200 flex flex-col overflow-hidden rounded-sm">
                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-slate-600">
                                <span className="material-symbols-outlined text-[16px] text-slate-400">inventory_2</span>
                                Items from Bill ({extractedItems.length})
                            </h2>
                            {exceptionCount > 0 && (
                                <div className="flex items-center gap-3 bg-white p-1 rounded-sm border border-slate-200">
                                    <div className="flex items-center gap-2 px-2 border-r border-slate-100">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Common Settings:</span>
                                        <input
                                            type="text"
                                            value={batchCategory}
                                            onChange={(e) => setBatchCategory(e.target.value)}
                                            placeholder="Category"
                                            className="w-20 text-[10px] font-bold text-[#006591] outline-none border-none bg-slate-50 px-1.5 py-0.5 rounded-sm"
                                        />
                                        <input
                                            type="text"
                                            value={batchHSN}
                                            onChange={(e) => setBatchHSN(e.target.value)}
                                            placeholder="HSN"
                                            className="w-16 text-[10px] font-bold text-[#006591] outline-none border-none bg-slate-50 px-1.5 py-0.5 rounded-sm"
                                        />
                                    </div>
                                    <button
                                        onClick={handleBulkMapNewItems}
                                        className="px-3 py-1.5 bg-[#006591] hover:bg-[#004d6e] text-white text-[9px] font-black uppercase tracking-wider rounded-sm transition-all flex items-center gap-1.5 shadow-sm"
                                    >
                                        <span className="material-symbols-outlined text-[14px]">library_add</span>
                                        Bulk Add {exceptionCount} New Items
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 overflow-x-auto overflow-y-auto">
                            <table className="w-full text-left border-collapse min-w-[1000px]">
                                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-r border-slate-200">Product Name</th>
                                        <th className="px-2 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-r border-slate-200">Batch</th>
                                        <th className="px-2 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-r border-slate-200">Expiry</th>
                                        <th className="px-2 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-r border-slate-200">UOM</th>
                                        <th className="px-2 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-r border-slate-200">Pack</th>
                                        <th className="px-2 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-r border-slate-200 text-right">Qty/Free</th>
                                        <th className="px-2 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-r border-slate-200 text-right">Rate (₹)</th>
                                        <th className="px-2 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-r border-slate-200 text-right">MRP (₹)</th>
                                        <th className="px-2 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-r border-slate-200 text-center">Margin %</th>
                                        <th className="px-2 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-r border-slate-200 text-right">GST%</th>
                                        <th className="px-3 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-r border-slate-200">HSN</th>
                                        <th className="px-2 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 text-center">Delete</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs tabular-nums bg-white">
                                    {extractedItems.map((item, idx) => (
                                        <tr key={idx} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${!item.matched ? 'bg-red-50/20' : ''}`}>
                                            <td className="px-4 py-2 border-r border-slate-200 font-semibold text-slate-800">
                                                <div className="flex flex-col gap-1">
                                                    {!item.matched ? (
                                                        <input
                                                            type="text"
                                                            value={item.name || ''}
                                                            onChange={(e) => {
                                                                const n = [...extractedItems];
                                                                n[idx].name = e.target.value;
                                                                setExtractedItems(n);
                                                            }}
                                                            placeholder="Product Name..."
                                                            className="w-full bg-transparent border border-amber-200 focus:border-[#006591] focus:ring-1 focus:ring-[#006591] text-xs px-2 py-1 font-bold rounded-sm outline-none shadow-sm"
                                                        />
                                                    ) : (
                                                        <span>{item.matchedName || item.name}</span>
                                                    )}
                                                    {!item.matched && (
                                                        <button
                                                            onClick={() => setCatalogModalItem({ ...item, index: idx })}
                                                            className="text-[9px] w-max font-bold bg-[#eff4ff] hover:bg-[#dce9ff] text-[#006591] px-2 py-0.5 rounded-sm transition-colors border border-[#006591]/20 uppercase"
                                                        >
                                                            Add to Database
                                                        </button>
                                                    )}
                                                    {item.dosage_forms && item.dosage_forms.length > 0 && (
                                                        <select
                                                            className="text-[10px] w-max font-semibold bg-white border border-slate-200 p-1 rounded-sm outline-none focus:border-[#006591]"
                                                            value={item.selectedForm || ''}
                                                            onChange={(e) => {
                                                                const newItems = [...extractedItems];
                                                                newItems[idx].selectedForm = e.target.value;
                                                                setExtractedItems(newItems);
                                                            }}
                                                        >
                                                            <option value="">Select Form</option>
                                                            {item.dosage_forms.map(form => <option key={form} value={form}>{form}</option>)}
                                                        </select>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-1 py-1 border-r border-slate-200">
                                                <input
                                                    type="text"
                                                    value={item.batch === 'null' ? '' : item.batch || ''}
                                                    onChange={(e) => { const n = [...extractedItems]; n[idx].batch = e.target.value; setExtractedItems(n); }}
                                                    className={`w-24 bg-transparent border ${!item.batch ? 'border-red-300 bg-red-50/50' : 'border-transparent hover:border-slate-300'} focus:border-[#006591] focus:ring-1 focus:ring-[#006591] text-xs px-2 py-1.5 font-medium rounded-sm transition-all outline-none`}
                                                />
                                            </td>
                                            <td className="px-1 py-1 border-r border-slate-200">
                                                <input
                                                    type="date"
                                                    value={item.expiry_date === 'null' ? '' : item.expiry_date || ''}
                                                    onChange={(e) => { const n = [...extractedItems]; n[idx].expiry_date = e.target.value; setExtractedItems(n); }}
                                                    className={`w-28 bg-transparent border ${!item.expiry_date ? 'border-red-300 bg-red-50/50' : 'border-transparent hover:border-slate-300'} focus:border-[#006591] focus:ring-1 focus:ring-[#006591] text-xs px-2 py-1.5 font-medium rounded-sm transition-all outline-none`}
                                                />
                                            </td>
                                            <td className="px-1 py-1 border-r border-slate-200">
                                                <input
                                                    type="text"
                                                    value={item.uom || ''}
                                                    onChange={(e) => { const n = [...extractedItems]; n[idx].uom = e.target.value; setExtractedItems(n); }}
                                                    className="w-16 bg-transparent border border-transparent hover:border-slate-300 focus:border-[#006591] text-xs px-2 py-1 text-left font-medium rounded-sm outline-none"
                                                    placeholder="STRIP"
                                                />
                                            </td>
                                            <td className="px-1 py-1 border-r border-slate-200">
                                                <input
                                                    type="text"
                                                    value={item.pack_size || ''}
                                                    onChange={(e) => { const n = [...extractedItems]; n[idx].pack_size = e.target.value; setExtractedItems(n); }}
                                                    className="w-12 bg-transparent border border-transparent hover:border-slate-300 focus:border-[#006591] text-xs px-2 py-1 text-left font-medium rounded-sm outline-none"
                                                    placeholder="10"
                                                />
                                            </td>
                                            <td className="px-1 py-1 border-r border-slate-200">
                                                <div className="flex flex-col gap-1 items-end">
                                                    <input
                                                        type="number"
                                                        value={item.quantity || ''}
                                                        onChange={(e) => { const n = [...extractedItems]; n[idx].quantity = e.target.value; setExtractedItems(n); }}
                                                        className={`w-16 bg-transparent border ${!item.quantity ? 'border-red-300' : 'border-transparent hover:border-slate-300'} focus:border-[#006591] focus:ring-1 focus:ring-[#006591] text-xs px-2 py-1 text-right font-medium rounded-sm transition-all outline-none`}
                                                    />
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[9px] text-slate-400 font-bold">+</span>
                                                        <input
                                                            type="number"
                                                            placeholder="Free"
                                                            value={item.free_qty || ''}
                                                            onChange={(e) => { const n = [...extractedItems]; n[idx].free_qty = e.target.value; setExtractedItems(n); }}
                                                            className="w-12 bg-amber-50 border border-transparent hover:border-amber-200 focus:border-amber-400 text-[10px] px-1 py-0.5 text-right font-bold text-amber-700 rounded-sm outline-none shadow-inner"
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-1 py-1 border-r border-slate-200">
                                                <input
                                                    type="number"
                                                    value={item.rate || item.unit_price || ''}
                                                    onChange={(e) => { const n = [...extractedItems]; n[idx].rate = e.target.value; setExtractedItems(n); }}
                                                    className={`w-20 bg-transparent border ${!item.rate && !item.unit_price ? 'border-red-300' : 'border-transparent hover:border-slate-300'} focus:border-[#006591] focus:ring-1 focus:ring-[#006591] text-xs px-2 py-1.5 text-right font-medium rounded-sm transition-all outline-none`}
                                                />
                                            </td>
                                            <td className="px-1 py-1 border-r border-slate-200">
                                                <input
                                                    type="number"
                                                    value={item.mrp || ''}
                                                    onChange={(e) => { const n = [...extractedItems]; n[idx].mrp = e.target.value; setExtractedItems(n); }}
                                                    className={`w-20 bg-transparent border ${!item.mrp ? 'border-red-300' : 'border-transparent hover:border-slate-300'} focus:border-[#006591] focus:ring-1 focus:ring-[#006591] text-xs px-2 py-1.5 text-right font-medium rounded-sm transition-all outline-none`}
                                                />
                                            </td>
                                            <td className="px-1 py-1 border-r border-slate-200 text-center">
                                                {(() => {
                                                    const m = parseFloat(item.mrp) || 0;
                                                    const r = parseFloat(item.rate) || parseFloat(item.unit_price) || 0;
                                                    if (m === 0) return <span className="text-[10px] text-slate-300">0%</span>;
                                                    const margin = ((m - r) / m) * 100;
                                                    return (
                                                        <span className={`text-[11px] font-black ${margin > 20 ? 'text-emerald-600' : 'text-amber-500'}`}>
                                                            {margin.toFixed(0)}%
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-1 py-1 border-r border-slate-200">
                                                <input
                                                    type="number"
                                                    value={item.gst || ''}
                                                    onChange={(e) => { const n = [...extractedItems]; n[idx].gst = e.target.value; setExtractedItems(n); }}
                                                    className={`w-14 bg-transparent border ${!item.gst ? 'border-red-300' : 'border-transparent hover:border-slate-300'} focus:border-[#006591] focus:ring-1 focus:ring-[#006591] text-xs px-1 py-1.5 text-center font-medium rounded-sm transition-all outline-none`}
                                                />
                                            </td>
                                            <td className="px-1 py-1 border-r border-slate-200">
                                                <input
                                                    type="text"
                                                    value={item.hsn_code || ''}
                                                    onChange={(e) => { const n = [...extractedItems]; n[idx].hsn_code = e.target.value; setExtractedItems(n); }}
                                                    className="w-20 bg-transparent border border-transparent hover:border-slate-300 focus:border-[#006591] focus:ring-1 focus:ring-[#006591] text-xs px-2 py-1.5 font-medium rounded-sm transition-all outline-none"
                                                />
                                            </td>
                                            <td className="px-2 py-1 text-center">
                                                <button
                                                    onClick={() => removeRow(idx)}
                                                    className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                                                    title="Remove Row"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-start">
                                <button
                                    onClick={addItemManually}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-[#006591] text-[#006591] text-[11px] font-extrabold uppercase tracking-widest rounded-sm transition-all shadow-sm"
                                >
                                    <span className="material-symbols-outlined text-[18px]">add_box</span>
                                    Add New Line Item
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3 justify-end mt-4">
                        <button onClick={moveBack} className="bg-white border border-slate-300 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 transition-colors rounded-sm shadow-sm">
                            Back
                        </button>
                        {extractedItems.length > 0 && extractedItems.every(i => i.matched) && selectedVendor && (
                            <button
                                onClick={() => onCommit(selectedVendor)}
                                disabled={committing}
                                className="bg-emerald-600 text-white px-8 py-2.5 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity rounded-sm shadow-sm flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
                                {committing ? 'Saving...' : 'Approve & Commit'}
                            </button>
                        )}
                        <button
                            onClick={() => {
                                if (!selectedVendor) {
                                    showToast("Select a supplier!", "error");
                                    return;
                                }
                                if (exceptionCount > 0) {
                                    showToast("Please map all New products to Catalog.", "error");
                                    return;
                                }
                                const missing = extractedItems.some(item => !item.quantity || !item.rate || !item.mrp || !item.gst);
                                if (missing) {
                                    showToast("Please fill all missing colored cells in the table.", "error");
                                    return;
                                }
                                moveNext();
                            }}
                            className="bg-[#006591] text-white px-8 py-2.5 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity rounded-sm shadow-sm"
                        >
                            Verify Bill Amount
                        </button>
                    </div>
                </div>
            )}
            {step === 3 && (
                <div className="flex-1 flex flex-col items-center justify-center p-6 animate-in zoom-in-95 duration-500">
                    <div className="bg-white border border-slate-200 rounded-sm p-10 shadow-sm text-center flex flex-col gap-5 items-center justify-center max-w-lg w-full">
                        <span className="material-symbols-outlined text-emerald-500 text-[64px] mx-auto">check_circle</span>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">All Checks Passed</h3>
                            <p className="text-sm text-slate-500 mt-2">Ready to add {extractedItems.length} items to Current Stock from {selectedVendor}.</p>
                        </div>
                        <div className="flex gap-3 w-full mt-4">
                            <button onClick={moveBack} className="flex-1 bg-white border border-slate-200 text-sm font-bold uppercase tracking-wider py-3 rounded-sm shadow-sm text-slate-700 hover:bg-slate-50">Review</button>
                            <button onClick={() => onCommit(selectedVendor)} disabled={committing} className="flex-1 bg-emerald-600 text-white text-sm font-bold uppercase tracking-wider py-3 rounded-sm shadow-sm hover:opacity-90 flex justify-center">
                                {committing ? 'Saving...' : 'Confirm & Add to Stock'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {catalogModalItem && (
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
                    <div className="bg-white rounded-t-lg sm:rounded-sm shadow-xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in duration-300">
                        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#006591]">Add to Product Database</h3>
                            <button onClick={() => setCatalogModalItem(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <div className="p-5 flex flex-col gap-4">
                            <div className="bg-[#eff4ff] text-[#006591] p-3 rounded-sm border border-[#006591]/20 text-sm">
                                Adding <strong className="font-bold">{catalogModalItem.name}</strong> as a new master product.
                            </div>
                            <div>
                                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1 block">Category / Type</label>
                                <input type="text" value={catalogFormData.category} onChange={e => setCatalogFormData({ ...catalogFormData, category: e.target.value })} className="w-full text-sm border border-slate-300 rounded-sm p-2 outline-none focus:border-[#006591] focus:ring-1 focus:ring-[#006591]" />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1 block">HSN Code</label>
                                <input type="text" value={catalogFormData.hsn_code} onChange={e => setCatalogFormData({ ...catalogFormData, hsn_code: e.target.value })} className="w-full text-sm border border-slate-300 rounded-sm p-2 outline-none focus:border-[#006591] focus:ring-1 focus:ring-[#006591]" />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1 block">Dosage Forms (Comma separated)</label>
                                <input type="text" value={catalogFormData.dosage_forms} onChange={e => setCatalogFormData({ ...catalogFormData, dosage_forms: e.target.value })} className="w-full text-sm border border-slate-300 rounded-sm p-2 outline-none focus:border-[#006591] focus:ring-1 focus:ring-[#006591]" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1 block">Manufacturer</label>
                                    <input type="text" placeholder="e.g. GSK" value={catalogFormData.manufacturer} onChange={e => setCatalogFormData({ ...catalogFormData, manufacturer: e.target.value })} className="w-full text-sm border border-slate-300 rounded-sm p-2 outline-none focus:border-[#006591] focus:ring-1 focus:ring-[#006591]" />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1 block">Salt / Formula</label>
                                    <input type="text" placeholder="e.g. Paracetamol" value={catalogFormData.composition} onChange={e => setCatalogFormData({ ...catalogFormData, composition: e.target.value })} className="w-full text-sm border border-slate-300 rounded-sm p-2 outline-none focus:border-[#006591] focus:ring-1 focus:ring-[#006591]" />
                                </div>
                            </div>
                        </div>
                        <div className="px-5 py-4 border-t border-slate-100 flex flex-col gap-2 bg-slate-50">
                            <button onClick={handleSaveCatalog} disabled={savingCatalog} className="w-full bg-[#006591] hover:opacity-90 text-white text-xs font-bold uppercase tracking-wider py-2.5 rounded-sm transition-opacity flex justify-center">
                                {savingCatalog ? 'Saving to Master...' : 'Save Catalog Product'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default GRNStepper;
