import { ReactNode } from 'react';
import { useSettings } from '../hooks/useSettings';
import { FaArrowUp, FaArrowDown, FaMinus } from 'react-icons/fa';
import { formatCurrency } from '../utils/formatters';

interface MetricCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'pink' | 'indigo' | 'gray';
}

const colorMap = {
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500',
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-500',
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-500',
  },
  yellow: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-yellow-500',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500',
  },
  pink: {
    bg: 'bg-pink-100 dark:bg-pink-900/30',
    text: 'text-pink-600 dark:text-pink-400',
    border: 'border-pink-500',
  },
  indigo: {
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-500',
  },
  gray: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-500',
  },
};

export function MetricCard({ title, value, icon, trend, trendValue, color = 'blue' }: MetricCardProps) {
  const { getThemeClasses } = useSettings();
  const themeClasses = getThemeClasses();
  const colors = colorMap[color];
  
  return (
    <div className={`${themeClasses.cardBackground} rounded-lg shadow p-6 border-l-4 ${colors.border} h-full flex flex-col`}>
      <div className="flex items-center justify-between flex-grow">
        <div>
          <p className={`text-sm font-medium ${themeClasses.textSecondary}`}>{title}</p>
          <p className={`mt-1 text-2xl font-semibold ${
            value >= 0 ? themeClasses.text : 'text-red-600 dark:text-red-400'
          }`}>
            {formatCurrency(Math.abs(value))}
          </p>
          <div className="mt-2 flex items-center">
            {trend === 'up' && (
              <FaArrowUp className={`h-4 w-4 ${colors.text} mr-1`} />
            )}
            {trend === 'down' && (
              <FaArrowDown className={`h-4 w-4 text-red-500 dark:text-red-400 mr-1`} />
            )}
            {trend === 'neutral' && (
              <FaMinus className={`h-4 w-4 ${themeClasses.textSecondary} mr-1`} />
            )}
            <span className={`text-xs font-medium ${
              trend === 'up' ? colors.text : 
              trend === 'down' ? 'text-red-500 dark:text-red-400' : 
              themeClasses.textSecondary
            }`}>
              {trendValue} {trend !== 'neutral' ? (trend === 'up' ? 'increase' : 'decrease') : ''}
            </span>
            <span className={`text-xs ${themeClasses.textSecondary} ml-1`}>vs last period</span>
          </div>
        </div>
        <div className={`p-3 rounded-full ${colors.bg} ${colors.text}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
