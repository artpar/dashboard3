import React, { useState } from 'react'
import { Filter, Search, SlidersHorizontal } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useEntityCollectionData } from '@/features/entity/hooks/useEntityCollectionData'
import EntityFilterBadges from './EntityFilterBadges'
import EntityFilterDialog from '../dialogs/EntityFilterDialog'

interface EntityFiltersProps {
  entityName: string
}

/**
 * Enhanced component for entity filtering with quick filters and search
 */
const EntityFilters: React.FC<EntityFiltersProps> = ({ entityName }) => {
  // Get filter state from context
  const { filters, setFilters, columns } = useEntityCollectionData()

  // Local state
  const [searchTerm, setSearchTerm] = useState(filters._search || '')
  const [showFilterDialog, setShowFilterDialog] = useState(false)
  const [showQuickFilters, setShowQuickFilters] = useState(false)

  // Count active filters (excluding search)
  const activeFilterCount = Object.keys(filters).filter(key => key !== '_search').length

  // Handle search
  const handleSearch = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    // Create a new filters object to avoid reference issues
    const newFilters = { ...filters }

    if (searchTerm.trim()) {
      // Add the search term to filters
      newFilters._search = searchTerm.trim()
    } else if ('_search' in newFilters) {
      // Remove search term if empty and it exists in filters
      delete newFilters._search
    }

    // Set the new filters object
    setFilters(newFilters)
  }

  // Handle applying filters from dialog
  const handleApplyFilters = (newFilters: Record<string, any>) => {
    // Preserve search term if it exists
    if (filters._search) {
      newFilters._search = filters._search
    }
    setFilters(newFilters)
  }

  // Handle removing a single filter
  const handleRemoveFilter = (key: string) => {
    const newFilters = { ...filters }
    delete newFilters[key]
    setFilters(newFilters)
  }

  // Handle clearing all filters
  const handleClearAllFilters = () => {
    // Preserve only search if it exists
    const newFilters: Record<string, any> = {}
    if (filters._search) {
      newFilters._search = filters._search
    }
    setFilters(newFilters)
  }

  // Get quick filter columns (boolean and enum columns with few options)
  const quickFilterColumns = columns
    .filter(col =>
      (col.ColumnType === 'boolean' || col.ColumnType === 'checkbox') ||
      (col.ColumnType === 'enum' && col.Options && col.Options.length <= 5)
    )
    .slice(0, 5) // Limit to 5 quick filters

  return (
    <div className="space-y-4 flex flex-col lg:flex-row">
      {/* Search bar */}
      <div className="flex flex-row sm:flex-col gap-3 w-150 pt-4">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
          <Input
            type="search"
            placeholder={`Search ${entityName}...`}
            className="w-full pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>
      </div>
      <div className="flex flex-row lg:flex-row space-x-4 gap-3 px-2">
        <div className="flex items-center gap-2">
          {/* Quick filters button */}
          {quickFilterColumns.length > 0 && (
            <Popover open={showQuickFilters} onOpenChange={setShowQuickFilters}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-10 gap-1">
                  <SlidersHorizontal className="h-4 w-4" />
                  Quick Filters
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <h4 className="font-medium">Quick Filters</h4>
                  <Separator />
                  <div className="space-y-3">
                    {quickFilterColumns.map(column => {
                      const isBoolean = column.ColumnType === 'boolean' || column.ColumnType === 'checkbox'
                      return (
                        <div key={column.ColumnName} className="space-y-1">
                          <h5 className="text-sm font-medium">{column.Name || column.ColumnName}</h5>
                          <div className="flex flex-wrap gap-2">
                            {isBoolean ? (
                              <>
                                <Badge
                                  variant={filters[column.ColumnName] === true ? "default" : "outline"}
                                  className="cursor-pointer"
                                  onClick={() => {
                                    const newFilters = { ...filters }
                                    if (filters[column.ColumnName] === true) {
                                      delete newFilters[column.ColumnName]
                                    } else {
                                      newFilters[column.ColumnName] = true
                                    }
                                    setFilters(newFilters)
                                  }}
                                >
                                  Yes
                                </Badge>
                                <Badge
                                  variant={filters[column.ColumnName] === false ? "default" : "outline"}
                                  className="cursor-pointer"
                                  onClick={() => {
                                    const newFilters = { ...filters }
                                    if (filters[column.ColumnName] === false) {
                                      delete newFilters[column.ColumnName]
                                    } else {
                                      newFilters[column.ColumnName] = false
                                    }
                                    setFilters(newFilters)
                                  }}
                                >
                                  No
                                </Badge>
                              </>
                            ) : column.Options ? (
                              column.Options.map(option => (
                                <Badge
                                  key={option.Value || `option-${option.Label}`}
                                  variant={filters[column.ColumnName] === option.Value ? "default" : "outline"}
                                  className="cursor-pointer"
                                  onClick={() => {
                                    const newFilters = { ...filters }
                                    if (filters[column.ColumnName] === option.Value) {
                                      delete newFilters[column.ColumnName]
                                    } else {
                                      newFilters[column.ColumnName] = option.Value
                                    }
                                    setFilters(newFilters)
                                  }}
                                >
                                  {option.Label}
                                </Badge>
                              ))
                            ) : null}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Advanced filters button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 relative"
                  onClick={() => setShowFilterDialog(true)}
                >
                  <Filter className="h-4 w-4" />
                  {activeFilterCount > 0 && (
                    <Badge
                      className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                    >
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Advanced Filters</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {/* Active filter badges */}
        {activeFilterCount > 0 && (
          <EntityFilterBadges
            filters={filters}
            onRemoveFilter={handleRemoveFilter}
            onClearAllFilters={handleClearAllFilters}
          />
        )}

      </div>


      {/* Filter dialog */}
      <EntityFilterDialog
        open={showFilterDialog}
        onClose={() => setShowFilterDialog(false)}
        filters={filters}
        onApplyFilters={handleApplyFilters}
      />
    </div>
  )
}

export default EntityFilters
