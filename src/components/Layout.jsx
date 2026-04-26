import React from 'react';
const Layout = ({ children }) => {
    return (
        <div className="flex-1 ml-0 md:ml-64 flex flex-col h-screen overflow-hidden relative bg-[#f8f9ff] print:ml-0 print:overflow-visible print:bg-white">
            <header className="hidden sm:flex h-14 w-full sticky top-0 z-40 bg-white dark:bg-slate-950 items-center justify-between px-6 border-b border-slate-200/20 dark:border-slate-800/20 print:hidden">
                <div className="flex items-center gap-4 flex-1">
                </div>
                <div className="flex items-center gap-4">
                    <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-sm">
                        <span className="material-symbols-outlined">notifications</span>
                    </button>
                    <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-sm">
                        <span className="material-symbols-outlined">settings</span>
                    </button>
                    <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
                    <div className="flex items-center gap-3 cursor-pointer">
                        <div className="text-right">
                            <p className="text-xs font-bold text-slate-900">Admin User</p>
                            <p className="text-[10px] text-slate-500">Pharmacy Staff</p>
                        </div>
                        <div className="w-8 h-8 bg-[#dce9ff] rounded-sm flex items-center justify-center">
                            <span className="material-symbols-outlined text-slate-600">person</span>
                        </div>
                    </div>
                </div>
            </header>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 md:pb-6">
                {children}
            </div>
        </div>
    );
};
export default Layout;
