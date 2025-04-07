import React, { useState } from 'react'
import { format } from 'date-fns'
import { ChevronDown, Edit, Eye, MoreHorizontal, Settings, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useEntityData } from './EntityContext'

// Define special columns that should be displayed in a compact way
const AUDIT_COLUMNS = ['reference_id', 'created_at', 'updated_at', 'permission', 'user_account_id', 'created_by', 'updated_by']

export const EntityDataTable: React.FC = () => {
  const {
    data,
    columns,
    setSelectedItem,
    setShowEditDialog,
    setShowDeleteDialog,
    currentPage,
    pageSize,
    availableActions,
    relations,
    executeAction,
  } = useEntityData()

  // State for column visibility
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    // By default, show all columns except audit columns
    return columns
      .filter(col => !AUDIT_COLUMNS.includes(col.key))
      .map(col => col.key)
  })

  // Toggle column visibility
  const toggleColumnVisibility = (columnKey: string) => {
    setVisibleColumns(prev => 
      prev.includes(columnKey)
        ? prev.filter(key => key !== columnKey)
        : [...prev, columnKey]
    )
  }

  // Function to format cell value based on type
  const formatCellValue = (item: any, column: any) => {
    const value = item[column.key]

    if (value === null || value === undefined) {
      return '-'
    }

    // Special compact formatting for audit columns
    if (AUDIT_COLUMNS.includes(column.key)) {
      // Format dates in a more compact way
      if (column.key === 'created_at' || column.key === 'updated_at') {
        try {
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(value), 'MM/dd/yy')}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{format(new Date(value), 'PPP p')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        } catch (e) {
          return <span className="text-xs text-muted-foreground">{value}</span>
        }
      }

      // For reference IDs and other audit columns
      if (typeof value === 'string') {
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-muted-foreground">
                  {value.length > 8 ? `${value.substring(0, 8)}...` : value}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{value}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      }
    }

    // Handle different column types
    if (
      column.type === 'datetime' ||
      column.dataType === 'timestamp'
    ) {
      try {
        return format(new Date(value), 'PPP p')
      } catch (e) {
        return value
      }
    }

    // Boolean values
    if (
      typeof value === 'boolean' ||
      column.type === 'boolean' ||
      column.type === 'checkbox'
    ) {
      return value ? (
        <Badge variant='outline' className='bg-green-100'>
          Yes
        </Badge>
      ) : (
        <Badge variant='outline' className='bg-red-100'>
          No
        </Badge>
      )
    }

    // Status-like fields with common status values
    if (
      (column.key === 'status' ||
        column.key.includes('status') ||
        column.key.endsWith('_status')) &&
      typeof value === 'string'
    ) {
      const statusColors: { [key: string]: string } = {
        active: 'bg-green-100 text-green-800',
        inactive: 'bg-gray-100 text-gray-800',
        pending: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
        completed: 'bg-blue-100 text-blue-800',
        failed: 'bg-red-100 text-red-800',
        paid: 'bg-green-100 text-green-800',
        unpaid: 'bg-red-100 text-red-800',
        draft: 'bg-gray-100 text-gray-800',
        published: 'bg-blue-100 text-blue-800',
        confirmed: 'bg-green-100 text-green-800',
        archived: 'bg-gray-100 text-gray-800',
      }

      return (
        <Badge
          variant='outline'
          className={statusColors[value.toLowerCase()] || 'bg-gray-100'}
        >
          {value}
        </Badge>
      )
    }

    // Show smaller values for numerical columns with measurement type
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
      // If it's a boolean-like integer (0/1)
      if (value === 0 || value === 1) {
        return value === 1 ? (
          <Badge variant='outline' className='bg-green-100'>
            Yes
          </Badge>
        ) : (
          <Badge variant='outline' className='bg-red-100'>
            No
          </Badge>
        )
      }

      return value.toString()
    }

    // File columns - show a placeholder or icon
    if (
      column.type &&
      (column.type.startsWith('file.') || column.type === 'file.*')
    ) {
      return value ? (
        <Badge variant='outline' className='bg-blue-100'>
          <a
            href='#'
            onClick={(e) => {
              e.preventDefault()
              // In a real app, this would link to the file
              console.log('View file:', value)
            }}
          >
            View file
          </a>
        </Badge>
      ) : (
        '-'
      )
    }

    // Foreign key references - show reference ID in a badge
    if (column.isForeignKey && column.foreignKeyData) {
      return (
        <Badge variant='outline' className='bg-purple-100'>
          {column.foreignKeyData.Namespace}: {value}
        </Badge>
      )
    }

    // Handle long text
    if (typeof value === 'string' && value.length > 50) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>{value.substring(0, 50)}...</span>
            </TooltipTrigger>
            <TooltipContent className='max-w-md'>
              <p>{value}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    // JSON or objects
    if (typeof value === 'object' && value !== null) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>[Object]</span>
            </TooltipTrigger>
            <TooltipContent className='max-w-md'>
              <pre className='text-xs'>{JSON.stringify(value, null, 2)}</pre>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    // Default case
    return value.toString()
  }

  // Handle edit action
  const handleEdit = (item: any) => {
    setSelectedItem(item)
    setShowEditDialog(true)
  }

  // Handle delete action
  const handleDelete = (item: any) => {
    setSelectedItem(item)
    setShowDeleteDialog(true)
  }

  // Handle view details action
  const handleViewDetails = (item: any) => {
    // Show a modal with all details including audit columns
    setSelectedItem(item)
    // This would typically open a view dialog
    console.log('View details for:', item)
  }

  // Get filtered columns based on visibility state
  const filteredColumns = columns.filter(col => visibleColumns.includes(col.key))

  // Get audit columns that we want to show in a compact way
  const auditColumnsToShow = columns.filter(col => 
    AUDIT_COLUMNS.includes(col.key) && 
    // Only show created_at and reference_id by default in the compact section
    ['created_at', 'reference_id'].includes(col.key)
  )

  return (
    <div className='rounded-md border'>
      <div className="flex justify-end p-2 border-b">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Columns
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {columns.map(column => (
              <DropdownMenuCheckboxItem
                key={column.key}
                checked={visibleColumns.includes(column.key)}
                onCheckedChange={() => toggleColumnVisibility(column.key)}
              >
                {column.name}
                {AUDIT_COLUMNS.includes(column.key) && (
                  <span className="ml-2 text-xs text-muted-foreground">(Audit)</span>
                )}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {filteredColumns.map((column) => (
              <TableHead key={column.key}>{column.name}</TableHead>
            ))}
            <TableHead className="text-xs text-muted-foreground">
              Audit Info
            </TableHead>
            <TableHead className='text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={filteredColumns.length + 2}
                className='text-muted-foreground py-6 text-center'
              >
                No data found
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, index) => (
              <TableRow key={item.id || item.reference_id || index}>
                {filteredColumns.map((column) => (
                  <TableCell key={column.key}>
                    {formatCellValue(item, column)}
                  </TableCell>
                ))}
                <TableCell className="text-xs">
                  <div className="flex flex-col gap-1">
                    {auditColumnsToShow.map(column => (
                      <div key={column.key} className="flex items-center gap-1">
                        <span className="text-xs font-medium text-muted-foreground">
                          {column.key === 'reference_id' ? 'ID:' : 'Created:'}
                        </span>
                        {formatCellValue(item, column)}
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell className='text-right'>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' size='icon'>
                        <MoreHorizontal className='h-4 w-4' />
                        <span className='sr-only'>Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      {/* View details option */}
                      <DropdownMenuItem onClick={() => handleViewDetails(item)}>
                        <Eye className='mr-2 h-4 w-4' />
                        View Details
                      </DropdownMenuItem>
                      
                      {/* Standard CRUD operations */}
                      <DropdownMenuItem onClick={() => handleEdit(item)}>
                        <Edit className='mr-2 h-4 w-4' />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(item)}
                        className='text-red-600'
                      >
                        <Trash2 className='mr-2 h-4 w-4' />
                        Delete
                      </DropdownMenuItem>

                      {/* Relations as submenus */}
                      {relations.length > 0 && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              View Relations
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              {JSON.stringify(relations, null, 2)}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export default EntityDataTable
