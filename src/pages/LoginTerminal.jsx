import React, { useState } from 'react';
import { login as loginApi } from '../services/api';
const LoginTerminal = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await loginApi(username, password);
            if (res.success) {
                onLogin(res.user);
            } else {
                setError(res.error || 'Login failed');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Server error, please try again later.');
        } finally {
            setLoading(false);
        }
    };
    const handleDemoLogin = async (role) => {
        const mockUsers = {
            admin: { id: 1, username: 'admin', role: 'admin', name: 'Admin User' },
            nurse: { id: 2, username: 'nurse', role: 'nurse', name: 'Nurse Staff' },
            pharmacist: { id: 3, username: 'pharm', role: 'pharmacist', name: 'Pharmacy Staff' },
        };
        onLogin(mockUsers[role]);
    };
    return (
        <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4 sm:p-6 font-['Inter'] overflow-y-auto py-10">
            <div className="w-full max-w-lg transition-all duration-300">
                <div className="text-center mb-6 sm:mb-8">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#006591] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <span className="material-symbols-outlined text-white text-[28px] sm:text-[32px] !font-variation-['FILL' 1]">water_drop</span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">River</h1>
                    <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">Enterprise Resource Platform</p>
                </div>
                <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
                    <div className="p-6 sm:p-10">
                        <div className="mb-6 sm:mb-8 text-center sm:text-left">
                            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">Secure Terminal Access</h2>
                            <p className="text-[10px] sm:text-xs text-slate-500">Authorized personnel only. Please verify your credentials.</p>
                        </div>
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {error && (
                                <div className="bg-red-50 text-red-600 text-[11px] font-bold py-3 px-4 rounded-xl border border-red-100 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">info</span>
                                    {error}
                                </div>
                            )}
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-2 ml-1">Identity ID</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">badge</span>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#006591]/10 focus:border-[#006591] text-sm font-semibold transition-all outline-none text-slate-900"
                                        placeholder="Enter username"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2 ml-1">
                                    <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Security Key</label>
                                    <a href="#" className="text-[10px] font-bold text-[#006591]">Password Reset?</a>
                                </div>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">lock_open</span>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#006591]/10 focus:border-[#006591] text-sm font-semibold transition-all outline-none text-slate-900"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full bg-[#006591] hover:bg-[#00547a] text-white font-bold py-4 rounded-2xl shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${loading ? 'opacity-50' : ''}`}>
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span>Sign In to Environment</span>
                                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                    <div className="bg-slate-50 p-6 sm:p-8 border-t border-slate-100">
                        <div className="flex items-center gap-3 mb-4 sm:mb-6">
                            <div className="h-px bg-slate-200 flex-1"></div>
                            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">Fast Access Profiles</span>
                            <div className="h-px bg-slate-200 flex-1"></div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                            <button onClick={() => handleDemoLogin('nurse')} className="flex flex-col items-center justify-center p-3 sm:p-4 bg-white border border-slate-200 rounded-xl sm:rounded-2xl hover:border-[#006591] hover:bg-sky-50 transition-all group active:scale-95">
                                <span className="material-symbols-outlined text-slate-400 group-hover:text-[#006591] mb-1 sm:mb-2 text-[20px] sm:text-[24px]">vaccines</span>
                                <span className="text-[9px] sm:text-[10px] font-bold text-slate-600 group-hover:text-[#006591]">Nurse</span>
                            </button>
                            <button onClick={() => handleDemoLogin('pharmacist')} className="flex flex-col items-center justify-center p-3 sm:p-4 bg-white border border-slate-200 rounded-xl sm:rounded-2xl hover:border-[#006591] hover:bg-sky-50 transition-all group active:scale-95">
                                <span className="material-symbols-outlined text-slate-400 group-hover:text-[#006591] mb-1 sm:mb-2 text-[20px] sm:text-[24px]">local_pharmacy</span>
                                <span className="text-[9px] sm:text-[10px] font-bold text-slate-600 group-hover:text-[#006591]">Pharmacy</span>
                            </button>
                            <button onClick={() => handleDemoLogin('admin')} className="flex flex-col items-center justify-center p-3 sm:p-4 bg-white border border-slate-200 rounded-xl sm:rounded-2xl hover:border-[#006591] hover:bg-sky-50 transition-all group active:scale-95">
                                <span className="material-symbols-outlined text-slate-400 group-hover:text-[#006591] mb-1 sm:mb-2 text-[20px] sm:text-[24px]">monitoring</span>
                                <span className="text-[9px] sm:text-[10px] font-bold text-slate-600 group-hover:text-[#006591]">Admin</span>
                            </button>
                        </div>
                    </div>
                </div>
                <p className="text-center mt-8 text-[11px] text-slate-400 font-medium">
                    &copy; 2026 River. All rights reserved.
                </p>
            </div>
        </div>
    );
};
export default LoginTerminal;
