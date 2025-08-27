// AI Financial Assistant utility
// Provides cash flow forecasting, anomaly detection, and financial insights

import { Transaction } from './database';

export interface CashFlowForecast {
  date: string;
  projectedBalance: number;
  projectedIncome: number;
  projectedExpenses: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface FinancialAnomaly {
  id: string;
  type: 'duplicate' | 'unusual_spending' | 'large_transaction' | 'category_spike';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  transactions: Transaction[];
  suggestedAction?: string;
  detectedAt: string;
}

export interface AIInsight {
  id: string;
  type: 'trend' | 'recommendation' | 'warning' | 'opportunity';
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  suggestedActions?: string[];
  createdAt: string;
}

export class AIFinancialAssistant {
  private static instance: AIFinancialAssistant;

  private constructor() {}

  static getInstance(): AIFinancialAssistant {
    if (!AIFinancialAssistant.instance) {
      AIFinancialAssistant.instance = new AIFinancialAssistant();
    }
    return AIFinancialAssistant.instance;
  }

  // Cash Flow Forecasting
  async generateCashFlowForecast(
    transactions: Transaction[], 
    forecastDays: number = 90
  ): Promise<CashFlowForecast[]> {
    const forecast: CashFlowForecast[] = [];
    const today = new Date();
    
    // Calculate historical averages
    const historicalData = this.analyzeHistoricalData(transactions);
    
    // Get current balance
    let currentBalance = this.calculateCurrentBalance(transactions);
    
    // Generate forecast for each day
    for (let i = 0; i < forecastDays; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(today.getDate() + i);
      
      const dayOfWeek = forecastDate.getDay();
      const dayOfMonth = forecastDate.getDate();
      
      // Predict daily income and expenses based on patterns
      const projectedIncome = this.predictDailyIncome(historicalData, dayOfWeek, dayOfMonth);
      const projectedExpenses = this.predictDailyExpenses(historicalData, dayOfWeek, dayOfMonth);
      
      currentBalance += projectedIncome - projectedExpenses;
      
      // Calculate confidence based on data availability and patterns
      const confidence = this.calculateForecastConfidence(historicalData, i);
      
      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        projectedBalance: Math.round(currentBalance * 100) / 100,
        projectedIncome: Math.round(projectedIncome * 100) / 100,
        projectedExpenses: Math.round(projectedExpenses * 100) / 100,
        confidence
      });
    }
    
