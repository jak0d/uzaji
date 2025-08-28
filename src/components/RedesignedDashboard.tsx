import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaArrowUp, 
  FaArrowDown, 
  FaMoneyBillWave, 
  FaWallet, 
  FaPlus, 
  FaFileInvoiceDollar, 
  FaReceipt, 
  FaArrowRight,
  FaChartLine,
  FaChartPie,
  FaCalendarAlt,
  FaSyncAlt
} from 'react-icons/fa';
import { Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { getDB } from '../utils/database';
import { formatCurrency } from '../utils/formatters';
import { useSettings } from '../hooks/useSettings';
import { cn } from '../utils/tailwind-utils';
import { DateRangePicker } from './DateRangePicker';
import { MetricCard } from './MetricCard';
import { SkeletonLoader } from './SkeletonLoader';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend);

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
  incomeChange: number;
  expenseChange: number;
  profitMargin: number;
}

interface RedesignedDashboardProps {
  className?: string;
  businessType?: 'general' | 'legal';
  onNavigate?: (view: string) => void;
  user?: any; // Consider replacing 'any' with a proper User type
  onLogout?: () => void;
}

export function RedesignedDashboard({ 
  className = '',
  businessType: propBusinessType = 'general',
  onNavigate,
  user,
  onLogout
}: RedesignedDashboardProps) {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  
  // Handle navigation using onNavigate if provided, otherwise use the navigate function
  const handleNavigation = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigate(path);
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    end: new Date()
  });
  
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    netIncome: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    cashBalance: 0,
    accountsReceivable: 0,
    accountsPayable: 0,
    incomeChange: 0,
    expenseChange: 0,
    profitMargin: 0,
  });
  
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [chartData, setChartData] = useState({
    labels: [] as string[],
    income: [] as number[],
    expenses: [] as number[],
  });

  // Fetch data from IndexedDB
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const db = await getDB();
      const tx = db.transaction(['transactions'], 'readonly');
      const transactionStore = tx.objectStore('transactions');
      
      // Get all transactions within date range
      const allTransactions = await transactionStore.getAll();
      const transactions = allTransactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= dateRange.start && txDate <= dateRange.end;
      }) as Transaction[];

      // Calculate metrics
      const calculatedMetrics = transactions.reduce<DashboardMetrics>((acc, tx) => {
        if (tx.type === 'income') {
          acc.totalRevenue += tx.amount;
          acc.netIncome += tx.amount;
          if (tx.status !== 'completed') {
            acc.accountsReceivable += tx.amount;
          }
        } else {
          acc.totalExpenses += tx.amount;
          acc.netIncome -= tx.amount;
          if (tx.status !== 'completed') {
            acc.accountsPayable += tx.amount;
          }
        }
        return acc;
      }, { 
        ...metrics,
        totalRevenue: 0,
        totalExpenses: 0,
        netIncome: 0,
        accountsReceivable: 0,
        accountsPayable: 0,
        incomeChange: 12.5, // Mock data
        expenseChange: -5.2, // Mock data
        profitMargin: 0,
      });

      // Calculate profit margin
      calculatedMetrics.profitMargin = calculatedMetrics.totalRevenue > 0 
        ? (calculatedMetrics.netIncome / calculatedMetrics.totalRevenue) * 100 
        : 0;

      setMetrics(calculatedMetrics);

      // Prepare chart data
      const days = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) || 1;
      const labels = [];
      const incomeData = new Array(days).fill(0);
      const expensesData = new Array(days).fill(0);
      const categoryMap = new Map<string, number>();

      // Process transactions for charts
      transactions.forEach(tx => {
        const txDate = new Date(tx.date);
        const dayIndex = Math.floor((txDate.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
        
        if (dayIndex >= 0 && dayIndex < days) {
          if (tx.type === 'income') {
            incomeData[dayIndex] = (incomeData[dayIndex] || 0) + tx.amount;
          } else {
            expensesData[dayIndex] = (expensesData[dayIndex] || 0) + tx.amount;
            // Track categories for expenses
            const category = tx.category || 'Uncategorized';
            categoryMap.set(category, (categoryMap.get(category) || 0) + tx.amount);
          }
        }
      });

      // Generate date labels
      for (let i = 0; i < days; i++) {
        const date = new Date(dateRange.start);
        date.setDate(date.getDate() + i);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      }

      setChartData({
        labels,
        income: incomeData,
        expenses: expensesData.map(exp => Math.abs(exp))
      });

      // Get recent transactions (last 5)
      const recent = [...transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
      
      setRecentTransactions(recent);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  // Fetch data when date range changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Chart data and options
  const lineChartData = useMemo(() => ({
    labels: chartData.labels,
    datasets: [
      {
        label: 'Income',
        data: chartData.income,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.3,
        fill: true
      },
      {
        label: 'Expenses',
        data: chartData.expenses,
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.3,
        fill: true
      }
    ]
  }), [chartData]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => formatCurrency(Number(value))
        }
      }
    }
  }), []);

  // Handlers
  const handleDateRangeChange = (start: Date, end: Date) => {
    setDateRange({ start, end });
  };

  const handleRecordTransaction = () => {
    navigate('/transactions/new');
  };

  const handleViewAllTransactions = () => {
    navigate('/transactions');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonLoader key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
        <SkeletonLoader className="h-80 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-6 p-4 sm:p-6 relative", className)}>
      {/* User Menu */}
      {user && (
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
          >
            <span>{user.name || user.email}</span>
            <svg
              className={`h-5 w-5 transition-transform ${isUserMenuOpen ? 'transform rotate-180' : ''}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
              <div className="py-1">
                <button
                  onClick={() => {
                    handleNavigation('/settings');
                    setIsUserMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Settings
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsUserMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {settings?.businessName || 'Business'}
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <DateRangePicker
            startDate={dateRange.start}
            endDate={dateRange.end}
            onChange={handleDateRangeChange}
          />
          <button
            onClick={() => fetchData()}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaSyncAlt className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Net Income"
          value={metrics.netIncome}
          icon={<FaMoneyBillWave className="h-5 w-5" />}
          trend={metrics.netIncome >= 0 ? 'up' : 'down'}
          trendValue={`${Math.abs(metrics.profitMargin).toFixed(1)}%`}
          color={metrics.netIncome >= 0 ? 'green' : 'red'}
        />
        
        <MetricCard 
          title="Total Revenue"
          value={metrics.totalRevenue}
          icon={<FaArrowUp className="h-5 w-5" />}
          trend={metrics.incomeChange >= 0 ? 'up' : 'down'}
          trendValue={`${Math.abs(metrics.incomeChange)}%`}
          color="blue"
        />
        
        <MetricCard 
          title="Total Expenses"
          value={-metrics.totalExpenses}
          icon={<FaArrowDown className="h-5 w-5" />}
          trend={metrics.expenseChange >= 0 ? 'up' : 'down'}
          trendValue={`${Math.abs(metrics.expenseChange)}%`}
          color={metrics.expenseChange >= 0 ? 'red' : 'green'}
        />
        
        <MetricCard 
          title="Cash Balance"
          value={metrics.cashBalance}
          icon={<FaWallet className="h-5 w-5" />}
          trend={metrics.cashBalance >= 0 ? 'up' : 'down'}
          trendValue={metrics.cashBalance >= 0 ? 'Good' : 'Low'}
          color={metrics.cashBalance >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* Income vs Expenses Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Income vs Expenses</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span className="text-sm text-gray-600 dark:text-gray-300">Income</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
              <span className="text-sm text-gray-600 dark:text-gray-300">Expenses</span>
            </div>
          </div>
        </div>
        <div className="h-80">
          <Line data={lineChartData} options={chartOptions} />
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Transactions</h3>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRecordTransaction}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaPlus className="h-3 w-3 mr-1" />
              New
            </button>
            <button
              onClick={handleViewAllTransactions}
              className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              View All
            </button>
          </div>
        </div>
        
        {recentTransactions.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentTransactions.map((transaction) => (
              <div 
                key={transaction.id} 
                className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/transactions/${transaction.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`flex items-center justify-center h-10 w-10 rounded-full ${
                      transaction.type === 'income' 
                        ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {transaction.type === 'income' ? (
                        <FaArrowDown className="h-5 w-5 transform rotate-45" />
                      ) : (
                        <FaArrowUp className="h-5 w-5 transform -rotate-45" />
                      )}
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {transaction.description || (transaction.type === 'income' ? 'Income' : 'Expense')}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(transaction.date).toLocaleDateString()}
                        {transaction.category && ` • ${transaction.category}`}
                      </p>
                    </div>
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
            ))}
          </div>
        ) : (
          <div className="p-6 text-center">
            <FaFileInvoiceDollar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No transactions</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by recording your first transaction.
            </p>
            <div className="mt-6">
              <button
                type="button"
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
  );
}
