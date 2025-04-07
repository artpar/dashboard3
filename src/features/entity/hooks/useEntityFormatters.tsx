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
    const value = item[column.key];

    if (value === null || value === undefined) {
      return '-';
    }

    // Handle special audit columns
    if (AUDIT_COLUMNS.includes(column.key)) {
      return formatAuditColumn(value, column.key);
    }

    // Handle different column types
    if (column.type === 'datetime' || column.dataType === 'timestamp') {
      return formatDateValue(value);
    }

    // Boolean values
    if (
      typeof value === 'boolean' ||
      column.type === 'boolean' ||
      column.type === 'checkbox'
    ) {
      return formatBooleanValue(value);
    }

    // Status-like fields
    if (
      (column.key === 'status' ||
        column.key.includes('status') ||
        column.key.endsWith('_status')) &&
      typeof value === 'string'
    ) {
      return formatStatusValue(value);
    }

    // Numeric values
    if (
      column.type === 'measurement' ||
      column.type === 'int' ||
      column.type === 'integer' ||
      column.type === 'number' ||
      (column.dataType &&
        (column.dataType.includes('int') ||
          column.dataType === 'smallint' ||
          column.dataType === 'INTEGER'))
    ) {
      return formatNumericValue(value);
    }

    // File columns
    if (
      column.type &&
      (column.type.startsWith('file.') || column.type === 'file.*')
    ) {
      return formatFileValue(value);
    }

    // Foreign key references
    if (column.isForeignKey && column.foreignKeyData) {
      return formatForeignKeyValue(value, column.foreignKeyData.Namespace);
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
