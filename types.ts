

export type Category = string;

export type Location = string;

export interface InventoryItem {
  id: string;
  name: string;
  barcode?: string; // Scan code / UPC / EAN
  description: string;
  category: Category;
  quantities: Record<string, number>; // Map of Location Name -> Quantity
  minStock: number;
  unit: string; // e.g., "boxes", "units", "ft"
  price: number; // Selling price or value per unit
  lastUpdated: number; // timestamp
}

export interface PrinterProfile {
  id: string;
  name: string;
  location: string;
  type: 'Standard' | 'Label';
  connection: 'Browser' | 'Network'; 
  ipAddress?: string;
  port?: string;
}

export interface AppSettings {
  companyName: string;
  categories: string[];
  locations: string[];
  units: string[];
  defaultMinStock: number;
  lowStockAlerts: boolean;
  // Document & Print Settings
  taxRate: number; // Percentage (e.g., 8.5)
  currencySymbol: string;
  invoiceTerms: string;
  invoiceNotes: string;
  printers: PrinterProfile[];
}

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'ADJUST' | 'SETTINGS';

export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  entityId?: string;
  entityName: string;
  details: string;
  timestamp: number;
  user: string;
}

export const DEFAULT_CATEGORIES: string[] = [
  'Power Tools', 
  'Hand Tools', 
  'Materials', 
  'Safety', 
  'Electrical', 
  'Plumbing'
];

export const DEFAULT_LOCATIONS: string[] = [
  'Warehouse',
  'Job Site',
  'Van 1',
  'Van 2',
  'Office'
];

export const DEFAULT_UNITS: string[] = [
  'pcs', 'box', 'sets', 'pairs', 'ft', 'm', 'lbs', 'kg', 'sheets', 'rolls', 'bags', 'tubes', 'units'
];

export const DEFAULT_SETTINGS: AppSettings = {
  companyName: 'All Aspects',
  categories: DEFAULT_CATEGORIES,
  locations: DEFAULT_LOCATIONS,
  units: DEFAULT_UNITS,
  defaultMinStock: 5,
  lowStockAlerts: true,
  // Default Document Settings
  taxRate: 8.0,
  currencySymbol: '$',
  invoiceTerms: 'Payment is due within 30 days. Please make checks payable to the company name listed above.',
  invoiceNotes: 'Thank you for your business!',
  printers: [
    { id: 'p1', name: 'Office Main', location: 'Front Desk', type: 'Standard', connection: 'Browser' },
    { id: 'p2', name: 'Warehouse Zebra', location: 'Shipping Dock', type: 'Label', connection: 'Network', ipAddress: '192.168.1.200', port: '9100' }
  ]
};

// Helper to get total quantity from an item - Explicitly typing reduce as <number>
export const getTotalQuantity = (item: InventoryItem): number => {
  return Object.values(item.quantities).reduce<number>((sum, qty) => sum + qty, 0);
};