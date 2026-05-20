import React from 'react'
import { createLazyFileRoute } from '@tanstack/react-router'
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Loader2,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { Main } from '@/components/layout/main'
import { ColumnDefinition, ColumnViewer } from '@/features/entity/columns'
import EntityDeleteDialog from '@/features/entity/components/dialogs/EntityDeleteDialog'
import EntityPagination from '@/features/entity/components/pagination/EntityPagination'
import { EntityEmptyState } from '@/features/entity/components/table/EntityEmptyState'
import EntityTableCell from '@/features/entity/components/table/EntityTableCell'
import { useEntityCollectionData } from '@/features/entity/hooks/useEntityCollectionData'
import { CollectionEntityDataProvider } from '@/features/entity/providers/CollectionEntityDataProvider'
import { EntityApiService } from '@/features/entity/services/EntityApiService'
import {
  EntityRecord,
  getEntityId,
} from '@/features/entity/utils/entityIdentity'

type OAuthConnectRecord = EntityRecord & Record<string, unknown>
type SortDirection = 'asc' | 'desc'

const OAUTH_TITLE = 'OAuth Connections'
const OAUTH_DESCRIPTION =
  'Configure external identity providers (Google, GitHub, Microsoft) for social login or accessing external APIs on behalf of users'

function getOAuthLabel(item: OAuthConnectRecord) {
  const label =
    item.name ??
    item.label ??
    item.provider ??
    item.client_id ??
    item.reference_id ??
    item.id

  return label == null || String(label).trim() === ''
    ? 'OAuth connection'
    : String(label)
}

function readActionAttribute(
  response: unknown,
  responseType: string,
  attributeName: string
) {
  if (!Array.isArray(response)) return undefined

  return response.find((item) => item?.ResponseType === responseType)
    ?.Attributes?.[attributeName]
}

function processOAuthBeginResponse(response: unknown) {
  if (!Array.isArray(response)) {
    throw new Error('OAuth begin action did not return action responses')
  }

  for (const item of response) {
    if (item?.ResponseType === 'client.store.set') {
      const key = item.Attributes?.key
      const value = item.Attributes?.value
      if (typeof key === 'string' && value !== undefined) {
        localStorage.setItem(key, String(value))
      }
    }
  }

  const location = readActionAttribute(response, 'client.redirect', 'location')
  if (typeof location !== 'string' || location.trim() === '') {
    throw new Error('OAuth begin action did not return a redirect URL')
  }

  const delay = Number(
    readActionAttribute(response, 'client.redirect', 'delay') ?? 0
  )
  const target = readActionAttribute(response, 'client.redirect', 'window')

  window.setTimeout(
    () => {
      if (target === 'new') {
        window.open(location, '_blank')
      } else {
        window.location.href = location
      }
    },
    Number.isFinite(delay) ? delay : 0
  )
}

function OAuthPage() {
  return (
    <CollectionEntityDataProvider entityName='oauth_connect'>
      <OAuthConnectionsContent />
    </CollectionEntityDataProvider>
  )
}

