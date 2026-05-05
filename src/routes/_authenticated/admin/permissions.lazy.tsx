import { createLazyFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { daptinClient } from '@/daptin'
import { useToast } from '@/components/ui/use-toast'
import { PermissionEditor } from '@/components/shared/PermissionEditor'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Shield, Search, Eye, Pencil, Trash2, Zap, Users, Globe, User } from 'lucide-react'

interface WorldEntity {
  reference_id: string
  table_name: string
  permission: number
  default_permission: number
}

function PermissionsPage() {
  const [search, setSearch] = useState('')
  const [selectedEntity, setSelectedEntity] = useState<WorldEntity | null>(null)
  const [editedPermission, setEditedPermission] = useState(0)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: entities, isLoading } = useQuery({
    queryKey: ['world-entities-permissions'],
    queryFn: async () => {
      const response = await daptinClient.jsonApi.findAll('world', {
        'page[size]': '200',
      })
      return (response.data || []) as WorldEntity[]
    },
  })

  const filteredEntities = entities?.filter((e) =>
    e.table_name.toLowerCase().includes(search.toLowerCase())
  )

  const handleEditClick = (entity: WorldEntity) => {
    setSelectedEntity(entity)
    setEditedPermission(entity.default_permission || entity.permission || 0)
  }

  const updateMutation = useMutation({
    mutationFn: async ({ id, permission }: { id: string; permission: number }) => {
      return daptinClient.jsonApi.update('world', {
        id,
        default_permission: permission,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['world-entities-permissions'] })
      toast({ title: 'Permission updated', description: `Updated permissions for ${selectedEntity?.table_name}` })
      setSelectedEntity(null)
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Failed to update', description: error.message })
    },
  })

  const handleSave = () => {
    if (!selectedEntity) return
    updateMutation.mutate({ id: selectedEntity.reference_id, permission: editedPermission })
  }

  // Decode permission bits for a specific level
  const getLevelPermissions = (value: number, offset: number): string[] => {
    const perms: string[] = []
    if (value & (1 << (offset + 0))) perms.push('Peek')
    if (value & (1 << (offset + 1))) perms.push('Read')
    if (value & (1 << (offset + 2))) perms.push('Create')
    if (value & (1 << (offset + 3))) perms.push('Update')
    if (value & (1 << (offset + 4))) perms.push('Delete')
    if (value & (1 << (offset + 5))) perms.push('Execute')
    if (value & (1 << (offset + 6))) perms.push('Refer')
    return perms
  }

  // Summarize permissions for a level
  const getLevelSummary = (perms: string[]): string => {
    if (perms.length === 0) return 'None'
    if (perms.length === 7) return 'Full'
    if (perms.includes('Read') && perms.includes('Create') && perms.includes('Update') && perms.includes('Delete')) return 'CRUD'
    if (perms.length === 1 && perms[0] === 'Read') return 'Read'
    if (perms.includes('Read') && perms.includes('Peek') && perms.length === 2) return 'Read'
    return perms.slice(0, 2).join(', ') + (perms.length > 2 ? '...' : '')
  }

  // Get parsed permission info
  const getPermissionInfo = (value: number) => {
    const guest = getLevelPermissions(value, 0)
    const user = getLevelPermissions(value, 7)
    const group = getLevelPermissions(value, 14)
    return { guest, user, group }
  }

  return (
    <div className="">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Permissions
        </h1>
        <p className="text-muted-foreground">
          Manage entity-level permissions
        </p>
      </div>

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search entities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entity</TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  <span>Guest</span>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>User</span>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>Group</span>
                </div>
              </TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                </TableRow>
              ))
            ) : filteredEntities?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No entities found
                </TableCell>
              </TableRow>
            ) : (
              filteredEntities?.map((entity) => {
                const permValue = entity.default_permission || entity.permission || 0
                const info = getPermissionInfo(permValue)
                const guestSummary = getLevelSummary(info.guest)
                const userSummary = getLevelSummary(info.user)
                const groupSummary = getLevelSummary(info.group)

                const getBadgeVariant = (summary: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
                  if (summary === 'Full') return 'default'
                  if (summary === 'CRUD') return 'default'
                  if (summary === 'None') return 'outline'
                  return 'secondary'
                }

                return (
                  <TableRow key={entity.reference_id}>
                    <TableCell className="font-medium">{entity.table_name}</TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(guestSummary)} className="text-xs">
                        {guestSummary}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(userSummary)} className="text-xs">
                        {userSummary}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(groupSummary)} className="text-xs">
                        {groupSummary}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
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

      <Dialog open={!!selectedEntity} onOpenChange={() => setSelectedEntity(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Edit Permissions: {selectedEntity?.table_name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <PermissionEditor
              value={editedPermission}
              onChange={setEditedPermission}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedEntity(null)} disabled={updateMutation.isPending}>
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
