// src/components/entity/columns/viewers/DateColumnViewer.tsx
import React, { useState } from 'react'
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDate, formatDateTime, formatTime } from '../formatters';
import { ColumnType, ColumnViewerProps } from '../types';
import { getColumnType } from '../utils';
import ReactTimeAgo from 'react-time-ago'


/**
 * Component for displaying date and time values
 */
export const DateColumnViewer: React.FC<ColumnViewerProps> = ({
  value,
  column,
  className,
}) => {
  const columnType = getColumnType(column)

  // Select the appropriate formatter based on column type
  let formattedValue: React.ReactNode = null
  let fullFormattedValue: string = '';
  const [currentDate, setCurrentDate] = useState(new Date(value))
  console.log("DateColumnViewer", value, currentDate)

  if (columnType === ColumnType.DateTime) {
    formattedValue = formatDateTime(value)
    // For tooltip, we want to show full ISO format
    if (value) {
      try {
        const date = new Date(value)
        fullFormattedValue = date.toISOString()
      } catch (e) {
        fullFormattedValue = String(value)
      }
    }
  } else if (columnType === ColumnType.Date) {
    formattedValue = formatDate(value)
    if (value) {
      try {
        const date = new Date(value)
        fullFormattedValue = date.toISOString().split('T')[0]
      } catch (e) {
        fullFormattedValue = String(value)
      }
    }
  } else if (columnType === ColumnType.Time) {
    formattedValue = formatTime(value)
    fullFormattedValue = String(formattedValue)
  } else {
    // Default to datetime for any other date-related types
    formattedValue = formatDateTime(value)
    fullFormattedValue = String(formattedValue)
  }

  // If we have a valid date, show it with a tooltip showing full ISO format
  if (value && fullFormattedValue) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn('whitespace-nowrap', className)}>
              <ReactTimeAgo date={currentDate} />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{fullFormattedValue}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // For null/undefined dates
  return <span className={className}>{formattedValue || '-'}</span>
}

export default DateColumnViewer
