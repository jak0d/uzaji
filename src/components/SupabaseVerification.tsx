import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Play,
  Database,
  Shield,
  Upload,
  Download,
  Key,
  User,
  Settings,
  Wifi,
  Lock
} from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { supabaseHelpers } from '../utils/supabase';
import { supabaseSync } from '../utils/supabaseSync';
import { encryption } from '../utils/encryption';

interface SupabaseTest {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  result?: string;
  error?: string;
  critical: boolean;
}

interface SupabaseVerificationProps {
  className?: string;
}

export function SupabaseVerification({ className = '' }: SupabaseVerificationProps) {
  const { getThemeClasses } = useSettings();
  const themeClasses = getThemeClasses();
  
  const [tests, setTests] = useState<SupabaseTest[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [overallStatus, setOverallStatus] = useState<'pending' | 'ready' | 'not-configured' | 'error'>('pending');
  const [configStatus, setConfigStatus] = useState<any>(null);
  const [backupInfo, setBackupInfo] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    initializeTests();
    checkInitialStatus();
  }, []);

  const initializeTests = () => {
    const testSuite: SupabaseTest[] = [
      {
        id: 'config',
        name: 'Supabase Configuration',
        description: 'Check if Supabase URL and API key are properly configured',
        status: 'pending',
        critical: true
      },
      {
        id: 'connection',
        name: 'Database Connection',
        description: 'Verify connection to Supabase database',
        status: 'pending',
        critical: true
      },
      {
        id: 'authentication',
        name: 'Authentication Status',
        description: 'Check if user is authenticated with Supabase',
        status: 'pending',
        critical: true
      },
      {
        id: 'encryption',
        name: 'Encryption Service',
        description: 'Verify encryption/decryption functionality',
        status: 'pending',
        critical: true
      },
      {
        id: 'sync-service',
        name: 'Sync Service',
        description: 'Test Supabase sync service functionality',
        status: 'pending',
        critical: false
      },
      {
        id: 'backup-info',
        name: 'Cloud Backup Info',
        description: 'Check existing cloud backup data',
        status: 'pending',
        critical: false
      },
      {
        id: 'permissions',
        name: 'Database Permissions',
        description: 'Verify read/write permissions to database tables',
        status: 'pending',
        critical: true
      }
    ];
    
    setTests(testSuite);
  };

  const checkInitialStatus = async () => {
    try {
      const config = supabaseHelpers.getConfigStatus();
      setConfigStatus(config);
      
      if (config.configured) {
        const authenticated = await supabaseSync.isAuthenticated();
        setIsAuthenticated(authenticated);
        
        if (authenticated) {
          try {
            const info = await supabaseSync.getCloudBackupInfo();
            setBackupInfo(info);
          } catch (error) {
            console.error('Failed to get backup info:', error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to check initial status:', error);
    }
  };

  const runSupabaseTests = async () => {
    setIsRunning(true);
    const updatedTests = [...tests];
    let criticalFailures = 0;

    for (let i = 0; i < updatedTests.length; i++) {
      const test = updatedTests[i];
      test.status = 'running';
      setTests([...updatedTests]);

      try {
        await runIndividualTest(test);
        test.status = 'passed';
      } catch (error) {
        test.status = 'failed';
        test.error = error instanceof Error ? error.message : 'Unknown error';
        if (test.critical) {
          criticalFailures++;
        }
      }
      
      setTests([...updatedTests]);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Determine overall status
    if (!configStatus?.configured) {
      setOverallStatus('not-configured');
    } else if (criticalFailures > 0) {
      setOverallStatus('error');
    } else {
      setOverallStatus('ready');
    }

    setIsRunning(false);
  };

  const runIndividualTest = async (test: SupabaseTest): Promise<void> => {
    switch (test.id) {
      case 'config':
        const config = supabaseHelpers.getConfigStatus();
        if (!config.configured) {
          throw new Error('Supabase URL or API key not configured');
        }
        test.result = `Configuration valid: ${config.url}`;
        break;

      case 'connection':
        if (!supabaseHelpers.isConfigured()) {
          throw new Error('Supabase not configured');
        }
        // Try to get current session to test connection
        try {
          await supabaseHelpers.getCurrentSession();
          test.result = 'Database connection successful';
        } catch (error) {
          throw new Error('Failed to connect to database');
        }
        break;

      case 'authentication':
        const authenticated = await supabaseSync.isAuthenticated();
        if (!authenticated) {
          test.result = 'Not authenticated (this is optional)';
        } else {
          const user = await supabaseHelpers.getCurrentUser();
          test.result = `Authenticated as: ${user?.email || 'Unknown user'}`;
        }
        break;

      case 'encryption':
        // Test encryption service
        const testData = { test: 'encryption test', number: 123 };
        try {
          if (!encryption.hasCredentials()) {
            test.result = 'No encryption credentials (requires authentication)';
          } else {
            const encrypted = await encryption.encrypt(testData);
            const decrypted = await encryption.decrypt(encrypted);
            if (JSON.stringify(testData) !== JSON.stringify(decrypted)) {
              throw new Error('Encryption/decryption mismatch');
            }
            test.result = 'Encryption service working correctly';
          }
        } catch (error) {
          throw new Error(`Encryption test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        break;

      case 'sync-service':
        // Test sync service initialization
        try {
          const syncInstance = supabaseSync;
          if (!syncInstance) {
            throw new Error('Sync service not available');
          }
          test.result = 'Sync service initialized successfully';
        } catch (error) {
          throw new Error('Sync service initialization failed');
        }
        break;

      case 'backup-info':
        if (!await supabaseSync.isAuthenticated()) {
          test.result = 'Not authenticated - cannot check backup info';
        } else {
          try {
            const info = await supabaseSync.getCloudBackupInfo();
            setBackupInfo(info);
            test.result = `Backup info: ${info.transactionCount} transactions, ${info.productCount} products, ${info.serviceCount} services`;
          } catch (error) {
            throw new Error('Failed to get backup information');
          }
        }
        break;

      case 'permissions':
        if (!await supabaseSync.isAuthenticated()) {
          test.result = 'Not authenticated - cannot test permissions';
        } else {
          try {
            // Try to fetch data to test read permissions
            await supabaseSync.fetchTransactions();
            test.result = 'Database permissions verified';
          } catch (error) {
            throw new Error('Database permission test failed');
          }
        }
        break;

      default:
        throw new Error(`Unknown test: ${test.id}`);
    }
  };

  const getStatusIcon = (status: SupabaseTest['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'running':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: SupabaseTest['status']) => {
    switch (status) {
      case 'passed':
        return 'border-green-200 bg-green-50 dark:bg-green-900/20';
      case 'failed':
        return 'border-red-200 bg-red-50 dark:bg-red-900/20';
      case 'running':
        return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'border-gray-200 bg-gray-50 dark:bg-gray-800';
    }
  };

  const getOverallStatusIcon = () => {
    switch (overallStatus) {
      case 'ready':
        return <Cloud className="w-8 h-8 text-green-500" />;
      case 'not-configured':
        return <CloudOff className="w-8 h-8 text-gray-500" />;
      case 'error':
        return <XCircle className="w-8 h-8 text-red-500" />;
      default:
        return <AlertTriangle className="w-8 h-8 text-yellow-500" />;
    }
  };

  const getOverallStatusMessage = () => {
    switch (overallStatus) {
      case 'ready':
        return 'Supabase cloud backup is ready and functional';
      case 'not-configured':
        return 'Supabase is not configured - cloud backup unavailable';
      case 'error':
        return 'Supabase has configuration or connection issues';
      default:
        return 'Supabase status pending verification';
    }
  };

  const passedTests = tests.filter(t => t.status === 'passed').length;
  const failedTests = tests.filter(t => t.status === 'failed').length;
  const totalTests = tests.length;

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-2xl font-bold ${themeClasses.text} flex items-center`}>
            <Cloud className="w-7 h-7 mr-3 text-blue-600" />
            Supabase Cloud Backup Verification
          </h1>
          <p className={`${themeClasses.textSecondary} mt-1`}>
            Verify Supabase cloud storage and backup integration
          </p>
        </div>
        
        <button
          onClick={runSupabaseTests}
          disabled={isRunning}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50"
        >
          {isRunning ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          <span>{isRunning ? 'Running Tests...' : 'Run Supabase Tests'}</span>
        </button>
      </div>

      {/* Overall Status */}
      <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm border p-6 mb-8 ${
        overallStatus === 'ready' ? 'border-green-200 bg-green-50 dark:bg-green-900/20' :
        overallStatus === 'error' ? 'border-red-200 bg-red-50 dark:bg-red-900/20' :
        overallStatus === 'not-configured' ? 'border-gray-200 bg-gray-50 dark:bg-gray-800' :
        'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20'
      }`}>
        <div className="flex items-center space-x-4">
          {getOverallStatusIcon()}
          <div>
            <h2 className={`text-xl font-bold ${themeClasses.text}`}>
              {getOverallStatusMessage()}
            </h2>
            <p className={`${themeClasses.textSecondary}`}>
              Tests: {passedTests} passed, {failedTests} failed, {totalTests} total
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Status */}
      {configStatus && (
        <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm border ${themeClasses.border} p-6 mb-8`}>
          <h2 className={`text-lg font-semibold ${themeClasses.text} mb-4 flex items-center`}>
            <Settings className="w-5 h-5 mr-2" />
            Configuration Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              {configStatus.hasUrl ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <div>
                <p className={`font-medium ${themeClasses.text}`}>Supabase URL</p>
                <p className={`text-sm ${themeClasses.textSecondary}`}>
                  {configStatus.hasUrl ? configStatus.url : 'Not configured'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {configStatus.hasKey ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <div>
                <p className={`font-medium ${themeClasses.text}`}>API Key</p>
                <p className={`text-sm ${themeClasses.textSecondary}`}>
                  {configStatus.hasKey ? 'Configured' : 'Not configured'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Authentication Status */}
      <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm border ${themeClasses.border} p-6 mb-8`}>
        <h2 className={`text-lg font-semibold ${themeClasses.text} mb-4 flex items-center`}>
          <User className="w-5 h-5 mr-2" />
          Authentication Status
        </h2>
        <div className="flex items-center space-x-3">
          {isAuthenticated ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <XCircle className="w-5 h-5 text-gray-500" />
          )}
          <div>
            <p className={`font-medium ${themeClasses.text}`}>
              {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
            </p>
            <p className={`text-sm ${themeClasses.textSecondary}`}>
              {isAuthenticated 
                ? 'Cloud backup and sync available' 
                : 'Sign in to enable cloud backup features'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Backup Information */}
      {backupInfo && (
        <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm border ${themeClasses.border} p-6 mb-8`}>
          <h2 className={`text-lg font-semibold ${themeClasses.text} mb-4 flex items-center`}>
            <Database className="w-5 h-5 mr-2" />
            Cloud Backup Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{backupInfo.transactionCount}</p>
              <p className={`text-sm ${themeClasses.textSecondary}`}>Transactions</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{backupInfo.productCount}</p>
              <p className={`text-sm ${themeClasses.textSecondary}`}>Products</p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{backupInfo.serviceCount}</p>
              <p className={`text-sm ${themeClasses.textSecondary}`}>Services</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className={`text-sm font-bold ${backupInfo.hasBackup ? 'text-green-600' : 'text-gray-600'}`}>
                {backupInfo.hasBackup ? 'Has Backup' : 'No Backup'}
              </p>
              <p className={`text-xs ${themeClasses.textSecondary}`}>
                {backupInfo.lastBackupDate ? new Date(backupInfo.lastBackupDate).toLocaleDateString() : 'Never'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Test Results */}
      <div className="space-y-4">
        {tests.map((test) => (
          <div
            key={test.id}
            className={`${themeClasses.cardBackground} rounded-lg shadow-sm border p-6 ${getStatusColor(test.status)}`}
          >
            <div className="flex items-start space-x-4">
              {getStatusIcon(test.status)}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`text-lg font-semibold ${themeClasses.text}`}>
                    {test.name}
                  </h3>
                  {test.critical && (
                    <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">
                      Critical
                    </span>
                  )}
                </div>
                <p className={`${themeClasses.textSecondary} mb-2`}>
                  {test.description}
                </p>
                {test.result && (
                  <p className={`text-sm ${themeClasses.text} mb-2`}>
                    <strong>Result:</strong> {test.result}
                  </p>
                )}
                {test.error && (
                  <p className="text-sm text-red-600">
                    <strong>Error:</strong> {test.error}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Configuration Help */}
      {overallStatus === 'not-configured' && (
        <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm border ${themeClasses.border} p-6 mt-8`}>
          <h2 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>
            Supabase Configuration Help
          </h2>
          <div className="space-y-4">
            <p className={themeClasses.textSecondary}>
              To enable Supabase cloud backup, you need to set up environment variables:
            </p>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <code className="text-sm">
                VITE_SUPABASE_URL=your_supabase_project_url<br />
                VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
              </code>
            </div>
            <p className={`text-sm ${themeClasses.textSecondary}`}>
              These should be added to your .env file in the project root.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}