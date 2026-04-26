import React, { useState, useRef, useEffect } from 'react';
import { processPrescriptionInput, transcribeAudio, savePrescription, getPrescriptions } from '../services/api';
const VoicePrescription = () => {
    const [activeTab, setActiveTab] = useState('new'); 
    const [inputText, setInputText] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [loading, setLoading] = useState(false);
    const [patientInfo, setPatientInfo] = useState({ name: '', age_sex: '', mobile: '' });
    const [extractedItems, setExtractedItems] = useState([]);
    const [committing, setCommitting] = useState(false);
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [totalRows, setTotalRows] = useState(0);
    const limit = 10;
    const authorizedStaff = "Authorized Staff";
    const staffTitle = "Pharmacy Dept";
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);
    const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
            const res = await getPrescriptions({ search: searchTerm, limit, offset: page * limit });
            setHistory(res.data || []);
            setTotalRows(res.total || 0);
        } catch (err) {
            console.error("Fetch history failed:", err);
        } finally {
            setHistoryLoading(false);
        }
    };
    useEffect(() => {
        if (activeTab === 'history') {
            fetchHistory();
        }
    }, [activeTab, page, searchTerm]);
    const updateItem = (index, field, value) => {
        const newItems = [...extractedItems];
        newItems[index] = { ...newItems[index], [field]: value };
        setExtractedItems(newItems);
    };
    const startVoiceInput = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            setRecordingTime(0);
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };
            mediaRecorder.onstop = async () => {
                clearInterval(timerRef.current);
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                setLoading(true);
                try {
                    const res = await transcribeAudio(audioBlob);
                    const transcript = res.text || res.transcript;
                    if (transcript) {
                        setInputText(prev => prev + (prev ? " " : "") + transcript);
                    }
                } catch (err) {
                    console.error("Pro Voice failed:", err);
                    alert("Voice AI Error: " + (err.response?.data?.error || err.message));
                } finally {
                    setLoading(false);
                    setIsRecording(false);
                }
            };
            mediaRecorder.start();
            setIsRecording(true);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    if (prev >= 29) {
                        stopVoiceInput();
                        return 30;
                    }
                    return prev + 1;
                });
            }, 1000);
        } catch (err) {
            console.error("Mic access denied:", err);
            alert("Microphone access is required for clinical dictation.");
        }
    };
    const stopVoiceInput = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
        clearInterval(timerRef.current);
        setIsRecording(false);
    };
    const handleProcess = async () => {
        if (!inputText.trim()) return;
        setLoading(true);
        try {
            const res = await processPrescriptionInput(inputText);
            if (res.data) {
                setPatientInfo({
                    name: res.data.patient?.name || '',
                    age_sex: res.data.patient?.age || '',
                    mobile: res.data.patient?.mobile || ''
                });
                const mappedMeds = (res.data.medicines || []).map(m => ({
                    ...m,
                    dosageStr: `${m.morning || 0}-${m.afternoon || 0}-${m.night || 0}`,
                    timing: m.timing || 'After Food',
                    duration: m.duration || '5 Days',
                    quantity: m.quantity || 1
                }));
                setExtractedItems(mappedMeds);
            }
        } catch (err) {
            alert("AI Processing failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };
    const handlePrint = () => {
        window.print();
    };
    const finalizePrescription = async () => {
        if (!patientInfo.name) return alert("Patient Name is required!");
        setCommitting(true);
        try {
            const res = await savePrescription({
                patientInfo: { ...patientInfo, clinical_notes: inputText, staff_name: authorizedStaff },
                medicines: extractedItems
            });
            alert("Prescription saved successfully!");
            setExtractedItems([]);
            setInputText('');
            setPatientInfo({ name: '', age_sex: '', mobile: '' });
            setActiveTab('history');
        } catch (err) {
            alert("Finalization failed: " + (err.response?.data?.error || err.message));
        } finally {
            setCommitting(false);
        }
    };
    const sendToWhatsApp = (id, patientMobile, patientName) => {
        const baseUrl = window.location.origin;
        const rxUrl = `${baseUrl}/view-rx/${id}`;
        const message = `📦 *PHARMACY PRESCRIPTION - ${patientName.toUpperCase()}*\n\nHi, your digital prescription sheet is ready. Click the link below to view/download:\n\n🔗 ${rxUrl}\n\n_Take care and get well soon!_`;
        const encodedMsg = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${patientMobile.replace(/\D/g, '')}?text=${encodedMsg}`;
        window.open(whatsappUrl, '_blank');
    };
    return (
        <div className="flex-1 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-140px)] print:m-0 print:p-0 print:h-auto">
            <div className="flex gap-1 bg-slate-100 p-1 rounded-sm w-fit print:hidden">
                <button
                    onClick={() => setActiveTab('new')}
                    className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-all ${activeTab === 'new' ? 'bg-[#006591] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    New Prescription
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-all ${activeTab === 'history' ? 'bg-[#006591] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Rx History
                </button>
            </div>
            {activeTab === 'new' ? (
                <div className="flex-1 flex gap-6 overflow-hidden print:gap-0">
                    <div className="w-[35%] bg-white shadow-sm border border-slate-200 rounded-sm flex flex-col overflow-hidden max-w-[400px] print:hidden">
                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                            <h2 className="text-xs font-extrabold uppercase tracking-widest flex items-center gap-2 text-slate-800">
                                <span className="material-symbols-outlined text-[16px] text-[#006591]">mic</span>
                                Clinical Dictation
                            </h2>
                            {isRecording && (
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#006591] opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#006591]"></span>
                                </span>
                            )}
                        </div>
                        <div className="flex-1 p-4 flex flex-col gap-4">
                            <div className="flex flex-col items-center py-6 gap-3">
                                <button
                                    onClick={isRecording ? stopVoiceInput : startVoiceInput}
                                    className={`w-16 h-16 rounded-full flex items-center justify-center border transition-all ${isRecording ? 'bg-red-50 border-red-300 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-slate-50 border-slate-300 text-slate-400 hover:border-[#006591] hover:text-[#006591]'}`}
                                >
                                    <span className="material-symbols-outlined text-3xl">{isRecording ? 'stop' : 'mic'}</span>
                                </button>
                                {isRecording && (
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="text-[11px] font-bold text-red-500 animate-pulse">RECORDING: {30 - recordingTime}s left</div>
                                        <div className="w-32 h-1 bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-red-500 transition-all duration-1000" 
                                                style={{ width: `${(recordingTime / 30) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 flex flex-col">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Live Transcript</label>
                                <textarea
                                    className="flex-1 bg-white border border-slate-300 focus:border-[#006591] focus:ring-1 focus:ring-[#006591] text-sm p-3 rounded-sm resize-none outline-none leading-relaxed text-slate-800 placeholder:text-slate-400"
                                    placeholder="Click the mic to dictate the patient's condition, or type clinical notes manually..."
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleProcess}
                                disabled={loading || !inputText.trim()}
                                className={`relative overflow-hidden bg-[#006591] text-white px-4 py-3 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all rounded-sm shadow-sm w-full disabled:opacity-50 flex justify-center items-center gap-2 ${loading ? 'cursor-not-allowed' : ''}`}
                            >
                                {loading && (
                                    <div className="absolute inset-0 bg-[#004c6e] flex items-center justify-center animate-in fade-in duration-300">
                                        <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                                        <span className="ml-2">AI Extraction...</span>
                                    </div>
                                )}
                                <span className={loading ? 'opacity-0' : 'opacity-100 flex items-center gap-2'}>
                                    <span className="material-symbols-outlined text-[18px]">psychology</span>
                                    Analyze & Extract Rx
                                </span>
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 bg-white shadow-sm border border-slate-200 rounded-sm flex flex-col overflow-hidden print:shadow-none print:border-none print:w-full print:static">
                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center print:hidden">
                            <h2 className="text-xs font-extrabold uppercase tracking-widest flex items-center gap-2 text-slate-800">
                                <span className="material-symbols-outlined text-[16px] text-[#006591]">assignment</span>
                                Structured Prescription
                            </h2>
                        </div>
                        <div className="flex-1 flex flex-col overflow-y-auto">
                            <div className="hidden print:block p-8 border-b-2 border-slate-800 mb-4">
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight text-center mb-1">MEDICAL PRESCRIPTION</h1>
                                <p className="text-slate-600 font-semibold text-center uppercase tracking-widest text-sm">{authorizedStaff} • {staffTitle}</p>
                            </div>
                            <div className="p-4 border-b border-slate-200 bg-white flex gap-4 print:border-none print:bg-transparent">
                                <div className="flex-1">
                                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Patient Name</label>
                                    <input
                                        type="text"
                                        value={patientInfo.name}
                                        onChange={(e) => setPatientInfo({ ...patientInfo, name: e.target.value })}
                                        placeholder="Required"
                                        className="w-full bg-slate-50 border border-slate-300 focus:border-[#006591] focus:ring-1 focus:ring-[#006591] text-sm px-2 py-1.5 font-medium rounded-sm outline-none text-slate-800 print:bg-transparent print:border-none print:p-0"
                                    />
                                </div>
                                <div className="w-32">
                                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Age / Sex</label>
                                    <input
                                        type="text"
                                        value={patientInfo.age_sex}
                                        onChange={(e) => setPatientInfo({ ...patientInfo, age_sex: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 text-sm px-2 py-1.5 font-medium rounded-sm outline-none"
                                    />
                                </div>
                                <div className="w-40">
                                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Mobile</label>
                                    <input
                                        type="text"
                                        value={patientInfo.mobile}
                                        onChange={(e) => setPatientInfo({ ...patientInfo, mobile: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 text-sm px-2 py-1.5 font-medium rounded-sm outline-none"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[600px] print:w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200 print:bg-transparent print:border-black">
                                        <tr>
                                            <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-r border-slate-200 w-1/3">Medicine Name</th>
                                            <th className="px-2 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-r border-slate-200">Dosage</th>
                                            <th className="px-2 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-r border-slate-200">Timing</th>
                                            <th className="px-2 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-r border-slate-200">Duration</th>
                                            <th className="px-2 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 text-right">Qty</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-xs tabular-nums bg-white">
                                        {extractedItems.length === 0 && (
                                            <tr><td colSpan="5" className="py-12 text-center text-slate-400 font-medium">Awaiting doctor's dictation...</td></tr>
                                        )}
                                        {extractedItems.map((item, idx) => (
                                            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group print:border-slate-300">
                                                <td className="px-4 py-2 border-r border-slate-200">
                                                    <input type="text" value={item.name} onChange={(e) => updateItem(idx, 'name', e.target.value)} className="w-full bg-transparent border-none text-xs font-bold text-slate-800 outline-none" />
                                                </td>
                                                <td className="px-1 py-1 border-r border-slate-200 text-center">
                                                    <input type="text" value={item.dosageStr} onChange={(e) => updateItem(idx, 'dosageStr', e.target.value)} className="w-full bg-transparent border-none text-xs text-center outline-none" />
                                                </td>
                                                <td className="px-1 py-1 border-r border-slate-200">
                                                    <select value={item.timing} onChange={(e) => updateItem(idx, 'timing', e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 hover:border-[#006591] text-[11px] px-1 py-1 rounded-sm outline-none">
                                                        <option value="After Food">After Food</option>
                                                        <option value="Before Food">Before Food</option>
                                                        <option value="Apply Locally">Apply Locally</option>
                                                    </select>
                                                </td>
                                                <td className="px-1 py-1 border-r border-slate-200">
                                                    <input type="text" value={item.duration} onChange={(e) => updateItem(idx, 'duration', e.target.value)} className="w-full bg-transparent border-none text-xs outline-none" />
                                                </td>
                                                <td className="px-1 py-1">
                                                    <input type="number" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} className="w-full bg-transparent border-none text-xs text-right outline-none" />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center z-20 print:hidden">
                            <button onClick={handlePrint} className="bg-white border border-slate-300 text-slate-700 px-4 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-slate-100 rounded-sm shadow-sm flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px]">print</span>
                                Print Rx
                            </button>
                            <button onClick={finalizePrescription} disabled={extractedItems.length === 0 || committing} className="bg-[#006591] text-white px-8 py-2.5 text-xs font-bold uppercase tracking-wider hover:opacity-90 rounded-sm shadow-sm flex items-center gap-2 disabled:opacity-50">
                                <span className="material-symbols-outlined text-[16px]">{committing ? 'sync' : 'save'}</span>
                                {committing ? 'Saving...' : 'Confirm & Save Rx'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 bg-white shadow-sm border border-slate-200 rounded-sm flex flex-col overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                        <h2 className="text-xs font-extrabold uppercase tracking-widest flex items-center gap-2 text-slate-800">
                            <span className="material-symbols-outlined text-[16px] text-[#006591]">history</span>
                            Prescription History
                        </h2>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                            <input
                                type="text"
                                placeholder="Search Patient Name / Mobile..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                                className="pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded-sm outline-none focus:border-[#006591] w-64"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/50 sticky top-0 z-10 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500">Date & Time</th>
                                    <th className="px-6 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500">Patient Details</th>
                                    <th className="px-6 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500">Mobile</th>
                                    <th className="px-6 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500">Medicines</th>
                                    <th className="px-6 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 text-center">Share</th>
                                    <th className="px-6 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs">
                                {historyLoading ? (
                                    <tr><td colSpan="6" className="py-12 text-center text-slate-400">Loading history...</td></tr>
                                ) : history.length === 0 ? (
                                    <tr><td colSpan="6" className="py-12 text-center text-slate-400">No prescriptions found.</td></tr>
                                ) : history.map((row) => (
                                    <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">{new Date(row.created_at).toLocaleString()}</td>
                                        <td className="px-6 py-4 font-bold text-[#006591] uppercase">{row.patient_name} <span className="text-slate-400 font-medium normal-case ml-2">({row.patient_age_sex})</span></td>
                                        <td className="px-6 py-4 tabular-nums text-slate-600">{row.patient_mobile}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-sm font-bold text-[10px]">{row.item_count} Items</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => sendToWhatsApp(row.id, row.patient_mobile, row.patient_name)}
                                                className="bg-emerald-50 text-emerald-600 p-2 rounded-full hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                                title="Share via WhatsApp"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">share</span>
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <a
                                                href={`${window.location.origin}/view-rx/${row.id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[#006591] hover:underline font-bold text-[10px] uppercase tracking-wider"
                                            >
                                                View Sheet
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                        <p className="text-[11px] text-slate-500 font-medium">
                            Showing {Math.min(page * limit + 1, totalRows)} to {Math.min((page + 1) * limit, totalRows)} of {totalRows} records
                        </p>
                        <div className="flex gap-2">
                            <button
                                disabled={page === 0}
                                onClick={() => setPage(p => p - 1)}
                                className="px-3 py-1 bg-white border border-slate-200 text-xs rounded-sm hover:bg-slate-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                disabled={(page + 1) * limit >= totalRows}
                                onClick={() => setPage(p => p + 1)}
                                className="px-3 py-1 bg-[#006591] text-white text-xs rounded-sm hover:opacity-90 disabled:opacity-50 shadow-sm"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default VoicePrescription;
