import React from 'react';
import { ArrowLeft, Zap, Lock, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../hooks/useSettings';

interface ComingSoonPageProps {
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  businessType?: 'general' | 'legal';
}

export function ComingSoonPage({ 
  title, 
  subtitle, 
  description, 
  features, 
  businessType = 'general' 
}: ComingSoonPageProps) {
  const { getThemeClasses } = useSettings();
  const themeClasses = getThemeClasses();
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/dashboard')}
        className={`flex items-center space-x-2 ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors mb-6`}
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </button>

      {/* Main Content */}
      <div className="text-center">
        {/* Icon */}
        <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
          <Zap className="w-12 h-12 text-white" />
        </div>

        {/* Title */}
        <h1 className={`text-4xl font-bold ${themeClasses.text} mb-4`}>
          {title}
        </h1>
        <p className={`text-xl ${themeClasses.textSecondary} mb-8`}>
          {subtitle}
        </p>

        {/* Description */}
        <div className={`max-w-2xl mx-auto ${themeClasses.cardBackground} rounded-xl p-8 shadow-sm border ${themeClasses.border} mb-8`}>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Lock className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-600 bg-purple-100 dark:bg-purple-900/30 px-3 py-1 rounded-full">
              Coming in Pro
            </span>
          </div>
          
          <p className={`${themeClasses.text} mb-6 leading-relaxed`}>
            {description}
          </p>

          {/* Features List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3 text-left">
                <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Star className="w-3 h-3 text-white" />
                </div>
                <span className={`text-sm ${themeClasses.text}`}>{feature}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
            <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
              Get Early Access
            </h3>
            <p className="text-purple-800 dark:text-purple-200 text-sm mb-4">
              Be the first to know when these powerful features become available. 
              {businessType === 'legal' 
                ? ' Perfect for legal practices looking to streamline client billing and case management.'
                : ' Designed to help small businesses grow and manage their operations efficiently.'
              }
            </p>
            <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium">
              Notify Me When Available
            </button>
          </div>
        </div>

        {/* Current Features */}
        <div className={`${themeClasses.cardBackground} rounded-xl p-6 shadow-sm border ${themeClasses.border}`}>
          <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>
            What You Can Do Right Now
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className={`p-4 ${themeClasses.hover} rounded-lg transition-colors text-left`}
            >
              <h4 className={`font-medium ${themeClasses.text} mb-2`}>Dashboard</h4>
              <p className={`text-sm ${themeClasses.textSecondary}`}>
                View your financial overview and recent activity
              </p>
            </button>
            <button
              onClick={() => navigate('/transactions')}
              className={`p-4 ${themeClasses.hover} rounded-lg transition-colors text-left`}
            >
              <h4 className={`font-medium ${themeClasses.text} mb-2`}>Record Transactions</h4>
              <p className={`text-sm ${themeClasses.textSecondary}`}>
                Add income and expense transactions with attachments
              </p>
            </button>
            <button
              onClick={() => navigate('/products')}
              className={`p-4 ${themeClasses.hover} rounded-lg transition-colors text-left`}
            >
              <h4 className={`font-medium ${themeClasses.text} mb-2`}>
                {businessType === 'legal' ? 'Services' : 'Products & Services'}
              </h4>
              <p className={`text-sm ${themeClasses.textSecondary}`}>
                Manage your {businessType === 'legal' ? 'legal services' : 'products and services'}
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}