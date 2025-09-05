import React, { useState, useEffect } from 'react';
import { ArrowLeft, User as UserIcon, Shield, Download, Upload, Trash2, Search, ChevronDown, Globe, Palette, DollarSign, Eye, Monitor, Sun, Moon, Check, Cloud, Database, Wifi, AlertTriangle, RotateCcw } from 'lucide-react';
import { ResetOnboardingDialog } from './dialogs/ResetOnboardingDialog';
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
  const [showResetDialog, setShowResetDialog] = useState(false);

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
  }, {});

  return (
    <div className={`min-h-screen ${themeClasses.background} ${themeClasses.text} transition-colors duration-200`}>
      <ResetOnboardingDialog 
        open={showResetDialog} 
        onOpenChange={setShowResetDialog} 
      />
      <div className="max-w-4xl mx-auto p-4">
        {/* ... */}
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
                <div className="p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 mb-4">
                  <h3 className="font-medium text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Reset Application
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1 mb-3">
                    Start fresh by resetting the application to its initial state.
                  </p>
                  <button
                    onClick={() => setShowResetDialog(true)}
                    className="text-sm px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 dark:bg-yellow-800/50 dark:hover:bg-yellow-800 dark:text-yellow-200 rounded-md transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset Onboarding
                  </button>
                </div>

                <div className="p-4 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20">
                  <h3 className="font-medium text-red-800 dark:text-red-200">Danger Zone</h3>
                  <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                    These actions are irreversible. Proceed with caution.
                  </p>
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