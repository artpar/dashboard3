/* eslint-disable no-console */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createLazyFileRoute } from '@tanstack/react-router'
import { daptinClient } from '@/daptin'
import type { DaptinWorldEntity } from 'daptin-client'
import { Search, Shield, Users, User, Globe } from 'lucide-react'
import {
  daptinVisibleWorldEntityQuery,
  isVisibleDaptinWorldEntity,
} from '@/lib/daptin/world-entities'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import {
  PermissionAction,
  PermissionScope,
  getPermissionFlag,
  hasPermission,
} from '@/features/entity/columns/PermissionTypes'
import PermissionColumnEditor from '@/features/entity/columns/editors/PermissionColumnEditor'
import EntityPagination from '@/features/entity/components/pagination/EntityPagination'

const TABLE_PERMISSION_LOG_PREFIX = '[admin.permissions]'

type WorldEntity = DaptinWorldEntity

type PaginationLinks = {
  current_page?: number
  from?: number
  last_page?: number
  per_page?: number
  to?: number
  total?: number
}

function getLevelPermissions(value: number, scope: PermissionScope): string[] {
  return Object.values(PermissionAction).filter((action) =>
    hasPermission(value, getPermissionFlag(scope, action))
  )
}

function getLevelSummary(perms: string[]): string {
  if (perms.length === 0) return 'None'
  if (perms.length === 7) return 'Full'
  if (
    perms.includes('Read') &&
    perms.includes('Create') &&
    perms.includes('Update') &&
    perms.includes('Delete')
  ) {
    return 'CRUD'
  }
  if (perms.length === 1 && perms[0] === 'Read') return 'Read'
  if (perms.includes('Read') && perms.includes('Peek') && perms.length === 2) {
    return 'Read'
  }
  return perms.slice(0, 2).join(', ') + (perms.length > 2 ? '...' : '')
}

function getBadgeVariant(
  summary: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (summary === 'Full' || summary === 'CRUD') return 'default'
  if (summary === 'None') return 'outline'
  return 'secondary'
}

function readLinks(value: unknown): PaginationLinks {
  if (!value || typeof value !== 'object') return {}
  return value as PaginationLinks
}

