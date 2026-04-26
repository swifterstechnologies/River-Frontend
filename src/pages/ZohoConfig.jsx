import React, { useState, useEffect } from 'react';
import { getZohoConfig, saveZohoConfig } from '../services/api';
const ZohoConfig = ({ showToast }) => {
    const [config, setConfig] = useState({
        organization_id: '',
        client_id: '',
        client_secret: '',
        refresh_token: '',
        purchase_account_id: '',
        expense_account_id: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        fetchConfig();
    }, []);
    const fetchConfig = async () => {
        try {
            const res = await getZohoConfig();
            if (res.success && res.data) {
                setConfig({
                    ...res.data,
                    client_secret: '********', 
                    refresh_token: '********'  
                });
            }
        } catch (err) {
            console.error("Failed to fetch Zoho config", err);
        } finally {
            setLoading(false);
        }
    };
    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await saveZohoConfig(config);
            if (res.success) {
                showToast('Zoho configuration saved successfully');
                fetchConfig();
            } else {
                showToast(res.message || 'Failed to save configuration', 'error');
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to save configuration', 'error');
        } finally {
            setSaving(false);
        }
    };
    const handleChange = (e) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };
    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined animate-spin text-[#006591] text-3xl">progress_activity</span>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading Connectivity Settings...</p>
                </div>
            </div>
        );
    }
    return (
        <div className="flex-1 flex flex-col p-8 overflow-y-auto animate-in fade-in duration-500">
            <div className="max-w-2xl mx-auto w-full">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-[#006591] rounded-sm flex items-center justify-center shadow-lg shadow-[#006591]/20">
                        <span className="material-symbols-outlined text-white text-2xl">sync_alt</span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Zoho Books Connectivity</h2>
                        <p className="text-sm text-slate-500 font-medium">Configure API credentials and Chart of Account mapping.</p>
                    </div>
                </div>
                <form onSubmit={handleSave} className="bg-white border border-slate-200 shadow-xl shadow-slate-200/50 rounded-sm overflow-hidden">
                    <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-[#006591]">admin_panel_settings</span>
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-600">OAuth 2.0 Credentials</h3>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1">Organization ID</label>
                                <input
                                    type="text"
                                    name="organization_id"
                                    value={config.organization_id}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#006591] transition-colors rounded-sm"
                                    placeholder="e.g. 60001234567"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1">Client ID</label>
                                <input
                                    type="text"
                                    name="client_id"
                                    value={config.client_id}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#006591] transition-colors rounded-sm"
                                    placeholder="1000.XXXXXXXXXXXXX"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1">Client Secret</label>
                            <input
                                type="password"
                                name="client_secret"
                                value={config.client_secret}
                                onChange={handleChange}
                                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#006591] transition-colors rounded-sm"
                                placeholder={config.id ? "••••••••••••••••" : "Your Zoho Client Secret"}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1">Refresh Token</label>
                            <textarea
                                name="refresh_token"
                                value={config.refresh_token}
                                onChange={handleChange}
                                rows="2"
                                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#006591] transition-colors rounded-sm resize-none"
                                placeholder={config.id ? "••••••••••••••••" : "Zoho Offline Refresh Token"}
                                required
                            />
                        </div>
                        <div className="pt-4">
                            <div className="p-4 bg-amber-50 border-l-4 border-amber-400 flex gap-3 rounded-r-sm mb-8">
                                <span className="material-symbols-outlined text-amber-600 text-lg">account_tree</span>
                                <div>
                                    <h4 className="text-xs font-black text-amber-800 uppercase tracking-wider">Account Mapping</h4>
                                    <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">Ensure these IDs match your Chart of Accounts in Zoho Books Settings.</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1">Purchase Account ID (Bills)</label>
                                    <input
                                        type="text"
                                        name="purchase_account_id"
                                        value={config.purchase_account_id}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border border-slate-200 px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#006591] transition-colors rounded-sm"
                                        placeholder="e.g. 332137..."
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1">Expense Account ID (Others)</label>
                                    <input
                                        type="text"
                                        name="expense_account_id"
                                        value={config.expense_account_id}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border border-slate-200 px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#006591] transition-colors rounded-sm"
                                        placeholder="e.g. 332137..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-[#006591] text-white px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-lg shadow-[#006591]/20 rounded-sm flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                                    Encrypting & Saving...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[16px]">save</span>
                                    Store Configuration
                                </>
                            )}
                        </button>
                    </div>
                </form>
                <div className="mt-8 p-6 bg-[#eff4ff] border border-slate-200 rounded-sm flex gap-4">
                    <span className="material-symbols-outlined text-[#006591] text-xl">info</span>
                    <div className="space-y-2">
                        <h4 className="text-xs font-black text-[#006591] uppercase tracking-wider">How to get these?</h4>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                            Visit the <a href="https://api-console.zoho.in" target="_blank" className="text-[#006591] underline font-bold">Zoho API Console</a>.
                            Create a 'Server-based Application' with scope <code className="bg-white px-1 border border-slate-200 rounded text-[#006591]">ZohoBooks.fullaccess.all</code>.
                            Use the self-client tab to generate your initial code and exchange it for a refresh token.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default ZohoConfig;
