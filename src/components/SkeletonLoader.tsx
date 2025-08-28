import { cn } from '../utils/tailwind-utils';

interface SkeletonLoaderProps {
  className?: string;
  count?: number;
  as?: 'div' | 'span';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  height?: string | number;
  width?: string | number;
}

export function SkeletonLoader({
  className = '',
  count = 1,
  as: Component = 'div',
  rounded = 'md',
  height = '1.5rem',
  width = '100%',
  ...props
}: SkeletonLoaderProps) {
  const roundedClass = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded',
    lg: 'rounded-lg',
    full: 'rounded-full',
  }[rounded];

  const skeletons = Array.from({ length: count }).map((_, i) => (
    <Component
      key={i}
      className={cn(
        'animate-pulse bg-gray-200 dark:bg-gray-700',
        roundedClass,
        className
      )}
      style={{ 
        height: typeof height === 'number' ? `${height}px` : height,
        width: typeof width === 'number' ? `${width}px` : width,
        minWidth: typeof width === 'number' ? `${width}px` : width,
      }}
      {...props}
    />
  ));

  return <>{skeletons}</>;
}

// Pre-configured skeleton loaders
export function CardSkeleton({ className = '', count = 1 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className={cn(
            'bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse',
            className
          )}
        >
          <div className="flex justify-between items-center mb-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ className = '', height = 300 }) {
  return (
    <div 
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse',
        className
      )}
    >
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
      <div 
        className="bg-gray-100 dark:bg-gray-700 rounded" 
        style={{ height: `${height}px` }}
      ></div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4, className = '' }) {
  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden', className)}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4 flex items-center justify-between">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div 
                key={colIndex} 
                className={`h-4 bg-gray-200 dark:bg-gray-700 rounded ${
                  colIndex === columns - 1 ? 'w-1/4' : 'w-1/3'
                }`}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
