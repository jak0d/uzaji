import React, { useState, useEffect } from 'react';
import { 
  Download, 
  FileText, 
  BarChart3, 
  TrendingUp, 
  Calendar,
  RefreshCw,
  Scale,
  Brain,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../hooks/useSettings';
import { getTransactionsByDateRange, getInvoices, getBills } from '../utils/database';
import { getBusinessType } from '../utils/businessConfig';

interface FinancialReportsProps {
  className?: string;
}

interface ReportData {
  profitLoss: {
    revenue: { [category: string]: number };
    expenses: { [category: string]: number };
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
  };
  balanceSheet: {
    assets: {
      currentAssets: { [account: string]: number };
      totalCurrentAssets: number;
    };
    liabilities: {
      currentLiabilities: { [account: string]: number };
      totalCurrentLiabilities: number;
    };
    equity: {
      retainedEarnings: number;
      totalEquity: number;
    };
  };
  trialBalance: {
    accounts: Array<{
      account: string;
      debit: number;
      credit: number;
    }>;
    totalDebits: number;
    totalCredits: number;
  };
}

export function FinancialReports({ className = '' }: FinancialReportsProps) {
  const { formatCurrency, formatDate, getThemeClasses } = useSettings();
  const themeClasses = getThemeClasses();
  const navigate = useNavigate();
  
  const [businessType, setBusinessType] = useState<'general' | 'legal'>('general');
  
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of year
    endDate: new Date().toISOString().split('T')[0]
  });
  
  const [reportData, setReportData] = useState<ReportData>({
    profitLoss: {
      revenue: {},
      expenses: {},
      totalRevenue: 0,
      totalExpenses: 0,
      netIncome: 0
    },
    balanceSheet: {
      assets: {
        currentAssets: {},
        totalCurrentAssets: 0
      },
      liabilities: {
        currentLiabilities: {},
        totalCurrentLiabilities: 0
      },
      equity: {
        retainedEarnings: 0,
        totalEquity: 0
      }
    },
    trialBalance: {
      accounts: [],
      totalDebits: 0,
      totalCredits: 0
    }
  });
  
  const [selectedReport, setSelectedReport] = useState<'profit-loss' | 'balance-sheet' | 'trial-balance'>('profit-loss');
  const [isLoading, setIsLoading] = useState(false);

  const loadBusinessType = async () => {
    try {
      const type = await getBusinessType();
      if (type) {
        setBusinessType(type);
      }
    } catch (error) {
      console.error('Failed to load business type:', error);
    }
  };

  useEffect(() => {
    loadReportData();
    loadBusinessType();
  }, [dateRange, loadReportData]);

  const loadReportData = useCallback(async () => {
    setIsLoading(true);
    try {
      const transactions = await getTransactionsByDateRange(dateRange.startDate, dateRange.endDate);
      const invoices = await getInvoices();
      const bills = await getBills();

      // Generate Profit & Loss data
      const revenue: { [category: string]: number } = {};
      const expenses: { [category: string]: number } = {};
      
      transactions.forEach(transaction => {
        if (transaction.type === 'income') {
          revenue[transaction.category] = (revenue[transaction.category] || 0) + transaction.amount;
        } else {
          expenses[transaction.category] = (expenses[transaction.category] || 0) + transaction.amount;
        }
      });
      
      const totalRevenue = Object.values(revenue).reduce((sum, amount) => sum + amount, 0);
      const totalExpenses = Object.values(expenses).reduce((sum, amount) => sum + amount, 0);
      
      // Generate Balance Sheet data
      const accountsReceivable = invoices
        .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
        .reduce((sum, inv) => sum + inv.totalAmount, 0);

      const accountsPayable = bills
        .filter(bill => bill.status !== 'paid' && bill.status !== 'cancelled')
        .reduce((sum, bill) => sum + bill.totalAmount, 0);

      const currentAssets = {
        'Cash and Cash Equivalents': totalRevenue - totalExpenses,
        'Accounts Receivable': accountsReceivable,
        'Inventory': 0 // Assuming no inventory tracking for now
      };
      
      const currentLiabilities = {
        'Accounts Payable': accountsPayable,
        'Accrued Expenses': 0
      };
      
      const totalCurrentAssets = Object.values(currentAssets).reduce((sum, amount) => sum + amount, 0);
      const totalCurrentLiabilities = Object.values(currentLiabilities).reduce((sum, amount) => sum + amount, 0);
      const retainedEarnings = totalRevenue - totalExpenses;
      
      // Generate Trial Balance data
      const accounts: Array<{ account: string; debit: number; credit: number }> = [];
      
      // Add revenue accounts (credits)
      Object.entries(revenue).forEach(([category, amount]) => {
        accounts.push({
          account: category,
          debit: 0,
          credit: amount
        });
      });
      
      // Add expense accounts (debits)
      Object.entries(expenses).forEach(([category, amount]) => {
        accounts.push({
          account: category,
          debit: amount,
          credit: 0
        });
      });
      
      // Add asset accounts
      if (totalCurrentAssets > 0) {
        accounts.push({
          account: 'Cash and Cash Equivalents',
          debit: totalCurrentAssets,
          credit: 0
        });
      }
      
      // Add retained earnings (credit)
      if (retainedEarnings !== 0) {
        accounts.push({
          account: 'Retained Earnings',
          debit: retainedEarnings < 0 ? Math.abs(retainedEarnings) : 0,
          credit: retainedEarnings > 0 ? retainedEarnings : 0
        });
      }
      
      const totalDebits = accounts.reduce((sum, account) => sum + account.debit, 0);
      const totalCredits = accounts.reduce((sum, account) => sum + account.credit, 0);
      
      setReportData({
        profitLoss: {
          revenue,
          expenses,
          totalRevenue,
          totalExpenses,
          netIncome: totalRevenue - totalExpenses
        },
        balanceSheet: {
          assets: {
            currentAssets,
            totalCurrentAssets
          },
          liabilities: {
            currentLiabilities,
            totalCurrentLiabilities
          },
          equity: {
            retainedEarnings,
            totalEquity: retainedEarnings
          }
        },
        trialBalance: {
          accounts,
          totalDebits,
          totalCredits
        }
      });
    } catch (error) {
      console.error('Failed to load report data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  const exportToPDF = () => {
    // TODO: Implement PDF export
    console.log('Exporting to PDF...');
    alert('PDF export functionality will be implemented with a PDF library like jsPDF');
  };

  const exportToCSV = () => {
    let csvContent = '';
    let filename = '';
    
    if (selectedReport === 'profit-loss') {
      csvContent = 'Account,Amount\n';
      csvContent += 'REVENUE\n';
      Object.entries(reportData.profitLoss.revenue).forEach(([category, amount]) => {
        csvContent += `${category},${amount}\n`;
      });
      csvContent += `Total Revenue,${reportData.profitLoss.totalRevenue}\n\n`;
      
      csvContent += 'EXPENSES\n';
      Object.entries(reportData.profitLoss.expenses).forEach(([category, amount]) => {
        csvContent += `${category},${amount}\n`;
      });
      csvContent += `Total Expenses,${reportData.profitLoss.totalExpenses}\n\n`;
      csvContent += `Net Income,${reportData.profitLoss.netIncome}\n`;
      filename = 'profit-loss-statement.csv';
    } else if (selectedReport === 'balance-sheet') {
      csvContent = 'Account,Amount\n';
      csvContent += 'ASSETS\n';
      Object.entries(reportData.balanceSheet.assets.currentAssets).forEach(([account, amount]) => {
        csvContent += `${account},${amount}\n`;
      });
      csvContent += `Total Assets,${reportData.balanceSheet.assets.totalCurrentAssets}\n\n`;
      
      csvContent += 'LIABILITIES\n';
      Object.entries(reportData.balanceSheet.liabilities.currentLiabilities).forEach(([account, amount]) => {
        csvContent += `${account},${amount}\n`;
      });
      csvContent += `Total Liabilities,${reportData.balanceSheet.liabilities.totalCurrentLiabilities}\n\n`;
      
      csvContent += 'EQUITY\n';
      csvContent += `Retained Earnings,${reportData.balanceSheet.equity.retainedEarnings}\n`;
      csvContent += `Total Equity,${reportData.balanceSheet.equity.totalEquity}\n`;
      filename = 'balance-sheet.csv';
    } else if (selectedReport === 'trial-balance') {
      csvContent = 'Account,Debit,Credit\n';
      reportData.trialBalance.accounts.forEach(account => {
        csvContent += `${account.account},${account.debit},${account.credit}\n`;
      });
      csvContent += `TOTALS,${reportData.trialBalance.totalDebits},${reportData.trialBalance.totalCredits}\n`;
      filename = 'trial-balance.csv';
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reportTabs = [
    { id: 'profit-loss', label: 'Profit & Loss', icon: TrendingUp },
    { id: 'balance-sheet', label: 'Balance Sheet', icon: Scale },
    { id: 'trial-balance', label: 'Trial Balance', icon: BarChart3 }
  ];

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-2xl font-bold ${themeClasses.text}`}>
            Financial Reports
          </h1>
          <p className={`${themeClasses.textSecondary} mt-1`}>
            Professional financial statements and analysis
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={loadReportData}
            disabled={isLoading}
            className={`flex items-center space-x-2 px-4 py-2 ${themeClasses.textSecondary} hover:${themeClasses.text} ${themeClasses.hover} rounded-lg transition-colors disabled:opacity-50`}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          
          <button
            onClick={exportToPDF}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Advanced Reports Navigation */}
      <div className={`grid grid-cols-1 md:grid-cols-${businessType === 'legal' ? '3' : '2'} gap-4 mb-8`}>
        <button
          onClick={() => navigate('/reports/advanced')}
          className={`${themeClasses.cardBackground} rounded-lg shadow-sm border ${themeClasses.border} p-6 text-left hover:shadow-md transition-all group`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-semibold ${themeClasses.text} mb-2`}>
                Advanced Reports
              </h3>
              <p className={`text-sm ${themeClasses.textSecondary}`}>
                Sales by customer/product, expenses by vendor/category
              </p>
            </div>
            <ArrowRight className={`w-5 h-5 ${themeClasses.textSecondary} group-hover:${themeClasses.text.replace(/\s+/g, '')} transition-colors`} />
          </div>
        </button>

        <button
          onClick={() => navigate('/reports/ai-insights')}
          className={`${themeClasses.cardBackground} rounded-lg shadow-sm border ${themeClasses.border} p-6 text-left hover:shadow-md transition-all group`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-semibold ${themeClasses.text} mb-2 flex items-center`}>
                <Brain className="w-5 h-5 mr-2 text-purple-600" />
                AI Insights
              </h3>
              <p className={`text-sm ${themeClasses.textSecondary}`}>
                AI-powered forecasting, anomaly detection, and insights
              </p>
            </div>
            <ArrowRight className={`w-5 h-5 ${themeClasses.textSecondary} group-hover:${themeClasses.text.replace(/\s+/g, '')} transition-colors`} />
          </div>
        </button>

        {businessType === 'legal' && (
          <button
            onClick={() => navigate('/reports/legal')}
            className={`${themeClasses.cardBackground} rounded-lg shadow-sm border ${themeClasses.border} p-6 text-left hover:shadow-md transition-all group`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-semibold ${themeClasses.text} mb-2 flex items-center`}>
                  <Scale className="w-5 h-5 mr-2 text-purple-600" />
                  Legal Reports
                </h3>
                <p className={`text-sm ${themeClasses.textSecondary}`}>
                  Client and file-level financial summaries
                </p>
              </div>
              <ArrowRight className={`w-5 h-5 ${themeClasses.textSecondary} group-hover:${themeClasses.text.replace(/\s+/g, '')} transition-colors`} />
            </div>
          </button>
        )}
      </div>

      {/* Date Range Selector */}
      <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm border ${themeClasses.border} p-6 mb-8`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-semibold ${themeClasses.text} flex items-center`}>
            <Calendar className="w-5 h-5 mr-2" />
            Report Period
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${themeClasses.cardBackground}`}
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
              End Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${themeClasses.cardBackground}`}
            />
          </div>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex space-x-1 mb-8">
        {reportTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedReport(tab.id as 'profit-loss' | 'balance-sheet' | 'trial-balance')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                selectedReport === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : `${themeClasses.cardBackground} ${themeClasses.text} ${themeClasses.hover} border ${themeClasses.border}`
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Report Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className={themeClasses.textSecondary}>Generating report...</p>
          </div>
        </div>
      ) : (
        <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm border ${themeClasses.border} p-8`}>
          {/* Profit & Loss Statement */}
          {selectedReport === 'profit-loss' && (
            <div>
              <div className="text-center mb-8">
                <h2 className={`text-2xl font-bold ${themeClasses.text} mb-2`}>
                  Profit & Loss Statement
                </h2>
                <p className={`${themeClasses.textSecondary}`}>
                  {formatDate(dateRange.startDate)} to {formatDate(dateRange.endDate)}
                </p>
              </div>

              <div className="space-y-8">
                {/* Revenue Section */}
                <div>
                  <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4 pb-2 border-b ${themeClasses.border}`}>
                    REVENUE
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(reportData.profitLoss.revenue).map(([category, amount]) => (
                      <div key={category} className="flex justify-between">
                        <span className={themeClasses.textSecondary}>{category}</span>
                        <span className={`font-medium ${themeClasses.text}`}>{formatCurrency(amount)}</span>
                      </div>
                    ))}
                    <div className={`flex justify-between pt-2 border-t ${themeClasses.border} font-bold`}>
                      <span className={themeClasses.text}>Total Revenue</span>
                      <span className="text-green-600">{formatCurrency(reportData.profitLoss.totalRevenue)}</span>
                    </div>
                  </div>
                </div>

                {/* Expenses Section */}
                <div>
                  <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4 pb-2 border-b ${themeClasses.border}`}>
                    EXPENSES
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(reportData.profitLoss.expenses).map(([category, amount]) => (
                      <div key={category} className="flex justify-between">
                        <span className={themeClasses.textSecondary}>{category}</span>
                        <span className={`font-medium ${themeClasses.text}`}>{formatCurrency(amount)}</span>
                      </div>
                    ))}
                    <div className={`flex justify-between pt-2 border-t ${themeClasses.border} font-bold`}>
                      <span className={themeClasses.text}>Total Expenses</span>
                      <span className="text-red-600">{formatCurrency(reportData.profitLoss.totalExpenses)}</span>
                    </div>
                  </div>
                </div>

                {/* Net Income */}
                <div className={`pt-4 border-t-2 ${themeClasses.border}`}>
                  <div className="flex justify-between text-xl font-bold">
                    <span className={themeClasses.text}>NET INCOME</span>
                    <span className={reportData.profitLoss.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(reportData.profitLoss.netIncome)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Balance Sheet */}
          {selectedReport === 'balance-sheet' && (
            <div>
              <div className="text-center mb-8">
                <h2 className={`text-2xl font-bold ${themeClasses.text} mb-2`}>
                  Balance Sheet
                </h2>
                <p className={`${themeClasses.textSecondary}`}>
                  As of {formatDate(dateRange.endDate)}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Assets */}
                <div>
                  <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4 pb-2 border-b ${themeClasses.border}`}>
                    ASSETS
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className={`font-medium ${themeClasses.text} mb-2`}>Current Assets</h4>
                      <div className="space-y-2 ml-4">
                        {Object.entries(reportData.balanceSheet.assets.currentAssets).map(([account, amount]) => (
                          <div key={account} className="flex justify-between">
                            <span className={themeClasses.textSecondary}>{account}</span>
                            <span className={`font-medium ${themeClasses.text}`}>{formatCurrency(amount)}</span>
                          </div>
                        ))}
                        <div className={`flex justify-between pt-2 border-t ${themeClasses.border} font-bold`}>
                          <span className={themeClasses.text}>Total Current Assets</span>
                          <span className={themeClasses.text}>{formatCurrency(reportData.balanceSheet.assets.totalCurrentAssets)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Liabilities & Equity */}
                <div>
                  <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4 pb-2 border-b ${themeClasses.border}`}>
                    LIABILITIES & EQUITY
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className={`font-medium ${themeClasses.text} mb-2`}>Current Liabilities</h4>
                      <div className="space-y-2 ml-4">
                        {Object.entries(reportData.balanceSheet.liabilities.currentLiabilities).map(([account, amount]) => (
                          <div key={account} className="flex justify-between">
                            <span className={themeClasses.textSecondary}>{account}</span>
                            <span className={`font-medium ${themeClasses.text}`}>{formatCurrency(amount)}</span>
                          </div>
                        ))}
                        <div className={`flex justify-between pt-2 border-t ${themeClasses.border} font-bold`}>
                          <span className={themeClasses.text}>Total Current Liabilities</span>
                          <span className={themeClasses.text}>{formatCurrency(reportData.balanceSheet.liabilities.totalCurrentLiabilities)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className={`font-medium ${themeClasses.text} mb-2`}>Equity</h4>
                      <div className="space-y-2 ml-4">
                        <div className="flex justify-between">
                          <span className={themeClasses.textSecondary}>Retained Earnings</span>
                          <span className={`font-medium ${themeClasses.text}`}>{formatCurrency(reportData.balanceSheet.equity.retainedEarnings)}</span>
                        </div>
                        <div className={`flex justify-between pt-2 border-t ${themeClasses.border} font-bold`}>
                          <span className={themeClasses.text}>Total Equity</span>
                          <span className={themeClasses.text}>{formatCurrency(reportData.balanceSheet.equity.totalEquity)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Balance Check */}
              <div className={`mt-8 pt-4 border-t-2 ${themeClasses.border}`}>
                <div className="flex justify-between text-lg font-bold">
                  <span className={themeClasses.text}>TOTAL ASSETS</span>
                  <span className={themeClasses.text}>{formatCurrency(reportData.balanceSheet.assets.totalCurrentAssets)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold mt-2">
                  <span className={themeClasses.text}>TOTAL LIABILITIES & EQUITY</span>
                  <span className={themeClasses.text}>
                    {formatCurrency(reportData.balanceSheet.liabilities.totalCurrentLiabilities + reportData.balanceSheet.equity.totalEquity)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Trial Balance */}
          {selectedReport === 'trial-balance' && (
            <div>
              <div className="text-center mb-8">
                <h2 className={`text-2xl font-bold ${themeClasses.text} mb-2`}>
                  Trial Balance
                </h2>
                <p className={`${themeClasses.textSecondary}`}>
                  As of {formatDate(dateRange.endDate)}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                        Account
                      </th>
                      <th className={`px-6 py-3 text-right text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                        Debit
                      </th>
                      <th className={`px-6 py-3 text-right text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                        Credit
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {reportData.trialBalance.accounts.map((account, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${themeClasses.text}`}>
                          {account.account}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${themeClasses.text}`}>
                          {account.debit > 0 ? formatCurrency(account.debit) : '-'}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${themeClasses.text}`}>
                          {account.credit > 0 ? formatCurrency(account.credit) : '-'}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 dark:bg-gray-800 font-bold">
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${themeClasses.text}`}>
                        TOTALS
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${themeClasses.text}`}>
                        {formatCurrency(reportData.trialBalance.totalDebits)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${themeClasses.text}`}>
                        {formatCurrency(reportData.trialBalance.totalCredits)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Balance Check */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${themeClasses.text}`}>Balance Check:</span>
                  <span className={`font-bold ${
                    Math.abs(reportData.trialBalance.totalDebits - reportData.trialBalance.totalCredits) < 0.01 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {Math.abs(reportData.trialBalance.totalDebits - reportData.trialBalance.totalCredits) < 0.01 
                      ? 'Balanced ✓' 
                      : `Out of Balance by ${formatCurrency(Math.abs(reportData.trialBalance.totalDebits - reportData.trialBalance.totalCredits))}`
                    }
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}