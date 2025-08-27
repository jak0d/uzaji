import React, { useState, useEffect } from 'react';
import { Building2, Scale, ArrowRight, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { UzajiLogo } from './UzajiLogo';
import { completeOnboarding, getDefaultExpenseCategories } from '../utils/businessConfig';
import type { BusinessConfig, ExpenseCategory } from '../utils/database';

interface OnboardingWizardProps {
  businessType: 'general' | 'legal';
  onComplete: (config: BusinessConfig) => void;
  onBack: () => void;
  isOpen: boolean;
}

interface FormData {
  businessName: string;
  selectedCategories: string[];
}

interface ValidationErrors {
  businessName?: string;
}

export function OnboardingWizard({ businessType, onComplete, onBack, isOpen }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    businessName: '',
    selectedCategories: [],
  });
  const [availableCategories, setAvailableCategories] = useState<ExpenseCategory[]>([]);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 3;

  useEffect(() => {
    if (isOpen) {
      loadDefaultCategories();
    }
  }, [isOpen, businessType]);

  const loadDefaultCategories = async () => {
    try {
      setIsLoading(true);
      const categories = await getDefaultExpenseCategories(businessType);
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

    if (step === 2) {
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
      const result = await completeOnboarding(businessType, formData.businessName.trim());
      
      if (result.success && result.configId) {
        // Create a mock config object for the callback
        const mockConfig: BusinessConfig = {
          id: result.configId,
          type: businessType,
          name: formData.businessName.trim(),
          setupComplete: true,
          onboardingDate: new Date().toISOString(),
          defaultCategories: availableCategories.filter(cat => 
            formData.selectedCategories.includes(cat.id)
          ),
          accounts: [],
          uiPreferences: {
            dashboardLayout: businessType === 'legal' ? 'legal' : 'standard',
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
      color: 'from-blue-600 to-indigo-600'
    },
    legal: {
      title: 'Legal Firm',
      icon: Scale,
      color: 'from-purple-600 to-pink-600'
    }
  };

  const typeInfo = businessTypeInfo[businessType];
  const Icon = typeInfo.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <UzajiLogo size="md" />
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>Step {currentStep} of {totalSteps}</span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`bg-gradient-to-r ${typeInfo.color} h-2 rounded-full transition-all duration-300`}
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Confirmation */}
          {currentStep === 1 && (
            <div className="text-center">
              <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${typeInfo.color} flex items-center justify-center shadow-lg`}>
                <Icon className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Perfect Choice!
              </h2>
              <p className="text-gray-600 mb-6">
                You've selected <strong>{typeInfo.title}</strong>. Let's set up your workspace with the right tools and categories for your business.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <h3 className="font-semibold text-gray-900 mb-2">What's included:</h3>
                <ul className="space-y-2 text-sm text-gray-600">
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

          {/* Step 2: Business Name */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                What's your business name?
              </h2>
              <p className="text-gray-600 mb-6">
                This will appear on your dashboard and can be changed later in settings.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
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
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.businessName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter your business name"
                    maxLength={100}
                    autoFocus
                  />
                  {errors.businessName && (
                    <div className="mt-2 flex items-center text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                      {errors.businessName}
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">i</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">
                        Privacy & Security
                      </h4>
                      <p className="text-blue-800 text-sm">
                        Your business information is stored locally on your device and encrypted for security. We never send your data to external servers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Categories */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Choose your expense categories
              </h2>
              <p className="text-gray-600 mb-6">
                We've pre-selected common categories for {businessType === 'legal' ? 'legal firms' : 'small businesses'}. You can customize these anytime.
              </p>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mr-3" />
                  <span className="text-gray-600">Loading categories...</span>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {availableCategories.map((category) => (
                    <label
                      key={category.id}
                      className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.selectedCategories.includes(category.id)}
                        onChange={() => handleCategoryToggle(category.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="ml-3 flex-1">
                        <div className="font-medium text-gray-900">{category.name}</div>
                        {category.description && (
                          <div className="text-sm text-gray-500">{category.description}</div>
                        )}
                      </div>
                      {category.isDefault && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Recommended
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              )}

              <div className="mt-4 text-sm text-gray-500">
                Selected {formData.selectedCategories.length} categories. You can add more categories later in Settings.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={currentStep === 1 ? onBack : handlePrevious}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            disabled={isSubmitting}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {currentStep === 1 ? 'Change Business Type' : 'Previous'}
          </button>

          <div className="flex items-center space-x-3">
            {currentStep < totalSteps ? (
              <button
                onClick={handleNext}
                disabled={isLoading}
                className={`flex items-center px-6 py-2 bg-gradient-to-r ${typeInfo.color} text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={isSubmitting || isLoading}
                className={`flex items-center px-6 py-2 bg-gradient-to-r ${typeInfo.color} text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
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