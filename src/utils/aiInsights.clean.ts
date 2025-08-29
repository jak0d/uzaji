// AI Financial Assistant utility
// Provides cash flow forecasting, anomaly detection, and financial insights

import { Transaction } from './database';

// Type definitions for financial analysis
interface CategorySpending {
  [category: string]: number;
}

interface HistoricalData {
  dailyIncome: Record<number, number[]>;
  dailyExpenses: Record<number, number[]>;
  monthlyIncome: Record<number, number[]>;
  monthlyExpenses: Record<number, number[]>;
  totalTransactions: number;
  avgDailyIncome: number;
  avgDailyExpenses: number;
}

interface SeasonalPatterns {
  weekly: Record<number, { income: number; expenses: number }>;
  monthly: Record<number, { income: number; expenses: number }>;
}

export interface CashFlowForecast {
  startDate: string;
  endDate: string;
  days: Array<{
    date: string;
    income: number;
    expenses: number;
    balance: number;
    confidence: 'high' | 'medium' | 'low';
    method?: string;
    dailyNet?: number;
  }>;
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  confidence: 'high' | 'medium' | 'low';
  method?: string;
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
  private historicalData: HistoricalData;

  private constructor() {
    this.historicalData = {
      dailyIncome: {},
      dailyExpenses: {},
      monthlyIncome: {},
      monthlyExpenses: {},
      totalTransactions: 0,
      avgDailyIncome: 0,
      avgDailyExpenses: 0
    };
  }

  public static getInstance(): AIFinancialAssistant {
    if (!AIFinancialAssistant.instance) {
      AIFinancialAssistant.instance = new AIFinancialAssistant();
    }
    return AIFinancialAssistant.instance;
  }

  // Core forecasting methods
  public async generateCashFlowForecast(
    transactions: Transaction[],
    forecastDays: number = 30,
    method: 'weighted' | 'exponential' | 'moving_average' = 'weighted'
  ): Promise<CashFlowForecast> {
    // Implementation will be added
    return {} as CashFlowForecast;
  }

  // Anomaly detection
  public async detectAnomalies(transactions: Transaction[]): Promise<FinancialAnomaly[]> {
    // Implementation will be added
    return [];
  }

  // Analysis methods
  public analyzeTrends(transactions: Transaction[]): AIInsight[] {
    // Implementation will be added
    return [];
  }

  // Helper methods
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateStandardDeviation(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = this.calculateAverage(values);
    const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
    const variance = this.calculateAverage(squaredDifferences);
    return Math.sqrt(variance);
  }

  private calculateLinearTrend(data: number[]): { slope: number; rSquared: number; direction: 'up' | 'down' | 'stable' } {
    if (data.length < 2) {
      return { slope: 0, rSquared: 0, direction: 'stable' };
    }
    
    const n = data.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    let sumYY = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += data[i];
      sumXY += i * data[i];
      sumXX += i * i;
      sumYY += data[i] * data[i];
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
    const intercept = (sumY - slope * sumX) / n;
    const ssTotal = n * sumYY - sumY * sumY;
    const ssResidual = Math.max(0, ssTotal - (slope * (n * sumXY - sumX * sumY)));
    const rSquared = ssTotal !== 0 ? 1 - (ssResidual / ssTotal) : 0;
    
    let direction: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(slope) > 0.01) {
      direction = slope > 0 ? 'up' : 'down';
    }

    return {
      slope: parseFloat(slope.toFixed(4)),
      rSquared: parseFloat(rSquared.toFixed(4)),
      direction
    };
  }

  private analyzeSeasonalPatterns(transactions: Transaction[]): SeasonalPatterns {
    const patterns: SeasonalPatterns = {
      weekly: {},
      monthly: {}
    };
    
    // Implementation will be added
    return patterns;
  }

  private analyzeHistoricalData(transactions: Transaction[]): HistoricalData {
    const historicalData: HistoricalData = {
      dailyIncome: {},
      dailyExpenses: {},
      monthlyIncome: {},
      monthlyExpenses: {},
      totalTransactions: transactions.length,
      avgDailyIncome: 0,
      avgDailyExpenses: 0
    };

    // Implementation will be added
    return historicalData;
  }
}

export const aiFinancialAssistant = AIFinancialAssistant.getInstance();
