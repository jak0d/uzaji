import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  FileText, 
  CreditCard,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../hooks/useSettings';
import { getDashboardMetrics } from '../utils/dashboardUtils';

interface DashboardMetrics {
  netIncome: number;
  totalRevenue: number;
  totalExpenses: number;
  cashBalance: number;
  accountsReceivable: number;
  accountsPayable: number;
}

interface MetricsBarProps {
  businessType: 'general' | 'legal';
  onRefresh?: () => void;
  className?: string;
}

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'green' | 'red' | 'blue' | 'purple' | 'orange' | 'gray';
  isLoading?: boolean;
  isPlaceholder?: boolean;
  placeholderText?: string;
  formatAsCurrency?: boolean;
  onClick?: () => void;
  clickable?: boolean;
}

function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  isLoading, 
  isPlaceholder, 
  placeholderText,
  formatAsCurrency = true,
  onClick,
  clickable = false
}: MetricCardProps) {
  const { formatCurrency, getThemeClasses } = useSettings();
  const themeClasses = getThemeClasses();

  const colorClasses = {
    green: {
      text: 'text-green-600',
      bg: 'bg-green-100',
      darkBg: 'dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800'
    },
    red: {
      text: 'text-red-600',
      bg: 'bg-red-100',
      darkBg: 'dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800'
    },
    blue: {
      text: 'text-blue-600',
      bg: 'bg-blue-100',
      darkBg: 'dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800'
    },
    purple: {
      text: 'text-purple-600',
      bg: 'bg-purple-100',
      darkBg: 'dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800'
    },
    orange: {
      text: 'text-orange-600',
      bg: 'bg-orange-100',
      darkBg: 'dark:bg-orange-900/20',
      border: 'border-orange-200 dark:border-orange-800'
    },
    gray: {
      text: 'text-gray-600',
      bg: 'bg-gray-100',
      darkBg: 'dark:bg-gray-700',
      border: 'border-gray-200 dark:border-gray-600'
    }
  };

  const colorClass = colorClasses[color];

  const CardWrapper = clickable ? 'button' : 'div';
  
  return (
    <CardWrapper 
      className={`
        ${themeClasses.cardBackground} rounded-lg shadow-sm p-4 sm:p-6 
        ${themeClasses.border} border transition-all duration-200 hover:shadow-md
        ${isPlaceholder ? 'opacity-60' : ''}
        ${clickable ? 'cursor-pointer hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2' : ''}
        w-full text-left
      `}
      onClick={clickable ? onClick : undefined}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium ${themeClasses.textSecondary} mb-1`}>
            {title}
          </p>
          
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ) : isPlaceholder ? (
            <div>
              <p className="text-2xl font-bold text-gray-400 mb-1">
                {formatAsCurrency ? formatCurrency(0) : '0'}
              </p>
              {placeholderText && (
                <p className="text-xs text-gray-400">
                  {placeholderText}
                </p>
              )}
            </div>
          ) : (
            <p className={`text-2xl font-bold ${colorClass.text}`}>
              {formatAsCurrency ? formatCurrency(value) : value.toLocaleString()}
            </p>
          )}
        </div>
        
        <div className={`
          w-12 h-12 rounded-full flex items-center justify-center
          ${colorClass.bg} ${colorClass.darkBg}
          ${isPlaceholder ? 'opacity-50' : ''}
        `}>
          <Icon className={`w-6 h-6 ${colorClass.text}`} />
        </div>
      </div>
    </CardWrapper>
  );
}

export function MetricsBar({ businessType, onRefresh, className = '' }: MetricsBarProps) {
  const { getThemeClasses } = useSettings();
  const themeClasses = getThemeClasses();
  const navigate = useNavigate();
  
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    netIncome: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    cashBalance: 0,
    accountsReceivable: 0,
    accountsPayable: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadMetrics();
    
    // Set up periodic refresh every 30 seconds
    const interval = setInterval(loadMetrics, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      setError(null);
            const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);
      const data = await getDashboardMetrics(startDate, endDate);
      setMetrics(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
      setError('Failed to load financial data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await loadMetrics();
    onRefresh?.();
  };

  const getNetIncomeColor = (): 'green' | 'red' => {
    return metrics.netIncome >= 0 ? 'green' : 'red';
  };

  const metricsConfig = [
    {
      title: 'Net Income',
      value: metrics.netIncome,
      icon: DollarSign,
      color: getNetIncomeColor(),
      key: 'netIncome',
      isPlaceholder: false,
      clickable: false
    },
    {
      title: 'Total Revenue',
      value: metrics.totalRevenue,
      icon: TrendingUp,
      color: 'green' as const,
      key: 'totalRevenue',
      isPlaceholder: false,
      clickable: false
    },
    {
      title: 'Total Expenses',
      value: metrics.totalExpenses,
      icon: TrendingDown,
      color: 'red' as const,
      key: 'totalExpenses',
      isPlaceholder: false,
      clickable: false
    },
    {
      title: 'Cash Balance',
      value: metrics.cashBalance,
      icon: Wallet,
      color: 'blue' as const,
      key: 'cashBalance',
      isPlaceholder: false,
      clickable: false
    },
    {
      title: 'Accounts Receivable',
      value: metrics.accountsReceivable,
      icon: FileText,
      color: 'purple' as const,
      key: 'accountsReceivable',
      isPlaceholder: false,
      placeholderText: 'Click to view invoices',
      clickable: true,
      onClick: () => navigate('/sales')
    },
    {
      title: 'Accounts Payable',
      value: metrics.accountsPayable,
      icon: CreditCard,
      color: 'orange' as const,
      key: 'accountsPayable',
      isPlaceholder: false,
      placeholderText: 'Click to view bills',
      clickable: true,
      onClick: () => navigate('/purchases')
    }
  ];

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className={`text-xl font-semibold ${themeClasses.text}`}>
            Financial Overview
          </h2>
          <p className={`text-sm ${themeClasses.textSecondary} mt-1`}>
            Real-time financial metrics • Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className={`
            flex items-center space-x-2 px-3 py-2 text-sm font-medium
            ${themeClasses.textSecondary} hover:${themeClasses.text}
            ${themeClasses.hover} rounded-lg transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          aria-label="Refresh metrics"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-800 dark:text-red-200">
              {error}
            </p>
            <button
              onClick={handleRefresh}
              className="text-sm text-red-600 hover:text-red-700 underline ml-auto"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {metricsConfig.map((metric) => (
          <MetricCard
            key={metric.key}
            title={metric.title}
            value={metric.value}
            icon={metric.icon}
            color={metric.color}
            isLoading={isLoading}
            isPlaceholder={metric.isPlaceholder}
            placeholderText={metric.placeholderText}
            onClick={metric.onClick}
            clickable={metric.clickable}
          />
        ))}
      </div>

      {/* Business Type Specific Notes */}
      {businessType === 'legal' && (
        <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <p className="text-sm text-purple-800 dark:text-purple-200">
            <strong>Legal Firm:</strong> Track client retainers and case expenses for better financial management. 
            Accounts Receivable and Payable features will help manage client billing in the Pro version.
          </p>
        </div>
      )}

      {/* Data Source Info */}
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        Data is calculated from your local transaction records and updated in real-time. 
        All financial information is stored securely on your device.
      </div>
    </div>
  );
}