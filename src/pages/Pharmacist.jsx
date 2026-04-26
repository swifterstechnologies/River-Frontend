import React, { useState } from 'react';
const Pharmacist = ({ inventory, wardRequests, onFulfillRequest }) => {
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [dispatchQty, setDispatchQty] = useState('');
    const pendingRequests = wardRequests.filter(req => req.status === 'pending');
    const urgentCount = pendingRequests.filter(req => req.urgency === 'stat').length;
    const routineCount = pendingRequests.filter(req => req.urgency === 'routine').length;
    const handleSelectRow = (req) => {
        setSelectedRequest(req);
        setDispatchQty(req.items[0].qty.toString());
    };
    const handleConfirmDispatch = () => {
        if (!selectedRequest) return;
        const drugName = selectedRequest.items[0].name;
        const invItem = inventory.find(i => i.name.toLowerCase() === drugName.toLowerCase() || i.name.includes(drugName));
        if (invItem && invItem.stock_quantity < parseInt(dispatchQty)) {
            alert('Warning: Insufficient stock for this dispatch quantity.');
        }
        onFulfillRequest(selectedRequest.id, parseInt(dispatchQty), drugName);
        setSelectedRequest(null);
        setDispatchQty('');
    };
    return (
        <div className="flex-1 flex flex-col lg:flex-row gap-6 h-full">
            <div className="w-full lg:w-[65%] bg-white shadow-sm border border-slate-200 rounded-sm flex flex-col overflow-hidden h-auto lg:h-[calc(100vh-140px)]">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-sm font-extrabold uppercase tracking-widest flex items-center gap-2 text-slate-900">
                            <span className="material-symbols-outlined text-[18px] text-[#006591]">local_pharmacy</span>
                            Central Dispensing Queue
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">Pending requests from wards. Fulfill to dispatch and deduct stock.</p>
                    </div>
                    <div className="flex gap-2">
                        <span className="bg-red-50 text-red-700 border border-red-200 px-3 py-1 text-[10px] font-bold uppercase rounded-sm flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]">warning</span> {urgentCount} Urgent
                        </span>
                        <span className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1 text-[10px] font-bold uppercase rounded-sm">
                            {routineCount} Routine
                        </span>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <table className="hidden md:table w-full text-left border-collapse min-w-[600px]">
                        <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10 shadow-sm">
                            <tr>
                                <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-r border-slate-200/50">Urgency / Time</th>
                                <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-r border-slate-200/50">Ward & Patient</th>
                                <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-r border-slate-200/50">Requested Drug</th>
                                <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-r border-slate-200/50 text-right">Req. Qty</th>
                                <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-r border-slate-200/50 text-right">In Stock</th>
                                <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs tabular-nums bg-white">
                            {pendingRequests.map((req) => {
                                const drugName = req.items[0].name;
                                const invItem = inventory.find(i => i.name.toLowerCase() === drugName.toLowerCase() || i.name.includes(drugName));
                                const currentStock = invItem ? invItem.stock_quantity : 0;
                                const isUrgent = req.urgency === 'stat';
                                const activeClass = selectedRequest?.id === req.id ? 'bg-sky-50' : '';
                                return (
                                    <tr key={req.id} onClick={() => handleSelectRow(req)} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${activeClass}`}>
                                        <td className="px-4 py-4 border-r border-slate-100">
                                            <p className={`font-black ${isUrgent ? 'text-red-600' : 'text-slate-600'} uppercase text-[10px] tracking-widest`}>{isUrgent ? 'STAT' : 'Routine'}</p>
                                            <p className="text-[11px] font-mono text-slate-500 mt-0.5">{req.time}</p>
                                        </td>
                                        <td className="px-4 py-4 border-r border-slate-100">
                                            <p className="font-bold text-slate-900">{req.wardName || 'General Ward'}</p>
                                            <p className="text-[10px] text-slate-500 mt-0.5">{req.patientName || 'Unknown'} (Bed {req.bedNumber || 'N/A'})</p>
                                        </td>
                                        <td className="px-4 py-4 border-r border-slate-100">
                                            <p className="font-bold text-[#006591]">{drugName}</p>
                                            <p className="text-[10px] text-slate-500 mt-0.5">ID: {invItem ? invItem.sku : 'N/A'}</p>
                                        </td>
                                        <td className="px-4 py-4 border-r border-slate-100 text-right">
                                            <span className="font-black text-[14px] text-slate-900">{req.items[0].qty}</span>
                                        </td>
                                        <td className="px-4 py-4 border-r border-slate-100 text-right">
                                            <span className={`font-bold text-[14px] ${currentStock < req.items[0].qty ? 'text-red-600' : 'text-green-600'}`}>{currentStock}</span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <button className="bg-white border border-[#006591] text-[#006591] px-4 py-1.5 text-[10px] font-bold uppercase rounded-sm hover:bg-sky-50 transition-colors shadow-sm">
                                                Select
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {pendingRequests.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-4 py-8 text-center text-slate-400 font-medium italic">
                                        No pending ward requests.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    <div className="md:hidden flex flex-col divide-y divide-slate-100">
                        {pendingRequests.map((req) => {
                            const drugName = req.items[0].name;
                            const isUrgent = req.urgency === 'stat';
                            return (
                                <div key={req.id} onClick={() => handleSelectRow(req)} className={`p-4 active:bg-sky-50 transition-colors ${selectedRequest?.id === req.id ? 'bg-sky-50 border-l-4 border-[#006591]' : ''}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className={`text-[10px] font-black uppercase tracking-widest ${isUrgent ? 'text-red-600' : 'text-slate-500'}`}>{isUrgent ? 'STAT' : 'Routine'}</p>
                                            <p className="font-bold text-slate-900 leading-tight">{req.wardName || 'Ward'}</p>
                                        </div>
                                        <p className="text-[10px] font-mono text-slate-400">{req.time}</p>
                                    </div>
                                    <div className="mt-2">
                                        <p className="text-sm font-bold text-[#006591]">{drugName}</p>
                                        <p className="text-[10px] text-slate-500">{req.patientName} (Bed {req.bedNumber})</p>
                                    </div>
                                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-50">
                                        <span className="text-xs font-bold text-slate-800">Req: {req.items[0].qty} units</span>
                                        <button className="text-[#006591] text-[10px] font-bold uppercase flex items-center gap-1">Dispense <span className="material-symbols-outlined text-[16px]">arrow_forward</span></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            <div className="w-full lg:w-[35%] bg-white shadow-sm border border-slate-200 rounded-sm flex flex-col overflow-hidden h-auto lg:h-[calc(100vh-140px)]">
                <div className="px-6 py-4 bg-[#006591] text-white border-b border-slate-200 flex items-center gap-2 shrink-0">
                    <span className="material-symbols-outlined text-[18px]">inventory</span>
                    <h2 className="text-sm font-extrabold uppercase tracking-widest">Dispatch Action</h2>
                </div>
                <div className="p-6 flex-1 overflow-y-auto bg-slate-50 flex flex-col gap-6">
                    {selectedRequest ? (() => {
                        const drugName = selectedRequest.items[0].name;
                        const invItem = inventory.find(i => i.name.toLowerCase() === drugName.toLowerCase() || i.name.includes(drugName));
                        const currentStock = invItem ? invItem.stock_quantity : 0;
                        return (
                            <>
                                <div className="bg-white p-4 border border-slate-200 rounded-sm shadow-sm">
                                    <p className="text-[9px] uppercase font-bold text-slate-500 tracking-widest mb-2">Target Destination</p>
                                    <p className="font-black text-slate-900 text-sm">{selectedRequest.wardName || 'General Ward'}</p>
                                    <p className="text-xs text-slate-500 mt-1">Patient: {selectedRequest.patientName}</p>
                                    <p className="text-[10px] font-mono text-slate-400 mt-2 pt-2 border-t border-slate-100">REQ-ID: {selectedRequest.id}</p>
                                </div>
                                <div className="bg-white p-4 border border-slate-200 rounded-sm shadow-sm">
                                    <p className="text-[9px] uppercase font-bold text-slate-500 tracking-widest mb-2">Item to Pick</p>
                                    <p className="font-black text-[#006591] text-lg leading-tight mb-3">{drugName}</p>
                                    <div className="flex justify-between items-center bg-slate-100 p-2 rounded-sm border border-slate-200 mb-4">
                                        <span className="text-xs font-bold text-slate-500">Available in Store:</span>
                                        <span className="font-black text-sm text-slate-900">{currentStock} Units</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-red-50 p-2 rounded-sm border border-red-200">
                                        <span className="text-xs font-bold text-red-600">Requested by Ward:</span>
                                        <span className="font-black text-sm text-red-600">{selectedRequest.items[0].qty} Units</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#006591] block mb-2">Actual Quantity to Dispatch</label>
                                    <input
                                        type="number"
                                        value={dispatchQty}
                                        onChange={(e) => setDispatchQty(e.target.value)}
                                        max={currentStock}
                                        min="0"
                                        className="w-full bg-white border-2 border-[#006591]/50 text-xl font-black text-center focus:ring-2 focus:ring-[#006591] focus:border-[#006591] py-3 rounded-sm shadow-sm"
                                    />
                                    <p className="text-[9px] text-slate-500 mt-2 text-center">Modify only if partial fulfillment is required.</p>
                                </div>
                            </>
                        );
                    })() : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                            <span className="material-symbols-outlined text-[48px] mb-4 opacity-20">touch_app</span>
                            <p className="text-sm font-medium">Select a request to process dispatch</p>
                        </div>
                    )}
                </div>
                <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] shrink-0">
                    <button
                        onClick={handleConfirmDispatch}
                        disabled={!selectedRequest}
                        className={`w-full text-white px-4 py-3.5 text-xs font-black uppercase tracking-widest transition-opacity rounded-sm shadow-sm flex items-center justify-center gap-2 ${selectedRequest ? 'bg-[#006591] hover:opacity-90' : 'bg-slate-300 cursor-not-allowed'}`}>
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        Confirm & Deduct Stock
                    </button>
                </div>
            </div>
        </div>
    );
};
export default Pharmacist;
