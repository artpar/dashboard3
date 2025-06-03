import React, { useEffect, useState } from 'react'
import { FilterX, Plus, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useEntityCollectionData } from '@/features/entity/hooks/useEntityCollectionData.tsx'
import { AUDIT_COLUMNS } from '@/features/entity/utils/entityFormatters'
import { ColumnDefinition } from '@/features/entity/columns'

export interface FilterQuery {
  column: string
  operator: string
  value: any
}

interface EntityFilterDialogProps {
  open: boolean
  onClose: () => void
  filters: FilterQuery[]
  onApplyFilters: (filters: FilterQuery[]) => void
}

/**
 * Dialog for configuring entity filters
 */
// Define available operators for different column types
const getOperatorsForColumnType = (columnType: string) => {
  const textOperators = [
    { value: 'eq', label: 'Equals' },
    { value: 'neq', label: 'Not equals' },
    { value: 'like::contains', label: 'Contains' },
    { value: 'ilike::contains', label: 'Contains (case-insensitive)' },
    { value: 'not like::contains', label: 'Does not contain' },
    { value: 'not ilike::contains', label: 'Does not contain (case-insensitive)' },
    { value: 'like::startsWith', label: 'Starts with' },
    { value: 'like::endsWith', label: 'Ends with' },
    { value: 'not like::startsWith', label: 'Does not start with' },
    { value: 'not like::endsWith', label: 'Does not end with' },
    { value: 'is null', label: 'Is empty' },
    { value: 'is not null', label: 'Is not empty' },
  ]

  const numberOperators = [
    { value: 'eq', label: 'Equals' },
    { value: 'neq', label: 'Not equals' },
    { value: 'gt', label: 'Greater than' },
    { value: 'gte', label: 'Greater than or equal' },
    { value: 'lt', label: 'Less than' },
    { value: 'lte', label: 'Less than or equal' },
    { value: 'is null', label: 'Is empty' },
    { value: 'is not null', label: 'Is not empty' },
  ]

  const booleanOperators = [
    { value: 'is true', label: 'Is true' },
    { value: 'is false', label: 'Is false' },
    { value: 'is null', label: 'Is empty' },
    { value: 'is not null', label: 'Is not empty' },
  ]

  switch (columnType) {
    case 'boolean':
    case 'checkbox':
      return booleanOperators
    case 'measurement':
    case 'int':
    case 'integer':
    case 'number':
    case 'date':
    case 'datetime':
      return numberOperators
    default:
      return textOperators
  }
}

