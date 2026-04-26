import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
const MorningBriefing = ({ inventory, stats, wardRequests, shortageClaims, onFulfillRequest }) => {
    const displayValuation = stats?.total_valuation || 0;
    const pendingGrnCount = stats?.pending_grn_count || 0;
    const totalShortageValue = parseFloat(stats?.total_shortage_value || 0);
    const pendingClaimsCount = stats?.pending_claims_count || 0;
    const redExpiryCount = inventory.filter(i => {
        if (!i.last_expiry) return false;
        const expiry = new Date(i.last_expiry);
        const today = new Date();
        const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays < 90;
    }).length;
    const pendingRequests = wardRequests.filter(r => r.status === 'pending');
    const activeClaims = shortageClaims.filter(c => c.status === 'pending');
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-slate-900">Morning Briefing</h2>
                <p className="text-xs text-slate-500 mt-1">Operational command center. Real-time metrics from your live environment.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-3 border-l-4 border-[#006591] shadow-sm">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Live Inventory Value</p>
                    <p className="text-xl font-bold tabular-nums text-slate-900">₹{parseFloat(displayValuation).toLocaleString()}</p>
                </div>
                <div className="bg-white p-3 border-l-4 border-[#b02d21] shadow-sm">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Queue: Draft GRNs</p>
                    <p className="text-xl font-bold tabular-nums text-slate-900">{pendingGrnCount}</p>
                    <p className="text-[10px] text-[#b02d21] font-bold mt-1 uppercase">Pending Review</p>
                </div>
                <div className="bg-white p-3 border-l-4 border-amber-500 shadow-sm">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Active Vendor Claims</p>
                    <p className="text-xl font-bold tabular-nums text-slate-900">₹{totalShortageValue.toLocaleString()}</p>
                    <p className="text-[10px] text-amber-600 font-bold mt-1 uppercase">{pendingClaimsCount} Claims Open</p>
                </div>
                <div className="bg-white p-3 border-l-4 border-red-600 shadow-sm">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Critical Expiry Risk</p>
                    <p className="text-xl font-bold tabular-nums text-slate-900">{redExpiryCount}</p>
                    <p className="text-[10px] text-red-600 font-bold mt-1 uppercase">Items &lt; 90 Days</p>
                </div>
            </div>
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="w-full lg:w-[60%] bg-white shadow-sm border border-slate-200 rounded-sm flex flex-col p-4 h-72">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900">Inwarded vs Dispensed</h3>
                        <span className="text-[9px] font-bold text-[#006591] bg-sky-50 px-2 py-0.5 rounded-full">LIVE 7 DAYS</span>
                    </div>
                    <div className="flex-1 w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats?.chartData || []} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '4px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="Inwarded" fill="#006591" radius={[2, 2, 0, 0]} barSize={20} />
                                <Bar dataKey="Dispensed" fill="#b02d21" radius={[2, 2, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="w-full lg:w-[40%] bg-white shadow-sm border border-slate-200 rounded-sm flex flex-col h-72">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                        <h2 className="text-xs font-extrabold uppercase tracking-widest flex items-center gap-2 text-slate-900">
                            <span className="material-symbols-outlined !text-[16px] text-red-600" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                            Live Expiry Watch
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {inventory
                            .filter(i => i.last_expiry && new Date(i.last_expiry) > new Date())
                            .sort((a, b) => new Date(a.last_expiry) - new Date(b.last_expiry))
                            .slice(0, 4)
                            .map((item, idx) => {
                                const daysLeft = Math.ceil((new Date(item.last_expiry) - new Date()) / (1000 * 60 * 60 * 24));
                                const severity = daysLeft < 30 ? 'red' : daysLeft < 90 ? 'amber' : 'slate';
                                const colorClass = severity === 'red' ? 'border-red-500 bg-red-50' : 'border-amber-500 bg-amber-50';
                                const tagClass = severity === 'red' ? 'bg-red-600' : 'bg-amber-500';
                                return (
                                    <div key={idx} className={`flex items-center justify-between border-l-4 p-3 rounded-r-sm ${colorClass}`}>
                                        <div>
                                            <p className="font-bold text-xs text-slate-900">{item.name}</p>
                                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Exp: {new Date(item.last_expiry).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <span className={`${tagClass} text-white px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase`}>{daysLeft} Days</span>
                                        </div>
                                    </div>
                                );
                            })}
                        {inventory.filter(i => i.last_expiry).length === 0 && (
                            <p className="text-center py-10 text-slate-400 text-xs italic">No expiry data available.</p>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="w-full lg:w-1/2 bg-white shadow-sm border border-slate-200 flex flex-col overflow-hidden rounded-sm">
                    <div className="px-4 py-3 bg-slate-50 flex justify-between items-center border-b border-slate-200">
                        <h2 className="text-xs font-extrabold uppercase tracking-widest flex items-center gap-2 text-[#006591]">
                            <span className="material-symbols-outlined !text-[16px]">local_hospital</span>
                            Live Ward Requisitions
                        </h2>
                        <span className="bg-[#006591] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">{pendingRequests.length} Pending</span>
                    </div>
                    <div className="flex-1 overflow-y-auto h-64">
                        <table className="hidden md:table w-full text-left border-collapse">
                            <thead className="bg-white sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-[9px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-200">Location / Bed</th>
                                    <th className="px-4 py-2 text-[9px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-200">Requested Items</th>
                                    <th className="px-4 py-2 text-[9px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-200 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs tabular-nums">
                                {pendingRequests.map((req, idx) => (
                                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 border-r border-slate-100">
                                            <p className="font-bold text-slate-900">{req.patientName}</p>
                                            <p className="text-[10px] text-slate-500 mt-0.5">Bed: {req.bedNumber || 'N/A'}</p>
                                        </td>
                                        <td className="px-4 py-3 border-r border-slate-100">
                                            <p className="font-semibold text-[#006591]">{req.items[0]?.name || 'Unknown'}</p>
                                            <p className="text-[10px] text-slate-500 mt-0.5">{req.items[0]?.qty} units</p>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="text-[9px] font-bold uppercase text-amber-600 px-2 py-1 bg-amber-50 rounded-sm border border-amber-100">Pending</span>
                                        </td>
                                    </tr>
                                ))}
                                {pendingRequests.length === 0 && (
                                    <tr>
                                        <td colSpan="3" className="px-4 py-10 text-center text-slate-400 italic">No pending requests from wards.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <div className="md:hidden flex flex-col divide-y divide-slate-100">
                            {pendingRequests.map((req, idx) => (
                                <div key={idx} className="p-4 active:bg-slate-50">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="font-bold text-[#006591] text-xs">{req.patientName}</p>
                                        <span className="text-[8px] font-bold uppercase text-amber-600 px-1.5 py-0.5 bg-amber-50 rounded-sm border border-amber-100">Pending</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <p className="text-[11px] text-slate-700">{req.items[0]?.name} <span className="text-slate-400 font-bold">x{req.items[0]?.qty}</span></p>
                                        <p className="text-[9px] text-slate-400 font-medium">Bed: {req.bedNumber}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="w-full lg:w-1/2 bg-white shadow-sm border border-slate-200 flex flex-col overflow-hidden rounded-sm">
                    <div className="px-4 py-3 bg-slate-50 flex justify-between items-center border-b border-slate-200">
                        <h2 className="text-xs font-extrabold uppercase tracking-widest flex items-center gap-2 text-amber-600">
                            <span className="material-symbols-outlined !text-[16px]">account_balance_wallet</span>
                            Live Shortage Claims
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto h-64">
                        <table className="hidden md:table w-full text-left border-collapse">
                            <thead className="bg-white sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-[9px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-200">Distributor</th>
                                    <th className="px-4 py-2 text-[9px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-200">Invoice Ref</th>
                                    <th className="px-4 py-2 text-[9px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-200 text-right">Claim Value</th>
                                    <th className="px-4 py-2 text-[9px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-200 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs tabular-nums">
                                {activeClaims.map((claim, idx) => (
                                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 border-r border-slate-100 font-semibold text-slate-900">{claim.distributor_name}</td>
                                        <td className="px-4 py-3 border-r border-slate-100 font-mono text-[10px] text-slate-500">{claim.invoice_ref}</td>
                                        <td className="px-4 py-3 border-r border-slate-100 font-bold text-amber-600 text-right">₹{parseFloat(claim.claim_value).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="bg-amber-100 text-amber-700 border border-amber-300 px-2 py-0.5 text-[9px] font-bold uppercase rounded-sm">{claim.status}</span>
                                        </td>
                                    </tr>
                                ))}
                                {activeClaims.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-4 py-10 text-center text-slate-400 italic">No active shortage claims records.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <div className="md:hidden flex flex-col divide-y divide-slate-100">
                            {activeClaims.map((claim, idx) => (
                                <div key={idx} className="p-4 active:bg-slate-50">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="font-bold text-slate-900 text-xs">{claim.distributor_name}</p>
                                        <span className="bg-amber-100 text-amber-700 border border-amber-300 px-1.5 py-0.5 text-[8px] font-bold uppercase rounded-sm">{claim.status}</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <p className="text-[10px] font-mono text-slate-500">{claim.invoice_ref}</p>
                                        <p className="text-xs font-bold text-amber-600">₹{parseFloat(claim.claim_value).toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default MorningBriefing;
