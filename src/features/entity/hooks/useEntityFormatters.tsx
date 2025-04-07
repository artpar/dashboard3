import { useCallback } from 'react';
import { ColumnDefinition } from './useEntityColumns';
import {
  AUDIT_COLUMNS,
  formatAuditColumn,
  formatDateValue,
  formatBooleanValue,
  formatStatusValue,
  formatNumericValue,
  formatFileValue,
  formatForeignKeyValue,
  formatLongTextValue,
  formatObjectValue
} from '../utils/entityFormatters';

/**
 * Hook for formatting cell values based on column types
 */
export function useEntityFormatters() {
  /**
   * Format a cell value based on column type
   */
  const formatCellValue = useCallback((item: any, column: ColumnDefinition) => {
    const value = item[column.ColumnName];

    if (value === null || value === undefined) {
      return '-';
    }

    // Handle special audit columns
    if (AUDIT_COLUMNS.includes(column.ColumnName)) {
      return formatAuditColumn(value, column.ColumnName);
    }

    // Handle different column types
    if (column.ColumnType === 'datetime' || column.DataType === 'timestamp') {
      return formatDateValue(value);
    }

    // Boolean values
    if (
      typeof value === 'boolean' ||
      column.ColumnType === 'boolean' ||
      column.ColumnType === 'checkbox'
    ) {
      return formatBooleanValue(value);
    }

    // Status-like fields
    if (
      (column.ColumnName === 'status' ||
        column.ColumnName.includes('status') ||
        column.ColumnName.endsWith('_status')) &&
      typeof value === 'string'
    ) {
      return formatStatusValue(value);
    }

    // Numeric values
    if (
      column.ColumnType === 'measurement' ||
      column.ColumnType === 'int' ||
      column.ColumnType === 'integer' ||
      column.ColumnType === 'number' ||
      (column.DataType &&
        (column.DataType.includes('int') ||
          column.DataType === 'smallint' ||
          column.DataType === 'INTEGER'))
    ) {
      return formatNumericValue(value);
    }

    // File columns
    if (
      column.ColumnType &&
      (column.ColumnType.startsWith('file.') || column.ColumnType === 'file.*')
    ) {
      return formatFileValue(value);
    }

    // Foreign key references
    if (column.IsForeignKey && column.ForeignKeyData) {
      return formatForeignKeyValue(value, column.ForeignKeyData.Namespace);
    }

    // Long text
    if (typeof value === 'string' && value.length > 50) {
      return formatLongTextValue(value);
    }

    // JSON or objects
    if (typeof value === 'object' && value !== null) {
      return formatObjectValue(value);
    }

    // Default case
    return value.toString();
  }, []);

  return { formatCellValue };
}
