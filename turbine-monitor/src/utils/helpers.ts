import Papa from 'papaparse'
import type { CSVData } from '../types'

export const parseCSV = (file: File): Promise<CSVData[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(results.errors[0].message))
        } else {
          resolve(results.data as CSVData[])
        }
      },
      error: (error) => {
        reject(error)
      }
    })
  })
}

export const exportToCSV = (data: CSVData[], filename: string) => {
  const csv = Papa.unparse(data)
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}

export const formatNumber = (num: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void => {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

// Additional utility functions for data validation
export const validateCSVData = (data: CSVData[]): boolean => {
  if (!Array.isArray(data) || data.length === 0) return false
  
  // Check if data has required fields
  const requiredFields = ['timestamp']
  return data.every(row => 
    requiredFields.every(field => row[field] !== undefined && row[field] !== '')
  )
}

export const formatKPIValue = (value: number): string => {
  return `${value.toFixed(1)}%`
}

export const calculateTimeRange = (timestamps: string[]): { start: string; end: string } => {
  if (timestamps.length === 0) return { start: '', end: '' }
  
  const sortedTimestamps = [...timestamps].sort()
  return {
    start: sortedTimestamps[0],
    end: sortedTimestamps[sortedTimestamps.length - 1]
  }
}
