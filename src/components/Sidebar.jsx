import React from 'react';
const Sidebar = ({ activeTab, setActiveTab, currentUserRole, menuItems, onLogout }) => {
    const roleName = currentUserRole === 'admin' ? 'Administrator' :
        currentUserRole === 'nurse' ? 'Nurse' :
            currentUserRole === 'pharmacist' ? 'Pharmacist' : 'User';
    const roleDesc = currentUserRole === 'admin' ? 'Full Access' :
        currentUserRole === 'nurse' ? 'Clinical OS' :
            currentUserRole === 'pharmacist' ? 'Inventory Control' : '';
    return (
        <aside className="hidden md:flex flex-col h-full py-4 bg-slate-100 dark:bg-slate-900 w-64 border-r-0 font-['Inter'] tabular-nums text-sm antialiased shrink-0 fixed top-0 left-0 z-50 print:hidden">
            <div className="px-6 mb-8">
                <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#006591] !font-variation-['FILL' 1]">water_drop</span>
                    River
                </h1>
                <p className="text-[10px] uppercase tracking-[0.1em] text-slate-500 font-bold ml-8">Next-Gen ERP</p>
            </div>
            <nav className="flex-1 space-y-1 px-3">
                {menuItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const baseClasses = "flex items-center gap-3 px-3 py-2 transition-transform cursor-pointer ";
                    const activeClasses = isActive
                        ? "bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-400 font-semibold shadow-sm rounded-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-sm";
                    return (
                        <a
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={baseClasses + activeClasses}
                        >
                            <span className="material-symbols-outlined font-variation-['FILL' 0]">{item.icon}</span>
                            <span>{item.label}</span>
                        </a>
                    );
                })}
            </nav>
            <div className="px-6 mt-auto">
                <div
                    onClick={onLogout}
                    className="flex items-center gap-3 py-4 border-t border-slate-200/50 cursor-pointer hover:opacity-80 transition-opacity"
                    title="Click to logout"
                >
                    <div className="w-8 h-8 bg-[#006591] rounded-sm flex items-center justify-center text-white text-xs font-bold">
                        {currentUserRole ? currentUserRole.substring(0, 2).toUpperCase() : 'US'}
                    </div>
                    <div>
                        <p className="text-xs font-bold leading-none text-slate-900 dark:text-white capitalize">{roleName}</p>
                        <p className="text-[10px] text-slate-500">{roleDesc}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};
export default Sidebar;
