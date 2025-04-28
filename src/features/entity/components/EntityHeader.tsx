import React, { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowUp,
  Clipboard,
  Columns,
  Copy,
  Download,
  Eye,
  EyeOff,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Settings,
  Share2,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { useWorldEntities } from '@/hooks/use-world-entities'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox.tsx'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useEntityCollectionData } from '@/features/entity/hooks/useEntityCollectionData'
import { AUDIT_COLUMNS } from '@/features/entity/utils/entityFormatters'
import EntityFilters from './filter/EntityFilters'

interface EntityHeaderProps {
  title: string
  description?: string
  entityName: string
}

/**
 * Enhanced component for the entity management header with comprehensive controls
 */
export const EntityHeader: React.FC<EntityHeaderProps> = ({
  title,
  description,
  entityName,
}) => {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'list'>('table')
  const [showColumnMenu, setShowColumnMenu] = useState(false)

  // Get entity data from context
  const {
    columns,
    availableActions,
    relations,
    refresh,
    visibleColumns,
    toggleColumnVisibility,
    resetColumnVisibility,
    showAllColumns,
    selectedItems,
    data,
    fetchData,
    selectAllItems,
    setShowBulkDeleteDialog,
    clearSelectedItems,
    executeAction,
    sortColumns,
    setShowPasteDialog,
    copySelectedItems,
    setClipboardData,
    setSortColumn,
    clearSorting,
  } = useEntityCollectionData()

  // Get world entities for related navigation
  const { entities } = useWorldEntities()

  // Find current entity in world entities
  const currentEntity = entities.find((e: any) => e.table_name === entityName)

  // Handle export
  const handleExport = (format: 'csv' | 'json' | 'excel') => {
    // This would be implemented with the actual export functionality
    console.log(`Exporting ${entityName} as ${format}`)
  }

  // Get column groups for the dropdown menu
  const columnGroups = {
    standard: columns.filter(
      (col) =>
        !AUDIT_COLUMNS.includes(col.ColumnName) &&
        !col.ColumnName.startsWith('__')
    ),
    audit: columns.filter((col) => AUDIT_COLUMNS.includes(col.ColumnName)),
    system: columns.filter((col) => col.ColumnName.startsWith('__')),
  }

  return (
    <div className='flex flex-col space-y-4'>
      {/* Header with title and description */}
      <div className='flex items-start justify-between'>
        <div>
          <div className='flex items-center gap-2'>
            <h1 className='text-2xl font-bold tracking-tight'>{title}</h1>
            {description && (
              <p className='text-muted-foreground mt-1'>{description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced filtering component */}
      <EntityFilters entityName={entityName} />

      {/* Action buttons */}
      <div className='flex space-x-2'>
        <div className='flex flex-wrap items-center justify-start gap-2'>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='outline'
                  size='icon'
                  className='h-8 w-8 p-0'
                  onClick={() => {
                    console.log('refreshing data')
                    fetchData()
                  }}
                >
                  <RefreshCw className='h-4 w-4' />
                  <span className='sr-only'>Refresh</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh Data</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Create new item button */}
          <Button
            onClick={() => {
              navigate({
                to: '/create/' + entityName,
              })
            }}
            size='sm'
            className='h-8 gap-1'
          >
            <Plus className='h-4 w-4' />
            New {entityName.replace(/_/g, ' ')}
          </Button>

          {/* Refresh button with tooltip */}
          {/* Column visibility dropdown */}
          <DropdownMenu open={showColumnMenu} onOpenChange={setShowColumnMenu}>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='sm' className='h-8 gap-1'>
                <Columns className='h-4 w-4' />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-[250px]'>
              <DropdownMenuLabel className='flex items-center justify-between'>
                <span>Column Visibility</span>
                <div className='flex gap-1'>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-5 w-5'
                    onClick={(e) => {
                      e.stopPropagation()
                      showAllColumns()
                    }}
                  >
                    <Eye className='h-3 w-3' />
                    <span className='sr-only'>Show all</span>
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-5 w-5'
                    onClick={(e) => {
                      e.stopPropagation()
                      resetColumnVisibility()
                    }}
                  >
                    <EyeOff className='h-3 w-3' />
                    <span className='sr-only'>Reset to default</span>
                  </Button>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Column groups */}
              <div className='max-h-[300px] overflow-y-auto'>
                {/* Standard columns */}
                {columnGroups.standard.length > 0 && (
                  <div className='p-1'>
                    <div className='text-muted-foreground px-2 py-1 text-xs font-medium'>
                      Standard
                    </div>
                    {columnGroups.standard.map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.ColumnName}
                        checked={visibleColumns.includes(column.ColumnName)}
                        onCheckedChange={() =>
                          toggleColumnVisibility(column.ColumnName)
                        }
                        className='capitalize'
                      >
                        {column.Name || column.ColumnName.replace(/_/g, ' ')}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </div>
                )}

                {/* Audit columns */}
                {columnGroups.audit.length > 0 && (
                  <div className='border-t p-1'>
                    <div className='text-muted-foreground px-2 py-1 text-xs font-medium'>
                      Audit
                    </div>
                    {columnGroups.audit.map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.ColumnName}
                        checked={visibleColumns.includes(column.ColumnName)}
                        onCheckedChange={() =>
                          toggleColumnVisibility(column.ColumnName)
                        }
                        className='capitalize'
                      >
                        {column.Name || column.ColumnName.replace(/_/g, ' ')}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </div>
                )}

                {/* System columns */}
                {columnGroups.system.length > 0 && (
                  <div className='border-t p-1'>
                    <div className='text-muted-foreground px-2 py-1 text-xs font-medium'>
                      System
                    </div>
                    {columnGroups.system.map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.ColumnName}
                        checked={visibleColumns.includes(column.ColumnName)}
                        onCheckedChange={() =>
                          toggleColumnVisibility(column.ColumnName)
                        }
                      >
                        {column.Name || column.ColumnName}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sorting dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='sm' className='h-8 gap-1'>
                {Object.keys(sortColumns).length > 0 ? (
                  <ArrowDown className='text-primary h-4 w-4' />
                ) : (
                  <ArrowDown className='h-4 w-4' />
                )}
                Sort
                {Object.keys(sortColumns).length > 0 && (
                  <Badge variant='secondary' className='ml-1 px-1'>
                    {Object.keys(sortColumns).length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-[250px]'>
              <DropdownMenuLabel className='flex items-center justify-between'>
                <span>Sort Columns</span>
                {Object.keys(sortColumns).length > 0 && (
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-5 w-5'
                    onClick={clearSorting}
                  >
                    <X className='h-3 w-3' />
                  </Button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Current sorting */}
              {Object.keys(sortColumns).length > 0 && (
                <>
                  <DropdownMenuLabel>Current Sorting</DropdownMenuLabel>
                  {Object.entries(sortColumns).map(([column, direction]) => (
                    <DropdownMenuItem
                      key={column}
                      className='flex justify-between'
                    >
                      <span>{column}</span>
                      <div className='flex items-center'>
                        {direction === 'asc' ? (
                          <ArrowUp className='ml-2 h-4 w-4' />
                        ) : (
                          <ArrowDown className='ml-2 h-4 w-4' />
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </>
              )}

              {/* Available columns for sorting */}
              <DropdownMenuLabel>Available Columns</DropdownMenuLabel>
              {columns
                .sort((a, b) => a.ColumnName.localeCompare(b.ColumnName))
                .map((column) => {
                  const columnName = column.ColumnName
                  const isCurrentlySorted = columnName in sortColumns
                  const currentDirection = sortColumns[columnName]

                  return (
                    <DropdownMenuSub key={columnName}>
                      <DropdownMenuSubTrigger className='flex justify-between'>
                        <span>{columnName}</span>
                        {isCurrentlySorted && (
                          <div className='flex items-center'>
                            {currentDirection === 'asc' ? (
                              <ArrowUp className='ml-2 h-4 w-4' />
                            ) : (
                              <ArrowDown className='ml-2 h-4 w-4' />
                            )}
                          </div>
                        )}
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem
                            onClick={() => setSortColumn(columnName, 'asc')}
                          >
                            <ArrowUp className='mr-2 h-4 w-4' />
                            <span>Sort Ascending</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setSortColumn(columnName, 'desc')}
                          >
                            <ArrowDown className='mr-2 h-4 w-4' />
                            <span>Sort Descending</span>
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          {/* More actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='sm' className='h-8 w-8 p-0'>
                <MoreHorizontal className='h-4 w-4' />
                <span className='sr-only'>More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Export submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Download className='mr-2 h-4 w-4' />
                  <span>Export</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => handleExport('csv')}>
                      <ArrowDownToLine className='mr-2 h-4 w-4' />
                      <span>Export as CSV</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('json')}>
                      <ArrowDownToLine className='mr-2 h-4 w-4' />
                      <span>Export as JSON</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('excel')}>
                      <ArrowDownToLine className='mr-2 h-4 w-4' />
                      <span>Export as Excel</span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              {/* Import */}
              <DropdownMenuItem>
                <Upload className='mr-2 h-4 w-4' />
                <span>Import Data</span>
              </DropdownMenuItem>

              {/* Settings */}
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className='mr-2 h-4 w-4' />
                <span>Settings</span>
              </DropdownMenuItem>

              {/* Share */}
              <DropdownMenuItem>
                <Share2 className='mr-2 h-4 w-4' />
                <span>Share</span>
              </DropdownMenuItem>

              {/* Custom actions */}
              {availableActions && availableActions.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Custom Actions</DropdownMenuLabel>
                    {availableActions
                      .filter((e) => e.InstanceOptional)
                      .map((action: any) => (
                        <DropdownMenuItem
                          key={action.ActionName}
                          onClick={() => executeAction(action.ActionName)}
                        >
                          <span>{action.ActionName}</span>
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuGroup>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className='flex justify-end gap-2 p-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => copySelectedItems()}
            disabled={selectedItems.length === 0}
            className='flex items-center gap-1'
          >
            <Copy className='h-4 w-4' />
            Copy {selectedItems.length > 0 ? `(${selectedItems.length})` : ''}
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setShowPasteDialog(true)}
            className='flex items-center gap-1'
          >
            <Clipboard className='h-4 w-4' />
            Paste
          </Button>
        </div>

        {selectedItems.length > 0 && (
          <div className='flex justify-end gap-2 p-2'>
            <div className='flex space-x-2'>
              <Button
                variant='destructive'
                size='sm'
                className='h-8 gap-1'
                onClick={() => setShowBulkDeleteDialog(true)}
              >
                <Trash2 className='h-4 w-4' />
                Delete Selected
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EntityHeader
