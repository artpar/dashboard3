import React from 'react'
import { format } from 'date-fns'
import { Edit, MoreHorizontal, Trash2 } from 'lucide-react'
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

  // Function to format cell value based on type
  const formatCellValue = (item: any, column: any) => {
    const value = item[column.key]

    if (value === null || value === undefined) {
      return '-'
    }

    // Handle different column types
    if (
      column.key === 'created_at' ||
      column.key === 'updated_at' ||
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

  // Get visible columns - limiting to keep UI clean
  const visibleColumns = columns
    .filter(
      (col) =>
        !['reference_id', 'permission', 'created_by', 'updated_by'].includes(
          col.key
        )
    )
    .slice(0, 5) // Show first 5 columns by default

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            {visibleColumns.map((column) => (
              <TableHead key={column.key}>{column.name}</TableHead>
            ))}
            <TableHead>Created At</TableHead>
            <TableHead className='text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={visibleColumns.length + 2}
                className='text-muted-foreground py-6 text-center'
              >
                No data found
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, index) => (
              <TableRow key={item.id || item.reference_id || index}>
                {visibleColumns.map((column) => (
                  <TableCell key={column.key}>
                    {formatCellValue(item, column)}
                  </TableCell>
                ))}
                <TableCell>
                  {formatCellValue(item, { key: 'created_at' })}
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

                      {/* Instance-specific actions from entity schema */}
                      {/*{availableActions*/}
                      {/*  .filter((action) => !action.instance_optional)*/}
                      {/*  .map((action) => (*/}
                      {/*    <DropdownMenuItem*/}
                      {/*      key={action.name}*/}
                      {/*      onClick={() => {*/}
                      {/*        // In a real implementation, you'd show a dialog to collect inputs*/}
                      {/*        // and then execute the action*/}
                      {/*        console.log(*/}
                      {/*          `Executing action: ${action.name} on item:`,*/}
                      {/*          item*/}
                      {/*        )*/}
                      {/*        // Sample implementation - would need proper UI*/}
                      {/*        if (*/}
                      {/*          window.confirm(*/}
                      {/*            `Execute ${action.label || action.name}?`*/}
                      {/*          )*/}
                      {/*        ) {*/}
                      {/*          executeAction(action.name, {*/}
                      {/*            ...action.defaults,*/}
                      {/*            reference_id: item.reference_id || item.id,*/}
                      {/*          }).catch((e) => console.error(e))*/}
                      {/*        }*/}
                      {/*      }}*/}
                      {/*    >*/}
                      {/*      {action.label || action.name}*/}
                      {/*    </DropdownMenuItem>*/}
                      {/*  ))}*/}

                      {/* Relations as submenus */}
                      {relations.length > 0 && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              View Relations
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              {relations.map((relation) => (
                                <DropdownMenuItem
                                  key={relation.reference_id}
                                  onClick={() => {
                                    // Would navigate to related entity
                                    // For example, if viewing a customer, could navigate to their orders
                                    console.log(
                                      `View relation: ${relation.subject} -> ${relation.relation} -> ${relation.object}`
                                    )
                                    console.log(
                                      `Item ID: ${item.reference_id || item.id}`
                                    )
                                  }}
                                >
                                  {relation.object}
                                </DropdownMenuItem>
                              ))}
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
