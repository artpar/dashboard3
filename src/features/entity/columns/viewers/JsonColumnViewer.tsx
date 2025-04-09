// src/components/entity/columns/viewers/JsonColumnViewer.tsx
import React, { useState } from 'react'
import { Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ColumnViewerProps } from '../types'


/**
 * Component for displaying JSON values with expandable dialog
 */
export const JsonColumnViewer: React.FC<ColumnViewerProps> = ({
  value,
  column,
  className,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false)

  // If the value is null or undefined
  if (value === null || value === undefined) {
    return <span className={className}>-</span>
  }

  // Parse JSON if it's a string
  let jsonValue: any
  let jsonString: string

  try {
    jsonValue = typeof value === 'string' ? JSON.parse(value) : value
    jsonString = JSON.stringify(jsonValue, null, 2)
  } catch (error) {
    console.error('Error parsing JSON:', error)
    return <span className={className}>{String(value)}</span>
  }

  // Create a truncated preview
  const preview =
    jsonString.length > 20 ? jsonString.substring(0, 20) + '...' : jsonString

  return (
    <>
      <div className={cn('flex items-center space-x-2', className)}>
        <span className='max-w-xs truncate'>{preview}</span>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => setDialogOpen(true)}
          className='h-6 w-6 p-0'
        >
          <Eye className='h-4 w-4' />
          <span className='sr-only'>View JSON</span>
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='max-w-3xl'>
          <DialogHeader>
            <DialogTitle>{column.Name || column.ColumnName}</DialogTitle>
          </DialogHeader>
          <div className='bg-muted mt-4 max-h-[60vh] overflow-auto rounded-md p-4'>
            <pre className='text-sm'>{jsonString}</pre>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default JsonColumnViewer
