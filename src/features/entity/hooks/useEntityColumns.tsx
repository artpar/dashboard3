import { useCallback, useEffect, useMemo, useState } from 'react'
import { AUDIT_COLUMNS } from '../utils/entityFormatters'

export interface ColumnDefinition {
  ColumnName: string
  Name: string
  ColumnType?: string
  DataType?: string
  IsNullable?: boolean
  IsUnique?: boolean
  IsPrimaryKey?: boolean
  IsForeignKey?: boolean
  DefaultValue?: any
  RelationName?: string
  ForeignKeyData?: any
  Options?: any[]
  ColumnDescription?: string
}

/**
 * Hook for managing column visibility in entity tables
 */
export function useEntityColumns(columns: ColumnDefinition[]) {
  // Keep track of the last non-empty columns array
  const [lastValidColumns, setLastValidColumns] = useState<ColumnDefinition[]>(
    []
  )

  // Update lastValidColumns when we get a non-empty columns array
  useEffect(() => {
    if (columns && columns.length > 0) {
      // console.log(
      //   'useEntityColumns: Updating lastValidColumns with',
      //   columns.length,
      //   'columns'
      // )
      setLastValidColumns(columns)
    }
  }, [columns])

  // Use either the current columns or the last valid columns
  const effectiveColumns = useMemo(() => {
    return columns && columns.length > 0 ? columns : lastValidColumns
  }, [columns, lastValidColumns])

  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    // By default, show all columns except audit columns
    const initialColumns = effectiveColumns
      .filter((col) => !AUDIT_COLUMNS.includes(col.ColumnName))
      .map((col) => col.ColumnName)
    // console.log(
    //   'useEntityColumns: Initial visibleColumns:',
    //   initialColumns.length
    // )
    return initialColumns
  })

  // Add useEffect to reset visibleColumns when columns change
  useEffect(() => {
    if (effectiveColumns.length > 0) {
      const newVisibleColumns = effectiveColumns
        .filter((col) => !AUDIT_COLUMNS.includes(col.ColumnName))
        .map((col) => col.ColumnName)
      // console.log(
      //   'useEntityColumns: Updating visibleColumns:',
      //   newVisibleColumns.length
      // )
      setVisibleColumns(newVisibleColumns)
    }
  }, [effectiveColumns])

  // Memo-ize filtered columns to avoid unnecessary recalculations
  const filteredColumns = useMemo(() => {
    return effectiveColumns.filter((col) =>
      visibleColumns.includes(col.ColumnName)
    )
  }, [effectiveColumns, visibleColumns])

  // Get audit columns that we want to show in a compact way
  const auditColumnsToShow = useMemo(() => {
    return effectiveColumns.filter(
      (col) =>
        AUDIT_COLUMNS.includes(col.ColumnName) &&
        ['created_at', 'reference_id'].includes(col.ColumnName)
    )
  }, [effectiveColumns])

  // Toggle column visibility
  const toggleColumnVisibility = useCallback((columnKey: string) => {
    setVisibleColumns((prev) =>
      prev.includes(columnKey)
        ? prev.filter((key) => key !== columnKey)
        : [...prev, columnKey]
    )
  }, [])

  // Reset column visibility to default
  const resetColumnVisibility = useCallback(() => {
    setVisibleColumns(
      effectiveColumns
        .filter((col) => !AUDIT_COLUMNS.includes(col.ColumnName))
        .map((col) => col.ColumnName)
    )
  }, [effectiveColumns])

  // Show all columns
  const showAllColumns = useCallback(() => {
    setVisibleColumns(effectiveColumns.map((col) => col.ColumnName))
  }, [effectiveColumns])

  return {
    visibleColumns,
    filteredColumns,
    auditColumnsToShow,
    toggleColumnVisibility,
    resetColumnVisibility,
    showAllColumns,
  }
}
