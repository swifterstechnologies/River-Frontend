import React, { useState, useEffect } from 'react';
import { getSuppliers, settleSupplierPayment, addSupplier, updateSupplier, deleteSupplier } from '../services/api';
const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [supplierForm, setSupplierForm] = useState({ name: '', gstin: '', contact_name: '', contact_phone: '', city_state: '', email: '', state: '', status: 'Active' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    useEffect(() => {
        fetchSuppliers();
    }, []);
    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const res = await getSuppliers();
            setSuppliers(res.data || []);
        } catch (err) {
            console.error("Failed to fetch suppliers:", err);
        } finally {
            setLoading(false);
        }
    };
    const handleSettlePayment = async (id, name, amount) => {
        if (!amount || amount <= 0) {
            alert("No outstanding balance to settle.");
            return;
        }
        if (window.confirm(`Are you sure you want to mark ₹${amount} as Fully Paid for ${name}?`)) {
            try {
                setLoading(true);
                await settleSupplierPayment(id);
                fetchSuppliers();
            } catch (err) {
                alert("Failed to settle payment");
                setLoading(false);
            }
        }
    };
    const handleAddClick = () => {
        setSupplierForm({ name: '', gstin: '', contact_name: '', contact_phone: '', city_state: '', email: '', state: '', status: 'Active' });
        setIsAddModalOpen(true);
    };
    const handleEditClick = (supplier) => {
        setEditingSupplier(supplier);
        setSupplierForm({ ...supplier });
        setIsEditModalOpen(true);
    };
    const handleDelete = async (id, name) => {
        if (window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
            try {
                setLoading(true);
                await deleteSupplier(id);
                fetchSuppliers();
            } catch (err) {
                alert("Failed to delete supplier");
                setLoading(false);
            }
        }
    };
    const submitSupplier = async (e) => {
        e.preventDefault();
        if (!supplierForm.name) return;
        try {
            setIsSubmitting(true);
            if (isEditModalOpen) {
                await updateSupplier(editingSupplier.id, supplierForm);
                setIsEditModalOpen(false);
            } else {
                await addSupplier(supplierForm);
                setIsAddModalOpen(false);
            }
            fetchSuppliers();
        } catch (err) {
            alert(err.response?.data?.error || "Operation failed");
        } finally {
            setIsSubmitting(false);
        }
    };
    const filteredSuppliers = suppliers.filter(s => {
        const matchesSearch = (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.gstin || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || (s.status || '').toLowerCase() === filterStatus;
        return matchesSearch && matchesStatus;
    });
    const activeCount = suppliers.filter(s => s.status === 'Active').length;
    const totalOutstanding = suppliers.reduce((sum, s) => sum + (parseFloat(s.outstanding_balance) || 0), 0);
    const pendingCount = suppliers.filter(s => s.status === 'Pending').length;
    const sStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'active': return 'bg-emerald-100 text-emerald-800';
            case 'pending': return 'bg-amber-100 text-amber-800';
            default: return 'bg-slate-100 text-slate-600';
        }
    };
    return (
        <div className="flex-1 flex flex-col p-6 overflow-hidden gap-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Supplier Management</h2>
                    <p className="text-xs text-slate-500 mt-1">Manage vendor master data, compliance, and accounts payable.</p>
                </div>
                <button
                    onClick={handleAddClick}
                    className="bg-[#006591] text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity rounded-sm shadow-sm flex items-center gap-2 w-full sm:w-auto justify-center">
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    New Supplier
                </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 border-l-4 border-[#006591] shadow-sm rounded-sm">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Total Active Suppliers</p>
                    <p className="text-2xl font-bold tabular-nums text-slate-900">{activeCount}</p>
                </div>
                <div className="bg-white p-4 border-l-4 border-red-500 shadow-sm rounded-sm">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Outstanding Payables</p>
                    <p className="text-2xl font-bold tabular-nums text-red-600">₹{totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-white p-4 border-l-4 border-[#0ea5e9] shadow-sm rounded-sm">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Pending Compliance / Contracts</p>
                    <p className="text-2xl font-bold tabular-nums text-slate-900">{pendingCount}</p>
                </div>
            </div>
            <div className="flex-1 bg-white shadow-sm border border-slate-200 flex flex-col overflow-hidden rounded-sm">
                <div className="px-4 py-3 bg-slate-50 flex flex-col md:flex-row justify-between items-center border-b border-slate-200 gap-4">
                    <div className="flex items-center gap-4 relative w-full max-w-2xl">
                        <span className="material-symbols-outlined text-slate-400 text-[18px]">search</span>
                        <input
                            type="text"
                            placeholder="Search suppliers or GSTIN..."
                            className="flex-1 bg-white border border-slate-300 focus:border-[#006591] focus:ring-1 focus:ring-[#006591] text-xs px-2 py-1.5 rounded-sm outline-none"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <span className="material-symbols-outlined text-slate-400 text-[18px] ml-2">filter_list</span>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-white border border-slate-300 text-xs font-semibold text-slate-700 py-1.5 pl-3 pr-8 rounded-sm outline-none w-full md:w-auto"
                        >
                            <option value="all">All Statuses</option>
                            <option value="active">Active Only</option>
                            <option value="pending">Pending Approval</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    <button
                        onClick={fetchSuppliers}
                        disabled={loading}
                        className="bg-white border border-slate-300 px-3 py-1.5 text-[10px] font-bold uppercase hover:bg-slate-100 transition-colors text-slate-700 rounded-sm shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                    >
                        <span className={`material-symbols-outlined text-[14px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
                        Refresh
                    </button>
                </div>
                <div className="flex-1 overflow-x-auto overflow-y-auto">
                    <table className="hidden md:table w-full text-left border-collapse min-w-[900px]">
                        <thead className="sticky top-0 bg-[#eff4ff] border-b border-slate-200 z-10 shadow-sm">
                            <tr>
                                <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-600 border-r border-[#006591]/10 w-1/4">Supplier Name</th>
                                <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-600 border-r border-[#006591]/10">GSTIN</th>
                                <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-600 border-r border-[#006591]/10">Primary Contact</th>
                                <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-600 border-r border-[#006591]/10 text-right">Outstanding (₹)</th>
                                <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-600 border-r border-[#006591]/10">Status</th>
                                <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-600 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs tabular-nums bg-white">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-4 py-8 text-center text-slate-500 font-medium">
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                            Loading suppliers from database...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredSuppliers.map((supplier, idx) => (
                                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer group">
                                    <td className="px-4 py-3 border-r border-slate-100">
                                        <p className="font-bold text-[#006591]">{supplier.name}</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">{supplier.city_state}</p>
                                    </td>
                                    <td className="px-4 py-3 border-r border-slate-100 font-mono text-slate-600 text-[11px]">
                                        {supplier.gstin}
                                    </td>
                                    <td className="px-4 py-3 border-r border-slate-100">
                                        <p className="font-semibold text-slate-800">{supplier.contact_name}</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">{supplier.contact_phone}</p>
                                    </td>
                                    <td className="px-4 py-3 border-r border-slate-100 text-right font-bold text-slate-800">
                                        {(parseFloat(supplier.outstanding_balance) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-3 border-r border-slate-100">
                                        <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-tighter rounded-sm ${sStatusColor(supplier.status)}`}>
                                            {supplier.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleEditClick(supplier); }}
                                            className="text-slate-400 hover:text-[#006591] transition-colors p-1 rounded-sm hover:bg-slate-100" title="Edit Supplier">
                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleSettlePayment(supplier.id, supplier.name, supplier.outstanding_balance); }}
                                            className={`${parseFloat(supplier.outstanding_balance) > 0 ? 'text-green-600 hover:bg-green-50' : 'text-slate-300'} transition-colors p-1 rounded-sm ml-1`}
                                            title="Settle Payment Completely"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">payments</span>
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(supplier.id, supplier.name); }}
                                            className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded-sm ml-1 hover:bg-red-50"
                                            title="Delete Supplier"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {!loading && filteredSuppliers.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-4 py-8 text-center text-slate-500 font-medium">
                                        No suppliers found in database.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    <div className="md:hidden flex flex-col divide-y divide-slate-100">
                        {filteredSuppliers.map(supplier => (
                            <div key={supplier.id} className="p-4 active:bg-slate-50 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-bold text-[#006591] text-sm">{supplier.name}</p>
                                        <p className="text-[10px] text-slate-500 font-mono">{supplier.gstin || 'No GSTIN'}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 text-[8px] font-bold uppercase rounded-sm ${supplier.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                                        {supplier.status}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-3">
                                    <div>
                                        <p className="text-[9px] uppercase font-bold text-slate-400">Balance</p>
                                        <p className="text-sm font-bold text-slate-900">₹{parseFloat(supplier.outstanding_balance).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] uppercase font-bold text-slate-400">Contact</p>
                                        <p className="text-[11px] font-medium text-slate-700">{supplier.contact_phone || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-slate-50">
                                    <button onClick={() => handleEditClick(supplier)} className="text-[#006591] flex items-center gap-1 text-[10px] font-bold uppercase">
                                        <span className="material-symbols-outlined text-[16px]">edit</span> Edit
                                    </button>
                                    <button
                                        disabled={parseFloat(supplier.outstanding_balance) <= 0}
                                        onClick={() => handleSettlePayment(supplier.id, supplier.name, supplier.outstanding_balance)}
                                        className={`${parseFloat(supplier.outstanding_balance) > 0 ? 'text-green-600' : 'text-slate-300'} flex items-center gap-1 text-[10px] font-bold uppercase`}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">payments</span> Settle
                                    </button>
                                    <button onClick={() => handleDelete(supplier.id, supplier.name)} className="text-red-500 flex items-center gap-1 text-[10px] font-bold uppercase">
                                        <span className="material-symbols-outlined text-[16px]">delete</span> Del
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="px-4 py-3 bg-white border-t border-slate-200 flex justify-between items-center shadow-sm">
                    <p className="text-xs text-slate-500 font-medium">Total Suppliers: <span className="font-bold text-slate-800">{suppliers.length}</span></p>
                    <div className="flex gap-1">
                        <button className="px-2 py-1 bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-sm shadow-sm disabled:opacity-50 text-[11px] font-bold">Prev</button>
                        <button className="px-2 py-1 bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-sm shadow-sm disabled:opacity-50 text-[11px] font-bold">Next</button>
                    </div>
                </div>
            </div>
            {(isAddModalOpen || isEditModalOpen) && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-t-lg sm:rounded-md shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col animate-in slide-in-from-bottom-10 sm:zoom-in duration-300">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="font-bold tracking-tight text-slate-900 text-lg">{isEditModalOpen ? 'Edit Supplier' : 'Add New Supplier'}</h3>
                                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mt-0.5">Vendor Registration</p>
                            </div>
                            <button onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="text-slate-400 hover:text-red-500 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={submitSupplier} className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[80vh]">
                            <div className="grid grid-cols-2 gap-5">
                                <div className="col-span-2">
                                    <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-600 mb-1.5">Supplier / Company Name <span className="text-red-500">*</span></label>
                                    <input required type="text" value={supplierForm.name} onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })} className="w-full bg-white border border-slate-300 focus:border-[#006591] focus:ring-1 focus:ring-[#006591] text-sm px-3 py-2 rounded-sm outline-none transition-all placeholder:text-slate-400" placeholder="e.g. Test Pharma LLP" />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-600 mb-1.5">GSTIN</label>
                                    <input type="text" value={supplierForm.gstin} onChange={e => setSupplierForm({ ...supplierForm, gstin: e.target.value })} className="w-full bg-white border border-slate-300 focus:border-[#006591] focus:ring-1 focus:ring-[#006591] text-sm px-3 py-2 rounded-sm outline-none transition-all placeholder:text-slate-400 font-mono uppercase" placeholder="22AAAAA0000A1Z5" />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-600 mb-1.5">City / State</label>
                                    <input type="text" value={supplierForm.city_state} onChange={e => setSupplierForm({ ...supplierForm, city_state: e.target.value })} className="w-full bg-white border border-slate-300 focus:border-[#006591] focus:ring-1 focus:ring-[#006591] text-sm px-3 py-2 rounded-sm outline-none transition-all placeholder:text-slate-400" placeholder="Mumbai, MH" />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-600 mb-1.5">Contact Person Name</label>
                                    <input type="text" value={supplierForm.contact_name} onChange={e => setSupplierForm({ ...supplierForm, contact_name: e.target.value })} className="w-full bg-white border border-slate-300 focus:border-[#006591] focus:ring-1 focus:ring-[#006591] text-sm px-3 py-2 rounded-sm outline-none transition-all placeholder:text-slate-400" placeholder="John Doe" />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-600 mb-1.5">Contact Phone</label>
                                    <input type="tel" value={supplierForm.contact_phone} onChange={e => setSupplierForm({ ...supplierForm, contact_phone: e.target.value })} className="w-full bg-white border border-slate-300 focus:border-[#006591] focus:ring-1 focus:ring-[#006591] text-sm px-3 py-2 rounded-sm outline-none transition-all placeholder:text-slate-400" placeholder="+91 9999999999" />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-600 mb-1.5">Email Address</label>
                                    <input type="email" value={supplierForm.email} onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })} className="w-full bg-white border border-slate-300 focus:border-[#006591] focus:ring-1 focus:ring-[#006591] text-sm px-3 py-2 rounded-sm outline-none transition-all placeholder:text-slate-400" placeholder="vendor@example.com" />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-600 mb-1.5">State</label>
                                    <input type="text" value={supplierForm.state} onChange={e => setSupplierForm({ ...supplierForm, state: e.target.value })} className="w-full bg-white border border-slate-300 focus:border-[#006591] focus:ring-1 focus:ring-[#006591] text-sm px-3 py-2 rounded-sm outline-none transition-all placeholder:text-slate-400" placeholder="e.g. Maharashtra" />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-600 mb-1.5">Status</label>
                                    <select value={supplierForm.status} onChange={e => setSupplierForm({ ...supplierForm, status: e.target.value })} className="w-full bg-white border border-slate-300 text-sm px-3 py-2 rounded-sm outline-none">
                                        <option value="Active">Active</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-2 border-t border-slate-100 pt-5">
                                <button type="button" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-100 rounded-sm transition-colors border border-transparent hover:border-slate-300">Cancel</button>
                                <button disabled={isSubmitting || !supplierForm.name} type="submit" className="bg-[#006591] text-white px-6 py-2 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity rounded-sm shadow-sm disabled:opacity-50 flex items-center gap-2">
                                    {isSubmitting ? <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span> : <span className="material-symbols-outlined text-[16px]">save</span>}
                                    {isEditModalOpen ? 'Update Supplier' : 'Save Supplier'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
const sStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
        case 'active': return 'bg-[#e6eeff] text-[#004c6e]';
        case 'pending': return 'bg-amber-100 text-amber-800';
        default: return 'bg-slate-100 text-slate-600';
    }
};
export default Suppliers;
