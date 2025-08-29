import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { addTransaction } from '../utils/database';
import { getProducts, getServices } from '../utils/database';
import { UzajiLogo } from './UzajiLogo';
import { useSettings } from '../hooks/useSettings';
import { useTranslation } from '../hooks/useTranslation';
import { trackBusiness, trackFeature } from '../utils/analytics';
import { getAccounts } from '../utils/database';
import type { Product, Service, Account } from '../utils/database';

interface TransactionFormProps {
  transactionToEdit?: Transaction | null;
}

export function TransactionForm({ transactionToEdit }: TransactionFormProps) {
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
    account: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const categories = {
    income: ['Sales', 'Services', 'Consulting', 'Royalties', 'Other Income'],
    expense: ['Office Supplies', 'Marketing', 'Travel', 'Utilities', 'Professional Services', 'Other Expenses'],
  };

  useEffect(() => {
    loadInitialData();
    // Track page view
    trackFeature('transactions', 'form_view');
  }, []);

  const loadInitialData = async () => {
    try {
      const [productsData, servicesData, accountsData] = await Promise.all([
        getProducts(),
        getServices(),
        getAccounts(),
      ]);
      setProducts(productsData);
      setServices(servicesData);
      setAccounts(accountsData);

      if (accountsData.length > 0) {
        const defaultAccount = accountsData.find(acc => acc.isDefault);
        setFormData(prev => ({
          ...prev,
          account: defaultAccount ? defaultAccount.id : accountsData[0].id,
        }));
      }
    } catch (error) {
      console.error('Failed to load initial data for transaction form:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await addTransaction({
        description: formData.description,
        amount: parseFloat(formData.amount),
        type: formData.type,
        category: formData.category,
        productId: formData.productId || undefined,
        account: formData.account,
        date: formData.date,
        encrypted: true,
      });

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

  const handleProductSelection = (productId: string) => {
    const product = products.find(p => p.id === productId);
    const service = services.find(s => s.id === productId);
    
    if (product) {
      setFormData(prev => ({
        ...prev,
        productId,
        description: product.name,
        amount: product.price.toString(),
        type: 'income',
        category: 'Sales',
      }));
      trackFeature('transactions', 'product_selected');
    } else if (service) {
      setFormData(prev => ({
        ...prev,
        productId,
        description: service.name,
        amount: service.hourlyRate.toString(),
        type: 'income',
        category: 'Services',
      }));
      trackFeature('transactions', 'service_selected');
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
          {/* Quick Select from Products/Services */}
          {(products.length > 0 || services.length > 0) && (
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
                  setFormData(prev => ({ ...prev, category: e.target.value }));
                  trackFeature('transactions', 'category_selected', e.target.value);
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
                    {account.name} ({formatCurrency(account.balance)})
                  </option>
                ))}
              </select>
            </div>

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