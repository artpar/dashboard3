// src/features/entity/components/detail-view/entity-detail-utils.ts
import { ColumnDefinition } from '@/features/entity/columns'
import { FieldGroup, SYSTEM_COLUMNS } from '@/features/entity/types'

/**
 * Get a human-readable label for a field
 */
export function getFieldLabel(column: ColumnDefinition): string {
  // Return the field's "Name" property if it exists
  if (column.Name) {
    return column.Name
  }

  // Otherwise, convert the column name to a readable label
  return formatColumnName(column.ColumnName)
}

/**
 * Format a column name as a human-readable label
 */
export function formatColumnName(name: string): string {
  if (!name) return ''

  // Remove common prefixes
  let label = name
    .replace(/^is_/, '')
    .replace(/^has_/, '')
    .replace(/_id$/, '')

  // Split by underscore and capitalize each word
  return label
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Filter field groups based on search query
 */
export function filterFieldsBySearch(
  fieldGroups: FieldGroup[],
  columns: ColumnDefinition[],
  searchQuery: string,
  entityItem: any
): FieldGroup[] {
  if (!searchQuery.trim()) {
    return fieldGroups
  }

  const query = searchQuery.toLowerCase()

  return fieldGroups.map(group => {
    // Filter fields within this group
    const filteredFields = group.fields.filter(fieldName => {
      const column = columns.find(col => col.ColumnName === fieldName)
      if (!column) return false

      // Search in field name
      if (column.Name?.toLowerCase().includes(query)) return true
      if (fieldName.toLowerCase().includes(query)) return true

      // Search in field description
      if (column.ColumnDescription?.toLowerCase().includes(query)) return true

      // Search in field value
      const value = entityItem[fieldName]
      if (value === null || value === undefined) return false

      if (typeof value === 'string' && value.toLowerCase().includes(query)) return true
      if (typeof value === 'number' && value.toString().includes(query)) return true

      // For objects and arrays, check if any string/number property matches
      if (typeof value === 'object') {
        try {
          const stringValue = JSON.stringify(value).toLowerCase()
          return stringValue.includes(query)
        } catch (e) {
          return false
        }
      }

      return false
    })

    return {
      ...group,
      fields: filteredFields
    }
  }).filter(group => group.fields.length > 0 || (group.renderEmpty && searchQuery === ''))
}

/**
 * Get all fields from all groups
 */
export function getAllFields(fieldGroups: FieldGroup[]): string[] {
  return fieldGroups.flatMap(group => group.fields)
}

/**
 * Check if a field value is empty
 */
export function isEmptyValue(value: any): boolean {
  if (value === null || value === undefined) return true
  if (value === '') return true
  if (Array.isArray(value) && value.length === 0) return true
  if (typeof value === 'object' && Object.keys(value).length === 0) return true

  return false
}

/**
 * Group columns into logical sections for display
 */
export function groupColumnsByCategory(
  columns: ColumnDefinition[],
  skipColumns: string[] = [],
  customGroups?: Record<string, string[]>
): FieldGroup[] {
  // Define default groups
  const groups: FieldGroup[] = [
    {
      id: 'main',
      title: 'Basic',
      fields: []
    },
    {
      id: 'details',
      title: 'Additional Details',
      fields: []
    },
    {
      id: 'system',
      title: 'System Information',
      fields: [],
      tabName: 'system'
    }
  ]

  // System/metadata fields

  // Important fields that should be in the first group
  const primaryFields = [
    'name', 'title', 'description', 'email', 'code', 'status',
    'type', 'category', 'priority'
  ]

  // Apply custom groups if provided
  if (customGroups) {
    Object.entries(customGroups).forEach(([groupName, fieldNames]) => {
      const existingGroup = groups.find(g => g.id === groupName)
      if (existingGroup) {
        existingGroup.fields = fieldNames
      } else {
        groups.push({
          id: groupName,
          title: formatColumnName(groupName),
          fields: fieldNames
        })
      }
    })
  }

  // Assign remaining columns to groups
  columns.forEach(column => {
    const fieldName = column.ColumnName

    // Skip already assigned or explicitly skipped columns
    if (skipColumns.includes(fieldName) ||
      groups.some(g => g.fields.includes(fieldName))) {
      return
    }

    // Assign system fields
    if (SYSTEM_COLUMNS.includes(fieldName)) {
      groups.find(g => g.id === 'system')?.fields.push(fieldName)
      return
    }

    // Assign primary fields
    if (primaryFields.includes(fieldName) || primaryFields.some(f => fieldName.includes(f))) {
      groups.find(g => g.id === 'main')?.fields.push(fieldName)
      return
    }

    // Assign remaining fields to details
    groups.find(g => g.id === 'details')?.fields.push(fieldName)
  })

  // Remove empty groups
  return groups.filter(group => group.fields.length > 0)
}
