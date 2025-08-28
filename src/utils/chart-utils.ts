import { ChartData, ChartOptions } from 'chart.js';
import { formatCurrency } from './formatters';

// Generate a random color with specified opacity
export const generateRandomColor = (opacity = 1) => {
  const r = Math.floor(Math.random() * 200) + 55; // 55-255 for better visibility
  const g = Math.floor(Math.random() * 200) + 55;
  const b = Math.floor(Math.random() * 200) + 55;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Common chart options
export const getChartOptions = (title: string, isCurrency = true): ChartOptions => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        color: '#6B7280', // gray-500
        font: {
          family: 'Inter, system-ui, -apple-system, sans-serif',
        },
      },
    },
    title: {
      display: !!title,
      text: title,
      color: '#111827', // gray-900
      font: {
        size: 16,
        weight: '600',
        family: 'Inter, system-ui, -apple-system, sans-serif',
      },
    },
    tooltip: {
      backgroundColor: '#1F2937', // gray-800
      titleFont: {
        family: 'Inter, system-ui, -apple-system, sans-serif',
        size: 14,
      },
      bodyFont: {
        family: 'Inter, system-ui, -apple-system, sans-serif',
        size: 13,
        weight: '500',
      },
      padding: 12,
      cornerRadius: 6,
      callbacks: {
        label: (context) => {
          const label = context.dataset.label || '';
          const value = context.parsed.y ?? context.parsed;
          return `${label}: ${isCurrency ? formatCurrency(value) : value}`;
        },
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: '#6B7280', // gray-500
      },
    },
    y: {
      beginAtZero: true,
      grid: {
        color: '#E5E7EB', // gray-200
        borderDash: [5, 5],
      },
      ticks: {
        color: '#6B7280', // gray-500
        callback: (value) => (isCurrency ? formatCurrency(Number(value)) : value),
      },
    },
  },
  elements: {
    line: {
      tension: 0.4,
      borderWidth: 2,
    },
    point: {
      radius: 4,
      hoverRadius: 6,
      backgroundColor: '#FFFFFF',
      borderWidth: 2,
      hoverBorderWidth: 3,
    },
  },
});

// Generate data for line chart
export const generateLineChartData = (
  labels: string[],
  datasets: { label: string; data: number[]; color: string }[],
  isCurrency = true
): ChartData<'line'> => ({
  labels,
  datasets: datasets.map((dataset) => ({
    ...dataset,
    borderColor: dataset.color,
    backgroundColor: `${dataset.color}20`,
    fill: true,
    tension: 0.3,
    pointBackgroundColor: '#FFFFFF',
    pointBorderColor: dataset.color,
    pointHoverBackgroundColor: '#FFFFFF',
    pointHoverBorderColor: dataset.color,
    pointHoverBorderWidth: 3,
  })),
});

// Generate data for pie/doughnut chart
export const generatePieChartData = (
  labels: string[],
  data: number[],
  colors: string[] = [],
  isCurrency = true
): ChartData<'pie'> => {
  const defaultColors = [
    '#3B82F6', // blue-500
    '#10B981', // emerald-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#8B5CF6', // violet-500
    '#EC4899', // pink-500
    '#14B8A6', // teal-500
    '#F97316', // orange-500
  ];

  const backgroundColors = colors.length > 0 
    ? colors 
    : Array.from({ length: Math.max(labels.length, data.length) }, (_, i) => 
        defaultColors[i % defaultColors.length]
      );

  return {
    labels,
    datasets: [
      {
        data,
        backgroundColor: backgroundColors.map(color => `${color}80`),
        borderColor: backgroundColors,
        borderWidth: 1,
        hoverBackgroundColor: backgroundColors.map(color => `${color}CC`),
        hoverBorderColor: backgroundColors,
        hoverOffset: 4,
      },
    ],
  };
};

// Generate data for bar chart
export const generateBarChartData = (
  labels: string[],
  datasets: { label: string; data: number[]; color: string }[],
  isCurrency = true
): ChartData<'bar'> => ({
  labels,
  datasets: datasets.map((dataset) => ({
    ...dataset,
    backgroundColor: `${dataset.color}80`,
    borderColor: dataset.color,
    borderWidth: 1,
    borderRadius: 4,
    hoverBackgroundColor: `${dataset.color}CC`,
    hoverBorderColor: dataset.color,
    categoryPercentage: 0.8,
    barPercentage: 0.9,
  })),
});

// Common chart container style
export const chartContainerStyle = {
  position: 'relative' as const,
  width: '100%',
  minHeight: '300px',
  margin: '0 auto',
};

// Format date for chart labels
export const formatDateLabel = (date: Date, format: 'day' | 'month' | 'year' = 'day') => {
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };

  if (format === 'month') {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } else if (format === 'year') {
    return date.getFullYear().toString();
  }
  
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
};
