import React from 'react';
import { TableRow } from '@/components/ui/table';
import { ColumnDefinition } from '../../hooks/useEntityColumns';
import EntityTableCell from './EntityTableCell';
import EntityAuditCell from './EntityAuditCell';
import EntityTableActions from './EntityTableActions';

interface EntityTableRowProps {
  item: any;
  index: number;
  columns: ColumnDefinition[];
  auditColumns: ColumnDefinition[];
  relations: any[];
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
  onViewDetails: (item: any) => void;
}

/**
 * Component for rendering a table row with formatted cells
 */
export const EntityTableRow: React.FC<EntityTableRowProps> = ({
                                                                item,
                                                                index,
                                                                columns,
                                                                auditColumns,
                                                                relations,
                                                                onEdit,
                                                                onDelete,
                                                                onViewDetails,
                                                              }) => {
  return (
    <TableRow key={item.id || item.reference_id || index}>
      {columns.map((column) => (
        <EntityTableCell
          key={column.ColumnName}
          item={item}
          column={column}
        />
      ))}

      <EntityAuditCell
        item={item}
        auditColumns={auditColumns}
      />

      <EntityTableActions
        item={item}
        onEdit={onEdit}
        onDelete={onDelete}
        onViewDetails={onViewDetails}
        relations={relations}
      />
    </TableRow>
  );
};

export default EntityTableRow;
