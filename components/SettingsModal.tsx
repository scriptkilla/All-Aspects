
import React, { useRef, useState } from 'react';
import { X, Download, Upload, Trash2, FileSpreadsheet, FileJson, Settings, AlertTriangle, Plus, Building2, Tags, BellRing, Database, History, User, ArrowRightLeft, Printer, FileText, Percent, DollarSign, Search, MapPin, Sticker, Wifi, Globe } from 'lucide-react';
import { AppSettings, AuditLogEntry, AuditAction, PrinterProfile } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
  onImportData: (file: File) => void;
  onClearData: () => void;
  auditLogs?: AuditLogEntry[];
}

type Tab = 'general' | 'master' | 'automation' | 'documents' | 'system' | 'audit';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onExportJSON,
  onExportCSV,
  onImportData,
  onClearData,
  auditLogs = []
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Local state for list management inputs
  const [newCategory, setNewCategory] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newUnit, setNewUnit] = useState('');

  // Local state for Printer Management
  const [printerSearch, setPrinterSearch] = useState('');
  const [newPrinterName, setNewPrinterName] = useState('');
  const [newPrinterLocation, setNewPrinterLocation] = useState('');
  const [newPrinterType, setNewPrinterType] = useState<'Standard' | 'Label'>('Standard');
  const [newPrinterConnection, setNewPrinterConnection] = useState<'Browser' | 'Network'>('Browser');
  const [newPrinterIp, setNewPrinterIp] = useState('');
  const [newPrinterPort, setNewPrinterPort] = useState('9100');

  if (!isOpen) return null;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImportData(file);
    }
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  // --- Master Data Helpers ---
  const addToList = (listKey: keyof AppSettings, value: string, setter: (v: string) => void) => {
    if (!value.trim()) return;
    const list = settings[listKey] as string[];
    if (!list.includes(value.trim())) {
      onUpdateSettings({
        ...settings,
        [listKey]: [...list, value.trim()].sort()
      });
    }
    setter('');
  };

  const removeFromList = (listKey: keyof AppSettings, value: string) => {
    const list = settings[listKey] as string[];
    onUpdateSettings({
      ...settings,
      [listKey]: list.filter(item => item !== value)
    });
  };

  // --- Printer Helpers ---
  const handleAddPrinter = () => {
    if (!newPrinterName.trim()) return;
    
    const newPrinter: PrinterProfile = {
      id: crypto.randomUUID(),
      name: newPrinterName.trim(),
      location: newPrinterLocation.trim() || 'Unknown',
      type: newPrinterType,
      connection: newPrinterConnection,
      ipAddress: newPrinterConnection === 'Network' ? newPrinterIp : undefined,
      port: newPrinterConnection === 'Network' ? newPrinterPort : undefined
    };

    const currentPrinters = settings.printers || [];
    onUpdateSettings({
      ...settings,
      printers: [...currentPrinters, newPrinter]
    });

    setNewPrinterName('');
    setNewPrinterLocation('');
    setNewPrinterIp('');
    setNewPrinterPort('9100');
  };

  const handleDeletePrinter = (id: string) => {
    const currentPrinters = settings.printers || [];
    onUpdateSettings({
      ...settings,
      printers: currentPrinters.filter(p => p.id !== id)
    });
  };

  const filteredPrinters = (settings.printers || []).filter(p => 
    p.name.toLowerCase().includes(printerSearch.toLowerCase()) || 
    p.location.toLowerCase().includes(printerSearch.toLowerCase())
  );

  const renderTabButton = (id: Tab, label: string, icon: React.ElementType) => {
    const Icon = icon;
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
          isActive 
            ? 'bg-brand-accent text-slate-900 shadow-sm' 
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
        }`}
      >
        <Icon size={18} />
        {label}
      </button>
    );
  };

  const getActionIcon = (action: AuditAction) => {
    switch (action) {
      case 'CREATE': return <Plus size={14} />;
      case 'UPDATE': return <ArrowRightLeft size={14} />;
      case 'DELETE': return <Trash2 size={14} />;
      case 'ADJUST': return <Settings size={14} />;
      case 'SETTINGS': return <Database size={14} />;
      default: return <History size={14} />;
    }
  };

  const getActionColor = (action: AuditAction) => {
    switch (action) {
      case 'CREATE': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'UPDATE': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'DELETE': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'ADJUST': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'SETTINGS': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 flex-shrink-0">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <Settings className="text-brand-accent" size={20} />
            <h2 className="text-lg font-bold">Settings</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row h-full overflow-hidden">
          
          {/* Sidebar Navigation */}
          <div className="w-full md:w-56 bg-slate-50 dark:bg-slate-900/30 p-3 flex flex-row md:flex-col gap-1 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-700 overflow-x-auto md:overflow-visible flex-shrink-0">
             {renderTabButton('general', 'General', Building2)}
             {renderTabButton('master', 'Master Data', Tags)}
             {renderTabButton('documents', 'Documents', Printer)}
             {renderTabButton('automation', 'Automation', BellRing)}
             {renderTabButton('system', 'System', Database)}
             {renderTabButton('audit', 'Audit Log', History)}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            
            {/* --- General Tab --- */}
            {activeTab === 'general' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Company Profile</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase">Company Name</label>
                      <input 
                        type="text" 
                        value={settings.companyName}
                        onChange={(e) => onUpdateSettings({...settings, companyName: e.target.value})}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-accent outline-none"
                      />
                      <p className="text-xs text-slate-400 mt-1">Displayed in headers and reports.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- Master Data Tab --- */}
            {activeTab === 'master' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-200">
                
                {/* Category Management */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">Categories</h3>
                  <div className="flex gap-2 mb-3">
                    <input 
                      type="text" 
                      placeholder="New Category..." 
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addToList('categories', newCategory, setNewCategory)}
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-brand-accent"
                    />
                    <button 
                      onClick={() => addToList('categories', newCategory, setNewCategory)}
                      className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-brand-accent hover:text-slate-900 transition-colors"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {settings.categories.map(cat => (
                      <span key={cat} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {cat}
                        <button onClick={() => removeFromList('categories', cat)} className="hover:text-red-500 p-0.5 rounded">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-700"></div>

                {/* Location Management */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">Locations</h3>
                  <div className="flex gap-2 mb-3">
                    <input 
                      type="text" 
                      placeholder="New Location..." 
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addToList('locations', newLocation, setNewLocation)}
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-brand-accent"
                    />
                    <button 
                      onClick={() => addToList('locations', newLocation, setNewLocation)}
                      className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-brand-accent hover:text-slate-900 transition-colors"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {settings.locations.map(loc => (
                      <span key={loc} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {loc}
                        <button onClick={() => removeFromList('locations', loc)} className="hover:text-red-500 p-0.5 rounded">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-700"></div>

                {/* UOM Management */}
                 <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">Units of Measure</h3>
                  <div className="flex gap-2 mb-3">
                    <input 
                      type="text" 
                      placeholder="New Unit (e.g. kg, box)..." 
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addToList('units', newUnit, setNewUnit)}
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-brand-accent"
                    />
                    <button 
                      onClick={() => addToList('units', newUnit, setNewUnit)}
                      className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-brand-accent hover:text-slate-900 transition-colors"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {settings.units.map(u => (
                      <span key={u} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {u}
                        <button onClick={() => removeFromList('units', u)} className="hover:text-red-500 p-0.5 rounded">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* --- Documents Tab --- */}
            {activeTab === 'documents' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-200">
                 
                 {/* Printer Management Section */}
                 <div>
                   <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Printer Management</h3>
                      <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">{filteredPrinters.length} active</span>
                   </div>
                   
                   {/* Search Printers */}
                   <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="Search printers..." 
                        value={printerSearch}
                        onChange={(e) => setPrinterSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-accent outline-none"
                      />
                   </div>

                   {/* List of Printers */}
                   <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
                      {filteredPrinters.length === 0 ? (
                        <div className="text-center py-8 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                           <Printer className="mx-auto text-slate-300 dark:text-slate-600 mb-2" size={24} />
                           <p className="text-xs text-slate-500 dark:text-slate-400">No printers found.</p>
                        </div>
                      ) : (
                        filteredPrinters.map(printer => (
                          <div key={printer.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                             <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg flex-shrink-0 ${printer.type === 'Label' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                   {printer.type === 'Label' ? <Sticker size={18} /> : <Printer size={18} />}
                                </div>
                                <div className="min-w-0">
                                   <div className="flex items-center gap-2">
                                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{printer.name}</div>
                                      {printer.connection === 'Network' && (
                                         <div className="flex items-center gap-1 text-[10px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/30">
                                            <Wifi size={10} /> Network
                                         </div>
                                      )}
                                   </div>
                                   <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                      <div className="flex items-center gap-1">
                                         <MapPin size={10} /> {printer.location}
                                      </div>
                                      {printer.connection === 'Network' && printer.ipAddress && (
                                        <div className="flex items-center gap-1 font-mono">
                                           <Globe size={10} /> {printer.ipAddress}:{printer.port}
                                        </div>
                                      )}
                                   </div>
                                </div>
                             </div>
                             <button 
                               onClick={() => handleDeletePrinter(printer.id)}
                               className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                               title="Remove Printer"
                             >
                                <Trash2 size={16} />
                             </button>
                          </div>
                        ))
                      )}
                   </div>

                   {/* Add New Printer Form */}
                   <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                      <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                        <Plus size={14} /> Add New Printer
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                         {/* Row 1: Basic Info */}
                         <div className="sm:col-span-5">
                            <label className="block text-[10px] font-medium text-slate-400 mb-1">Printer Name</label>
                            <input 
                              type="text" 
                              placeholder="e.g. Warehouse Zebra" 
                              value={newPrinterName}
                              onChange={(e) => setNewPrinterName(e.target.value)}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-accent outline-none"
                            />
                         </div>
                         <div className="sm:col-span-4">
                            <label className="block text-[10px] font-medium text-slate-400 mb-1">Location</label>
                            <input 
                              type="text" 
                              placeholder="e.g. Shipping Dock" 
                              value={newPrinterLocation}
                              onChange={(e) => setNewPrinterLocation(e.target.value)}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-accent outline-none"
                            />
                         </div>
                         <div className="sm:col-span-3">
                             <label className="block text-[10px] font-medium text-slate-400 mb-1">Format</label>
                             <select
                               value={newPrinterType}
                               onChange={(e) => setNewPrinterType(e.target.value as 'Standard' | 'Label')}
                               className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-accent outline-none cursor-pointer"
                             >
                                <option value="Standard">Standard (A4)</option>
                                <option value="Label">Label (Thermal)</option>
                             </select>
                         </div>
                         
                         {/* Row 2: Connection Info */}
                         <div className="sm:col-span-4">
                             <label className="block text-[10px] font-medium text-slate-400 mb-1">Connection Type</label>
                             <select
                               value={newPrinterConnection}
                               onChange={(e) => setNewPrinterConnection(e.target.value as 'Browser' | 'Network')}
                               className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-accent outline-none cursor-pointer"
                             >
                                <option value="Browser">Browser / OS Default</option>
                                <option value="Network">Network / IP</option>
                             </select>
                         </div>
                         
                         {newPrinterConnection === 'Network' ? (
                           <>
                             <div className="sm:col-span-4">
                                <label className="block text-[10px] font-medium text-slate-400 mb-1">IP Address</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. 192.168.1.100" 
                                  value={newPrinterIp}
                                  onChange={(e) => setNewPrinterIp(e.target.value)}
                                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-accent outline-none font-mono"
                                />
                             </div>
                             <div className="sm:col-span-2">
                                <label className="block text-[10px] font-medium text-slate-400 mb-1">Port</label>
                                <input 
                                  type="text" 
                                  placeholder="9100" 
                                  value={newPrinterPort}
                                  onChange={(e) => setNewPrinterPort(e.target.value)}
                                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-accent outline-none font-mono"
                                />
                             </div>
                           </>
                         ) : (
                           <div className="sm:col-span-6 flex items-center text-xs text-slate-400 italic px-2">
                             Uses system print dialog.
                           </div>
                         )}

                         <div className="sm:col-span-2 flex items-end">
                            <button 
                              onClick={handleAddPrinter}
                              disabled={!newPrinterName.trim() || (newPrinterConnection === 'Network' && !newPrinterIp)}
                              className="w-full py-2 flex items-center justify-center bg-brand-accent disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 rounded-lg hover:bg-amber-400 transition-colors font-medium"
                              title="Add Printer"
                            >
                               Add
                            </button>
                         </div>
                      </div>
                   </div>
                 </div>

                 <div className="h-px bg-slate-100 dark:bg-slate-700"></div>

                 {/* Financial Settings */}
                 <div>
                   <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Financial Settings</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                         <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase">Tax Rate (%)</label>
                         <div className="relative">
                           <Percent size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                           <input 
                             type="number" 
                             min="0"
                             step="0.1"
                             value={settings.taxRate}
                             onChange={(e) => onUpdateSettings({...settings, taxRate: parseFloat(e.target.value) || 0})}
                             className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-accent outline-none"
                           />
                         </div>
                      </div>
                      <div>
                         <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase">Currency Symbol</label>
                         <div className="relative">
                           <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                           <input 
                             type="text" 
                             value={settings.currencySymbol}
                             onChange={(e) => onUpdateSettings({...settings, currencySymbol: e.target.value})}
                             className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-accent outline-none"
                           />
                         </div>
                      </div>
                   </div>

                   <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Document Defaults</h3>
                   <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase">Payment Terms</label>
                        <textarea
                          rows={2}
                          value={settings.invoiceTerms}
                          onChange={(e) => onUpdateSettings({...settings,invoiceTerms: e.target.value})}
                          placeholder="e.g. Payment due within 30 days"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-accent outline-none resize-none"
                        />
                        <p className="text-xs text-slate-400 mt-1">Appears at the bottom of Invoices.</p>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase">Footer Notes / Greeting</label>
                        <textarea
                          rows={2}
                          value={settings.invoiceNotes}
                          onChange={(e) => onUpdateSettings({...settings, invoiceNotes: e.target.value})}
                          placeholder="e.g. Thank you for your business!"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-accent outline-none resize-none"
                        />
                        <p className="text-xs text-slate-400 mt-1">A polite footer message for your clients.</p>
                      </div>
                   </div>
                 </div>
              </div>
            )}

            {/* --- Automation Tab --- */}
            {activeTab === 'automation' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
                 <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Stock Alerts</h3>
                    <div className="space-y-4">
                       <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                          <div>
                            <div className="font-medium text-sm text-slate-900 dark:text-slate-100">Low Stock Notifications</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">Show banner when items are below minimum</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={settings.lowStockAlerts} 
                              onChange={(e) => onUpdateSettings({...settings, lowStockAlerts: e.target.checked})}
                              className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-accent rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-accent"></div>
                          </label>
                       </div>

                       <div>
                          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase">Default Reorder Point</label>
                          <div className="flex items-center gap-3">
                            <input 
                              type="number" 
                              min="0"
                              value={settings.defaultMinStock}
                              onChange={(e) => onUpdateSettings({...settings, defaultMinStock: Number(e.target.value)})}
                              className="w-24 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-accent outline-none"
                            />
                            <span className="text-sm text-slate-500">units</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">Automatically applied to new inventory items.</p>
                       </div>
                    </div>
                 </div>
              </div>
            )}

            {/* --- System Tab --- */}
            {activeTab === 'system' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
                
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Data Management</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <button 
                      onClick={onExportCSV}
                      className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-brand-accent dark:hover:border-brand-accent hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all group text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                          <FileSpreadsheet size={20} />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">Export to Excel (CSV)</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">Spreadsheet compatible format</div>
                        </div>
                      </div>
                      <Download size={18} className="text-slate-400 group-hover:text-brand-accent transition-colors" />
                    </button>

                    <button 
                      onClick={onExportJSON}
                      className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-brand-accent dark:hover:border-brand-accent hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all group text-left"
                    >
                       <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                          <FileJson size={20} />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">Backup Data (JSON)</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">Full backup for restoring later</div>
                        </div>
                      </div>
                      <Download size={18} className="text-slate-400 group-hover:text-brand-accent transition-colors" />
                    </button>
                  </div>
                </div>

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer flex items-center justify-center flex-col gap-2 p-6 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-accent dark:hover:border-brand-accent hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all text-center group"
                >
                  <Upload size={24} className="text-slate-400 group-hover:text-brand-accent transition-colors" />
                  <div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">Restore Backup</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Click to upload JSON file</div>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept=".json"
                    className="hidden" 
                  />
                </div>

                {/* Danger Zone */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                   <h3 className="text-xs font-bold uppercase tracking-wider text-red-500 mb-3">Danger Zone</h3>
                   <button 
                      onClick={onClearData}
                      className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium"
                    >
                      <AlertTriangle size={16} />
                      Reset All Data
                    </button>
                </div>

              </div>
            )}

             {/* --- Audit Log Tab --- */}
            {activeTab === 'audit' && (
               <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200 h-full flex flex-col">
                 <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Activity History</h3>
                    <span className="text-xs text-slate-400">{auditLogs.length} events recorded</span>
                 </div>
                 
                 {auditLogs.length === 0 ? (
                   <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                      <History size={32} className="mb-2 opacity-50" />
                      <p>No activity recorded yet.</p>
                   </div>
                 ) : (
                   <div className="flex-1 overflow-y-auto -mx-2 px-2">
                      <div className="space-y-3">
                        {auditLogs.map(log => (
                          <div key={log.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 flex gap-3">
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getActionColor(log.action)}`}>
                                {getActionIcon(log.action)}
                             </div>
                             <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                   <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate pr-2">{log.entityName}</p>
                                   <span className="text-[10px] text-slate-400 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">{log.details}</p>
                                <div className="flex items-center gap-1 mt-1.5">
                                   <User size={10} className="text-slate-400" />
                                   <span className="text-[10px] text-slate-500">{log.user}</span>
                                </div>
                             </div>
                          </div>
                        ))}
                      </div>
                   </div>
                 )}
               </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
