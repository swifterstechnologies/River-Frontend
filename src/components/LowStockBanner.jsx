import React from 'react';
const LowStockBanner = ({ items, onAction }) => {
    if (items.length === 0) return null;
    return (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between animate-in slide-in-from-top duration-500">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-amber-600 text-[18px]">warning</span>
                </div>
                <div>
                    <p className="text-[13px] font-semibold text-amber-900">
                        Low Stock Alert: <span className="font-bold">{items.length} items</span> are below 10 units.
                    </p>
                    <p className="text-[10px] text-amber-700">Immediate restock recommended to avoid stockouts.</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                    {items.slice(0, 3).map((item, i) => (
                        <div key={i} title={item.name} className="w-6 h-6 rounded-full bg-white border border-amber-200 flex items-center justify-center text-[8px] font-bold text-amber-600 shadow-sm">
                            {item.name.substring(0, 1)}
                        </div>
                    ))}
                    {items.length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-amber-200 border border-white flex items-center justify-center text-[8px] font-bold text-amber-700 shadow-sm">
                            +{items.length - 3}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default LowStockBanner;
