import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Package, User, FileText, AlertCircle } from 'lucide-react';
import { getDB } from '../utils/database';
import { useNavigate } from 'react-router-dom';
import { addTransaction, getClients, getClientFiles, getBusinessConfig, getAccounts, getProducts, getServices } from '../utils/database';
import type { Client, ClientFile, Product, Service, Account } from '../utils/database';
import { UzajiLogo } from './UzajiLogo';
import { useSettings } from '../hooks/useSettings';
import { useTranslation } from '../hooks/useTranslation';
import { trackBusiness, trackFeature } from '../utils/analytics';

interface TransactionFormProps {}

export function TransactionForm({}: TransactionFormProps) {
  const { settings, formatCurrency, getThemeClasses } = useSettings();
  const { t } = useTranslation(settings.language);
  const themeClasses = getThemeClasses();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'income' as 'income' | 'expense',
    category: '',
    productId: '',
    selectedServiceId: '', // New field for selected service
    account: '',
    clientId: '',
    clientFileId: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientFiles, setClientFiles] = useState<ClientFile[]>([]);
  const [isLegalFirm, setIsLegalFirm] = useState(false);
  const [businessType, setBusinessType] = useState<'legal' | 'general_small_business' | 'general'>('general_small_business');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const categories = {
    income: ['Sales', 'Services', 'Consulting', 'Royalties', 'Other Income'],
    expense: ['Office Supplies', 'Marketing', 'Travel', 'Utilities', 'Professional Services', 'Other Expenses'],
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        setIsInitializing(true);
        setError(null);
        // Ensure database is initialized
        await getDB();
        await loadInitialData();
        // Track page view
        trackFeature('transactions', 'form_view');
      } catch (err) {
        console.error('Failed to initialize transaction form:', err);
        setError('Failed to load transaction form. Please try refreshing the page.');
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  }, []);

  const loadInitialData = async () => {
    try {
      const [productsData, servicesData, accountsData, businessConfig] = await Promise.all([
        getProducts(),
        getServices(),
        getAccounts(),
        getBusinessConfig()
      ]);
      
      setProducts(productsData);
      setServices(servicesData);
      setAccounts(accountsData);
      
      // Check business type
      const configType = businessConfig?.type || 'general_small_business';
      console.log('Business config type:', configType, 'Full businessConfig:', businessConfig);
      setIsLegalFirm(configType === 'legal');
      setBusinessType(configType as 'legal' | 'general_small_business' | 'general');
      
      // Always load clients for optional linking
      try {
        const clientsData = await getClients();
        setClients(clientsData);
        
        // If there's a client ID in the query params, load their files
        const urlParams = new URLSearchParams(window.location.search);
        const clientId = urlParams.get('clientId');
        if (clientId) {
          const files = await getClientFiles(clientId);
          setClientFiles(files);
          setFormData(prev => ({
            ...prev,
            clientId,
            clientFileId: files.length > 0 ? files[0].id : ''
          }));
        }
      } catch (error) {
        console.error('Failed to load clients:', error);
        setError('Could not load client list. You can still add transactions without client association.');
      }

      if (accountsData.length > 0) {
        const defaultAccount = accountsData.find(acc => acc.isDefault);
        setFormData(prev => ({
          ...prev,
          account: defaultAccount ? defaultAccount.id : accountsData[0].id,
        }));
      }
    } catch (error) {
      console.error('Failed to load initial data for transaction form:', error);
      setError('Failed to load form data. You can still create transactions with basic information.');
      // Set default values to allow form to function
      setIsLegalFirm(false);
      setAccounts([{ id: 'default', name: 'Default Account', currentBalance: 0, accountType: 'checking' as const, accountNumber: '****0000', bankName: 'Default Bank', isDefault: true, isActive: true, encrypted: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]);
      setFormData(prev => ({
        ...prev,
        account: 'default',
      }));
    }
  };

  // Handle client selection change
  const handleClientChange = async (clientId: string) => {
    if (!clientId) {
      setClientFiles([]);
      setFormData(prev => ({
        ...prev,
        clientId: '',
        clientFileId: ''
      }));
      return;
    }
    
    try {
      const files = await getClientFiles(clientId);
      setClientFiles(files);
      setFormData(prev => ({
        ...prev,
        clientId,
        clientFileId: files.length > 0 ? files[0].id : ''
      }));
    } catch (error) {
      console.error('Failed to load client files:', error);
      setError('Could not load client files. You can still proceed without selecting a file.');
      setClientFiles([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const transactionData: any = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        type: formData.type,
        category: formData.category,
        productId: formData.productId || formData.selectedServiceId || undefined, // Include service ID if selected
        account: formData.account,
        date: formData.date,
        encrypted: true,
      };
      
      // Add client and file references if provided (optional for all business types)
      if (formData.clientId) {
        transactionData.clientId = formData.clientId;
        if (formData.clientFileId) {
          transactionData.clientFileId = formData.clientFileId;
        }
      }
      
      await addTransaction(transactionData);

      // Track successful transaction creation
      trackBusiness('transaction_created', formData.type, parseFloat(formData.amount));
      trackFeature('transactions', 'form_submit_success');

      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Failed to save transaction:', error);
      trackFeature('transactions', 'form_submit_error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle service selection from the dynamic dropdown
  // This function populates form fields based on the selected service's pricing
  // Data flow: Service data comes from database via getServices(), stored in services state
  // Upon selection, updates formData with service details and computes amount based on pricing type
  const handleServiceSelection = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      // Auto-populate description with service name
      // Compute amount: use hourlyRate as the primary pricing metric
      // In a real app, this could include custom logic like hours * rate or API call for dynamic pricing
      const computedAmount = service.hourlyRate;
      setFormData(prev => ({
        ...prev,
        selectedServiceId: serviceId,
        productId: serviceId, // Reuse productId field for service linking
        description: service.name,
        amount: computedAmount.toString(),
        type: 'income',
        category: 'Services',
      }));
      trackFeature('transactions', 'service_selected_dropdown');
    }
  };

  // Handle category change with dynamic service dropdown logic
  // When 'Services' is selected, show secondary dropdown populated from services state
  // Real-time updates: useEffect below watches services state for changes (e.g., after adding new services)
  const handleCategoryChange = (category: string) => {
    setFormData(prev => ({
      ...prev,
      category,
      selectedServiceId: '', // Reset service selection when category changes
    }));
    if (category === 'Services') {
      trackFeature('transactions', 'services_category_selected');
    }
    trackFeature('transactions', 'category_selected', category);
  };

  // useEffect for real-time updates: reset service selection if services list changes
  // e.g., if user adds a new service in another part of the app and navigates back
  useEffect(() => {
    if (formData.category === 'Services' && !services.some(s => s.id === formData.selectedServiceId)) {
      setFormData(prev => ({ ...prev, selectedServiceId: '' }));
    }
  }, [services, formData.category, formData.selectedServiceId]);

  const handleProductSelection = (productId: string) => {
    const product = products.find(p => p.id === productId);
    const service = services.find(s => s.id === productId);
    
    if (product) {
      setFormData(prev => ({
        ...prev,
        productId,
        selectedServiceId: '', // Reset service when product selected
        description: product.name,
        amount: product.price.toString(),
        type: 'income',
        category: 'Sales',
      }));
      trackFeature('transactions', 'product_selected');
    } else if (service) {
      // For quick select, also use the new handleServiceSelection logic
      handleServiceSelection(service.id);
    }
  };

  if (success) {
    return (
      <div className={`min-h-screen ${themeClasses.background} flex items-center justify-center`}>
        <div className={`${themeClasses.cardBackground} rounded-2xl shadow-xl p-8 text-center max-w-md mx-4`}>
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Save className="w-8 h-8 text-white" />
          </div>
          <h2 className={`text-2xl font-bold ${themeClasses.text} mb-2`}>{t('transactions.saved')}</h2>
          <p className={themeClasses.textSecondary}>{t('transactions.savedMessage')}</p>
        </div>
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className={`min-h-screen ${themeClasses.background} flex items-center justify-center`}>
        <div className={`${themeClasses.cardBackground} rounded-2xl shadow-xl p-8 text-center max-w-md mx-4`}>
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 mb-4">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className={themeClasses.text}>Loading transaction form...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${themeClasses.background} flex items-center justify-center`}>
        <div className={`${themeClasses.cardBackground} rounded-2xl shadow-xl p-8 text-center max-w-md mx-4`}>
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className={`text-2xl font-bold ${themeClasses.text} mb-2`}>Error Loading Form</h2>
          <p className={themeClasses.textSecondary}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClasses.background}`}>
      <header className={`${themeClasses.cardBackground} shadow-sm ${themeClasses.border} border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate('/dashboard')}
              className={`mr-4 p-2 ${themeClasses.textSecondary} hover:${themeClasses.text} ${themeClasses.hover} rounded-lg transition-colors`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <UzajiLogo size="md" className="mr-4" />
            <h1 className={`text-xl font-bold ${themeClasses.text}`}>{t('transactions.title')}</h1>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm ${themeClasses.border} border p-6`}>
          {/* Error display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                <span className={`text-sm ${themeClasses.textSecondary}`}>{error}</span>
              </div>
            </div>
          )}

          {/* Quick Select from Products/Services */}
          {!isLegalFirm && (products.length > 0 || services.length > 0) && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3 flex items-center">
                <Package className="w-4 h-4 mr-2" />
                {t('transactions.quickSelect')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {products.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleProductSelection(product.id)}
                    className={`text-left p-3 ${themeClasses.cardBackground} rounded-lg border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 shadow-sm hover:shadow-md`}
                  >
                    <div className={`font-medium text-sm ${themeClasses.text}`}>{product.name}</div>
                    <div className={`text-xs ${themeClasses.textSecondary}`}>{formatCurrency(product.price)}</div>
                  </button>
                ))}
                {services.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => handleProductSelection(service.id)}
                    className={`text-left p-3 ${themeClasses.cardBackground} rounded-lg border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 shadow-sm hover:shadow-md`}
                  >
                    <div className={`font-medium text-sm ${themeClasses.text}`}>{service.name}</div>
                    <div className={`text-xs ${themeClasses.textSecondary}`}>{formatCurrency(service.hourlyRate)}/hr</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="type" className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                {t('transactions.type')}
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, type: e.target.value as 'income' | 'expense', category: '' }));
                  trackFeature('transactions', 'type_changed', e.target.value);
                }}
                className={`w-full px-4 py-3 ${themeClasses.border} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${themeClasses.cardBackground} ${themeClasses.text}`}
                required
              >
                <option value="income">{t('transactions.income')}</option>
                <option value="expense">{t('transactions.expense')}</option>
              </select>
            </div>

            <div>
              <label htmlFor="description" className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                {t('transactions.description')}
              </label>
              <input
                type="text"
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className={`w-full px-4 py-3 ${themeClasses.border} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${themeClasses.cardBackground} ${themeClasses.text}`}
                placeholder={t('transactions.enterDescription')}
                required
              />
            </div>

            <div>
              <label htmlFor="amount" className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                {t('transactions.amount')}
              </label>
              <input
                type="number"
                id="amount"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className={`w-full px-4 py-3 ${themeClasses.border} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${themeClasses.cardBackground} ${themeClasses.text}`}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div>
              <label htmlFor="category" className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                {t('transactions.category')}
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => {
                  handleCategoryChange(e.target.value);
                }}
                className={`w-full px-4 py-3 ${themeClasses.border} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${themeClasses.cardBackground} ${themeClasses.text}`}
                required
              >
                <option value="">{t('transactions.selectCategory')}</option>
                {categories[formData.type].map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Dynamic Services Dropdown - Only shows when category is 'Services' */}
            {formData.category === 'Services' && (
              <div>
                <label htmlFor="service" className={`block text-sm font-medium ${themeClasses.text} mb-2 flex items-center`}>
                  <Package className="w-4 h-4 mr-2" />
                  Select Service
                </label>
                {services.length > 0 ? (
                  <select
                    id="service"
                    value={formData.selectedServiceId}
                    onChange={(e) => handleServiceSelection(e.target.value)}
                    className={`w-full px-4 py-3 ${themeClasses.border} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${themeClasses.cardBackground} ${themeClasses.text}`}
                  >
                    <option value="">Select a service</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} - {formatCurrency(service.hourlyRate)}/hr
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className={`p-4 ${themeClasses.cardBackground} border ${themeClasses.border} rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800`}>
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      <span className={`text-sm ${themeClasses.text}`}>
                        No services available.{' '}
                        <button
                          type="button"
                          onClick={() => navigate('/products')}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          Add your first service
                        </button>
                      </span>
                    </div>
                  </div>
                )}
                {/* Form validation integration: Show warning if service not selected but category is Services */}
                {formData.category === 'Services' && !formData.selectedServiceId && (
                  <p className={`text-xs ${themeClasses.textSecondary} mt-1`}>
                    Selecting a service will auto-populate the description and amount fields.
                  </p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="account" className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                {t('transactions.account')}
              </label>
              <select
                id="account"
                value={formData.account}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, account: e.target.value }));
                  trackFeature('transactions', 'account_selected');
                }}
                className={`w-full px-4 py-3 ${themeClasses.border} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${themeClasses.cardBackground} ${themeClasses.text}`}
                required
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({formatCurrency(account.currentBalance || 0)})
                  </option>
                ))}
              </select>
            </div>

            {/* Client Selection (Optional for non-General Small Business types) */}
            {businessType !== 'general' && (
              <div>
                <label htmlFor="client" className={`block text-sm font-medium ${themeClasses.text} mb-2 flex items-center`}>
                  <User className="w-4 h-4 mr-2" />
                  {t('') || 'Client (Optional)'}
                </label>
                
                {clients.length === 0 ? (
                  <div className={`p-4 ${themeClasses.cardBackground} border ${themeClasses.border} rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800`}>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${themeClasses.text}`}>
                          {t('') || 'No clients available'}
                        </p>
                        <p className={`text-sm ${themeClasses.textSecondary} mt-1`}>
                          {t('') || 'You can still create transactions without linking to a client, or add your first client to start tracking client-specific transactions.'}
                        </p>
                        <button
                          type="button"
                          onClick={() => navigate('/clients')}
                          className="mt-3 inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-100 dark:bg-blue-900/20 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800/30 transition-colors"
                        >
                          {t('') || 'Add First Client'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <select
                      id="client"
                      value={formData.clientId}
                      onChange={(e) => handleClientChange(e.target.value)}
                      className={`w-full px-4 py-3 ${themeClasses.border} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${themeClasses.cardBackground} ${themeClasses.text}`}
                    >
                      <option value="">{t('') || 'No Client / Select a client'}</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                    <p className={`text-xs ${themeClasses.textSecondary} mt-1`}>
                      {t('') || 'Client linking is optional. Leave unselected for general transactions.'}
                    </p>

                    {/* Enhanced Client Display Preview */}
                    {formData.clientId && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <label className={`block text-sm font-semibold ${themeClasses.text} mb-1 flex items-center`}>
                          <User className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                          {t('') || 'Selected Client'}
                        </label>
                        {(() => {
                          const selectedClient = clients.find(c => c.id === formData.clientId);
                          const displayName = selectedClient?.name || t('clients.unknownClient') || 'Unknown Client';
                          const truncatedName = displayName.length > 30 ? `${displayName.substring(0, 30)}...` : displayName;
                          return (
                            <div
                              className={`inline-flex items-center px-3 py-2 bg-white dark:bg-gray-800 rounded-md shadow-sm border ${themeClasses.border} text-sm font-bold ${themeClasses.text} max-w-full overflow-hidden`}
                              title={displayName}
                              style={{
                                whiteSpace: 'nowrap',
                                textOverflow: 'ellipsis',
                                wordBreak: 'keep-all'
                              }}
                            >
                              {truncatedName}
                            </div>
                          );
                        })()}
                        <p className={`text-xs ${themeClasses.textSecondary} mt-1`}>
                          {t('') || 'This client will be linked to the transaction for tracking purposes.'}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {formData.clientId && clientFiles.length > 0 && businessType !== 'general' && (
              <div>
                <label htmlFor="clientFile" className={`block text-sm font-medium ${themeClasses.text} mb-2 flex items-center`}>
                  <FileText className="w-4 h-4 mr-2" />
                  {t('clients.clientFile') || 'Client File'}
                </label>
                <select
                  id="clientFile"
                  value={formData.clientFileId}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientFileId: e.target.value }))}
                  className={`w-full px-4 py-3 ${themeClasses.border} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${themeClasses.cardBackground} ${themeClasses.text}`}
                >
                  <option value="">{t('clients.selectFile') || 'Select a file'}</option>
                  {clientFiles.map((file) => (
                    <option key={file.id} value={file.id}>
                      {file.fileName} - {file.status}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="date" className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                {t('transactions.date')}
              </label>
              <input
                type="date"
                id="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className={`w-full px-4 py-3 ${themeClasses.border} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${themeClasses.cardBackground} ${themeClasses.text}`}
                required
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => {
                  trackFeature('transactions', 'form_cancel');
                  navigate('/dashboard');
                }}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-3 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <span>{t('transactions.saving')}</span>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{t('transactions.saveTransaction')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}