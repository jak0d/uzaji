import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaArrowUp, 
  FaArrowDown, 
  FaMoneyBillWave, 
  FaWallet, 
  FaPlus, 
  FaFileInvoiceDollar, 
  FaReceipt, 
  FaArrowRight
} from 'react-icons/fa';
import { getDB } from '../utils/database';
import { formatCurrency } from '../utils/formatters';
import { useSettings } from '../hooks/useSettings';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description?: string;
  date: string;
  category?: string;
  accountId?: string;
  status?: 'pending' | 'completed' | 'cancelled';
}

interface DashboardMetrics {
  netIncome: number;
  totalRevenue: number;
  totalExpenses: number;
  cashBalance: number;
  accountsReceivable: number;
  accountsPayable: number;
}

interface RedesignedDashboardProps {
  className?: string;
  businessType?: 'general' | 'legal';
}

// Account interface removed as it's not being used

export function RedesignedDashboard({ 
  className = '',
  businessType: propBusinessType = 'general' 
}: RedesignedDashboardProps) {
  const { settings } = useSettings() as { settings: { businessName?: string } };
  const navigate = useNavigate();
  
  const [businessType] = useState<'general' | 'legal'>(propBusinessType);
  const [isLoading, setIsLoading] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    netIncome: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    cashBalance: 0,
    accountsReceivable: 0,
    accountsPayable: 0,
  });
  
  // Remove unused accounts state since it's not being used
  // const [accounts] = useState<Account[]>([]);
  
  const refreshDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const db = await getDB();
      const tx = db.transaction(['transactions'], 'readonly');
      const transactionStore = tx.objectStore('transactions');
      
      // Get date range for current month
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const dateRange = IDBKeyRange.bound(
        firstDay.toISOString(),
        lastDay.toISOString()
      );
      
      // Fetch transactions data
      const transactions = await transactionStore.index('by-date').getAll(dateRange) as Transaction[];

      // Calculate metrics
      const initialMetrics: DashboardMetrics = {
        netIncome: 0,
        totalRevenue: 0,
        totalExpenses: 0,
        cashBalance: 0, // Default to 0 since we're not using accounts
        accountsReceivable: 0,
        accountsPayable: 0
      };

      const calculatedMetrics = transactions.reduce<DashboardMetrics>((acc, tx) => {
        if (tx.type === 'income') {
          acc.totalRevenue += tx.amount;
          acc.netIncome += tx.amount;
        } else {
          acc.totalExpenses += tx.amount;
          acc.netIncome -= tx.amount;
        }
        return acc;
      }, { ...initialMetrics });
      
      // Calculate accounts receivable and payable
      const unpaidInvoices = transactions.filter(
        tx => tx.type === 'income' && tx.status !== 'completed'
      );
      const unpaidBills = transactions.filter(
        tx => tx.type === 'expense' && tx.status !== 'completed'
      );
      
      calculatedMetrics.accountsReceivable = unpaidInvoices.reduce(
        (sum, tx) => sum + tx.amount, 0
      );
      calculatedMetrics.accountsPayable = unpaidBills.reduce(
        (sum, tx) => sum + tx.amount, 0
      );
      
      setMetrics(calculatedMetrics);
      
      // Sort and get recent transactions (last 5)
      const recent = [...transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
      
      setRecentTransactions(recent);
      
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setMetrics, setRecentTransactions]);

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  const handleRecordTransaction = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    navigate('/transactions/new');
  }, [navigate]);

  const handleCreateInvoice = useCallback(() => {
    if (businessType === 'legal') {
      // Show upgrade prompt for legal businesses
      // This could be replaced with a modal or other UI element
      alert('Invoicing is a Pro feature for legal businesses. Please upgrade to access this feature.');
      return;
    }
    navigate('/invoices/new');
  }, [businessType, navigate]);

  const handleRecordBill = useCallback(() => {
    if (businessType === 'legal') {
      // Show upgrade prompt for legal businesses
      alert('Bill management is a Pro feature for legal businesses. Please upgrade to access this feature.');
      return;
    }
    navigate('/bills/new');
  }, [businessType, navigate]);

  const handleViewAllTransactions = useCallback(() => {
    navigate('/transactions');
  }, [navigate]);
  

  // No unused functions or variables

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className={`py-8 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome back, {settings?.businessName || 'Business'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={refreshDashboard}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Net Income */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Net Income</p>
                <p className={`mt-1 text-2xl font-semibold ${
                  metrics.netIncome >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {formatCurrency(metrics.netIncome)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <FaMoneyBillWave className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className={`inline-flex items-center ${
                metrics.netIncome >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {metrics.netIncome >= 0 ? (
                  <>
                    <FaArrowUp className="mr-1" />
                    {formatCurrency(metrics.netIncome)}
                  </>
                ) : (
                  <>
                    <FaArrowDown className="mr-1" />
                    {formatCurrency(Math.abs(metrics.netIncome))}
                  </>
                )}
              </span>
              <span className="ml-2 text-gray-500 dark:text-gray-400">this month</span>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(metrics.totalRevenue)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                <FaArrowUp className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 dark:text-green-400 font-medium">
                +12.5%
              </span>
              <span className="ml-2 text-gray-500 dark:text-gray-400">vs last month</span>
            </div>
          </div>

          {/* Total Expenses */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Expenses</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(metrics.totalExpenses)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                <FaArrowDown className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-red-600 dark:text-red-400 font-medium">
                -3.2%
              </span>
              <span className="ml-2 text-gray-500 dark:text-gray-400">vs last month</span>
            </div>
          </div>

          {/* Cash Balance */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cash Balance</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(metrics.cashBalance)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400">
                <FaWallet className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 dark:text-green-400 font-medium">
                +5.8%
              </span>
              <span className="ml-2 text-gray-500 dark:text-gray-400">vs last month</span>
            </div>
          </div>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Quick Actions</h3>
              </div>
              <div className="p-6 space-y-4">
                <button
                  onClick={handleRecordTransaction}
                  className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                      <FaPlus className="h-5 w-5" />
                    </div>
                    <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                      Record Transaction
                    </span>
                  </div>
                  <FaArrowRight className="h-4 w-4 text-gray-400" />
                </button>

                <button
                  onClick={handleCreateInvoice}
                  disabled={businessType === 'legal'}
                  className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={businessType === 'legal' ? 'Available in Pro' : 'Create Invoice'}
                >
                  <div className="flex items-center">
                    <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                      <FaFileInvoiceDollar className="h-5 w-5" />
                    </div>
                    <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                      Create Invoice
                    </span>
                  </div>
                  <FaArrowRight className="h-4 w-4 text-gray-400" />
                </button>

                <button
                  onClick={handleRecordBill}
                  disabled={businessType === 'legal'}
                  className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={businessType === 'legal' ? 'Available in Pro' : 'Record Bill'}
                >
                  <div className="flex items-center">
                    <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                      <FaReceipt className="h-5 w-5" />
                    </div>
                    <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                      Record Bill
                    </span>
                  </div>
                  <FaArrowRight className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Activity</h3>
                <button
                  onClick={handleViewAllTransactions}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  View All
                </button>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {transaction.description || (transaction.type === 'income' ? 'Income' : 'Expense')}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(transaction.date).toLocaleDateString()}
                          </p>
                        </div>
                        <p className={`text-sm font-medium ${
                          transaction.type === 'income' 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                    No recent activity to show
                    <div className="mt-4">
                      <button
                        onClick={handleRecordTransaction}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <FaPlus className="-ml-1 mr-2 h-5 w-5" />
                        New Transaction
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Business Type Specific Tips */}
        {businessType === 'legal' ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  You're using Uzaji Pro! Unlock all features by upgrading your plan.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Tax Preparation</h4>
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                Keep detailed records of all business expenses. Proper categorization makes tax time much easier.
              </p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Cash Flow</h4>
              <p className="text-green-800 dark:text-green-200 text-sm">
      </div>
    </div>
  );
};

export default RedesignedDashboard;