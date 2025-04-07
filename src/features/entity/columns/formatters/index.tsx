// src/components/entity/columns/formatters/index.ts
import { format, parseISO } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { ColumnDefinition, ColumnType, FormatterFunction } from '../types'
import { getColumnType } from '../utils'


/**
 * Format a text value for display
 */
export const formatText: FormatterFunction = (value) => {
  if (value === null || value === undefined) {
    return '-'
  }

  return String(value)
}

/**
 * Format a long text value for display, truncating if necessary
 */
export const formatLongText: FormatterFunction = (value) => {
  if (value === null || value === undefined) {
    return '-'
  }

  const text = String(value)
  if (text.length <= 100) {
    return text
  }

  return text.substring(0, 100) + '...'
}

/**
 * Format a date value for display
 */
export const formatDate: FormatterFunction = (value) => {
  if (value === null || value === undefined) {
    return '-'
  }

  try {
    // Handle various date formats
    const date = typeof value === 'string' ? parseISO(value) : new Date(value)
    return format(date, 'MMM d, yyyy')
  } catch (error) {
    console.error('Date parsing error:', error)
    return String(value)
  }
}

/**
 * Format a datetime value for display
 */
export const formatDateTime: FormatterFunction = (value) => {
  if (value === null || value === undefined) {
    return '-'
  }

  try {
    // Handle various datetime formats
    const date = typeof value === 'string' ? parseISO(value) : new Date(value)
    return format(date, 'MMM d, yyyy h:mm a')
  } catch (error) {
    console.error('DateTime parsing error:', error)
    return String(value)
  }
}

/**
 * Format a time value for display
 */
export const formatTime: FormatterFunction = (value) => {
  if (value === null || value === undefined) {
    return '-'
  }

  try {
    // Handle various time formats
    const date = typeof value === 'string' ? parseISO(value) : new Date(value)
    return format(date, 'h:mm a')
  } catch (error) {
    console.error('Time parsing error:', error)
    return String(value)
  }
}

/**
 * Format a number value for display
 */
export const formatNumber: FormatterFunction = (value) => {
  if (value === null || value === undefined) {
    return '-'
  }

  // Parse the value if it's a string
  const numValue = typeof value === 'string' ? parseFloat(value) : value

  // Check if it's a valid number
  if (isNaN(numValue)) {
    return String(value)
  }

  return numValue.toLocaleString()
}

/**
 * Format a decimal number for display
 */
export const formatDecimal: FormatterFunction = (value) => {
  if (value === null || value === undefined) {
    return '-'
  }

  // Parse the value if it's a string
  const numValue = typeof value === 'string' ? parseFloat(value) : value

  // Check if it's a valid number
  if (isNaN(numValue)) {
    return String(value)
  }

  return numValue.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Format a money value for display
 */
export const formatMoney: FormatterFunction = (value) => {
  if (value === null || value === undefined) {
    return '-'
  }

  // Parse the value if it's a string
  const numValue = typeof value === 'string' ? parseFloat(value) : value

  // Check if it's a valid number
  if (isNaN(numValue)) {
    return String(value)
  }

  return numValue.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
  })
}

/**
 * Format a boolean value for display
 */
export const formatBoolean: FormatterFunction = (value) => {
  if (value === null || value === undefined) {
    return '-'
  }

  // Convert various representations to boolean
  const boolValue =
    value === true ||
    value === 1 ||
    value === '1' ||
    value === 'true' ||
    value === 'yes'

  return boolValue ? (
    <Badge variant='outline' className='bg-green-100 text-green-800'>
      Yes
    </Badge>
  ) : (
    <Badge variant='outline' className='bg-red-100 text-red-800'>
      No
    </Badge>
  )
}

/**
 * Format a JSON value for display
 */
export const formatJson: FormatterFunction = (value) => {
  if (value === null || value === undefined) {
    return '-'
  }

  try {
    // If it's a string, parse it first
    const jsonValue = typeof value === 'string' ? JSON.parse(value) : value
    const jsonString = JSON.stringify(jsonValue, null, 2)

    // Truncate if too long
    if (jsonString.length > 50) {
      return jsonString.substring(0, 50) + '...'
    }

    return jsonString
  } catch (error) {
    console.error('JSON parsing error:', error)
    return String(value)
  }
}

/**
 * Format a rating value for display
 */
export const formatRating: FormatterFunction = (value, column) => {
  if (value === null || value === undefined) {
    return '-'
  }

  // Parse the value if it's a string
  const numValue = typeof value === 'string' ? parseInt(value, 10) : value

  // Check if it's a valid number
  if (isNaN(numValue)) {
    return String(value)
  }

  // Determine max rating based on column type
  const columnType = column ? getColumnType(column) : ColumnType.Rating5
  let maxRating = 5

  if (columnType === ColumnType.Rating10) {
    maxRating = 10
  } else if (columnType === ColumnType.Rating100) {
    maxRating = 100
  }

  // For Rating100, show as percentage
  if (maxRating === 100) {
    return `${numValue}%`
  }

  // For Rating5 and Rating10, show stars
  const stars = '★'.repeat(numValue) + '☆'.repeat(maxRating - numValue)
  return <span className='text-yellow-500'>{stars}</span>
}

/**
 * Get the formatter function for a specific column type
 */
export function getFormatterForColumn(
  column: ColumnDefinition
): FormatterFunction {
  const columnType = getColumnType(column)

  switch (columnType) {
    case ColumnType.Text:
    case ColumnType.Email:
    case ColumnType.Name:
    case ColumnType.Alias:
    case ColumnType.Namespace:
      return formatText

    case ColumnType.Content:
      return formatLongText

    case ColumnType.DateTime:
      return formatDateTime

    case ColumnType.Date:
      return formatDate

    case ColumnType.Time:
      return formatTime

    case ColumnType.NumberInt:
    case ColumnType.Measurement:
      return formatNumber

    case ColumnType.NumberFloat:
      return formatDecimal

    case ColumnType.Money:
      return formatMoney

    case ColumnType.Boolean:
      return formatBoolean

    case ColumnType.Json:
      return formatJson

    case ColumnType.Rating5:
    case ColumnType.Rating10:
    case ColumnType.Rating100:
      return formatRating

    default:
      return formatText
  }
}
