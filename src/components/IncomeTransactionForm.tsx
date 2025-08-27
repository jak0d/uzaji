import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  X, 
  Calendar, 
  DollarSign, 
  FileText, 
  User, 
  Package, 
  CreditCard,
  Paperclip,
  AlertCircle,
  Check,
  ArrowLeft
} from 'lucide-react';
import { UzajiLogo } from './UzajiLogo';
import { useSettings } from '../hooks/useSettings';
import { addTransaction, getProducts, getServices, getDefaultAccount } from '../utils/database';
import type { Product, Service, Account } from '../utils/database';

interface IncomeTransactionFormProps {
  onSubmit: (transaction: IncomeTransaction) => void;
  onCancel: () => void;
  onBack?: () => void;
  isOpen: boolean;
  businessType?: 'general' | 'legal';
}

interface IncomeTransaction {
  date: string;
  amount: number;
  description: string;
  customer?: string;
  productServiceId?: string;
  depositAccount: string;
  attachments?: File[];
}

interface FormData extends IncomeTransaction {
  productServiceType: 'product' | 'service' | 'other';
}

interface ValidationErrors {
  date?: string;
  amount?: string;
  description?: string;
  customer?: string;
  productServiceId?: string;
  depositAccount?: string;
}

export function IncomeTransactionForm({ 
  onSubmit, 
  onCancel, 
  onBack,
  isOpen, 
  businessType = 'general' 
}: IncomeTransactionFormProps) {
  const { formatCurrency, getThemeClasses } = useSettings();
  const themeClasses = getThemeClasses();
  
  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    description: '',
    customer: '',
    productServiceId: '',
    productServiceType: 'other',
    depositAccount: '',
    attachments: []
  });
  
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadFormData();
    }
  }, [isOpen]);

  const loadFormData = async () => {
    try {
      setIsLoading(true);
      const [productsData, servicesData, defaultAccount] = await Promise.all([
        getProducts(),
        getServices(),
        getDefaultAccount()
      ]);
      
      setProducts(productsData);
      setServices(servicesData);
      
      if (defaultAccount) {
        setFormData(prev => ({ ...prev, depositAccount: defaultAccount.id }));
        setAccounts([defaultAccount]);
      }
    } catch (error) {
      console.error('Failed to load form data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 3) {
      newErrors.description = 'Description must be at least 3 characters';
    }

    if (!formData.depositAccount) {
      newErrors.depositAccount = 'Please select an account';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFileAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const transactionData = {
        date: formData.date,
        amount: formData.amount,
        description: formData.description.trim(),
        type: 'income' as const,
        category: 'Income',
        customer: formData.customer?.trim() || undefined,
        productServiceId: formData.productServiceId || undefined,
        account: formData.depositAccount,
        attachments: attachments.map(file => file.name), // Simplified for now
        encrypted: false
      };

      await addTransaction(transactionData);
      
      onSubmit({
        date: formData.date,
        amount: formData.amount,
        description: formData.description.trim(),
        customer: formData.customer?.trim() || undefined,
        productServiceId: formData.productServiceId || undefined,
        depositAccount: formData.depositAccount,
        attachments
      });
    } catch (error) {
      console.error('Failed to save transaction:', error);
      setErrors({ description: 'Failed to save transaction. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const getProductServiceOptions = () => {
    const options = [];
    
    if (formData.productServiceType === 'product' || formData.productServiceType === 'other') {
      products.forEach(product => {
        options.push({
          id: product.id,
          name: product.name,
          price: product.price,
          type: 'product' as const
        });
      });
    }
    
    if (formData.productServiceType === 'service' || formData.productServiceType === 'other') {
      services.forEach(service => {
        options.push({
          id: service.id,
          name: service.name,
          price: service.hourlyRate,
          type: 'service' as const
        });
      });
    }
    
    return options;
  };

  const selectedProductService = getProductServiceOptions().find(
    option => option.id === formData.productServiceId
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${themeClasses.cardBackground} rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className={`p-6 border-b ${themeClasses.border} flex items-center justify-between`}>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${themeClasses.text}`}>
                Record Income
              </h1>
              <p className={`${themeClasses.textSecondary}`}>
                {businessType === 'legal' ? 'Client payment or legal service income' : 'Sale or revenue transaction'}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className={`p-2 ${themeClasses.textSecondary} hover:${themeClasses.text} ${themeClasses.hover} rounded-lg transition-colors`}
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Date and Amount Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label htmlFor="date" className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                <Calendar className="w-4 h-4 inline mr-2" />
                Date *
              </label>
              <input
                type="date"
                id="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                  errors.date ? 'border-red-300 bg-red-50' : `border-gray-300 ${themeClasses.cardBackground}`
                }`}
                max={new Date().toISOString().split('T')[0]}
              />
              {errors.date && (
                <div className="mt-1 flex items-center text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.date}
                </div>
              )}
            </div>

            {/* Amount */}
            <div>
              <label htmlFor="amount" className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                <DollarSign className="w-4 h-4 inline mr-2" />
                Amount *
              </label>
              <input
                type="number"
                id="amount"
                value={formData.amount || ''}
                onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                  errors.amount ? 'border-red-300 bg-red-50' : `border-gray-300 ${themeClasses.cardBackground}`
                }`}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
              {errors.amount && (
                <div className="mt-1 flex items-center text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.amount}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
              <FileText className="w-4 h-4 inline mr-2" />
              Description *
            </label>
            <input
              type="text"
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                errors.description ? 'border-red-300 bg-red-50' : `border-gray-300 ${themeClasses.cardBackground}`
              }`}
              placeholder={businessType === 'legal' ? 'e.g., Legal consultation fee - Smith case' : 'e.g., Product sale to customer'}
              maxLength={200}
            />
            {errors.description && (
              <div className="mt-1 flex items-center text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.description}
              </div>
            )}
          </div>

          {/* Customer */}
          <div>
            <label htmlFor="customer" className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
              <User className="w-4 h-4 inline mr-2" />
              {businessType === 'legal' ? 'Client Name' : 'Customer Name'} (Optional)
            </label>
            <input
              type="text"
              id="customer"
              value={formData.customer}
              onChange={(e) => handleInputChange('customer', e.target.value)}
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${themeClasses.cardBackground}`}
              placeholder={businessType === 'legal' ? 'e.g., John Smith' : 'e.g., ABC Company'}
              maxLength={100}
            />
          </div>

          {/* Product/Service Selection */}
          <div>
            <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
              <Package className="w-4 h-4 inline mr-2" />
              {businessType === 'legal' ? 'Service Type' : 'Product/Service'} (Optional)
            </label>
            
            {/* Type Selector */}
            <div className="flex space-x-2 mb-3">
              {['product', 'service', 'other'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    handleInputChange('productServiceType', type);
                    handleInputChange('productServiceId', '');
                  }}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    formData.productServiceType === type
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : `${themeClasses.cardBackground} ${themeClasses.textSecondary} border border-gray-300 hover:bg-gray-50`
                  }`}
                >
                  {type === 'other' ? 'Other' : type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            {/* Product/Service Dropdown */}
            {formData.productServiceType !== 'other' && (
              <select
                value={formData.productServiceId}
                onChange={(e) => {
                  handleInputChange('productServiceId', e.target.value);
                  const selected = getProductServiceOptions().find(opt => opt.id === e.target.value);
                  if (selected && !formData.amount) {
                    handleInputChange('amount', selected.price);
                  }
                }}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${themeClasses.cardBackground}`}
              >
                <option value="">Select a {formData.productServiceType}</option>
                {getProductServiceOptions().map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name} - {formatCurrency(option.price)}
                  </option>
                ))}
              </select>
            )}

            {selectedProductService && (
              <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>{selectedProductService.name}</strong> - {formatCurrency(selectedProductService.price)}
                </p>
              </div>
            )}
          </div>

          {/* Deposit Account */}
          <div>
            <label htmlFor="depositAccount" className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
              <CreditCard className="w-4 h-4 inline mr-2" />
              Deposit To Account *
            </label>
            <select
              id="depositAccount"
              value={formData.depositAccount}
              onChange={(e) => handleInputChange('depositAccount', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                errors.depositAccount ? 'border-red-300 bg-red-50' : `border-gray-300 ${themeClasses.cardBackground}`
              }`}
            >
              <option value="">Select account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.type})
                </option>
              ))}
            </select>
            {errors.depositAccount && (
              <div className="mt-1 flex items-center text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.depositAccount}
              </div>
            )}
          </div>

          {/* File Attachments */}
          <div>
            <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
              <Paperclip className="w-4 h-4 inline mr-2" />
              Attach Files (Optional)
            </label>
            <input
              type="file"
              multiple
              onChange={handleFileAttachment}
              className="hidden"
              id="file-upload"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            <label
              htmlFor="file-upload"
              className={`w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-400 transition-colors flex items-center justify-center ${themeClasses.cardBackground}`}
            >
              <Paperclip className="w-5 h-5 mr-2 text-gray-400" />
              <span className={themeClasses.textSecondary}>Click to attach receipts or documents</span>
            </label>
            
            {attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-sm text-gray-600 dark:text-gray-300">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className={`p-6 border-t ${themeClasses.border} flex items-center justify-between`}>
          <button
            type="button"
            onClick={onBack || onCancel}
            className={`flex items-center px-4 py-2 ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}
            disabled={isSubmitting}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {onBack ? 'Back' : 'Cancel'}
          </button>

          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Record Income
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}