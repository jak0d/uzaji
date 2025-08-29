import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, BarChart3, Plus, Package, Settings, Wifi, WifiOff, LogOut, User as UserIcon, Calendar, Filter, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTransactionsByDateRange, getSetting } from '../utils/database';
import { syncService } from '../utils/sync';
import { UzajiLogo } from './UzajiLogo';
import { useSettings } from '../hooks/useSettings';
import { useTranslation } from '../hooks/useTranslation';
import type { Transaction } from '../utils/database';
import type { User } from '../hooks/useAuth';

interface DashboardStats {
  revenue: number;
  expenses: number;
  netProfit: number;
  transactionCount: number;
}

interface DashboardProps {
  user: User | null;
  onLogout: () => void;
}

interface ImportInfo {
  date: string;
  originalExportDate: string;
  stats: {
    transactions: number;
    products: number;
    services: number;
    duplicatesSkipped: number;
    errors: number;
  };
}

export function Dashboard({ user, onLogout }: DashboardProps) {
  const { settings, formatCurrency, formatDate, getThemeClasses } = useSettings();
  const { t } = useTranslation(settings.language);
  const themeClasses = getThemeClasses();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<DashboardStats>({
    revenue: 0,
    expenses: 0,
    netProfit: 0,
    transactionCount: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueueSize, setSyncQueueSize] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [lastImport, setLastImport] = useState<ImportInfo | null>(null);
  const [dataSource, setDataSource] = useState<'today' | 'range' | 'imported'>('today');
  const [onlineBackupEnabled, setOnlineBackupEnabled] = useState(false);

  useEffect(() => {
    loadData();
    loadImportInfo();
    loadBackupSettings();
    
    // Update online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Update sync queue size
    const updateSyncQueue = () => setSyncQueueSize(syncService.getQueueSize());
    const interval = setInterval(updateSyncQueue, 1000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    loadData();
  }, [dateRange, dataSource]);

  const loadBackupSettings = async () => {
    try {
      const backupEnabled = await getSetting('online-backup-enabled');
      setOnlineBackupEnabled(backupEnabled || false);
    } catch (error) {
      console.error('Failed to load backup settings:', error);
    }
  };

  const loadImportInfo = async () => {
    try {
      const importInfo = await getSetting('last-import');
      if (importInfo) {
        setLastImport(importInfo);
      }
    } catch (error) {
      console.error('Failed to load import info:', error);
    }
  };

  const loadData = async () => {
    try {
      let startDate: string;
      let endDate: string;

      if (dataSource === 'today') {
        const today = new Date().toISOString().split('T')[0];
        startDate = today;
        endDate = today;
      } else if (dataSource === 'imported' && lastImport) {
        // Show data from the import date
        const importDate = new Date(lastImport.date).toISOString().split('T')[0];
        startDate = importDate;
        endDate = importDate;
      } else {
        startDate = dateRange.startDate;
        endDate = dateRange.endDate;
      }

      const transactions = await getTransactionsByDateRange(startDate, endDate);
      
      // Filter imported transactions if viewing imported data
      const filteredTransactions = dataSource === 'imported' 
        ? transactions.filter(t => t.description.includes('(Imported)'))
        : transactions;
      
      const revenue = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      setStats({
        revenue,
        expenses,
        netProfit: revenue - expenses,
        transactionCount: filteredTransactions.length,
      });
      
      setRecentTransactions(filteredTransactions.slice(-5));
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const getDateRangeLabel = () => {
    if (dataSource === 'today') {
      return t('dashboard.todayPerformance');
    } else if (dataSource === 'imported' && lastImport) {
      return `${t('dashboard.importedData')} (${formatDate(lastImport.date)})`;
    } else {
      const start = formatDate(dateRange.startDate);
      const end = formatDate(dateRange.endDate);
      return start === end ? `${t('dashboard.performanceFor')} ${start}` : `${t('dashboard.performance')}: ${start} - ${end}`;
    }
  };

  const getTransactionListTitle = () => {
    if (dataSource === 'today') {
      return t('dashboard.todayTransactions');
    } else if (dataSource === 'imported' && lastImport) {
      return t('dashboard.importedTransactions');
    } else {
      return t('dashboard.recentTransactions');
    }
  };

  const containerClass = settings.compactView ? 'py-4' : 'py-8';
  const cardPadding = settings.compactView ? 'p-4' : 'p-6';
  const spacing = settings.compactView ? 'space-y-4' : 'space-y-6';

  return (
    <div className={`min-h-screen ${themeClasses.background}`} dir={themeClasses.direction}>
      {/* Header */}
      <header className={`${themeClasses.cardBackground} shadow-sm ${themeClasses.border} border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <UzajiLogo size="md" className={themeClasses.marginEnd} />
              <div className={`${themeClasses.marginStart} flex items-center space-x-2`}>
                {isOnline ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm ${themeClasses.textSecondary}`}>
                  {isOnline ? t('common.online') : t('common.offline')}
                </span>
                {syncQueueSize > 0 && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    {syncQueueSize} pending sync
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/settings')}
                className={`p-2 ${themeClasses.textSecondary} hover:${themeClasses.text} ${themeClasses.hover} rounded-lg transition-colors`}
              >
                <Settings className="w-5 h-5" />
              </button>
              
              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`flex items-center space-x-2 p-2 ${themeClasses.text} ${themeClasses.hover} rounded-lg transition-colors`}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">{user?.name}</span>
                </button>
                
                {showUserMenu && (
                  <div className={`absolute ${themeClasses.direction === 'rtl' ? 'left-0' : 'right-0'} mt-2 w-48 ${themeClasses.cardBackground} rounded-lg shadow-lg ${themeClasses.border} border py-1 z-50`}>
                    <div className={`px-4 py-2 border-b ${themeClasses.border}`}>
                      <p className={`text-sm font-medium ${themeClasses.text}`}>{user?.name}</p>
                      <p className={`text-xs ${themeClasses.textSecondary}`}>{user?.email}</p>
                    </div>
                    <button
                      onClick={onLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t('auth.signOut')}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${containerClass}`}>
        {/* Welcome Message */}
        <div className={settings.compactView ? 'mb-4' : 'mb-8'}>
          <h2 className={`text-2xl font-bold ${themeClasses.text} ${themeClasses.textAlign}`}>
            {t('dashboard.welcome')}, {user?.name?.split(' ')[0]}! 👋
          </h2>
          <p className={`${themeClasses.textSecondary} mt-1 ${themeClasses.textAlign}`}>{t('dashboard.subtitle')}</p>
          
          {/* Data Storage Notice */}
          <div className={`mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start space-x-3`}>
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className={`${themeClasses.text} font-medium`}>{t('dashboard.dataSecure')}</p>
              <p className={`${themeClasses.textSecondary} mt-1`}>
                {t('dashboard.dataStorageNotice')}
                <button 
                  onClick={() => navigate('/settings')}
                  className="text-blue-600 hover:text-blue-700 underline ml-1"
                >
                  {t('dashboard.exportSettings')}
                </button>
                {' '}{t('dashboard.createBackups')}{onlineBackupEnabled ? t('dashboard.orOnlineBackup') : ''}.
                {!onlineBackupEnabled && (
                  <>
                    {' '}{t('dashboard.youCanAlso')}{' '}
                    <button 
                      onClick={() => navigate('/settings')}
                      className="text-blue-600 hover:text-blue-700 underline"
                    >
                      {t('dashboard.enableOnlineBackup')}
                    </button>
                    {' '}{t('dashboard.automaticCloud')}.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Data Source Selector */}
        <div className={settings.compactView ? 'mb-4' : 'mb-6'}>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex space-x-1">
              <button
                onClick={() => setDataSource('today')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  dataSource === 'today'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : `${themeClasses.cardBackground} ${themeClasses.text} ${themeClasses.hover} ${themeClasses.border} border`
                }`}
              >
                {t('time.today')}
              </button>
              <button
                onClick={() => {
                  setDataSource('range');
                  setShowDateFilter(true);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  dataSource === 'range'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : `${themeClasses.cardBackground} ${themeClasses.text} ${themeClasses.hover} ${themeClasses.border} border`
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                {t('dashboard.dateRange')}
              </button>
              {lastImport && (
                <button
                  onClick={() => setDataSource('imported')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    dataSource === 'imported'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : `${themeClasses.cardBackground} ${themeClasses.text} ${themeClasses.hover} ${themeClasses.border} border`
                  }`}
                >
                  <Filter className="w-4 h-4 inline mr-2" />
                  {t('dashboard.importedData')}
                </button>
              )}
            </div>

            {lastImport && (
              <div className={`text-sm ${themeClasses.textSecondary} bg-blue-50 px-3 py-2 rounded-lg border border-blue-200`}>
                <span className="font-medium">{t('dashboard.lastImport')}:</span> {formatDate(lastImport.date)} 
                <span className="ml-2">({lastImport.stats.transactions + lastImport.stats.products + lastImport.stats.services} {t('dashboard.items')})</span>
              </div>
            )}
          </div>

          {/* Date Range Picker */}
          {showDateFilter && dataSource === 'range' && (
            <div className={`mt-4 p-4 ${themeClasses.cardBackground} rounded-lg ${themeClasses.border} border shadow-sm`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                    {t('dashboard.startDate')}
                  </label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className={`w-full px-4 py-2 ${themeClasses.border} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.cardBackground} ${themeClasses.text}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                    {t('dashboard.endDate')}
                  </label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className={`w-full px-4 py-2 ${themeClasses.border} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.cardBackground} ${themeClasses.text}`}
                  />
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => setShowDateFilter(false)}
                  className={`px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors`}
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Performance Section */}
        <div className={settings.compactView ? 'mb-4' : 'mb-8'}>
          <h3 className={`text-xl font-semibold ${themeClasses.text} ${settings.compactView ? 'mb-2' : 'mb-4'} ${themeClasses.textAlign}`}>{getDateRangeLabel()}</h3>
          <div className={`grid grid-cols-1 md:grid-cols-3 ${settings.compactView ? 'gap-4' : 'gap-6'}`}>
            <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm ${cardPadding} ${themeClasses.border} border`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${themeClasses.textSecondary}`}>{t('dashboard.revenue')}</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(stats.revenue)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm ${cardPadding} ${themeClasses.border} border`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${themeClasses.textSecondary}`}>{t('dashboard.expenses')}</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(stats.expenses)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm ${cardPadding} ${themeClasses.border} border`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${themeClasses.textSecondary}`}>{t('dashboard.netProfit')}</p>
                  <p className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(stats.netProfit)}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  stats.netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <DollarSign className={`w-6 h-6 ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={settings.compactView ? 'mb-4' : 'mb-8'}>
          <h3 className={`text-xl font-semibold ${themeClasses.text} ${settings.compactView ? 'mb-2' : 'mb-4'} ${themeClasses.textAlign}`}>{t('dashboard.quickActions')}</h3>
          <div className={`grid grid-cols-1 md:grid-cols-3 ${settings.compactView ? 'gap-3' : 'gap-4'}`}>
            <button
              onClick={() => navigate('/transactions')}
              className={`bg-gradient-to-r from-blue-600 to-indigo-600 text-white ${settings.compactView ? 'p-4' : 'p-6'} rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1`}
            >
              <Plus className="w-6 h-6" />
              <span className="font-medium">{t('dashboard.recordTransaction')}</span>
            </button>
            
            <button
              onClick={() => navigate('/products')}
              className={`bg-gradient-to-r from-green-600 to-emerald-600 text-white ${settings.compactView ? 'p-4' : 'p-6'} rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1`}
            >
              <Package className="w-6 h-6" />
              <span className="font-medium">{t('nav.products')}</span>
            </button>
            
            <button
              onClick={() => navigate('/reports')}
              className={`bg-gradient-to-r from-purple-600 to-pink-600 text-white ${settings.compactView ? 'p-4' : 'p-6'} rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1`}
            >
              <BarChart3 className="w-6 h-6" />
              <span className="font-medium">{t('nav.reports')}</span>
            </button>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm ${themeClasses.border} border`}>
          <div className={`${cardPadding} border-b ${themeClasses.border}`}>
            <h3 className={`text-lg font-semibold ${themeClasses.text} ${themeClasses.textAlign}`}>{getTransactionListTitle()}</h3>
            {dataSource === 'imported' && (
              <p className={`text-sm ${themeClasses.textSecondary} mt-1 ${themeClasses.textAlign}`}>
                {t('dashboard.showingImported')} {lastImport && formatDate(lastImport.date)}
              </p>
            )}
          </div>
          <div className={cardPadding}>
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8">
                <p className={`${themeClasses.textSecondary}`}>
                  {dataSource === 'imported' 
                    ? t('dashboard.noImportedTransactions')
                    : dataSource === 'today' 
                    ? t('dashboard.noTransactions')
                    : t('dashboard.noTransactionsFound')
                  }
                </p>
                {dataSource !== 'imported' && (
                  <button
                    onClick={() => navigate('/transactions')}
                    className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    {t('dashboard.recordFirstTransaction')}
                  </button>
                )}
              </div>
            ) : (
              <div className={spacing}>
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className={`flex items-center justify-between ${settings.compactView ? 'p-3' : 'p-4'} bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors`}>
                    <div className={themeClasses.textAlign}>
                      <p className={`font-medium ${themeClasses.text}`}>{transaction.description}</p>
                      <p className={`text-sm ${themeClasses.textSecondary}`}>{transaction.category}</p>
                    </div>
                    <div className={`${themeClasses.textAlign === 'text-right' ? 'text-left' : 'text-right'}`}>
                      <p className={`font-bold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </p>
                      <p className={`text-sm ${themeClasses.textSecondary}`}>{formatDate(transaction.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        ></div>
      )}
    </div>
  );
}