import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  DollarSign,
  Tag,
  User,
  Building,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { getTransactions, deleteTransaction } from '../utils/database';
import { getBusinessType } from '../utils/businessConfig';
import type { Transaction } from '../utils/database';

interface TransactionsTableProps {
  onAddTransaction?: () => void;
  onEditTransaction?: (transaction: Transaction) => void;
  className?: string;
}

interface FilterState {
  search: string;
  type: 'all' | 'income' | 'expense';
  category: string;
  dateRange: {
    start: string;
    end: string;
  };
}

interface SortState {
  field: keyof Transaction;
  direction: 'asc' | 'desc';
}

export function TransactionsTable({ 
  onAddTransaction, 
  onEditTransaction,
  className = '' 
}: TransactionsTableProps) {
  const { formatCurrency, formatDate, getThemeClasses } = useSettings();
  const themeClasses = getThemeClasses();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [businessType, setBusinessType] = useState<'general' | 'legal'>('general');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: 'all',
    category: '',
    dateRange: {
      start: '',
      end: ''
    }
  });
  
  const [sort, setSort] = useState<SortState>({
    field: 'date',
    direction: 'desc'
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [transactions, filters, sort]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [transactionsData, businessTypeData] = await Promise.all([
        getTransactions(),
        getBusinessType()
      ]);
      
      setTransactions(transactionsData);
      if (businessTypeData) {
        setBusinessType(businessTypeData);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
      setError('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...transactions];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchLower) ||
        t.category.toLowerCase().includes(searchLower) ||
        t.customer?.toLowerCase().includes(searchLower) ||
        t.vendor?.toLowerCase().includes(searchLower)
      );
    }

    // Apply type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(t => t.type === filters.type);
    }

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(t => t.category === filters.category);
    }

    // Apply date range filter
    if (filters.dateRange.start) {
      filtered = filtered.filter(t => t.date >= filters.dateRange.start);
    }
    if (filters.dateRange.end) {
      filtered = filtered.filter(t => t.date <= filters.dateRange.end);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sort.field];
      const bValue = b[sort.field];
      
      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;
      
      return sort.direction === 'desc' ? -comparison : comparison;
    });

    setFilteredTransactions(filtered);
  };

  const handleSort = (field: keyof Transaction) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      await deleteTransaction(transactionId);
      setTransactions(prev => prev.filter(t => t.id !== transactionId));
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      setError('Failed to delete transaction');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTransactions.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedTransactions.length} transactions?`)) return;

    try {
      await Promise.all(selectedTransactions.map(id => deleteTransaction(id)));
      setTransactions(prev => prev.filter(t => !selectedTransactions.includes(t.id)));
      setSelectedTransactions([]);
    } catch (error) {
      console.error('Failed to delete transactions:', error);
      setError('Failed to delete transactions');
    }
  };

  const toggleTransactionSelection = (transactionId: string) => {
    setSelectedTransactions(prev => 
      prev.includes(transactionId)
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedTransactions(prev => 
      prev.length === filteredTransactions.length 
        ? [] 
        : filteredTransactions.map(t => t.id)
    );
  };

  const exportTransactions = () => {
    const csvContent = [
      ['Date', 'Description', 'Type', 'Category', 'Amount', 'Customer', 'Vendor'].join(','),
      ...filteredTransactions.map(t => [
        t.date,
        `"${t.description}"`,
        t.type,
        t.category,
        t.amount,
        t.customer || '',
        t.vendor || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getUniqueCategories = () => {
    return Array.from(new Set(transactions.map(t => t.category))).sort();
  };

  if (isLoading) {
    return (
      <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm p-8`}>
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mr-3" />
          <span className={themeClasses.textSecondary}>Loading transactions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm p-8`}>
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${themeClasses.text}`}>
            All Transactions
          </h1>
          <p className={`${themeClasses.textSecondary} mt-1`}>
            {filteredTransactions.length} of {transactions.length} transactions
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 ${themeClasses.cardBackground} ${themeClasses.border} border rounded-lg hover:shadow-sm transition-all`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          <button
            onClick={exportTransactions}
            className={`flex items-center space-x-2 px-4 py-2 ${themeClasses.cardBackground} ${themeClasses.border} border rounded-lg hover:shadow-sm transition-all`}
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          
          {onAddTransaction && (
            <button
              onClick={onAddTransaction}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Add Transaction</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm p-4 mb-6 ${themeClasses.border} border`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                Search
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.cardBackground}`}
                  placeholder="Search transactions..."
                />
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as FilterState['type'] }))}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.cardBackground}`}
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.cardBackground}`}
              >
                <option value="">All Categories</option>
                {getUniqueCategories().map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                Date Range
              </label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    dateRange: { ...prev.dateRange, start: e.target.value }
                  }))}
                  className={`flex-1 px-2 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.cardBackground}`}
                />
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    dateRange: { ...prev.dateRange, end: e.target.value }
                  }))}
                  className={`flex-1 px-2 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.cardBackground}`}
                />
              </div>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setFilters({
                search: '',
                type: 'all',
                category: '',
                dateRange: { start: '', end: '' }
              })}
              className={`px-4 py-2 text-sm ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedTransactions.length > 0 && (
        <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm p-4 mb-4 ${themeClasses.border} border`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm ${themeClasses.text}`}>
              {selectedTransactions.length} transactions selected
            </span>
            <button
              onClick={handleBulkDelete}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm overflow-hidden ${themeClasses.border} border`}>
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <p className={`${themeClasses.textSecondary} mb-4`}>
              {transactions.length === 0 
                ? 'No transactions found. Start by recording your first transaction.'
                : 'No transactions match your current filters.'
              }
            </p>
            {onAddTransaction && transactions.length === 0 && (
              <button
                onClick={onAddTransaction}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
              >
                Add First Transaction
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`bg-gray-50 dark:bg-gray-800 ${themeClasses.border} border-b`}>
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedTransactions.length === filteredTransactions.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th 
                    className={`px-4 py-3 text-left text-sm font-medium ${themeClasses.text} cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700`}
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Date</span>
                      {sort.field === 'date' && (
                        sort.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className={`px-4 py-3 text-left text-sm font-medium ${themeClasses.text} cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700`}
                    onClick={() => handleSort('description')}
                  >
                    Description
                  </th>
                  <th 
                    className={`px-4 py-3 text-left text-sm font-medium ${themeClasses.text} cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700`}
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center space-x-1">
                      <Tag className="w-4 h-4" />
                      <span>Category</span>
                    </div>
                  </th>
                  <th className={`px-4 py-3 text-left text-sm font-medium ${themeClasses.text}`}>
                    {businessType === 'legal' ? 'Client/Vendor' : 'Customer/Vendor'}
                  </th>
                  <th 
                    className={`px-4 py-3 text-right text-sm font-medium ${themeClasses.text} cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700`}
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <DollarSign className="w-4 h-4" />
                      <span>Amount</span>
                      {sort.field === 'amount' && (
                        sort.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className={`px-4 py-3 text-center text-sm font-medium ${themeClasses.text}`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTransactions.map((transaction) => (
                  <tr 
                    key={transaction.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      selectedTransactions.includes(transaction.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.includes(transaction.id)}
                        onChange={() => toggleTransactionSelection(transaction.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className={`px-4 py-3 text-sm ${themeClasses.text}`}>
                      {formatDate(transaction.date)}
                    </td>
                    <td className={`px-4 py-3 text-sm ${themeClasses.text}`}>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        {transaction.account && (
                          <p className={`text-xs ${themeClasses.textSecondary}`}>
                            Account: {transaction.account}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-sm ${themeClasses.text}`}>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                        {transaction.category}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-sm ${themeClasses.textSecondary}`}>
                      {transaction.customer && (
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{transaction.customer}</span>
                        </div>
                      )}
                      {transaction.vendor && (
                        <div className="flex items-center space-x-1">
                          <Building className="w-3 h-3" />
                          <span>{transaction.vendor}</span>
                        </div>
                      )}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-medium ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {onEditTransaction && (
                          <button
                            onClick={() => onEditTransaction(transaction)}
                            className={`p-1 ${themeClasses.textSecondary} hover:${themeClasses.text} ${themeClasses.hover} rounded transition-colors`}
                            title="Edit transaction"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      {filteredTransactions.length > 0 && (
        <div className={`mt-6 ${themeClasses.cardBackground} rounded-lg shadow-sm p-4 ${themeClasses.border} border`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className={`text-sm ${themeClasses.textSecondary}`}>Total Income</p>
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0))}
              </p>
            </div>
            <div className="text-center">
              <p className={`text-sm ${themeClasses.textSecondary}`}>Total Expenses</p>
              <p className="text-lg font-bold text-red-600">
                {formatCurrency(filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0))}
              </p>
            </div>
            <div className="text-center">
              <p className={`text-sm ${themeClasses.textSecondary}`}>Net Total</p>
              <p className={`text-lg font-bold ${
                filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) -
                filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) >= 0
                  ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(
                  filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) -
                  filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}