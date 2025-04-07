import React from 'react';
import { TableBody, TableCell, TableRow } from '@/components/ui/table';
import { ColumnDefinition } from '../../hooks/useEntityColumns';
import EntityTableRow from './EntityTableRow';

interface EntityTableBodyProps {
  data: any[];
  filteredColumns: ColumnDefinition[];
  auditColumns: ColumnDefinition[];
  relations: any[];
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
  onViewDetails: (item: any) => void;
}

/**
 * Component for rendering the table body with rows of data
 */
export const EntityTableBody: React.FC<EntityTableBodyProps> = ({
                                                                  data,
                                                                  filteredColumns,
                                                                  auditColumns,
                                                                  relations,
                                                                  onEdit,
                                                                  onDelete,
                                                                  onViewDetails,
                                                                }) => {
  // If no data, show empty state
  if (data.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <TableCell
            colSpan={filteredColumns.length + 2}
            className="text-muted-foreground py-6 text-center"
          >
            No data found
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  // Otherwise, render rows of data
  return (
    <TableBody>
      {data.map((item, index) => (
        <EntityTableRow
          key={item.id || item.reference_id || index}
          item={item}
          index={index}
          columns={filteredColumns}
          auditColumns={auditColumns}
          relations={relations}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewDetails={onViewDetails}
        />
      ))}
    </TableBody>
  );
};

export default EntityTableBody;
