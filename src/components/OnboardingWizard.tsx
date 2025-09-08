import { useState, useEffect } from 'react';
import { useSettings } from '../hooks/useSettings';
import { Building2, Scale, ArrowRight, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { UzajiLogo } from './UzajiLogo';
import { completeOnboarding, getDefaultExpenseCategories } from '../utils/businessConfig';
import type { BusinessConfig, ExpenseCategory } from '../utils/database';

type BusinessType = 'general' | 'legal';

interface OnboardingWizardProps {
  initialBusinessType?: BusinessType;
  onComplete: (config: BusinessConfig) => void;
  onBack: () => void;
  isOpen: boolean;
  skipBusinessTypeSelection?: boolean;
}

interface FormData {
  businessType: BusinessType;
  businessName: string;
  selectedCategories: string[];
}

interface ValidationErrors {
  businessName?: string;
  businessType?: string;
}

export function OnboardingWizard({ 
  initialBusinessType = 'general',
  onComplete, 
  onBack, 
  isOpen, 
  skipBusinessTypeSelection = false 
}: OnboardingWizardProps) {
  const { getThemeClasses } = useSettings();
  const themeClasses = getThemeClasses();
  const [currentStep, setCurrentStep] = useState(skipBusinessTypeSelection ? 2 : 1);
  const [formData, setFormData] = useState<FormData>({
    businessType: initialBusinessType,
    businessName: '',
    selectedCategories: [],
  });
  const [availableCategories, setAvailableCategories] = useState<ExpenseCategory[]>([]);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = skipBusinessTypeSelection ? 3 : 4;

  useEffect(() => {
    if (isOpen && formData.businessType) {
      loadDefaultCategories();
    }
  }, [isOpen, formData.businessType]);

  const loadDefaultCategories = async () => {
    try {
      setIsLoading(true);
      const categories = await getDefaultExpenseCategories(formData.businessType);
      setAvailableCategories(categories);
      // Pre-select default categories
      setFormData(prev => ({
        ...prev,
        selectedCategories: categories.filter(cat => cat.isDefault).map(cat => cat.id)
      }));
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: ValidationErrors = {};

    if (step === 3) { // Business name step is now step 3
      if (!formData.businessName.trim()) {
        newErrors.businessName = 'Business name is required';
      } else if (formData.businessName.trim().length < 2) {
        newErrors.businessName = 'Business name must be at least 2 characters';
      } else if (formData.businessName.trim().length > 100) {
        newErrors.businessName = 'Business name must be less than 100 characters';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleBusinessTypeSelect = (type: BusinessType) => {
    setFormData(prev => ({ ...prev, businessType: type }));
  };

  const handleCategoryToggle = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(categoryId)
        ? prev.selectedCategories.filter(id => id !== categoryId)
        : [...prev.selectedCategories, categoryId]
    }));
  };

  const handleComplete = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    try {
      const result = await completeOnboarding(formData.businessType, formData.businessName.trim());
      
      if (result.success && result.configId) {
        // Create a mock config object for the callback
        const mockConfig: BusinessConfig = {
          id: result.configId,
          type: formData.businessType,
          name: formData.businessName.trim(),
          setupComplete: true,
          onboardingDate: new Date().toISOString(),
          defaultCategories: availableCategories.filter(cat => 
            formData.selectedCategories.includes(cat.id)
          ),
          accounts: [],
          uiPreferences: {
            dashboardLayout: formData.businessType === 'legal' ? 'legal' : 'standard',
            compactView: false,
            defaultTransactionType: 'income',
            showProFeatures: true,
          },
          encrypted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        onComplete(mockConfig);
      } else {
        setErrors({ businessName: result.error || 'Failed to complete setup' });
      }
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      setErrors({ businessName: 'An unexpected error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const businessTypeInfo = {
    general: {
      title: 'General Small Business',
      icon: Building2,
      color: 'from-blue-600 to-indigo-600',
      description: 'Perfect for retail, services, consulting, and most business types.'
    },
    legal: {
      title: 'Legal Firm',
      icon: Scale,
      color: 'from-purple-600 to-pink-600',
      description: 'Specialized features for law firms, attorneys, and legal professionals.'
    }
  };

  const typeInfo = businessTypeInfo[formData.businessType];
  const Icon = typeInfo.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${themeClasses.cardBackground} rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className={`p-6 border-b ${themeClasses.border}`}>
          <div className="flex items-center justify-between mb-4">
            <UzajiLogo size="md" />
            <div className={`flex items-center space-x-2 text-sm ${themeClasses.textSecondary}`}>
              <span>Step {currentStep} of {totalSteps}</span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className={`w-full ${themeClasses.background} rounded-full h-2`}>
            <div 
              className={`${themeClasses.accent} h-2 rounded-full transition-all duration-300`}
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Business Type Selection */}
          {currentStep === 1 && (
            <div>
              <h2 className={`text-2xl font-bold ${themeClasses.text} mb-2 text-center`}>
                What type of business are you?
              </h2>
              <p className={`${themeClasses.textSecondary} mb-8 text-center`}>
                Choose your business type to get started with the right features and categories.
              </p>
              
              <div className="space-y-4">
                {Object.entries(businessTypeInfo).map(([type, info]) => {
                  const BusinessIcon = info.icon;
                  const isSelected = formData.businessType === type;
                  
                  return (
                    <button
                      key={type}
                      onClick={() => handleBusinessTypeSelect(type as BusinessType)}
                      className={`w-full p-6 border-2 rounded-xl transition-all duration-200 text-left ${
                        isSelected 
                          ? `border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg` 
                          : `${themeClasses.border} ${themeClasses.hover} hover:shadow-md`
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${info.color} flex items-center justify-center flex-shrink-0 shadow-md`}>
                          <BusinessIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className={`text-lg font-semibold ${themeClasses.text} mb-1`}>
                            {info.title}
                          </h3>
                          <p className={`${themeClasses.textSecondary} text-sm`}>
                            {info.description}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="flex-shrink-0">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Confirmation */}
          {currentStep === 2 && (
            <div className="text-center">
              <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${typeInfo.color} flex items-center justify-center shadow-lg`}>
                <Icon className="w-10 h-10 text-white" />
              </div>
              <h2 className={`text-2xl font-bold ${themeClasses.text} mb-2`}>
                Perfect Choice!
              </h2>
              <p className={`${themeClasses.textSecondary} mb-6`}>
                You've selected <strong>{typeInfo.title}</strong>. Let's set up your workspace with the right tools and categories for your business.
              </p>
              <div className={`${themeClasses.background} rounded-lg p-4 text-left`}>
                <h3 className={`font-semibold ${themeClasses.text} mb-2`}>What's included:</h3>
                <ul className={`space-y-2 text-sm ${themeClasses.textSecondary}`}>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    Customized expense categories for your business type
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    Optimized dashboard layout
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    Relevant reporting features
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    Secure local data storage
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 3: Business Name */}
          {currentStep === 3 && (
            <div>
              <h2 className={`text-2xl font-bold ${themeClasses.text} mb-2`}>
                What's your business name?
              </h2>
              <p className={`${themeClasses.textSecondary} mb-6`}>
                This will appear on your dashboard and can be changed later in settings.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="businessName" className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                    Business Name *
                  </label>
                  <input
                    type="text"
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, businessName: e.target.value }));
                      if (errors.businessName) {
                        setErrors(prev => ({ ...prev, businessName: undefined }));
                      }
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${themeClasses.cardBackground} ${ 
                      errors.businessName ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : themeClasses.border
                    }`}
                    placeholder="Enter your business name"
                    maxLength={100}
                    autoFocus
                  />
                  {errors.businessName && (
                    <div className="mt-2 flex items-center text-red-600 dark:text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                      {errors.businessName}
                    </div>
                  )}
                </div>

                <div className={`bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800`}>
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">i</span>
                    </div>
                    <div>
                      <h4 className={`font-semibold text-blue-900 dark:text-blue-200 mb-1`}>
                        Privacy & Security
                      </h4>
                      <p className={`text-blue-800 dark:text-blue-300 text-sm`}>
                        Your business information is stored locally on your device and encrypted for security. We never send your data to external servers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Categories */}
          {currentStep === 4 && (
            <div>
              <h2 className={`text-2xl font-bold ${themeClasses.text} mb-2`}>
                Choose your expense categories
              </h2>
              <p className={`${themeClasses.textSecondary} mb-6`}>
                We've pre-selected common categories for {formData.businessType === 'legal' ? 'legal firms' : 'small businesses'}. You can customize these anytime.
              </p>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className={`w-6 h-6 border-2 ${themeClasses.border} border-t-blue-600 rounded-full animate-spin mr-3`} />
                  <span className={`${themeClasses.textSecondary}`}>Loading categories...</span>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {availableCategories.map((category) => (
                    <label
                      key={category.id}
                      className={`flex items-center p-3 border ${themeClasses.border} rounded-lg ${themeClasses.hover} cursor-pointer transition-colors`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.selectedCategories.includes(category.id)}
                        onChange={() => handleCategoryToggle(category.id)}
                        className={`w-4 h-4 text-blue-600 ${themeClasses.border} rounded focus:ring-blue-500`}
                      />
                      <div className="ml-3 flex-1">
                        <div className={`font-medium ${themeClasses.text}`}>{category.name}</div>
                        {category.description && (
                          <div className={`text-sm ${themeClasses.textSecondary}`}>{category.description}</div>
                        )}
                      </div>
                      {category.isDefault && (
                        <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 px-2 py-1 rounded-full">
                          Recommended
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              )}

              <div className={`mt-4 text-sm ${themeClasses.textSecondary}`}>
                Selected {formData.selectedCategories.length} categories. You can add more categories later in Settings.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-6 border-t ${themeClasses.border} flex items-center justify-between`}>
          <button
            onClick={currentStep === 1 ? onBack : handlePrevious}
            className={`flex items-center px-4 py-2 ${themeClasses.textSecondary} hover:text-gray-800 dark:hover:text-gray-200 transition-colors`}
            disabled={isSubmitting}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {currentStep === 1 ? 'Back' : 'Previous'}
          </button>

          <div className="flex items-center space-x-3">
            {currentStep < totalSteps ? (
              <button
                onClick={handleNext}
                disabled={isLoading}
                className={`flex items-center px-6 py-2 ${themeClasses.accent} ${themeClasses.accentText} rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={isSubmitting || isLoading}
                className={`flex items-center px-6 py-2 ${themeClasses.accent} ${themeClasses.accentText} rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Setting up...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <Check className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}