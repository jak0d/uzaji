import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Receipt, 
  ShoppingCart, 
  Package, 
  Settings, 
  BarChart3,
  Building,
  X,
  ChevronLeft,
  ChevronRight,
  Lock,
  Users,
  FileText,
  TrendingUp
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { UzajiLogo } from './UzajiLogo';
import { useSettings } from '../hooks/useSettings';
import { getBusinessType } from '../utils/businessConfig';

type BusinessType = 'general' | 'legal';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
  enabled: boolean;
  badge?: string;
  tooltip?: string;
  businessTypes?: BusinessType[];
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onNavigate: (route: string) => void;
  className?: string;
}

export function Sidebar({ isOpen, onToggle, onNavigate, className = '' }: SidebarProps) {
  const { getThemeClasses } = useSettings();
  const themeClasses = getThemeClasses();
  const location = useLocation();
  const [businessType, setBusinessType] = useState<'general' | 'legal'>('general');
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    loadBusinessType();
  }, []);

  const loadBusinessType = async () => {
    try {
      const type = await getBusinessType();
      if (type) {
        setBusinessType(type);
      }
    } catch (error) {
      console.error('Failed to load business type:', error);
    }
  };

  // Initialize with common navigation items
  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      route: '/dashboard',
      enabled: true,
      businessTypes: ['general', 'legal']
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: Receipt,
      route: '/transactions',
      enabled: true,
      businessTypes: ['general', 'legal']
    }
  ];
  
  // Add business type specific navigation items
  if (businessType === 'legal') {
    navigationItems.push({
      id: 'clients',
      label: 'Clients & Files',
      icon: Users,
      route: '/clients',
      enabled: true,
      businessTypes: ['legal']
    });
  } else {
    navigationItems.push(
      {
        id: 'sales',
        label: 'Sales',
        icon: TrendingUp,
        route: '/sales',
        enabled: true,
        businessTypes: ['general']
      },
      {
        id: 'invoices',
        label: 'Invoices',
        icon: FileText,
        route: '/invoices',
        enabled: true,
        businessTypes: ['general']
      },
      {
        id: 'purchases',
        label: 'Purchases',
        icon: ShoppingCart,
        route: '/purchases',
        enabled: true,
        businessTypes: ['general']
      }
    );
  }
  
  // Add common navigation items
  navigationItems.push(
    {
      id: 'products',
      label: businessType === 'legal' ? 'Services' : 'Products & Services',
      icon: Package,
      route: '/products',
      enabled: true,
      businessTypes: ['general', 'legal']
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart3,
      route: '/reports',
      enabled: true,
      businessTypes: ['general', 'legal']
    },
    {
      id: 'banking',
      label: 'Banking',
      icon: Building,
      route: '/banking',
      enabled: true,
      businessTypes: ['general', 'legal']
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      route: '/settings',
      enabled: true,
      businessTypes: ['general', 'legal']
    }
  );

  const filteredItems = navigationItems.filter(item => 
    !item.businessTypes || item.businessTypes.includes(businessType)
  );

  const handleItemClick = (item: NavigationItem) => {
    if (item.enabled) {
      onNavigate(item.route);
    }
  };

  const isActiveRoute = (route: string): boolean => {
    if (route === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(route);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full z-50 transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'w-16' : 'w-64'}
        ${themeClasses.cardBackground} ${themeClasses.border} border-r shadow-lg
        ${className}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <UzajiLogo size="sm" />
              <div>
                <h2 className={`font-bold ${themeClasses.text}`}>Uzaji</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {businessType === 'legal' ? 'Legal Practice' : 'Small Business'}
                </p>
              </div>
            </div>
          )}
          
          {/* Mobile Close Button */}
          <button
            onClick={onToggle}
            className={`lg:hidden p-2 ${themeClasses.textSecondary} hover:${themeClasses.text} ${themeClasses.hover} rounded-lg transition-colors`}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop Collapse Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden lg:block p-2 ${themeClasses.textSecondary} hover:${themeClasses.text} ${themeClasses.hover} rounded-lg transition-colors`}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.route);
            
            return (
              <div key={item.id} className="relative">
                <button
                  onClick={() => handleItemClick(item)}
                  disabled={!item.enabled}
                  className={`
                    w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 text-left
                    ${isActive 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' 
                      : item.enabled
                      ? `${themeClasses.text} hover:bg-gray-100 dark:hover:bg-gray-700`
                      : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    }
                    ${isCollapsed ? 'justify-center px-2' : ''}
                  `}
                  title={isCollapsed ? item.label : item.tooltip}
                >
                  <div className="relative">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                    {!item.enabled && (
                      <Lock className="w-3 h-3 absolute -top-1 -right-1 text-gray-400" />
                    )}
                  </div>
                  
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 font-medium">{item.label}</span>
                      {item.badge && (
                        <span className="px-2 py-1 text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </button>

                {/* Tooltip for collapsed state */}
                {isCollapsed && item.tooltip && (
                  <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {item.tooltip}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Pro Features Promotion */}
        {!isCollapsed && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Lock className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 text-sm mb-1">
                    All Features Unlocked
                  </h4>
                  <p className="text-green-800 dark:text-green-200 text-xs mb-3">
                    {businessType === 'legal' 
                      ? 'Enjoy full access to client billing, case tracking, and professional invoicing.'
                      : 'Full access to all features including invoicing, inventory, and reporting tools.'
                    }
                  </p>
                  <div className="text-xs font-medium text-green-700 dark:text-green-300 text-center py-2">
                    All Features Active
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <div className="flex items-center justify-between">
                <span>Version 2.0</span>
                <span className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Local Storage</span>
                </span>
              </div>
              <p>All data encrypted & stored locally</p>
            </div>
          </div>
        )}
      </div>

      {/* Spacer for desktop */}
      <div className={`hidden lg:block transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`} />
    </>
  );
}