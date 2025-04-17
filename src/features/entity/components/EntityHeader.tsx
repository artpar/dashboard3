import React, { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  ArrowDownToLine,
  Columns,
  Download,
  Filter,
  LayoutGrid,
  List,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Share2,
  Table,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
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
import { Separator } from '@/components/ui/separator'
import { useEntityCollectionData } from '@/features/entity/hooks/useEntityCollectionData'
import { useWorldEntities } from '@/hooks/use-world-entities'

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
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'list'>('table')

  // Get entity data from context
  const {
    data,
    columns,
    availableActions,
    relations,
    refresh,
    filters,
    setFilters,
    setShowFilterDialog,
    executeAction,
    currentPage,
    totalPages,
  } = useEntityCollectionData()

  // Get world entities for related navigation
  const { entities } = useWorldEntities()

  // Find current entity in world entities
  const currentEntity = entities.find(e => e.table_name === entityName)

  // Handle search
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      setFilters({
        ...filters,
        _search: searchTerm.trim(),
      })
    } else {
      const { _search, ...restFilters } = filters
      setFilters(restFilters)
    }
  }

  // Handle export
  const handleExport = (format: 'csv' | 'json' | 'excel') => {
    // This would be implemented with the actual export functionality
    console.log(`Exporting ${entityName} as ${format}`)
  }

  // Count active filters
  const activeFilterCount = Object.keys(filters).length

  return (
    <div className="space-y-4 mb-6">
      {/* Header with title and description */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {currentEntity?.is_top_level && (
              <Badge variant="outline" className="ml-2">Top Level</Badge>
            )}
          </div>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Records</p>
            <p className="text-lg font-medium">{data?.length || 0}</p>
          </div>

          <div className="text-right">
            <p className="text-sm text-muted-foreground">Page</p>
            <p className="text-lg font-medium">{currentPage} / {totalPages || 1}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        {/* Search bar */}
        <div className="flex-1 max-w-md">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={`Search ${entityName}...`}
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View mode toggle */}
          <TooltipProvider>
            <div className="hidden md:flex bg-muted rounded-md p-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setViewMode('table')}
                  >
                    <Table className="h-4 w-4" />
                    <span className="sr-only">Table view</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Table view</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGrid className="h-4 w-4" />
                    <span className="sr-only">Grid view</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Grid view</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                    <span className="sr-only">List view</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>List view</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>

          {/* Filter button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilterDialog(true)}
            className="relative"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center rounded-full"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>

          {/* Column settings */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns className="mr-2 h-4 w-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Column Visibility</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map((column) => (
                <DropdownMenuItem key={column.ColumnName}>
                  {column.ColumnDescription || column.Name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <ArrowDownToLine className="mr-2 h-4 w-4" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('json')}>
                <ArrowDownToLine className="mr-2 h-4 w-4" />
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                <ArrowDownToLine className="mr-2 h-4 w-4" />
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Upload className="mr-2 h-4 w-4" />
                Import Data
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Create new button */}
          <Button onClick={() => navigate({ to: `/create/${entityName}` })}>
            <Plus className="mr-2 h-4 w-4" />
            Add {entityName}
          </Button>

          {/* More actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={refresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Data
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Related entities navigation */}
              {relations.length > 0 && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Share2 className="mr-2 h-4 w-4" />
                    Related Entities
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      {relations.map((relation) => (
                        <DropdownMenuItem
                          key={relation.Subject + relation.SubjectName + relation.RelationName + relation.Object + relation.ObjectName}
                          onClick={() => navigate({ to: `/entity/${relation.target}` })}
                        >
                          {relation.label || relation.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              )}

              {/* Entity actions */}
              {availableActions.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    {availableActions.map((action) => (
                      <DropdownMenuItem
                        key={action.id}
                        onClick={() => executeAction(action.action_name, {})}
                      >
                        {action.label || action.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </>
              )}

              <DropdownMenuSeparator />

              {/* Entity settings */}
              <DropdownMenuItem onClick={() => navigate({ to: `/entity-settings/${entityName}` })}>
                <Settings className="mr-2 h-4 w-4" />
                Entity Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Separator />
    </div>
  )
}

export default EntityHeader
