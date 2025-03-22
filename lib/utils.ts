import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names with Tailwind's merge function
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date in a human-readable format
 * @param date The date to format
 * @param includeTime Whether to include the time in the formatted date
 * @returns A formatted date string
 */
export function formatDate(date: Date | string, includeTime: boolean = false): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const formattedDate = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  
  if (!includeTime) {
    return formattedDate;
  }
  
  const formattedTime = d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return `${formattedDate} at ${formattedTime}`;
}

/**
 * Truncates a string to a specified length
 * @param str The string to truncate
 * @param length The maximum length of the truncated string
 * @returns The truncated string with an ellipsis if necessary
 */
export function truncateString(str: string, length: number = 50): string {
  if (str.length <= length) {
    return str;
  }
  
  return str.substring(0, length) + '...';
}

/**
 * Debounce a function to limit how often it can be called
 * @param func The function to debounce
 * @param wait The time to wait before allowing the function to be called again (in ms)
 * @returns A debounced version of the function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Convert a CamelCase string to a more readable format
 * @param str The CamelCase string to convert
 * @returns A space-separated string with capitalized first letter
 */
export function humanizeString(str: string): string {
  // Add space before capital letters and uppercase the first character
  const result = str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase());
  
  return result.trim();
}

/**
 * Calculate the relative time (e.g., "2 hours ago") from a date
 * @param date The date to calculate the relative time from
 * @returns A string describing the relative time
 */
export function getRelativeTime(date: Date | string): string {
  const now = new Date();
  const past = typeof date === 'string' ? new Date(date) : date;
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`;
} 