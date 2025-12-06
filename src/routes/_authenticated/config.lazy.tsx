import { createLazyFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { daptinClient } from '@/daptin'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
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
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Settings, Search, Edit2, Plus, Trash2, Save, X } from 'lucide-react'

interface ConfigEntry {
  reference_id: string
  name: string
  value: string
  configtype: string
}

function ConfigPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [editEntry, setEditEntry] = useState<ConfigEntry | null>(null)
  const [editValue, setEditValue] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newEntry, setNewEntry] = useState({ name: '', value: '', configtype: 'string' })

  const { data: configs, isLoading } = useQuery({
    queryKey: ['system-config'],
    queryFn: async () => {
      const response = await daptinClient.jsonApi.findAll('config', {
        'page[size]': '200',
      })
      return (response.data || []) as ConfigEntry[]
    },
  })

  const filteredConfigs = configs?.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.value?.toLowerCase().includes(search.toLowerCase())
  )

  const updateMutation = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: string }) => {
      return daptinClient.jsonApi.update('config', {
        id,
        value,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config'] })
      toast({ title: 'Config updated', description: `Updated ${editEntry?.name}` })
      setEditEntry(null)
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Update failed', description: error.message })
    },
  })

  const createMutation = useMutation({
    mutationFn: async (entry: { name: string; value: string; configtype: string }) => {
      return daptinClient.jsonApi.create('config', entry)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config'] })
      toast({ title: 'Config created', description: `Added ${newEntry.name}` })
      setIsAddDialogOpen(false)
      setNewEntry({ name: '', value: '', configtype: 'string' })
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Create failed', description: error.message })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return daptinClient.jsonApi.destroy('config', id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config'] })
      toast({ title: 'Config deleted' })
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Delete failed', description: error.message })
    },
  })

  const handleEdit = (entry: ConfigEntry) => {
    setEditEntry(entry)
    setEditValue(entry.value || '')
  }

  const handleSave = () => {
    if (!editEntry) return
    updateMutation.mutate({ id: editEntry.reference_id, value: editValue })
  }

  const handleCreate = () => {
    if (!newEntry.name.trim()) {
      toast({ variant: 'destructive', title: 'Name required', description: 'Please enter a config name' })
      return
    }
    createMutation.mutate(newEntry)
  }

  const getValuePreview = (value: string) => {
    if (!value) return <span className="text-muted-foreground italic">empty</span>
    if (value.length > 100) {
      return value.substring(0, 100) + '...'
    }
    // Try to detect JSON
    if (value.startsWith('{') || value.startsWith('[')) {
      try {
        JSON.parse(value)
        return <code className="text-xs bg-muted px-1 py-0.5 rounded">{value.substring(0, 50)}...</code>
      } catch {
        return value
      }
    }
    return value
  }

  const getConfigTypeBadge = (type: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      string: 'secondary',
      json: 'default',
      number: 'outline',
      boolean: 'outline',
    }
    return <Badge variant={variants[type] || 'secondary'}>{type || 'string'}</Badge>
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          System Configuration
        </h1>
        <p className="text-muted-foreground">
          Manage system settings and configuration values
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Configuration Values</CardTitle>
              <CardDescription>Key-value pairs for system configuration</CardDescription>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Config
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search configs..."
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
                  <TableHead className="w-1/4">Name</TableHead>
                  <TableHead className="w-16">Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredConfigs?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      {search ? 'No matching configs found' : 'No configuration entries'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredConfigs?.map((config) => (
                    <TableRow key={config.reference_id}>
                      <TableCell className="font-mono text-sm font-medium">
                        {config.name}
                      </TableCell>
                      <TableCell>
                        {getConfigTypeBadge(config.configtype)}
                      </TableCell>
                      <TableCell className="font-mono text-sm max-w-md truncate">
                        {getValuePreview(config.value)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(config)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(config.reference_id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {configs && configs.length > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              {filteredConfigs?.length} of {configs.length} configs
            </p>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editEntry} onOpenChange={() => setEditEntry(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-mono">{editEntry?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-sm text-muted-foreground mb-2 block">Value</Label>
            {editEntry?.configtype === 'json' ||
             editValue?.startsWith('{') ||
             editValue?.startsWith('[') ? (
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="font-mono text-sm min-h-[200px]"
                placeholder="Enter JSON value..."
              />
            ) : (
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="font-mono"
                placeholder="Enter value..."
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEntry(null)} disabled={updateMutation.isPending}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              <Save className="h-4 w-4 mr-1" />
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Configuration</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={newEntry.name}
                onChange={(e) => setNewEntry(prev => ({ ...prev, name: e.target.value }))}
                placeholder="config.key.name"
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <select
                value={newEntry.configtype}
                onChange={(e) => setNewEntry(prev => ({ ...prev, configtype: e.target.value }))}
                className="w-full h-10 px-3 border rounded-md bg-background"
              >
                <option value="string">string</option>
                <option value="json">json</option>
                <option value="number">number</option>
                <option value="boolean">boolean</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Value</Label>
              {newEntry.configtype === 'json' ? (
                <Textarea
                  value={newEntry.value}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, value: e.target.value }))}
                  placeholder='{"key": "value"}'
                  className="font-mono text-sm min-h-[100px]"
                />
              ) : (
                <Input
                  value={newEntry.value}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="Value..."
                  className="font-mono"
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={createMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              <Plus className="h-4 w-4 mr-1" />
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export const Route = createLazyFileRoute('/_authenticated/config')({
  component: ConfigPage,
})
