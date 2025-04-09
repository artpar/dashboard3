// src/features/entity/utils/entityFormatters.ts
// src/features/entity/utils/entityFormatters.ts
import { format, isValid, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


/**
 * Format a date value into a user-friendly date string
 * @param value The date value to format (string, Date, or timestamp)
 * @param fallback Optional fallback text if date is invalid
 * @returns Formatted date string
 */
export const formatDate = (
  value: string | Date | number,
  fallback: string = '-'
): string => {
  try {
    // Parse the input into a Date object
    const date =
      value instanceof Date
        ? value
        : typeof value === 'string'
          ? parseISO(value)
          : new Date(value)

    // Check if we have a valid date
    if (!isValid(date)) {
      return fallback
    }

    // Format the date (Aug 24, 2023)
    return format(date, 'MMM d, yyyy')
  } catch (error) {
    console.error('Error formatting date:', error)
    return fallback
  }
}

/**
 * Format a date value into a user-friendly date and time string
 * @param value The date value to format (string, Date, or timestamp)
 * @param fallback Optional fallback text if date is invalid
 * @returns Formatted date and time string
 */
export const formatDateTime = (
  value: string | Date | number,
  fallback: string = '-'
): string => {
  try {
    // Parse the input into a Date object
    const date =
      value instanceof Date
        ? value
        : typeof value === 'string'
          ? parseISO(value)
          : new Date(value)

    // Check if we have a valid date
    if (!isValid(date)) {
      return fallback
    }

    // Format the date and time (Aug 24, 2023, 3:45 PM)
    return format(date, 'MMM d, yyyy, h:mm a')
  } catch (error) {
    console.error('Error formatting date/time:', error)
    return fallback
  }
}

// Define special columns that should be displayed in a compact way
export const AUDIT_COLUMNS = [
  'reference_id',
  'id',
  'created_at',
  'updated_at',
  'permission',
  'version',
  'user_account_id',
]

// Status colors mapping for consistent styling
export const STATUS_COLORS: { [key: string]: string } = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800',
  failed: 'bg-red-100 text-red-800',
  paid: 'bg-green-100 text-green-800',
  unpaid: 'bg-red-100 text-red-800',
  draft: 'bg-gray-100 text-gray-800',
  published: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-800',
}

// Format audit column values (dates, reference IDs)
export const formatAuditColumn = (value: any, columnKey: string) => {
  if (value === null || value === undefined) {
    return '-'
  }

  // Format dates in a more compact way
  if (columnKey === 'created_at' || columnKey === 'updated_at') {
    try {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className='text-muted-foreground text-xs'>
                {format(new Date(value), 'MM/dd/yy')}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{format(new Date(value), 'PPP p')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    } catch (e) {
      return <span className='text-muted-foreground text-xs'>{value}</span>
    }
  }

  // For reference IDs and other audit columns
  if (typeof value === 'string') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className='text-muted-foreground text-xs'>
              {value.length > 8 ? `${value.substring(0, 8)}...` : value}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{value}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return value
}

// Format date values
export const formatDateValue = (value: any) => {
  try {
    return format(new Date(value), 'PPP p')
  } catch (e) {
    return value
  }
}

// Format boolean values
export const formatBooleanValue = (value: boolean) => {
  return value ? (
    <Badge variant='outline' className='bg-green-100'>
      Yes
    </Badge>
  ) : (
    <Badge variant='outline' className='bg-red-100'>
      No
    </Badge>
  )
}

// Format status fields
export const formatStatusValue = (value: string) => {
  if (!value || typeof value !== 'string') return value

  return (
    <Badge
      variant='outline'
      className={STATUS_COLORS[value.toLowerCase()] || 'bg-gray-100'}
    >
      {value}
    </Badge>
  )
}

// Format numeric values (including boolean-like 0/1 values)
export const formatNumericValue = (value: number) => {
  // If it's a boolean-like integer (0/1)
  if (value === 0 || value === 1) {
    return value === 1 ? (
      <Badge variant='outline' className='bg-green-100'>
        Yes
      </Badge>
    ) : (
      <Badge variant='outline' className='bg-red-100'>
        No
      </Badge>
    )
  }

  return value.toString()
}

// Format file fields
export const formatFileValue = (value: any) => {
  return value ? (
    <Badge variant='outline' className='bg-blue-100'>
      <a
        href='#'
        onClick={(e) => {
          e.preventDefault()
          // In a real app, this would link to the file
          console.log('View file:', value)
        }}
      >
        View file
      </a>
    </Badge>
  ) : (
    '-'
  )
}

// Format foreign key references
export const formatForeignKeyValue = (value: any, namespace: string) => {
  return (
    <Badge variant='outline' className='bg-purple-100'>
      {namespace}: {value}
    </Badge>
  )
}

// Format long text
export const formatLongTextValue = (value: string) => {
  if (typeof value !== 'string') return value

  if (value.length <= 50) return value

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>{value.substring(0, 50)}...</span>
        </TooltipTrigger>
        <TooltipContent className='max-w-md'>
          <p>{value}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Format object/JSON values
export const formatObjectValue = (value: object) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>[Object]</span>
        </TooltipTrigger>
        <TooltipContent className='max-w-md'>
          <pre className='text-xs'>
            {JSON.stringify(Object.keys(value), null, 2)}
          </pre>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
