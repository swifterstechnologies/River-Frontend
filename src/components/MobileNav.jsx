import React from 'react';
const MobileNav = ({ activeTab, setActiveTab, menuItems, onLogout }) => {
    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-xl border-t border-black/5 z-50 flex items-center justify-around px-2 pb-safe">
            {menuItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex flex-col items-center gap-1.5 transition-all outline-none ${activeTab === item.id ? 'text-[#0071E3]' : 'text-[#86868B]'}`}
                >
                    <div className={`transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : ''}`}>
                        <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    </div>
                    <span className="text-[10px] font-semibold tracking-wide">{item.label}</span>
                </button>
            ))}
            <button
                onClick={onLogout}
                className="flex flex-col items-center gap-1.5 text-slate-500 transition-all outline-none"
            >
                <div className="material-symbols-outlined">logout</div>
                <span className="text-[10px] font-semibold tracking-wide">Logout</span>
            </button>
        </div>
    );
};
export default MobileNav;
