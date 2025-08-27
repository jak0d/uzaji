import React, { useState, useEffect } from 'react';
import {
  Download,
  FileText,
  Users,
  DollarSign,
  Calendar,
  RefreshCw,
  Eye,
  Filter,
  Search,
  Building,
  Scale,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useSettings } from '../hooks/useSettings';

interface ClientFinancialSummary {
  clientId: string;
  clientName: string;
  totalFeesCharged: number;
  totalFeesPaid: number;
  totalExpenses: number;
  totalDeposits: number;
  outstandingBalance: number;
  fundsHeld: number;
  netPosition: number;
  activeFiles: number;
  lastActivity: string;
}

interface FileFinancialSummary {
  fileId: string;
  fileName: string;
  clientName: string;
  dateOpened: string;
  status: 'active' | 'closed' | 'pending';
  feesToBePaid: number;
  depositPaid: number;
  totalExpenses: number;
  totalExtraFees: number;
  totalFeesCharged: number;
  totalPaid: number;
  balanceRemaining: number;
  netSummary: number;
  transactions: FileTransaction[];
}

interface FileTransaction {
  id: string;
  date: string;
  type: 'fee' | 'deposit' | 'expense' | 'payment';
  description: string;
  amount: number;
  isReimbursable?: boolean;
}

interface LegalReportsProps {
  className?: string;
}