function OAuthConnectionsContent() {
  const { toast } = useToast()
  const [startingId, setStartingId] = React.useState<string | null>(null)
  const {
    data: rawData,
    columns,
    isLoading,
    error,
    currentPage,
    totalPages,
    pageSize,
    setSelectedItem,
    setCurrentPage,
    setPageSize,
    pagination,
    setShowDeleteDialog,
    fetchData,
    visibleColumns,
    sortColumns,
    toggleSortColumn,
    isItemSelected,
    toggleItemSelection,
    toggleAllVisibleItems,
    areAllVisibleItemsSelected,
  } = useEntityCollectionData()

  const data = rawData as OAuthConnectRecord[]

  const filteredColumns = React.useMemo(() => {
    return columns.filter((column) =>
      visibleColumns.includes(column.ColumnName)
    )
  }, [columns, visibleColumns])

  const handleDelete = (item: OAuthConnectRecord) => {
    setSelectedItem(item)
    setShowDeleteDialog(true)
  }

  const startOAuthFlow = async (item: OAuthConnectRecord) => {
    const itemId = getEntityId(item)
    if (!itemId) {
      toast({
        variant: 'destructive',
        title: 'OAuth flow not started',
        description: 'This OAuth connection does not have a reference id.',
      })
      return
    }

    setStartingId(itemId)
    try {
      const response = await EntityApiService.executeAction(
        'oauth_connect',
        'oauth_login_begin',
        {
          oauth_connect_id: itemId,
        }
      )
      processOAuthBeginResponse(response)
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'OAuth flow not started',
        description:
          err instanceof Error ? err.message : 'Failed to start OAuth flow',
      })
    } finally {
      setStartingId(null)
    }
  }

  if (error) {
    return (
      <Main>
        <OAuthHeader onRefresh={fetchData} />
        <Alert variant='destructive'>
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : 'An error occurred while fetching OAuth connections'}
          </AlertDescription>
        </Alert>
      </Main>
    )
  }

  return (
    <Main className='flex flex-col'>
      <OAuthHeader onRefresh={fetchData} />

      <div className='min-h-0 flex-1'>
        {isLoading ? (
          <div className='space-y-4 p-6'>
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-64 w-full' />
          </div>
        ) : columns.length === 0 ? (
          <div className='rounded-md border p-2 text-center'>
            <p className='text-muted-foreground'>Waiting for columns...</p>
          </div>
        ) : data.length === 0 ? (
          <EntityEmptyState
            entityName='oauth_connect'
            className='h-full'
            variant='block'
          />
        ) : (
          <div className='h-full overflow-auto'>
            <div className='hidden lg:block'>
              <OAuthConnectionsTable
                data={data}
                columns={filteredColumns}
                sortColumns={sortColumns}
                areAllVisibleItemsSelected={areAllVisibleItemsSelected}
                startingId={startingId}
                onToggleAllVisibleItems={toggleAllVisibleItems}
                onToggleSortColumn={toggleSortColumn}
                onDelete={handleDelete}
                onStart={startOAuthFlow}
                isItemSelected={isItemSelected}
                toggleItemSelection={toggleItemSelection}
              />
            </div>
            <div className='grid gap-3 p-3 lg:hidden'>
              {data.map((item, index) => {
                const itemId = getEntityId(item)
                const isSelected = isItemSelected(item)
                const isStarting = itemId !== '' && startingId === itemId

                return (
                  <Card
                    key={itemId || index}
                    className={`rounded-md ${isSelected ? 'border-primary bg-muted/30' : ''}`}
                  >
                    <CardContent className='p-4'>
                      <div className='flex items-start gap-3'>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleItemSelection(item)}
                          aria-label={`Select OAuth connection ${index + 1}`}
                          className='mt-1'
                        />
                        <div className='min-w-0 flex-1'>
                          <div className='flex items-start justify-between gap-2'>
                            <div className='min-w-0'>
                              <h3 className='truncate text-sm font-semibold'>
                                {getOAuthLabel(item)}
                              </h3>
                              {itemId && (
                                <p className='text-muted-foreground mt-0.5 truncate text-xs'>
                                  {itemId}
                                </p>
                              )}
                            </div>
                            <div className='flex shrink-0 items-center gap-1'>
                              <StartOAuthButton
                                disabled={!itemId}
                                isStarting={isStarting}
                                onClick={() => startOAuthFlow(item)}
                              />
                              <Button
                                variant='ghost'
                                size='icon'
                                className='text-destructive hover:text-destructive h-8 w-8'
                                onClick={() => handleDelete(item)}
                                aria-label={`Delete OAuth connection ${index + 1}`}
                              >
                                <Trash2 className='h-4 w-4' />
                              </Button>
                            </div>
                          </div>

                          <div className='mt-4 grid gap-3 sm:grid-cols-2'>
                            {filteredColumns.map((column) => (
                              <OAuthFieldPreview
                                key={column.ColumnName}
                                column={column}
                                item={item}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className='mt-auto flex-shrink-0 border-t border-t-gray-300 pt-2'>
        <EntityPagination
          currentPage={currentPage}
          totalPages={pagination?.lastPage || totalPages}
          pageSize={pagination?.perPage || pageSize}
          totalItems={pagination?.total || 0}
          isLoading={isLoading}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      <EntityDeleteDialog />
    </Main>
  )
}

function OAuthHeader({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className='mb-4 flex flex-col gap-4'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>{OAUTH_TITLE}</h1>
          <p className='text-muted-foreground mt-1 max-w-2xl text-sm'>
            {OAUTH_DESCRIPTION}
          </p>
        </div>
        <Button
          variant='outline'
          size='icon'
          className='h-8 w-8 shrink-0'
          onClick={onRefresh}
          aria-label='Refresh OAuth connections'
        >
          <RefreshCw className='h-4 w-4' />
        </Button>
      </div>
    </div>
  )
}

function OAuthConnectionsTable({
  data,
  columns,
  sortColumns,
  areAllVisibleItemsSelected,
  startingId,
  onToggleAllVisibleItems,
  onToggleSortColumn,
  onDelete,
  onStart,
  isItemSelected,
  toggleItemSelection,
}: {
  data: OAuthConnectRecord[]
  columns: ColumnDefinition[]
  sortColumns: Record<string, SortDirection>
  areAllVisibleItemsSelected: boolean
  startingId: string | null
  onToggleAllVisibleItems: () => void
  onToggleSortColumn: (columnName: string) => void
  onDelete: (item: OAuthConnectRecord) => void
  onStart: (item: OAuthConnectRecord) => void
  isItemSelected: (item: OAuthConnectRecord) => boolean
  toggleItemSelection: (item: OAuthConnectRecord) => void
}) {
  return (
    <Table className='sticky-header-table'>
      <TableHeader className='bg-background'>
        <TableRow>
          <TableHead className='bg-background sticky top-0 left-0 z-[110] w-10'>
            <Checkbox
              checked={areAllVisibleItemsSelected}
              onCheckedChange={onToggleAllVisibleItems}
              aria-label='Select all OAuth connections'
            />
          </TableHead>
          <TableHead className='bg-background sticky top-0 left-10 z-[110] min-w-36'>
            OAuth
          </TableHead>
          {columns.map((column) => {
            const isSorted = column.ColumnName in sortColumns
            const sortDirection = sortColumns[column.ColumnName]

            return (
              <TableHead
                className='bg-background sticky top-0 min-w-16'
                key={column.ColumnName}
              >
                <Button
                  variant='ghost'
                  className='hover:bg-muted flex h-8 w-full items-center justify-between px-2 py-0 text-left font-medium'
                  onClick={() => onToggleSortColumn(column.ColumnName)}
                >
                  <span>{column.ColumnName}</span>
                  {isSorted && (
                    <span className='ml-2'>
                      {sortDirection === 'asc' ? (
                        <ArrowUp className='h-4 w-4' />
                      ) : (
                        <ArrowDown className='h-4 w-4' />
                      )}
                    </span>
                  )}
                </Button>
              </TableHead>
            )
          })}
          <TableHead className='bg-background sticky top-0 w-10'></TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {data.map((item, index) => {
          const itemId = getEntityId(item)
          const isSelected = isItemSelected(item)
          const isStarting = itemId !== '' && startingId === itemId

          return (
            <TableRow
              key={itemId || index}
              className={`hover:bg-muted/60 ${isSelected ? 'bg-muted/40' : ''}`}
            >
              <td
                onClick={() => toggleItemSelection(item)}
                className='bg-background sticky left-0 z-10 w-10 cursor-pointer p-2 align-middle hover:bg-gray-200'
              >
                <Checkbox
                  checked={isSelected}
                  aria-label={`Select OAuth connection ${index + 1}`}
                />
              </td>
              <td className='bg-background sticky left-10 z-10 w-36 p-2 align-middle'>
                <StartOAuthButton
                  disabled={!itemId}
                  isStarting={isStarting}
                  onClick={() => onStart(item)}
                />
              </td>
              {columns.map((column) => (
                <EntityTableCell
                  key={column.ColumnName}
                  item={item}
                  column={column}
                />
              ))}
              <td className='w-10 p-2 align-middle'>
                <Button
                  variant='ghost'
                  size='icon'
                  className='text-destructive hover:text-destructive h-8 w-8'
                  onClick={() => onDelete(item)}
                  aria-label={`Delete OAuth connection ${index + 1}`}
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </td>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

function StartOAuthButton({
  disabled,
  isStarting,
  onClick,
}: {
  disabled: boolean
  isStarting: boolean
  onClick: () => void
}) {
  return (
    <Button
      variant='outline'
      size='sm'
      className='h-8 gap-1 whitespace-nowrap'
      disabled={disabled || isStarting}
      onClick={onClick}
    >
      {isStarting ? (
        <Loader2 className='h-4 w-4 animate-spin' />
      ) : (
        <ExternalLink className='h-4 w-4' />
      )}
      Start OAuth
    </Button>
  )
}

function OAuthFieldPreview({
  column,
  item,
}: {
  column: ColumnDefinition
  item: OAuthConnectRecord
}) {
  const label = column.Name || column.ColumnName.replace(/_/g, ' ')

  return (
    <div className='min-w-0'>
      <div className='text-muted-foreground truncate text-xs font-medium'>
        {label}
      </div>
      <div className='mt-1 min-w-0 text-sm'>
        <ColumnViewer
          column={column}
          value={item[column.ColumnName]}
          entity={item}
        />
      </div>
    </div>
  )
}

export const Route = createLazyFileRoute('/_authenticated/communication/oauth')(
  {
    component: OAuthPage,
  }
)
