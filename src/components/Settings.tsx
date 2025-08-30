import React, { useState, useEffect } from 'react';
import { ArrowLeft, User as UserIcon, Shield, Download, Upload, Trash2, Search, ChevronDown, Globe, Palette, DollarSign, Eye, Monitor, Sun, Moon, Check, Cloud, Database, Wifi, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UzajiLogo } from './UzajiLogo';
import { useSettings } from '../hooks/useSettings';
import { useTranslation } from '../hooks/useTranslation';
import { worldCurrencies, currencyRegions, formatCurrencyAmount } from '../utils/currencies';
import { worldLanguages, languageRegions, getLanguageByCode } from '../utils/languages';
import { getTransactions, getProducts, getServices, setSetting, getSetting } from '../utils/database';
import { encryption } from '../utils/encryption';
import { syncService } from '../utils/sync';
import { supabaseHelpers } from '../utils/supabase';
import type { User } from '../hooks/useAuth';

interface SettingsProps {
  user: User | null;
  onLogout: () => void;
}

export function Settings({ user, onLogout }: SettingsProps) {
  const { settings, updateSettings, formatCurrency, getThemeClasses } = useSettings();
  const { t } = useTranslation(settings.language);
  const themeClasses = getThemeClasses();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'preferences' | 'account' | 'security' | 'data'>('preferences');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');
  const [languageSearch, setLanguageSearch] = useState('');
  const [exportSuccess, setExportSuccess] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [clearDataSuccess, setClearDataSuccess] = useState(false);
  const [onlineBackupEnabled, setOnlineBackupEnabled] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [supabaseConfigStatus, setSupabaseConfigStatus] = useState<any>(null);

  useEffect(() => {
    loadBackupSettings();
    checkSupabaseStatus();
  }, []);

  const checkSupabaseStatus = async () => {
    const configured = supabaseHelpers.isConfigured();
    const configStatus = supabaseHelpers.getConfigStatus();
    setSupabaseConfigured(configured);
    setSupabaseConfigStatus(configStatus);
    
    if (configured) {
      try {
        const user = await supabaseHelpers.getCurrentUser();
        setSupabaseConnected(!!user);
      } catch (error) {
        console.error('Failed to check Supabase connection:', error);
        setSupabaseConnected(false);
      }
    }
  };

  const loadBackupSettings = async () => {
    try {
      const backupEnabled = await getSetting('online-backup-enabled');
      const lastBackup = await getSetting('last-backup-date');
      setOnlineBackupEnabled(backupEnabled || false);
      setLastBackupDate(lastBackup);
    } catch (error) {
      console.error('Failed to load backup settings:', error);
    }
  };

  const handleOnlineBackupToggle = async (enabled: boolean) => {
    try {
      await setSetting('online-backup-enabled', enabled);
      setOnlineBackupEnabled(enabled);
      
      if (enabled) {
        // Trigger initial backup
        await handleOnlineBackup();
      }
    } catch (error) {
      console.error('Failed to update backup settings:', error);
    }
  };

  const handleOnlineBackup = async () => {
    if (!user) return;
    
    // Check if we can use automatic encryption
    if (!encryption.hasCredentials()) {
      const password = prompt('Enter your password to encrypt and backup your data:');
      if (!password) return;
      
      setIsBackingUp(true);
      try {
        await syncService.syncToCloudWithPassword(password);
        const now = new Date().toISOString();
        await setSetting('last-backup-date', now);
        setLastBackupDate(now);
        setBackupSuccess(true);
        setTimeout(() => setBackupSuccess(false), 3000);
      } catch (error) {
        console.error('Backup failed:', error);
        alert('Backup failed. Please try again.');
      } finally {
        setIsBackingUp(false);
      }
      return;
    }

    // Use automatic encryption with stored credentials
    setIsBackingUp(true);
    try {
      await syncService.syncToCloud();
      const now = new Date().toISOString();
      await setSetting('last-backup-date', now);
      setLastBackupDate(now);
      setBackupSuccess(true);
      setTimeout(() => setBackupSuccess(false), 3000);
    } catch (error) {
      console.error('Backup failed:', error);
      alert('Backup failed. Please try again.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    
    setIsExporting(true);
    try {
      const [transactions, products, services] = await Promise.all([
        getTransactions(),
        getProducts(),
        getServices(),
      ]);

      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        data: {
          transactions,
          products,
          services,
          settings
        }
      };

      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `uzaji-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      if (!importData.version || !importData.data) {
        throw new Error('Invalid backup file format');
      }

      // Store import info for dashboard
      const importInfo = {
        date: new Date().toISOString(),
        originalExportDate: importData.exportDate,
        stats: {
          transactions: importData.data.transactions?.length || 0,
          products: importData.data.products?.length || 0,
          services: importData.data.services?.length || 0,
          duplicatesSkipped: 0,
          errors: 0
        }
      };

      await setSetting('last-import', importInfo);

      // Import transactions with "(Imported)" suffix
      if (importData.data.transactions) {
        for (const transaction of importData.data.transactions) {
          try {
            const { addTransaction } = await import('../utils/database');
            await addTransaction({
              ...transaction,
              description: `${transaction.description} (Imported)`,
              encrypted: true
            });
          } catch (error) {
            importInfo.stats.errors++;
            console.error('Failed to import transaction:', error);
          }
        }
      }

      // Import products
      if (importData.data.products) {
        for (const product of importData.data.products) {
          try {
            const { addProduct } = await import('../utils/database');
            await addProduct({
              ...product,
              encrypted: true
            });
          } catch (error) {
            importInfo.stats.errors++;
            console.error('Failed to import product:', error);
          }
        }
      }

      // Import services
      if (importData.data.services) {
        for (const service of importData.data.services) {
          try {
            const { addService } = await import('../utils/database');
            await addService({
              ...service,
              encrypted: true
            });
          } catch (error) {
            importInfo.stats.errors++;
            console.error('Failed to import service:', error);
          }
        }
      }

      // Update import info with final stats
      await setSetting('last-import', importInfo);

      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 3000);
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleClearData = async () => {
    if (!confirm(t('settings.clearDataConfirm'))) return;

    try {
      // Clear all data except user credentials and settings
      const { getDB } = await import('../utils/database');
      const db = await getDB();
      
      await db.clear('transactions');
      await db.clear('products');
      await db.clear('services');
      
      // Remove import info
      await db.delete('settings', 'last-import');

      setClearDataSuccess(true);
      setTimeout(() => setClearDataSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  };

  const filteredCurrencies = Object.entries(currencyRegions).reduce((acc, [region, codes]) => {
    const filtered = codes.filter(code => {
      const currency = worldCurrencies.find(c => c.code === code);
      if (!currency) return false;
      
      const searchTerm = currencySearch.toLowerCase();
      return (
        currency.code.toLowerCase().includes(searchTerm) ||
        currency.name.toLowerCase().includes(searchTerm) ||
        currency.symbol.toLowerCase().includes(searchTerm)
      );
    });
    
    if (filtered.length > 0) {
      acc[region] = filtered;
    }
    return acc;
  }, {} as Record<string, string[]>);

  const filteredLanguages = Object.entries(languageRegions).reduce((acc, [region, codes]) => {
    const filtered = codes.filter(code => {
      const language = worldLanguages.find(l => l.code === code);
      if (!language) return false;
      
      const searchTerm = languageSearch.toLowerCase();
      return (
        language.code.toLowerCase().includes(searchTerm) ||
        language.name.toLowerCase().includes(searchTerm) ||
        language.nativeName.toLowerCase().includes(searchTerm)
      );
    });
    
    if (filtered.length > 0) {
      acc[region] = filtered;
    }
    return acc;
  }, {} as Record<string, string[]>);

  const currentLanguage = getLanguageByCode(settings.language);

  return (
    <div className={`min-h-screen ${themeClasses.background}`} dir={themeClasses.direction}>
      <header className={`${themeClasses.cardBackground} shadow-sm ${themeClasses.border} border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate(-1)}
              className={`${themeClasses.marginEnd} p-2 ${themeClasses.textSecondary} hover:${themeClasses.text} ${themeClasses.hover} rounded-lg transition-colors`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <UzajiLogo size="md" className={themeClasses.marginEnd} />
            <h1 className={`text-xl font-bold ${themeClasses.text}`}>{t('nav.settings')}</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Supabase Connection Status */}
        {!supabaseConfigured && (
          <div className={`mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg`}>
            <div className="flex items-center space-x-3">
              <Database className="w-5 h-5 text-yellow-600" />
              <div>
                <p className={`font-medium ${themeClasses.text}`}>Supabase Not Configured</p>
                <p className={`text-sm ${themeClasses.textSecondary}`}>
                  To enable online backup and sync, please configure your Supabase environment variables.
                  <a 
                    href="https://bolt.new/setup/supabase" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`${themeClasses.accentText} hover:underline ml-1`}
                  >
                    Learn how to set up Supabase
                  </a>
                </p>
                {supabaseConfigStatus && (
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    <p>URL configured: {supabaseConfigStatus.hasUrl ? '✓' : '✗'}</p>
                    <p>Key configured: {supabaseConfigStatus.hasKey ? '✓' : '✗'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {supabaseConfigured && (
          <div className={`mb-6 p-4 rounded-lg border ${
            supabaseConnected 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`w-5 h-5 ${supabaseConnected ? 'text-green-600' : 'text-blue-600'}`}>
                {supabaseConnected ? <Wifi /> : <Database />}
              </div>
              <div>
                <p className={`font-medium ${themeClasses.text}`}>
                  {supabaseConnected ? 'Connected to Supabase' : 'Supabase Configured'}
                </p>
                <p className={`text-sm ${themeClasses.textSecondary}`}>
                  {supabaseConnected 
                    ? 'Your data can be synced to the cloud securely with automatic encryption.'
                    : 'Sign in to enable cloud sync and backup features.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Connection Error Warning */}
        {supabaseConfigured && !supabaseConnected && (
          <div className={`mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg`}>
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div>
                <p className={`font-medium ${themeClasses.text}`}>Connection Issue</p>
                <p className={`text-sm ${themeClasses.textSecondary}`}>
                  Unable to connect to Supabase. Please check your environment variables and internet connection.
                  The app will continue to work offline with local storage.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 mb-8">
          <button
            onClick={() => setActiveTab('preferences')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'preferences'
                ? `${themeClasses.accent} ${themeClasses.accentText} shadow-lg`
                : `${themeClasses.cardBackground} ${themeClasses.text} ${themeClasses.hover} ${themeClasses.border} border`
            }`}
          >
            <Palette className="w-4 h-4 inline mr-2" />
            {t('settings.preferences')}
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'account'
                ? `${themeClasses.accent} ${themeClasses.accentText} shadow-lg`
                : `${themeClasses.cardBackground} ${themeClasses.text} ${themeClasses.hover} ${themeClasses.border} border`
            }`}
          >
            <UserIcon className="w-4 h-4 inline mr-2" />
            {t('settings.account')}
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'security'
                ? `${themeClasses.accent} ${themeClasses.accentText} shadow-lg`
                : `${themeClasses.cardBackground} ${themeClasses.text} ${themeClasses.hover} ${themeClasses.border} border`
            }`}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            {t('settings.security')}
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'data'
                ? `${themeClasses.accent} ${themeClasses.accentText} shadow-lg`
                : `${themeClasses.cardBackground} ${themeClasses.text} ${themeClasses.hover} ${themeClasses.border} border`
            }`}
          >
            <Download className="w-4 h-4 inline mr-2" />
            {t('settings.data')}
          </button>
        </div>

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            {/* Language Settings */}
            <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm ${themeClasses.border} border p-6`}>
              <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4 flex items-center`}>
                <Globe className="w-5 h-5 mr-3" />
                {t('settings.language')}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                    {t('settings.language')}
                  </label>
                  <div className="relative">
                    <button
                      onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                      className={`w-full px-4 py-3 ${themeClasses.border} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${themeClasses.cardBackground} ${themeClasses.text} ${themeClasses.textAlign} flex items-center justify-between`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">
                          {currentLanguage?.name || 'English'}
                        </span>
                        <span className={`text-sm ${themeClasses.textSecondary}`}>
                          {currentLanguage?.nativeName || 'English'}
                        </span>
                      </div>
                      <ChevronDown className={`w-4 h-4 ${themeClasses.textSecondary} transition-transform ${showLanguageDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showLanguageDropdown && (
                      <div className={`absolute top-full left-0 right-0 mt-1 ${themeClasses.cardBackground} rounded-lg shadow-xl ${themeClasses.border} border z-50 max-h-96 overflow-hidden`}>
                        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                          <div className="relative">
                            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${themeClasses.textSecondary}`} />
                            <input
                              type="text"
                              placeholder={t('settings.searchLanguages')}
                              value={languageSearch}
                              onChange={(e) => setLanguageSearch(e.target.value)}
                              className={`w-full pl-10 pr-4 py-2 ${themeClasses.border} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.cardBackground} ${themeClasses.text}`}
                            />
                          </div>
                        </div>
                        
                        <div className="max-h-80 overflow-y-auto">
                          {Object.entries(filteredLanguages).map(([region, codes]) => (
                            <div key={region}>
                              <div className={`px-4 py-2 text-xs font-semibold ${themeClasses.textSecondary} ${themeClasses.background} border-b ${themeClasses.border}`}>
                                {region}
                              </div>
                              {codes.map((code) => {
                                const language = worldLanguages.find(l => l.code === code);
                                if (!language) return null;
                                
                                return (
                                  <button
                                    key={code}
                                    onClick={() => {
                                      updateSettings({ language: code });
                                      setShowLanguageDropdown(false);
                                      setLanguageSearch('');
                                    }}
                                    className={`w-full px-4 py-3 ${themeClasses.textAlign} ${themeClasses.hover} transition-colors flex items-center justify-between group ${
                                      settings.language === code ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                                    }`}
                                  >
                                    <div className="flex items-center space-x-3">
                                      <span className={`font-medium ${themeClasses.text}`}>
                                        {language.name}
                                      </span>
                                      <span className={`text-sm ${themeClasses.textSecondary}`}>
                                        {language.nativeName}
                                      </span>
                                      {language.rtl && (
                                        <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 px-2 py-1 rounded">RTL</span>
                                      )}
                                    </div>
                                    {settings.language === code && (
                                      <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Currency Settings */}
            <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm ${themeClasses.border} border p-6`}>
              <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4 flex items-center`}>
                <DollarSign className="w-5 h-5 mr-3" />
                {t('settings.currency')}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                    {t('settings.currency')}
                  </label>
                  <div className="relative">
                    <button
                      onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                      className={`w-full px-4 py-3 ${themeClasses.border} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${themeClasses.cardBackground} ${themeClasses.text} ${themeClasses.textAlign} flex items-center justify-between`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">
                          {worldCurrencies.find(c => c.code === settings.currency)?.name || 'US Dollar'}
                        </span>
                        <span className={`text-sm ${themeClasses.textSecondary}`}>
                          {settings.currency} - {formatCurrency(1234.56)}
                        </span>
                      </div>
                      <ChevronDown className={`w-4 h-4 ${themeClasses.textSecondary} transition-transform ${showCurrencyDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showCurrencyDropdown && (
                      <div className={`absolute top-full left-0 right-0 mt-1 ${themeClasses.cardBackground} rounded-lg shadow-xl ${themeClasses.border} border z-50 max-h-96 overflow-hidden`}>
                        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                          <div className="relative">
                            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${themeClasses.textSecondary}`} />
                            <input
                              type="text"
                              placeholder={t('settings.searchCurrencies')}
                              value={currencySearch}
                              onChange={(e) => setCurrencySearch(e.target.value)}
                              className={`w-full pl-10 pr-4 py-2 ${themeClasses.border} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.cardBackground} ${themeClasses.text}`}
                            />
                          </div>
                        </div>
                        
                        <div className="max-h-80 overflow-y-auto">
                          {Object.entries(filteredCurrencies).map(([region, codes]) => (
                            <div key={region}>
                              <div className={`px-4 py-2 text-xs font-semibold ${themeClasses.textSecondary} ${themeClasses.background} border-b ${themeClasses.border}`}>
                                {region}
                              </div>
                              {codes.map((code) => {
                                const currency = worldCurrencies.find(c => c.code === code);
                                if (!currency) return null;
                                
                                return (
                                  <button
                                    key={code}
                                    onClick={() => {
                                      updateSettings({ currency: code });
                                      setShowCurrencyDropdown(false);
                                      setCurrencySearch('');
                                    }}
                                    className={`w-full px-4 py-3 ${themeClasses.textAlign} ${themeClasses.hover} transition-colors flex items-center justify-between group ${
                                      settings.currency === code ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                                    }`}
                                  >
                                    <div className="flex items-center space-x-3">
                                      <span className={`font-medium ${themeClasses.text}`}>
                                        {currency.name}
                                      </span>
                                      <span className={`text-sm ${themeClasses.textSecondary}`}>
                                        {currency.code} - {formatCurrencyAmount(1234.56, currency.code)}
                                      </span>
                                    </div>
                                    {settings.currency === code && (
                                      <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Theme Settings */}
            <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm ${themeClasses.border} border p-6`}>
              <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4 flex items-center`}>
                <Palette className="w-5 h-5 mr-3" />
                {t('settings.theme')}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => updateSettings({ theme: 'light' })}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    settings.theme === 'light'
                      ? `border-blue-500 ${themeClasses.accent} ${themeClasses.accentText}`
                      : `${themeClasses.border} border ${themeClasses.hover}`
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white border border-slate-300 rounded-lg flex items-center justify-center">
                      <Sun className="w-4 h-4 text-yellow-500" />
                    </div>
                    <div className={themeClasses.textAlign}>
                      <p className={`font-medium ${themeClasses.text}`}>{t('settings.light')}</p>
                      <p className={`text-sm ${themeClasses.textSecondary}`}>{t('settings.cleanAndBright')}</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => updateSettings({ theme: 'dark' })}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    settings.theme === 'dark'
                      ? `border-blue-500 ${themeClasses.accent} ${themeClasses.accentText}`
                      : `${themeClasses.border} border ${themeClasses.hover}`
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-slate-800 border border-slate-600 rounded-lg flex items-center justify-center">
                      <Moon className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className={themeClasses.textAlign}>
                      <p className={`font-medium ${themeClasses.text}`}>{t('settings.dark')}</p>
                      <p className={`text-sm ${themeClasses.textSecondary}`}>{t('settings.easyOnEyes')}</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => updateSettings({ theme: 'system' })}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    settings.theme === 'system'
                      ? `border-blue-500 ${themeClasses.accent} ${themeClasses.accentText}`
                      : `${themeClasses.border} border ${themeClasses.hover}`
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-white to-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg flex items-center justify-center">
                      <Monitor className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    </div>
                    <div className={themeClasses.textAlign}>
                      <p className={`font-medium ${themeClasses.text}`}>{t('settings.system')}</p>
                      <p className={`text-sm ${themeClasses.textSecondary}`}>{t('settings.followsDevice')}</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Other Preferences */}
            <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm ${themeClasses.border} border p-6`}>
              <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4 flex items-center`}>
                <Eye className="w-5 h-5 mr-3" />
                {t('settings.displayOptions')}
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-medium ${themeClasses.text}`}>{t('settings.compactView')}</p>
                    <p className={`text-sm ${themeClasses.textSecondary}`}>{t('settings.compactViewDescription')}</p>
                  </div>
                  <button
                    onClick={() => updateSettings({ compactView: !settings.compactView })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.compactView ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.compactView ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-medium ${themeClasses.text}`}>{t('settings.notifications')}</p>
                    <p className={`text-sm ${themeClasses.textSecondary}`}>{t('settings.notificationsDescription')}</p>
                  </div>
                  <button
                    onClick={() => updateSettings({ notifications: !settings.notifications })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.notifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.notifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {supabaseConfigured && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${themeClasses.text}`}>{t('settings.onlineBackup')}</p>
                      <p className={`text-sm ${themeClasses.textSecondary}`}>{t('settings.onlineBackupDescription')}</p>
                    </div>
                    <button
                      onClick={() => handleOnlineBackupToggle(!onlineBackupEnabled)}
                      disabled={!supabaseConnected}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        onlineBackupEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                      } ${!supabaseConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          onlineBackupEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm ${themeClasses.border} border p-6`}>
              <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>{t('settings.accountInfo')}</h3>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>{t('settings.name')}</label>
                  <input
                    type="text"
                    value={user?.name || ''}
                    readOnly
                    className={`w-full px-4 py-3 ${themeClasses.border} border rounded-lg bg-gray-50 dark:bg-gray-700 ${themeClasses.text}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>{t('settings.email')}</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    readOnly
                    className={`w-full px-4 py-3 ${themeClasses.border} border rounded-lg bg-gray-50 dark:bg-gray-700 ${themeClasses.text}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>{t('settings.accountType')}</label>
                  <input
                    type="text"
                    value={user?.isSupabaseUser ? 'Supabase Account' : 'Local Account'}
                    readOnly
                    className={`w-full px-4 py-3 ${themeClasses.border} border rounded-lg bg-gray-50 dark:bg-gray-700 ${themeClasses.text}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>{t('settings.memberSince')}</label>
                  <input
                    type="text"
                    value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}
                    readOnly
                    className={`w-full px-4 py-3 ${themeClasses.border} border rounded-lg bg-gray-50 dark:bg-gray-700 ${themeClasses.text}`}
                  />
                </div>
              </div>
            </div>

            <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm ${themeClasses.border} border p-6`}>
              <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>{t('settings.accountActions')}</h3>
              <button
                onClick={onLogout}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <span>{t('auth.signOut')}</span>
              </button>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm ${themeClasses.border} border p-6`}>
              <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>{t('settings.securityFeatures')}</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <p className={`font-medium ${themeClasses.text}`}>{t('settings.endToEndEncryption')}</p>
                    <p className={`text-sm ${themeClasses.textSecondary}`}>{t('settings.endToEndDescription')}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <p className={`font-medium ${themeClasses.text}`}>{t('settings.automaticEncryption')}</p>
                    <p className={`text-sm ${themeClasses.textSecondary}`}>{t('settings.automaticEncryptionDescription')}</p>
                  </div>
                </div>
                {supabaseConfigured && (
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-green-600 mt-1" />
                    <div>
                      <p className={`font-medium ${themeClasses.text}`}>{t('settings.secureCloudSync')}</p>
                      <p className={`text-sm ${themeClasses.textSecondary}`}>{t('settings.secureCloudSyncDescription')}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <p className={`font-medium ${themeClasses.text}`}>{t('settings.localStorage')}</p>
                    <p className={`text-sm ${themeClasses.textSecondary}`}>{t('settings.localStorageDescription')}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <p className={`font-medium ${themeClasses.text}`}>{t('settings.noDataMining')}</p>
                    <p className={`text-sm ${themeClasses.textSecondary}`}>{t('settings.noDataMiningDescription')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Data Tab */}
        {activeTab === 'data' && (
          <div className="space-y-6">
            <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm ${themeClasses.border} border p-6`}>
              <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>{t('settings.dataManagement')}</h3>
              <div className="space-y-4">
                {/* Online Backup Section */}
                {onlineBackupEnabled && supabaseConfigured && (
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center space-x-3">
                      <Cloud className="w-5 h-5 text-green-600" />
                      <div>
                        <p className={`font-medium ${themeClasses.text}`}>{t('settings.onlineBackup')}</p>
                        <p className={`text-sm ${themeClasses.textSecondary}`}>
                          {lastBackupDate 
                            ? `${t('settings.lastBackup')}: ${new Date(lastBackupDate).toLocaleDateString()}`
                            : t('settings.onlineBackupDescription')
                          }
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleOnlineBackup}
                      disabled={isBackingUp || !supabaseConnected}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {isBackingUp ? (
                        <span>{t('settings.backingUp')}</span>
                      ) : (
                        <>
                          <Cloud className="w-4 h-4" />
                          <span>{t('settings.backupNow')}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {backupSuccess && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-green-800 dark:text-green-200 font-medium">✓ {t('settings.backupSuccess')}</p>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center space-x-3">
                    <Download className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className={`font-medium ${themeClasses.text}`}>{t('settings.exportData')}</p>
                      <p className={`text-sm ${themeClasses.textSecondary}`}>{t('settings.exportDataDescription')}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleExportData}
                    disabled={isExporting}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isExporting ? (
                      <span>{t('settings.exporting')}</span>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>{t('common.export')}</span>
                      </>
                    )}
                  </button>
                </div>

                {exportSuccess && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-green-800 dark:text-green-200 font-medium">✓ {t('settings.dataExportedSuccess')}</p>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center space-x-3">
                    <Upload className="w-5 h-5 text-green-600" />
                    <div>
                      <p className={`font-medium ${themeClasses.text}`}>{t('settings.importData')}</p>
                      <p className={`text-sm ${themeClasses.textSecondary}`}>{t('settings.importDataDescription')}</p>
                    </div>
                  </div>
                  <label className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors cursor-pointer flex items-center space-x-2">
                    <Upload className="w-4 h-4" />
                    <span>{isImporting ? t('settings.importing') : t('common.import')}</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportData}
                      className="hidden"
                      disabled={isImporting}
                    />
                  </label>
                </div>

                {importSuccess && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-green-800 dark:text-green-200 font-medium">✓ {t('settings.dataImportedSuccess')}</p>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center space-x-3">
                    <Trash2 className="w-5 h-5 text-red-600" />
                    <div>
                      <p className={`font-medium ${themeClasses.text}`}>{t('settings.clearData')}</p>
                      <p className={`text-sm ${themeClasses.textSecondary}`}>{t('settings.clearDataDescription')}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleClearData}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{t('common.delete')}</span>
                  </button>
                </div>

                {clearDataSuccess && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-green-800 dark:text-green-200 font-medium">✓ {t('settings.dataClearedSuccess')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close dropdowns */}
      {(showCurrencyDropdown || showLanguageDropdown) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowCurrencyDropdown(false);
            setShowLanguageDropdown(false);
          }}
        ></div>
      )}
    </div>
  );
}