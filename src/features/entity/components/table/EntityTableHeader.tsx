import React from 'react'
import { ChevronDown, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ColumnDefinition } from '../../hooks/useEntityColumns'
import { AUDIT_COLUMNS } from '../../utils/entityFormatters'

interface EntityTableHeaderProps {
  columns: ColumnDefinition[]
  visibleColumns: string[]
  toggleColumnVisibility: (key: string) => void
}

/**
 * Component for rendering the table header with column visibility controls
 */
export const EntityTableHeader: React.FC<EntityTableHeaderProps> = ({
  columns,
  visibleColumns,
  toggleColumnVisibility,
}) => {
  return (
    <div className='flex justify-end border-b p-2'>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='outline' size='sm'>
            <Settings className='mr-2 h-4 w-4' />
            Columns
            <ChevronDown className='ml-2 h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-56'>
          {columns.map((column) => (
            <DropdownMenuCheckboxItem
              key={column.ColumnName}
              checked={visibleColumns.includes(column.ColumnName)}
              onCheckedChange={() => toggleColumnVisibility(column.ColumnName)}
            >
              {column.name}
              {AUDIT_COLUMNS.includes(column.ColumnName) && (
                <span className='text-muted-foreground ml-2 text-xs'>
                  (Audit)
                </span>
              )}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default EntityTableHeader
