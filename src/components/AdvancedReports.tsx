import React, { useState, useEffect } from 'react';
import {
  Download,
  FileText,
  BarChart3,
  PieChart,
  Users,
  Package,
  Building,
  TrendingUp,
  TrendingDown,
  Calendar,
  RefreshCw,
  Filter
} from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { getTransactions, getTransactionsByDateRange } from '../utils/database';
import type { Transaction } from '../utils/database';

interface AdvancedReportsProps {
  className?: string;
}

interface SalesAnalysis {
  byCustomer: Array<{
    customer: string;
    totalSales: number;
    transactionCount: number;
    averageOrderValue: number;
  }>;
  byProduct: Array<{
    product: string;
    totalSales: number;
    quantity: number;
    averagePrice: number;
  }>;
  byCategory: Array<{
    category: string;
    totalSales: number;
    percentage: number;
  }>;
}

interface ExpenseAnalysis {
  byVendor: Array<{
    vendor: string;
    totalExpenses: number;
    transactionCount: number;
    averageAmount: number;
  }>;
  byCategory: Array<{
    category: string;
    totalExpenses: number;
    percentage: number;
    transactionCount: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    amount: number;
  }>;
}

interface ReportData {
  salesAnalysis: SalesAnalysis;
  expenseAnalysis: ExpenseAnalysis;
  totalSales: number;
  totalExpenses: number;
  profitMargin: number;
}

