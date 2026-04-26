import React, { useState, useEffect, useCallback } from 'react';
import { getAccountingExceptions, retryAccountingSync } from '../services/api';
const syncTypeBadge = (type) => {
    if (type === 'PURCHASE_BILL') return 'bg-[#e6eeff] text-[#004c6e]';
    if (type === 'EXPENSE') return 'bg-amber-100 text-amber-800';
    return 'bg-slate-100 text-slate-600';
};

const formatErrorMessage = (msg) => {
    if (!msg) return '—';
    try {
        const parsed = JSON.parse(msg);
        if (parsed && typeof parsed === 'object') {
            if (parsed.message) return parsed.message;
            if (parsed.raw && parsed.raw.message) return parsed.raw.message;
            // Fallback if there's some other nested structure
            const firstValue = Object.values(parsed)[0];
            if (typeof firstValue === 'string') return firstValue;
        }
    } catch (e) {
        // Not a JSON string
    }
    return msg;
};
const AccountingExceptions = ({ showToast }) => {
    const [exceptions, setExceptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const [retrying, setRetrying] = useState(null); 
    const fetchExceptions = useCallback(async () => {
        setLoading(true);
        setFetchError(false);
        try {
            const res = await getAccountingExceptions();
            setExceptions(res.data || []);
        } catch {
            setFetchError(true);
        } finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { fetchExceptions(); }, [fetchExceptions]);
    const handleRetry = async (id) => {
        setRetrying(id);
        try {
            const res = await retryAccountingSync(id);
            if (res.success) {
                showToast('Retry successful');
                await fetchExceptions();
            } else {
                showToast(res.message || 'Retry failed', 'error');
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Retry failed', 'error');
        } finally {
            setRetrying(null);
        }
    };
    const formatDate = (iso) => {
        if (!iso) return '—';
        return new Date(iso).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };
    return (
        <div className="flex-1 flex flex-col p-6 overflow-hidden gap-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                    <h2 className="text-xl font-bold text-slate-900">Accounting Sync Exceptions</h2>
                    <p className="text-xs text-slate-500 mt-1">Failed Zoho Books sync entries. Retry manually to resolve.</p>
                </div>
                <button
                    onClick={fetchExceptions}
                    disabled={loading}
                    className="bg-white border border-slate-300 px-4 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-100 transition-colors text-slate-700 rounded-sm shadow-sm flex items-center gap-1.5 disabled:opacity-50 w-full sm:w-auto justify-center"
                >
                    <span className={`material-symbols-outlined text-[14px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
                    Refresh Data
                </button>
            </div>
            {!loading && !fetchError && (
                <div className="bg-[#eff4ff] border-l-4 border-[#006591] px-4 py-3 flex items-center gap-3 shadow-sm rounded-r-sm">
                    <span className="material-symbols-outlined text-[#006591] text-lg">error_outline</span>
                    <p className="text-xs font-bold text-slate-800">
                        {exceptions.length} failed sync{exceptions.length !== 1 ? 's' : ''} pending resolution
                    </p>
                </div>
            )}
            <div className="flex-1 bg-white shadow-sm border border-slate-200 flex flex-col overflow-hidden rounded-sm">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-slate-400">sync_problem</span>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
                        Failed Sync Log
                    </h3>
                </div>
                <div className="flex-1 overflow-x-auto overflow-y-auto">
                    <table className="hidden md:table w-full text-left border-collapse min-w-[700px]">
                        <thead className="sticky top-0 bg-[#eff4ff] border-b border-slate-200 z-10 shadow-sm">
                            <tr>
                                <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-600 border-r border-[#006591]/10">Date</th>
                                <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-600 border-r border-[#006591]/10">GRN ID</th>
                                <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-600 border-r border-[#006591]/10">Sync Type</th>
                                <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-600 border-r border-[#006591]/10">Error Message</th>
                                <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-600 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs tabular-nums bg-white">
                            {loading && (
                                <tr>
                                    <td colSpan="5" className="px-4 py-8 text-center text-slate-500 font-medium">
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                            Loading sync exceptions...
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {!loading && fetchError && (
                                <tr>
                                    <td colSpan="5" className="px-4 py-8 text-center text-red-500 font-medium">
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="material-symbols-outlined">error</span>
                                            Failed to load data. Check your backend connection.
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {!loading && !fetchError && exceptions.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-4 py-10 text-center text-slate-500 font-medium">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="material-symbols-outlined text-[36px] text-emerald-400">check_circle</span>
                                            <p className="text-sm font-bold text-slate-700">No failed syncs</p>
                                            <p className="text-xs text-slate-400">All GRN records are synced to Zoho Books.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {!loading && !fetchError && exceptions.map((row) => (
                                <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 border-r border-slate-100 text-slate-600 whitespace-nowrap">
                                        {formatDate(row.created_at)}
                                    </td>
                                    <td className="px-4 py-3 border-r border-slate-100 font-bold text-[#006591]">
                                        #{row.grn_id}
                                    </td>
                                    <td className="px-4 py-3 border-r border-slate-100">
                                        <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-tighter rounded-sm ${syncTypeBadge(row.sync_type)}`}>
                                            {row.sync_type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 border-r border-slate-100 text-red-600 max-w-[300px]">
                                        <p className="truncate" title={formatErrorMessage(row.error_message)}>
                                            {formatErrorMessage(row.error_message)}
                                        </p>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => handleRetry(row.id)}
                                            disabled={retrying === row.id}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#006591] text-white text-[10px] font-bold uppercase tracking-wider rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm"
                                        >
                                            <span className={`material-symbols-outlined text-[14px] ${retrying === row.id ? 'animate-spin' : ''}`}>
                                                {retrying === row.id ? 'progress_activity' : 'replay'}
                                            </span>
                                            {retrying === row.id ? 'Retrying...' : 'Retry'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="md:hidden flex flex-col divide-y divide-slate-100">
                        {(!loading && !fetchError && exceptions.length === 0) && (
                            <div className="p-10 text-center text-slate-500">No failed syncs recorded.</div>
                        )}
                        {exceptions.map((row) => (
                            <div key={row.id} className="p-4 active:bg-slate-50 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex flex-col gap-1">
                                        <p className="text-[10px] text-slate-500 font-mono">{formatDate(row.created_at)}</p>
                                        <p className="font-bold text-[#006591] text-sm">GRN #{row.grn_id}</p>
                                    </div>
                                    <span className={`inline-flex items-center px-2 py-0.5 text-[8px] font-bold uppercase tracking-tighter rounded-sm ${syncTypeBadge(row.sync_type)}`}>
                                        {row.sync_type}
                                    </span>
                                </div>
                                <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded-sm">
                                    <p className="text-[10px] text-red-600 font-medium leading-relaxed">{formatErrorMessage(row.error_message)}</p>
                                </div>
                                <div className="mt-4 pt-3 border-t border-slate-50 flex justify-end">
                                    <button
                                        onClick={() => handleRetry(row.id)}
                                        disabled={retrying === row.id}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#006591] text-white text-[10px] font-bold uppercase tracking-wider rounded-sm shadow-sm disabled:opacity-50"
                                    >
                                        <span className={`material-symbols-outlined text-[16px] ${retrying === row.id ? 'animate-spin' : ''}`}>
                                            {retrying === row.id ? 'progress_activity' : 'replay'}
                                        </span>
                                        {retrying === row.id ? 'Retrying...' : 'Retry Sync'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="px-4 py-3 bg-white border-t border-slate-200 flex justify-between items-center">
                    <p className="text-xs text-slate-500 font-medium">
                        Failed records: <span className="font-bold text-slate-800">{exceptions.length}</span>
                    </p>
                </div>
            </div>
        </div>
    );
};
export default AccountingExceptions;
