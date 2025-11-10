import { SyncState, SyncPayload, SyncConfig } from '../types/sync';
import { dbService } from '../models/database';

// Node.js compatible storage (instead of localStorage)
class SyncStorage {
  private storage = new Map<string, string>();

  setItem(key: string, value: string): void {
    this.storage.set(key, value);
  }

  getItem(key: string): string | null {
    return this.storage.get(key) || null;
  }
}

const syncStorage = new SyncStorage();

export class SyncService {
  private state: SyncState = {
    lastSync: null,
    isSyncing: false,
    progress: 0,
    error: null
  };

  private config: SyncConfig;

  constructor(config: SyncConfig) {
    this.config = config;
    this.loadLastSync();
  }

  // Load last sync time from storage
  private loadLastSync(): void {
    const lastSync = syncStorage.getItem('lastSync');
    if (lastSync) {
      this.state.lastSync = lastSync;
    }
  }

  // Save last sync time
  private saveLastSync(timestamp: string): void {
    this.state.lastSync = timestamp;
    syncStorage.setItem('lastSync', timestamp);
  }

  // Check internet connection (Node.js compatible)
  private async isOnline(): Promise<boolean> {
    try {
      // Try to connect to a reliable service
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://www.google.com', {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Get only new data since last sync
  private async getDataToSync(): Promise<SyncPayload> {
    const lastSync = this.state.lastSync || '2000-01-01T00:00:00.000Z';
    
    console.log('🔄 Fetching data changes since:', lastSync);

    // Get new sales (only completed sales to avoid syncing incomplete transactions)
    const sales = await dbService.all<{ id: string }>(`
      SELECT * FROM sales 
      WHERE created_at > ? AND status = 'completed'
      ORDER BY created_at ASC
    `, [lastSync]);

    // Get sale items for the new sales
    const saleItems = sales.length > 0 ? await dbService.all(`
      SELECT si.* FROM sale_items si
      WHERE si.sale_id IN (${sales.map(s => `'${s.id}'`).join(',')})
      ORDER BY si.created_at ASC
    `) : [];

    // Get new services
    const services = await dbService.all(`
      SELECT * FROM services 
      WHERE created_at > ? OR updated_at > ?
      ORDER BY created_at ASC
    `, [lastSync, lastSync]);

    // Get new service sales
    const serviceSales = await dbService.all(`
      SELECT * FROM service_sales 
      WHERE created_at > ? 
      ORDER BY created_at ASC
    `, [lastSync]);

    // Get new products
    const products = await dbService.all(`
      SELECT * FROM products 
      WHERE created_at > ? OR updated_at > ?
      ORDER BY created_at ASC
    `, [lastSync, lastSync]);

    // Get new customers
    const customers = await dbService.all(`
      SELECT * FROM customers 
      WHERE created_at > ? 
      ORDER BY created_at ASC
    `, [lastSync]);

    return {
      sales,
      sale_items: saleItems,
      services,
      service_sales: serviceSales,
      products,
      customers,
      last_sync: lastSync
    };
  }

  // Push data to cloud
  async pushToCloud(): Promise<boolean> {
    const online = await this.isOnline();
    if (!online) {
      console.log('🌐 Offline - Queueing sync for later');
      return false;
    }

    if (this.state.isSyncing) {
      console.log('⏳ Sync already in progress');
      return false;
    }

    try {
      this.state.isSyncing = true;
      this.state.error = null;
      this.state.progress = 10;

      console.log('🚀 Starting data sync to cloud...');

      // Get data that needs syncing
      const syncData = await this.getDataToSync();
      this.state.progress = 30;

      // Calculate total records
      const totalRecords = 
        syncData.sales.length +
        syncData.sale_items.length +
        syncData.services.length +
        syncData.service_sales.length +
        syncData.products.length +
        syncData.customers.length;

      if (totalRecords === 0) {
        console.log('✅ No new data to sync');
        this.state.isSyncing = false;
        this.state.progress = 100;
        return true;
      }

      console.log(`📦 Syncing ${totalRecords} records to cloud...`);

      // Push to cloud
      const response = await fetch(`${this.config.apiUrl}/sync/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey
        },
        body: JSON.stringify({
          pharmacy_id: this.config.pharmacyId,
          data: syncData,
          total_records: totalRecords
        })
      });

      this.state.progress = 70;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: any = await response.json();
      this.state.progress = 90;

      if (result.success) {
        // Update last sync time to NOW (not the received timestamp)
        const newSyncTime = new Date().toISOString();
        this.saveLastSync(newSyncTime);
        
        console.log('✅ Sync completed successfully:', result.summary);
        this.state.progress = 100;
        
        return true;
      } else {
        throw new Error(result.error || 'Sync failed');
      }

    } catch (error) {
      console.error('❌ Sync error:', error);
      this.state.error = error instanceof Error ? error.message : 'Sync failed';
      return false;
    } finally {
      this.state.isSyncing = false;
    }
  }

  // Get sync status
  getSyncState(): SyncState {
    return { ...this.state };
  }

  // Manual sync trigger
  async manualSync(): Promise<boolean> {
    console.log('🔄 Manual sync triggered');
    return await this.pushToCloud();
  }

  // Auto-sync based on interval
  startAutoSync(): void {
    setInterval(() => {
      this.isOnline().then(online => {
        if (online && !this.state.isSyncing) {
          console.log('🤖 Auto-sync triggered');
          this.pushToCloud();
        }
      });
    }, this.config.syncInterval * 60 * 1000);
  }
}

export const syncService = new SyncService({
  apiUrl: process.env.CLOUD_API_URL || 'http://localhost:3001/api',
  apiKey: process.env.CLOUD_API_KEY || '9a3c7e2f5b8d1a4c6e9f2b5d8a1c4e7f0b3d6a9c2e5f8b1d4a7c0e3f6b9d2a5c',
  pharmacyId: 'pharmacy_main',
  syncInterval: 15
});