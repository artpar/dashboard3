import React, { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { daptinClient } from '@/daptin'
import { EntitySelect } from './EntitySelect'
import { EntityReferenceEditorProps } from '../types'
import { getItemLabel } from '../utils/formatters'

export const EntityReferenceEditor: React.FC<EntityReferenceEditorProps> = ({
                                                                              value,
                                                                              onChange,
                                                                              onBlur,
                                                                              className,
                                                                              error,
                                                                              disabled,
                                                                              placeholder,
                                                                              referencedEntity,
                                                                              labelColumn,
                                                                            }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [options, setOptions] = useState<any[]>([])

  // Query to fetch options from the referenced entity
  const { data, isLoading, isFetching } = useQuery({
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
          queryParams.filter = searchTerm
        }

        // Fetch data from the referenced entity
        const response = await daptinClient.jsonApi.findAll(
          referencedEntity,
          queryParams
        )

        // Process the response data
        console.log(`Received ${response.data?.length || 0} results from API`)

        // Return the response data if it's an array
        if (response.data && Array.isArray(response.data)) {
          return response.data
        } else {
          console.warn('Response data is not an array:', response.data)
          return []
        }
      } catch (error) {
        console.error(`Error fetching ${referencedEntity} options:`, error)
        return []
      }
    },
    enabled: !!referencedEntity,
  })

  // Process data into options when it changes
  useEffect(() => {
    if (data && Array.isArray(data)) {
      // Preserve the original data structure but add a computed label property
      const processedOptions = data.map((row) => ({
        ...row, // Keep all original properties
        _computedLabel:
          labelColumn && row[labelColumn]
            ? row[labelColumn]
            : row.name || row.title || row.label || row.reference_id,
      }))
      setOptions(processedOptions)

      // Debug output to help diagnose issues
      console.log(
        `Processed ${processedOptions.length} options from ${data.length} data items`
      )
    } else {
      // Reset options if no data
      setOptions([])
    }
  }, [data, labelColumn])

  // Get item label callback
  const getItemLabelCallback = useCallback(
    (item: any) => getItemLabel(item, labelColumn),
    [labelColumn]
  )

  // Handle select change
  const handleSelectChange = (selected: any) => {
    if (selected) {
      onChange({
        type: referencedEntity,
        label: selected.label,
        id: selected.value,
        reference_id: selected.value,
        ...selected.data, // Include all original data
      })
      if (onBlur) onBlur()
    } else {
      onChange(null)
      if (onBlur) onBlur()
    }
  }

  return (
    <EntitySelect
      value={value}
      onChange={handleSelectChange}
      onBlur={onBlur}
      options={options}
      isLoading={isLoading || isFetching}
      error={error}
      disabled={disabled}
      placeholder={placeholder || `Select ${referencedEntity || 'item'}...`}
      onSearchChange={setSearchTerm}
      getItemLabel={getItemLabelCallback}
      referencedEntity={referencedEntity}
    />
  )
}
