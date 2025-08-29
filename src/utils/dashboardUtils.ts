import { getDB } from './database';

export interface DashboardMetrics {
  netIncome: number;
  totalRevenue: number;
  totalExpenses: number;
  cashBalance: number;
  accountsReceivable: number;
  accountsPayable: number;
  incomeChange: number;
  expenseChange: number;
  profitMargin: number;
  lastUpdated?: string;
}

export async function getDashboardMetrics(
  startDate: Date,
  endDate: Date
): Promise<DashboardMetrics> {
  const db = await getDB();

  const [allTransactions, accounts] = await Promise.all([
    db.getAll('transactions'),
    db.getAll('accounts'),
  ]);

  // --- Current Period Calculation ---
  const rangeTransactions = allTransactions.filter(tx => {
    const txDate = new Date(tx.date);
    return txDate >= startDate && txDate <= endDate;
  });

  const currentMetrics = rangeTransactions.reduce(
    (acc, tx) => {
      if (tx.type === 'income') acc.totalRevenue += tx.amount;
      else acc.totalExpenses += tx.amount;
      return acc;
    },
    { totalRevenue: 0, totalExpenses: 0 }
  );

  // --- Previous Period Calculation ---
  const duration = endDate.getTime() - startDate.getTime();
  const prevEndDate = new Date(startDate.getTime() - 1);
  const prevStartDate = new Date(prevEndDate.getTime() - duration);

  const prevRangeTransactions = allTransactions.filter(tx => {
    const txDate = new Date(tx.date);
    return txDate >= prevStartDate && txDate <= prevEndDate;
  });

  const previousMetrics = prevRangeTransactions.reduce(
    (acc, tx) => {
      if (tx.type === 'income') acc.totalRevenue += tx.amount;
      else acc.totalExpenses += tx.amount;
      return acc;
    },
    { totalRevenue: 0, totalExpenses: 0 }
  );

  // --- Calculate Changes ---
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  };

  const incomeChange = calculateChange(currentMetrics.totalRevenue, previousMetrics.totalRevenue);
  const expenseChange = calculateChange(currentMetrics.totalExpenses, previousMetrics.totalExpenses);

  // --- Final Metrics Aggregation ---
  const { accountsReceivable, accountsPayable } = rangeTransactions.reduce(
    (acc, tx) => {
      if (tx.status !== 'completed') {
        if (tx.type === 'income') acc.accountsReceivable += tx.amount;
        else acc.accountsPayable += tx.amount;
      }
      return acc;
    },
    { accountsReceivable: 0, accountsPayable: 0 }
  );

  const netIncome = currentMetrics.totalRevenue - currentMetrics.totalExpenses;
  const profitMargin = currentMetrics.totalRevenue > 0 ? (netIncome / currentMetrics.totalRevenue) * 100 : 0;
  const cashBalance = accounts
    .filter(acc => acc.type === 'cash' || acc.type === 'bank')
    .reduce((sum, acc) => sum + (acc.balance || 0), 0);

  return {
    netIncome,
    totalRevenue: currentMetrics.totalRevenue,
    totalExpenses: currentMetrics.totalExpenses,
    cashBalance,
    accountsReceivable,
    accountsPayable,
    profitMargin,
    incomeChange,
    expenseChange,
    lastUpdated: new Date().toISOString(),
  };
}

export async function getRecentTransactions(
  startDate: Date,
  endDate: Date,
  limit: number = 5
) {
  const db = await getDB();
  const allTransactions = await db.getAllFromIndex('transactions', 'by-date');

  // Filter transactions for the date range
  const rangeTransactions = allTransactions.filter(tx => {
    const txDate = new Date(tx.date);
    return txDate >= startDate && txDate <= endDate;
  });

  // Sort by date descending and take the limit
  return rangeTransactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

export async function getChartData(startDate: Date, endDate: Date) {
  const db = await getDB();
  const allTransactions = await db.getAll('transactions');

  const rangeTransactions = allTransactions.filter(tx => {
    const txDate = new Date(tx.date);
    return txDate >= startDate && txDate <= endDate;
  });

  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
  const labels = [];
  const incomeData = new Array(days).fill(0);
  const expensesData = new Array(days).fill(0);

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }

  rangeTransactions.forEach(tx => {
    const txDate = new Date(tx.date);
    const dayIndex = Math.floor((txDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    if (dayIndex >= 0 && dayIndex < days) {
      if (tx.type === 'income') {
        incomeData[dayIndex] += tx.amount;
      } else {
        expensesData[dayIndex] += tx.amount;
      }
    }
  });

  return {
    labels,
    income: incomeData,
    expenses: expensesData,
  };
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
