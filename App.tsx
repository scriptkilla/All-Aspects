
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Hammer, 
  Truck, 
  LayoutDashboard, 
  AlertTriangle,
  ClipboardList,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  Filter,
  Bell,
  X,
  Moon,
  Sun,
  ScanBarcode,
  Pencil,
  MapPin,
  Barcode,
  Settings,
  Printer
} from 'lucide-react';
import { InventoryItem, Category, Location, AppSettings, AuditLogEntry, AuditAction, DEFAULT_CATEGORIES, DEFAULT_LOCATIONS, DEFAULT_SETTINGS, getTotalQuantity } from './types';
import { StatCard } from './components/StatCard';
import { InventoryModal } from './components/InventoryModal';
import { ScannerModal } from './components/ScannerModal';
import { SettingsModal } from './components/SettingsModal';
import { StockAdjustmentModal } from './components/StockAdjustmentModal';
import { PrintModal } from './components/PrintModal';

// Initial seed data for demonstration - Updated to new structure and added prices
const INITIAL_DATA: InventoryItem[] = [
  { id: '1', name: 'Milwaukee M18 FUEL Impact Driver', barcode: '045242048572', description: '1/4" Hex Impact Driver, Brushless', category: 'Power Tools', quantities: { 'Van 1': 4 }, minStock: 2, unit: 'pcs', price: 149.00, lastUpdated: Date.now() },
  { id: '2', name: 'Milwaukee M18 FUEL Hammer Drill', barcode: '045242531050', description: '1/2" Hammer Drill/Driver', category: 'Power Tools', quantities: { 'Van 1': 3 }, minStock: 2, unit: 'pcs', price: 169.00, lastUpdated: Date.now() },
  { id: '3', name: 'Milwaukee SAWZALL Reciprocating Saw', description: 'M18 FUEL Sawzall with One-Key', category: 'Power Tools', quantities: { 'Warehouse': 2 }, minStock: 1, unit: 'pcs', price: 199.00, lastUpdated: Date.now() },
  { id: '4', name: 'Milwaukee 25ft Tape Measure', barcode: '045242519102', description: 'Magnetic Tape Measure', category: 'Hand Tools', quantities: { 'Job Site': 8 }, minStock: 5, unit: 'pcs', price: 24.99, lastUpdated: Date.now() },
  { id: '5', name: 'Milwaukee PACKOUT Tool Box', description: 'Large Rolling Tool Box', category: 'Materials', quantities: { 'Van 2': 2 }, minStock: 1, unit: 'units', price: 139.00, lastUpdated: Date.now() },
  { id: '6', name: '3/4" Plywood Sheets', description: '4x8 ACX grade plywood', category: 'Materials', quantities: { 'Job Site': 12 }, minStock: 20, unit: 'sheets', price: 45.00, lastUpdated: Date.now() },
  { id: '7', name: '2x4x8 Studs', description: 'Kiln Dried Whitewood Stud', category: 'Materials', quantities: { 'Job Site': 150 }, minStock: 50, unit: 'pcs', price: 4.50, lastUpdated: Date.now() },
  { id: '8', name: 'Wire Nuts (Red)', description: 'Box of 500 wing twist wire connectors', category: 'Electrical', quantities: { 'Warehouse': 450 }, minStock: 100, unit: 'pcs', price: 0.15, lastUpdated: Date.now() },
  { id: '9', name: '12/2 Romex Wire', barcode: '098213523111', description: '250ft Coil Yellow NM-B', category: 'Electrical', quantities: { 'Van 2': 6 }, minStock: 3, unit: 'rolls', price: 128.00, lastUpdated: Date.now() },
  { id: '10', name: 'Single Gang Outlet Box', description: 'Plastic New Work Box', category: 'Electrical', quantities: { 'Warehouse': 45 }, minStock: 20, unit: 'pcs', price: 1.25, lastUpdated: Date.now() },
  { id: '11', name: '1/2" PEX Pipe (Red)', description: '300ft Coil for Hot Water', category: 'Plumbing', quantities: { 'Warehouse': 2 }, minStock: 1, unit: 'rolls', price: 85.00, lastUpdated: Date.now() },
  { id: '12', name: '1/2" PEX Pipe (Blue)', description: '300ft Coil for Cold Water', category: 'Plumbing', quantities: { 'Warehouse': 3 }, minStock: 1, unit: 'rolls', price: 85.00, lastUpdated: Date.now() },
  { id: '13', name: 'Copper Elbows 1/2"', description: 'Bag of 50 90-degree elbows', category: 'Plumbing', quantities: { 'Van 1': 2 }, minStock: 1, unit: 'bags', price: 22.50, lastUpdated: Date.now() },
  { id: '14', name: 'Safety Glasses', description: 'Milwaukee Anti-Fog Safety Glasses', category: 'Safety', quantities: { 'Van 2': 12 }, minStock: 5, unit: 'pairs', price: 12.00, lastUpdated: Date.now() },
  { id: '15', name: 'Cut Resistant Gloves (L)', description: 'Level 3 Cut Resistant Dipped Gloves', category: 'Safety', quantities: { 'Job Site': 20 }, minStock: 10, unit: 'pairs', price: 8.50, lastUpdated: Date.now() },
  { id: '16', name: 'N95 Respirator Masks', description: 'Box of 20 masks', category: 'Safety', quantities: { 'Warehouse': 5 }, minStock: 2, unit: 'boxes', price: 25.00, lastUpdated: Date.now() },
  { id: '17', name: 'Estwing Framing Hammer', description: '22oz Steel Framing Hammer', category: 'Hand Tools', quantities: { 'Van 1': 4 }, minStock: 2, unit: 'pcs', price: 42.00, lastUpdated: Date.now() },
  { id: '18', name: 'Speed Square', description: 'Swanson 7-inch Aluminum Square', category: 'Hand Tools', quantities: { 'Job Site': 6 }, minStock: 3, unit: 'pcs', price: 12.00, lastUpdated: Date.now() },
  { id: '19', name: 'Drywall Screws 1-5/8"', description: '5lb Box Coarse Thread', category: 'Materials', quantities: { 'Job Site': 10 }, minStock: 5, unit: 'boxes', price: 35.00, lastUpdated: Date.now() },
  { id: '20', name: 'Construction Adhesive', description: 'Heavy Duty 10oz Tube', category: 'Materials', quantities: { 'Van 2': 24 }, minStock: 12, unit: 'tubes', price: 6.50, lastUpdated: Date.now() },
];

