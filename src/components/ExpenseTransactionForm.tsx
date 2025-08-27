import React, { useState, useEffect } from 'react';
import { 
  TrendingDown, 
  X, 
  Calendar, 
  DollarSign, 
  FileText, 
  Building, 
  Tag, 
  CreditCard,
  Paperclip,
  AlertCircle,
  Check,
  ArrowLeft,
  Plus
} from 'lucide-react';
import { UzajiLogo } from './UzajiLogo';
import { useSettings } from '../hooks/useSettings';
import { addTransaction, getExpenseCategories, getDefaultAccount, addExpenseCategory } from '../utils/database';
import { getBusinessType } from '../utils/businessConfig';
import type { ExpenseCategory, Account } from '../utils/database';

interface ExpenseTransactionFormProps {
  onSubmit: (transaction: ExpenseTransaction) => void;
  onCancel: () => void;
  onBack?: () => void;
  isOpen: boolean;
  businessType?: 'general' | 'legal';
}

interface ExpenseTransaction {
  date: string;
  amount: number;
  description: string;
  vendor?: string;
  categoryId: string;
  paymentAccount: string;
  attachments?: File[];
}

interface ValidationErrors {
  date?: string;
  amount?: string;
  description?: string;
  vendor?: string;
  categoryId?: string;
  paymentAccount?: string;
}

