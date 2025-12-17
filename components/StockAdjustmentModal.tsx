import React, { useState } from 'react';
import { X, MapPin, ArrowUpCircle, ArrowDownCircle, Save } from 'lucide-react';
import { InventoryItem, getTotalQuantity } from '../types';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onConfirm: (itemId: string, updates: Record<string, number>) => void;
  availableLocations: string[];
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  item,
  onConfirm,
  availableLocations
}) => {
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});
  // State to track which locations are currently visible/active in the modal
  // We start with locations that have stock, but user can add more.
  const [activeLocations, setActiveLocations] = useState<string[]>([]);

  // Reset state when item opens
  React.useEffect(() => {
    if (isOpen && item) {
      setAdjustments(item.quantities);
      const locationsWithStock = Object.keys(item.quantities);
      setActiveLocations(locationsWithStock.length > 0 ? locationsWithStock : [availableLocations[0]]);
    }
  }, [isOpen, item, availableLocations]);

  if (!isOpen || !item) return null;

  const handleQuantityChange = (loc: string, newQty: number) => {
    setAdjustments(prev => ({
      ...prev,
      [loc]: Math.max(0, newQty)
    }));
  };

  const handleAdjust = (loc: string, delta: number) => {
    const current = adjustments[loc] || 0;
    handleQuantityChange(loc, current + delta);
  };

  const handleAddLocation = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const loc = e.target.value;
    if (loc && !activeLocations.includes(loc)) {
      setActiveLocations([...activeLocations, loc]);
      setAdjustments(prev => ({ ...prev, [loc]: 0 }));
    }
  };

  const handleSave = () => {
    onConfirm(item.id, adjustments);
    onClose();
  };

  // Explicitly typing reduce as <number> to resolve "left-hand side of an arithmetic operation" error by ensuring result is a numeric type
  const totalNewQuantity = Object.values(adjustments).reduce<number>((sum, q) => sum + (q || 0), 0);
  const totalCurrentQuantity = getTotalQuantity(item);
  const diff = totalNewQuantity - totalCurrentQuantity;

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700 flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Adjust Stock</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{item.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          
          {activeLocations.map(loc => (
            <div key={loc} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <MapPin size={16} className="text-brand-accent" />
                {loc}
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleAdjust(loc, -1)}
                  className="w-8 h-8 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <ArrowDownCircle size={18} />
                </button>
                <input
                  type="number"
                  min="0"
                  className="w-16 text-center bg-transparent font-bold text-slate-900 dark:text-slate-100 outline-none"
                  value={adjustments[loc] || 0}
                  onChange={(e) => handleQuantityChange(loc, parseInt(e.target.value) || 0)}
                />
                <button 
                  onClick={() => handleAdjust(loc, 1)}
                  className="w-8 h-8 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <ArrowUpCircle size={18} />
                </button>
              </div>
            </div>
          ))}

          {/* Add Location Dropdown */}
          <div className="mt-2">
             <select 
               className="w-full p-2 text-sm border border-dashed border-slate-300 dark:border-slate-600 rounded-lg bg-transparent text-slate-500 hover:border-brand-accent hover:text-brand-accent transition-colors cursor-pointer outline-none"
               onChange={handleAddLocation}
               value=""
             >
               <option value="" disabled>+ Add another location</option>
               {availableLocations.filter(l => !activeLocations.includes(l)).map(l => (
                 <option key={l} value={l} className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">{l}</option>
               ))}
             </select>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 pt-0 bg-white dark:bg-slate-800 rounded-b-2xl">
           <div className="flex justify-between items-center text-sm mb-4 px-1">
              <span className="text-slate-500">Total Stock:</span>
              <div className="flex gap-2 items-center">
                 <span className="font-bold text-slate-900 dark:text-slate-100 text-lg">{totalNewQuantity}</span>
                 {diff !== 0 && (
                   <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${diff > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                     {diff > 0 ? '+' : ''}{diff}
                   </span>
                 )}
              </div>
           </div>

           <button
            onClick={handleSave}
            className="w-full py-3 bg-brand-accent text-slate-900 rounded-xl font-bold hover:bg-amber-400 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Save size={18} />
            Update Stock
          </button>
        </div>

      </div>
    </div>
  );
};