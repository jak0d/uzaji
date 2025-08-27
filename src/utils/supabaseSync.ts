import { supabase, supabaseHelpers } from './supabase';
import { encryption } from './encryption';
import type { Transaction, Product, Service } from './database';

export class SupabaseSync {
  private static instance: SupabaseSync;

  private constructor() {}

  static getInstance(): SupabaseSync {
    if (!SupabaseSync.instance) {
      SupabaseSync.instance = new SupabaseSync();
    }
    return SupabaseSync.instance;
  }

  // Check if user is authenticated with Supabase
  async isAuthenticated(): Promise<boolean> {
    if (!supabaseHelpers.isConfigured()) return false;
    try {
      const user = await supabaseHelpers.getCurrentUser();
      return !!user;
    } catch (error) {
      console.error('Failed to check Supabase authentication:', error);
      return false;
    }
  }

  // Sync transactions to Supabase (with automatic encryption if no password provided)
  async syncTransactions(transactions: Transaction[], password?: string): Promise<void> {
    if (!await this.isAuthenticated()) {
      throw new Error('Not authenticated with Supabase');
    }

    const user = await supabaseHelpers.getCurrentUser();
    if (!user) throw new Error('No authenticated user');

    for (const transaction of transactions) {
      try {
        // Encrypt the transaction data (automatically or with provided password)
        const encryptedData = password 
          ? await encryption.encrypt(transaction, password)
          : await encryption.encrypt(transaction);

        const supabaseTransaction = {
          id: transaction.id,
          user_id: user.id,
          date: transaction.date,
          description: transaction.description,
          amount: transaction.amount,
          type: transaction.type,
          category: transaction.category,
          product_id: transaction.productId || null,
          encrypted_data: encryptedData,
          created_at: transaction.createdAt,
          updated_at: transaction.updatedAt
        };

        if (!supabase) {
          throw new Error('Supabase client not initialized');
        }

        const { error } = await supabase
          .from('transactions')
          .upsert(supabaseTransaction);

        if (error) {
          console.error('Failed to sync transaction:', error);
          throw new Error(`Database error: ${error.message}`);
        }
      } catch (error) {
        console.error('Failed to encrypt/sync transaction:', transaction.id, error);
        throw error;
      }
    }
  }

  // Sync products to Supabase (with automatic encryption if no password provided)
  async syncProducts(products: Product[], password?: string): Promise<void> {
    if (!await this.isAuthenticated()) {
      throw new Error('Not authenticated with Supabase');
    }

    const user = await supabaseHelpers.getCurrentUser();
    if (!user) throw new Error('No authenticated user');

    for (const product of products) {
      try {
        const encryptedData = password 
          ? await encryption.encrypt(product, password)
          : await encryption.encrypt(product);

        const supabaseProduct = {
          id: product.id,
          user_id: user.id,
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category,
          encrypted_data: encryptedData,
          created_at: product.createdAt,
          updated_at: product.updatedAt
        };

        if (!supabase) {
          throw new Error('Supabase client not initialized');
        }

        const { error } = await supabase
          .from('products')
          .upsert(supabaseProduct);

        if (error) {
          console.error('Failed to sync product:', error);
          throw new Error(`Database error: ${error.message}`);
        }
      } catch (error) {
        console.error('Failed to encrypt/sync product:', product.id, error);
        throw error;
      }
    }
  }

  // Sync services to Supabase (with automatic encryption if no password provided)
  async syncServices(services: Service[], password?: string): Promise<void> {
    if (!await this.isAuthenticated()) {
      throw new Error('Not authenticated with Supabase');
    }

    const user = await supabaseHelpers.getCurrentUser();
    if (!user) throw new Error('No authenticated user');

    for (const service of services) {
      try {
        const encryptedData = password 
          ? await encryption.encrypt(service, password)
          : await encryption.encrypt(service);

        const supabaseService = {
          id: service.id,
          user_id: user.id,
          name: service.name,
          description: service.description,
          hourly_rate: service.hourlyRate,
          category: service.category,
          encrypted_data: encryptedData,
          created_at: service.createdAt,
          updated_at: service.updatedAt
        };

        if (!supabase) {
          throw new Error('Supabase client not initialized');
        }

        const { error } = await supabase
          .from('services')
          .upsert(supabaseService);

        if (error) {
          console.error('Failed to sync service:', error);
          throw new Error(`Database error: ${error.message}`);
        }
      } catch (error) {
        console.error('Failed to encrypt/sync service:', service.id, error);
        throw error;
      }
    }
  }

