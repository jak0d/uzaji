import React from 'react';
import { ArrowLeft, Home, Shield, Users, BarChart3, Package, Settings, FileText, Calendar, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UzajiLogo } from './UzajiLogo';
import { useSettings } from '../hooks/useSettings';

export function Sitemap() {
  const { getThemeClasses } = useSettings();
  const themeClasses = getThemeClasses();
  const navigate = useNavigate();

  const publicPages = [
    {
      path: '/',
      title: 'Home',
      description: 'Landing page with features and benefits of Uzaji smart business bookkeeping',
      icon: Home,
      priority: 'High',
      frequency: 'Weekly'
    },
    {
      path: '/auth',
      title: 'Authentication',
      description: 'Sign in or sign up for your secure Uzaji account',
      icon: Lock,
      priority: 'High',
      frequency: 'Monthly'
    },
    {
      path: '/privacy',
      title: 'Privacy Policy',
      description: 'Comprehensive privacy policy and data protection information',
      icon: Shield,
      priority: 'Medium',
      frequency: 'Monthly'
    }
  ];

  const protectedPages = [
    {
      path: '/dashboard',
      title: 'Dashboard',
      description: 'Main dashboard with financial overview and quick actions',
      icon: BarChart3,
      priority: 'High',
      frequency: 'Daily'
    },
    {
      path: '/transactions',
      title: 'Record Transaction',
      description: 'Add new income or expense transactions to your books',
      icon: FileText,
      priority: 'High',
      frequency: 'Daily'
    },
    {
      path: '/products',
      title: 'Products & Services',
      description: 'Manage your business products and services catalog',
      icon: Package,
      priority: 'High',
      frequency: 'Weekly'
    },
    {
      path: '/reports',
      title: 'Financial Reports',
      description: 'View detailed financial reports and analytics',
      icon: BarChart3,
      priority: 'High',
      frequency: 'Weekly'
    },
    {
      path: '/settings',
      title: 'Settings',
      description: 'Configure app preferences, data management, and account settings',
      icon: Settings,
      priority: 'Medium',
      frequency: 'Monthly'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'Low':
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'Daily':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'Weekly':
        return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20';
      case 'Monthly':
        return 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  return (
    <div className={`min-h-screen ${themeClasses.background}`} dir={themeClasses.direction}>
      {/* Header */}
      <header className={`${themeClasses.cardBackground} shadow-sm ${themeClasses.border} border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate('/')}
              className={`mr-4 p-2 ${themeClasses.textSecondary} hover:${themeClasses.text} ${themeClasses.hover} rounded-lg transition-colors`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <UzajiLogo size="md" className="mr-4" />
            <h1 className={`text-xl font-bold ${themeClasses.text}`}>Sitemap</h1>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <FileText className="w-10 h-10 text-white" />
          </div>
          <h1 className={`text-4xl font-bold ${themeClasses.text} mb-4`}>
            Sitemap
          </h1>
          <p className={`text-xl ${themeClasses.textSecondary} max-w-3xl mx-auto leading-relaxed`}>
            Navigate through all pages and features of Uzaji smart business bookkeeping application.
            Find exactly what you're looking for with our comprehensive site structure.
          </p>
        </div>

        {/* XML Sitemap Link */}
        <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm ${themeClasses.border} border p-6 mb-8`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-lg font-semibold ${themeClasses.text} mb-2`}>
                XML Sitemap for Search Engines
              </h2>
              <p className={`${themeClasses.textSecondary}`}>
                Machine-readable sitemap for search engine crawlers and SEO tools
              </p>
            </div>
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>View XML Sitemap</span>
            </a>
          </div>
        </div>

        {/* Public Pages */}
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <h2 className={`text-2xl font-bold ${themeClasses.text}`}>
              Public Pages
            </h2>
            <span className={`px-3 py-1 text-xs font-medium text-green-800 bg-green-100 dark:bg-green-900/20 dark:text-green-200 rounded-full`}>
              Accessible to everyone
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicPages.map((page) => (
              <div
                key={page.path}
                className={`${themeClasses.cardBackground} rounded-lg shadow-sm ${themeClasses.border} border p-6 hover:shadow-md transition-shadow cursor-pointer group`}
                onClick={() => navigate(page.path)}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <page.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${themeClasses.text} group-hover:text-blue-600 transition-colors`}>
                      {page.title}
                    </h3>
                    <p className={`text-sm ${themeClasses.textSecondary}`}>
                      {page.path}
                    </p>
                  </div>
                </div>
                
                <p className={`${themeClasses.text} text-sm mb-4 leading-relaxed`}>
                  {page.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(page.priority)}`}>
                    {page.priority} Priority
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getFrequencyColor(page.frequency)}`}>
                    {page.frequency}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Protected Pages */}
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <Lock className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className={`text-2xl font-bold ${themeClasses.text}`}>
              Protected Pages
            </h2>
            <span className={`px-3 py-1 text-xs font-medium text-orange-800 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-200 rounded-full`}>
              Requires authentication
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {protectedPages.map((page) => (
              <div
                key={page.path}
                className={`${themeClasses.cardBackground} rounded-lg shadow-sm ${themeClasses.border} border p-6 hover:shadow-md transition-shadow cursor-pointer group`}
                onClick={() => navigate(page.path)}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <page.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${themeClasses.text} group-hover:text-purple-600 transition-colors`}>
                      {page.title}
                    </h3>
                    <p className={`text-sm ${themeClasses.textSecondary}`}>
                      {page.path}
                    </p>
                  </div>
                </div>
                
                <p className={`${themeClasses.text} text-sm mb-4 leading-relaxed`}>
                  {page.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(page.priority)}`}>
                    {page.priority} Priority
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getFrequencyColor(page.frequency)}`}>
                    {page.frequency}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Site Statistics */}
        <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm ${themeClasses.border} border p-8`}>
          <h2 className={`text-2xl font-bold ${themeClasses.text} mb-6 text-center`}>
            Site Statistics
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className={`text-2xl font-bold ${themeClasses.text}`}>8</h3>
              <p className={`${themeClasses.textSecondary} text-sm`}>Total Pages</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className={`text-2xl font-bold ${themeClasses.text}`}>3</h3>
              <p className={`${themeClasses.textSecondary} text-sm`}>Public Pages</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Lock className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className={`text-2xl font-bold ${themeClasses.text}`}>5</h3>
              <p className={`${themeClasses.textSecondary} text-sm`}>Protected Pages</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className={`text-2xl font-bold ${themeClasses.text}`}>Dec 2024</h3>
              <p className={`${themeClasses.textSecondary} text-sm`}>Last Updated</p>
            </div>
          </div>
        </div>

        {/* Navigation Help */}
        <div className="mt-12 text-center">
          <h3 className={`text-xl font-semibold ${themeClasses.text} mb-4`}>
            Need Help Navigating?
          </h3>
          <p className={`${themeClasses.textSecondary} mb-6 max-w-2xl mx-auto`}>
            If you can't find what you're looking for, try starting from the homepage 
            or contact our support team for assistance.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              <Home className="w-4 h-4" />
              <span>Go to Homepage</span>
            </button>
            <a
              href="mailto:info@uzaji.com"
              className={`px-6 py-3 ${themeClasses.border} border rounded-lg ${themeClasses.text} ${themeClasses.hover} transition-colors font-semibold flex items-center space-x-2`}
            >
              <FileText className="w-4 h-4" />
              <span>Contact Support</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}