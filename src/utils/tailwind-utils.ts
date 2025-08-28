import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind CSS classes with clsx and tailwind-merge
 * @param inputs - Class names to merge
 * @returns Merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a random Tailwind CSS color class
 * @param type - The type of color class to generate (bg, text, border, etc.)
 * @param colorSet - The set of colors to choose from (default: primary colors)
 * @returns A random Tailwind CSS color class
 */
export function getRandomColorClass(
  type: 'bg' | 'text' | 'border' | 'ring' | 'from' | 'to' | 'via' | 'fill' | 'stroke' = 'bg',
  colorSet: string[] = [
    'blue', 'indigo', 'purple', 'pink', 'red', 'orange', 'yellow', 'green', 'teal', 'cyan'
  ]
): string {
  const color = colorSet[Math.floor(Math.random() * colorSet.length)];
  const shades = [500, 600, 700, 800, 900];
  const shade = shades[Math.floor(Math.random() * shades.length)];
  
  return `${type}-${color}-${shade} dark:${type}-${color}-${Math.max(300, shade - 200)}`;
}

/**
 * Generates a gradient background class
 * @param direction - The direction of the gradient
 * @returns A Tailwind CSS gradient class
 */
export function getGradientClass(direction: 't' | 'r' | 'b' | 'l' | 'tr' | 'tl' | 'br' | 'bl' = 'r') {
  const directions = {
    t: 'bg-gradient-to-t',
    r: 'bg-gradient-to-r',
    b: 'bg-gradient-to-b',
    l: 'bg-gradient-to-l',
    tr: 'bg-gradient-to-tr',
    tl: 'bg-gradient-to-tl',
    br: 'bg-gradient-to-br',
    bl: 'bg-gradient-to-bl',
  };
  
  const colors = [
    'from-blue-500 to-purple-600',
    'from-pink-500 to-rose-500',
    'from-green-400 to-emerald-600',
    'from-amber-400 to-orange-600',
    'from-indigo-500 to-blue-600',
    'from-purple-500 to-pink-600',
    'from-rose-400 to-red-600',
    'from-cyan-400 to-blue-600',
    'from-lime-400 to-green-600',
    'from-yellow-400 to-amber-600',
  ];
  
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  return `${directions[direction]} ${color}`;
}

/**
 * Generates a random avatar background color class
 * @returns A Tailwind CSS background color class
 */
export function getRandomAvatarColor(): string {
  const colors = [
    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Truncates text and adds an ellipsis if it exceeds the max length
 * @param text - The text to truncate
 * @param maxLength - The maximum length of the text
 * @returns The truncated text with an ellipsis if necessary
 */
export function truncate(text: string, maxLength: number = 20): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Formats a number with commas as thousand separators
 * @param num - The number to format
 * @returns The formatted number as a string
 */
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Converts a string to kebab-case
 * @param str - The string to convert
 * @returns The kebab-cased string
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Debounces a function
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to wait before invoking the function
 * @returns A debounced version of the function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttles a function
 * @param func - The function to throttle
 * @param limit - The time in milliseconds to throttle the function
 * @returns A throttled version of the function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