  // Sync user settings to Supabase
  async syncSettings(settings: Record<string, any>): Promise<void> {
    if (!await this.isAuthenticated()) {
      throw new Error('Not authenticated with Supabase');
    }

    const user = await supabaseHelpers.getCurrentUser();
    if (!user) throw new Error('No authenticated user');

    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    for (const [key, value] of Object.entries(settings)) {
      try {
        const { error } = await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            settings_key: key,
            settings_value: value,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,settings_key'
          });

        if (error) {
          console.error('Failed to sync setting:', key, error);
          throw new Error(`Database error: ${error.message}`);
        }
      } catch (error) {
        console.error('Failed to sync setting:', key, error);
        throw error;
      }
    }
  }

  // Fetch and decrypt data from Supabase (with automatic decryption if no password provided)
  async fetchTransactions(password?: string): Promise<Transaction[]> {
    if (!await this.isAuthenticated()) {
      throw new Error('Not authenticated with Supabase');
    }

    const user = await supabaseHelpers.getCurrentUser();
    if (!user) throw new Error('No authenticated user');

    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Failed to fetch transactions:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    const transactions: Transaction[] = [];
    for (const row of data || []) {
      try {
        const decryptedData = password 
          ? await encryption.decrypt(row.encrypted_data, password)
          : await encryption.decrypt(row.encrypted_data);
        transactions.push(decryptedData);
      } catch (error) {
        console.error('Failed to decrypt transaction:', row.id, error);
        // Skip corrupted data
      }
    }

    return transactions;
  }

  async fetchProducts(password?: string): Promise<Product[]> {
    if (!await this.isAuthenticated()) {
      throw new Error('Not authenticated with Supabase');
    }

    const user = await supabaseHelpers.getCurrentUser();
    if (!user) throw new Error('No authenticated user');

    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Failed to fetch products:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    const products: Product[] = [];
    for (const row of data || []) {
      try {
        const decryptedData = password 
          ? await encryption.decrypt(row.encrypted_data, password)
          : await encryption.decrypt(row.encrypted_data);
        products.push(decryptedData);
      } catch (error) {
        console.error('Failed to decrypt product:', row.id, error);
      }
    }

    return products;
  }

  async fetchServices(password?: string): Promise<Service[]> {
    if (!await this.isAuthenticated()) {
      throw new Error('Not authenticated with Supabase');
    }

    const user = await supabaseHelpers.getCurrentUser();
    if (!user) throw new Error('No authenticated user');

    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Failed to fetch services:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    const services: Service[] = [];
    for (const row of data || []) {
      try {
        const decryptedData = password 
          ? await encryption.decrypt(row.encrypted_data, password)
          : await encryption.decrypt(row.encrypted_data);
        services.push(decryptedData);
      } catch (error) {
        console.error('Failed to decrypt service:', row.id, error);
      }
    }

    return services;
  }

  async fetchSettings(): Promise<Record<string, any>> {
    if (!await this.isAuthenticated()) {
      throw new Error('Not authenticated with Supabase');
    }

    const user = await supabaseHelpers.getCurrentUser();
    if (!user) throw new Error('No authenticated user');

    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Failed to fetch settings:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    const settings: Record<string, any> = {};
    for (const row of data || []) {
      settings[row.settings_key] = row.settings_value;
    }

    return settings;
  }

  // Get cloud backup info (metadata about what's available)
  async getCloudBackupInfo(): Promise<{
    hasBackup: boolean;
    lastBackupDate?: string;
    transactionCount: number;
    productCount: number;
    serviceCount: number;
  }> {
    if (!await this.isAuthenticated()) {
      throw new Error('Not authenticated with Supabase');
    }

    const user = await supabaseHelpers.getCurrentUser();
    if (!user) throw new Error('No authenticated user');

    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    try {
      // Get counts from each table
      const [transactionsResult, productsResult, servicesResult] = await Promise.all([
        supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('services').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
      ]);

      const transactionCount = transactionsResult.count || 0;
      const productCount = productsResult.count || 0;
      const serviceCount = servicesResult.count || 0;

      const hasBackup = transactionCount > 0 || productCount > 0 || serviceCount > 0;

      // Get the most recent backup date
      let lastBackupDate: string | undefined;
      if (hasBackup) {
        const { data: recentTransaction } = await supabase
          .from('transactions')
          .select('updated_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (recentTransaction && recentTransaction.length > 0) {
          lastBackupDate = recentTransaction[0].updated_at;
        }
      }

      return {
        hasBackup,
        lastBackupDate,
        transactionCount,
        productCount,
        serviceCount
      };
    } catch (error) {
      console.error('Failed to get cloud backup info:', error);
      throw new Error('Failed to check cloud backup status');
    }
  }

  // Restore data from cloud backup
  async restoreFromCloud(password?: string, options?: {
    includeTransactions?: boolean;
    includeProducts?: boolean;
    includeServices?: boolean;
    includeSettings?: boolean;
    replaceExisting?: boolean;
  }): Promise<{
    transactions: Transaction[];
    products: Product[];
    services: Service[];
    settings: Record<string, any>;
  }> {
    const {
      includeTransactions = true,
      includeProducts = true,
      includeServices = true,
      includeSettings = true,
      replaceExisting = false
    } = options || {};

    try {
      // Check authentication first
      if (!await this.isAuthenticated()) {
        throw new Error('You must be signed in to restore from cloud backup.');
      }

      // Check if we have encryption credentials
      if (!password && !encryption.hasCredentials()) {
        throw new Error('No encryption credentials available. Please provide a password or sign in again.');
      }

      const results = {
        transactions: [] as Transaction[],
        products: [] as Product[],
        services: [] as Service[],
        settings: {} as Record<string, any>
      };

      // Fetch data from cloud
      if (includeTransactions) {
        results.transactions = await this.fetchTransactions(password);
      }

      if (includeProducts) {
        results.products = await this.fetchProducts(password);
      }

      if (includeServices) {
        results.services = await this.fetchServices(password);
      }

      if (includeSettings) {
        results.settings = await this.fetchSettings();
      }

      // If replaceExisting is true, we'll clear local data first
      if (replaceExisting) {
        const { getDB } = await import('./database');
        const db = await getDB();
        
        if (includeTransactions) {
          await db.clear('transactions');
        }
        if (includeProducts) {
          await db.clear('products');
        }
        if (includeServices) {
          await db.clear('services');
        }
        if (includeSettings) {
          // Clear specific settings but keep user credentials
          const settingsToKeep = ['bookkeeper-user', 'bookkeeper-salt'];
          for (const key of settingsToKeep) {
            const value = localStorage.getItem(key);
            if (value) {
              localStorage.setItem(`temp-${key}`, value);
            }
          }
          await db.clear('settings');
          // Restore kept settings
          for (const key of settingsToKeep) {
            const value = localStorage.getItem(`temp-${key}`);
            if (value) {
              localStorage.setItem(key, value);
              localStorage.removeItem(`temp-${key}`);
            }
          }
        }
      }

      // Import the restored data into local database
      if (results.transactions.length > 0) {
        const { addTransaction } = await import('./database');
        for (const transaction of results.transactions) {
          try {
            await addTransaction({
              ...transaction,
              description: replaceExisting ? transaction.description : `${transaction.description} (Restored)`,
              encrypted: true
            });
          } catch (error) {
            console.error('Failed to restore transaction:', error);
          }
        }
      }

      if (results.products.length > 0) {
        const { addProduct } = await import('./database');
        for (const product of results.products) {
          try {
            await addProduct({
              ...product,
              encrypted: true
            });
          } catch (error) {
            console.error('Failed to restore product:', error);
          }
        }
      }

      if (results.services.length > 0) {
        const { addService } = await import('./database');
        for (const service of results.services) {
          try {
            await addService({
              ...service,
              encrypted: true
            });
          } catch (error) {
            console.error('Failed to restore service:', error);
          }
        }
      }

      if (Object.keys(results.settings).length > 0) {
        const { setSetting } = await import('./database');
        for (const [key, value] of Object.entries(results.settings)) {
          try {
            await setSetting(key, value);
          } catch (error) {
            console.error('Failed to restore setting:', key, error);
          }
        }
      }

      return results;
    } catch (error) {
      console.error('Cloud restore failed:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('not authenticated') || error.message.includes('No authenticated user')) {
          throw new Error('You must be signed in to restore from cloud backup. Please sign in with your Supabase account.');
        } else if (error.message.includes('not configured')) {
          throw new Error('Cloud backup is not configured. Please contact support for assistance.');
        } else if (error.message.includes('encryption') || error.message.includes('decrypt')) {
          throw new Error('Failed to decrypt your backup data. Please check your password and try again.');
        } else if (error.message.includes('Database error')) {
          throw new Error('Database connection failed. Please check your internet connection and try again.');
        } else {
          throw new Error(`Restore failed: ${error.message}`);
        }
      } else {
        throw new Error('An unexpected error occurred during restore. Please try again.');
      }
    }
  }

  // Full sync - upload all local data to Supabase (with automatic encryption if no password provided)
  async fullSync(password?: string): Promise<void> {
    const { getTransactions, getProducts, getServices, getSetting } = await import('./database');
    
    try {
      // Check authentication first
      if (!await this.isAuthenticated()) {
        throw new Error('You must be signed in to use cloud backup. Please sign in with your Supabase account.');
      }

      // Check if Supabase is properly configured
      if (!supabaseHelpers.isConfigured()) {
        throw new Error('Cloud backup is not configured. Please set up your Supabase environment variables.');
      }

      // Check if we have encryption credentials
      if (!password && !encryption.hasCredentials()) {
        throw new Error('No encryption credentials available. Please provide a password or sign in again.');
      }

      // Get all local data
      const [transactions, products, services] = await Promise.all([
        getTransactions(),
        getProducts(),
        getServices()
      ]);

      // Get app settings
      const appSettings = await getSetting('app-settings');
      const onlineBackupEnabled = await getSetting('online-backup-enabled');
      const lastBackupDate = await getSetting('last-backup-date');
      const lastImport = await getSetting('last-import');

      const settings = {
        'app-settings': appSettings,
        'online-backup-enabled': onlineBackupEnabled,
        'last-backup-date': lastBackupDate,
        'last-import': lastImport
      };

      // Sync all data to Supabase (with automatic encryption if no password provided)
      await Promise.all([
        this.syncTransactions(transactions, password),
        this.syncProducts(products, password),
        this.syncServices(services, password),
        this.syncSettings(settings)
      ]);

      console.log('Full sync completed successfully');
    } catch (error) {
      console.error('Full sync failed:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('not authenticated') || error.message.includes('No authenticated user')) {
          throw new Error('You must be signed in to use cloud backup. Please sign in with your Supabase account.');
        } else if (error.message.includes('not configured')) {
          throw new Error('Cloud backup is not configured. Please contact support for assistance.');
        } else if (error.message.includes('encryption')) {
          throw new Error('Failed to encrypt your data. Please try again or contact support.');
        } else if (error.message.includes('Database error')) {
          throw new Error('Database connection failed. Please check your internet connection and try again.');
        } else {
          throw new Error(`Backup failed: ${error.message}`);
        }
      } else {
        throw new Error('An unexpected error occurred during backup. Please try again.');
      }
    }
  }
}

export const supabaseSync = SupabaseSync.getInstance();