export function LegalReports({ className = '' }: LegalReportsProps) {
  const { formatCurrency, formatDate, getThemeClasses } = useSettings();
  const themeClasses = getThemeClasses();

  const [selectedView, setSelectedView] = useState<'client-summary' | 'file-summary'>('client-summary');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  
  const [clientSummaries, setClientSummaries] = useState<ClientFinancialSummary[]>([]);
  const [fileSummaries, setFileSummaries] = useState<FileFinancialSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadLegalReportData();
  }, [dateRange]);

  const loadLegalReportData = async () => {
    setIsLoading(true);
    try {
      // Mock data for demonstration
      const mockClientSummaries: ClientFinancialSummary[] = [
        {
          clientId: '1',
          clientName: 'John Smith',
          totalFeesCharged: 15000,
          totalFeesPaid: 12000,
          totalExpenses: 2500,
          totalDeposits: 5000,
          outstandingBalance: 3000,
          fundsHeld: 2500,
          netPosition: 500,
          activeFiles: 2,
          lastActivity: '2024-01-15'
        },
        {
          clientId: '2',
          clientName: 'ABC Corporation',
          totalFeesCharged: 25000,
          totalFeesPaid: 25000,
          totalExpenses: 3500,
          totalDeposits: 10000,
          outstandingBalance: 0,
          fundsHeld: 6500,
          netPosition: 6500,
          activeFiles: 1,
          lastActivity: '2024-01-20'
        }
      ];

      const mockFileSummaries: FileFinancialSummary[] = [
        {
          fileId: '1',
          fileName: 'Smith v. Johnson - Personal Injury',
          clientName: 'John Smith',
          dateOpened: '2023-12-01',
          status: 'active',
          feesToBePaid: 10000,
          depositPaid: 3000,
          totalExpenses: 1500,
          totalExtraFees: 500,
          totalFeesCharged: 10500,
          totalPaid: 8000,
          balanceRemaining: 2500,
          netSummary: 1000,
          transactions: [
            {
              id: '1',
              date: '2023-12-01',
              type: 'deposit',
              description: 'Initial retainer deposit',
              amount: 3000
            },
            {
              id: '2',
              date: '2023-12-15',
              type: 'fee',
              description: 'Legal research and case preparation',
              amount: 2500
            },
            {
              id: '3',
              date: '2024-01-05',
              type: 'expense',
              description: 'Court filing fees',
              amount: 350,
              isReimbursable: true
            },
            {
              id: '4',
              date: '2024-01-10',
              type: 'payment',
              description: 'Client payment',
              amount: 5000
            }
          ]
        },
        {
          fileId: '2',
          fileName: 'ABC Corp - Contract Review',
          clientName: 'ABC Corporation',
          dateOpened: '2024-01-01',
          status: 'closed',
          feesToBePaid: 15000,
          depositPaid: 7000,
          totalExpenses: 500,
          totalExtraFees: 0,
          totalFeesCharged: 15000,
          totalPaid: 15000,
          balanceRemaining: 0,
          netSummary: 7500,
          transactions: [
            {
              id: '5',
              date: '2024-01-01',
              type: 'deposit',
              description: 'Contract review retainer',
              amount: 7000
            },
            {
              id: '6',
              date: '2024-01-15',
              type: 'fee',
              description: 'Contract analysis and review',
              amount: 15000
            },
            {
              id: '7',
              date: '2024-01-20',
              type: 'payment',
              description: 'Final payment',
              amount: 8000
            }
          ]
        }
      ];

      setClientSummaries(mockClientSummaries);
      setFileSummaries(mockFileSummaries);
    } catch (error) {
      console.error('Failed to load legal report data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportClientReport = (client: ClientFinancialSummary) => {
    const csvContent = `Client Financial Summary Report
Generated: ${new Date().toLocaleDateString()}
Period: ${formatDate(dateRange.startDate)} to ${formatDate(dateRange.endDate)}

Client Name,${client.clientName}
Client ID,${client.clientId}

FINANCIAL SUMMARY
Total Fees Charged,${client.totalFeesCharged}
Total Fees Paid,${client.totalFeesPaid}
Total Expenses,${client.totalExpenses}
Total Deposits,${client.totalDeposits}
Outstanding Balance,${client.outstandingBalance}
Funds Held,${client.fundsHeld}
Net Position,${client.netPosition}
Active Files,${client.activeFiles}
Last Activity,${formatDate(client.lastActivity)}`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `client-summary-${client.clientName.replace(/\s+/g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportFileReport = (file: FileFinancialSummary) => {
    let csvContent = `File Financial Summary Report
Generated: ${new Date().toLocaleDateString()}
Period: ${formatDate(dateRange.startDate)} to ${formatDate(dateRange.endDate)}

File Name,${file.fileName}
Client Name,${file.clientName}
Date Opened,${formatDate(file.dateOpened)}
Status,${file.status}

FINANCIAL SUMMARY
Fees to be Paid,${file.feesToBePaid}
Deposit Paid,${file.depositPaid}
Total Expenses,${file.totalExpenses}
Total Extra Fees,${file.totalExtraFees}
Total Fees Charged,${file.totalFeesCharged}
Total Paid,${file.totalPaid}
Balance Remaining,${file.balanceRemaining}
Net Summary,${file.netSummary}

TRANSACTION DETAILS
Date,Type,Description,Amount,Reimbursable
`;

    file.transactions.forEach(transaction => {
      csvContent += `${formatDate(transaction.date)},${transaction.type},${transaction.description},${transaction.amount},${transaction.isReimbursable || 'N/A'}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `file-summary-${file.fileName.replace(/[^a-zA-Z0-9]/g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredClientSummaries = clientSummaries.filter(client =>
    client.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFileSummaries = fileSummaries.filter(file =>
    file.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabs = [
    { id: 'client-summary', label: 'Client Summary', icon: Users },
    { id: 'file-summary', label: 'File Summary', icon: FileText }
  ];

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-2xl font-bold ${themeClasses.text} flex items-center`}>
            <Scale className="w-7 h-7 mr-3 text-purple-600" />
            Legal Practice Reports
          </h1>
          <p className={`${themeClasses.textSecondary} mt-1`}>
            Client and file-level financial summaries for legal practice management
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={loadLegalReportData}
            disabled={isLoading}
            className={`flex items-center space-x-2 px-4 py-2 ${themeClasses.textSecondary} hover:${themeClasses.text} ${themeClasses.hover} rounded-lg transition-colors disabled:opacity-50`}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm border ${themeClasses.border} p-6 mb-8`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-semibold ${themeClasses.text} flex items-center`}>
            <Calendar className="w-5 h-5 mr-2" />
            Report Period
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          <div>
            <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
              Search
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${themeClasses.cardBackground}`}
                placeholder="Search clients or files..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex space-x-1 mb-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedView(tab.id as any)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                selectedView === tab.id
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

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className={themeClasses.textSecondary}>Loading legal reports...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Client Summary View */}
          {selectedView === 'client-summary' && (
            <div className="space-y-6">
              {filteredClientSummaries.length === 0 ? (
                <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm border ${themeClasses.border} p-8 text-center`}>
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className={`text-lg font-medium ${themeClasses.text} mb-2`}>
                    No client data found
                  </h3>
                  <p className={themeClasses.textSecondary}>
                    No clients match your search criteria for the selected period.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredClientSummaries.map((client) => (
                    <div
                      key={client.clientId}
                      className={`${themeClasses.cardBackground} rounded-lg shadow-sm border ${themeClasses.border} p-6`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className={`text-lg font-semibold ${themeClasses.text}`}>
                            {client.clientName}
                          </h3>
                          <p className={`text-sm ${themeClasses.textSecondary}`}>
                            {client.activeFiles} active file{client.activeFiles !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <button
                          onClick={() => exportClientReport(client)}
                          className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                        >
                          <Download className="w-4 h-4" />
                          <span>Export</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-xs text-green-600 font-medium">Fees Charged</p>
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(client.totalFeesCharged)}
                          </p>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-xs text-blue-600 font-medium">Fees Paid</p>
                          <p className="text-lg font-bold text-blue-600">
                            {formatCurrency(client.totalFeesPaid)}
                          </p>
                        </div>
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                          <p className="text-xs text-yellow-600 font-medium">Outstanding</p>
                          <p className="text-lg font-bold text-yellow-600">
                            {formatCurrency(client.outstandingBalance)}
                          </p>
                        </div>
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <p className="text-xs text-purple-600 font-medium">Funds Held</p>
                          <p className="text-lg font-bold text-purple-600">
                            {formatCurrency(client.fundsHeld)}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className={themeClasses.textSecondary}>Total Expenses:</span>
                          <span className={`font-medium ${themeClasses.text}`}>
                            {formatCurrency(client.totalExpenses)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={themeClasses.textSecondary}>Total Deposits:</span>
                          <span className={`font-medium ${themeClasses.text}`}>
                            {formatCurrency(client.totalDeposits)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                          <span className={`font-medium ${themeClasses.text}`}>Net Position:</span>
                          <span className={`font-bold ${
                            client.netPosition >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(client.netPosition)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className={themeClasses.textSecondary}>Last Activity:</span>
                          <span className={themeClasses.textSecondary}>
                            {formatDate(client.lastActivity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* File Summary View */}
          {selectedView === 'file-summary' && (
            <div className="space-y-6">
              {filteredFileSummaries.length === 0 ? (
                <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm border ${themeClasses.border} p-8 text-center`}>
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className={`text-lg font-medium ${themeClasses.text} mb-2`}>
                    No file data found
                  </h3>
                  <p className={themeClasses.textSecondary}>
                    No files match your search criteria for the selected period.
                  </p>
                </div>
              ) : (
                filteredFileSummaries.map((file) => (
                  <div
                    key={file.fileId}
                    className={`${themeClasses.cardBackground} rounded-lg shadow-sm border ${themeClasses.border} p-6`}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className={`text-lg font-semibold ${themeClasses.text}`}>
                          {file.fileName}
                        </h3>
                        <p className={`text-sm ${themeClasses.textSecondary}`}>
                          Client: {file.clientName} • Opened: {formatDate(file.dateOpened)}
                        </p>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mt-2 ${
                          file.status === 'active' ? 'bg-green-100 text-green-600' :
                          file.status === 'closed' ? 'bg-gray-100 text-gray-600' :
                          'bg-yellow-100 text-yellow-600'
                        }`}>
                          {file.status}
                        </span>
                      </div>
                      <button
                        onClick={() => exportFileReport(file)}
                        className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                      </button>
                    </div>

                    {/* Financial Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-xs text-blue-600 font-medium">Fees Charged</p>
                        <p className="text-lg font-bold text-blue-600">
                          {formatCurrency(file.totalFeesCharged)}
                        </p>
                      </div>
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-xs text-green-600 font-medium">Total Paid</p>
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(file.totalPaid)}
                        </p>
                      </div>
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <p className="text-xs text-yellow-600 font-medium">Balance Due</p>
                        <p className="text-lg font-bold text-yellow-600">
                          {formatCurrency(file.balanceRemaining)}
                        </p>
                      </div>
                      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <p className="text-xs text-purple-600 font-medium">Net Summary</p>
                        <p className={`text-lg font-bold ${
                          file.netSummary >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(file.netSummary)}
                        </p>
                      </div>
                    </div>

                    {/* Transaction Details */}
                    <div>
                      <h4 className={`text-md font-semibold ${themeClasses.text} mb-4`}>
                        Transaction History
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                              <th className={`px-4 py-2 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                                Date
                              </th>
                              <th className={`px-4 py-2 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                                Type
                              </th>
                              <th className={`px-4 py-2 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                                Description
                              </th>
                              <th className={`px-4 py-2 text-right text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                                Amount
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {file.transactions.map((transaction) => (
                              <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td className={`px-4 py-2 whitespace-nowrap text-sm ${themeClasses.text}`}>
                                  {formatDate(transaction.date)}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${
                                    transaction.type === 'fee' ? 'bg-blue-100 text-blue-600' :
                                    transaction.type === 'deposit' ? 'bg-green-100 text-green-600' :
                                    transaction.type === 'expense' ? 'bg-red-100 text-red-600' :
                                    'bg-purple-100 text-purple-600'
                                  }`}>
                                    {transaction.type}
                                  </span>
                                </td>
                                <td className={`px-4 py-2 text-sm ${themeClasses.text}`}>
                                  {transaction.description}
                                  {transaction.isReimbursable && (
                                    <span className="ml-2 px-1 py-0.5 text-xs bg-orange-100 text-orange-600 rounded">
                                      Reimbursable
                                    </span>
                                  )}
                                </td>
                                <td className={`px-4 py-2 whitespace-nowrap text-sm text-right font-medium ${
                                  transaction.type === 'deposit' || transaction.type === 'payment' ? 'text-green-600' :
                                  transaction.type === 'expense' ? 'text-red-600' :
                                  themeClasses.text
                                }`}>
                                  {formatCurrency(transaction.amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}