export function AdvancedReports({ className = '' }: AdvancedReportsProps) {
  const { formatCurrency, formatDate, getThemeClasses } = useSettings();
  const themeClasses = getThemeClasses();
  
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  
  const [reportData, setReportData] = useState<ReportData>({
    salesAnalysis: {
      byCustomer: [],
      byProduct: [],
      byCategory: []
    },
    expenseAnalysis: {
      byVendor: [],
      byCategory: [],
      monthlyTrend: []
    },
    totalSales: 0,
    totalExpenses: 0,
    profitMargin: 0
  });
  
  const [selectedView, setSelectedView] = useState<'sales' | 'expenses' | 'comparison'>('sales');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAdvancedReportData();
  }, [dateRange]);

  const loadAdvancedReportData = async () => {
    setIsLoading(true);
    try {
      const transactions = await getTransactionsByDateRange(dateRange.startDate, dateRange.endDate);
      
      // Analyze sales data
      const salesTransactions = transactions.filter(t => t.type === 'income');
      const expenseTransactions = transactions.filter(t => t.type === 'expense');
      
      // Sales by customer analysis
      const customerSales = new Map<string, { total: number; count: number }>();
      salesTransactions.forEach(t => {
        const customer = t.description.includes('from') ? 
          t.description.split('from')[1]?.trim() || 'Unknown Customer' : 
          'Direct Sale';
        const existing = customerSales.get(customer) || { total: 0, count: 0 };
        customerSales.set(customer, {
          total: existing.total + t.amount,
          count: existing.count + 1
        });
      });

      const byCustomer = Array.from(customerSales.entries()).map(([customer, data]) => ({
        customer,
        totalSales: data.total,
        transactionCount: data.count,
        averageOrderValue: data.total / data.count
      })).sort((a, b) => b.totalSales - a.totalSales);

      // Sales by product/service analysis
      const productSales = new Map<string, { total: number; count: number }>();
      salesTransactions.forEach(t => {
        const product = t.category || 'General Service';
        const existing = productSales.get(product) || { total: 0, count: 0 };
        productSales.set(product, {
          total: existing.total + t.amount,
          count: existing.count + 1
        });
      });

      const byProduct = Array.from(productSales.entries()).map(([product, data]) => ({
        product,
        totalSales: data.total,
        quantity: data.count,
        averagePrice: data.total / data.count
      })).sort((a, b) => b.totalSales - a.totalSales);

      // Sales by category
      const totalSales = salesTransactions.reduce((sum, t) => sum + t.amount, 0);
      const categorySales = new Map<string, number>();
      salesTransactions.forEach(t => {
        const category = t.category || 'General';
        categorySales.set(category, (categorySales.get(category) || 0) + t.amount);
      });

      const byCategory = Array.from(categorySales.entries()).map(([category, total]) => ({
        category,
        totalSales: total,
        percentage: totalSales > 0 ? (total / totalSales) * 100 : 0
      })).sort((a, b) => b.totalSales - a.totalSales);

      // Expense analysis by vendor
      const vendorExpenses = new Map<string, { total: number; count: number }>();
      expenseTransactions.forEach(t => {
        const vendor = t.description.includes('to') ? 
          t.description.split('to')[1]?.trim() || 'Unknown Vendor' : 
          'Direct Expense';
        const existing = vendorExpenses.get(vendor) || { total: 0, count: 0 };
        vendorExpenses.set(vendor, {
          total: existing.total + t.amount,
          count: existing.count + 1
        });
      });

      const expensesByVendor = Array.from(vendorExpenses.entries()).map(([vendor, data]) => ({
        vendor,
        totalExpenses: data.total,
        transactionCount: data.count,
        averageAmount: data.total / data.count
      })).sort((a, b) => b.totalExpenses - a.totalExpenses);

      // Expense analysis by category
      const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
      const categoryExpenses = new Map<string, { total: number; count: number }>();
      expenseTransactions.forEach(t => {
        const category = t.category || 'General';
        const existing = categoryExpenses.get(category) || { total: 0, count: 0 };
        categoryExpenses.set(category, {
          total: existing.total + t.amount,
          count: existing.count + 1
        });
      });

      const expensesByCategory = Array.from(categoryExpenses.entries()).map(([category, data]) => ({
        category,
        totalExpenses: data.total,
        percentage: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0,
        transactionCount: data.count
      })).sort((a, b) => b.totalExpenses - a.totalExpenses);

      // Monthly expense trend
      const monthlyExpenses = new Map<string, number>();
      expenseTransactions.forEach(t => {
        const month = new Date(t.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthlyExpenses.set(month, (monthlyExpenses.get(month) || 0) + t.amount);
      });

      const monthlyTrend = Array.from(monthlyExpenses.entries()).map(([month, amount]) => ({
        month,
        amount
      })).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

      const profitMargin = totalSales > 0 ? ((totalSales - totalExpenses) / totalSales) * 100 : 0;

      setReportData({
        salesAnalysis: {
          byCustomer,
          byProduct,
          byCategory
        },
        expenseAnalysis: {
          byVendor: expensesByVendor,
          byCategory: expensesByCategory,
          monthlyTrend
        },
        totalSales,
        totalExpenses,
        profitMargin
      });
    } catch (error) {
      console.error('Failed to load advanced report data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    let csvContent = '';
    let filename = '';
    
    if (selectedView === 'sales') {
      csvContent = 'SALES BY CUSTOMER\n';
      csvContent += 'Customer,Total Sales,Transaction Count,Average Order Value\n';
      reportData.salesAnalysis.byCustomer.forEach(item => {
        csvContent += `${item.customer},${item.totalSales},${item.transactionCount},${item.averageOrderValue}\n`;
      });
      
      csvContent += '\nSALES BY PRODUCT/SERVICE\n';
      csvContent += 'Product/Service,Total Sales,Quantity,Average Price\n';
      reportData.salesAnalysis.byProduct.forEach(item => {
        csvContent += `${item.product},${item.totalSales},${item.quantity},${item.averagePrice}\n`;
      });
      
      filename = 'sales-analysis.csv';
    } else if (selectedView === 'expenses') {
      csvContent = 'EXPENSES BY VENDOR\n';
      csvContent += 'Vendor,Total Expenses,Transaction Count,Average Amount\n';
      reportData.expenseAnalysis.byVendor.forEach(item => {
        csvContent += `${item.vendor},${item.totalExpenses},${item.transactionCount},${item.averageAmount}\n`;
      });
      
      csvContent += '\nEXPENSES BY CATEGORY\n';
      csvContent += 'Category,Total Expenses,Percentage,Transaction Count\n';
      reportData.expenseAnalysis.byCategory.forEach(item => {
        csvContent += `${item.category},${item.totalExpenses},${item.percentage}%,${item.transactionCount}\n`;
      });
      
      filename = 'expense-analysis.csv';
    } else {
      csvContent = 'FINANCIAL COMPARISON\n';
      csvContent += `Total Sales,${reportData.totalSales}\n`;
      csvContent += `Total Expenses,${reportData.totalExpenses}\n`;
      csvContent += `Net Profit,${reportData.totalSales - reportData.totalExpenses}\n`;
      csvContent += `Profit Margin,${reportData.profitMargin}%\n`;
      filename = 'financial-comparison.csv';
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reportTabs = [
    { id: 'sales', label: 'Sales Analysis', icon: TrendingUp },
    { id: 'expenses', label: 'Expense Analysis', icon: TrendingDown },
    { id: 'comparison', label: 'Comparison', icon: BarChart3 }
  ];

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-2xl font-bold ${themeClasses.text}`}>
            Advanced Reports
          </h1>
          <p className={`${themeClasses.textSecondary} mt-1`}>
            Detailed sales and expense analysis
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={loadAdvancedReportData}
            disabled={isLoading}
            className={`flex items-center space-x-2 px-4 py-2 ${themeClasses.textSecondary} hover:${themeClasses.text} ${themeClasses.hover} rounded-lg transition-colors disabled:opacity-50`}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm border ${themeClasses.border} p-6 mb-8`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-semibold ${themeClasses.text} flex items-center`}>
            <Calendar className="w-5 h-5 mr-2" />
            Analysis Period
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
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${themeClasses.cardBackground}`}
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
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${themeClasses.cardBackground}`}
            />
          </div>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex space-x-1 mb-8">
        {reportTabs.map((tab) => {
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
            </button>
          );
        })}
      </div>

      {/* Report Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className={themeClasses.textSecondary}>Analyzing data...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Sales Analysis */}
          {selectedView === 'sales' && (
            <>
              {/* Sales by Customer */}
              <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm border ${themeClasses.border} p-6`}>
                <h3 className={`text-lg font-semibold ${themeClasses.text} mb-6 flex items-center`}>
                  <Users className="w-5 h-5 mr-2" />
                  Sales by Customer
                </h3>
                
                {reportData.salesAnalysis.byCustomer.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className={`w-12 h-12 ${themeClasses.textSecondary} mx-auto mb-4`} />
                    <p className={themeClasses.textSecondary}>No customer sales data available for the selected period</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                            Customer
                          </th>
                          <th className={`px-6 py-3 text-right text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                            Total Sales
                          </th>
                          <th className={`px-6 py-3 text-right text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                            Orders
                          </th>
                          <th className={`px-6 py-3 text-right text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                            Avg Order Value
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {reportData.salesAnalysis.byCustomer.map((customer, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${themeClasses.text}`}>
                              {customer.customer}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600`}>
                              {formatCurrency(customer.totalSales)}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${themeClasses.text}`}>
                              {customer.transactionCount}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${themeClasses.text}`}>
                              {formatCurrency(customer.averageOrderValue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Sales by Product/Service */}
              <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm border ${themeClasses.border} p-6`}>
                <h3 className={`text-lg font-semibold ${themeClasses.text} mb-6 flex items-center`}>
                  <Package className="w-5 h-5 mr-2" />
                  Sales by Product/Service
                </h3>
                
                {reportData.salesAnalysis.byProduct.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className={`w-12 h-12 ${themeClasses.textSecondary} mx-auto mb-4`} />
                    <p className={themeClasses.textSecondary}>No product sales data available for the selected period</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                            Product/Service
                          </th>
                          <th className={`px-6 py-3 text-right text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                            Total Sales
                          </th>
                          <th className={`px-6 py-3 text-right text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                            Quantity
                          </th>
                          <th className={`px-6 py-3 text-right text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                            Avg Price
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {reportData.salesAnalysis.byProduct.map((product, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${themeClasses.text}`}>
                              {product.product}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600`}>
                              {formatCurrency(product.totalSales)}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${themeClasses.text}`}>
                              {product.quantity}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${themeClasses.text}`}>
                              {formatCurrency(product.averagePrice)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Expense Analysis */}
          {selectedView === 'expenses' && (
            <>
              {/* Expenses by Vendor */}
              <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm border ${themeClasses.border} p-6`}>
                <h3 className={`text-lg font-semibold ${themeClasses.text} mb-6 flex items-center`}>
                  <Building className="w-5 h-5 mr-2" />
                  Expenses by Vendor
                </h3>
                
                {reportData.expenseAnalysis.byVendor.length === 0 ? (
                  <div className="text-center py-8">
                    <Building className={`w-12 h-12 ${themeClasses.textSecondary} mx-auto mb-4`} />
                    <p className={themeClasses.textSecondary}>No vendor expense data available for the selected period</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                            Vendor
                          </th>
                          <th className={`px-6 py-3 text-right text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                            Total Expenses
                          </th>
                          <th className={`px-6 py-3 text-right text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                            Transactions
                          </th>
                          <th className={`px-6 py-3 text-right text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                            Avg Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {reportData.expenseAnalysis.byVendor.map((vendor, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${themeClasses.text}`}>
                              {vendor.vendor}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-red-600`}>
                              {formatCurrency(vendor.totalExpenses)}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${themeClasses.text}`}>
                              {vendor.transactionCount}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${themeClasses.text}`}>
                              {formatCurrency(vendor.averageAmount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Expenses by Category */}
              <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm border ${themeClasses.border} p-6`}>
                <h3 className={`text-lg font-semibold ${themeClasses.text} mb-6 flex items-center`}>
                  <PieChart className="w-5 h-5 mr-2" />
                  Expenses by Category
                </h3>
                
                {reportData.expenseAnalysis.byCategory.length === 0 ? (
                  <div className="text-center py-8">
                    <PieChart className={`w-12 h-12 ${themeClasses.textSecondary} mx-auto mb-4`} />
                    <p className={themeClasses.textSecondary}>No expense category data available for the selected period</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reportData.expenseAnalysis.byCategory.map((category, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className={`w-4 h-4 rounded-full bg-red-500`} style={{
                            backgroundColor: `hsl(${(index * 60) % 360}, 70%, 50%)`
                          }}></div>
                          <div>
                            <h4 className={`font-medium ${themeClasses.text}`}>{category.category}</h4>
                            <p className={`text-sm ${themeClasses.textSecondary}`}>
                              {category.transactionCount} transactions
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-red-600`}>
                            {formatCurrency(category.totalExpenses)}
                          </p>
                          <p className={`text-sm ${themeClasses.textSecondary}`}>
                            {category.percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Comparison View */}
          {selectedView === 'comparison' && (
            <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm border ${themeClasses.border} p-6`}>
              <h3 className={`text-lg font-semibold ${themeClasses.text} mb-6 flex items-center`}>
                <BarChart3 className="w-5 h-5 mr-2" />
                Financial Performance Summary
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-green-600 font-medium">Total Sales</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(reportData.totalSales)}
                  </p>
                </div>
                
                <div className="text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <TrendingDown className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <p className="text-sm text-red-600 font-medium">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(reportData.totalExpenses)}
                  </p>
                </div>
                
                <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-blue-600 font-medium">Net Profit</p>
                  <p className={`text-2xl font-bold ${
                    reportData.totalSales - reportData.totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(reportData.totalSales - reportData.totalExpenses)}
                  </p>
                </div>
                
                <div className="text-center p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <PieChart className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm text-purple-600 font-medium">Profit Margin</p>
                  <p className={`text-2xl font-bold ${
                    reportData.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {reportData.profitMargin.toFixed(1)}%
                  </p>
                </div>
              </div>
              
              {/* Performance Insights */}
              <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className={`font-semibold ${themeClasses.text} mb-4`}>Performance Insights</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      reportData.profitMargin >= 20 ? 'bg-green-500' : 
                      reportData.profitMargin >= 10 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <p className={`text-sm ${themeClasses.text}`}>
                      {reportData.profitMargin >= 20 ? 'Excellent profit margin - business is performing very well' :
                       reportData.profitMargin >= 10 ? 'Good profit margin - consider optimizing expenses' :
                       'Low profit margin - review pricing and cost structure'}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <p className={`text-sm ${themeClasses.text}`}>
                      Top customer represents {reportData.salesAnalysis.byCustomer.length > 0 ? 
                        ((reportData.salesAnalysis.byCustomer[0]?.totalSales || 0) / reportData.totalSales * 100).toFixed(1) : 0}% of total sales
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <p className={`text-sm ${themeClasses.text}`}>
                      Top expense category represents {reportData.expenseAnalysis.byCategory.length > 0 ? 
                        reportData.expenseAnalysis.byCategory[0]?.percentage.toFixed(1) : 0}% of total expenses
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}