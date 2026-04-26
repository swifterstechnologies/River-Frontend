import React, { useState, useEffect } from 'react';
import { getPrescriptionById } from '../services/api';
const PrescriptionView = () => {
    const id = window.location.pathname.split('/').pop();
    const [rx, setRx] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchRx = async () => {
            try {
                const res = await getPrescriptionById(id);
                setRx(res.data);
            } catch (err) {
                console.error("Fetch Rx failed:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchRx();
    }, [id]);
    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#006591]"></div>
        </div>
    );
    if (!rx) return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="text-center p-8 bg-white shadow-md rounded-sm">
                <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">event_busy</span>
                <p className="text-slate-600 font-bold">Prescription Not Found</p>
                <p className="text-slate-400 text-xs mt-1">Please contact your pharmacist.</p>
            </div>
        </div>
    );
    return (
        <div className="min-h-screen bg-slate-100 p-4 md:p-8 flex justify-center">
            <div className="bg-white max-w-3xl w-full shadow-xl border border-slate-200 flex flex-col min-h-[800px]">
                <div className="p-8 border-b-2 border-slate-800 flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tighter">DIGITAL PRESCRIPTION</h1>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Official Medical Document</p>
                    </div>
                    <div className="text-right">
                        <p className="text-slate-900 font-bold text-lg">Hospital / Pharmacy XYZ</p>
                        <p className="text-slate-500 text-[10px] font-medium italic">Reg No: 12345/RX/2026</p>
                    </div>
                </div>
                <div className="p-8 grid grid-cols-2 md:grid-cols-3 gap-6 bg-slate-50/30 border-b border-slate-100">
                    <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Patient Name</label>
                        <p className="font-extrabold text-[#006591] text-lg uppercase">{rx.patient_name}</p>
                    </div>
                    <div className="text-center border-x border-slate-200">
                        <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Age / Sex</label>
                        <p className="font-bold text-slate-800">{rx.patient_age_sex || '--'}</p>
                    </div>
                    <div className="text-right">
                        <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Date Issued</label>
                        <p className="font-bold text-slate-800">{new Date(rx.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                </div>
                <div className="flex-1 p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <span className="text-5xl font-serif font-bold text-slate-800 italic">Rx</span>
                        <div className="h-[2px] flex-1 bg-slate-800 opacity-20"></div>
                    </div>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b-2 border-slate-200">
                                <th className="py-4 text-xs font-extrabold uppercase text-slate-500 w-[50%]">Medicine & Dosage</th>
                                <th className="py-4 text-xs font-extrabold uppercase text-slate-500 text-center">Timing</th>
                                <th className="py-4 text-xs font-extrabold uppercase text-slate-500 text-right">Qty</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rx.items.map((item, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50/30 transition-colors">
                                    <td className="py-5">
                                        <p className="font-extrabold text-slate-900 text-sm uppercase">{item.medicine_name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] bg-[#006591] text-white px-2 py-0.5 rounded-full font-bold">{item.dosage}</span>
                                            <span className="text-[10px] text-slate-400 font-bold">•</span>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{item.duration}</span>
                                        </div>
                                    </td>
                                    <td className="py-5 text-center">
                                        <span className={`text-[10px] font-extrabold px-3 py-1 rounded-sm border ${item.timing?.includes('After') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                            {item.timing}
                                        </span>
                                    </td>
                                    <td className="py-5 text-right font-bold text-slate-900 tabular-nums">
                                        {item.quantity}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {rx.clinical_notes && (
                        <div className="mt-12 p-4 bg-slate-50 border-l-4 border-slate-300">
                            <label className="text-[9px] font-bold uppercase text-slate-400 block mb-2 tracking-widest">Special clinical notes</label>
                            <p className="text-slate-600 text-sm italic leading-relaxed">"{rx.clinical_notes}"</p>
                        </div>
                    )}
                </div>
                <div className="p-12 border-t border-slate-100 flex justify-between items-end bg-slate-50/50">
                    <div className="text-[10px] text-slate-400 font-medium max-w-[200px] leading-tight">
                        This is a computer-generated digital prescription. No physical signature is required unless explicitly specified by regulations.
                    </div>
                    <div className="text-center w-48">
                        <div className="h-[1px] bg-slate-800 w-full mb-2 opacity-30"></div>
                        <p className="font-extrabold text-slate-900 text-xs uppercase tracking-[0.2em]">{rx.staff_name || 'Authorized Doctor'}</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter mt-1">Registration ID: MD/789/00</p>
                    </div>
                </div>
                <div className="p-4 bg-slate-900 text-white flex justify-center print:hidden">
                    <button onClick={() => window.print()} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:text-sky-400 transition-colors">
                        <span className="material-symbols-outlined text-sm">print</span>
                        Print or Download PDF
                    </button>
                </div>
            </div>
        </div>
    );
};
export default PrescriptionView;
