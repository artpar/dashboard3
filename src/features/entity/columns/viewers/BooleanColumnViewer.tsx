// src/components/entity/columns/viewers/BooleanColumnViewer.tsx
import React from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ColumnViewerProps } from '../types'


/**
 * Component for displaying boolean values
 */
export const BooleanColumnViewer: React.FC<ColumnViewerProps> = ({
  value,
  column,
  className,
}) => {
  // If the value is null or undefined
  if (value === null || value === undefined) {
    return <span className={className}>-</span>
  }

  // Convert various representations to boolean
  const boolValue =
    value === true ||
    value === 1 ||
    value === '1' ||
    value === 'true' ||
    value === 'yes'

  return (
    <span className={cn('flex justify-center', className)}>
      {boolValue ? (
        <Badge variant='outline' className='bg-green-100 text-green-800'>
          Yes
        </Badge>
      ) : (
        <Badge variant='outline' className='bg-red-100 text-red-800'>
          No
        </Badge>
      )}
    </span>
  )
}

export default BooleanColumnViewer
