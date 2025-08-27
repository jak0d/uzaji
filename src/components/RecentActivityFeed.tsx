import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Tag, 
  User, 
  Building, 
  RefreshCw, 
  AlertCircle,
  Plus,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { getTransactions } from '../utils/database';
import type { Transaction } from '../utils/database';

interface RecentActivityFeedProps {
  maxItems?: number;
  onTransactionClick?: (transaction: Transaction) => void;
  onAddTransaction?: () => void;
  businessType?: 'general' | 'legal';
  className?: string;
}

interface TransactionItemProps {
  transaction: Transaction;
  onClick?: (transaction: Transaction) => void;
  isCompact?: boolean;
}

function TransactionItem({ transaction, onClick, isCompact = false }: TransactionItemProps) {
  const { formatCurrency, formatDate, getThemeClasses } = useSettings();
  const themeClasses = getThemeClasses();
  const [showDetails, setShowDetails] = useState(false);

  const isIncome = transaction.type === 'income';
  const Icon = isIncome ? TrendingUp : TrendingDown;
  const amountColor = isIncome ? 'text-green-600' : 'text-red-600';
  const bgColor = isIncome ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20';
  const iconColor = isIncome ? 'text-green-500' : 'text-red-500';

  const handleClick = () => {
    if (onClick) {
      onClick(transaction);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={`
        group relative p-4 rounded-lg border transition-all duration-200
        ${themeClasses.cardBackground} ${themeClasses.border}
        ${onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700' : ''}
        ${isCompact ? 'p-3' : 'p-4'}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
      aria-label={onClick ? `View transaction: ${transaction.description}` : undefined}
    >
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* Transaction Type Icon */}
          <div className={`
            flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
            ${bgColor}
          `}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>

          {/* Transaction Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className={`font-medium ${themeClasses.text} truncate`}>
                {transaction.description}
              </h4>
              {transaction.customer && (
                <div className="flex items-center space-x-1 text-xs text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                  <User className="w-3 h-3" />
                  <span className="truncate max-w-20">{transaction.customer}</span>
                </div>
              )}
              {transaction.vendor && (
                <div className="flex items-center space-x-1 text-xs text-purple-600 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full">
                  <Building className="w-3 h-3" />
                  <span className="truncate max-w-20">{transaction.vendor}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(transaction.date)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Tag className="w-3 h-3" />
                <span className="truncate">{transaction.category}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3">
          {/* Amount */}
          <div className="text-right">
            <p className={`font-bold ${amountColor} ${isCompact ? 'text-base' : 'text-lg'}`}>
              {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {transaction.account || 'Main Account'}
            </p>
          </div>

          {/* Actions */}
          {onClick && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails(!showDetails);
                }}
                className={`p-1 ${themeClasses.textSecondary} hover:${themeClasses.text} ${themeClasses.hover} rounded transition-colors`}
                aria-label="More options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Transaction ID:</span>
              <p className="font-mono text-xs text-gray-600 dark:text-gray-300 truncate">
                {transaction.id}
              </p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Created:</span>
              <p className="text-gray-600 dark:text-gray-300">
                {formatDate(transaction.createdAt)}
              </p>
            </div>
            {transaction.tags && transaction.tags.length > 0 && (
              <div className="col-span-2">
                <span className="text-gray-500 dark:text-gray-400">Tags:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {transaction.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function RecentActivityFeed({ 
  maxItems = 5, 
  onTransactionClick, 
  onAddTransaction,
  businessType = 'general',
  className = '' 
}: RecentActivityFeedProps) {
  const { settings, getThemeClasses } = useSettings();
  const themeClasses = getThemeClasses();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadTransactions();
    
    // Set up periodic refresh every 30 seconds
    const interval = setInterval(loadTransactions, 30000);
    
    return () => clearInterval(interval);
  }, [maxItems]);

  const loadTransactions = async () => {
    try {
      setError(null);
      const allTransactions = await getTransactions();
      
      // Sort by date (newest first) and take the most recent items
      const sortedTransactions = allTransactions
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, maxItems);
      
      setTransactions(sortedTransactions);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load transactions:', err);
      setError('Failed to load recent transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await loadTransactions();
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className={`text-xl font-semibold ${themeClasses.text}`}>
            Recent Activity
          </h2>
          <p className={`text-sm ${themeClasses.textSecondary} mt-1`}>
            Your latest {maxItems} transactions • Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className={`
              p-2 ${themeClasses.textSecondary} hover:${themeClasses.text}
              ${themeClasses.hover} rounded-lg transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            aria-label="Refresh transactions"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          
          {onAddTransaction && (
            <button
              onClick={onAddTransaction}
              className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Transaction</span>
            </button>
          )}
        </div>
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

      {/* Content */}
      <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm ${themeClasses.border} border`}>
        {isLoading ? (
          <div className="p-6">
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
                  </div>
                  <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className={`text-lg font-medium ${themeClasses.text} mb-2`}>
              No transactions yet
            </h3>
            <p className={`text-sm ${themeClasses.textSecondary} mb-4`}>
              {businessType === 'legal' 
                ? 'Start tracking your legal practice finances by recording your first client payment or case expense.'
                : 'Get started by recording your first sale, purchase, or business expense.'
              }
            </p>
            {onAddTransaction && (
              <button
                onClick={onAddTransaction}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Record First Transaction</span>
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="p-0">
                <TransactionItem
                  transaction={transaction}
                  onClick={onTransactionClick}
                  isCompact={settings.compactView}
                />
              </div>
            ))}
          </div>
        )}

        {/* View All Link */}
        {transactions.length > 0 && (
          <div className={`p-4 border-t ${themeClasses.border} text-center`}>
            <button
              className={`text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors flex items-center space-x-1 mx-auto`}
            >
              <Eye className="w-4 h-4" />
              <span>View All Transactions</span>
            </button>
          </div>
        )}
      </div>

      {/* Business Type Specific Tips */}
      {transactions.length === 0 && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
            {businessType === 'legal' ? 'Legal Practice Tips:' : 'Business Tips:'}
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            {businessType === 'legal' ? (
              <>
                <li>• Record client retainers and payments as income</li>
                <li>• Track court fees and legal research as expenses</li>
                <li>• Categorize expenses by case or client for better tracking</li>
              </>
            ) : (
              <>
                <li>• Record all sales and income as they happen</li>
                <li>• Track business expenses for tax deductions</li>
                <li>• Use categories to organize different types of transactions</li>
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}