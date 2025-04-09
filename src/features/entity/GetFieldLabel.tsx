// Get field label
import { ColumnDefinition } from '@/features/entity/columns'

export const getFieldLabel = (
  columns: ColumnDefinition[],
  fieldName: string
) => {
  const column = columns.find((col) => col.ColumnName === fieldName)
  return column?.ColumnName || column?.Name || fieldName
}
