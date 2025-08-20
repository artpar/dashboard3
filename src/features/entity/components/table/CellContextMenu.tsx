import React from 'react'
import { 
  Filter, 
  FilterX, 
  Equal, 
  X,
  ChevronRight,
  Search,
  Copy
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'

interface CellContextMenuProps {
  children: React.ReactNode
  columnName: string
  value: any
  onAddFilter: (columnName: string, operator: string, value: any) => void
}

export const CellContextMenu: React.FC<CellContextMenuProps> = ({
  children,
  columnName,
  value,
  onAddFilter,
}) => {
  const { toast } = useToast()

  // Helper function to truncate long values for display
  const truncateValue = (val: any, maxLength: number = 30) => {
    if (val === null || val === undefined) return 'NULL'
    const strValue = String(val)
    if (strValue.length <= maxLength) return strValue
    return strValue.substring(0, maxLength) + '...'
  }

  // Get display value for menu items
  const displayValue = truncateValue(value, 20)

  const handleCopyValue = async () => {
    try {
      const textValue = value?.toString() || ''
      await navigator.clipboard.writeText(textValue)
      toast({
        title: 'Copied',
        description: `Copied ${textValue.length > 50 ? textValue.substring(0, 50) + '...' : textValue}`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy value',
        variant: 'destructive',
      })
    }
  }

  const handleCopyAsFilter = async () => {
    try {
      const filterExpression = `${columnName} = "${value}"`
      await navigator.clipboard.writeText(filterExpression)
      toast({
        title: 'Copied',
        description: 'Filter expression copied to clipboard',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy filter expression',
        variant: 'destructive',
      })
    }
  }

  // Don't show context menu for null/undefined values in certain cases
  const isFilterable = value !== null && value !== undefined

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div 
          className="group relative cursor-context-menu transition-colors hover:bg-muted/50"
          title="Right-click for filter options"
          onContextMenu={(e) => {
            e.preventDefault()
            // Trigger the dropdown menu programmatically
            const trigger = e.currentTarget.querySelector('[data-state]') as HTMLElement
            if (trigger) {
              trigger.click()
            }
          }}
        >
          {children}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Cell Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Copy actions */}
        <DropdownMenuItem onClick={handleCopyValue}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Value
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyAsFilter}>
          <Copy className="mr-2 h-4 w-4" />
          Copy as Filter
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Filter actions */}
        {isFilterable && (
          <>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Filter className="mr-2 h-4 w-4" />
                Add Filter
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-48">
                <DropdownMenuItem 
                  onClick={() => onAddFilter(columnName, '=', value)}
                  title={String(value)}
                >
                  <Equal className="mr-2 h-4 w-4" />
                  <span className="truncate">Equals "{displayValue}"</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onAddFilter(columnName, '!=', value)}
                  title={String(value)}
                >
                  <X className="mr-2 h-4 w-4" />
                  <span className="truncate">Not Equals "{displayValue}"</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onAddFilter(columnName, 'contains', value)}
                  title={String(value)}
                >
                  <Search className="mr-2 h-4 w-4" />
                  <span className="truncate">Contains "{displayValue}"</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onAddFilter(columnName, 'not_contains', value)}
                  title={String(value)}
                >
                  <FilterX className="mr-2 h-4 w-4" />
                  <span className="truncate">Does Not Contain "{displayValue}"</span>
                </DropdownMenuItem>
                {typeof value === 'number' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onAddFilter(columnName, '>', value)}>
                      <ChevronRight className="mr-2 h-4 w-4" />
                      <span className="truncate">Greater Than {displayValue}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAddFilter(columnName, '<', value)}>
                      <ChevronRight className="mr-2 h-4 w-4 rotate-180" />
                      <span className="truncate">Less Than {displayValue}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAddFilter(columnName, '>=', value)}>
                      <ChevronRight className="mr-2 h-4 w-4" />
                      <span className="truncate">Greater or Equal {displayValue}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAddFilter(columnName, '<=', value)}>
                      <ChevronRight className="mr-2 h-4 w-4 rotate-180" />
                      <span className="truncate">Less or Equal {displayValue}</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        )}
        
        {/* Null/Empty filter options */}
        {!isFilterable && (
          <>
            <DropdownMenuItem onClick={() => onAddFilter(columnName, 'is_null', true)}>
              <Filter className="mr-2 h-4 w-4" />
              Filter NULL Values
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddFilter(columnName, 'is_not_null', true)}>
              <FilterX className="mr-2 h-4 w-4" />
              Exclude NULL Values
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default CellContextMenu