// src/components/entity/columns/viewers/NumberColumnViewer.tsx
import React from 'react';
import { cn } from '@/lib/utils';
import { formatDecimal, formatMoney, formatNumber } from '../formatters';
import { ColumnType, ColumnViewerProps } from '../types';
import { getColumnType } from '../utils';

/**
 * Component for displaying numeric values
 */
export const NumberColumnViewer: React.FC<ColumnViewerProps> = ({
                                                                  value,
                                                                  column,
                                                                  className
                                                                }) => {
  const columnType = getColumnType(column);

  // If the value is null or undefined
  if (value === null || value === undefined) {
    return <span className={className}>-</span>;
  }

  // Select formatter based on column type
  let formattedValue: React.ReactNode;

  switch (columnType) {
    case ColumnType.Money:
      formattedValue = formatMoney(value);
      break;

    case ColumnType.NumberFloat:
    case ColumnType.Latitude:
    case ColumnType.Longitude:
      formattedValue = formatDecimal(value);
      break;

    case ColumnType.Rating5:
    case ColumnType.Rating10:
    case ColumnType.Rating100:
      // For ratings, use a specialized rating display
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      let maxValue = 5;

      if (columnType === ColumnType.Rating10) {
        maxValue = 10;
      } else if (columnType === ColumnType.Rating100) {
        maxValue = 100;
      }

      // For Rating100, show as percentage
      if (maxValue === 100) {
        formattedValue = `${numValue}%`;
      } else {
        // For Rating5 and Rating10, show stars
        const stars = '★'.repeat(numValue) + '☆'.repeat(maxValue - numValue);
        formattedValue = <span className="text-yellow-500">{stars}</span>;
      }
      break;

    case ColumnType.NumberInt:
    case ColumnType.Measurement:
    default:
      formattedValue = formatNumber(value);
      break;
  }

  return (
    <span className={cn(
      // Right-align numbers by default
      "text-right",
      className
    )}>
      {formattedValue}
    </span>
  );
};

export default NumberColumnViewer;
