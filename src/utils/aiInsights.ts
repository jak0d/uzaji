// AI Financial Assistant utility
// Provides cash flow forecasting, anomaly detection, and financial insights

import { Transaction } from './database';

// Type definitions for financial analysis
interface HistoricalData {
  dailyIncome: { [day: number]: number[] };
  dailyExpenses: { [day: number]: number[] };
  monthlyIncome: { [month: number]: number[] };
  monthlyExpenses: { [month: number]: number[] };
  avgDailyIncome: number;
  avgDailyExpenses: number;
  totalTransactions: number;
}

interface SeasonalPatterns {
  daily: number[];
  monthly: number[];
}

export interface CashFlowForecast {
  date: string;
  projectedIncome: number;
  projectedExpenses: number;
  projectedBalance: number;
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

  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }

  private calculateStandardDeviation(numbers: number[]): number {
    if (numbers.length < 2) return 0;
    const mean = this.calculateAverage(numbers);
    const variance = numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / (numbers.length - 1);
    return Math.sqrt(variance);
  }

  private calculateCurrentBalance(transactions: Transaction[]): number {
    return transactions.reduce((balance, t) => {
      return balance + (t.type === 'income' ? t.amount : -t.amount);
    }, 0);
  }

  private analyzeSeasonalPatterns(transactions: Transaction[]): SeasonalPatterns {
    const monthlyTotals: { [month: number]: { income: number, expenses: number, count: number } } = {};
    for (const t of transactions) {
        const month = new Date(t.date).getMonth();
        if (!monthlyTotals[month]) {
            monthlyTotals[month] = { income: 0, expenses: 0, count: 0 };
        }
        if (t.type === 'income') {
            monthlyTotals[month].income += t.amount;
        } else {
            monthlyTotals[month].expenses += t.amount;
        }
        monthlyTotals[month].count++;
    }

    const overallAvgIncome = this.calculateAverage(Object.values(monthlyTotals).map(m => m.income / m.count));
    const seasonalFactors: number[] = [];
    for (let i = 0; i < 12; i++) {
        if (monthlyTotals[i]) {
            const monthAvg = monthlyTotals[i].income / monthlyTotals[i].count;
            seasonalFactors[i] = monthAvg / overallAvgIncome;
        } else {
            seasonalFactors[i] = 1.0;
        }
    }
    return { daily: [], monthly: seasonalFactors };
  }

  // Enhanced Cash Flow Forecasting with multiple forecasting methods
  async generateCashFlowForecast(
    transactions: Transaction[],
    forecastDays: number = 30, // Default to 30 days if not provided
    method: 'weighted' | 'exponential' | 'moving_average' = 'weighted' // Default to weighted method
  ): Promise<CashFlowForecast[]> {
    const forecast: CashFlowForecast[] = [];
    const today = new Date();

    if (transactions.length === 0) {
        return [];
    }

    const historicalData = this.analyzeHistoricalData(transactions);
    const seasonalPatterns = this.analyzeSeasonalPatterns(transactions);
    let lastBalance = this.calculateCurrentBalance(transactions);
    const recentTrend = this.calculateRecentTrend(transactions, 30);

    for (let i = 0; i < forecastDays; i++) {
        const forecastDate = new Date(today);
        forecastDate.setDate(today.getDate() + i);

        let projectedIncome: number;
        let projectedExpenses: number;

        switch (method) {
            case 'exponential':
                [projectedIncome, projectedExpenses] = this.exponentialSmoothingForecast(
                    historicalData,
                    forecastDate
                );
                break;
            case 'moving_average':
                [projectedIncome, projectedExpenses] = this.movingAverageForecast(
                    historicalData,
                    forecastDate,
                    7
                );
                break;
            case 'weighted':
            default:
                [projectedIncome, projectedExpenses] = this.weightedForecast(
                    historicalData,
                    forecastDate,
                    seasonalPatterns,
                    recentTrend
                );
                break;
        }

        const projectedBalance = lastBalance + projectedIncome - projectedExpenses;

        forecast.push({
            date: forecastDate.toISOString(),
            projectedIncome,
            projectedExpenses,
            projectedBalance,
            confidence: 'medium', // Placeholder for now
        });

        lastBalance = projectedBalance;
    }

    return forecast;
  }

  // Weighted forecast that considers multiple factors
  private weightedForecast(
    historicalData: HistoricalData,
    forecastDate: Date,
    seasonalPatterns: SeasonalPatterns,
    recentTrend: { income: number; expenses: number }
  ): [number, number] {
    if (!historicalData || !seasonalPatterns) {
      return [recentTrend.income, recentTrend.expenses];
    }
    const dayOfWeek = forecastDate.getDay();
    const dayOfMonth = forecastDate.getDate();
    const month = forecastDate.getMonth();

    // Predict daily values using historical patterns
    const predictedIncome = this.predictDailyIncome(historicalData, forecastDate);
    const predictedExpenses = this.predictDailyExpenses(historicalData, forecastDate);

    // Apply seasonal adjustments
    const seasonalFactor = seasonalPatterns.monthly[month] || 1.0;

    // Apply recent trend (weighted average of long-term and short-term trends)
    const trendWeight = 0.3; // How much to weight recent trends vs historical

    const projectedIncome = (predictedIncome * (1 - trendWeight)) +
      (recentTrend.income * trendWeight * seasonalFactor);

    const projectedExpenses = (predictedExpenses * (1 - trendWeight)) +
      (recentTrend.expenses * trendWeight * seasonalFactor);

    return [projectedIncome, projectedExpenses];
  }

  // Exponential smoothing forecast (good for data with trends)
  private exponentialSmoothingForecast(
    historicalData: HistoricalData,
    forecastDate: Date,
    alpha: number = 0.3 // Smoothing factor (0-1)
  ): [number, number] {
    // Implement exponential smoothing logic
    // This is a simplified version - in practice, you'd use more sophisticated methods
    // like Holt-Winters for seasonal data
    const dayOfWeek = forecastDate.getDay();
    const prevDay = new Date(forecastDate);
    prevDay.setDate(forecastDate.getDate() - 1);

    // Get predictions for the forecast period
    const dailyIncome = this.predictDailyIncome(historicalData, forecastDate);
    const dailyExpenses = this.predictDailyExpenses(historicalData, forecastDate);

    // Get predictions for the next period (for trend analysis)
    const nextDay = new Date(forecastDate);
    nextDay.setDate(forecastDate.getDate() + 1);
    const nextDayIncome = this.predictDailyIncome(historicalData, nextDay);
    const nextDayExpenses = this.predictDailyExpenses(historicalData, nextDay);

    // Simple exponential smoothing
    const projectedIncome = (alpha * dailyIncome) + ((1 - alpha) * nextDayIncome);
    const projectedExpenses = (alpha * dailyExpenses) + ((1 - alpha) * nextDayExpenses);

    return [projectedIncome, projectedExpenses];
  }

  // Moving average forecast (good for stable trends)
  private movingAverageForecast(
    historicalData: HistoricalData,
    forecastDate: Date,
    windowSize: number = 7 // 7-day moving average
  ): [number, number] {
    // Calculate moving average of the last 'windowSize' days
    const dailyAverages = [];
    const startDate = new Date(forecastDate);
    startDate.setDate(forecastDate.getDate() - windowSize);

    for (let d = new Date(startDate); d < forecastDate; d.setDate(d.getDate() + 1)) {
      const dayIncome = this.predictDailyIncome(historicalData, d);
      const dayExpenses = this.predictDailyExpenses(historicalData, d);
      dailyAverages.push({ income: dayIncome, expenses: dayExpenses });
    }

    // Simple average of the window
    const sum = dailyAverages.reduce((acc, curr) => ({
      income: acc.income + curr.income,
      expenses: acc.expenses + curr.expenses
    }), { income: 0, expenses: 0 });

    return [
      sum.income / dailyAverages.length,
      sum.expenses / dailyAverages.length
    ];
  }

  // Enhanced Anomaly Detection with multiple detection methods
  async detectAnomalies(transactions: Transaction[]): Promise<FinancialAnomaly[]> {
    const anomalies: FinancialAnomaly[] = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // 1. Detect duplicate transactions
    const duplicates = this.detectDuplicateTransactions(transactions);
    anomalies.push(...duplicates);

    // 2. Detect unusual spending patterns (statistical anomalies)
    const spendingAnomalies = this.detectSpendingAnomalies(transactions);
    anomalies.push(...spendingAnomalies);

    // 3. Detect unusual income patterns
    const incomeAnomalies = this.detectIncomeAnomalies(transactions);
    anomalies.push(...incomeAnomalies);

    // 4. Detect category spending spikes
    const categoryAnomalies = this.detectCategoryAnomalies(transactions);
    anomalies.push(...categoryAnomalies);

    // 5. Detect potential fraud patterns
    const fraudAnomalies = this.detectPotentialFraud(transactions);
    anomalies.push(...fraudAnomalies);

    // 6. Detect unusual transaction timing
    const timingAnomalies = this.detectTimingAnomalies(transactions);
    anomalies.push(...timingAnomalies);

    // Sort by severity and date (newest first)
    return anomalies.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      if (severityOrder[b.severity] !== severityOrder[a.severity]) {
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime();
    });
  }

  // Detect statistical anomalies in spending
  private detectDuplicateTransactions(transactions: Transaction[]): FinancialAnomaly[] {
    const duplicates: Transaction[][] = [];
    const seen = new Map<string, Transaction[]>();
    const now = new Date();

    // Group transactions by amount, description, and date (within 1 hour)
    transactions.forEach(transaction => {
      if (!transaction.amount || !transaction.description) return;

      const transactionDate = new Date(transaction.date);
      const timeDiff = Math.abs(now.getTime() - transactionDate.getTime());
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      // Skip transactions older than 30 days
      if (hoursDiff > 30 * 24) return;

      const key = `${transaction.amount}_${transaction.description.toLowerCase().trim()}`;

      if (!seen.has(key)) {
        seen.set(key, [transaction]);
      } else {
        const existing = seen.get(key) || [];
        // Check if this is a duplicate (same amount, similar description, within 24 hours)
        const isDuplicate = existing.some(t => {
          const existingDate = new Date(t.date);
          const diffHours = Math.abs(transactionDate.getTime() - existingDate.getTime()) / (1000 * 60 * 60);
          return diffHours < 24; // Within 24 hours
        });

        if (isDuplicate) {
          existing.push(transaction);
        } else {
          seen.set(key, [...existing, transaction]);
        }
      }
    });

    // Filter for actual duplicates (2+ transactions)
    const duplicateGroups = Array.from(seen.values()).filter(group => group.length > 1);

    // Convert to FinancialAnomaly format
    return duplicateGroups.map(group => ({
      id: `duplicate-${group[0].id}`,
      type: 'duplicate',
      severity: group.length > 2 ? 'high' : 'medium',
      title: `Possible duplicate transaction${group.length > 1 ? 's' : ''}`,
      description: `Found ${group.length} similar transactions within 24 hours`,
      transactions: group,
      suggestedAction: 'Review these transactions to ensure they are not duplicates',
      detectedAt: new Date().toISOString()
    }));
  }

  private detectIncomeAnomalies(transactions: Transaction[]): FinancialAnomaly[] {
    const anomalies: FinancialAnomaly[] = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // Get recent transactions (last 30 days) and historical transactions (last 90 days)
    const recentTransactions = transactions
      .filter(t => new Date(t.date) >= thirtyDaysAgo)
      .filter((t): t is Transaction & { type: 'income' } => t.type === 'income');

    const historicalTransactions = transactions
      .filter(t => new Date(t.date) >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) && new Date(t.date) < thirtyDaysAgo)
      .filter((t): t is Transaction & { type: 'income' } => t.type === 'income');

    if (recentTransactions.length < 5 || historicalTransactions.length < 30) {
      return []; // Not enough data
    }

    // Group transactions by source/payee
    const recentBySource = this.groupTransactionsBySource(recentTransactions);
    const historicalBySource = this.groupTransactionsBySource(historicalTransactions);

    // Calculate average spending per source for both periods
    const recentAverages = this.calculateAverageSpending(recentBySource);
    const historicalAverages = this.calculateAverageSpending(historicalBySource);

    // Compare recent vs historical spending by source
    for (const [source, recentAvg] of Object.entries(recentAverages)) {
      const historicalAvg = historicalAverages[source];

      // Skip if we don't have historical data for this source
      if (historicalAvg === undefined) {
        continue;
      }

      // Calculate the spending ratio (recent vs historical)
      const ratio = recentAvg / historicalAvg;

      // If spending has increased significantly (more than 200%)
      if (ratio > 2.0) {
        const sourceTransactions = recentBySource[source] || [];

        anomalies.push({
          id: `income-high-${source}-${now.getTime()}`,
          type: 'unusual_spending',
          severity: ratio > 3.0 ? 'high' : 'medium',
          title: `Unusually high income from ${source}`,
          description: `Income from ${source} is ${ratio.toFixed(1)}x higher than usual ` +
            `($${recentAvg.toFixed(2)} vs $${historicalAvg.toFixed(2)} daily average)`,
          transactions: sourceTransactions
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5), // Top 5 largest transactions
          suggestedAction: 'Verify this income matches your expectations',
          detectedAt: now.toISOString()
        });
      }
    }

