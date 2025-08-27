import React, { useState } from 'react';
import { Plus, FileText, Receipt, Zap, Lock, ArrowRight } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
  primary?: boolean;
  tooltip?: string;
  gradient: string;
  hoverGradient: string;
  onClick: () => void;
}

interface QuickActionsPanelProps {
  onRecordTransaction: () => void;
  onCreateInvoice?: () => void;
  onRecordBill?: () => void;
  businessType?: 'general' | 'legal';
  className?: string;
}

interface ActionButtonProps {
  action: QuickAction;
  isCompact?: boolean;
}

function ActionButton({ action, isCompact = false }: ActionButtonProps) {
  const { getThemeClasses } = useSettings();
  const themeClasses = getThemeClasses();
  const [showTooltip, setShowTooltip] = useState(false);

  const Icon = action.icon;

  const handleClick = () => {
    if (action.enabled) {
      action.onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => !action.enabled && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        disabled={!action.enabled}
        className={`
          w-full group relative overflow-hidden rounded-xl transition-all duration-200 transform
          ${isCompact ? 'p-4' : 'p-6'}
          ${action.enabled 
            ? `bg-gradient-to-r ${action.gradient} hover:${action.hoverGradient} text-white shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0` 
            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed border-2 border-dashed border-gray-300 dark:border-gray-600'
          }
          ${action.primary ? 'ring-2 ring-blue-200 ring-offset-2' : ''}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        `}
        aria-label={action.enabled ? action.label : `${action.label} - ${action.tooltip}`}
      >
        {/* Background Pattern for Disabled State */}
        {!action.enabled && (
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-600" />
          </div>
        )}

        {/* Content */}
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Icon */}
            <div className={`
              flex-shrink-0 rounded-lg flex items-center justify-center
              ${isCompact ? 'w-10 h-10' : 'w-12 h-12'}
              ${action.enabled 
                ? 'bg-white/20 backdrop-blur-sm' 
                : 'bg-gray-200 dark:bg-gray-700'
              }
            `}>
              <Icon className={`${isCompact ? 'w-5 h-5' : 'w-6 h-6'}`} />
            </div>

            {/* Text Content */}
            <div className="flex-1 text-left">
              <h3 className={`font-semibold ${isCompact ? 'text-base' : 'text-lg'} mb-1`}>
                {action.label}
              </h3>
              <p className={`text-sm opacity-90 ${isCompact ? 'text-xs' : ''}`}>
                {action.description}
              </p>
            </div>
          </div>

          {/* Arrow Icon */}
          <div className={`
            flex-shrink-0 transition-transform duration-200
            ${action.enabled ? 'group-hover:translate-x-1' : ''}
          `}>
            {action.enabled ? (
              <ArrowRight className="w-5 h-5" />
            ) : (
              <Lock className="w-5 h-5" />
            )}
          </div>
        </div>

        {/* Shine Effect for Enabled Buttons */}
        {action.enabled && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </div>
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && action.tooltip && !action.enabled && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-10">
          <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
            {action.tooltip}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      )}
    </div>
  );
}

export function QuickActionsPanel({ onRecordTransaction, onCreateInvoice, onRecordBill, businessType = 'general', className = '' }: QuickActionsPanelProps) {
  const { settings, getThemeClasses } = useSettings();
  const themeClasses = getThemeClasses();

  const actions: QuickAction[] = [
    {
      id: 'record-transaction',
      label: 'Record New Transaction',
      description: businessType === 'legal' 
        ? 'Add client payments, case expenses, or court fees'
        : 'Add income, sales, expenses, or purchases',
      icon: Plus,
      enabled: true,
      primary: true,
      gradient: 'from-blue-600 to-indigo-600',
      hoverGradient: 'from-blue-700 to-indigo-700',
      onClick: onRecordTransaction
    },
    {
      id: 'create-invoice',
      label: 'Create New Invoice',
      description: businessType === 'legal'
        ? 'Bill clients for legal services and case work'
        : 'Send professional invoices to customers',
      icon: FileText,
      enabled: true,
      gradient: 'from-green-600 to-emerald-600',
      hoverGradient: 'from-green-700 to-emerald-700',
      onClick: onCreateInvoice || (() => {})
    },
    {
      id: 'record-bill',
      label: 'Record New Bill',
      description: businessType === 'legal'
        ? 'Track vendor bills and professional service fees'
        : 'Manage supplier bills and recurring expenses',
      icon: Receipt,
      enabled: true,
      gradient: 'from-purple-600 to-pink-600',
      hoverGradient: 'from-purple-700 to-pink-700',
      onClick: onRecordBill || (() => {})
    }
  ];

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className={`text-xl font-semibold ${themeClasses.text}`}>
            Quick Actions
          </h2>
          <p className={`text-sm ${themeClasses.textSecondary} mt-1`}>
            {businessType === 'legal' 
              ? 'Manage your legal practice finances efficiently'
              : 'Streamline your business financial tasks'
            }
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          <span className={`text-sm font-medium ${themeClasses.textSecondary}`}>
            Fast Track
          </span>
        </div>
      </div>

      {/* Actions Grid */}
      <div className={`
        grid gap-4
        ${settings.compactView 
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
          : 'grid-cols-1 lg:grid-cols-3'
        }
      `}>
        {actions.map((action) => (
          <ActionButton
            key={action.id}
            action={action}
            isCompact={settings.compactView}
          />
        ))}
      </div>

      {/* Pro Features Notice */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Unlock More Powerful Features
            </h3>
            <p className="text-blue-800 dark:text-blue-200 text-sm mb-3">
              {businessType === 'legal' 
                ? 'Get advanced client billing, case expense tracking, and professional invoicing designed specifically for legal practices.'
                : 'Access professional invoicing, bill management, inventory tracking, and advanced reporting features.'
              }
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                Professional Invoicing
              </span>
              <span className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                Bill Management
              </span>
              <span className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                {businessType === 'legal' ? 'Client Billing' : 'Inventory Tracking'}
              </span>
              <span className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                Advanced Reports
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-4">
        <span>💡 Tip: Use keyboard shortcuts for faster access</span>
        <span className="hidden sm:inline">• Press 'T' for new transaction</span>
      </div>
    </div>
  );
}