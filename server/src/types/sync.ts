export interface SyncState {
  lastSync: string | null; // ISO timestamp
  isSyncing: boolean;
  progress: number;
  error: string | null;
}

export interface SyncPayload {
  sales: any[];
  sale_items: any[];
  services: any[];
  service_sales: any[];
  products: any[];
  customers: any[];
  last_sync: string;
}

export interface SyncConfig {
  apiUrl: string;
  apiKey: string;
  pharmacyId: string;
  syncInterval: number; // minutes
}