    return forecast;
  }

  // Anomaly Detection
  async detectAnomalies(transactions: Transaction[]): Promise<FinancialAnomaly[]> {
    const anomalies: FinancialAnomaly[] = [];
    
    // Detect duplicate transactions
    const duplicates = this.detectDuplicateTransactions(transactions);
    anomalies.push(...duplicates);
    
    // Detect unusual spending patterns
    const unusualSpending = this.detectUnusualSpending(transactions);
    anomalies.push(...unusualSpending);
    
    // Detect large transactions
    const largeTransactions = this.detectLargeTransactions(transactions);
    anomalies.push(...largeTransactions);
    
    // Detect category spending spikes
    const categorySpikes = this.detectCategorySpikes(transactions);
    anomalies.push(...categorySpikes);
    
    return anomalies.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  // Generate AI Insights
  async generateInsights(transactions: Transaction[]): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    
    // Trend analysis
    const trendInsights = this.analyzeTrends(transactions);
    insights.push(...trendInsights);
    
    // Spending recommendations
    const spendingRecommendations = this.generateSpendingRecommendations(transactions);
    insights.push(...spendingRecommendations);
    
    // Cash flow warnings
    const cashFlowWarnings = this.generateCashFlowWarnings(transactions);
    insights.push(...cashFlowWarnings);
    
    // Growth opportunities
    const opportunities = this.identifyOpportunities(transactions);
    insights.push(...opportunities);
    
    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Private helper methods
  private analyzeHistoricalData(transactions: Transaction[]) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentTransactions = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);
    
    const dailyIncome: { [key: number]: number[] } = {};
    const dailyExpenses: { [key: number]: number[] } = {};
    const monthlyIncome: { [key: number]: number[] } = {};
    const monthlyExpenses: { [key: number]: number[] } = {};
    
    recentTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const dayOfWeek = date.getDay();
      const dayOfMonth = date.getDate();
      
      if (transaction.type === 'income') {
        if (!dailyIncome[dayOfWeek]) dailyIncome[dayOfWeek] = [];
        if (!monthlyIncome[dayOfMonth]) monthlyIncome[dayOfMonth] = [];
        dailyIncome[dayOfWeek].push(transaction.amount);
        monthlyIncome[dayOfMonth].push(transaction.amount);
      } else {
        if (!dailyExpenses[dayOfWeek]) dailyExpenses[dayOfWeek] = [];
        if (!monthlyExpenses[dayOfMonth]) monthlyExpenses[dayOfMonth] = [];
        dailyExpenses[dayOfWeek].push(transaction.amount);
        monthlyExpenses[dayOfMonth].push(transaction.amount);
      }
    });
    
    return {
      dailyIncome,
      dailyExpenses,
      monthlyIncome,
      monthlyExpenses,
      totalTransactions: recentTransactions.length,
      avgDailyIncome: this.calculateAverage(recentTransactions.filter(t => t.type === 'income').map(t => t.amount)),
      avgDailyExpenses: this.calculateAverage(recentTransactions.filter(t => t.type === 'expense').map(t => t.amount))
    };
  }

  private calculateCurrentBalance(transactions: Transaction[]): number {
    return transactions.reduce((balance, transaction) => {
      return transaction.type === 'income' 
        ? balance + transaction.amount 
        : balance - transaction.amount;
    }, 0);
  }

  private predictDailyIncome(historicalData: any, dayOfWeek: number, dayOfMonth: number): number {
    const dayIncomes = historicalData.dailyIncome[dayOfWeek] || [];
    const monthIncomes = historicalData.monthlyIncome[dayOfMonth] || [];
    
    if (dayIncomes.length > 0) {
      return this.calculateAverage(dayIncomes);
    } else if (monthIncomes.length > 0) {
      return this.calculateAverage(monthIncomes);
    } else {
      return historicalData.avgDailyIncome / 30; // Spread daily average
    }
  }

  private predictDailyExpenses(historicalData: any, dayOfWeek: number, dayOfMonth: number): number {
    const dayExpenses = historicalData.dailyExpenses[dayOfWeek] || [];
    const monthExpenses = historicalData.monthlyExpenses[dayOfMonth] || [];
    
    if (dayExpenses.length > 0) {
      return this.calculateAverage(dayExpenses);
    } else if (monthExpenses.length > 0) {
      return this.calculateAverage(monthExpenses);
    } else {
      return historicalData.avgDailyExpenses / 30; // Spread daily average
    }
  }

  private calculateForecastConfidence(historicalData: any, dayIndex: number): 'high' | 'medium' | 'low' {
    if (historicalData.totalTransactions > 50 && dayIndex < 30) {
      return 'high';
    } else if (historicalData.totalTransactions > 20 && dayIndex < 60) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private detectDuplicateTransactions(transactions: Transaction[]): FinancialAnomaly[] {
    const anomalies: FinancialAnomaly[] = [];
    const duplicateGroups: { [key: string]: Transaction[] } = {};
    
    transactions.forEach(transaction => {
      const key = `${transaction.date}-${transaction.amount}-${transaction.description}`;
      if (!duplicateGroups[key]) {
        duplicateGroups[key] = [];
      }
      duplicateGroups[key].push(transaction);
    });
    
    Object.entries(duplicateGroups).forEach(([key, group]) => {
      if (group.length > 1) {
        anomalies.push({
          id: `duplicate-${Date.now()}-${Math.random()}`,
          type: 'duplicate',
          severity: 'medium',
          title: 'Potential Duplicate Transactions',
          description: `Found ${group.length} transactions with identical date, amount, and description.`,
          transactions: group,
          suggestedAction: 'Review and remove duplicate entries if confirmed.',
          detectedAt: new Date().toISOString()
        });
      }
    });
    
    return anomalies;
  }

  private detectUnusualSpending(transactions: Transaction[]): FinancialAnomaly[] {
    const anomalies: FinancialAnomaly[] = [];
    const expenses = transactions.filter(t => t.type === 'expense');
    
    if (expenses.length < 10) return anomalies; // Need sufficient data
    
    const amounts = expenses.map(t => t.amount);
    const avgAmount = this.calculateAverage(amounts);
    const stdDev = this.calculateStandardDeviation(amounts);
    const threshold = avgAmount + (2 * stdDev); // 2 standard deviations
    
    const unusualTransactions = expenses.filter(t => t.amount > threshold);
    
    if (unusualTransactions.length > 0) {
      anomalies.push({
        id: `unusual-${Date.now()}`,
        type: 'unusual_spending',
        severity: 'medium',
        title: 'Unusual Spending Detected',
        description: `Found ${unusualTransactions.length} transactions significantly above your average spending pattern.`,
        transactions: unusualTransactions,
        suggestedAction: 'Review these transactions to ensure they are legitimate and properly categorized.',
        detectedAt: new Date().toISOString()
      });
    }
    
    return anomalies;
  }

  private detectLargeTransactions(transactions: Transaction[]): FinancialAnomaly[] {
    const anomalies: FinancialAnomaly[] = [];
    const largeThreshold = 1000; // Configurable threshold
    
    const largeTransactions = transactions.filter(t => t.amount > largeThreshold);
    
    if (largeTransactions.length > 0) {
      anomalies.push({
        id: `large-${Date.now()}`,
        type: 'large_transaction',
        severity: 'low',
        title: 'Large Transactions',
        description: `Found ${largeTransactions.length} transactions over $${largeThreshold}.`,
        transactions: largeTransactions,
        suggestedAction: 'Verify these large transactions are properly documented and categorized.',
        detectedAt: new Date().toISOString()
      });
    }
    
    return anomalies;
  }

  private detectCategorySpikes(transactions: Transaction[]): FinancialAnomaly[] {
    const anomalies: FinancialAnomaly[] = [];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentTransactions = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);
    
    // Group by category
    const categorySpending: { [category: string]: number } = {};
    const categoryTransactions: { [category: string]: Transaction[] } = {};
    
    recentTransactions.forEach(transaction => {
      if (transaction.type === 'expense') {
        categorySpending[transaction.category] = (categorySpending[transaction.category] || 0) + transaction.amount;
        if (!categoryTransactions[transaction.category]) {
          categoryTransactions[transaction.category] = [];
        }
        categoryTransactions[transaction.category].push(transaction);
      }
    });
    
    // Calculate average spending per category
    const amounts = Object.values(categorySpending);
    if (amounts.length < 3) return anomalies;
    
    const avgCategorySpending = this.calculateAverage(amounts);
    const threshold = avgCategorySpending * 2; // 2x average
    
    Object.entries(categorySpending).forEach(([category, amount]) => {
      if (amount > threshold) {
        anomalies.push({
          id: `spike-${category}-${Date.now()}`,
          type: 'category_spike',
          severity: 'medium',
          title: `Spending Spike in ${category}`,
          description: `Spending in ${category} is ${Math.round((amount / avgCategorySpending) * 100)}% above average this month.`,
          transactions: categoryTransactions[category],
          suggestedAction: `Review ${category} expenses to identify the cause of increased spending.`,
          detectedAt: new Date().toISOString()
        });
      }
    });
    
    return anomalies;
  }

  private analyzeTrends(transactions: Transaction[]): AIInsight[] {
    const insights: AIInsight[] = [];
    
    // Revenue trend analysis
    const revenueGrowth = this.calculateRevenueGrowth(transactions);
    if (revenueGrowth.trend !== 'stable') {
      insights.push({
        id: `revenue-trend-${Date.now()}`,
        type: 'trend',
        title: `Revenue ${revenueGrowth.trend === 'increasing' ? 'Growth' : 'Decline'} Detected`,
        description: `Your revenue has ${revenueGrowth.trend === 'increasing' ? 'increased' : 'decreased'} by ${Math.abs(revenueGrowth.percentage)}% over the last 30 days.`,
        impact: revenueGrowth.trend === 'increasing' ? 'positive' : 'negative',
        priority: 'high',
        actionable: true,
        suggestedActions: revenueGrowth.trend === 'increasing' 
          ? ['Consider scaling successful revenue streams', 'Analyze what drove this growth']
          : ['Investigate causes of revenue decline', 'Review and optimize pricing strategy'],
        createdAt: new Date().toISOString()
      });
    }
    
    return insights;
  }

  private generateSpendingRecommendations(transactions: Transaction[]): AIInsight[] {
    const insights: AIInsight[] = [];
    
    // Analyze spending by category
    const categorySpending = this.analyzeCategorySpending(transactions);
    const topSpendingCategory = Object.entries(categorySpending)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topSpendingCategory && topSpendingCategory[1] > 0) {
      insights.push({
        id: `spending-rec-${Date.now()}`,
        type: 'recommendation',
        title: 'Top Spending Category Analysis',
        description: `${topSpendingCategory[0]} accounts for your highest expenses. Consider reviewing these costs for optimization opportunities.`,
        impact: 'neutral',
        priority: 'medium',
        actionable: true,
        suggestedActions: [
          `Review all ${topSpendingCategory[0]} expenses for potential savings`,
          'Compare costs with industry benchmarks',
          'Negotiate better rates with vendors'
        ],
        createdAt: new Date().toISOString()
      });
    }
    
    return insights;
  }

  private generateCashFlowWarnings(transactions: Transaction[]): AIInsight[] {
    const insights: AIInsight[] = [];
    
    const currentBalance = this.calculateCurrentBalance(transactions);
    if (currentBalance < 1000) { // Configurable threshold
      insights.push({
        id: `cashflow-warning-${Date.now()}`,
        type: 'warning',
        title: 'Low Cash Balance Alert',
        description: 'Your current cash balance is below the recommended minimum. Consider reviewing upcoming expenses and income.',
        impact: 'negative',
        priority: 'high',
        actionable: true,
        suggestedActions: [
          'Review upcoming bills and payments',
          'Follow up on outstanding invoices',
          'Consider short-term financing options if needed'
        ],
        createdAt: new Date().toISOString()
      });
    }
    
    return insights;
  }

  private identifyOpportunities(transactions: Transaction[]): AIInsight[] {
    const insights: AIInsight[] = [];
    
    // Identify potential tax deductions
    const businessExpenses = transactions.filter(t => 
      t.type === 'expense' && 
      ['Office Supplies', 'Professional Services', 'Travel', 'Equipment'].includes(t.category)
    );
    
    if (businessExpenses.length > 0) {
      const totalDeductible = businessExpenses.reduce((sum, t) => sum + t.amount, 0);
      insights.push({
        id: `tax-opportunity-${Date.now()}`,
        type: 'opportunity',
        title: 'Tax Deduction Opportunity',
        description: `You have $${totalDeductible.toFixed(2)} in potential business tax deductions. Ensure proper documentation for tax filing.`,
        impact: 'positive',
        priority: 'medium',
        actionable: true,
        suggestedActions: [
          'Organize receipts and documentation',
          'Consult with a tax professional',
          'Review expense categorization for accuracy'
        ],
        createdAt: new Date().toISOString()
      });
    }
    
    return insights;
  }

  // Utility methods
  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  private calculateStandardDeviation(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const avg = this.calculateAverage(numbers);
    const squaredDiffs = numbers.map(num => Math.pow(num - avg, 2));
    return Math.sqrt(this.calculateAverage(squaredDiffs));
  }

  private calculateRevenueGrowth(transactions: Transaction[]) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    
    const recentRevenue = transactions
      .filter(t => t.type === 'income' && new Date(t.date) >= thirtyDaysAgo)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const previousRevenue = transactions
      .filter(t => t.type === 'income' && new Date(t.date) >= sixtyDaysAgo && new Date(t.date) < thirtyDaysAgo)
      .reduce((sum, t) => sum + t.amount, 0);
    
    if (previousRevenue === 0) {
      return { trend: 'stable' as const, percentage: 0 };
    }
    
    const growthPercentage = ((recentRevenue - previousRevenue) / previousRevenue) * 100;
    
    if (Math.abs(growthPercentage) < 5) {
      return { trend: 'stable' as const, percentage: growthPercentage };
    } else if (growthPercentage > 0) {
      return { trend: 'increasing' as const, percentage: growthPercentage };
    } else {
      return { trend: 'decreasing' as const, percentage: growthPercentage };
    }
  }

  private analyzeCategorySpending(transactions: Transaction[]) {
    const categorySpending: { [category: string]: number } = {};
    
    transactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        categorySpending[transaction.category] = (categorySpending[transaction.category] || 0) + transaction.amount;
      });
    
    return categorySpending;
  }
}

export const aiFinancialAssistant = AIFinancialAssistant.getInstance();