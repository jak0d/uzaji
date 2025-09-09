import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Enhanced Transaction model with new fields for redesign
export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  subcategory?: string;
  customer?: string;  // For general business type
  vendor?: string;    // For general business type
  clientId?: string;  // For legal firm business type
  clientFileId?: string; // For legal firm business type
  productId?: string; // Keep for backward compatibility
  productServiceId?: string; // New field for enhanced workflow
  account: string;
  attachments?: string[]; // Array of FileAttachment IDs
  tags?: string[];
  encrypted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  type: 'product' | 'service';
  description: string;
  price: number;
  category: string;
  encrypted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  hourlyRate: number;
  category: string;
  encrypted: boolean;
  createdAt: string;
  updatedAt: string;
}

// New Business Configuration model
export interface BusinessConfig {
  id: string;
  type: 'general' | 'legal';
  name: string;
  setupComplete: boolean;
  onboardingDate: string;
  defaultCategories: ExpenseCategory[];
  accounts: Account[];
  uiPreferences: UIPreferences;
  encrypted: boolean;
  currency?: string;
  fiscalYearStart?: string;
  fiscalYearEnd?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UIPreferences {
  dashboardLayout: 'standard' | 'legal';
  compactView: boolean;
  defaultTransactionType: 'income' | 'expense';
  showProFeatures: boolean;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  businessType?: 'general' | 'legal' | 'both';
  encrypted: boolean;
  createdAt: string;
  updatedAt: string;
}

// New Account model for enhanced financial tracking
export interface Account {
  id: string;
  name: string;
  accountType: 'checking' | 'savings' | 'credit' | 'cash' | 'investment';
  accountNumber: string;
  bankName: string;
  currentBalance: number;
  isDefault: boolean;
  isActive: boolean;
  encrypted: boolean;
  createdAt: string;
  updatedAt: string;
}

// New File Attachment model
export interface FileAttachment {
  id: string;
  filename: string;
  size: number;
  type: string;
  data: string; // Base64 encoded
  transactionId: string;
  encrypted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerAddress?: string;
  invoiceDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  items: InvoiceItem[];
  notes?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

// Legal Firm Client Management Models
export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  totalOutstandingFees: number;
  totalFundsHeld: number;
  encrypted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientFile {
  id: string;
  clientId: string;
  fileName: string;
  dateOpened: string;
  feesToBePaid: number;
  depositPaid: number;
  balanceRemaining: number;
  totalExpenses: number;
  totalExtraFees: number;
  totalFeesCharged: number;
  totalPaid: number;
  netSummary: number;
  status: 'active' | 'closed' | 'pending';
  encrypted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FileExpense {
  id: string;
  fileId: string;
  date: string;
  description: string;
  amount: number;
  vendor?: string;
  isReimbursable: boolean;
  attachment?: string;
  encrypted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExtraFee {
  id: string;
  fileId: string;
  date: string;
  description: string;
  amount: number;
  encrypted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BookkeepingDB extends DBSchema {
  transactions: {
    key: string;
    value: Transaction;
    indexes: {
      'by-date': string;
      'by-type': string;
      'by-category': string;
      'by-account': string;
      'by-customer': string;
      'by-vendor': string;
    };
  };
  products: {
    key: string;
    value: Product;
    indexes: { 'by-category': string };
  };
  services: {
    key: string;
    value: Service;
    indexes: { 'by-category': string };
  };
  settings: {
    key: string;
    value: any;
  };
  businessConfig: {
    key: string;
    value: BusinessConfig;
    indexes: { 'by-type': string };
  };
  accounts: {
    key: string;
    value: Account;
    indexes: { 'by-accountType': string; 'by-default': string; 'by-active': string };
  };
  transfers: {
    key: string;
    value: Transfer;
    indexes: { 'by-date': string; 'by-status': string; 'by-fromAccount': string; 'by-toAccount': string };
  };
  expenseCategories: {
    key: string;
    value: ExpenseCategory;
    indexes: { 'by-business-type': string; 'by-default': string };
  };
  fileAttachments: {
    key: string;
    value: FileAttachment;
    indexes: { 'by-transaction': string };
  };
  clients: {
    key: string;
    value: Client;
    indexes: { 'by-name': string };
  };
  clientFiles: {
    key: string;
    value: ClientFile;
    indexes: { 'by-client': string; 'by-status': string };
  };
  fileExpenses: {
    key: string;
    value: FileExpense;
    indexes: { 'by-file': string; 'by-reimbursable': string };
  };
  extraFees: {
    key: string;
    value: ExtraFee;
    indexes: { 'by-file': string };
  };
  invoices: {
    key: string;
    value: Invoice;
    indexes: { 'by-customer': string; 'by-status': string; 'by-date': string };
  };
}

export interface Transfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
  updatedAt: string;
}

let db: IDBPDatabase<BookkeepingDB>;

export async function initDB(): Promise<void> {
  db = await openDB<BookkeepingDB>('bookkeeping-db', 5, {
    async upgrade(db, oldVersion, _newVersion, transaction) {
      // Handle migration from version 1 to 2
      if (oldVersion < 1) {
        // Initial database setup (version 1)
        const transactionStore = db.createObjectStore('transactions', {
          keyPath: 'id',
        });
        transactionStore.createIndex('by-date', 'date');
        transactionStore.createIndex('by-type', 'type');
        transactionStore.createIndex('by-category', 'category');

        const productStore = db.createObjectStore('products', {
          keyPath: 'id',
        });
        productStore.createIndex('by-category', 'category');

        const serviceStore = db.createObjectStore('services', {
          keyPath: 'id',
        });
        serviceStore.createIndex('by-category', 'category');

        db.createObjectStore('settings', {
          keyPath: 'key',
        });
      }

      if (oldVersion < 2) {
        // Enhanced schema for redesign (version 2)
        
        // Add new indexes to existing transactions store
        const transactionStore = transaction.objectStore('transactions');
        if (!transactionStore.indexNames.contains('by-account')) {
          transactionStore.createIndex('by-account', 'account');
        }
        if (!transactionStore.indexNames.contains('by-customer')) {
          transactionStore.createIndex('by-customer', 'customer');
        }
        if (!transactionStore.indexNames.contains('by-vendor')) {
          transactionStore.createIndex('by-vendor', 'vendor');
        }

        // Business Configuration store
        const businessConfigStore = db.createObjectStore('businessConfig', {
          keyPath: 'id',
        });
        businessConfigStore.createIndex('by-type', 'type');

        // Accounts store
        const accountStore = db.createObjectStore('accounts', {
          keyPath: 'id',
        });
        accountStore.createIndex('by-accountType', 'accountType');
        accountStore.createIndex('by-default', 'isDefault');

        // Expense Categories store
        const expenseCategoryStore = db.createObjectStore('expenseCategories', {
          keyPath: 'id',
        });
        expenseCategoryStore.createIndex('by-business-type', 'businessType');
        expenseCategoryStore.createIndex('by-default', 'isDefault');

        // File Attachments store
        const fileAttachmentStore = db.createObjectStore('fileAttachments', {
          keyPath: 'id',
        });
        fileAttachmentStore.createIndex('by-transaction', 'transactionId');

        // Legal Firm - Clients store
        const clientStore = db.createObjectStore('clients', {
          keyPath: 'id',
        });
        clientStore.createIndex('by-name', 'name');

        // Legal Firm - Client Files store
        const clientFileStore = db.createObjectStore('clientFiles', {
          keyPath: 'id',
        });
        clientFileStore.createIndex('by-client', 'clientId');
        clientFileStore.createIndex('by-status', 'status');

        // Legal Firm - File Expenses store
        const fileExpenseStore = db.createObjectStore('fileExpenses', {
          keyPath: 'id',
        });
        fileExpenseStore.createIndex('by-file', 'fileId');
        fileExpenseStore.createIndex('by-reimbursable', 'isReimbursable');

        // Legal Firm - Extra Fees store
        const extraFeeStore = db.createObjectStore('extraFees', {
          keyPath: 'id',
        });
        extraFeeStore.createIndex('by-file', 'fileId');

        // Initialize default data for new installations and migrate existing transactions
        await initializeDefaultData(transaction);
        await migrateExistingTransactions(transaction);
      }

      if (oldVersion < 3) {
        // Version 3 migration logic can be added here if needed in the future.
        // The stores for legal features were already added in version 2.
      }

      if (oldVersion < 4) {
        const invoiceStore = db.createObjectStore('invoices', {
          keyPath: 'id',
        });
        invoiceStore.createIndex('by-customer', 'customerName');
        invoiceStore.createIndex('by-status', 'status');
        invoiceStore.createIndex('by-date', 'invoiceDate');
      }

      if (oldVersion < 5) {
        // Version 5: Enhanced accounts and add transfers store
        const accountStore = transaction.objectStore('accounts');
        if (accountStore) {
          // Drop old indexes if they exist and recreate with new names
          if (accountStore.indexNames.contains('by-accountType')) {
            accountStore.deleteIndex('by-type');
          }
          accountStore.createIndex('by-accountType', 'accountType');
          accountStore.createIndex('by-active', 'isActive');
        }

        // Create transfers store
        const transferStore = db.createObjectStore('transfers', {
          keyPath: 'id',
        });
        transferStore.createIndex('by-date', 'date');
        transferStore.createIndex('by-status', 'status');
        transferStore.createIndex('by-fromAccount', 'fromAccountId');
        transferStore.createIndex('by-toAccount', 'toAccountId');

        // Migrate existing accounts to new schema
        await migrateAccountsToEnhancedSchema(transaction);
      }
    },
  });
}

// Initialize default data for new users
async function initializeDefaultData(transaction: any): Promise<void> {
  // Create default expense categories
  const defaultCategories: Omit<ExpenseCategory, 'id' | 'createdAt' | 'updatedAt'>[] = [
    { name: 'Office Supplies', description: 'Pens, paper, office equipment', isDefault: true, businessType: 'both', encrypted: false },
    { name: 'Travel', description: 'Business travel expenses', isDefault: true, businessType: 'both', encrypted: false },
    { name: 'Meals & Entertainment', description: 'Business meals and client entertainment', isDefault: true, businessType: 'both', encrypted: false },
    { name: 'Professional Services', description: 'Legal, accounting, consulting fees', isDefault: true, businessType: 'both', encrypted: false },
    { name: 'Marketing & Advertising', description: 'Promotional materials and advertising', isDefault: true, businessType: 'general', encrypted: false },
    { name: 'Legal Research', description: 'Research databases and legal resources', isDefault: true, businessType: 'legal', encrypted: false },
    { name: 'Court Fees', description: 'Filing fees and court costs', isDefault: true, businessType: 'legal', encrypted: false },
  ];

  const categoryStore = transaction.objectStore('expenseCategories');
  const now = new Date().toISOString();
  
  for (const category of defaultCategories) {
    const categoryWithId: ExpenseCategory = {
      ...category,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    await categoryStore.add(categoryWithId);
  }

  // Create default accounts with enhanced schema
  const accountStore = transaction.objectStore('accounts');
  const defaultAccounts: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      name: 'Business Checking',
      accountType: 'checking',
      accountNumber: '****1234',
      bankName: 'First National Bank',
      currentBalance: 15000,
      isDefault: true,
      isActive: true,
      encrypted: false,
    },
    {
      name: 'Business Savings',
      accountType: 'savings',
      accountNumber: '****5678',
      bankName: 'First National Bank',
      currentBalance: 25000,
      isDefault: false,
      isActive: true,
      encrypted: false,
    },
    {
      name: 'Petty Cash',
      accountType: 'cash',
      accountNumber: 'CASH-001',
      bankName: 'Cash Account',
      currentBalance: 500,
      isDefault: false,
      isActive: true,
      encrypted: false,
    }
  ];

  for (const acc of defaultAccounts) {
    const accountWithId: Account = {
      ...acc,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    await accountStore.add(accountWithId);
  }
}

// Migrate existing transactions to support new schema
async function migrateExistingTransactions(transaction: any): Promise<void> {
  const transactionStore = transaction.objectStore('transactions');
  const accountStore = transaction.objectStore('accounts');
  
  // Get default account
  const defaultAccounts = await accountStore.getAll();
  const defaultAccount = defaultAccounts.find((acc: Account) => acc.isDefault);
  
  if (!defaultAccount) return;
  
  // Get all existing transactions
  const existingTransactions = await transactionStore.getAll();
  
  for (const txn of existingTransactions) {
    // Add missing fields for enhanced schema
    const updatedTransaction = {
      ...txn,
      account: txn.account || defaultAccount.id,
      attachments: txn.attachments || [],
      tags: txn.tags || [],
      updatedAt: new Date().toISOString(),
    };
    
    // Update the transaction with new fields
    await transactionStore.put(updatedTransaction);
  }
}

async function migrateAccountsToEnhancedSchema(transaction: any): Promise<void> {
  const accountStore = transaction.objectStore('accounts');
  const allAccounts = await accountStore.getAll();
  
  for (const account of allAccounts) {
    // Map old type to new accountType and add missing fields
    let accountType: Account['accountType'];
    let bankName = 'Unknown Bank';
    let accountNumber = '****0000';
    let isActive = true;
    
    switch ((account as any).type) {
      case 'cash':
        accountType = 'cash';
        bankName = 'Cash Account';
        accountNumber = 'CASH-001';
        break;
      case 'credit':
        accountType = 'credit';
        bankName = 'Credit Provider';
        accountNumber = '****9999';
        break;
      case 'bank':
      default:
        accountType = 'checking';
        bankName = 'Default Bank';
        accountNumber = '****1234';
        break;
    }
    
    const updatedAccount: Account = {
      ...account,
      accountType,
      accountNumber,
      bankName,
      currentBalance: (account as any).balance || 0,
      isActive,
      encrypted: (account as any).encrypted || false,
      updatedAt: new Date().toISOString(),
    };
    
    // Remove old type field if present
    delete (updatedAccount as any).type;
    delete (updatedAccount as any).balance;
    
    await accountStore.put(updatedAccount);
  }
}

export async function getDB(): Promise<IDBPDatabase<BookkeepingDB>> {
  if (!db) {
    await initDB();
  }
  return db;
}

// Transaction operations
export async function addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const database = await getDB();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  const newTransaction: Transaction = {
    ...transaction,
    id,
    createdAt: now,
    updatedAt: now,
  };
  
  await database.add('transactions', newTransaction);
  return id;
}

export async function getTransactions(): Promise<Transaction[]> {
  const database = await getDB();
  return await database.getAll('transactions');
}

export async function getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
  const database = await getDB();
  const allTransactions = await database.getAll('transactions');
  return allTransactions.filter(t => t.date >= startDate && t.date <= endDate);
}

export async function updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
  const database = await getDB();
  const transaction = await database.get('transactions', id);
  if (transaction) {
    const updatedTransaction = {
      ...transaction,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await database.put('transactions', updatedTransaction);
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('transactions', id);
}

// Product operations
export async function addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const database = await getDB();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  const newProduct: Product = {
    ...product,
    id,
    createdAt: now,
    updatedAt: now,
  };
  
  await database.add('products', newProduct);
  return id;
}

export async function getProducts(): Promise<Product[]> {
  const database = await getDB();
  const products = await database.getAll('products');
  const services = await database.getAll('services');

  const productItems = products.map(p => ({ ...p, type: 'product' as const }));
  const serviceItems = services.map(s => ({
    id: s.id,
    name: s.name,
    description: s.description,
    price: s.hourlyRate,
    category: s.category,
    encrypted: s.encrypted,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    type: 'service' as const
  }));

  return [...productItems, ...serviceItems];
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  const database = await getDB();
  const product = await database.get('products', id);
  if (product) {
    const updatedProduct = {
      ...product,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await database.put('products', updatedProduct);
  }
}

export async function deleteProduct(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('products', id);
}

// Service operations
export async function addService(service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const database = await getDB();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  const newService: Service = {
    ...service,
    id,
    createdAt: now,
    updatedAt: now,
  };
  
  await database.add('services', newService);
  return id;
}

export async function getServices(): Promise<Service[]> {
  const database = await getDB();
  return await database.getAll('services');
}

export async function updateService(id: string, updates: Partial<Service>): Promise<void> {
  const database = await getDB();
  const service = await database.get('services', id);
  if (service) {
    const updatedService = {
      ...service,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await database.put('services', updatedService);
  }
}

export async function deleteService(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('services', id);
}

// Settings operations
export async function setSetting(key: string, value: any): Promise<void> {
  const database = await getDB();
  await database.put('settings', { key, value });
}

export async function getSetting(key: string): Promise<any> {
  const database = await getDB();
  const setting = await database.get('settings', key);
  return setting?.value;
}

// Business Configuration operations
export async function addBusinessConfig(config: Omit<BusinessConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const database = await getDB();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  const newConfig: BusinessConfig = {
    ...config,
    id,
    createdAt: now,
    updatedAt: now,
  };
  
  await database.add('businessConfig', newConfig);
  return id;
}

export async function getBusinessConfig(): Promise<BusinessConfig | null> {
  const database = await getDB();
  const configs = await database.getAll('businessConfig');
  return configs.length > 0 ? configs[0] : null;
}

export async function updateBusinessConfig(id: string, updates: Partial<BusinessConfig>): Promise<void> {
  const database = await getDB();
  const config = await database.get('businessConfig', id);
  if (config) {
    const updatedConfig = {
      ...config,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await database.put('businessConfig', updatedConfig);
  }
}

// Account operations
export async function addAccount(account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const database = await getDB();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  const newAccount: Account = {
    ...account,
    id,
    createdAt: now,
    updatedAt: now,
  };
  
  await database.add('accounts', newAccount);
  return id;
}

export async function getAccounts(): Promise<Account[]> {
  const database = await getDB();
  return await database.getAll('accounts');
}

export async function getActiveAccounts(): Promise<Account[]> {
  const database = await getDB();
  return await database.getAllFromIndex('accounts', 'by-active', IDBKeyRange.only(true));
}

export async function getDefaultAccount(): Promise<Account | null> {
  const database = await getDB();
  const accounts = await database.getAllFromIndex('accounts', 'by-default', IDBKeyRange.only(true));
  return accounts.length > 0 ? accounts[0] : null;
}

export async function updateAccount(id: string, updates: Partial<Account>): Promise<void> {
  const database = await getDB();
  const account = await database.get('accounts', id);
  if (account) {
    const updatedAccount = {
      ...account,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await database.put('accounts', updatedAccount);
  }
}

export async function deleteAccount(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('accounts', id);
}

// Transfer operations
export async function addTransfer(transfer: Omit<Transfer, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const database = await getDB();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  const newTransfer: Transfer = {
    ...transfer,
    id,
    createdAt: now,
    updatedAt: now,
  };
  
  await database.add('transfers', newTransfer);
  return id;
}

export async function getTransfers(): Promise<Transfer[]> {
  const database = await getDB();
  return await database.getAll('transfers');
}

export async function getTransfersByDateRange(startDate: string, endDate: string): Promise<Transfer[]> {
  const database = await getDB();
  const allTransfers = await database.getAll('transfers');
  return allTransfers.filter(t => t.date >= startDate && t.date <= endDate);
}

export async function updateTransfer(id: string, updates: Partial<Transfer>): Promise<void> {
  const database = await getDB();
  const transfer = await database.get('transfers', id);
  if (transfer) {
    const updatedTransfer = {
      ...transfer,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await database.put('transfers', updatedTransfer);
  }
}

export async function deleteTransfer(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('transfers', id);
}

// Expense Category operations
export async function addExpenseCategory(category: Omit<ExpenseCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const database = await getDB();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  const newCategory: ExpenseCategory = {
    ...category,
    id,
    createdAt: now,
    updatedAt: now,
  };
  
  await database.add('expenseCategories', newCategory);
  return id;
}

export async function getExpenseCategories(businessType?: 'general' | 'legal'): Promise<ExpenseCategory[]> {
  const database = await getDB();
  const allCategories = await database.getAll('expenseCategories');
  
  if (!businessType) {
    return allCategories;
  }
  
  return allCategories.filter(cat => 
    cat.businessType === businessType || cat.businessType === 'both'
  );
}

export async function updateExpenseCategory(id: string, updates: Partial<ExpenseCategory>): Promise<void> {
  const database = await getDB();
  const category = await database.get('expenseCategories', id);
  if (category) {
    const updatedCategory = {
      ...category,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await database.put('expenseCategories', updatedCategory);
  }
}

export async function deleteExpenseCategory(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('expenseCategories', id);
}

// File Attachment operations
export async function addFileAttachment(attachment: Omit<FileAttachment, 'id' | 'createdAt'>): Promise<string> {
  const database = await getDB();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  const newAttachment: FileAttachment = {
    ...attachment,
    id,
    createdAt: now,
  };
  
  await database.add('fileAttachments', newAttachment);
  return id;
}

export async function getFileAttachments(transactionId: string): Promise<FileAttachment[]> {
  const database = await getDB();
  return await database.getAllFromIndex('fileAttachments', 'by-transaction', transactionId);
}

export async function deleteFileAttachment(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('fileAttachments', id);
}

// Enhanced transaction operations with new fields
export async function getTransactionsByAccount(accountId: string): Promise<Transaction[]> {
  const database = await getDB();
  return await database.getAllFromIndex('transactions', 'by-account', accountId);
}

export async function getTransactionsByCustomer(customer: string): Promise<Transaction[]> {
  const database = await getDB();
  return await database.getAllFromIndex('transactions', 'by-customer', customer);
}

export async function getTransactionsByVendor(vendor: string): Promise<Transaction[]> {
  const database = await getDB();
  return await database.getAllFromIndex('transactions', 'by-vendor', vendor);
}


export async function needsOnboarding(): Promise<boolean> {
  try {
    const db = await getDB();
    const configs = await db.getAll('businessConfig');
    if (configs.length === 0) {
      return true; // No config, needs onboarding
    }
    // Check if at least one config is complete
    const isSetupComplete = configs.some(config => config.setupComplete);
    return !isSetupComplete;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return true; // Default to needing onboarding if there's an error
  }
}

// Utility function to complete onboarding
export async function completeOnboarding(businessType: 'general' | 'legal', businessName: string): Promise<string> {
  const db = await getDB();
  const tx = db.transaction(['businessConfig', 'accounts', 'expenseCategories', 'clients', 'clientFiles'], 'readwrite');
  
  // Create or update business config with all required fields
  const config: BusinessConfig = {
    id: 'current',
    type: businessType,
    name: businessName,
    setupComplete: true,
    onboardingDate: new Date().toISOString(),
    defaultCategories: [],
    accounts: [],
    uiPreferences: {
      dashboardLayout: businessType === 'legal' ? 'legal' : 'standard',
      compactView: false,
      defaultTransactionType: 'income',
      showProFeatures: true
    },
    encrypted: false,
    currency: 'USD',
    fiscalYearStart: '01-01',
    fiscalYearEnd: '12-31',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  console.log('Completing onboarding with config:', config);
  
  await tx.objectStore('businessConfig').put(config);
  
  // Create default account if none exists
  const accounts = await tx.objectStore('accounts').getAll();
  if (accounts.length === 0) {
    await tx.objectStore('accounts').add({
      id: `account-${Date.now()}`,
      name: 'Cash',
      accountType: 'cash',
      accountNumber: 'CASH-001',
      bankName: 'Cash Account',
      currentBalance: 0,
      isDefault: true,
      isActive: true,
      encrypted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  
  // Create default expense categories based on business type
  const defaultCategories = businessType === 'legal' ? [
    { name: 'Office Supplies', isDefault: true },
    { name: 'Professional Fees', isDefault: true },
    { name: 'Travel & Entertainment', isDefault: true },
    { name: 'Legal Research', isDefault: true },
    { name: 'Filing Fees', isDefault: true }
  ] : [
    { name: 'Office Supplies', isDefault: true },
    { name: 'Rent', isDefault: true },
    { name: 'Utilities', isDefault: true },
    { name: 'Marketing', isDefault: true },
    { name: 'Travel', isDefault: true }
  ];
  
  const existingCategories = await tx.objectStore('expenseCategories').getAll();
  if (existingCategories.length === 0) {
    for (const category of defaultCategories) {
      await tx.objectStore('expenseCategories').add({
        id: `category-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: category.name,
        isDefault: category.isDefault,
        businessType: businessType,
        encrypted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }

  // Create sample clients and files for legal firms only
  if (businessType === 'legal') {
    const existingClients = await tx.objectStore('clients').getAll();
    if (existingClients.length === 0) {
      const now = new Date().toISOString();
      const sampleClients: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>[] = [
        {
          name: 'John Smith',
          email: 'john.smith@example.com',
          phone: '+1-555-0123',
          address: '123 Main St, City, State 12345',
          totalOutstandingFees: 2500.00,
          totalFundsHeld: 1500.00,
          encrypted: false,
        },
        {
          name: 'Jane Doe Legal',
          email: 'jane.doe@example.com',
          phone: '+1-555-0456',
          address: '456 Oak Ave, Town, State 67890',
          totalOutstandingFees: 1800.00,
          totalFundsHeld: 800.00,
          encrypted: false,
        },
        {
          name: 'Acme Corp',
          email: 'contact@acmecorp.com',
          phone: '+1-555-0789',
          address: '789 Business Blvd, Metro, State 13579',
          totalOutstandingFees: 4500.00,
          totalFundsHeld: 3000.00,
          encrypted: false,
        }
      ];

      for (const clientData of sampleClients) {
        const client: Client = {
          ...clientData,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        };
        await tx.objectStore('clients').add(client);

        // Create a sample client file for each client
        const sampleFile: Omit<ClientFile, 'id' | 'createdAt' | 'updatedAt'> = {
          clientId: client.id,
          fileName: `${client.name} - Matter File`,
          dateOpened: now.split('T')[0],
          feesToBePaid: client.totalOutstandingFees,
          depositPaid: client.totalFundsHeld * 0.5,
          balanceRemaining: client.totalOutstandingFees - (client.totalFundsHeld * 0.5),
          totalExpenses: 0,
          totalExtraFees: 0,
          totalFeesCharged: client.totalOutstandingFees,
          totalPaid: client.totalFundsHeld * 0.5,
          netSummary: (client.totalFundsHeld * 0.5) - client.totalOutstandingFees,
          status: 'active' as const,
          encrypted: false,
        };

        const file: ClientFile = {
          ...sampleFile,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        };
        await tx.objectStore('clientFiles').add(file);
      }

      console.log(`Created ${sampleClients.length} sample clients with files for legal firm onboarding`);
    }
  }
  
  await tx.done;
  return config.id;
}

//Legal Firm - Client operations;
export async function addClient(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const database = await getDB();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  const newClient: Client = {
    ...client,
    id,
    createdAt: now,
    updatedAt: now,
  };
  
  await database.add('clients', newClient);
  return id;
}

export async function getClients(): Promise<Client[]> {
  const database = await getDB();
  return await database.getAll('clients');
}

export async function updateClient(id: string, updates: Partial<Client>): Promise<void> {
  const database = await getDB();
  const client = await database.get('clients', id);
  if (client) {
    const updatedClient = {
      ...client,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await database.put('clients', updatedClient);
  }
}

export async function deleteClient(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('clients', id);
}

// Legal Firm - Client File operations
export async function addClientFile(file: Omit<ClientFile, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const database = await getDB();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  const newFile: ClientFile = {
    ...file,
    id,
    createdAt: now,
    updatedAt: now,
  };
  
  await database.add('clientFiles', newFile);
  return id;
}

export async function getClientFiles(clientId: string): Promise<ClientFile[]> {
  const database = await getDB();
  return await database.getAllFromIndex('clientFiles', 'by-client', clientId);
}

export async function updateClientFile(id: string, updates: Partial<ClientFile>): Promise<void> {
  const database = await getDB();
  const file = await database.get('clientFiles', id);
  if (file) {
    const updatedFile = {
      ...file,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await database.put('clientFiles', updatedFile);
  }
}

export async function deleteClientFile(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('clientFiles', id);
}

// Legal Firm - File Expense operations
export async function addFileExpense(expense: Omit<FileExpense, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const database = await getDB();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  const newExpense: FileExpense = {
    ...expense,
    id,
    createdAt: now,
    updatedAt: now,
  };
  
  await database.add('fileExpenses', newExpense);
  return id;
}

export async function getFileExpenses(fileId: string): Promise<FileExpense[]> {
  const database = await getDB();
  return await database.getAllFromIndex('fileExpenses', 'by-file', fileId);
}

export async function updateFileExpense(id: string, updates: Partial<FileExpense>): Promise<void> {
  const database = await getDB();
  const expense = await database.get('fileExpenses', id);
  if (expense) {
    const updatedExpense = {
      ...expense,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await database.put('fileExpenses', updatedExpense);
  }
}

export async function deleteFileExpense(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('fileExpenses', id);
}

// Legal Firm - Extra Fee operations
export async function addExtraFee(fee: Omit<ExtraFee, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const database = await getDB();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  const newFee: ExtraFee = {
    ...fee,
    id,
    createdAt: now,
    updatedAt: now,
  };
  
  await database.add('extraFees', newFee);
  return id;
}

export async function getExtraFees(fileId: string): Promise<ExtraFee[]> {
  const database = await getDB();
  return await database.getAllFromIndex('extraFees', 'by-file', fileId);
}

export async function updateExtraFee(id: string, updates: Partial<ExtraFee>): Promise<void> {
  const database = await getDB();
  const fee = await database.get('extraFees', id);
  if (fee) {
    const updatedFee = {
      ...fee,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await database.put('extraFees', updatedFee);
  }
}

export async function deleteExtraFee(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('extraFees', id);
}

// Invoice operations
export async function addInvoice(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const database = await getDB();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const newInvoice: Invoice = {
    ...invoice,
    id,
    createdAt: now,
    updatedAt: now,
  };

  await database.add('invoices', newInvoice);
  return id;
}

export async function getInvoices(): Promise<Invoice[]> {
  const database = await getDB();
  return await database.getAll('invoices');
}

export async function updateInvoice(id: string, updates: Partial<Invoice>): Promise<void> {
  const database = await getDB();
  const invoice = await database.get('invoices', id);
  if (invoice) {
    const updatedInvoice = {
      ...invoice,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await database.put('invoices', updatedInvoice);
  }
}

export async function deleteInvoice(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('invoices', id);
}