return anomalies;
}

  private detectSpendingAnomalies(transactions: Transaction[]): FinancialAnomaly[] {
    const anomalies: FinancialAnomaly[] = [];
    const now = new Date();
    const expenseTransactions = transactions.filter(t => t.type === 'expense');

    if (expenseTransactions.length < 20) {
      return []; // Not enough data for meaningful analysis
    }

    const transactionsByCategory = this.groupTransactionsByCategory(expenseTransactions);

    for (const category in transactionsByCategory) {
      const categoryTransactions = transactionsByCategory[category];
      const amounts = categoryTransactions.map(t => t.amount);
      const mean = this.calculateAverage(amounts);
      const stdDev = this.calculateStandardDeviation(amounts);

      // A low standard deviation might mean no significant variance to analyze
      if (stdDev < 5) { // Threshold for meaningful deviation
        continue;
      }

      for (const transaction of categoryTransactions) {
        const zScore = (transaction.amount - mean) / stdDev;

        // Detect transactions that are more than 2 standard deviations above the average
        if (zScore > 2.0) {
          anomalies.push({
            id: `spending-anomaly-${transaction.id}`,
            type: 'unusual_spending',
            severity: zScore > 3.0 ? 'high' : 'medium',
            title: `Unusual spending in ${category}`,
            description: `A transaction of $${transaction.amount.toFixed(2)} in the ${category} category is significantly higher than the average of $${mean.toFixed(2)}. `,
            transactions: [transaction],
            suggestedAction: 'Review this transaction to ensure it is legitimate and correctly categorized.',
            detectedAt: now.toISOString(),
          });
        }
      }
    }

    return anomalies;
  }

  private detectCategoryAnomalies(transactions: Transaction[]): FinancialAnomaly[] {
    const anomalies: FinancialAnomaly[] = [];
    const now = new Date();
    const expenseTransactions = transactions.filter(t => t.type === 'expense');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const historicalTransactions = expenseTransactions.filter(t => new Date(t.date) < thirtyDaysAgo);
    const recentTransactions = expenseTransactions.filter(t => new Date(t.date) >= thirtyDaysAgo);

    if (historicalTransactions.length < 20 || recentTransactions.length < 5) {
      return []; // Not enough data for comparison
    }

    const historicalSpendingByCategory = this.groupTransactionsByCategory(historicalTransactions);
    const categoryAverages = this.calculateCategoryAverages(historicalSpendingByCategory);
    const recentCategorySpending = this.groupTransactionsByCategory(recentTransactions);

    for (const category in recentCategorySpending) {
      const historicalAverage = categoryAverages[category] || 0;
      const recentSpendingTotal = recentCategorySpending[category].reduce((sum, t) => sum + t.amount, 0);

      // Avoid flagging categories with low historical spending
      if (historicalAverage < 20) {
        continue;
      }

      // Detect if recent spending is significantly higher than the historical monthly average
      if (recentSpendingTotal > historicalAverage * 1.5) {
        anomalies.push({
          id: `category-anomaly-${category}`,
          type: 'category_spike',
          severity: recentSpendingTotal > historicalAverage * 2 ? 'high' : 'medium',
          title: `Increased spending in ${category}`,
          description: `Your spending in the ${category} category has increased to $${recentSpendingTotal.toFixed(2)} in the last 30 days, compared to a historical monthly average of $${historicalAverage.toFixed(2)}. This could indicate a new recurring bill or a change in spending habits.`,
          transactions: recentCategorySpending[category],
          suggestedAction: 'Review recent transactions in this category to understand the increase.',
          detectedAt: now.toISOString(),
        });
      }
    }

    return anomalies;
  }

  private detectPotentialFraud(transactions: Transaction[]): FinancialAnomaly[] {
    const anomalies: FinancialAnomaly[] = [];
    const now = new Date();

    // Rule 1: Multiple small transactions to the same merchant in a short time (card testing)
    const merchantTransactions = this.groupTransactionsBySource(transactions.filter(t => t.type === 'expense'));
    for (const merchant in merchantTransactions) {
      const group = merchantTransactions[merchant];
      if (group.length > 2) {
        const recentSmallTransactions = group.filter(t => {
          const txDate = new Date(t.date);
          const hoursDiff = (now.getTime() - txDate.getTime()) / (1000 * 3600);
          return t.amount < 50 && hoursDiff < 48; // Small amount, within 48 hours
        });

        if (recentSmallTransactions.length > 2) {
          anomalies.push({
            id: `fraud-card-testing-${merchant}`,
            type: 'unusual_spending',
            severity: 'high',
            title: `Potential card testing activity at ${merchant}`,
            description: `Multiple small transactions were made to ${merchant} in a short period. This can be a sign of card testing. Please review these transactions.`,
            transactions: recentSmallTransactions,
            suggestedAction: 'If these transactions are not familiar, contact your bank immediately.',
            detectedAt: now.toISOString(),
          });
        }
      }
    }

    // Rule 2: Transactions at unusual hours (e.g., 1 AM - 5 AM)
    const lateNightTransactions = transactions.filter(t => {
      const hour = new Date(t.date).getHours();
      return hour >= 1 && hour <= 5;
    });

    if (lateNightTransactions.length > 0) {
      for (const transaction of lateNightTransactions) {
        anomalies.push({
          id: `fraud-timing-${transaction.id}`,
          type: 'unusual_spending',
          severity: 'medium',
          title: 'Transaction at an unusual time',
          description: `A transaction for $${transaction.amount.toFixed(2)} occurred at an unusual time. Please verify its legitimacy.`,
          transactions: [transaction],
          suggestedAction: 'If this transaction is unfamiliar, check for other suspicious activity.',
          detectedAt: now.toISOString(),
        });
      }
    }

    return anomalies;
  }

  private detectTimingAnomalies(transactions: Transaction[]): FinancialAnomaly[] {
    const anomalies: FinancialAnomaly[] = [];
    const now = new Date();
    const transactionsByCategory = this.groupTransactionsByCategory(transactions);

    for (const category in transactionsByCategory) {
      const categoryTransactions = transactionsByCategory[category];
      if (categoryTransactions.length < 10) continue; // Need enough data

      const dayCounts = Array(7).fill(0);
      for (const t of categoryTransactions) {
        dayCounts[new Date(t.date).getDay()]++;
      }

      const typicalDays = dayCounts
        .map((count, day) => ({ day, count }))
        .filter(d => d.count > categoryTransactions.length * 0.1) // Day must have at least 10% of transactions
        .map(d => d.day);

      if (typicalDays.length === 0 || typicalDays.length === 7) continue; // No clear pattern

      for (const transaction of categoryTransactions) {
        const transactionDay = new Date(transaction.date).getDay();
        if (!typicalDays.includes(transactionDay)) {
          anomalies.push({
            id: `timing-anomaly-${transaction.id}`,
            type: 'unusual_spending',
            severity: 'low',
            title: `Unusual timing for ${category} spending`,
            description: `A transaction for $${transaction.amount.toFixed(2)} in ${category} occurred on an unusual day.`,
            transactions: [transaction],
            suggestedAction: 'Check if this transaction was expected on this day of the week.',
            detectedAt: now.toISOString(),
          });
        }
      }
    }

    return anomalies;
  }

    async generateInsights(transactions: Transaction[]): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    const now = new Date();
    const ninetyDaysAgo = new Date(new Date().setDate(now.getDate() - 90));

    const recentTransactions = transactions.filter(t => new Date(t.date) > ninetyDaysAgo);
    const expenseTransactions = recentTransactions.filter(t => t.type === 'expense');

    // Insight 1: Top Spending Categories
    const spendingByCategory = this.groupTransactionsByCategory(expenseTransactions);
    const categoryTotals = Object.entries(spendingByCategory).map(([category, txs]) => ({
      category,
      total: txs.reduce((sum, t) => sum + t.amount, 0),
    })).sort((a, b) => b.total - a.total);

    if (categoryTotals.length > 0) {
      const topCategory = categoryTotals[0];
      insights.push({
        id: `insight-top-spending-${topCategory.category}`,
        type: 'trend',
        title: `Top Spending Category: ${topCategory.category}`,
        description: `Your highest spending in the last 90 days was in ${topCategory.category}, totaling $${topCategory.total.toFixed(2)}. `,
        impact: 'neutral',
        priority: 'medium',
        actionable: true,
        suggestedActions: ['Review spending in this category for savings opportunities.'],
        createdAt: now.toISOString(),
      });
    }

    // Insight 2: Net Cash Flow Trend
    const totalIncome = recentTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    const netCashFlow = totalIncome - totalExpenses;

    insights.push({
      id: 'insight-net-cash-flow',
      type: netCashFlow >= 0 ? 'trend' : 'warning',
      title: netCashFlow >= 0 ? 'Positive Cash Flow Trend' : 'Negative Cash Flow Trend',
      description: `Over the last 90 days, your net cash flow was $${netCashFlow.toFixed(2)}. ` + (netCashFlow >= 0 ? 'You earned more than you spent. Keep it up!' : 'You spent more than you earned. Consider reviewing your budget.'),
      impact: netCashFlow >= 0 ? 'positive' : 'negative',
      priority: 'high',
      actionable: true,
      suggestedActions: ['Analyze spending patterns.', 'Create a budget to track expenses.'],
      createdAt: now.toISOString(),
    });

    // Insight 3: Recurring Expense Detection
    const recurringExpenses = this.detectRecurringExpenses(expenseTransactions);
    if (recurringExpenses.length > 0) {
      const totalRecurring = recurringExpenses.reduce((sum, p) => sum + p.avgAmount, 0);
      insights.push({
        id: 'insight-recurring-expenses',
        type: 'recommendation',
        title: 'Potential Recurring Expenses Found',
        description: `We've identified ${recurringExpenses.length} potential recurring expenses, totaling ~$${totalRecurring.toFixed(2)} per month. Review them to ensure you're not paying for unused subscriptions.`,
        impact: 'neutral',
        priority: 'medium',
        actionable: true,
        suggestedActions: ['Review detected recurring payments.', 'Cancel any unnecessary subscriptions.'],
        createdAt: now.toISOString(),
      });
    }

    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private groupTransactionsBySource(transactions: Transaction[]): Record<string, Transaction[]> {
    return transactions.reduce<Record<string, Transaction[]>>((acc, transaction) => {
      const source = transaction.description || 'Unknown';
      if (!acc[source]) {
        acc[source] = [];
      }
      acc[source].push(transaction);
      return acc;
    }, {});
  }

  private calculateAverageSpending(transactionsBySource: Record<string, Transaction[]>): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [source, transactions] of Object.entries(transactionsBySource)) {
      if (transactions.length > 0) {
        const total = transactions.reduce((sum, t) => sum + t.amount, 0);
        result[source] = total / transactions.length;
      }
    }
    return result;
  }

  private predictDailyIncome(historicalData: HistoricalData, date: Date): number {
    const dayOfWeek = date.getDay();
    const dailyData = historicalData.dailyIncome[dayOfWeek] || [];
    return dailyData.length > 0 ? this.calculateAverage(dailyData) : historicalData.avgDailyIncome;
  }

  private predictDailyExpenses(historicalData: HistoricalData, date: Date): number {
    const dayOfWeek = date.getDay();
    const dailyData = historicalData.dailyExpenses[dayOfWeek] || [];
    return dailyData.length > 0 ? this.calculateAverage(dailyData) : historicalData.avgDailyExpenses;
  }

  private calculateRecentTrend(transactions: Transaction[], days: number): { income: number; expenses: number } {
    const recentTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      const diffDays = (new Date().getTime() - date.getTime()) / (1000 * 3600 * 24);
      return diffDays <= days;
    });

    const income = recentTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = recentTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    return { income: income / days, expenses: expenses / days };
  }


  private analyzeHistoricalData(transactions: Transaction[]): HistoricalData {
    const historicalData: HistoricalData = {
      dailyIncome: {},
      dailyExpenses: {},
      monthlyIncome: {},
      monthlyExpenses: {},
      avgDailyIncome: 0,
      avgDailyExpenses: 0,
      totalTransactions: 0,
    };

    if (!transactions || transactions.length === 0) {
      return historicalData;
    }

    for (const transaction of transactions) {
      const date = new Date(transaction.date);
      const dayOfWeek = date.getDay();
      const month = date.getMonth();

      if (transaction.type === 'income') {
        if (!historicalData.dailyIncome[dayOfWeek]) {
          historicalData.dailyIncome[dayOfWeek] = [];
        }
        historicalData.dailyIncome[dayOfWeek].push(transaction.amount);
        if (!historicalData.monthlyIncome[month]) {
          historicalData.monthlyIncome[month] = [];
        }
        historicalData.monthlyIncome[month].push(transaction.amount);
      } else {
        if (!historicalData.dailyExpenses[dayOfWeek]) {
          historicalData.dailyExpenses[dayOfWeek] = [];
        }
        historicalData.dailyExpenses[dayOfWeek].push(transaction.amount);
        if (!historicalData.monthlyExpenses[month]) {
          historicalData.monthlyExpenses[month] = [];
        }
        historicalData.monthlyExpenses[month].push(transaction.amount);
      }
    }
    const totalIncome = Object.values(historicalData.dailyIncome).flat().reduce((sum, val) => sum + val, 0);
    const totalExpenses = Object.values(historicalData.dailyExpenses).flat().reduce((sum, val) => sum + val, 0);
    const totalDays = (new Date(transactions[transactions.length-1].date).getTime() - new Date(transactions[0].date).getTime()) / (1000 * 3600 * 24);

    historicalData.avgDailyIncome = totalIncome / totalDays;
    historicalData.avgDailyExpenses = totalExpenses / totalDays;
    historicalData.totalTransactions = transactions.length;

    return historicalData;
  }

  private groupTransactionsByCategory(transactions: Transaction[]): Record<string, Transaction[]> {
    return transactions.reduce<Record<string, Transaction[]>>((acc, transaction) => {
      const category = transaction.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(transaction);
      return acc;
    }, {});
  }

  private calculateCategoryAverages(transactionsByCategory: Record<string, Transaction[]>): Record<string, number> {
    const averages: Record<string, number> = {};
    for (const category in transactionsByCategory) {
      const categoryTransactions = transactionsByCategory[category];
      if (categoryTransactions.length > 0) {
        const total = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
        averages[category] = total / categoryTransactions.length;
      }
    }
    return averages;
  }

  private detectRecurringExpenses(transactions: Transaction[]): { name: string; count: number; avgAmount: number }[] {
    const potentialSubscriptions: { name: string; count: number; avgAmount: number }[] = [];
    const groupedByName = this.groupTransactionsBySource(transactions);

    for (const name in groupedByName) {
      const group = groupedByName[name].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      if (group.length < 3) continue; // Need at least 3 transactions to spot a pattern

      const intervals: number[] = [];
      for (let i = 1; i < group.length; i++) {
        const date1 = new Date(group[i - 1].date);
        const date2 = new Date(group[i].date);
        const diffTime = Math.abs(date2.getTime() - date1.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        intervals.push(diffDays);
      }

      if (intervals.length === 0) continue;

      const avgInterval = this.calculateAverage(intervals);
      const intervalStdDev = this.calculateStandardDeviation(intervals);

      // Check for monthly-like payments (25-35 days) with low variance
      if (avgInterval > 25 && avgInterval < 35 && (intervalStdDev < 5 || (intervalStdDev / avgInterval) < 0.15)) {
        const amounts = group.map(tx => tx.amount);
        const avgAmount = this.calculateAverage(amounts);
        const amountStdDev = this.calculateStandardDeviation(amounts);

        // Amount should be consistent
        if (amountStdDev < (avgAmount * 0.1)) { // 10% tolerance
          potentialSubscriptions.push({
            name: group[0].description || name,
            count: group.length,
            avgAmount,
          });
        }
      }
    }

    return potentialSubscriptions;
  }

  
  
}

export const aiFinancialAssistant = AIFinancialAssistant.getInstance();