export default function App() {
  // --- State ---
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState<string>(''); // For new items
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<Category | 'All'>('All');
  const [filterLocation, setFilterLocation] = useState<Location | 'All'>('All');
  const [showNotificationBanner, setShowNotificationBanner] = useState(true);
  
  // Stock Adjustment Modal State
  const [adjustmentItem, setAdjustmentItem] = useState<InventoryItem | null>(null);

  // Dark Mode State
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // --- Effects ---
  
  // Handle Dark Mode Class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Load data from localStorage on mount with MIGRATION
  useEffect(() => {
    const savedData = localStorage.getItem('allaspects_inventory');
    const savedSettings = localStorage.getItem('allaspects_settings');
    const savedLogs = localStorage.getItem('allaspects_audit_logs');

    if (savedData) {
      try {
        const parsed: any[] = JSON.parse(savedData);
        // Data Migration: Convert legacy single-location items to new multi-location format
        // Also add missing 'price' field if needed
        const migrated = parsed.map(item => {
           let newItem = { ...item };
           if (!item.quantities && item.location) {
               newItem.quantities = { [item.location]: item.quantity || 0 };
           }
           if (item.price === undefined) {
               newItem.price = 0;
           }
           return newItem;
        });
        setInventory(migrated);
      } catch (e) {
        console.error("Failed to parse inventory", e);
        setInventory(INITIAL_DATA);
      }
    } else {
      setInventory(INITIAL_DATA);
    }

    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (e) {
        console.error("Failed to parse settings", e);
        setSettings(DEFAULT_SETTINGS);
      }
    }

    if (savedLogs) {
      try {
        const parsed = JSON.parse(savedLogs);
        setAuditLogs(parsed);
      } catch (e) {
        console.error("Failed to parse logs", e);
        setAuditLogs([]);
      }
    }
  }, []);

  // Save data to localStorage whenever inventory changes
  useEffect(() => {
    localStorage.setItem('allaspects_inventory', JSON.stringify(inventory));
  }, [inventory]);

  // Save settings to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem('allaspects_settings', JSON.stringify(settings));
  }, [settings]);

  // Save logs
  useEffect(() => {
    localStorage.setItem('allaspects_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // --- Helper: Log Action ---
  const logAction = (action: AuditAction, entityName: string, details: string, entityId?: string) => {
    const newLog: AuditLogEntry = {
      id: crypto.randomUUID(),
      action,
      entityName,
      details,
      timestamp: Date.now(),
      user: 'Admin' // In a real app, this would come from auth context
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // --- Actions ---
  const toggleDarkMode = () => setDarkMode(!darkMode);
  
  const handleSaveItem = (itemData: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
    if (editingItem) {
      // Update existing item
      setInventory(prev => prev.map(item => 
        item.id === editingItem.id 
          ? { ...item, ...itemData, lastUpdated: Date.now() }
          : item
      ));
      
      // Log Update
      logAction('UPDATE', itemData.name, `Updated item details. Total Qty: ${Object.values(itemData.quantities).reduce((a,b)=>a+b,0)}`, editingItem.id);
      setEditingItem(null);
    } else {
      // Create new item
      const newItemId = crypto.randomUUID();
      const item: InventoryItem = {
        ...itemData,
        id: newItemId,
        lastUpdated: Date.now()
      };
      setInventory(prev => [item, ...prev]);
      
      // Log Create
      logAction('CREATE', itemData.name, `Created new item in ${itemData.category}. Initial Qty: ${Object.values(itemData.quantities).reduce((a,b)=>a+b,0)}`, newItemId);
    }
    setIsModalOpen(false);
  };

  const handleEditClick = (item: InventoryItem) => {
    setEditingItem(item);
    setScannedBarcode('');
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setScannedBarcode('');
  };

  const handleDelete = (id: string) => {
    const itemToDelete = inventory.find(i => i.id === id);
    if (!itemToDelete) return;

    if(window.confirm(`Remove "${itemToDelete.name}" from inventory record?`)) {
      setInventory(prev => prev.filter(item => item.id !== id));
      logAction('DELETE', itemToDelete.name, 'Deleted item permanently', id);
    }
  };

  const handleQuickAdjust = (item: InventoryItem) => {
    setAdjustmentItem(item);
  };

  const confirmAdjustment = (itemId: string, newQuantities: Record<string, number>) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    setInventory(prev => prev.map(i => {
       if(i.id === itemId) {
         return { ...i, quantities: newQuantities, lastUpdated: Date.now() };
       }
       return i;
    }));

    // Calculate diffs for logging
    const changes: string[] = [];
    const allLocs = new Set([...Object.keys(item.quantities), ...Object.keys(newQuantities)]);
    allLocs.forEach(loc => {
      const oldQty = item.quantities[loc] || 0;
      const newQty = newQuantities[loc] || 0;
      if (oldQty !== newQty) {
        const diff = newQty - oldQty;
        changes.push(`${loc}: ${diff > 0 ? '+' : ''}${diff}`);
      }
    });

    if (changes.length > 0) {
      logAction('ADJUST', item.name, `Stock adjustment: ${changes.join(', ')}`, itemId);
    }

    setAdjustmentItem(null);
  };

  // Logic: Find Item -> Edit | No Item -> Create
  const handleScanResult = (result: string) => {
    setIsScannerOpen(false);
    
    // Search by barcode OR internal ID (useful for QR codes generated from the app)
    const existingItem = inventory.find(i => i.barcode === result || i.id === result);
    
    if (existingItem) {
      // Item found: Open edit modal directly
      setEditingItem(existingItem);
      setIsModalOpen(true);
    } else {
      // Item not found: Open add modal with barcode pre-filled
      setScannedBarcode(result);
      setEditingItem(null);
      setIsModalOpen(true);
    }
  };

  // --- Settings / Data Management Actions ---

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(inventory, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `inventory_backup_${new Date().toISOString().slice(0,10)}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    logAction('SETTINGS', 'System', 'Exported inventory to JSON');
  };

  const handleExportCSV = () => {
    // CSV Header
    const headers = ["Name", "Category", "Locations Breakdown", "Total Quantity", "Unit", "Price", "Min Stock", "Barcode", "Description"];
    
    // Map items to rows
    const rows = inventory.map(item => {
      const locStr = Object.entries(item.quantities)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" | ");
      
      return [
        `"${item.name.replace(/"/g, '""')}"`,
        `"${item.category}"`,
        `"${locStr}"`,
        getTotalQuantity(item),
        item.unit,
        item.price || 0,
        item.minStock,
        item.barcode ? `"${item.barcode}"` : "",
        `"${(item.description || "").replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [
      headers.join(","), 
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_export_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    logAction('SETTINGS', 'System', 'Exported inventory to CSV');
  };

  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        if (event.target?.result) {
          const importedData = JSON.parse(event.target.result as string);
          if (Array.isArray(importedData)) {
            if (window.confirm(`Replace current inventory with ${importedData.length} items from backup?`)) {
              setInventory(importedData);
              setIsSettingsOpen(false);
              logAction('SETTINGS', 'System', `Imported ${importedData.length} items from backup file`);
              alert("Inventory restored successfully.");
            }
          } else {
            alert("Invalid file format. Expected a list of items.");
          }
        }
      } catch (error) {
        console.error("Import Error:", error);
        alert("Failed to parse the file. Please ensure it is a valid JSON backup.");
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    if (window.confirm("ARE YOU SURE? This will delete all inventory items permanently. This action cannot be undone.")) {
      setInventory([]);
      setIsSettingsOpen(false);
      logAction('SETTINGS', 'System', 'Cleared all inventory data');
    }
  };


  // --- Derived Data ---
  // Include categories from settings + any that might exist on items
  const allCategories = useMemo(() => {
    const cats = new Set([...settings.categories, ...inventory.map(i => i.category)]);
    return Array.from(cats).sort();
  }, [inventory, settings.categories]);

  const allLocations = useMemo(() => {
    // Combine settings locations with any keys found in item quantities (orphan safety)
    const locs = new Set([...settings.locations]);
    inventory.forEach(item => {
      Object.keys(item.quantities).forEach(k => locs.add(k));
    });
    return Array.from(locs).sort();
  }, [inventory, settings.locations]);

  const filteredInventory = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return inventory.filter(item => {
      const totalQty = getTotalQuantity(item);
      
      // Search logic
      const matchesSearch = item.name.toLowerCase().includes(lowerSearch) || 
                          (item.description && item.description.toLowerCase().includes(lowerSearch)) ||
                          item.category.toLowerCase().includes(lowerSearch) ||
                          (item.barcode && item.barcode.includes(lowerSearch));
      
      const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
      
      // Location filter: Check if any location in the item's quantity map matches
      const matchesLocation = filterLocation === 'All' || (item.quantities[filterLocation] !== undefined && item.quantities[filterLocation] > 0);
      
      return matchesSearch && matchesCategory && matchesLocation;
    });
  }, [inventory, searchTerm, filterCategory, filterLocation]);

  const stats = useMemo(() => {
    const totalItems = inventory.length;
    const lowStockItems = inventory.filter(i => getTotalQuantity(i) <= i.minStock).length;
    const activeJobSiteItems = inventory.filter(i => i.quantities['Job Site'] > 0).length;
    const totalTools = inventory.filter(i => i.category === 'Power Tools' || i.category === 'Hand Tools').length;

    return { totalItems, lowStockItems, activeJobSiteItems, totalTools };
  }, [inventory]);

  // Styling class for dropdown options
  const optionClass = "bg-white text-slate-900 dark:bg-black dark:text-white";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 pb-24 md:pb-0 print:bg-white print:text-black">
      
      {/* --- Navbar --- */}
      <header className="bg-brand-blue dark:bg-slate-900 text-white sticky top-0 z-30 shadow-lg border-b border-transparent dark:border-slate-800 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-brand-accent p-2 rounded-md text-brand-blue">
                <Hammer size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="font-bold text-lg sm:text-xl tracking-tight">{settings.companyName}</h1>
                <p className="text-[10px] sm:text-xs text-slate-300 font-medium tracking-wide uppercase">General Contracting</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-sm text-slate-300 bg-slate-800 dark:bg-slate-950 px-3 py-1 rounded-full border border-slate-700">
                {new Date().toLocaleDateString()}
              </div>
              <button 
                onClick={toggleDarkMode} 
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 dark:hover:bg-slate-800 transition-colors"
                title="Toggle Theme"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button 
                onClick={() => setIsPrintModalOpen(true)}
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 dark:hover:bg-slate-800 transition-colors"
                title="Print Documents"
              >
                <Printer size={20} />
              </button>
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 dark:hover:bg-slate-800 transition-colors"
                title="Settings"
              >
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Hidden during print to allow PrintModal to take over */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 print:hidden">
        
        {/* --- Notification Banner --- */}
        {settings.lowStockAlerts && stats.lowStockItems > 0 && showNotificationBanner && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm flex justify-between items-start animate-in slide-in-from-top-2 duration-300">
            <div className="flex gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-full text-red-600 dark:text-red-400 flex-shrink-0 h-10 w-10 flex items-center justify-center">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-red-800 dark:text-red-200 text-sm sm:text-base">Low Stock Alert</h3>
                <p className="text-xs sm:text-sm text-red-700 dark:text-red-300 mt-1">
                  {stats.lowStockItems} item{stats.lowStockItems !== 1 ? 's' : ''} below minimum. Restock required.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowNotificationBanner(false)}
              className="text-red-400 hover:text-red-600 dark:hover:text-red-300 p-1"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* --- Stats Overview --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <StatCard 
            title="Types" 
            value={stats.totalItems} 
            icon={ClipboardList} 
            colorClass="bg-blue-600 text-blue-600" 
          />
          <StatCard 
            title="Alerts" 
            value={stats.lowStockItems} 
            icon={AlertTriangle} 
            colorClass="bg-red-500 text-red-500" 
            alert={stats.lowStockItems > 0}
          />
          <StatCard 
            title="On Site" 
            value={stats.activeJobSiteItems} 
            icon={Truck} 
            colorClass="bg-brand-accent text-amber-600" 
          />
          <StatCard 
            title="Tools" 
            value={stats.totalTools} 
            icon={Hammer} 
            colorClass="bg-emerald-500 text-emerald-700" 
          />
        </div>

        {/* --- Controls --- */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          
          {/* Search with Scanner */}
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-brand-accent transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search or scan..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-12 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500"
            />
            <button 
              onClick={() => setIsScannerOpen(true)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 text-slate-400 hover:text-brand-accent hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-all"
              title="Scan Barcode"
            >
              <ScanBarcode size={20} />
            </button>
          </div>

          {/* Filters & Actions */}
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 no-scrollbar">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700 flex-shrink-0">
               <Filter size={16} className="text-slate-400 ml-2" />
               <select 
                 value={filterCategory}
                 onChange={(e) => setFilterCategory(e.target.value as Category | 'All')}
                 className="bg-transparent border-none text-sm font-medium text-slate-700 dark:text-slate-300 focus:ring-0 cursor-pointer py-1.5 pl-1 pr-6 max-w-[140px] truncate"
               >
                 <option value="All" className={optionClass}>All Categories</option>
                 {allCategories.map(c => <option key={c} value={c} className={optionClass}>{c}</option>)}
               </select>
            </div>

             <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700 flex-shrink-0">
               <Truck size={16} className="text-slate-400 ml-2" />
               <select 
                 value={filterLocation}
                 onChange={(e) => setFilterLocation(e.target.value as Location | 'All')}
                 className="bg-transparent border-none text-sm font-medium text-slate-700 dark:text-slate-300 focus:ring-0 cursor-pointer py-1.5 pl-1 pr-6 max-w-[140px] truncate"
               >
                 <option value="All" className={optionClass}>All Locations</option>
                 {allLocations.map(l => <option key={l} value={l} className={optionClass}>{l}</option>)}
               </select>
            </div>

            <button 
              onClick={() => setIsModalOpen(true)}
              className="hidden md:flex bg-brand-accent hover:bg-amber-400 text-slate-900 px-4 py-2 rounded-lg font-bold items-center gap-2 whitespace-nowrap transition-colors shadow-sm ml-auto"
            >
              <Plus size={20} />
              <span>Add Item</span>
            </button>
          </div>
        </div>

        {/* --- Inventory View: Mobile Cards & Desktop Table --- */}
        
        {/* Mobile: Card View */}
        <div className="md:hidden space-y-4">
          {filteredInventory.length === 0 ? (
             <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center border border-dashed border-slate-300 dark:border-slate-700">
               <p className="text-slate-500 dark:text-slate-400">No items found matching "{searchTerm}"</p>
             </div>
          ) : (
            filteredInventory.map(item => {
              const totalQty = getTotalQuantity(item);
              const isLowStock = totalQty <= item.minStock;
              const locations = Object.entries(item.quantities).filter(([_, q]) => q > 0);
              
              return (
                <div key={item.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                  {/* Status Stripe */}
                  {isLowStock && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500"></div>
                  )}
                  
                  <div className="flex justify-between items-start mb-2 pl-2">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">{item.name}</h3>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {item.category}
                        </span>
                        {item.barcode && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-mono bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                            <Barcode size={10} />
                            {item.barcode}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                       <button 
                        onClick={() => handleEditClick(item)}
                        className="p-2 text-slate-400 hover:text-brand-accent bg-slate-50 dark:bg-slate-900 rounded-lg transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 dark:bg-slate-900 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 pl-2 line-clamp-2">{item.description}</p>
                  )}

                  {/* Location Chips */}
                  <div className="pl-2 mb-3 flex flex-wrap gap-1">
                    {locations.length > 0 ? locations.map(([loc, qty]) => (
                      <span key={loc} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                        <MapPin size={10} /> {loc}: {qty}
                      </span>
                    )) : (
                      <span className="text-xs text-slate-400 italic">No stock</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pl-2 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                     <div className="text-xs text-slate-400">
                        Min: {item.minStock}
                     </div>

                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleQuickAdjust(item)}
                        className="w-8 h-8 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 active:scale-95 transition-transform hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <ArrowDownCircle size={18} />
                      </button>
                      <div className="text-center min-w-[3rem]">
                        <span className={`block font-bold text-lg leading-none ${isLowStock ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}`}>
                          {totalQty}
                        </span>
                        <span className="text-[9px] text-slate-400 uppercase font-medium">{item.unit}</span>
                      </div>
                      <button 
                        onClick={() => handleQuickAdjust(item)}
                        className="w-8 h-8 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 active:scale-95 transition-transform hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <ArrowUpCircle size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">
                  <th className="px-6 py-4">Item Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Locations</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Total Quantity</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <Search size={32} className="text-slate-300 dark:text-slate-600" />
                        <p>No items found matching "{searchTerm}"</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map(item => {
                    const totalQty = getTotalQuantity(item);
                    const isLowStock = totalQty <= item.minStock;
                    const activeLocations = Object.entries(item.quantities).filter(([_, q]) => q > 0);

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{item.name}</div>
                          <div className="flex gap-2 mt-1">
                             {item.barcode && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-slate-400 bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-800">
                                  <Barcode size={10} />
                                  {item.barcode}
                                </span>
                             )}
                             {item.description && (
                                <span className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{item.description}</span>
                             )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                           <div className="flex flex-col gap-1">
                             {activeLocations.length > 0 ? (
                               activeLocations.map(([loc, qty]) => (
                                 <div key={loc} className="text-xs flex items-center gap-1.5">
                                   <span className="w-1.5 h-1.5 rounded-full bg-brand-accent"></span>
                                   {loc}: <span className="font-mono">{qty}</span>
                                 </div>
                               ))
                             ) : (
                               <span className="text-xs text-slate-400 italic">Out of stock</span>
                             )}
                           </div>
                        </td>
                         <td className="px-6 py-4 text-center">
                          {isLowStock ? (
                             <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
                              <AlertTriangle size={10} /> Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-3">
                            <button 
                              onClick={() => handleQuickAdjust(item)}
                              className="w-8 h-8 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600 hover:text-red-600 transition-colors"
                            >
                              <ArrowDownCircle size={16} />
                            </button>
                            <div className="text-center">
                              <div className={`font-bold ${isLowStock ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}`}>
                                {totalQty}
                              </div>
                              <div className="text-[10px] text-slate-400 uppercase">{item.unit}</div>
                            </div>
                            <button 
                              onClick={() => handleQuickAdjust(item)}
                              className="w-8 h-8 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600 hover:text-emerald-600 transition-colors"
                            >
                              <ArrowUpCircle size={16} />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleEditClick(item)}
                              className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              title="Edit Item"
                            >
                              <Pencil size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                              title="Delete Item"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-xs text-slate-500 dark:text-slate-400 flex justify-between items-center">
             <span>Showing {filteredInventory.length} items</span>
             <span>Total Stock: {filteredInventory.reduce((acc, i) => acc + getTotalQuantity(i), 0)} units</span>
          </div>
        </div>

      </main>

      {/* Mobile Floating Action Button */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-brand-accent text-slate-900 rounded-full shadow-xl shadow-brand-accent/30 flex items-center justify-center z-40 hover:scale-105 active:scale-95 transition-all border-2 border-white dark:border-slate-800 print:hidden"
        aria-label="Add New Item"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      <InventoryModal 
        isOpen={isModalOpen} 
        onClose={handleModalClose} 
        onSave={handleSaveItem}
        initialData={editingItem}
        availableCategories={settings.categories}
        availableLocations={settings.locations}
        availableUnits={settings.units}
        defaultMinStock={settings.defaultMinStock}
        initialBarcode={scannedBarcode}
      />

      <ScannerModal 
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScanResult}
      />

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onExportJSON={handleExportJSON}
        onExportCSV={handleExportCSV}
        onImportData={handleImportData}
        onClearData={handleClearData}
        auditLogs={auditLogs}
      />

      <StockAdjustmentModal
        isOpen={!!adjustmentItem}
        onClose={() => setAdjustmentItem(null)}
        item={adjustmentItem}
        onConfirm={confirmAdjustment}
        availableLocations={settings.locations}
      />

      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        inventory={inventory} // Or filteredInventory if you want to print only search results
        settings={settings}
      />

    </div>
  );
}
