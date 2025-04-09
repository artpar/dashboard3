// src/components/entity/columns/editors/ForeignKeyColumnEditor.tsx
import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { daptinClient } from '@/daptin'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ColumnEditorProps } from '../types'


/**
 * Component for editing foreign key values
 */
export const ForeignKeyColumnEditor: React.FC<ColumnEditorProps> = ({
  value,
  column,
  onChange,
  onBlur,
  className,
  error,
  disabled,
  placeholder,
}) => {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Get the referenced entity from the column's ForeignKeyData
  const referencedEntity = column.ForeignKeyData?.Namespace || ''

  // Query to fetch options from the referenced entity
  const { data: options, isLoading } = useQuery({
    queryKey: ['foreignKeyOptions', referencedEntity, searchTerm],
    queryFn: async () => {
      if (!referencedEntity) return []

      try {
        // Build query parameters
        const queryParams: Record<string, any> = {
          'page[size]': '50',
          sort: '-created_at',
        }

        // Add search term if provided
        if (searchTerm) {
          queryParams.query = JSON.stringify([
            {
              column: 'reference_id',
              operator: 'like',
              value: `%${searchTerm}%`,
            },
          ])
        }

        // Fetch data from the referenced entity
        const response = await daptinClient.jsonApi.findAll(
          referencedEntity,
          queryParams
        )

        // Map the response to options
        if (response.data && Array.isArray(response.data)) {
          return response.data.map((item) => ({
            id: item.id,
            reference_id: item.reference_id, // Use a display field if available, otherwise use reference_id
            label: item.name || item.title || item.label || item.reference_id,
          }))
        }

        return []
      } catch (error) {
        console.error(`Error fetching ${referencedEntity} options:`, error)
        return []
      }
    },
    enabled: !!referencedEntity,
  })

  // Find the selected option based on the current value
  const selectedOption =
    options?.find((option) => option.reference_id === value) || null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className={cn(
            'w-full justify-between',
            !value && 'text-muted-foreground',
            error && 'border-red-500',
            className
          )}
          disabled={disabled || !referencedEntity}
        >
          {value && selectedOption
            ? selectedOption.label
            : placeholder || `Select ${referencedEntity}`}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-full p-0'>
        <Command>
          <CommandInput
            placeholder={`Search ${referencedEntity}...`}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            {isLoading ? (
              <div className='flex items-center justify-center p-4'>
                <Loader2 className='h-4 w-4 animate-spin' />
                <span className='ml-2'>Loading...</span>
              </div>
            ) : (
              <>
                <CommandEmpty>No {referencedEntity} found.</CommandEmpty>
                <CommandGroup>
                  {options?.map((option) => (
                    <CommandItem
                      key={option.reference_id}
                      value={option.reference_id}
                      onSelect={(currentValue) => {
                        onChange(currentValue)
                        setOpen(false)
                        if (onBlur) onBlur()
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === option.reference_id
                            ? 'opacity-100'
                            : 'opacity-0'
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default ForeignKeyColumnEditor
