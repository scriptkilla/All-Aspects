
import React, { useState, useRef, useMemo } from 'react';
import { X, Printer, Tag, FileText, FileSpreadsheet, Receipt, Download, CheckSquare, Square } from 'lucide-react';
import { InventoryItem, AppSettings, getTotalQuantity } from '../types';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  settings: AppSettings;
}

type DocumentType = 'INVENTORY' | 'LABELS' | 'INVOICE' | 'QUOTE';

export const PrintModal: React.FC<PrintModalProps> = ({ isOpen, onClose, inventory, settings }) => {
  const [docType, setDocType] = useState<DocumentType>('INVENTORY');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [docNumber, setDocNumber] = useState(`INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`);
  const [validDate, setValidDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  
  // Selection state for Labels/Invoice
  // If empty, assume "All" for report, but "None" for others to force selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // For invoice editing (Qty override)
  const [lineItems, setLineItems] = useState<Record<string, number>>({}); // ItemID -> Qty

  if (!isOpen) return null;

  // --- Selection Logic ---
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
      // Remove from line items if unselected
      const newLines = { ...lineItems };
      delete newLines[id];
      setLineItems(newLines);
    } else {
      newSet.add(id);
      // Default qty 1 for invoice/quote
      setLineItems(prev => ({ ...prev, [id]: 1 }));
    }
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    if (selectedIds.size === inventory.length) {
      setSelectedIds(new Set());
      setLineItems({});
    } else {
      const allIds = new Set(inventory.map(i => i.id));
      setSelectedIds(allIds);
      const newLines: Record<string, number> = {};
      inventory.forEach(i => {
        newLines[i.id] = 1;
      });
      setLineItems(newLines);
    }
  };

  const getSelectedItems = () => {
    if (docType === 'INVENTORY' && selectedIds.size === 0) return inventory; // Report defaults to all
    return inventory.filter(i => selectedIds.has(i.id));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
     const itemsToExport = getSelectedItems();
     let csvContent = '';
     
     if (docType === 'LABELS' || docType === 'INVENTORY') {
        const headers = ["Name", "Barcode", "Category", "Total Qty", "Location"];
        const rows = itemsToExport.map(i => [
           `"${i.name}"`,
           `"${i.barcode || ''}"`,
           i.category,
           getTotalQuantity(i),
           `"${Object.keys(i.quantities).join(', ')}"`
        ]);
        csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
     } else {
        // Invoice/Quote
        const headers = ["Item", "Description", "Qty", "Unit Price", "Total"];
        const rows = itemsToExport.map(i => {
           const qty = lineItems[i.id] || 1;
           const total = qty * (i.price || 0);
           return [
              `"${i.name}"`,
              `"${i.description}"`,
              qty,
              i.price || 0,
              total.toFixed(2)
           ];
        });
        // Add total row
        const grandTotal = itemsToExport.reduce((acc, i) => acc + ((lineItems[i.id] || 1) * (i.price || 0)), 0);
        rows.push(["", "", "", "GRAND TOTAL", grandTotal.toFixed(2)]);
        
        csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
     }

     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
     const url = URL.createObjectURL(blob);
     const link = document.createElement('a');
     link.setAttribute('href', url);
     link.setAttribute('download', `${docType.toLowerCase()}_export.csv`);
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  // --- Render Components ---

  const renderSidebar = () => (
    <div className="w-full md:w-80 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col h-full overflow-hidden print:hidden">
      
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">Document Type</h2>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => setDocType('INVENTORY')}
            className={`p-3 rounded-lg flex flex-col items-center gap-1 text-xs font-medium transition-all ${docType === 'INVENTORY' ? 'bg-brand-accent text-slate-900 shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
          >
            <FileText size={20} /> Report
          </button>
          <button 
            onClick={() => setDocType('LABELS')}
            className={`p-3 rounded-lg flex flex-col items-center gap-1 text-xs font-medium transition-all ${docType === 'LABELS' ? 'bg-brand-accent text-slate-900 shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
          >
            <Tag size={20} /> Labels
          </button>
          <button 
            onClick={() => setDocType('INVOICE')}
            className={`p-3 rounded-lg flex flex-col items-center gap-1 text-xs font-medium transition-all ${docType === 'INVOICE' ? 'bg-brand-accent text-slate-900 shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
          >
            <Receipt size={20} /> Invoice
          </button>
           <button 
            onClick={() => setDocType('QUOTE')}
            className={`p-3 rounded-lg flex flex-col items-center gap-1 text-xs font-medium transition-all ${docType === 'QUOTE' ? 'bg-brand-accent text-slate-900 shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
          >
            <FileSpreadsheet size={20} /> Quote
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* Configuration Fields */}
        {(docType === 'INVOICE' || docType === 'QUOTE') && (
          <div className="space-y-3 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
             <h3 className="text-xs font-bold uppercase text-slate-400">Document Details</h3>
             <input 
               type="text" 
               placeholder="Customer Name"
               value={customerName}
               onChange={e => setCustomerName(e.target.value)}
               className="w-full p-2 text-sm border rounded bg-slate-50 dark:bg-slate-900 dark:border-slate-700"
             />
             <input 
               type="text" 
               placeholder="Doc Number (e.g. INV-001)"
               value={docNumber}
               onChange={e => setDocNumber(e.target.value)}
               className="w-full p-2 text-sm border rounded bg-slate-50 dark:bg-slate-900 dark:border-slate-700"
             />
             {docType === 'QUOTE' && (
               <div>
                 <label className="text-xs text-slate-500">Valid Until</label>
                 <input 
                  type="date" 
                  value={validDate}
                  onChange={e => setValidDate(e.target.value)}
                  className="w-full p-2 text-sm border rounded bg-slate-50 dark:bg-slate-900 dark:border-slate-700"
                />
               </div>
             )}
          </div>
        )}

        {/* Item Selection */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
             <h3 className="text-xs font-bold uppercase text-slate-400">Select Items</h3>
             <button onClick={toggleAll} className="text-xs text-brand-accent font-medium hover:underline">
               {selectedIds.size === inventory.length ? 'Deselect All' : 'Select All'}
             </button>
          </div>
          <div className="space-y-1 max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800">
             {inventory.map(item => (
               <div 
                 key={item.id} 
                 onClick={() => toggleSelection(item.id)}
                 className={`flex items-center gap-2 p-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 text-sm ${selectedIds.has(item.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
               >
                 {selectedIds.has(item.id) ? <CheckSquare size={16} className="text-brand-accent" /> : <Square size={16} className="text-slate-300" />}
                 <span className="truncate flex-1 text-slate-700 dark:text-slate-200">{item.name}</span>
               </div>
             ))}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
        <button 
          onClick={handleExportCSV}
          className="w-full flex items-center justify-center gap-2 p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
        >
           <Download size={16} /> Export to CSV (Excel)
        </button>
        <button 
          onClick={handlePrint}
          className="w-full flex items-center justify-center gap-2 p-3 bg-brand-accent text-slate-900 rounded-lg font-bold hover:bg-amber-400 transition-colors shadow-sm"
        >
           <Printer size={18} /> Print Document
        </button>
      </div>
    </div>
  );

  const renderInventoryReport = () => (
    <div className="p-8 bg-white min-h-full text-slate-900">
       <div className="mb-6 pb-4 border-b-2 border-slate-800">
          <h1 className="text-3xl font-bold uppercase tracking-tight">{settings.companyName}</h1>
          <div className="flex justify-between items-end mt-2">
            <h2 className="text-xl text-slate-600">Inventory Report</h2>
            <p className="text-sm text-slate-500">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
          </div>
       </div>
       
       <table className="w-full text-left text-sm">
         <thead>
           <tr className="border-b border-slate-300 text-xs uppercase font-bold text-slate-500">
             <th className="py-2">Item / SKU</th>
             <th className="py-2">Category</th>
             <th className="py-2 text-right">Qty</th>
             <th className="py-2 text-right">Value</th>
             <th className="py-2 pl-4">Locations</th>
           </tr>
         </thead>
         <tbody className="divide-y divide-slate-100">
           {getSelectedItems().map(item => {
             const qty = getTotalQuantity(item);
             return (
               <tr key={item.id} className="break-inside-avoid">
                 <td className="py-3 pr-4">
                   <div className="font-bold">{item.name}</div>
                   <div className="text-xs text-slate-500 font-mono">{item.barcode}</div>
                 </td>
                 <td className="py-3">{item.category}</td>
                 <td className="py-3 text-right font-mono">{qty} {item.unit}</td>
                 <td className="py-3 text-right font-mono">{settings.currencySymbol}{(item.price || 0).toFixed(2)}</td>
                 <td className="py-3 pl-4 text-xs text-slate-600">
                    {Object.entries(item.quantities).map(([l, q]) => `${l} (${q})`).join(', ')}
                 </td>
               </tr>
             );
           })}
         </tbody>
       </table>
       <div className="mt-8 pt-4 border-t border-slate-300 text-xs text-slate-400 flex justify-between">
          <span>Generated by All Aspects Inventory</span>
          <span>Page 1 of 1</span>
       </div>
    </div>
  );

  const renderLabels = () => (
    <div className="p-8 bg-white min-h-full text-slate-900">
       <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 print:grid-cols-3">
         {getSelectedItems().map(item => (
           <div key={item.id} className="border-2 border-slate-800 rounded-lg p-4 flex flex-col items-center text-center break-inside-avoid aspect-[3/2] justify-between relative">
              <div className="w-full text-left">
                 <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{settings.companyName}</div>
                 <div className="font-bold text-sm leading-tight line-clamp-2 h-10">{item.name}</div>
              </div>
              
              <div className="flex items-center justify-between w-full mt-2">
                 {/* QR Code Placeholder - Using a public API for visual representation in preview */}
                 <img 
                   src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${item.barcode || item.id}`} 
                   alt="QR" 
                   className="w-16 h-16 mix-blend-multiply"
                 />
                 <div className="text-right">
                    <div className="text-2xl font-bold">{Object.keys(item.quantities)[0] || 'N/A'}</div>
                    <div className="text-xs text-slate-500 uppercase">Primary Loc</div>
                 </div>
              </div>

              <div className="w-full mt-2 pt-2 border-t border-slate-200 flex justify-between items-center">
                 <span className="font-mono text-xs tracking-widest">{item.barcode || 'NO BARCODE'}</span>
                 <span className="text-xs font-bold">{item.category}</span>
              </div>
           </div>
         ))}
       </div>
    </div>
  );

  const renderInvoiceOrQuote = () => {
    const items = getSelectedItems();
    const isQuote = docType === 'QUOTE';
    
    const subtotal = items.reduce((sum, item) => {
      const qty = lineItems[item.id] || 1;
      return sum + (qty * (item.price || 0));
    }, 0);
    const taxRate = (settings.taxRate || 0) / 100;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    return (
      <div className="p-12 bg-white min-h-full text-slate-900 font-serif">
         {/* Header */}
         <div className="flex justify-between items-start mb-12">
            <div>
               <div className="w-12 h-12 bg-slate-900 text-white flex items-center justify-center font-bold text-xl mb-4">AA</div>
               <h1 className="text-2xl font-bold text-slate-900">{settings.companyName}</h1>
               <p className="text-sm text-slate-500 w-48">123 Construction Ave, Builder City, ST 12345</p>
            </div>
            <div className="text-right">
               <h1 className="text-4xl font-light text-slate-300 uppercase tracking-widest mb-2">{isQuote ? 'QUOTE' : 'INVOICE'}</h1>
               <div className="text-sm">
                  <span className="font-bold block text-slate-400 text-xs uppercase">Reference #</span>
                  <span className="font-mono">{docNumber}</span>
               </div>
               <div className="text-sm mt-2">
                  <span className="font-bold block text-slate-400 text-xs uppercase">Date</span>
                  <span>{new Date().toLocaleDateString()}</span>
               </div>
               {isQuote && (
                 <div className="text-sm mt-2">
                    <span className="font-bold block text-slate-400 text-xs uppercase">Valid Until</span>
                    <span>{new Date(validDate).toLocaleDateString()}</span>
                 </div>
               )}
            </div>
         </div>

         {/* Bill To */}
         <div className="mb-12 pb-8 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Bill To</h3>
            <div className="text-lg font-bold">{customerName || 'Customer Name'}</div>
            <div className="text-slate-500">{customerAddress || 'Customer Address'}</div>
         </div>

         {/* Table */}
         <table className="w-full mb-12">
            <thead>
               <tr className="text-xs font-bold text-slate-400 uppercase border-b-2 border-slate-900">
                  <th className="py-3 text-left">Item Description</th>
                  <th className="py-3 text-right w-24">Qty</th>
                  <th className="py-3 text-right w-32">Price</th>
                  <th className="py-3 text-right w-32">Total</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {items.map(item => {
                  const qty = lineItems[item.id] || 1;
                  const lineTotal = qty * (item.price || 0);
                  return (
                    <tr key={item.id}>
                       <td className="py-4">
                          <div className="font-bold">{item.name}</div>
                          <div className="text-xs text-slate-500">{item.description}</div>
                       </td>
                       <td className="py-4 text-right">
                          {/* Input for qty in preview mode only? No, let's just show text for print */}
                          <span className="print:hidden">
                            <input 
                               type="number" 
                               min="1" 
                               value={qty}
                               onChange={(e) => setLineItems(prev => ({...prev, [item.id]: parseInt(e.target.value) || 0}))}
                               className="w-16 p-1 border rounded text-right"
                            />
                          </span>
                          <span className="hidden print:inline">{qty}</span>
                       </td>
                       <td className="py-4 text-right font-mono">{settings.currencySymbol}{(item.price || 0).toFixed(2)}</td>
                       <td className="py-4 text-right font-bold font-mono">{settings.currencySymbol}{lineTotal.toFixed(2)}</td>
                    </tr>
                  );
               })}
            </tbody>
         </table>

         {/* Totals */}
         <div className="flex justify-end">
            <div className="w-64 space-y-2">
               <div className="flex justify-between text-sm">
                  <span className="font-bold text-slate-500">Subtotal</span>
                  <span className="font-mono">{settings.currencySymbol}{subtotal.toFixed(2)}</span>
               </div>
               <div className="flex justify-between text-sm">
                  <span className="font-bold text-slate-500">Tax ({settings.taxRate}%)</span>
                  <span className="font-mono">{settings.currencySymbol}{tax.toFixed(2)}</span>
               </div>
               <div className="flex justify-between text-lg font-bold border-t border-slate-900 pt-2 mt-2">
                  <span>Total</span>
                  <span className="font-mono">{settings.currencySymbol}{total.toFixed(2)}</span>
               </div>
            </div>
         </div>

         {/* Footer Terms */}
         <div className="mt-16 pt-8 border-t border-slate-200 text-xs text-slate-500">
            <h4 className="font-bold uppercase mb-2 text-slate-900">Terms & Conditions</h4>
            <p>{isQuote ? 'This quote is valid for the period stated above. Acceptance of this quote implies agreement to our standard terms of service.' : (settings.invoiceTerms || 'Payment is due within 30 days.')}</p>
            <p className="mt-2 italic text-slate-400">{settings.invoiceNotes}</p>
         </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center print:p-0 print:bg-white print:static print:z-auto">
      
      {/* Close Button (Hidden on Print) */}
      <button 
        onClick={onClose} 
        className="absolute top-4 right-4 text-white/50 hover:text-white z-[110] print:hidden"
      >
        <X size={32} />
      </button>

      <div className="w-full h-full max-w-7xl bg-white dark:bg-slate-950 rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row print:shadow-none print:rounded-none print:h-auto print:w-full print:max-w-none">
        
        {/* Sidebar Config */}
        {renderSidebar()}

        {/* Preview Area */}
        <div className="flex-1 bg-slate-100 dark:bg-black/50 p-8 overflow-y-auto print:p-0 print:bg-white print:overflow-visible">
           <div className="max-w-[210mm] mx-auto bg-white min-h-[297mm] shadow-lg print:shadow-none print:mx-0 print:w-full">
              {docType === 'INVENTORY' && renderInventoryReport()}
              {docType === 'LABELS' && renderLabels()}
              {(docType === 'INVOICE' || docType === 'QUOTE') && renderInvoiceOrQuote()}
           </div>
        </div>
      </div>
    </div>
  );
};