function PermissionsPage() {
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [selectedEntity, setSelectedEntity] = useState<WorldEntity | null>(null)
  const [editedPermission, setEditedPermission] = useState(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearchQuery(value)
      setPage(1)
    }, 300)
  }, [])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const { data: worldResponse, isLoading } = useQuery({
    queryKey: ['world-entities-permissions', page, pageSize, searchQuery],
    queryFn: async () => {
      const params: Record<string, unknown> = {
        'page[size]': pageSize,
        'page[number]': page,
        sort: 'table_name',
        query: JSON.stringify(daptinVisibleWorldEntityQuery(searchQuery)),
      }

      console.info(`${TABLE_PERMISSION_LOG_PREFIX} fetch:start`, { params })
      const response = await daptinClient.jsonApi.findAll('world', params)
      console.info(`${TABLE_PERMISSION_LOG_PREFIX} fetch:success`, {
        count: Array.isArray(response.data) ? response.data.length : 0,
        links: response.links,
      })
      return response
    },
  })

  const entities = ((worldResponse?.data || []) as WorldEntity[]).filter(
    isVisibleDaptinWorldEntity
  )
  const links = readLinks(worldResponse?.links)

  const handleEditClick = (entity: WorldEntity) => {
    setSelectedEntity(entity)
    setEditedPermission(entity.permission || 0)
  }

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      permission,
    }: {
      id: string
      permission: number
    }) => {
      console.info(`${TABLE_PERMISSION_LOG_PREFIX} update:start`, {
        id,
        permission,
      })
      return daptinClient.jsonApi.update('world', {
        id,
        permission,
      })
    },
    onSuccess: () => {
      console.info(`${TABLE_PERMISSION_LOG_PREFIX} update:success`, {
        tableName: selectedEntity?.table_name,
      })
      queryClient.invalidateQueries({
        queryKey: ['world-entities-permissions'],
      })
      toast({
        title: 'Permission updated',
        description: `Updated table access for ${selectedEntity?.table_name}`,
      })
      setSelectedEntity(null)
    },
    onError: (error) => {
      console.error(`${TABLE_PERMISSION_LOG_PREFIX} update:error`, { error })
      toast({
        variant: 'destructive',
        title: 'Failed to update',
        description: error instanceof Error ? error.message : String(error),
      })
    },
  })

  const handleSave = () => {
    if (!selectedEntity?.reference_id) return
    updateMutation.mutate({
      id: selectedEntity.reference_id,
      permission: editedPermission,
    })
  }

  return (
    <div className='flex h-full flex-col'>
      <div className='mb-6'>
        <h1 className='flex items-center gap-2 text-2xl font-bold'>
          <Shield className='h-6 w-6' />
          Permissions
        </h1>
        <p className='text-muted-foreground'>
          Manage Daptin table access permissions from the `world` entity.
        </p>
      </div>

      <div className='mb-4'>
        <div className='relative max-w-sm'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
          <Input
            placeholder='Search entities...'
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className='pl-9'
          />
        </div>
      </div>

      <div className='overflow-hidden rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entity</TableHead>
              <TableHead>
                <div className='flex items-center gap-1'>
                  <Globe className='h-3 w-3' />
                  <span>Guest</span>
                </div>
              </TableHead>
              <TableHead>
                <div className='flex items-center gap-1'>
                  <User className='h-3 w-3' />
                  <span>User</span>
                </div>
              </TableHead>
              <TableHead>
                <div className='flex items-center gap-1'>
                  <Users className='h-3 w-3' />
                  <span>Group</span>
                </div>
              </TableHead>
              <TableHead className='w-24'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className='h-4 w-32' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-5 w-16' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-5 w-16' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-5 w-16' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-8 w-16' />
                  </TableCell>
                </TableRow>
              ))
            ) : entities.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className='text-muted-foreground py-8 text-center'
                >
                  No entities returned
                </TableCell>
              </TableRow>
            ) : (
              entities.map((entity) => {
                const permValue = entity.permission || 0
                const guestSummary = getLevelSummary(
                  getLevelPermissions(permValue, PermissionScope.Guest)
                )
                const userSummary = getLevelSummary(
                  getLevelPermissions(permValue, PermissionScope.User)
                )
                const groupSummary = getLevelSummary(
                  getLevelPermissions(permValue, PermissionScope.Group)
                )

                return (
                  <TableRow key={entity.reference_id}>
                    <TableCell className='font-medium'>
                      {entity.table_name || entity.reference_id}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getBadgeVariant(guestSummary)}
                        className='text-xs'
                      >
                        {guestSummary}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getBadgeVariant(userSummary)}
                        className='text-xs'
                      >
                        {userSummary}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getBadgeVariant(groupSummary)}
                        className='text-xs'
                      >
                        {groupSummary}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleEditClick(entity)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className='mt-4'>
        <EntityPagination
          currentPage={page}
          totalPages={links.last_page || 1}
          pageSize={pageSize}
          totalItems={links.total || entities.length}
          isLoading={isLoading}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size)
            setPage(1)
          }}
        />
      </div>

      <Dialog
        open={!!selectedEntity}
        onOpenChange={() => setSelectedEntity(null)}
      >
        <DialogContent className='max-w-3xl'>
          <DialogHeader>
            <DialogTitle>
              Edit Table Permission: {selectedEntity?.table_name}
            </DialogTitle>
          </DialogHeader>
          <div className='py-4'>
            <PermissionColumnEditor
              value={editedPermission}
              onChange={setEditedPermission}
              entityType='world'
              entityId={selectedEntity?.reference_id}
            />
          </div>
          <div className='flex justify-end gap-2'>
            <Button
              variant='outline'
              onClick={() => setSelectedEntity(null)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export const Route = createLazyFileRoute('/_authenticated/admin/permissions')({
  component: PermissionsPage,
})
