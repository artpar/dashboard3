import React from 'react'
import { TableBody, TableCell, TableRow } from '@/components/ui/table'
import EntityTableRow from './EntityTableRow'
import { ColumnDefinition } from '@/features/entity/columns'

interface EntityTableBodyProps {
  data: any[]
  filteredColumns: ColumnDefinition[]
  auditColumns: ColumnDefinition[]
  relations: any[]
  className: string
  onEdit: (item: any) => void
  onDelete: (item: any) => void
  onViewDetails: (item: any) => void
  isItemSelected: (item: any) => boolean
  toggleItemSelection: (item: any) => void
}

/**
 * Component for rendering the table body with rows of data
 */
export const EntityTableBody: React.FC<EntityTableBodyProps> = ({
  data,
  filteredColumns,
  auditColumns,
  relations,
  className,
  onEdit,
  onDelete,
  onViewDetails,
  isItemSelected,
  toggleItemSelection,
}) => {
  // If no data, show empty state
  if (data.length === 0) {
    return (
      <TableBody className={className}>
        <TableRow>
          <TableCell
            colSpan={filteredColumns.length + 3} // +3 for checkbox, actions, and audit columns
            className='text-muted-foreground py-6 text-center'
          >
            No data found
          </TableCell>
        </TableRow>
      </TableBody>
    )
  }

  // Otherwise, render rows of data
  return (
    <TableBody className={className}>
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
          isSelected={isItemSelected(item)}
          onToggleSelect={() => toggleItemSelection(item)}
        />
      ))}
    </TableBody>
  )
}

export default EntityTableBody
