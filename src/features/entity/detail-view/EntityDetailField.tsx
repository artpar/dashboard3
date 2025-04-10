// src/features/entity/components/detail-view/EntityDetailField.tsx
import { ChevronRightIcon, CopyIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ColumnDefinition, ColumnViewer } from '@/features/entity/columns'
import { getFieldLabel } from './entity-detail-utils'

interface EntityDetailFieldProps {
  fieldName: string
  column: ColumnDefinition
  value: any
  entity: any
  index: number
  isExpanded: boolean
  onToggleExpand: () => void
  enableExpansion: boolean
}

/**
 * Displays a single field in the entity detail view
 */
export function EntityDetailField({
  fieldName,
  column,
  value,
  entity,
  index,
  isExpanded,
  onToggleExpand,
  enableExpansion,
}: EntityDetailFieldProps) {
  const { toast } = useToast()
  const label = getFieldLabel(column)

  // Field label with tooltip for description
  const renderLabel = (
    <div className='flex items-center gap-2'>
      {column.ColumnDescription ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className='text-sm font-medium'>{label}</div>
            </TooltipTrigger>
            <TooltipContent>
              <p className='max-w-xs text-xs'>{column.ColumnDescription}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <div className='text-sm font-medium'>{label}</div>
      )}
    </div>
  )

  // Handler for copying field value
  const handleCopyValue = () => {
    const textValue =
      typeof value === 'object' ? JSON.stringify(value) : String(value ?? '')

    navigator.clipboard.writeText(textValue)

    toast({
      title: 'Copied to clipboard',
      description: `Field "${label}" value has been copied.`,
      duration: 3000,
    })
  }

  // Determine if the field should be expandable
  const isExpandable =
    enableExpansion &&
    (typeof value === 'object' ||
      (typeof value === 'string' && value?.length > 100) ||
      column.ColumnType === 'content' ||
      column.ColumnType === 'json')

  // Calculate the right CSS classes
  const rowClasses = cn(
    'transition-colors',
    isExpanded ? 'bg-muted/80' : index % 2 === 0 ? 'bg-muted/50' : '',
    'hover:bg-muted/70'
  )

  return (
    <div className={rowClasses}>
      <div
        className={cn(
          'flex w-full flex-col sm:flex-row',
          isExpanded && 'border-border/50 border-b'
        )}
      >
        {/* Field Label */}
        <div className='flex w-full flex-shrink-0 flex-grow-0 items-center justify-between px-4 py-3 sm:w-1/3'>
          {renderLabel}

          <div className='flex items-center gap-1 sm:hidden'>
            {isExpandable && (
              <Button
                variant='ghost'
                size='sm'
                className='h-7 w-7 rounded-full p-0'
                onClick={onToggleExpand}
              >
                <ChevronRightIcon
                  className={cn(
                    'h-4 w-4 transition-transform',
                    isExpanded ? 'rotate-90' : ''
                  )}
                />
                <span className='sr-only'>
                  {isExpanded ? 'Collapse' : 'Expand'}
                </span>
              </Button>
            )}
          </div>
        </div>

        {/* Field Value */}
        <div
          className={cn(
            'relative flex w-full px-4 py-3 sm:w-2/3',
            isExpanded ? 'min-h-[80px]' : ''
          )}
        >
          <div
            className={cn(
              'w-full',
              isExpanded ? 'whitespace-pre-wrap' : 'truncate'
            )}
          >
            <ColumnViewer
              column={column}
              value={value}
              className={cn('text-sm', isExpanded && 'break-words')}
              entity={entity}
            />
          </div>

          <div className='ml-auto flex items-start gap-1'>
            {value !== null && value !== undefined && (
              <Button
                variant='ghost'
                size='sm'
                className='hover:bg-muted-foreground/10 h-7 w-7 rounded-full p-0 opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100'
                onClick={handleCopyValue}
              >
                <CopyIcon className='h-3.5 w-3.5' />
                <span className='sr-only'>Copy</span>
              </Button>
            )}

            {isExpandable && (
              <Button
                variant='ghost'
                size='sm'
                className='hover:bg-muted-foreground/10 hidden h-7 w-7 rounded-full p-0 opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100 sm:flex'
                onClick={onToggleExpand}
              >
                <ChevronRightIcon
                  className={cn(
                    'h-4 w-4 transition-transform',
                    isExpanded ? 'rotate-90' : ''
                  )}
                />
                <span className='sr-only'>
                  {isExpanded ? 'Collapse' : 'Expand'}
                </span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded section */}
      {isExpanded && isExpandable && (
        <div className='px-4 pb-3'>
          <div className='bg-background rounded-md p-3'>
            <ColumnViewer
              column={column}
              value={value}
              className='text-sm break-words whitespace-pre-wrap'
              entity={entity}
            />
          </div>
        </div>
      )}
    </div>
  )
}
