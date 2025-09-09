import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Building,
  CreditCard,
  ArrowRightLeft,
  DollarSign,
  Eye,
  Search,
  Filter,
  Download,
  Wallet,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { addTransaction, getAccounts, getTransfers, addAccount, updateAccount, deleteAccount, addTransfer, updateTransfer, deleteTransfer, Account, Transfer } from '../utils/database';


export function BankingModule() {
  const { formatCurrency, formatDate, getThemeClasses } = useSettings();
  const themeClasses = getThemeClasses();

  const [accounts, setAccounts] = useState<Account[]>([]);
    const [transfers, setTransfers] = useState<Transfer[]>([]);
    const [showAccountForm, setShowAccountForm] = useState(false);
    const [showTransferForm, setShowTransferForm] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [editingTransfer, setEditingTransfer] = useState<Transfer | null>(null);
    const [showEditTransferForm, setShowEditTransferForm] = useState(false);
    const [showAccountDetails, setShowAccountDetails] = useState<Account | null>(null);
    const [showTransferDetails, setShowTransferDetails] = useState<Transfer | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    // Bulk actions state
    const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
    const [selectedTransfers, setSelectedTransfers] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
    const [filterType, setFilterType] = useState<'all' | 'checking' | 'savings' | 'credit' | 'cash' | 'investment'>('all');
    const [selectedView, setSelectedView] = useState<'accounts' | 'transfers'>('accounts');

  // Transfer form state
  const [transferForm, setTransferForm] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Account form state
  const [accountForm, setAccountForm] = useState({
      name: '',
      accountType: 'checking' as Account['accountType'],
      accountNumber: '',
      bankName: '',
      currentBalance: '',
      isDefault: false
    });

  useEffect(() => {
    loadBankingData();
  }, []);

  const loadBankingData = async () => {
    try {
      setIsLoading(true);
      const realAccounts = await getAccounts();
      const realTransfers = await getTransfers();
      
      // Filter active accounts
      const activeAccounts = realAccounts.filter(a => a.isActive);
      
      setAccounts(activeAccounts);
      setTransfers(realTransfers);
    } catch (error) {
      console.error('Failed to load banking data:', error);
      // Fallback to empty arrays
      setAccounts([]);
      setTransfers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAccount = async () => {
    if (!accountForm.name || !accountForm.bankName) return;
  
    try {
      const newAccountData = {
        name: accountForm.name,
        accountType: accountForm.accountType,
        accountNumber: accountForm.accountNumber,
        bankName: accountForm.bankName,
        currentBalance: parseFloat(accountForm.currentBalance) || 0,
        isDefault: accountForm.isDefault,
        isActive: true,
        encrypted: false,
      };
  
      await addAccount(newAccountData);
      
      // Reload data
      await loadBankingData();
      setShowAccountForm(false);
      resetAccountForm();
    } catch (error) {
      console.error('Failed to add account:', error);
      // Handle error (e.g., show toast notification)
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this account? This action cannot be undone.')) return;
    
    try {
      await deleteAccount(accountId);
      await loadBankingData();
    } catch (error) {
      console.error('Failed to delete account:', error);
      // Handle error (e.g., show toast notification)
    }
  };

  const handleTransfer = async () => {
    if (!transferForm.fromAccountId || !transferForm.toAccountId || !transferForm.amount) return;
  
    const amount = parseFloat(transferForm.amount);
    const fromAccount = accounts.find(a => a.id === transferForm.fromAccountId);
    const toAccount = accounts.find(a => a.id === transferForm.toAccountId);
  
    if (!fromAccount || !toAccount || fromAccount.currentBalance < amount) return;
  
    try {
      // Create transfer record
      const newTransferData = {
        fromAccountId: transferForm.fromAccountId,
        toAccountId: transferForm.toAccountId,
        amount,
        description: transferForm.description || 'Account transfer',
        date: transferForm.date,
        status: 'completed' as const,
      };
  
      await addTransfer(newTransferData);
  
      // Update account balances
      await updateAccount(transferForm.fromAccountId, {
        currentBalance: fromAccount.currentBalance - amount,
        updatedAt: new Date().toISOString()
      });
  
      await updateAccount(transferForm.toAccountId, {
        currentBalance: toAccount.currentBalance + amount,
        updatedAt: new Date().toISOString()
      });
  
      // Create corresponding transactions in the main ledger
      await addTransaction({
        type: 'expense',
        amount,
        description: `Transfer to ${toAccount.name}: ${transferForm.description}`,
        category: 'Transfer',
        date: transferForm.date,
        account: transferForm.fromAccountId,
        attachments: [],
        tags: ['transfer'],
        encrypted: false
      });
  
      await addTransaction({
        type: 'income',
        amount,
        description: `Transfer from ${fromAccount.name}: ${transferForm.description}`,
        category: 'Transfer',
        date: transferForm.date,
        account: transferForm.toAccountId,
        attachments: [],
        tags: ['transfer'],
        encrypted: false
      });
  
      // Reload data
      await loadBankingData();
      
      setShowTransferForm(false);
      resetTransferForm();
    } catch (error) {
      console.error('Failed to process transfer:', error);
      // Handle error (e.g., show toast notification)
    }
  };

  const handleEditTransfer = (transfer: Transfer) => {
    setEditingTransfer(transfer);
    setTransferForm({
      fromAccountId: transfer.fromAccountId,
      toAccountId: transfer.toAccountId,
      amount: transfer.amount.toString(),
      description: transfer.description || '',
      date: transfer.date
    });
    setShowEditTransferForm(true);
  };

  const handleUpdateTransfer = async () => {
    if (!transferForm.fromAccountId || !transferForm.toAccountId || !transferForm.amount) return;

    const amount = parseFloat(transferForm.amount);
    const originalTransfer = editingTransfer!;
    const fromAccount = accounts.find(a => a.id === transferForm.fromAccountId);
    const toAccount = accounts.find(a => a.id === transferForm.toAccountId);

    if (!fromAccount || !toAccount) return;

    try {
      // Calculate balance adjustments
      const balanceChange = amount - originalTransfer.amount;
      
      // Update transfer record
      await updateTransfer(originalTransfer.id, {
        fromAccountId: transferForm.fromAccountId,
        toAccountId: transferForm.toAccountId,
        amount,
        description: transferForm.description || 'Account transfer',
        date: transferForm.date,
        status: 'completed' as const,
        updatedAt: new Date().toISOString()
      });

      // Update account balances if amount changed
      if (balanceChange !== 0) {
        await updateAccount(originalTransfer.fromAccountId, {
          currentBalance: fromAccount.currentBalance - balanceChange,
          updatedAt: new Date().toISOString()
        });

        await updateAccount(originalTransfer.toAccountId, {
          currentBalance: toAccount.currentBalance + balanceChange,
          updatedAt: new Date().toISOString()
        });
      }

      // Reload data
      await loadBankingData();
      
      setShowEditTransferForm(false);
      setEditingTransfer(null);
      resetTransferForm();
    } catch (error) {
      console.error('Failed to update transfer:', error);
      // Handle error (e.g., show toast notification)
    }
  };

  const handleViewAccountDetails = (account: Account) => {
    setShowAccountDetails(account);
  };

  const handleViewTransferDetails = (transfer: Transfer) => {
    setShowTransferDetails(transfer);
  };

  const handleDeleteTransfer = async (transferId: string) => {
    if (!confirm('Are you sure you want to delete this transfer? This action cannot be undone.')) return;
    
    try {
      await deleteTransfer(transferId);
      await loadBankingData();
    } catch (error) {
      console.error('Failed to delete transfer:', error);
      // Handle error (e.g., show toast notification)
    }
  };

  // Bulk actions handlers
  const handleAccountSelection = (accountId: string, checked: boolean) => {
    setSelectedAccounts(prev =>
      checked ? [...prev, accountId] : prev.filter(id => id !== accountId)
    );
  };

  const handleTransferSelection = (transferId: string, checked: boolean) => {
    setSelectedTransfers(prev =>
      checked ? [...prev, transferId] : prev.filter(id => id !== transferId)
    );
  };

  const handleSelectAllAccounts = (checked: boolean) => {
    setSelectedAccounts(checked ? accounts.map(a => a.id) : []);
  };

  const handleSelectAllTransfers = (checked: boolean) => {
    setSelectedTransfers(checked ? transfers.map(t => t.id) : []);
  };

  const handleBulkDeleteAccounts = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedAccounts.length} account(s)? This action cannot be undone.`)) return;
    
    try {
      for (const accountId of selectedAccounts) {
        await deleteAccount(accountId);
      }
      await loadBankingData();
      setSelectedAccounts([]);
    } catch (error) {
      console.error('Failed to delete accounts:', error);
    }
  };

  const handleBulkDeleteTransfers = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedTransfers.length} transfer(s)? This action cannot be undone.`)) return;
    
    try {
      for (const transferId of selectedTransfers) {
        await deleteTransfer(transferId);
      }
      await loadBankingData();
      setSelectedTransfers([]);
    } catch (error) {
      console.error('Failed to delete transfers:', error);
    }
  };

  // Filter functions
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.bankName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'active' && account.isActive) ||
                         (filterStatus === 'inactive' && !account.isActive);
    const matchesType = filterType === 'all' || account.accountType === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const filteredTransfers = transfers.filter(transfer => {
    const fromAccount = accounts.find(a => a.id === transfer.fromAccountId);
    const toAccount = accounts.find(a => a.id === transfer.toAccountId);
    const matchesSearch = transfer.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fromAccount?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         toAccount?.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const resetAccountForm = () => {
    setAccountForm({
      name: '',
      accountType: 'checking',
      accountNumber: '',
      bankName: '',
      currentBalance: '',
      isDefault: false
    });
    setEditingAccount(null);
  };

  const resetTransferForm = () => {
    setTransferForm({
      fromAccountId: '',
      toAccountId: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const getAccountTypeIcon = (type: Account['accountType']) => {
    switch (type) {
      case 'checking': return Building;
      case 'savings': return TrendingUp;
      case 'credit': return CreditCard;
      case 'cash': return Wallet;
      case 'investment': return TrendingUp;
      default: return Building;
    }
  };

  const getAccountTypeColor = (type: Account['accountType']) => {
    switch (type) {
      case 'checking': return 'text-blue-600 bg-blue-100';
      case 'savings': return 'text-green-600 bg-green-100';
      case 'credit': return 'text-red-600 bg-red-100';
      case 'cash': return 'text-yellow-600 bg-yellow-100';
      case 'investment': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const totalBalance = accounts.reduce((sum, account) => sum + account.currentBalance, 0);

  if (isLoading) {
    return (
      <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm p-8`}>
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mr-3" />
          <span className={themeClasses.textSecondary}>Loading banking data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-2xl font-bold ${themeClasses.text}`}>
            Banking & Accounts
          </h1>
          <p className={`${themeClasses.textSecondary} mt-1`}>
            Manage your bank accounts and transfers
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAccountForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Account</span>
          </button>
          
          <button
            onClick={() => setShowTransferForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Transfer Funds</span>
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {(selectedAccounts.length > 0 || selectedTransfers.length > 0) && (
        <div className={`${themeClasses.cardBackground} border rounded-lg p-4 mb-6 flex items-center justify-between`}>
          <div className="flex items-center space-x-4">
            <span className={`${themeClasses.text}`}>
              {selectedView === 'accounts' ? selectedAccounts.length : selectedTransfers.length} selected
            </span>
            <div className="flex space-x-2">
              <select className={`border rounded-lg px-3 py-1 ${themeClasses.text} ${themeClasses.cardBackground}`}>
                <option>Actions</option>
                <option onClick={selectedView === 'accounts' ? handleBulkDeleteAccounts : handleBulkDeleteTransfers}>
                  Delete selected
                </option>
              </select>
              <button
                onClick={selectedView === 'accounts' ? handleBulkDeleteAccounts : handleBulkDeleteTransfers}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Selected
              </button>
            </div>
          </div>
          <button
            onClick={() => {
              if (selectedView === 'accounts') setSelectedAccounts([]);
              else setSelectedTransfers([]);
            }}
            className={`text-sm ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Search and Filter */}
      <div className={`${themeClasses.cardBackground} border rounded-lg p-4 mb-6`}>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${themeClasses.textSecondary}`} />
            <input
              type="text"
              placeholder={`Search ${selectedView === 'accounts' ? 'accounts' : 'transfers'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.cardBackground}`}
            />
          </div>
          {selectedView === 'accounts' && (
            <div className="flex space-x-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                className={`px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.cardBackground}`}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'checking' | 'savings' | 'credit' | 'cash' | 'investment')}
                className={`px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.cardBackground}`}
              >
                <option value="all">All Types</option>
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="credit">Credit Card</option>
                <option value="cash">Cash</option>
                <option value="investment">Investment</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm p-6 border ${themeClasses.border}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${themeClasses.textSecondary}`}>Total Balance</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totalBalance)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm p-6 border ${themeClasses.border}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${themeClasses.textSecondary}`}>Active Accounts</p>
              <p className={`text-2xl font-bold ${themeClasses.text}`}>
                {accounts.filter(a => a.isActive).length}
              </p>
            </div>
            <Building className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm p-6 border ${themeClasses.border}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${themeClasses.textSecondary}`}>This Month Transfers</p>
              <p className={`text-2xl font-bold ${themeClasses.text}`}>
                {transfers.length}
              </p>
            </div>
            <ArrowRightLeft className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm p-6 border ${themeClasses.border}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${themeClasses.textSecondary}`}>Transfer Volume</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(transfers.reduce((sum, t) => sum + t.amount, 0))}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => setSelectedView('accounts')}
          className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
            selectedView === 'accounts'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
              : `${themeClasses.cardBackground} ${themeClasses.text} ${themeClasses.hover} border ${themeClasses.border}`
          }`}
        >
          <Building className="w-4 h-4 inline mr-2" />
          Accounts
        </button>
        <button
          onClick={() => setSelectedView('transfers')}
          className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
            selectedView === 'transfers'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
              : `${themeClasses.cardBackground} ${themeClasses.text} ${themeClasses.hover} border ${themeClasses.border}`
          }`}
        >
          <ArrowRightLeft className="w-4 h-4 inline mr-2" />
          Transfers
        </button>
      </div>

      {/* Accounts View */}
      {selectedView === 'accounts' && (
        <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm border ${themeClasses.border}`}>
          {filteredAccounts.length === 0 ? (
            <div className="p-8 text-center">
              <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className={`text-lg font-medium ${themeClasses.text} mb-2`}>
                No accounts found
              </h3>
              <p className={`${themeClasses.textSecondary} mb-4`}>
                Add your first bank account to start managing your finances.
              </p>
              <button
                onClick={() => setShowAccountForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add First Account
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 w-12">
                      <input
                        type="checkbox"
                        checked={selectedAccounts.length === filteredAccounts.length && filteredAccounts.length > 0}
                        onChange={(e) => handleSelectAllAccounts(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                      Account
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                      Type
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                      Bank
                    </th>
                    <th className={`px-6 py-3 text-right text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                      Balance
                    </th>
                    <th className={`px-6 py-3 text-center text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                      Status
                    </th>
                    <th className={`px-6 py-3 text-center text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredAccounts.map((account) => {
                    const Icon = getAccountTypeIcon(account.accountType);
                    return (
                      <tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <input
                            type="checkbox"
                            checked={selectedAccounts.includes(account.id)}
                            onChange={(e) => handleAccountSelection(account.id, e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap`}>
                          <div className="flex items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${getAccountTypeColor(account.accountType)}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className={`text-sm font-medium ${themeClasses.text}`}>
                                {account.name}
                                {account.isDefault && (
                                  <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full">
                                    Default
                                  </span>
                                )}
                              </p>
                              <p className={`text-xs ${themeClasses.textSecondary}`}>
                                {account.accountNumber}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap`}>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getAccountTypeColor(account.accountType)}`}>
                            {account.accountType}
                          </span>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${themeClasses.text}`}>
                          {account.bankName}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${themeClasses.text}`}>
                          {formatCurrency(account.currentBalance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            account.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {account.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleViewAccountDetails(account)}
                              className={`p-1 ${themeClasses.textSecondary} hover:${themeClasses.text} rounded transition-colors`}
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingAccount(account);
                                setAccountForm({
                                  name: account.name,
                                  accountType: account.accountType,
                                  accountNumber: account.accountNumber,
                                  bankName: account.bankName,
                                  currentBalance: account.currentBalance.toString(),
                                  isDefault: account.isDefault
                                });
                                setShowAccountForm(true);
                              }}
                              className={`p-1 ${themeClasses.textSecondary} hover:${themeClasses.text} rounded transition-colors`}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAccount(account.id)}
                              className="p-1 text-red-600 hover:text-red-800 rounded transition-colors"
                              title="Delete Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Transfers View */}
      {selectedView === 'transfers' && (
        <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm border ${themeClasses.border}`}>
          {filteredTransfers.length === 0 ? (
            <div className="p-8 text-center">
              <ArrowRightLeft className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className={`text-lg font-medium ${themeClasses.text} mb-2`}>
                No transfers found
              </h3>
              <p className={`${themeClasses.textSecondary} mb-4`}>
                Transfer funds between your accounts to get started.
              </p>
              <button
                onClick={() => setShowTransferForm(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Make First Transfer
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 w-12">
                      <input
                        type="checkbox"
                        checked={selectedTransfers.length === filteredTransfers.length && filteredTransfers.length > 0}
                        onChange={(e) => handleSelectAllTransfers(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                      Date
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                      From Account
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                      To Account
                    </th>
                    <th className={`px-6 py-3 text-right text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                      Amount
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                      Description
                    </th>
                    <th className={`px-6 py-3 text-center text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                      Status
                    </th>
                    <th className={`px-6 py-3 text-center text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredTransfers.map((transfer) => {
                    const fromAccount = accounts.find(a => a.id === transfer.fromAccountId);
                    const toAccount = accounts.find(a => a.id === transfer.toAccountId);
                    return (
                      <tr key={transfer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <input
                            type="checkbox"
                            checked={selectedTransfers.includes(transfer.id)}
                            onChange={(e) => handleTransferSelection(transfer.id, e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${themeClasses.text}`}>
                          {formatDate(transfer.date)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${themeClasses.text}`}>
                          {fromAccount?.name || 'Unknown Account'}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${themeClasses.text}`}>
                          {toAccount?.name || 'Unknown Account'}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${themeClasses.text}`}>
                          {formatCurrency(transfer.amount)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${themeClasses.textSecondary}`}>
                          {transfer.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            transfer.status === 'completed' ? 'bg-green-100 text-green-600' :
                            transfer.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-red-100 text-red-600'
                          }`}>
                            {transfer.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleEditTransfer(transfer)}
                              className="p-1 text-blue-600 hover:text-blue-800 rounded transition-colors"
                              title="Edit Transfer"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTransfer(transfer.id)}
                              className="p-1 text-red-600 hover:text-red-800 rounded transition-colors"
                              title="Delete Transfer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Account Form Modal */}
      {showAccountForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${themeClasses.cardBackground} rounded-lg shadow-xl w-full max-w-md`}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className={`text-xl font-bold ${themeClasses.text}`}>
                {editingAccount ? 'Edit Account' : 'Add New Account'}
              </h2>
              <button
                onClick={() => {
                  setShowAccountForm(false);
                  resetAccountForm();
                }}
                className={`p-2 ${themeClasses.textSecondary} hover:${themeClasses.text} rounded-lg transition-colors`}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  Account Name *
                </label>
                <input
                  type="text"
                  value={accountForm.name}
                  onChange={(e) => setAccountForm(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.cardBackground}`}
                  placeholder="Business Checking"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  Account Type *
                </label>
                <select
                  value={accountForm.accountType}
                  onChange={(e) => setAccountForm(prev => ({ ...prev, accountType: e.target.value as Account['accountType'] }))}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.cardBackground}`}
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="credit">Credit Card</option>
                  <option value="cash">Cash</option>
                  <option value="investment">Investment</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  Bank Name *
                </label>
                <input
                  type="text"
                  value={accountForm.bankName}
                  onChange={(e) => setAccountForm(prev => ({ ...prev, bankName: e.target.value }))}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.cardBackground}`}
                  placeholder="First National Bank"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  Account Number
                </label>
                <input
                  type="text"
                  value={accountForm.accountNumber}
                  onChange={(e) => setAccountForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.cardBackground}`}
                  placeholder="****1234"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  Current Balance
                </label>
                <input
                  type="number"
                  value={accountForm.currentBalance}
                  onChange={(e) => setAccountForm(prev => ({ ...prev, currentBalance: e.target.value }))}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.cardBackground}`}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={accountForm.isDefault}
                  onChange={(e) => setAccountForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isDefault" className={`ml-2 text-sm ${themeClasses.text}`}>
                  Set as default account
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowAccountForm(false);
                  resetAccountForm();
                }}
                className={`px-4 py-2 border border-gray-300 rounded-lg ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={handleAddAccount}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingAccount ? 'Update Account' : 'Add Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Transfer Form Modal */}
      {showEditTransferForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${themeClasses.cardBackground} rounded-lg shadow-xl w-full max-w-md`}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className={`text-xl font-bold ${themeClasses.text}`}>
                Edit Transfer
              </h2>
              <button
                onClick={() => {
                  setShowEditTransferForm(false);
                  setEditingTransfer(null);
                  resetTransferForm();
                }}
                className={`p-2 ${themeClasses.textSecondary} hover:${themeClasses.text} rounded-lg transition-colors`}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  From Account *
                </label>
                <select
                  value={transferForm.fromAccountId}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, fromAccountId: e.target.value }))}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${themeClasses.cardBackground}`}
                >
                  <option value="">Select account</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({formatCurrency(account.currentBalance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  To Account *
                </label>
                <select
                  value={transferForm.toAccountId}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, toAccountId: e.target.value }))}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${themeClasses.cardBackground}`}
                >
                  <option value="">Select account</option>
                  {accounts.filter(account => account.id !== transferForm.fromAccountId).map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({formatCurrency(account.currentBalance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  Amount *
                </label>
                <input
                  type="number"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, amount: e.target.value }))}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${themeClasses.cardBackground}`}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  Date *
                </label>
                <input
                  type="date"
                  value={transferForm.date}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, date: e.target.value }))}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${themeClasses.cardBackground}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  Description
                </label>
                <input
                  type="text"
                  value={transferForm.description}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, description: e.target.value }))}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${themeClasses.cardBackground}`}
                  placeholder="Transfer description"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowEditTransferForm(false);
                  setEditingTransfer(null);
                  resetTransferForm();
                }}
                className={`px-4 py-2 border border-gray-300 rounded-lg ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTransfer}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                Update Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Details Modal */}
      {showAccountDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${themeClasses.cardBackground} rounded-lg shadow-xl w-full max-w-lg`}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className={`text-xl font-bold ${themeClasses.text}`}>
                Account Details
              </h2>
              <button
                onClick={() => setShowAccountDetails(null)}
                className={`p-2 ${themeClasses.textSecondary} hover:${themeClasses.text} rounded-lg transition-colors`}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-1`}>Account Name</label>
                  <p className={`${themeClasses.text} font-medium`}>{showAccountDetails.name}</p>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-1`}>Account Type</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getAccountTypeColor(showAccountDetails.accountType)}`}>
                    {showAccountDetails.accountType}
                  </span>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-1`}>Bank Name</label>
                  <p className={`${themeClasses.text}`}>{showAccountDetails.bankName}</p>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-1`}>Account Number</label>
                  <p className={`${themeClasses.textSecondary}`}>{showAccountDetails.accountNumber || '**** **** **** ****'}</p>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-1`}>Current Balance</label>
                  <p className={`text-2xl font-bold text-green-600`}>{formatCurrency(showAccountDetails.currentBalance)}</p>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-1`}>Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    showAccountDetails.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {showAccountDetails.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {showAccountDetails.isDefault && (
                  <div className="col-span-2">
                    <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-1`}>Default Account</label>
                    <span className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full">
                      This is your default account
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowAccountDetails(null)}
                className={`px-4 py-2 border border-gray-300 rounded-lg ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Details Modal */}
      {showTransferDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${themeClasses.cardBackground} rounded-lg shadow-xl w-full max-w-lg`}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className={`text-xl font-bold ${themeClasses.text}`}>
                Transfer Details
              </h2>
              <button
                onClick={() => setShowTransferDetails(null)}
                className={`p-2 ${themeClasses.textSecondary} hover:${themeClasses.text} rounded-lg transition-colors`}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-1`}>Transfer Date</label>
                  <p className={`${themeClasses.text}`}>{formatDate(showTransferDetails.date)}</p>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-1`}>Amount</label>
                  <p className={`text-xl font-bold text-purple-600`}>{formatCurrency(showTransferDetails.amount)}</p>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-1`}>Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    showTransferDetails.status === 'completed' ? 'bg-green-100 text-green-600' :
                    showTransferDetails.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {showTransferDetails.status}
                  </span>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-1`}>From Account</label>
                  <p className={`${themeClasses.text}`}>
                    {accounts.find(a => a.id === showTransferDetails.fromAccountId)?.name || 'Unknown Account'}
                  </p>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-1`}>To Account</label>
                  <p className={`${themeClasses.text}`}>
                    {accounts.find(a => a.id === showTransferDetails.toAccountId)?.name || 'Unknown Account'}
                  </p>
                </div>
                {showTransferDetails.description && (
                  <div className="col-span-2">
                    <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-1`}>Description</label>
                    <p className={`${themeClasses.text}`}>{showTransferDetails.description}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowTransferDetails(null)}
                className={`px-4 py-2 border border-gray-300 rounded-lg ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Form Modal */}
      {showTransferForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${themeClasses.cardBackground} rounded-lg shadow-xl w-full max-w-md`}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className={`text-xl font-bold ${themeClasses.text}`}>
                Transfer Funds
              </h2>
              <button
                onClick={() => {
                  setShowTransferForm(false);
                  resetTransferForm();
                }}
                className={`p-2 ${themeClasses.textSecondary} hover:${themeClasses.text} rounded-lg transition-colors`}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  From Account *
                </label>
                <select
                  value={transferForm.fromAccountId}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, fromAccountId: e.target.value }))}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${themeClasses.cardBackground}`}
                >
                  <option value="">Select account</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({formatCurrency(account.currentBalance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  To Account *
                </label>
                <select
                  value={transferForm.toAccountId}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, toAccountId: e.target.value }))}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${themeClasses.cardBackground}`}
                >
                  <option value="">Select account</option>
                  {accounts.filter(account => account.id !== transferForm.fromAccountId).map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({formatCurrency(account.currentBalance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  Amount *
                </label>
                <input
                  type="number"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, amount: e.target.value }))}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${themeClasses.cardBackground}`}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  Date *
                </label>
                <input
                  type="date"
                  value={transferForm.date}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, date: e.target.value }))}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${themeClasses.cardBackground}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  Description
                </label>
                <input
                  type="text"
                  value={transferForm.description}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, description: e.target.value }))}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${themeClasses.cardBackground}`}
                  placeholder="Transfer description"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowTransferForm(false);
                  resetTransferForm();
                }}
                className={`px-4 py-2 border border-gray-300 rounded-lg ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={handleTransfer}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                Transfer Funds
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}