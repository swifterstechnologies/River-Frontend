import React, { useState, useRef } from 'react';
import { transcribeAudio, processInput } from '../services/api';
const NurseStation = ({ inventory, wardRequests, onAddRequest, onAcknowledge }) => {
    const [selectedPatient, setSelectedPatient] = useState('');
    const [searchDrug, setSearchDrug] = useState('');
    const [reqQty, setReqQty] = useState('');
    const [urgency, setUrgency] = useState('routine');
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                setIsProcessing(true);
                try {
                    const transRes = await transcribeAudio(audioBlob);
                    const transcript = transRes.text || transRes.transcript;
                    if (transcript) {
                        const procRes = await processInput(transcript);
                        if (procRes.success && procRes.data && procRes.data.length > 0) {
                            const firstItem = procRes.data[0];
                            setSearchDrug(firstItem.matchedName || firstItem.name);
                            setReqQty(String(firstItem.quantity || '1'));
                        }
                    }
                } catch (err) {
                    console.error("Voice dictation failed:", err);
                    alert("Voice processing failed. Please try manual entry.");
                } finally {
                    setIsProcessing(false);
                }
            };
            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Mic access denied:", err);
            alert("Microphone access is required for dictation.");
        }
    };
    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
        setIsRecording(false);
    };
    const handleSendRequest = () => {
        if (!selectedPatient || !searchDrug || !reqQty) {
            alert('Please select a patient, drug, and quantity.');
            return;
        }
        const [pName, pBed, pWard] = selectedPatient.split('|');
        const newReq = {
            id: Math.floor(1000 + Math.random() * 9000).toString(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            patientName: pName,
            wardName: pWard,
            bedNumber: pBed,
            items: [{ name: searchDrug, qty: parseInt(reqQty) }],
            status: 'pending',
            urgency
        };
        onAddRequest(newReq);
        setSearchDrug('');
        setReqQty('');
        alert('Request sent to Pharmacy!');
    };
    const pendingCount = wardRequests.filter(r => r.status === 'pending').length;
    const inTransitCount = wardRequests.filter(r => r.status === 'in-transit').length;
    return (
        <div className="flex-1 flex flex-col lg:flex-row gap-6 h-full">
            <div className="w-full lg:w-[65%] bg-white shadow-sm border border-slate-200 rounded-sm flex flex-col overflow-hidden h-auto lg:h-[calc(100vh-140px)]">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-sm font-extrabold uppercase tracking-widest flex items-center gap-2 text-slate-900">
                            <span className="material-symbols-outlined text-[18px] text-[#006591]">medication</span>
                            Ward Drug Requisitions
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">Track requests to pharmacy and acknowledge deliveries to close the audit loop.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="bg-slate-200 text-slate-600 px-3 py-1 text-[10px] font-bold uppercase rounded-sm">{pendingCount} Pending</span>
                        <span className="bg-sky-100 text-sky-800 px-3 py-1 text-[10px] font-bold uppercase rounded-sm">{inTransitCount} In Transit</span>
                    </div>
                </div>
                {inTransitCount > 0 && (
                    <div className="bg-sky-50 border-b border-sky-100 px-6 py-3 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-[#006591] text-[20px]">local_shipping</span>
                            <p className="text-xs font-bold text-slate-900">Pharmacy has dispatched <span className="text-[#006591]">{inTransitCount}</span> order(s). Please acknowledge receipt upon physical delivery.</p>
                        </div>
                    </div>
                )}
                <div className="flex-1 overflow-y-auto">
                    <table className="hidden md:table w-full text-left border-collapse min-w-[600px]">
                        <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-r border-slate-200/50">Time / Req ID</th>
                                <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-r border-slate-200/50">Patient & Bed</th>
                                <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-r border-slate-200/50">Requested Items</th>
                                <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 text-right">Status & Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs tabular-nums bg-white">
                            {wardRequests.map((req) => (
                                <tr key={req.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4 border-r border-slate-100">
                                        {req.urgency === 'stat' && <span className="text-[9px] font-black text-red-600 uppercase block mb-1">STAT Urgent</span>}
                                        <p className="font-bold text-slate-900">{req.time}</p>
                                        <p className="text-[10px] font-mono text-slate-500 mt-0.5">REQ-{req.id}</p>
                                    </td>
                                    <td className="px-4 py-4 border-r border-slate-100">
                                        <p className="font-bold text-[#006591]">{req.patientName}</p>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <span className="material-symbols-outlined text-[14px] text-slate-500">bed</span>
                                            <p className="text-[10px] font-semibold text-slate-500 uppercase">{req.bedNumber}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 border-r border-slate-100">
                                        <p className="font-semibold text-slate-900">{req.items[0].name} <span className="text-[10px] text-slate-500 font-normal ml-1">x{req.items[0].qty}</span></p>
                                        {req.items.length > 1 && (
                                            <p className="text-[10px] text-slate-500 mt-1 font-medium">+ {req.items.length - 1} more items</p>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        {req.status === 'pending' && (
                                            <div className="flex flex-col items-end gap-2">
                                                <span className="inline-flex items-center px-2.5 py-1 bg-slate-200 text-slate-600 text-[9px] font-bold uppercase tracking-tighter rounded-sm">Pending at Pharmacy</span>
                                            </div>
                                        )}
                                        {req.status === 'in-transit' && (
                                            <div className="flex flex-col items-end gap-2">
                                                <span className="inline-flex items-center px-2.5 py-1 bg-sky-100 text-sky-800 text-[9px] font-bold uppercase tracking-tighter rounded-sm animate-pulse">In-Transit from Pharmacy</span>
                                                <button onClick={() => onAcknowledge(req.id)} className="bg-[#006591] text-white px-4 py-2 text-[10px] font-bold uppercase rounded-sm shadow-sm hover:opacity-90 flex items-center gap-1.5 transition-opacity">
                                                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                                    Acknowledge Receipt
                                                </button>
                                            </div>
                                        )}
                                        {req.status === 'received' && (
                                            <div className="flex flex-col items-end gap-2">
                                                <span className="inline-flex items-center px-2.5 py-1 bg-green-100 text-green-800 border border-green-200 text-[9px] font-bold uppercase tracking-tighter rounded-sm">Received & Logged</span>
                                                <p className="text-[9px] text-slate-500 font-mono">{req.receivedTime}</p>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {wardRequests.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-4 py-8 text-center text-slate-400 font-medium italic">
                                        No ward requests found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    <div className="md:hidden flex flex-col divide-y divide-slate-100">
                        {wardRequests.map((req) => (
                            <div key={req.id} className="p-4 active:bg-slate-50 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="text-[10px] font-mono text-slate-400">REQ-{req.id}</p>
                                        <p className="font-bold text-slate-900 leading-tight">{req.patientName}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 text-[8px] font-bold uppercase rounded-sm ${req.status === 'received' ? 'bg-green-100 text-green-800' : req.status === 'in-transit' ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-500'}`}>
                                        {req.status}
                                    </span>
                                </div>
                                <div className="mt-2 flex justify-between items-center">
                                    <p className="text-xs font-semibold text-slate-700">{req.items[0].name} <span className="text-[10px] text-slate-500 ml-1">x{req.items[0].qty}</span></p>
                                    <p className="text-[10px] font-bold text-slate-400">{req.time}</p>
                                </div>
                                {req.status === 'in-transit' && (
                                    <div className="mt-4 pt-3 border-t border-slate-50">
                                        <button onClick={() => onAcknowledge(req.id)} className="w-full bg-[#006591] text-white py-2 text-[10px] font-bold uppercase rounded-sm flex items-center justify-center gap-1.5 shadow-sm">
                                            <span className="material-symbols-outlined text-[16px]">check_circle</span> Acknowledge Receipt
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="w-full lg:w-[35%] bg-white shadow-sm border border-slate-200 rounded-sm flex flex-col overflow-hidden h-auto lg:h-[calc(100vh-140px)]">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 shrink-0">
                    <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-900">New Drug Request</h2>
                </div>
                <div className="p-6 flex-1 overflow-y-auto">
                    <div className="mb-5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Select Patient / Bed</label>
                        <select
                            className="w-full bg-white border border-slate-300 text-sm font-medium focus:ring-1 focus:ring-[#006591] focus:border-[#006591] px-3 py-2 rounded-sm"
                            value={selectedPatient}
                            onChange={(e) => setSelectedPatient(e.target.value)}
                        >
                            <option value="">-- Select Active Patient --</option>
                            <option value="John Doe|402-A|Ward A">John Doe (Bed: 402-A, Ward A)</option>
                            <option value="Jane Smith|105-B|Ward B">Jane Smith (Bed: 105-B, Ward B)</option>
                            <option value="Robert Roe|210-C|ICU">Robert Roe (Bed: 210-C, ICU)</option>
                        </select>
                    </div>
                    <div className="mb-5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Voice Dictation (AI)</label>
                        <div
                            onClick={isRecording ? stopRecording : startRecording}
                            className={`border border-dashed p-4 rounded-sm flex flex-col items-center justify-center text-center cursor-pointer transition-colors relative ${isRecording ? 'bg-red-50 border-red-300' : 'border-[#006591]/40 bg-sky-50/50 hover:bg-sky-50'}`}
                        >
                            {isProcessing && (
                                <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex flex-col items-center justify-center z-10 transition-all">
                                    <span className="material-symbols-outlined animate-spin text-[#006591] text-[24px]">progress_activity</span>
                                    <p className="text-[10px] font-bold text-[#006591] mt-1 uppercase tracking-tighter">AI Extraction...</p>
                                </div>
                            )}
                            <button className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md mb-2 transition-all ${isRecording ? 'bg-red-600 animate-pulse text-white' : 'bg-[#006591] text-white shadow-[#006591]/20 shadow-lg'}`}>
                                <span className="material-symbols-outlined text-[24px]">{isRecording ? 'stop' : 'mic'}</span>
                            </button>
                            <p className={`text-xs font-bold ${isRecording ? 'text-red-700' : 'text-[#006591]'}`}>
                                {isRecording ? 'Tap to Stop' : 'Tap to dictate drugs'}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">"Two strips paracetamol, one IV fluid..."</p>
                        </div>
                    </div>
                    <div className="mb-6 relative">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-white px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">OR TYPE MANUAL</span>
                        </div>
                    </div>
                    <div className="space-y-3 mb-6">
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Search drug catalog..."
                                    className="w-full bg-white border border-slate-300 focus:border-[#006591] focus:ring-1 focus:ring-[#006591] text-xs px-3 py-2 rounded-sm"
                                    value={searchDrug}
                                    onChange={(e) => setSearchDrug(e.target.value)}
                                    list="inventory-list"
                                />
                                <datalist id="inventory-list">
                                    {inventory.map((item, idx) => (
                                        <option key={idx} value={item.name} />
                                    ))}
                                </datalist>
                            </div>
                            <div className="w-20">
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="Qty"
                                    className="w-full bg-white border border-slate-300 focus:border-[#006591] focus:ring-1 focus:ring-[#006591] text-xs px-3 py-2 rounded-sm"
                                    value={reqQty}
                                    onChange={(e) => setReqQty(e.target.value)}
                                />
                            </div>
                        </div>
                        <button className="text-[10px] font-bold text-[#006591] uppercase flex items-center gap-1 hover:underline">
                            <span className="material-symbols-outlined text-[14px]">add</span> Add another item
                        </button>
                    </div>
                    <div className="mb-6">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Urgency Level</label>
                        <div className="flex gap-3">
                            <label className="flex items-center gap-2 text-xs font-medium text-slate-900 cursor-pointer">
                                <input type="radio" name="urgency" value="routine" checked={urgency === 'routine'} onChange={(e) => setUrgency(e.target.value)} className="text-[#006591] focus:ring-[#006591]" /> Routine
                            </label>
                            <label className="flex items-center gap-2 text-xs font-medium text-red-600 cursor-pointer">
                                <input type="radio" name="urgency" value="stat" checked={urgency === 'stat'} onChange={(e) => setUrgency(e.target.value)} className="text-red-600 focus:ring-red-600" /> STAT (Urgent)
                            </label>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0">
                    <button onClick={handleSendRequest} className="w-full bg-[#006591] text-white px-4 py-3 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity rounded-sm shadow-sm flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">send</span>
                        Send Request to Pharmacy
                    </button>
                </div>
            </div>
        </div>
    );
};
export default NurseStation;
