import { getDB } from './database';

export interface DashboardMetrics {
  netIncome: number;
  totalRevenue: number;
  totalExpenses: number;
  cashBalance: number;
  accountsReceivable: number;
  accountsPayable: number;
  lastUpdated?: string;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const db = await getDB();
  
  // Get all transactions
  const transactions = await db.getAllFromIndex('transactions', 'by-date');
  
  // Calculate metrics
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Filter transactions for current month
  const currentMonthTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.date);
    return txDate.getMonth() === currentMonth && 
           txDate.getFullYear() === currentYear;
  });
  
  // Calculate metrics
  const totalRevenue = currentMonthTransactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);
    
  const totalExpenses = currentMonthTransactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);
    
  const netIncome = totalRevenue - totalExpenses;
  
  // Get account balances
  const accounts = await db.getAll('accounts');
  const cashBalance = accounts
    .filter(acc => acc.type === 'cash' || acc.type === 'bank')
    .reduce((sum, acc) => sum + (acc.balance || 0), 0);
    
  // Placeholder values for AR/AP (to be implemented)
  const accountsReceivable = 0;
  const accountsPayable = 0;
  
  return {
    netIncome,
    totalRevenue,
    totalExpenses,
    cashBalance,
    accountsReceivable,
    accountsPayable,
    lastUpdated: now.toISOString()
  };
}

export async function getRecentTransactions(limit: number = 5) {
  const db = await getDB();
  const index = db.transaction('transactions', 'readonly')
    .store.index('by-date');
  
  let cursor = await index.openCursor(null, 'prev');
  const results = [];
  let count = 0;
  
  while (cursor && count < limit) {
    results.push(cursor.value);
    cursor = await cursor.continue();
    count++;
  }
  
  return results;
}

export async function getCashFlowData(months: number = 6) {
  const db = await getDB();
  const transactions = await db.getAllFromIndex('transactions', 'by-date');
  
  const now = new Date();
  const result = [];
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    
    const month = date.getMonth();
    const year = date.getFullYear();
    
    const monthTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate.getMonth() === month && 
             txDate.getFullYear() === year;
    });
    
    const income = monthTransactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
      
    const expenses = monthTransactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
      
    result.push({
      month: date.toLocaleString('default', { month: 'short' }),
      year: date.getFullYear(),
      income,
      expenses,
      net: income - expenses
    });
  }
  
  return result;
}