const EntityFilterDialog: React.FC<EntityFilterDialogProps> = ({
  open,
  onClose,
  filters,
  onApplyFilters,
}) => {
  // Get columns from context
  const { columns } = useEntityCollectionData()

  // Local state for filter values - ensure it's always an array
  const [filterQueries, setFilterQueries] = useState<FilterQuery[]>(
    Array.isArray(filters) ? filters : []
  )

  // State for new filter being added
  const [newFilter, setNewFilter] = useState<{
    column: string
    operator: string
    value: any
  }>({
    column: '',
    operator: '',
    value: ''
  })

  // Reset local state when filters prop changes
  useEffect(() => {
    console.log('EntityFilterDialog - filters prop changed:', filters)
    setFilterQueries(Array.isArray(filters) ? filters : [])
  }, [filters])

  // Filter out audit columns and get filterable columns
  const filterableColumns = columns.filter(
    (column) => !AUDIT_COLUMNS.includes(column.ColumnName)
  )

  // Add a new filter
  const handleAddFilter = () => {
    console.log('handleAddFilter called with:', newFilter)
    console.log('Current filterQueries:', filterQueries)
    
    const operatorNeedsValue = !['is null', 'is not null', 'is true', 'is false'].includes(newFilter.operator)
    
    // Validate the new filter
    if (!newFilter.column || !newFilter.operator) {
      console.log('Validation failed: missing column or operator')
      return
    }
    
    if (operatorNeedsValue && (newFilter.value === '' || newFilter.value === null || newFilter.value === undefined)) {
      console.log('Validation failed: operator needs value but value is empty')
      return
    }

    // Add the filter
    const updatedFilters = [...filterQueries, { ...newFilter }]
    console.log('Setting filterQueries to:', updatedFilters)
    setFilterQueries(updatedFilters)
    
    // Reset new filter form
    setNewFilter({
      column: '',
      operator: '',
      value: ''
    })
  }

  // Update a filter at specific index
  const handleUpdateFilter = (index: number, field: 'operator' | 'value', value: any) => {
    setFilterQueries(prev => prev.map((filter, i) => 
      i === index ? { ...filter, [field]: value } : filter
    ))
  }

  // Remove a filter at specific index
  const handleRemoveFilter = (index: number) => {
    setFilterQueries(prev => prev.filter((_, i) => i !== index))
  }

  // Apply filters and close dialog
  const handleApply = () => {
    console.log('handleApply - filterQueries:', filterQueries)
    console.log('handleApply - newFilter:', newFilter)
    
    let allFilters = [...filterQueries]
    
    // Check if there's a valid new filter that hasn't been added yet
    if (newFilter.column && newFilter.operator) {
      const operatorNeedsValue = !['is null', 'is not null', 'is true', 'is false'].includes(newFilter.operator)
      const hasValidValue = !operatorNeedsValue || (newFilter.value !== '' && newFilter.value !== null && newFilter.value !== undefined)
      
      if (hasValidValue) {
        console.log('Adding unsaved new filter to list')
        allFilters.push({ ...newFilter })
      }
    }
    
    // Filter out incomplete filters before applying
    const validFilters = allFilters.filter(filter => {
      const operatorNeedsValue = !['is null', 'is not null', 'is true', 'is false'].includes(filter.operator)
      const isValid = !operatorNeedsValue || (filter.value !== '' && filter.value !== null && filter.value !== undefined)
      console.log('Filter validation:', { filter, operatorNeedsValue, isValid })
      // Include filter if operator doesn't need value, or if it has a non-empty value
      return isValid
    })
    
    console.log('Valid filters:', validFilters)
    onApplyFilters(validFilters)
    onClose()
  }

  // Clear all filters
  const handleClearAll = () => {
    setFilterQueries([])
    setNewFilter({
      column: '',
      operator: '',
      value: ''
    })
  }

  // Get column definition by name
  const getColumnDef = (columnName: string): ColumnDefinition | undefined => {
    return columns.find(col => col.ColumnName === columnName)
  }

  // Render value input based on column type
  const renderValueInput = (columnName: string, operator: string, value: any, onChange: (val: any) => void) => {
    const column = getColumnDef(columnName)
    if (!column) return null

    const needsValueInput = !['is null', 'is not null', 'is true', 'is false'].includes(operator)
    if (!needsValueInput) return null

    if (column.ColumnType === 'enum') {
      return (
        <Select
          value={value !== undefined && value !== '' ? value.toString() : ''}
          onValueChange={onChange}
        >
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Select value' />
          </SelectTrigger>
          <SelectContent>
            {column.Options?.map((option) => (
              <SelectItem key={option.Value} value={option.Value || `option-${option.Label}`}>
                {option.Label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    } else if (['measurement', 'int', 'integer', 'number'].includes(column.ColumnType)) {
      return (
        <Input
          type='number'
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder='Enter value'
        />
      )
    } else {
      return (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={operator.includes('like') ? 'Enter pattern (use % for wildcard)' : 'Enter value'}
        />
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Search className='h-5 w-5' /> Advanced Filters
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Existing filters list */}
          {filterQueries.length > 0 && (
            <div className='space-y-2'>
              <Label>Active Filters</Label>
              <ScrollArea className='max-h-[200px]'>
                <div className='space-y-2 pr-4'>
                  {filterQueries.map((filter, index) => {
                    const column = getColumnDef(filter.column)
                    const operators = column ? getOperatorsForColumnType(column.ColumnType) : []
                    const needsValueInput = !['is null', 'is not null', 'is true', 'is false'].includes(filter.operator)
                    
                    return (
                      <Card key={index} className='p-3'>
                        <CardContent className='p-0 space-y-2'>
                          <div className='flex items-center gap-2'>
                            <div className='flex-1 grid grid-cols-3 gap-2'>
                              {/* Column name (read-only) */}
                              <div className='text-sm font-medium flex items-center'>
                                {column?.Name || filter.column}
                              </div>
                              
                              {/* Operator selector */}
                              <Select
                                value={filter.operator}
                                onValueChange={(value) => handleUpdateFilter(index, 'operator', value)}
                              >
                                <SelectTrigger className='h-8'>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {operators.map((op) => (
                                    <SelectItem key={op.value} value={op.value}>
                                      {op.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              
                              {/* Value input */}
                              {needsValueInput ? (
                                <div>
                                  {renderValueInput(
                                    filter.column,
                                    filter.operator,
                                    filter.value,
                                    (value) => handleUpdateFilter(index, 'value', value)
                                  )}
                                </div>
                              ) : (
                                <div className='text-sm text-muted-foreground flex items-center'>
                                  No value needed
                                </div>
                              )}
                            </div>
                            
                            {/* Remove button */}
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8'
                              onClick={() => handleRemoveFilter(index)}
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          <Separator />

          {/* Add new filter section */}
          <div className='space-y-2'>
            <Label>Add New Filter</Label>
            <Card className='p-3'>
              <CardContent className='p-0 space-y-2'>
                <div className='grid grid-cols-3 gap-2'>
                  {/* Column selector */}
                  <Select
                    value={newFilter.column}
                    onValueChange={(value) => {
                      setNewFilter({
                        column: value,
                        operator: '',
                        value: ''
                      })
                    }}
                  >
                    <SelectTrigger className='h-8'>
                      <SelectValue placeholder='Select column' />
                    </SelectTrigger>
                    <SelectContent>
                      {filterableColumns.map((column) => (
                        <SelectItem key={column.ColumnName} value={column.ColumnName}>
                          {column.Name || column.ColumnName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Operator selector */}
                  {newFilter.column && (
                    <Select
                      value={newFilter.operator}
                      onValueChange={(value) => {
                        setNewFilter(prev => ({
                          ...prev,
                          operator: value,
                          value: ['is null', 'is not null', 'is true', 'is false'].includes(value) ? null : prev.value
                        }))
                      }}
                    >
                      <SelectTrigger className='h-8'>
                        <SelectValue placeholder='Select operator' />
                      </SelectTrigger>
                      <SelectContent>
                        {getOperatorsForColumnType(
                          getColumnDef(newFilter.column)?.ColumnType || ''
                        ).map((op) => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {/* Value input */}
                  {newFilter.column && newFilter.operator && (
                    <div>
                      {renderValueInput(
                        newFilter.column,
                        newFilter.operator,
                        newFilter.value,
                        (value) => {
                          console.log('Setting newFilter value to:', value)
                          setNewFilter(prev => ({ ...prev, value }))
                        }
                      )}
                    </div>
                  )}
                </div>
                
                {/* Add button */}
                {newFilter.column && newFilter.operator && (
                  <Button
                    type='button'
                    size='sm'
                    onClick={handleAddFilter}
                    className='w-full'
                    disabled={
                      !newFilter.column || 
                      !newFilter.operator || 
                      (['is null', 'is not null', 'is true', 'is false'].includes(newFilter.operator) ? false : !newFilter.value)
                    }
                  >
                    <Plus className='h-4 w-4 mr-1' />
                    Add Filter
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator />

        <DialogFooter className='gap-2 sm:justify-between'>
          <Button
            type='button'
            variant='ghost'
            onClick={handleClearAll}
            className='gap-1'
          >
            <FilterX className='h-4 w-4' />
            Clear All
          </Button>
          <div className='flex gap-2'>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button type='button' onClick={handleApply}>
              Apply Filters
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default EntityFilterDialog
