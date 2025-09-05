import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Edit, 
  Trash2, 
  User,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../hooks/useSettings';
import { getTransactions, deleteTransaction, getClients, getClientFiles } from '../utils/database';
import { getBusinessType } from '../utils/businessConfig';
import type { Transaction, Client, ClientFile } from '../utils/database';

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
  const navigate = useNavigate();
  const { formatCurrency, formatDate, getThemeClasses } = useSettings();
  const themeClasses = getThemeClasses();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [clients, setClients] = useState<Record<string, Client>>({});
  const [clientFiles, setClientFiles] = useState<Record<string, ClientFile>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
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
  const [currentBusinessType, setCurrentBusinessType] = useState<'general' | 'legal' | null>(null);

  useEffect(() => {
    loadData();
    
    const loadBusinessTypeAndClients = async () => {
      const type = await getBusinessType() || 'general';
      setCurrentBusinessType(type);
      
      if (type === 'legal') {
        setIsLoadingClients(true);
        try {
          const clientsList = await getClients();
          const clientsMap = clientsList.reduce((acc, client) => ({ ...acc, [client.id]: client }), {});
          setClients(clientsMap);
          
          const filesMap: Record<string, ClientFile> = {};
          for (const client of clientsList) {
            const files = await getClientFiles(client.id);
            files.forEach(file => { filesMap[file.id] = file; });
          }
          setClientFiles(filesMap);
        } catch (error) {
          console.error('Failed to load clients and files:', error);
        } finally {
          setIsLoadingClients(false);
        }
      }
    };
    
    loadBusinessTypeAndClients();
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
        setCurrentBusinessType(businessTypeData);
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
      let aValue = a[sort.field];
      let bValue = b[sort.field];
      
      // Handle undefined/null values
      if (aValue === undefined || aValue === null) return sort.direction === 'desc' ? -1 : 1;
      if (bValue === undefined || bValue === null) return sort.direction === 'desc' ? 1 : -1;
      
      // Convert to string for consistent comparison
      const aString = String(aValue).toLowerCase();
      const bString = String(bValue).toLowerCase();
      
      let comparison = 0;
      if (aString < bString) comparison = -1;
      if (aString > bString) comparison = 1;
      
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

  if (isLoading || (currentBusinessType === 'legal' && isLoadingClients)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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

  const columns = [
    {
      key: 'date',
      label: 'Date',
      render: (transaction: Transaction) => formatDate(transaction.date)
    },
    {
      key: 'description',
      label: 'Description',
      render: (transaction: Transaction) => transaction.description
    },
    ...(currentBusinessType === 'legal' ? [{
      key: 'client',
      label: 'Client',
      render: (transaction: Transaction) => {
        if (!transaction.clientId) return '-';
        const client = clients[transaction.clientId];
        return client ? (
          <div className="flex items-center">
            <User className="w-4 h-4 mr-2 text-gray-500" />
            <span>{client.name}</span>
          </div>
        ) : '-'; 
      }
    },
    {
      key: 'file',
      label: 'File',
      render: (transaction: Transaction) => {
        if (!transaction.clientFileId) return '-';
        const file = clientFiles[transaction.clientFileId];
        return file ? (
          <div className="flex items-center">
            <FileText className="w-4 h-4 mr-2 text-gray-500" />
            <span>{file.fileName}</span>
          </div>
        ) : '-'; 
      }
    }] : []),
    {
      key: 'category',
      label: 'Category',
      render: (transaction: Transaction) => transaction.category
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (transaction: Transaction) => (
        <span className={transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (transaction: Transaction) => (
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
      )
    }
  ];

  return (
    <div className={className}>
      {/* Navigation Buttons */}
      <div className="px-8 pt-8 flex items-center space-x-4">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors mb-4"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </button>
        {currentBusinessType !== 'general' && (
          <>
            <span className="text-gray-400 mb-4">|</span>
            <button 
              onClick={() => navigate('/clients')}
              className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors mb-4"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Clients and Files
            </button>
          </>
        )}
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-8">
        <div>
          <h1 className={`text-2xl font-semibold ${themeClasses.text}`}>
            All Transactions
          </h1>
          <p className={`${themeClasses.textSecondary} text-sm mt-1`}>
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
      <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm overflow-hidden ${themeClasses.border} border mx-8 mb-8`}>
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
                  {columns.map(column => (
                    <th 
                      key={column.key} 
                      className={`px-4 py-3 text-left text-sm font-medium ${themeClasses.text} cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700`}
                      onClick={() => handleSort(column.key as keyof Transaction)}
                    >
                      {column.label}
                      {sort.field === column.key && (
                        sort.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </th>
                  ))}
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
                    {columns.map(column => (
                      <td key={column.key} className={`px-4 py-3 text-sm ${themeClasses.text}`}>
                        {column.render(transaction)}
                      </td>
                    ))}
                    <td className="px-4 py-3">
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