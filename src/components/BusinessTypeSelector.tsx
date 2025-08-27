import React, { useState } from 'react';
import { Building2, Scale, ArrowRight, X } from 'lucide-react';
import { UzajiLogo } from './UzajiLogo';

interface BusinessTypeSelectorProps {
  onBusinessTypeSelect: (type: 'general' | 'legal') => void;
  onCancel?: () => void;
  isOpen: boolean;
}

export function BusinessTypeSelector({ onBusinessTypeSelect, onCancel, isOpen }: BusinessTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<'general' | 'legal' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  if (!isOpen) return null;

  const handleTypeSelect = (type: 'general' | 'legal') => {
    setSelectedType(type);
    setIsAnimating(true);
    
    // Small delay for visual feedback before proceeding
    setTimeout(() => {
      onBusinessTypeSelect(type);
    }, 300);
  };

  const businessTypes = [
    {
      id: 'general' as const,
      title: 'General Small Business',
      subtitle: 'Retail, Consulting, Services, etc.',
      description: 'Perfect for most small businesses including retail stores, consulting firms, service providers, and freelancers.',
      icon: Building2,
      features: [
        'Standard bookkeeping features',
        'Product & service tracking',
        'Basic expense categories',
        'Revenue & expense reporting'
      ],
      color: 'from-blue-600 to-indigo-600',
      hoverColor: 'from-blue-700 to-indigo-700'
    },
    {
      id: 'legal' as const,
      title: 'Legal Firm',
      subtitle: 'Lawyers, Paralegals, Legal Services',
      description: 'Specialized features for law firms, legal practices, and legal service providers.',
      icon: Scale,
      features: [
        'Legal-specific expense categories',
        'Client matter tracking',
        'Court fees & legal research',
        'Professional services focus'
      ],
      color: 'from-purple-600 to-pink-600',
      hoverColor: 'from-purple-700 to-pink-700'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <UzajiLogo size="lg" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome to Uzaji!</h1>
              <p className="text-gray-600">What type of business do you run?</p>
            </div>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Business Type Cards */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {businessTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;
              const isOtherSelected = selectedType && selectedType !== type.id;
              
              return (
                <div
                  key={type.id}
                  className={`
                    relative border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 transform
                    ${isSelected 
                      ? 'border-blue-500 bg-blue-50 scale-105 shadow-lg' 
                      : isOtherSelected
                      ? 'border-gray-200 bg-gray-50 opacity-60'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md hover:scale-102'
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
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <ArrowRight className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}

                  {/* Icon and Title */}
                  <div className="flex items-start space-x-4 mb-4">
                    <div className={`
                      w-16 h-16 rounded-xl bg-gradient-to-br ${type.color} 
                      flex items-center justify-center shadow-lg
                      ${isSelected ? 'shadow-xl' : ''}
                    `}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {type.title}
                      </h3>
                      <p className="text-sm text-gray-600 font-medium">
                        {type.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    {type.description}
                  </p>

                  {/* Features */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      Key Features:
                    </h4>
                    <ul className="space-y-1">
                      {type.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Hover Effect */}
                  <div className={`
                    absolute inset-0 rounded-xl bg-gradient-to-br ${type.color} opacity-0 
                    transition-opacity duration-300 pointer-events-none
                    ${!isSelected && !isOtherSelected ? 'hover:opacity-5' : ''}
                  `} />
                </div>
              );
            })}
          </div>

          {/* Help Text */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">?</span>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">
                  Don't worry, you can change this later
                </h4>
                <p className="text-blue-800 text-sm">
                  This selection helps us customize your experience with the most relevant features and categories for your business type. You can always modify your business settings later in the Settings page.
                </p>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isAnimating && (
            <div className="mt-6 flex items-center justify-center">
              <div className="flex items-center space-x-3 text-blue-600">
                <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <span className="font-medium">Setting up your workspace...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}