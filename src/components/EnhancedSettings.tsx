import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Building, 
  Tag, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  AlertCircle,
  Check,
  Settings as SettingsIcon,
  Shield,
  Download,
  Upload
} from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { 
  getCurrentBusinessConfig, 
  updateCurrentBusinessConfig,
  getBusinessType 
} from '../utils/businessConfig';
import { 
  getExpenseCategories, 
  addExpenseCategory, 
  updateExpenseCategory, 
  deleteExpenseCategory 
} from '../utils/database';
import type { BusinessConfig, ExpenseCategory } from '../utils/database';

interface EnhancedSettingsProps {
  user?: any;
  onLogout?: () => void;
  onBack?: () => void;
  className?: string;
}

interface BusinessProfileForm {
  name: string;
  type: 'general' | 'legal';
}

interface CategoryForm {
  name: string;
  description: string;
}

interface FormErrors {
  name?: string;
  description?: string;
}

export function EnhancedSettings({ user, onLogout, onBack, className = '' }: EnhancedSettingsProps) {
  const { settings, getThemeClasses, updateSettings } = useSettings();
  const themeClasses = getThemeClasses();
  
  const [businessConfig, setBusinessConfig] = useState<BusinessConfig | null>(null);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'categories' | 'preferences' | 'security'>('profile');
  
  // Business Profile Form
  const [profileForm, setProfileForm] = useState<BusinessProfileForm>({
    name: '',
    type: 'general'
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileErrors, setProfileErrors] = useState<FormErrors>({});
  
  // Category Management
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>({
    name: '',
    description: ''
  });
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [categoryErrors, setCategoryErrors] = useState<FormErrors>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [config, businessType] = await Promise.all([
        getCurrentBusinessConfig(),
        getBusinessType()
      ]);
      
      if (config) {
        setBusinessConfig(config);
        setProfileForm({
          name: config.name,
          type: config.type
        });
      }
      
      if (businessType) {
        const categories = await getExpenseCategories(businessType);
        setExpenseCategories(categories);
      }
    } catch (err) {
      console.error('Failed to load settings data:', err);
      setError('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const validateProfileForm = (): boolean => {
    const errors: FormErrors = {};
    
    if (!profileForm.name.trim()) {
      errors.name = 'Business name is required';
    } else if (profileForm.name.trim().length < 2) {
      errors.name = 'Business name must be at least 2 characters';
    }
    
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateCategoryForm = (): boolean => {
    const errors: FormErrors = {};
    
    if (!categoryForm.name.trim()) {
      errors.name = 'Category name is required';
    } else if (categoryForm.name.trim().length < 2) {
      errors.name = 'Category name must be at least 2 characters';
    }
    
    if (!categoryForm.description.trim()) {
      errors.description = 'Description is required';
    }
    
    setCategoryErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateProfileForm()) return;

    setIsSavingProfile(true);
    try {
      const result = await updateCurrentBusinessConfig({
        name: profileForm.name.trim(),
        type: profileForm.type
      });

      if (result.success) {
        setIsEditingProfile(false);
        await loadData(); // Reload to get updated data
      } else {
        setProfileErrors({ name: result.error || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      setProfileErrors({ name: 'Failed to save profile. Please try again.' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveCategory = async () => {
    if (!validateCategoryForm()) return;

    setIsSavingCategory(true);
    try {
      const categoryData = {
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim(),
        isDefault: false,
        businessType: businessConfig?.type || 'general',
        encrypted: false
      };

      if (editingCategory) {
        await updateExpenseCategory(editingCategory.id, categoryData);
        setExpenseCategories(prev => prev.map(cat => 
          cat.id === editingCategory.id 
            ? { ...cat, ...categoryData, updatedAt: new Date().toISOString() }
            : cat
        ));
      } else {
        const id = await addExpenseCategory(categoryData);
        const newCategory: ExpenseCategory = {
          ...categoryData,
          id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setExpenseCategories(prev => [...prev, newCategory]);
      }

      resetCategoryForm();
    } catch (error) {
      console.error('Failed to save category:', error);
      setCategoryErrors({ name: 'Failed to save category. Please try again.' });
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      await deleteExpenseCategory(categoryId);
      setExpenseCategories(prev => prev.filter(cat => cat.id !== categoryId));
    } catch (error) {
      console.error('Failed to delete category:', error);
      setError('Failed to delete category');
    }
  };

  const handleEditCategory = (category: ExpenseCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || ''
    });
    setShowCategoryForm(true);
  };

  const resetCategoryForm = () => {
    setCategoryForm({ name: '', description: '' });
    setEditingCategory(null);
    setShowCategoryForm(false);
    setCategoryErrors({});
  };

  const exportData = () => {
    // This would export user data - placeholder for now
    console.log('Export data functionality would be implemented here');
  };

  const importData = () => {
    // This would import user data - placeholder for now
    console.log('Import data functionality would be implemented here');
  };

  if (isLoading) {
    return (
      <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
        <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm p-8`}>
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mr-3" />
            <span className={themeClasses.textSecondary}>Loading settings...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
      <div className="mb-8 flex items-center">
        {onBack && (
          <button 
            onClick={onBack}
            className="mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage your account and preferences</p>
        </div>
      </div>

      <div className="flex items-center space-x-3 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
          <SettingsIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className={`text-2xl font-bold ${themeClasses.text}`}>Settings</h1>
          <p className={`${themeClasses.textSecondary}`}>
            Manage your business profile and preferences
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 mb-8">
        {[
          { id: 'profile', label: 'Business Profile', icon: Building },
          { id: 'categories', label: 'Expense Categories', icon: Tag },
          { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
          { id: 'security', label: 'Security & Data', icon: Shield }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : `${themeClasses.textSecondary} hover:${themeClasses.text} ${themeClasses.hover}`
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm border ${themeClasses.border}`}>
        {/* Business Profile Tab */}
        {activeTab === 'profile' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-lg font-semibold ${themeClasses.text}`}>
                Business Profile
              </h2>
              {!isEditingProfile && (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>

            {isEditingProfile ? (
              <div className="space-y-6">
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                    Business Name *
                  </label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      profileErrors.name ? 'border-red-300 bg-red-50' : `border-gray-300 ${themeClasses.cardBackground}`
                    }`}
                    placeholder="Enter your business name"
                  />
                  {profileErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{profileErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                    Business Type
                  </label>
                  <select
                    value={profileForm.type}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, type: e.target.value as 'general' | 'legal' }))}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.cardBackground}`}
                  >
                    <option value="general">General Small Business</option>
                    <option value="legal">Legal Firm</option>
                  </select>
                  <p className={`mt-1 text-sm ${themeClasses.textSecondary}`}>
                    Changing business type will affect available categories and features
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                    className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingProfile ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingProfile(false);
                      setProfileForm({
                        name: businessConfig?.name || '',
                        type: businessConfig?.type || 'general'
                      });
                      setProfileErrors({});
                    }}
                    className={`px-4 py-3 ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-1`}>
                      Business Name
                    </label>
                    <p className={`text-lg font-medium ${themeClasses.text}`}>
                      {businessConfig?.name || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-1`}>
                      Business Type
                    </label>
                    <p className={`text-lg font-medium ${themeClasses.text} capitalize`}>
                      {businessConfig?.type === 'legal' ? 'Legal Firm' : 'General Small Business'}
                    </p>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-1`}>
                      Setup Date
                    </label>
                    <p className={`text-lg font-medium ${themeClasses.text}`}>
                      {businessConfig?.onboardingDate 
                        ? new Date(businessConfig.onboardingDate).toLocaleDateString()
                        : 'Not available'
                      }
                    </p>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-1`}>
                      User Account
                    </label>
                    <p className={`text-lg font-medium ${themeClasses.text}`}>
                      {user?.name || 'Not available'}
                    </p>
                    <p className={`text-sm ${themeClasses.textSecondary}`}>
                      {user?.email || 'Not available'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Expense Categories Tab */}
        {activeTab === 'categories' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-lg font-semibold ${themeClasses.text}`}>
                Expense Categories
              </h2>
              <button
                onClick={() => setShowCategoryForm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {expenseCategories.map((category) => (
                <div key={category.id} className={`p-4 border rounded-lg ${themeClasses.border} ${themeClasses.hover} transition-colors`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className={`font-medium ${themeClasses.text} mb-1`}>
                        {category.name}
                        {category.isDefault && (
                          <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                            Default
                          </span>
                        )}
                      </h3>
                      <p className={`text-sm ${themeClasses.textSecondary}`}>
                        {category.description}
                      </p>
                    </div>
                    {!category.isDefault && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className={`p-1 ${themeClasses.textSecondary} hover:${themeClasses.text} rounded transition-colors`}
                          title="Edit category"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="p-1 text-red-500 hover:text-red-700 rounded transition-colors"
                          title="Delete category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {expenseCategories.length === 0 && (
              <div className="text-center py-8">
                <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className={`text-lg font-medium ${themeClasses.text} mb-2`}>
                  No expense categories
                </h3>
                <p className={`${themeClasses.textSecondary} mb-4`}>
                  Add your first expense category to organize your business expenses.
                </p>
                <button
                  onClick={() => setShowCategoryForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add First Category
                </button>
              </div>
            )}
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="p-6">
            <h2 className={`text-lg font-semibold ${themeClasses.text} mb-6`}>
              Application Preferences
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  Theme
                </label>
                <select
                  value={settings.theme}
                  onChange={(e) => updateSettings({ theme: e.target.value as any })}
                  className={`w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.cardBackground}`}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  Currency
                </label>
                <select
                  value={settings.currency}
                  onChange={(e) => updateSettings({ currency: e.target.value })}
                  className={`w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.cardBackground}`}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD ($)</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  Date Format
                </label>
                <select
                  value={settings.dateFormat}
                  onChange={(e) => updateSettings({ dateFormat: e.target.value as any })}
                  className={`w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.cardBackground}`}
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.text} mb-1`}>
                    Compact View
                  </label>
                  <p className={`text-sm ${themeClasses.textSecondary}`}>
                    Use smaller spacing and components
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.compactView}
                  onChange={(e) => updateSettings({ compactView: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Security & Data Tab */}
        {activeTab === 'security' && (
          <div className="p-6">
            <h2 className={`text-lg font-semibold ${themeClasses.text} mb-6`}>
              Security & Data Management
            </h2>
            
            <div className="space-y-6">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-green-600" />
                  <div>
                    <h3 className="font-medium text-green-900 dark:text-green-100">
                      Your Data is Secure
                    </h3>
                    <p className="text-green-800 dark:text-green-200 text-sm mt-1">
                      All your financial data is encrypted and stored locally on your device. 
                      We never send your sensitive information to external servers.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={exportData}
                  className={`p-4 border rounded-lg ${themeClasses.border} ${themeClasses.hover} transition-colors text-left`}
                >
                  <div className="flex items-center space-x-3">
                    <Download className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className={`font-medium ${themeClasses.text}`}>Export Data</h3>
                      <p className={`text-sm ${themeClasses.textSecondary}`}>
                        Download your data as a backup file
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={importData}
                  className={`p-4 border rounded-lg ${themeClasses.border} ${themeClasses.hover} transition-colors text-left`}
                >
                  <div className="flex items-center space-x-3">
                    <Upload className="w-5 h-5 text-green-600" />
                    <div>
                      <h3 className={`font-medium ${themeClasses.text}`}>Import Data</h3>
                      <p className={`text-sm ${themeClasses.textSecondary}`}>
                        Restore data from a backup file
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              <div className="border-t pt-6">
                <h3 className={`font-medium ${themeClasses.text} mb-4`}>Account Actions</h3>
                <button
                  onClick={onLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Category Form Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${themeClasses.cardBackground} rounded-2xl shadow-2xl max-w-md w-full`}>
            <div className={`p-6 border-b ${themeClasses.border}`}>
              <h2 className={`text-xl font-bold ${themeClasses.text}`}>
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  Category Name *
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    categoryErrors.name ? 'border-red-300 bg-red-50' : `border-gray-300 ${themeClasses.cardBackground}`
                  }`}
                  placeholder="Enter category name"
                />
                {categoryErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{categoryErrors.name}</p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  Description *
                </label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    categoryErrors.description ? 'border-red-300 bg-red-50' : `border-gray-300 ${themeClasses.cardBackground}`
                  }`}
                  placeholder="Enter category description"
                  rows={3}
                />
                {categoryErrors.description && (
                  <p className="mt-1 text-sm text-red-600">{categoryErrors.description}</p>
                )}
              </div>
            </div>

            <div className={`p-6 border-t ${themeClasses.border} flex items-center justify-end space-x-3`}>
              <button
                onClick={resetCategoryForm}
                className={`px-4 py-2 ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}
                disabled={isSavingCategory}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCategory}
                disabled={isSavingCategory}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingCategory ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{editingCategory ? 'Update' : 'Add'} Category</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}