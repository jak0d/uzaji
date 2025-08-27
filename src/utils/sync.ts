import { getTransactions, getProducts, getServices } from './database';
import { encryption } from './encryption';
import { supabaseSync } from './supabaseSync';
import { supabaseHelpers } from './supabase';

export interface SyncData {
  transactions: any[];
  products: any[];
  services: any[];
  timestamp: string;
}

export class SyncService {
  private static instance: SyncService;
  private isOnline: boolean = navigator.onLine;
  private syncQueue: SyncData[] = [];

  private constructor() {
    this.setupOnlineListener();
  }

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  private setupOnlineListener(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // Sync to cloud using stored user credentials (no password prompt)
  async syncToCloud(): Promise<void> {
    try {
      // Check if we have stored credentials for automatic encryption
      if (!encryption.hasCredentials()) {
        throw new Error('No stored credentials available for automatic encryption. Please sign in again or provide a password.');
      }

      // Check if Supabase is configured and user is authenticated
      if (supabaseHelpers.isConfigured() && await supabaseSync.isAuthenticated()) {
        // Use Supabase for sync with automatic encryption
        await supabaseSync.fullSync();
        return;
      }

      // If Supabase is not available, throw an error
      if (!supabaseHelpers.isConfigured()) {
        throw new Error('Cloud backup is not configured. Please set up your Supabase environment variables.');
      } else {
        throw new Error('You must be signed in to use cloud backup. Please sign in with your Supabase account.');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  }

  // Legacy method with password parameter (for manual backups)
  async syncToCloudWithPassword(password: string): Promise<void> {
    try {
      // Check if Supabase is configured and user is authenticated
      if (supabaseHelpers.isConfigured() && await supabaseSync.isAuthenticated()) {
        // Use Supabase for sync
        await supabaseSync.fullSync(password);
        return;
      }

      // If Supabase is not available, throw an error
      if (!supabaseHelpers.isConfigured()) {
        throw new Error('Cloud backup is not configured. Please set up your Supabase environment variables.');
      } else {
        throw new Error('You must be signed in to use cloud backup. Please sign in with your Supabase account.');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  }

  private async processSyncQueue(): Promise<void> {
    if (!this.isOnline || this.syncQueue.length === 0) return;

    try {
      // Try automatic sync first
      if (encryption.hasCredentials()) {
        for (const data of this.syncQueue) {
          if (supabaseHelpers.isConfigured() && await supabaseSync.isAuthenticated()) {
            // Use Supabase for queued sync with automatic encryption
            await supabaseSync.syncTransactions(data.transactions);
            await supabaseSync.syncProducts(data.products);
            await supabaseSync.syncServices(data.services);
          } else {
            // Skip if Supabase is not available
            console.warn('Supabase not available for sync queue processing');
          }
        }
        
        this.syncQueue = [];
        console.log('Sync queue processed successfully with automatic encryption');
        return;
      }

      // Fallback to password prompt if no stored credentials
      const password = prompt('Enter your password to sync queued data:');
      if (!password) return;

      for (const data of this.syncQueue) {
        if (supabaseHelpers.isConfigured() && await supabaseSync.isAuthenticated()) {
          // Use Supabase for queued sync
          await supabaseSync.syncTransactions(data.transactions, password);
          await supabaseSync.syncProducts(data.products, password);
          await supabaseSync.syncServices(data.services, password);
        } else {
          // Skip if Supabase is not available
          console.warn('Supabase not available for sync queue processing');
        }
      }
      
      this.syncQueue = [];
      console.log('Sync queue processed successfully');
    } catch (error) {
      console.error('Failed to process sync queue:', error);
    }
  }

  getQueueSize(): number {
    return this.syncQueue.length;
  }

  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Check if Supabase sync is available
  async isSupabaseSyncAvailable(): Promise<boolean> {
    return supabaseHelpers.isConfigured() && await supabaseSync.isAuthenticated();
  }

  // Check if automatic sync is available (has stored credentials)
  canAutoSync(): boolean {
    return encryption.hasCredentials();
  }
}

export const syncService = SyncService.getInstance();