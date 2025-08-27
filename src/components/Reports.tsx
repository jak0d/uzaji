import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTransactionsByDateRange, getTransactions } from '../utils/database';
import { UzajiLogo } from './UzajiLogo';
import { useSettings } from '../hooks/useSettings';
import type { Transaction } from '../utils/database';

interface ReportsProps {
  onBack: () => void;
}

interface ReportData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  transactionCount: number;
  categoryBreakdown: { [key: string]: number };
  monthlyTrends: { month: string; revenue: number; expenses: number; profit: number }[];
  topCategories: { category: string; amount: number; type: 'income' | 'expense' }[];
}

export function Reports({ onBack }: ReportsProps) {
  const { formatCurrency, formatDate, getThemeClasses } = useSettings();
  const themeClasses = getThemeClasses();
  const navigate = useNavigate();
  
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState<ReportData>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    transactionCount: 0,
    categoryBreakdown: {},
    monthlyTrends: [],
    topCategories: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedView, setSelectedView] = useState<'overview' | 'trends' | 'categories'>('overview');

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    setIsLoading(true);
    try {
      const transactions = await getTransactionsByDateRange(dateRange.startDate, dateRange.endDate);
      const allTransactions = await getTransactions();
      
      // Calculate basic metrics
      const revenue = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      
      // Category breakdown
      const categoryBreakdown: { [key: string]: number } = {};
      transactions.forEach(t => {
        categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount;
      });

      // Monthly trends (last 6 months)
      const monthlyTrends = generateMonthlyTrends(allTransactions);
      
      // Top categories
      const topCategories = Object.entries(categoryBreakdown)
        .map(([category, amount]) => ({
          category,
          amount,
          type: transactions.find(t => t.category === category)?.type || 'income' as 'income' | 'expense'
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      setReportData({
        totalRevenue: revenue,
        totalExpenses: expenses,
        netProfit: revenue - expenses,
        transactionCount: transactions.length,
        categoryBreakdown,
        monthlyTrends,
        topCategories
      });
    } catch (error) {
      console.error('Failed to load report data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMonthlyTrends = (transactions: Transaction[]) => {
    const trends = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = date.toISOString().split('T')[0];
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
      
      const monthTransactions = transactions.filter(t => t.date >= monthStart && t.date <= monthEnd);
      const revenue = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      
      trends.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue,
        expenses,
        profit: revenue - expenses
      });
    }
    
    return trends;
  };

  return (
    <div className={`min-h-screen ${themeClasses.background}`}>
      {/* Header */}
      <header className={`${themeClasses.cardBackground} shadow-sm ${themeClasses.border} border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className={`mr-4 p-2 ${themeClasses.textSecondary} hover:${themeClasses.text} ${themeClasses.hover} rounded-lg transition-colors`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <UzajiLogo size="md" className="mr-4" />
              <h1 className={`text-xl font-bold ${themeClasses.text}`}>Financial Reports</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={loadReportData}
                disabled={isLoading}
                className={`flex items-center space-x-2 px-4 py-2 ${themeClasses.textSecondary} hover:${themeClasses.text} ${themeClasses.hover} rounded-lg transition-colors disabled:opacity-50`}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Range Selector */}
        <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm ${themeClasses.border} border p-6 mb-8`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-semibold ${themeClasses.text} flex items-center`}>
              <Calendar className="w-5 h-5 mr-2" />
              Report Period
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className={`w-full px-4 py-3 ${themeClasses.border} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${themeClasses.cardBackground} ${themeClasses.text}`}
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                End Date
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className={`w-full px-4 py-3 ${themeClasses.border} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${themeClasses.cardBackground} ${themeClasses.text}`}
              />
            </div>
          </div>
        </div>

        {/* View Selector */}
        <div className="flex space-x-1 mb-8">
          <button
            onClick={() => setSelectedView('overview')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              selectedView === 'overview'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                : `${themeClasses.cardBackground} ${themeClasses.text} ${themeClasses.hover} ${themeClasses.border} border`
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Overview
          </button>
          <button
            onClick={() => setSelectedView('trends')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              selectedView === 'trends'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                : `${themeClasses.cardBackground} ${themeClasses.text} ${themeClasses.hover} ${themeClasses.border} border`
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Trends
          </button>
          <button
            onClick={() => setSelectedView('categories')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              selectedView === 'categories'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                : `${themeClasses.cardBackground} ${themeClasses.text} ${themeClasses.hover} ${themeClasses.border} border`
            }`}
          >
            <PieChart className="w-4 h-4 inline mr-2" />
            Categories
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className={themeClasses.textSecondary}>Generating report...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Overview */}
            {selectedView === 'overview' && (
              <div className="space-y-8">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm p-6 ${themeClasses.border} border`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${themeClasses.textSecondary}`}>Total Revenue</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(reportData.totalRevenue)}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm p-6 ${themeClasses.border} border`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${themeClasses.textSecondary}`}>Total Expenses</p>
                        <p className="text-2xl font-bold text-red-600">
                          {formatCurrency(reportData.totalExpenses)}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <TrendingDown className="w-6 h-6 text-red-600" />
                      </div>
                    </div>
                  </div>

                  <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm p-6 ${themeClasses.border} border`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${themeClasses.textSecondary}`}>Net Profit</p>
                        <p className={`text-2xl font-bold ${reportData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(reportData.netProfit)}
                        </p>
                      </div>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        reportData.netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <DollarSign className={`w-6 h-6 ${reportData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                      </div>
                    </div>
                  </div>

                  <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm p-6 ${themeClasses.border} border`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${themeClasses.textSecondary}`}>Transactions</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {reportData.transactionCount}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profit Margin */}
                <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm ${themeClasses.border} border p-6`}>
                  <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>Profit Margin Analysis</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={themeClasses.textSecondary}>Profit Margin</span>
                      <span className={`font-bold ${
                        reportData.totalRevenue > 0 
                          ? (reportData.netProfit / reportData.totalRevenue) >= 0.2 ? 'text-green-600' : 'text-yellow-600'
                          : themeClasses.textSecondary
                      }`}>
                        {reportData.totalRevenue > 0 
                          ? `${((reportData.netProfit / reportData.totalRevenue) * 100).toFixed(1)}%`
                          : 'N/A'
                        }
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${
                          reportData.totalRevenue > 0 
                            ? (reportData.netProfit / reportData.totalRevenue) >= 0.2 ? 'bg-green-500' : 'bg-yellow-500'
                            : 'bg-gray-400'
                        }`}
                        style={{ 
                          width: reportData.totalRevenue > 0 
                            ? `${Math.max(0, Math.min(100, (reportData.netProfit / reportData.totalRevenue) * 100))}%`
                            : '0%'
                        }}
                      ></div>
                    </div>
                    <p className={`text-sm ${themeClasses.textSecondary}`}>
                      {reportData.totalRevenue > 0 && (reportData.netProfit / reportData.totalRevenue) >= 0.2
                        ? 'Excellent profit margin! Your business is performing well.'
                        : reportData.totalRevenue > 0 && (reportData.netProfit / reportData.totalRevenue) >= 0.1
                        ? 'Good profit margin. Consider optimizing expenses for better performance.'
                        : 'Consider reviewing your pricing strategy and expense management.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Trends */}
            {selectedView === 'trends' && (
              <div className="space-y-8">
                <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm ${themeClasses.border} border p-6`}>
                  <h3 className={`text-lg font-semibold ${themeClasses.text} mb-6`}>6-Month Financial Trends</h3>
                  <div className="space-y-6">
                    {reportData.monthlyTrends.map((trend, index) => (
                      <div key={index} className={`border-b ${themeClasses.border} pb-4 last:border-b-0`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className={`font-medium ${themeClasses.text}`}>{trend.month}</h4>
                          <span className={`font-bold ${trend.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(trend.profit)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex justify-between">
                            <span className={themeClasses.textSecondary}>Revenue:</span>
                            <span className="font-medium text-green-600">{formatCurrency(trend.revenue)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className={themeClasses.textSecondary}>Expenses:</span>
                            <span className="font-medium text-red-600">{formatCurrency(trend.expenses)}</span>
                          </div>
                        </div>
                        <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full"
                            style={{ 
                              width: trend.revenue > 0 ? `${Math.min(100, (trend.revenue / Math.max(...reportData.monthlyTrends.map(t => t.revenue))) * 100)}%` : '0%'
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Categories */}
            {selectedView === 'categories' && (
              <div className="space-y-8">
                <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm ${themeClasses.border} border p-6`}>
                  <h3 className={`text-lg font-semibold ${themeClasses.text} mb-6`}>Top Categories</h3>
                  <div className="space-y-4">
                    {reportData.topCategories.length === 0 ? (
                      <div className="text-center py-8">
                        <PieChart className={`w-12 h-12 ${themeClasses.textSecondary} mx-auto mb-4`} />
                        <p className={themeClasses.textSecondary}>No category data available for the selected period</p>
                      </div>
                    ) : (
                      reportData.topCategories.map((category, index) => (
                        <div key={index} className={`flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg`}>
                          <div className="flex items-center space-x-4">
                            <div className={`w-4 h-4 rounded-full ${
                              category.type === 'income' ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                            <div>
                              <h4 className={`font-medium ${themeClasses.text}`}>{category.category}</h4>
                              <p className={`text-sm ${themeClasses.textSecondary} capitalize`}>{category.type}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${category.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(category.amount)}
                            </p>
                            <p className={`text-sm ${themeClasses.textSecondary}`}>
                              {reportData.totalRevenue + reportData.totalExpenses > 0 
                                ? `${((category.amount / (reportData.totalRevenue + reportData.totalExpenses)) * 100).toFixed(1)}%`
                                : '0%'
                              }
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Category Breakdown Chart */}
                <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm ${themeClasses.border} border p-6`}>
                  <h3 className={`text-lg font-semibold ${themeClasses.text} mb-6`}>Category Distribution</h3>
                  <div className="space-y-3">
                    {Object.entries(reportData.categoryBreakdown)
                      .sort(([,a], [,b]) => b - a)
                      .map(([category, amount], index) => {
                        const percentage = (reportData.totalRevenue + reportData.totalExpenses) > 0 
                          ? (amount / (reportData.totalRevenue + reportData.totalExpenses)) * 100 
                          : 0;
                        return (
                          <div key={category} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className={`font-medium ${themeClasses.text}`}>{category}</span>
                              <span className={themeClasses.textSecondary}>{formatCurrency(amount)} ({percentage.toFixed(1)}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  index % 6 === 0 ? 'bg-blue-500' :
                                  index % 6 === 1 ? 'bg-green-500' :
                                  index % 6 === 2 ? 'bg-yellow-500' :
                                  index % 6 === 3 ? 'bg-red-500' :
                                  index % 6 === 4 ? 'bg-purple-500' : 'bg-pink-500'
                                }`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}