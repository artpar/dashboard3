import React from 'react'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useEntityCollectionData } from '@/features/entity/hooks/useEntityCollectionData'
import { ColumnDefinition } from '@/features/entity/columns'

interface EntityFilterBadgesProps {
  filters: Record<string, any>
  onRemoveFilter: (key: string) => void
  onClearAllFilters: () => void
}

/**
 * Component to display active filters as badges in the header panel
 */
const EntityFilterBadges: React.FC<EntityFilterBadgesProps> = ({
  filters,
  onRemoveFilter,
  onClearAllFilters,
}) => {
  const { columns } = useEntityCollectionData()

  // Skip special filter keys like _search
  const filterKeys = Object.keys(filters).filter(key => key !== '_search')
  
  if (filterKeys.length === 0) {
    return null
  }

  // Get column definition for a filter key
  const getColumnDef = (key: string): ColumnDefinition | undefined => {
    return columns.find(col => col.ColumnName === key)
  }

  // Format filter value for display
  const formatFilterValue = (key: string, value: any): string => {
    const column = getColumnDef(key)
    
    if (!column) {
      return String(value)
    }

    switch (column.ColumnType) {
      case 'boolean':
      case 'checkbox':
        return value ? 'Yes' : 'No'
      case 'enum':
        const option = column.Options?.find(opt => opt.Value === value)
        return option ? option.Label : String(value)
      default:
        return String(value)
    }
  }

  // Get human-readable name for a filter key
  const getFilterName = (key: string): string => {
    const column = getColumnDef(key)
    return column ? (column.Name || column.ColumnName) : key
  }

  return (
    <div className="flex flex-col gap-2 mb-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Active Filters</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClearAllFilters}
          className="h-6 px-2 text-xs"
        >
          Clear All
        </Button>
      </div>
      
      <ScrollArea className="max-w-full">
        <div className="flex flex-wrap gap-2 pb-1">
          <TooltipProvider>
            {filterKeys.map(key => (
              <Tooltip key={key}>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="px-2 py-1 gap-1 max-w-[250px]">
                    <span className="font-medium truncate">{getFilterName(key)}:</span>
                    <span className="truncate">{formatFilterValue(key, filters[key])}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 ml-1 rounded-full"
                      onClick={() => onRemoveFilter(key)}
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove filter</span>
                    </Button>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {getFilterName(key)}: {formatFilterValue(key, filters[key])}
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      </ScrollArea>
    </div>
  )
}

export default EntityFilterBadges