import React, { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  ArrowDownToLine,
  Columns,
  Download,
  Eye,
  EyeOff,
  LayoutGrid,
  List,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Settings,
  Share2,
  Table,
  Upload,
} from 'lucide-react'
import { useWorldEntities } from '@/hooks/use-world-entities'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { Separator } from '@/components/ui/separator'
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
    executeAction,
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
    standard: columns.filter(col =>
      !AUDIT_COLUMNS.includes(col.ColumnName) &&
      !col.ColumnName.startsWith('__')
    ),
    audit: columns.filter(col =>
      AUDIT_COLUMNS.includes(col.ColumnName)
    ),
    system: columns.filter(col =>
      col.ColumnName.startsWith('__')
    )
  }

  return (
    <div className='mb-6 space-y-4 flex flex-col'>
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
      <div className='flex flex-wrap items-center justify-start gap-2'>
        {/* View mode toggle */}
        {/*<TooltipProvider>*/}
        {/*  <div className='bg-muted hidden rounded-md p-1 md:flex'>*/}
        {/*    <Tooltip>*/}
        {/*      <TooltipTrigger asChild>*/}
        {/*        <Button*/}
        {/*          variant={viewMode === 'table' ? 'secondary' : 'ghost'}*/}
        {/*          size='sm'*/}
        {/*          className='h-8 w-8 p-0'*/}
        {/*          onClick={() => setViewMode('table')}*/}
        {/*        >*/}
        {/*          <Table className='h-4 w-4' />*/}
        {/*          <span className='sr-only'>Table view</span>*/}
        {/*        </Button>*/}
        {/*      </TooltipTrigger>*/}
        {/*      <TooltipContent>Table view</TooltipContent>*/}
        {/*    </Tooltip>*/}

        {/*    <Tooltip>*/}
        {/*      <TooltipTrigger asChild>*/}
        {/*        <Button*/}
        {/*          variant={viewMode === 'grid' ? 'secondary' : 'ghost'}*/}
        {/*          size='sm'*/}
        {/*          className='h-8 w-8 p-0'*/}
        {/*          onClick={() => setViewMode('grid')}*/}
        {/*        >*/}
        {/*          <LayoutGrid className='h-4 w-4' />*/}
        {/*          <span className='sr-only'>Grid view</span>*/}
        {/*        </Button>*/}
        {/*      </TooltipTrigger>*/}
        {/*      <TooltipContent>Grid view</TooltipContent>*/}
        {/*    </Tooltip>*/}

        {/*    <Tooltip>*/}
        {/*      <TooltipTrigger asChild>*/}
        {/*        <Button*/}
        {/*          variant={viewMode === 'list' ? 'secondary' : 'ghost'}*/}
        {/*          size='sm'*/}
        {/*          className='h-8 w-8 p-0'*/}
        {/*          onClick={() => setViewMode('list')}*/}
        {/*        >*/}
        {/*          <List className='h-4 w-4' />*/}
        {/*          <span className='sr-only'>List view</span>*/}
        {/*        </Button>*/}
        {/*      </TooltipTrigger>*/}
        {/*      <TooltipContent>List view</TooltipContent>*/}
        {/*    </Tooltip>*/}
        {/*  </div>*/}
        {/*</TooltipProvider>*/}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='outline'
                size='icon'
                className='h-8 w-8 p-0'
                onClick={refresh}
              >
                <RefreshCw className='h-4 w-4' />
                <span className='sr-only'>Refresh</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh Data</TooltipContent>
          </Tooltip>
        </TooltipProvider>




        {/* Create new item button */}
        <Button size='sm' className='h-8 gap-1'>
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
                  <div className='text-xs font-medium text-muted-foreground px-2 py-1'>Standard</div>
                  {columnGroups.standard.map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.ColumnName}
                      checked={visibleColumns.includes(column.ColumnName)}
                      onCheckedChange={() => toggleColumnVisibility(column.ColumnName)}
                      className='capitalize'
                    >
                      {column.Name || column.ColumnName.replace(/_/g, ' ')}
                    </DropdownMenuCheckboxItem>
                  ))}
                </div>
              )}

              {/* Audit columns */}
              {columnGroups.audit.length > 0 && (
                <div className='p-1 border-t'>
                  <div className='text-xs font-medium text-muted-foreground px-2 py-1'>Audit</div>
                  {columnGroups.audit.map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.ColumnName}
                      checked={visibleColumns.includes(column.ColumnName)}
                      onCheckedChange={() => toggleColumnVisibility(column.ColumnName)}
                      className='capitalize'
                    >
                      {column.Name || column.ColumnName.replace(/_/g, ' ')}
                    </DropdownMenuCheckboxItem>
                  ))}
                </div>
              )}

              {/* System columns */}
              {columnGroups.system.length > 0 && (
                <div className='p-1 border-t'>
                  <div className='text-xs font-medium text-muted-foreground px-2 py-1'>System</div>
                  {columnGroups.system.map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.ColumnName}
                      checked={visibleColumns.includes(column.ColumnName)}
                      onCheckedChange={() => toggleColumnVisibility(column.ColumnName)}
                    >
                      {column.Name || column.ColumnName}
                    </DropdownMenuCheckboxItem>
                  ))}
                </div>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        {/* More actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='outline'
              size='sm'
              className='h-8 w-8 p-0'
            >
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
                  <DropdownMenuItem
                    onClick={() => handleExport('csv')}
                  >
                    <ArrowDownToLine className='mr-2 h-4 w-4' />
                    <span>Export as CSV</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleExport('json')}
                  >
                    <ArrowDownToLine className='mr-2 h-4 w-4' />
                    <span>Export as JSON</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleExport('excel')}
                  >
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
                  {availableActions.map((action: any) => (
                    <DropdownMenuItem
                      key={action.action_name}
                      onClick={() => executeAction(action.action_name)}
                    >
                      <span>{action.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export default EntityHeader
