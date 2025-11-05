import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getCoverageColor(percentage: number): string {
  if (percentage >= 90) return 'text-green-600 dark:text-green-400'
  if (percentage >= 75) return 'text-blue-600 dark:text-blue-400'
  if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

export function getCoverageBgColor(percentage: number): string {
  if (percentage >= 90) return 'bg-green-100 dark:bg-green-900/20'
  if (percentage >= 75) return 'bg-blue-100 dark:bg-blue-900/20'
  if (percentage >= 60) return 'bg-yellow-100 dark:bg-yellow-900/20'
  return 'bg-red-100 dark:bg-red-900/20'
}

export function getCoverageBorderColor(percentage: number): string {
  if (percentage >= 90) return 'border-green-300 dark:border-green-700'
  if (percentage >= 75) return 'border-blue-300 dark:border-blue-700'
  if (percentage >= 60) return 'border-yellow-300 dark:border-yellow-700'
  return 'border-red-300 dark:border-red-700'
}