export function ExpenseTransactionForm({ 
  onSubmit, 
  onCancel, 
  onBack,
  isOpen, 
  businessType = 'general' 
}: ExpenseTransactionFormProps) {
  const { formatCurrency, getThemeClasses } = useSettings();
  const themeClasses = getThemeClasses();
  
  const [formData, setFormData] = useState<ExpenseTransaction>({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    description: '',
    vendor: '',
    categoryId: '',
    paymentAccount: '',
    attachments: []
  });
  
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadFormData();
    }
  }, [isOpen]);

  const loadFormData = async () => {
    try {
      setIsLoading(true);
      const currentBusinessType = await getBusinessType() || businessType;
      const [categoriesData, defaultAccount] = await Promise.all([
        getExpenseCategories(currentBusinessType),
        getDefaultAccount()
      ]);
      
      setCategories(categoriesData);
      
      if (defaultAccount) {
        setFormData(prev => ({ ...prev, paymentAccount: defaultAccount.id }));
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

    if (!formData.categoryId) {
      newErrors.categoryId = 'Please select a category';
    }

    if (!formData.paymentAccount) {
      newErrors.paymentAccount = 'Please select an account';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ExpenseTransaction, value: any) => {
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

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    setIsAddingCategory(true);
    try {
      const currentBusinessType = await getBusinessType() || businessType;
      const categoryId = await addExpenseCategory({
        name: newCategoryName.trim(),
        description: `Custom ${businessType === 'legal' ? 'legal' : 'business'} expense category`,
        isDefault: false,
        businessType: currentBusinessType,
        encrypted: false
      });

      const newCategory: ExpenseCategory = {
        id: categoryId,
        name: newCategoryName.trim(),
        description: `Custom ${businessType === 'legal' ? 'legal' : 'business'} expense category`,
        isDefault: false,
        businessType: currentBusinessType,
        encrypted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setCategories(prev => [...prev, newCategory]);
      setFormData(prev => ({ ...prev, categoryId }));
      setNewCategoryName('');
      setShowNewCategoryForm(false);
    } catch (error) {
      console.error('Failed to add category:', error);
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const selectedCategory = categories.find(cat => cat.id === formData.categoryId);
      
      const transactionData = {
        date: formData.date,
        amount: formData.amount,
        description: formData.description.trim(),
        type: 'expense' as const,
        category: selectedCategory?.name || 'Expense',
        vendor: formData.vendor?.trim() || undefined,
        account: formData.paymentAccount,
        attachments: attachments.map(file => file.name), // Simplified for now
        encrypted: false
      };

      await addTransaction(transactionData);
      
      onSubmit({
        date: formData.date,
        amount: formData.amount,
        description: formData.description.trim(),
        vendor: formData.vendor?.trim() || undefined,
        categoryId: formData.categoryId,
        paymentAccount: formData.paymentAccount,
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

  const selectedCategory = categories.find(cat => cat.id === formData.categoryId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${themeClasses.cardBackground} rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className={`p-6 border-b ${themeClasses.border} flex items-center justify-between`}>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${themeClasses.text}`}>
                Record Expense
              </h1>
              <p className={`${themeClasses.textSecondary}`}>
                {businessType === 'legal' ? 'Business or case-related expense' : 'Business purchase or expense'}
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
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
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
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
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
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                errors.description ? 'border-red-300 bg-red-50' : `border-gray-300 ${themeClasses.cardBackground}`
              }`}
              placeholder={businessType === 'legal' ? 'e.g., Court filing fee - Smith case' : 'e.g., Office supplies purchase'}
              maxLength={200}
            />
            {errors.description && (
              <div className="mt-1 flex items-center text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.description}
              </div>
            )}
          </div>

          {/* Vendor */}
          <div>
            <label htmlFor="vendor" className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
              <Building className="w-4 h-4 inline mr-2" />
              Vendor/Supplier (Optional)
            </label>
            <input
              type="text"
              id="vendor"
              value={formData.vendor}
              onChange={(e) => handleInputChange('vendor', e.target.value)}
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${themeClasses.cardBackground}`}
              placeholder={businessType === 'legal' ? 'e.g., Court Registry, LexisNexis' : 'e.g., Office Depot, Amazon'}
              maxLength={100}
            />
          </div>

          {/* Expense Category */}
          <div>
            <label htmlFor="categoryId" className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
              <Tag className="w-4 h-4 inline mr-2" />
              Expense Category *
            </label>
            
            <div className="flex space-x-2">
              <select
                id="categoryId"
                value={formData.categoryId}
                onChange={(e) => handleInputChange('categoryId', e.target.value)}
                className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                  errors.categoryId ? 'border-red-300 bg-red-50' : `border-gray-300 ${themeClasses.cardBackground}`
                }`}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                    {category.isDefault && ' (Recommended)'}
                  </option>
                ))}
              </select>
              
              <button
                type="button"
                onClick={() => setShowNewCategoryForm(!showNewCategoryForm)}
                className="px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Add new category"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {errors.categoryId && (
              <div className="mt-1 flex items-center text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.categoryId}
              </div>
            )}

            {/* New Category Form */}
            {showNewCategoryForm && (
              <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Enter new category name"
                    className={`flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent ${themeClasses.cardBackground}`}
                    maxLength={50}
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={!newCategoryName.trim() || isAddingCategory}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isAddingCategory ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </div>
            )}

            {selectedCategory && (
              <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">
                  <strong>{selectedCategory.name}</strong>
                  {selectedCategory.description && ` - ${selectedCategory.description}`}
                </p>
              </div>
            )}
          </div>

          {/* Payment Account */}
          <div>
            <label htmlFor="paymentAccount" className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
              <CreditCard className="w-4 h-4 inline mr-2" />
              Paid From Account *
            </label>
            <select
              id="paymentAccount"
              value={formData.paymentAccount}
              onChange={(e) => handleInputChange('paymentAccount', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                errors.paymentAccount ? 'border-red-300 bg-red-50' : `border-gray-300 ${themeClasses.cardBackground}`
              }`}
            >
              <option value="">Select account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.type})
                </option>
              ))}
            </select>
            {errors.paymentAccount && (
              <div className="mt-1 flex items-center text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.paymentAccount}
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
              className={`w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-red-400 transition-colors flex items-center justify-center ${themeClasses.cardBackground}`}
            >
              <Paperclip className="w-5 h-5 mr-2 text-gray-400" />
              <span className={themeClasses.textSecondary}>Click to attach receipts or invoices</span>
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

          {/* Business Type Specific Tips */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              {businessType === 'legal' ? 'Legal Practice Tips:' : 'Business Tips:'}
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              {businessType === 'legal' ? (
                <>
                  <li>• Keep receipts for all court fees and legal research expenses</li>
                  <li>• Consider categorizing expenses by client or case for billing</li>
                  <li>• Professional development and CLE courses are deductible</li>
                </>
              ) : (
                <>
                  <li>• Keep receipts for all business expenses for tax deductions</li>
                  <li>• Separate personal and business expenses clearly</li>
                  <li>• Consider mileage tracking for business travel</li>
                </>
              )}
            </ul>
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
            className="flex items-center px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Record Expense
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}