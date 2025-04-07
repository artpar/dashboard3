import React from 'react';
import { TableCell } from '@/components/ui/table';
import { ColumnDefinition } from '../../hooks/useEntityColumns';
import { useEntityFormatters } from '../../hooks/useEntityFormatters';

interface EntityTableCellProps {
  item: any;
  column: ColumnDefinition;
}

/**
 * Component for rendering a formatted table cell based on column type
 */
export const EntityTableCell: React.FC<EntityTableCellProps> = ({ item, column }) => {
  const { formatCellValue } = useEntityFormatters();

  return (
    <TableCell>
      {formatCellValue(item, column)}
    </TableCell>
  );
};

export default EntityTableCell;
