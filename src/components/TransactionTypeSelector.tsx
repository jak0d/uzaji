import React, { useState } from 'react';
import { TrendingUp, TrendingDown, ArrowRight, X, DollarSign, Receipt } from 'lucide-react';
import { UzajiLogo } from './UzajiLogo';
import { useSettings } from '../hooks/useSettings';

interface TransactionTypeSelectorProps {
  onTypeSelect: (type: 'income' | 'expense') => void;
  onCancel: () => void;
  isOpen: boolean;
  businessType?: 'general' | 'legal';
}

interface TransactionTypeOption {
  id: 'income' | 'expense';
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  examples: string[];
  color: string;
  hoverColor: string;
  bgGradient: string;
}

export function TransactionTypeSelector({ 
  onTypeSelect, 
  onCancel, 
  isOpen, 
  businessType = 'general' 
}: TransactionTypeSelectorProps) {
  const { getThemeClasses } = useSettings();
  const themeClasses = getThemeClasses();
  const [selectedType, setSelectedType] = useState<'income' | 'expense' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  if (!isOpen) return null;

  const handleTypeSelect = (type: 'income' | 'expense') => {
    setSelectedType(type);
    setIsAnimating(true);
    
    // Small delay for visual feedback before proceeding
    setTimeout(() => {
      onTypeSelect(type);
    }, 300);
  };

  const transactionTypes: TransactionTypeOption[] = [
    {
      id: 'income',
      title: 'Record Income / Sale',
      subtitle: businessType === 'legal' ? 'Client Payments & Retainers' : 'Sales & Revenue',
      description: businessType === 'legal' 
        ? 'Record client payments, retainers, consultation fees, and other income from your legal practice.'
        : 'Record sales, service payments, and any money coming into your business.',
      icon: TrendingUp,
      examples: businessType === 'legal' 
        ? ['Client retainer payments', 'Consultation fees', 'Case settlements', 'Legal document preparation']
        : ['Product sales', 'Service payments', 'Consulting fees', 'Interest income'],
      color: 'text-green-600',
      hoverColor: 'hover:text-green-700',
      bgGradient: 'from-green-50 to-emerald-50'
    },
    {
      id: 'expense',
      title: 'Record Expense / Purchase',
      subtitle: businessType === 'legal' ? 'Business & Case Expenses' : 'Business Expenses',
      description: businessType === 'legal'
        ? 'Record court fees, legal research costs, office expenses, and other business expenditures.'
        : 'Record business purchases, operating expenses, and any money going out of your business.',
      icon: TrendingDown,
      examples: businessType === 'legal'
        ? ['Court filing fees', 'Legal research databases', 'Office supplies', 'Professional development']
        : ['Office supplies', 'Equipment purchases', 'Marketing expenses', 'Travel costs'],
      color: 'text-red-600',
      hoverColor: 'hover:text-red-700',
      bgGradient: 'from-red-50 to-pink-50'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${themeClasses.cardBackground} rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className={`p-6 border-b ${themeClasses.border} flex items-center justify-between`}>
          <div className="flex items-center space-x-4">
            <UzajiLogo size="md" />
            <div>
              <h1 className={`text-2xl font-bold ${themeClasses.text}`}>
                Record New Transaction
              </h1>
              <p className={`${themeClasses.textSecondary}`}>
                What would you like to record?
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

        {/* Transaction Type Cards */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {transactionTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;
              const isOtherSelected = selectedType && selectedType !== type.id;
              
              return (
                <div
                  key={type.id}
                  className={`
                    relative border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 transform
                    ${isSelected 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105 shadow-lg' 
                      : isOtherSelected
                      ? `border-gray-200 dark:border-gray-700 ${themeClasses.cardBackground} opacity-60`
                      : `border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md hover:scale-102 bg-gradient-to-br ${type.bgGradient} dark:${type.bgGradient.replace('50', '900/10')}`
                    }
                    ${isAnimating && isSelected ? 'animate-pulse' : ''}
                  `}
                  onClick={() => !isAnimating && handleTypeSelect(type.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !isAnimating) {
                      e.preventDefault();
                      handleTypeSelect(type.id);
                    }
                  }}
                  aria-label={`Select ${type.title}`}
                >
                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute top-4 right-4">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                        <ArrowRight className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  )}

                  {/* Icon and Title */}
                  <div className="flex items-start space-x-4 mb-4">
                    <div className={`
                      w-16 h-16 rounded-xl flex items-center justify-center shadow-lg
                      ${type.id === 'income' 
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                        : 'bg-gradient-to-br from-red-500 to-pink-600'
                      }
                      ${isSelected ? 'shadow-xl scale-110' : ''}
                      transition-all duration-300
                    `}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-xl font-bold ${themeClasses.text} mb-1`}>
                        {type.title}
                      </h3>
                      <p className={`text-sm ${themeClasses.textSecondary} font-medium`}>
                        {type.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className={`${themeClasses.text} mb-4 leading-relaxed`}>
                    {type.description}
                  </p>

                  {/* Examples */}
                  <div className="space-y-2">
                    <h4 className={`text-sm font-semibold ${themeClasses.text} mb-2`}>
                      Common Examples:
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {type.examples.map((example, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <div className={`w-2 h-2 rounded-full mr-3 flex-shrink-0 ${
                            type.id === 'income' ? 'bg-green-400' : 'bg-red-400'
                          }`} />
                          <span className={themeClasses.textSecondary}>{example}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Hover Effect */}
                  <div className={`
                    absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 pointer-events-none
                    ${type.id === 'income' 
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                      : 'bg-gradient-to-br from-red-500 to-pink-600'
                    }
                    ${!isSelected && !isOtherSelected ? 'hover:opacity-5' : ''}
                  `} />
                </div>
              );
            })}
          </div>

          {/* Quick Stats */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg border ${themeClasses.border} ${themeClasses.cardBackground}`}>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className={`text-sm ${themeClasses.textSecondary}`}>This Month</p>
                  <p className={`font-semibold ${themeClasses.text}`}>Income Transactions</p>
                </div>
              </div>
            </div>
            <div className={`p-4 rounded-lg border ${themeClasses.border} ${themeClasses.cardBackground}`}>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className={`text-sm ${themeClasses.textSecondary}`}>This Month</p>
                  <p className={`font-semibold ${themeClasses.text}`}>Expense Transactions</p>
                </div>
              </div>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">💡</span>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  {businessType === 'legal' ? 'Legal Practice Tip' : 'Business Tip'}
                </h4>
                <p className="text-blue-800 dark:text-blue-200 text-sm">
                  {businessType === 'legal' 
                    ? 'Keep detailed records of all client-related income and case expenses for accurate billing and tax reporting. Consider categorizing expenses by client or case for better tracking.'
                    : 'Record transactions as they happen for the most accurate financial picture. Use clear descriptions and categories to make tax time easier.'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isAnimating && (
            <div className="mt-6 flex items-center justify-center">
              <div className="flex items-center space-x-3 text-blue-600">
                <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <span className="font-medium">Opening transaction form...</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-6 border-t ${themeClasses.border} flex items-center justify-between`}>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Choose the type of transaction you want to record
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <span>💾 All data stored locally</span>
            <span>•</span>
            <span>🔒 Encrypted & secure</span>
          </div>
        </div>
      </div>
    </div>
  );
}