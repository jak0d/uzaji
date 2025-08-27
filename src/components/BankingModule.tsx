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
import { addTransaction } from '../utils/database';

interface BankAccount {
  id: string;
  name: string;
  accountType: 'checking' | 'savings' | 'credit' | 'cash' | 'investment';
  accountNumber: string;
  bankName: string;
  currentBalance: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Transfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
}

interface BankingModuleProps {
  className?: string;
}

export function BankingModule({ className = '' }: BankingModuleProps) {
  const { formatCurrency, formatDate, getThemeClasses } = useSettings();
  const themeClasses = getThemeClasses();

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
    accountType: 'checking' as BankAccount['accountType'],
    accountNumber: '',
    bankName: '',
    currentBalance: '',
    isDefault: false
  });

  useEffect(() => {
    loadBankingData();
  }, []);

  const loadBankingData = async () => {
    // Mock data for demonstration
    const mockAccounts: BankAccount[] = [
      {
        id: '1',
        name: 'Business Checking',
        accountType: 'checking',
        accountNumber: '****1234',
        bankName: 'First National Bank',
        currentBalance: 15000,
        isDefault: true,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Business Savings',
        accountType: 'savings',
        accountNumber: '****5678',
        bankName: 'First National Bank',
        currentBalance: 25000,
        isDefault: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Petty Cash',
        accountType: 'cash',
        accountNumber: 'CASH-001',
        bankName: 'Cash Account',
        currentBalance: 500,
        isDefault: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const mockTransfers: Transfer[] = [
      {
        id: '1',
        fromAccountId: '1',
        toAccountId: '2',
        amount: 5000,
        description: 'Monthly savings transfer',
        date: '2024-01-15',
        status: 'completed',
        createdAt: new Date().toISOString()
      }
    ];

    setAccounts(mockAccounts);
    setTransfers(mockTransfers);
    setIsLoading(false);
  };

  const handleAddAccount = async () => {
    if (!accountForm.name || !accountForm.bankName) return;

    const newAccount: BankAccount = {
      id: Date.now().toString(),
      name: accountForm.name,
      accountType: accountForm.accountType,
      accountNumber: accountForm.accountNumber,
      bankName: accountForm.bankName,
      currentBalance: parseFloat(accountForm.currentBalance) || 0,
      isDefault: accountForm.isDefault,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setAccounts(prev => [...prev, newAccount]);
    setShowAccountForm(false);
    resetAccountForm();
  };

  const handleTransfer = async () => {
    if (!transferForm.fromAccountId || !transferForm.toAccountId || !transferForm.amount) return;

    const amount = parseFloat(transferForm.amount);
    const fromAccount = accounts.find(a => a.id === transferForm.fromAccountId);
    const toAccount = accounts.find(a => a.id === transferForm.toAccountId);

    if (!fromAccount || !toAccount || fromAccount.currentBalance < amount) return;

    // Create transfer record
    const newTransfer: Transfer = {
      id: Date.now().toString(),
      fromAccountId: transferForm.fromAccountId,
      toAccountId: transferForm.toAccountId,
      amount,
      description: transferForm.description || 'Account transfer',
      date: transferForm.date,
      status: 'completed',
      createdAt: new Date().toISOString()
    };

    // Update account balances
    setAccounts(prev => prev.map(account => {
      if (account.id === transferForm.fromAccountId) {
        return { ...account, currentBalance: account.currentBalance - amount };
      } else if (account.id === transferForm.toAccountId) {
        return { ...account, currentBalance: account.currentBalance + amount };
      }
      return account;
    }));

    // Add to transfers
    setTransfers(prev => [...prev, newTransfer]);

    // Create corresponding transactions in the main ledger
    await addTransaction({
      type: 'expense',
      amount,
      description: `Transfer to ${toAccount.name}: ${transferForm.description}`,
      category: 'Transfer',
      date: transferForm.date,
      account: transferForm.fromAccountId,
      attachments: [],
      tags: ['transfer']
    });

    await addTransaction({
      type: 'income',
      amount,
      description: `Transfer from ${fromAccount.name}: ${transferForm.description}`,
      category: 'Transfer',
      date: transferForm.date,
      account: transferForm.toAccountId,
      attachments: [],
      tags: ['transfer']
    });

    setShowTransferForm(false);
    resetTransferForm();
  };

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

  const getAccountTypeIcon = (type: BankAccount['accountType']) => {
    switch (type) {
      case 'checking': return Building;
      case 'savings': return TrendingUp;
      case 'credit': return CreditCard;
      case 'cash': return Wallet;
      case 'investment': return TrendingUp;
      default: return Building;
    }
  };

  const getAccountTypeColor = (type: BankAccount['accountType']) => {
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
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
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
          {accounts.length === 0 ? (
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
                  {accounts.map((account) => {
                    const Icon = getAccountTypeIcon(account.accountType);
                    return (
                      <tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
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
                            <button className={`p-1 ${themeClasses.textSecondary} hover:${themeClasses.text} rounded transition-colors`}>
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className={`p-1 ${themeClasses.textSecondary} hover:${themeClasses.text} rounded transition-colors`}>
                              <Edit className="w-4 h-4" />
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
          {transfers.length === 0 ? (
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {transfers.map((transfer) => {
                    const fromAccount = accounts.find(a => a.id === transfer.fromAccountId);
                    const toAccount = accounts.find(a => a.id === transfer.toAccountId);
                    return (
                      <tr key={transfer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
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
                  onChange={(e) => setAccountForm(prev => ({ ...prev, accountType: e.target.value as BankAccount['accountType'] }))}
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