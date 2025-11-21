
import React, { useState, useEffect } from 'react';
import { X, Save, Briefcase, ScanBarcode, MapPin, Trash2, Plus, DollarSign } from 'lucide-react';
import { InventoryItem, DEFAULT_CATEGORIES, DEFAULT_LOCATIONS, DEFAULT_UNITS } from '../types';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => void;
  initialData?: InventoryItem | null;
  availableCategories?: string[];
  availableLocations?: string[];
  availableUnits?: string[];
  initialBarcode?: string;
  defaultMinStock?: number;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave,
  initialData,
  availableCategories = DEFAULT_CATEGORIES,
  availableLocations = DEFAULT_LOCATIONS,
  availableUnits = DEFAULT_UNITS,
  initialBarcode = '',
  defaultMinStock = 5
}) => {
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  
  // Replaces simple location/quantity state
  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  
  const [minStock, setMinStock] = useState(defaultMinStock);
  const [unit, setUnit] = useState('units');
  const [price, setPrice] = useState<string>('0');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setBarcode(initialData.barcode || '');
        setDescription(initialData.description || '');
        setCategory(initialData.category);
        // Load existing quantities
        setStockMap(initialData.quantities || {});
        setMinStock(initialData.minStock);
        setUnit(initialData.unit);
        setPrice(initialData.price?.toString() || '0');
      } else {
        setName('');
        setBarcode(initialBarcode || '');
        setDescription('');
        setCategory(availableCategories[0] || 'Materials');
        // Default: 0 stock in first available location
        setStockMap({ [availableLocations[0]]: 0 });
        setMinStock(defaultMinStock);
        setUnit('units');
        setPrice('0');
      }
    }
  }, [isOpen, initialData, initialBarcode, defaultMinStock, availableCategories, availableLocations]);

  if (!isOpen) return null;

  const handleStockChange = (loc: string, qty: number) => {
    setStockMap(prev => ({ ...prev, [loc]: qty }));
  };

  const removeLocation = (loc: string) => {
    setStockMap(prev => {
      const next = { ...prev };
      delete next[loc];
      return next;
    });
  };

  const addLocation = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const loc = e.target.value;
    if (loc && stockMap[loc] === undefined) {
      setStockMap(prev => ({ ...prev, [loc]: 0 }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      barcode,
      description,
      category,
      quantities: stockMap,
      minStock: Number(minStock),
      unit,
      price: parseFloat(price) || 0
    });
    onClose();
  };

  const totalQuantity = Object.values(stockMap).reduce((sum, q) => sum + q, 0);

  // Filter locations that are not yet added to the item
  const unusedLocations = availableLocations.filter(l => stockMap[l] === undefined);

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 sm:p-6">
      <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
        
        {/* Fixed Header */}
        <div className="bg-slate-900 dark:bg-slate-950 px-6 py-4 flex justify-between items-center border-b border-slate-800 rounded-t-2xl sm:rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-2 text-white">
            <Briefcase className="text-brand-accent" size={20} />
            <h2 className="text-lg font-bold">{initialData ? 'Edit Inventory Item' : 'Add New Inventory'}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="overflow-y-auto p-6">
          <form id="inventory-form" onSubmit={handleSubmit} className="space-y-5">
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DeWalt 20V Impact Driver"
                  className="w-full px-4 py-3 sm:py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition-all placeholder-slate-400"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="sm:col-span-1">
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Barcode</label>
                 <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <ScanBarcode size={16} />
                    </div>
                    <input
                      type="text"
                      placeholder="Scan..."
                      className="w-full pl-9 pr-3 py-3 sm:py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition-all placeholder-slate-400 text-sm font-mono"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                    />
                 </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
              <textarea
                placeholder="Optional details about the item..."
                className="w-full px-4 py-3 sm:py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition-all resize-none h-20 placeholder-slate-400"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                <input
                  list="category-list"
                  required
                  placeholder="Select..."
                  className="w-full px-4 py-3 sm:py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none placeholder-slate-400"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
                <datalist id="category-list">
                  {availableCategories.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Unit</label>
                <input
                  list="unit-list"
                  type="text"
                  placeholder="pcs"
                  className="w-full px-4 py-3 sm:py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none placeholder-slate-400"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                />
                <datalist id="unit-list">
                  {availableUnits.map(u => <option key={u} value={u} />)}
                </datalist>
              </div>
              <div className="sm:col-span-1">
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Unit Price</label>
                 <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <DollarSign size={14} />
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-3 sm:py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition-all placeholder-slate-400"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                 </div>
              </div>
            </div>

            {/* Stock Location Mapping */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                   <MapPin size={16} className="text-brand-accent" />
                   Stock Locations
                </h3>
                <span className="text-xs font-medium text-slate-500 bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                  Total: {totalQuantity} {unit}
                </span>
              </div>
              
              <div className="space-y-3">
                {Object.entries(stockMap).map(([loc, qty]) => (
                  <div key={loc} className="flex items-center gap-3 animate-in slide-in-from-left-2 duration-200">
                    <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300">
                       <span className="w-2 h-2 rounded-full bg-brand-accent"></span>
                       {loc}
                    </div>
                    <div className="flex items-center gap-2">
                       <input
                          type="number"
                          min="0"
                          className="w-20 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none text-center"
                          value={qty}
                          onChange={(e) => handleStockChange(loc, Number(e.target.value))}
                        />
                        <button
                          type="button"
                          onClick={() => removeLocation(loc)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Remove Location"
                        >
                          <Trash2 size={18} />
                        </button>
                    </div>
                  </div>
                ))}

                {/* Add Location Control */}
                {unusedLocations.length > 0 && (
                   <div className="relative mt-2">
                      <select
                        onChange={addLocation}
                        value=""
                        className="w-full appearance-none bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 hover:text-brand-accent hover:border-brand-accent px-4 py-2 rounded-lg cursor-pointer text-sm text-center transition-colors outline-none"
                      >
                        <option value="" disabled>+ Add Location</option>
                        {unusedLocations.map(l => (
                          <option key={l} value={l} className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">
                             {l}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-500">
                         <Plus size={16} className="mr-2" /> Add Location
                      </div>
                   </div>
                )}
              </div>
            </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Min Stock Alert (Total)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 sm:px-4 py-3 sm:py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none"
                  value={minStock}
                  onChange={(e) => setMinStock(Number(e.target.value))}
                />
                <p className="text-xs text-slate-400 mt-1">Alert when total quantity across all locations drops below this.</p>
              </div>

          </form>
        </div>

        {/* Fixed Footer */}
        <div className="p-6 pt-0 flex-shrink-0 flex gap-3 bg-white dark:bg-slate-800 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 sm:py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            form="inventory-form"
            type="submit"
            className="flex-1 px-4 py-3 sm:py-2.5 bg-brand-accent text-slate-900 rounded-lg font-bold hover:bg-amber-400 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Save size={18} />
            {initialData ? 'Save Changes' : 'Create Item'}
          </button>
        </div>
      </div>
    </div>
  );
};
