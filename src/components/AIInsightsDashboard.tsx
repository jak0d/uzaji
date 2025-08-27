import React, { useState, useEffect } from 'react';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  Eye,
  EyeOff,
  Calendar,
  DollarSign,
  BarChart3,
  Zap,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { getTransactions } from '../utils/database';
import { aiFinancialAssistant, CashFlowForecast, FinancialAnomaly, AIInsight } from '../utils/aiInsights';

interface AIInsightsDashboardProps {
  className?: string;
}

export function AIInsightsDashboard({ className = '' }: AIInsightsDashboardProps) {
  const { formatCurrency, formatDate, getThemeClasses } = useSettings();
  const themeClasses = getThemeClasses();

  const [cashFlowForecast, setCashFlowForecast] = useState<CashFlowForecast[]>([]);
  const [anomalies, setAnomalies] = useState<FinancialAnomaly[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'forecast' | 'anomalies' | 'insights'>('forecast');
  const [forecastDays, setForecastDays] = useState(30);

  useEffect(() => {
    loadAIData();
  }, [forecastDays]);

  const loadAIData = async () => {
    setIsLoading(true);
    try {
      const transactions = await getTransactions();
      
      // Generate AI insights
      const [forecast, detectedAnomalies, generatedInsights] = await Promise.all([
        aiFinancialAssistant.generateCashFlowForecast(transactions, forecastDays),
        aiFinancialAssistant.detectAnomalies(transactions),
        aiFinancialAssistant.generateInsights(transactions)
      ]);

      setCashFlowForecast(forecast);
      setAnomalies(detectedAnomalies);
      setInsights(generatedInsights);
    } catch (error) {
      console.error('Failed to load AI insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-100 border-blue-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend': return TrendingUp;
      case 'recommendation': return Lightbulb;
      case 'warning': return AlertTriangle;
      case 'opportunity': return Zap;
      default: return Brain;
    }
  };

  const getAnomalyIcon = (type: string) => {
    switch (type) {
      case 'duplicate': return XCircle;
      case 'unusual_spending': return AlertTriangle;
      case 'large_transaction': return DollarSign;
      case 'category_spike': return TrendingUp;
      default: return AlertTriangle;
    }
  };

  const tabs = [
    { id: 'forecast', label: 'Cash Flow Forecast', icon: BarChart3 },
    { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle, count: anomalies.length },
    { id: 'insights', label: 'AI Insights', icon: Brain, count: insights.length }
  ];

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-2xl font-bold ${themeClasses.text} flex items-center`}>
            <Brain className="w-7 h-7 mr-3 text-purple-600" />
            AI Financial Assistant
          </h1>
          <p className={`${themeClasses.textSecondary} mt-1`}>
            AI-powered insights, forecasting, and anomaly detection
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={loadAIData}
            disabled={isLoading}
            className={`flex items-center space-x-2 px-4 py-2 ${themeClasses.textSecondary} hover:${themeClasses.text} ${themeClasses.hover} rounded-lg transition-colors disabled:opacity-50`}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedView(tab.id as any)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                selectedView === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : `${themeClasses.cardBackground} ${themeClasses.text} ${themeClasses.hover} border ${themeClasses.border}`
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`px-2 py-1 text-xs rounded-full ${
                  selectedView === tab.id 
                    ? 'bg-white/20 text-white' 
                    : 'bg-red-100 text-red-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className={themeClasses.textSecondary}>Analyzing your financial data...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Cash Flow Forecast */}
          {selectedView === 'forecast' && (
            <div className="space-y-6">
              {/* Forecast Controls */}
              <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm border ${themeClasses.border} p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-lg font-semibold ${themeClasses.text}`}>
                    Forecast Settings
                  </h2>
                </div>
                <div className="flex items-center space-x-4">
                  <label className={`text-sm font-medium ${themeClasses.text}`}>
                    Forecast Period:
                  </label>
                  <select
                    value={forecastDays}
                    onChange={(e) => setForecastDays(Number(e.target.value))}
                    className={`px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${themeClasses.cardBackground}`}
                  >
                    <option value={30}>30 Days</option>
                    <option value={60}>60 Days</option>
                    <option value={90}>90 Days</option>
                  </select>
                </div>
              </div>

              {/* Forecast Chart */}
              <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm border ${themeClasses.border} p-6`}>
                <h2 className={`text-lg font-semibold ${themeClasses.text} mb-6`}>
                  Cash Flow Projection
                </h2>
                
                {cashFlowForecast.length > 0 ? (
                  <div className="space-y-4">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">
                              Projected Income
                            </p>
                            <p className="text-xl font-bold text-green-600">
                              {formatCurrency(cashFlowForecast.reduce((sum, f) => sum + f.projectedIncome, 0))}
                            </p>
                          </div>
                          <TrendingUp className="w-8 h-8 text-green-600" />
                        </div>
                      </div>
                      
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-red-800 dark:text-red-200">
                              Projected Expenses
                            </p>
                            <p className="text-xl font-bold text-red-600">
                              {formatCurrency(cashFlowForecast.reduce((sum, f) => sum + f.projectedExpenses, 0))}
                            </p>
                          </div>
                          <TrendingDown className="w-8 h-8 text-red-600" />
                        </div>
                      </div>
                      
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                              Final Balance
                            </p>
                            <p className={`text-xl font-bold ${
                              cashFlowForecast[cashFlowForecast.length - 1]?.projectedBalance >= 0 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {formatCurrency(cashFlowForecast[cashFlowForecast.length - 1]?.projectedBalance || 0)}
                            </p>
                          </div>
                          <DollarSign className="w-8 h-8 text-blue-600" />
                        </div>
                      </div>
                    </div>

                    {/* Forecast Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className={`px-4 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                              Date
                            </th>
                            <th className={`px-4 py-3 text-right text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                              Income
                            </th>
                            <th className={`px-4 py-3 text-right text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                              Expenses
                            </th>
                            <th className={`px-4 py-3 text-right text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                              Balance
                            </th>
                            <th className={`px-4 py-3 text-center text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                              Confidence
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {cashFlowForecast.slice(0, 14).map((forecast, index) => (
                            <tr key={forecast.date} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className={`px-4 py-3 whitespace-nowrap text-sm ${themeClasses.text}`}>
                                {formatDate(forecast.date)}
                              </td>
                              <td className={`px-4 py-3 whitespace-nowrap text-sm text-right text-green-600`}>
                                {formatCurrency(forecast.projectedIncome)}
                              </td>
                              <td className={`px-4 py-3 whitespace-nowrap text-sm text-right text-red-600`}>
                                {formatCurrency(forecast.projectedExpenses)}
                              </td>
                              <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-medium ${
                                forecast.projectedBalance >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {formatCurrency(forecast.projectedBalance)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-center">
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getConfidenceColor(forecast.confidence)}`}>
                                  {forecast.confidence}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className={themeClasses.textSecondary}>
                      Not enough transaction data to generate forecast
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Anomalies */}
          {selectedView === 'anomalies' && (
            <div className="space-y-6">
              {anomalies.length > 0 ? (
                anomalies.map((anomaly) => {
                  const Icon = getAnomalyIcon(anomaly.type);
                  return (
                    <div
                      key={anomaly.id}
                      className={`${themeClasses.cardBackground} rounded-lg shadow-sm border p-6 ${getSeverityColor(anomaly.severity)}`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getSeverityColor(anomaly.severity)}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className={`text-lg font-semibold ${themeClasses.text}`}>
                              {anomaly.title}
                            </h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(anomaly.severity)}`}>
                              {anomaly.severity} severity
                            </span>
                          </div>
                          
                          <p className={`${themeClasses.textSecondary} mb-4`}>
                            {anomaly.description}
                          </p>
                          
                          {anomaly.suggestedAction && (
                            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                              <p className="text-sm text-blue-800 dark:text-blue-200">
                                <strong>Suggested Action:</strong> {anomaly.suggestedAction}
                              </p>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className={themeClasses.textSecondary}>
                              {anomaly.transactions.length} transaction(s) affected
                            </span>
                            <span className={themeClasses.textSecondary}>
                              Detected: {formatDate(anomaly.detectedAt.split('T')[0])}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm border ${themeClasses.border} p-8 text-center`}>
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className={`text-lg font-medium ${themeClasses.text} mb-2`}>
                    No Anomalies Detected
                  </h3>
                  <p className={themeClasses.textSecondary}>
                    Your financial data looks clean and consistent. Great job!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* AI Insights */}
          {selectedView === 'insights' && (
            <div className="space-y-6">
              {insights.length > 0 ? (
                insights.map((insight) => {
                  const Icon = getInsightIcon(insight.type);
                  return (
                    <div
                      key={insight.id}
                      className={`${themeClasses.cardBackground} rounded-lg shadow-sm border ${themeClasses.border} p-6`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          insight.impact === 'positive' ? 'bg-green-100 text-green-600' :
                          insight.impact === 'negative' ? 'bg-red-100 text-red-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className={`text-lg font-semibold ${themeClasses.text}`}>
                              {insight.title}
                            </h3>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                insight.priority === 'high' ? 'bg-red-100 text-red-600' :
                                insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {insight.priority} priority
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                                insight.impact === 'positive' ? 'bg-green-100 text-green-600' :
                                insight.impact === 'negative' ? 'bg-red-100 text-red-600' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {insight.impact}
                              </span>
                            </div>
                          </div>
                          
                          <p className={`${themeClasses.textSecondary} mb-4`}>
                            {insight.description}
                          </p>
                          
                          {insight.actionable && insight.suggestedActions && (
                            <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                              <p className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-2">
                                Suggested Actions:
                              </p>
                              <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                                {insight.suggestedActions.map((action, index) => (
                                  <li key={index} className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>{action}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className={`capitalize ${themeClasses.textSecondary}`}>
                              {insight.type} insight
                            </span>
                            <span className={themeClasses.textSecondary}>
                              Generated: {formatDate(insight.createdAt.split('T')[0])}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm border ${themeClasses.border} p-8 text-center`}>
                  <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className={`text-lg font-medium ${themeClasses.text} mb-2`}>
                    No Insights Available
                  </h3>
                  <p className={themeClasses.textSecondary}>
                    Add more transactions to generate AI-powered insights and recommendations.
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}