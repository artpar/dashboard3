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
import { Shield, Search } from 'lucide-react'

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

  const getPermissionSummary = (value: number): string => {
    if (value === 0) return 'No access'
    if (value === 2097279) return 'Full public'
    if (value === 2097152) return 'User only'
    if (value === 2097154) return 'Public read'
    return value.toString()
  }

  return (
    <div className="p-6">
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
              <TableHead>Permission</TableHead>
              <TableHead>Summary</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                </TableRow>
              ))
            ) : filteredEntities?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No entities found
                </TableCell>
              </TableRow>
            ) : (
              filteredEntities?.map((entity) => (
                <TableRow key={entity.reference_id}>
                  <TableCell className="font-medium">{entity.table_name}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {entity.default_permission || entity.permission || 0}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {getPermissionSummary(entity.default_permission || entity.permission || 0)}
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
              ))
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
