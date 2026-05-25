import { createLazyFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Label } from '@/components/ui/label'
import { Settings, Search, Edit2, Plus, Trash2, Save, X, ChevronDown, Eye, EyeOff, Key } from 'lucide-react'
import { configApi } from '@/lib/configApi'
import {
  CONFIG_CATEGORIES,
  getConfigValueType,
  getConfigDescription,
  groupConfigsByCategory,
  type ConfigValueType,
} from '@/lib/configCategories'
import { Main } from '@/components/layout/main'

interface ConfigItem {
  key: string
  value: string
}

function ConfigPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [editEntry, setEditEntry] = useState<ConfigItem | null>(null)
  const [editValue, setEditValue] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newEntry, setNewEntry] = useState({ key: '', value: '' })
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(CONFIG_CATEGORIES.map(c => c.id))
  )

  // Fetch all configs using the /_config API
  const { data: configs, isLoading, error } = useQuery({
    queryKey: ['system-config'],
    queryFn: async () => {
      const result = await configApi.getAll()
      return result
    },
  })

  // Group configs by category
  const groupedConfigs = configs ? groupConfigsByCategory(configs) : new Map()

  // Filter configs based on search
  const filterConfigs = (items: ConfigItem[]) => {
    if (!search.trim()) return items
    const searchLower = search.toLowerCase()
    return items.filter(
      c => c.key.toLowerCase().includes(searchLower) || c.value.toLowerCase().includes(searchLower)
    )
  }

  // Update config mutation
  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      await configApi.set(key, value)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config'] })
      toast({ title: 'Config updated', description: `Updated ${editEntry?.key}` })
      setEditEntry(null)
      setShowSecret(false)
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Update failed', description: error.message })
    },
  })

  // Create config mutation
  const createMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      await configApi.create(key, value)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config'] })
      toast({ title: 'Config created', description: `Added ${newEntry.key}` })
      setIsAddDialogOpen(false)
      setNewEntry({ key: '', value: '' })
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Create failed', description: error.message })
    },
  })

  // Delete config mutation
  const deleteMutation = useMutation({
    mutationFn: async (key: string) => {
      await configApi.delete(key)
    },
    onSuccess: (_, key) => {
      queryClient.invalidateQueries({ queryKey: ['system-config'] })
      toast({ title: 'Config deleted', description: `Deleted ${key}` })
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Delete failed', description: error.message })
    },
  })

  // Toggle mutation for boolean values
  const toggleMutation = useMutation({
    mutationFn: async ({ key, currentValue }: { key: string; currentValue: string }) => {
      const newValue = currentValue === 'true' ? 'false' : 'true'
      await configApi.set(key, newValue)
    },
    onSuccess: (_, { key }) => {
      queryClient.invalidateQueries({ queryKey: ['system-config'] })
      toast({ title: 'Config toggled', description: `Updated ${key}` })
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Toggle failed', description: error.message })
    },
  })

  const handleEdit = (item: ConfigItem) => {
    setEditEntry(item)
    setEditValue(item.value || '')
    setShowSecret(false)
  }

  const handleSave = () => {
    if (!editEntry) return
    updateMutation.mutate({ key: editEntry.key, value: editValue })
  }

  const handleCreate = () => {
    if (!newEntry.key.trim()) {
      toast({ variant: 'destructive', title: 'Key required', description: 'Please enter a config key' })
      return
    }
    createMutation.mutate(newEntry)
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  const renderValueEditor = (item: ConfigItem, valueType: ConfigValueType) => {
    const isBoolean = valueType === 'boolean'
    const isSecret = valueType === 'secret'

    if (isBoolean) {
      const isEnabled = item.value === 'true'
      return (
        <div className="flex items-center gap-2">
          <Switch
            checked={isEnabled}
            onCheckedChange={() => toggleMutation.mutate({ key: item.key, currentValue: item.value })}
            disabled={toggleMutation.isPending}
          />
          <span className={isEnabled ? 'text-green-600' : 'text-muted-foreground'}>
            {isEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      )
    }

    if (isSecret) {
      return (
        <div className="flex items-center gap-2 font-mono text-sm text-muted-foreground">
          <Key className="h-4 w-4" />
          <span>{'*'.repeat(Math.min(item.value?.length || 8, 16))}</span>
        </div>
      )
    }

    // Default: show truncated value
    const displayValue = item.value?.length > 60 ? item.value.substring(0, 60) + '...' : item.value
    return <span className="font-mono text-sm">{displayValue || <em className="text-muted-foreground">empty</em>}</span>
  }

  const getValueTypeBadge = (valueType: ConfigValueType) => {
    const colors: Record<ConfigValueType, string> = {
      boolean: 'bg-blue-100 text-blue-800',
      number: 'bg-purple-100 text-purple-800',
      secret: 'bg-red-100 text-red-800',
      json: 'bg-orange-100 text-orange-800',
      string: 'bg-gray-100 text-gray-800',
    }
    return (
      <Badge variant="outline" className={`text-xs ${colors[valueType]}`}>
        {valueType}
      </Badge>
    )
  }

  if (error) {
    return (
      <Main className="flex h-full flex-col overflow-hidden p-0">
        <div className="border-b px-6 py-5">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Settings className="h-6 w-6" />
            System Configuration
          </h1>
          <p className="text-muted-foreground mt-1 max-w-3xl text-sm leading-6">
            Manage system settings and configuration values
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-6 text-center text-destructive">
          <p>Failed to load configuration: {(error as Error).message}</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['system-config'] })} className="mt-4">
            Retry
          </Button>
        </div>
      </Main>
    )
  }

  return (
    <Main className="flex h-full w-full flex-col overflow-hidden p-0">
      <div className="border-b px-6 py-5">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Settings className="h-6 w-6" />
          System Configuration
        </h1>
        <p className="text-muted-foreground mt-1 max-w-3xl text-sm leading-6">
          Manage system settings and configuration values
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Configuration Values</CardTitle>
              <CardDescription>
                Server configuration organized by category
              </CardDescription>
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

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Render each category */}
              {CONFIG_CATEGORIES.map((category) => {
                const categoryConfigs = filterConfigs(groupedConfigs.get(category.id) || [])
                if (categoryConfigs.length === 0 && search.trim()) return null

                const CategoryIcon = category.icon

                return (
                  <Collapsible
                    key={category.id}
                    open={expandedCategories.has(category.id)}
                    onOpenChange={() => toggleCategory(category.id)}
                  >
                    <div className="border rounded-lg">
                      <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <CategoryIcon className="h-5 w-5 text-muted-foreground" />
                          <div className="text-left">
                            <h3 className="font-medium">{category.label}</h3>
                            <p className="text-sm text-muted-foreground">{category.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{categoryConfigs.length}</Badge>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${
                              expandedCategories.has(category.id) ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="border-t">
                          {categoryConfigs.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground text-sm">
                              No configurations in this category
                            </div>
                          ) : (
                            <div className="divide-y">
                              {categoryConfigs.map((item) => {
                                const valueType = getConfigValueType(item.key)
                                const description = getConfigDescription(item.key)

                                return (
                                  <div
                                    key={item.key}
                                    className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <code className="text-sm font-semibold">{item.key}</code>
                                        {getValueTypeBadge(valueType)}
                                      </div>
                                      {description && (
                                        <p className="text-xs text-muted-foreground mb-2">{description}</p>
                                      )}
                                      <div>{renderValueEditor(item, valueType)}</div>
                                    </div>
                                    <div className="flex gap-1 ml-4">
                                      <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                        <Edit2 className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => deleteMutation.mutate(item.key)}
                                        disabled={deleteMutation.isPending}
                                      >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                )
              })}

              {/* Other configs (not in any category) */}
              {(() => {
                const otherConfigs = filterConfigs(groupedConfigs.get('other') || [])
                if (otherConfigs.length === 0) return null

                return (
                  <Collapsible
                    open={expandedCategories.has('other')}
                    onOpenChange={() => toggleCategory('other')}
                  >
                    <div className="border rounded-lg">
                      <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <Settings className="h-5 w-5 text-muted-foreground" />
                          <div className="text-left">
                            <h3 className="font-medium">Other</h3>
                            <p className="text-sm text-muted-foreground">Additional configuration values</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{otherConfigs.length}</Badge>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${
                              expandedCategories.has('other') ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="border-t divide-y">
                          {otherConfigs.map((item) => {
                            const valueType = getConfigValueType(item.key)
                            const description = getConfigDescription(item.key)

                            return (
                              <div
                                key={item.key}
                                className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <code className="text-sm font-semibold">{item.key}</code>
                                    {getValueTypeBadge(valueType)}
                                  </div>
                                  {description && (
                                    <p className="text-xs text-muted-foreground mb-2">{description}</p>
                                  )}
                                  <div>{renderValueEditor(item, valueType)}</div>
                                </div>
                                <div className="flex gap-1 ml-4">
                                  <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteMutation.mutate(item.key)}
                                    disabled={deleteMutation.isPending}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                )
              })()}
            </div>
          )}

          {configs && (
            <p className="text-sm text-muted-foreground mt-4">
              {Object.keys(configs).length} total configuration values
            </p>
          )}
        </CardContent>
      </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editEntry} onOpenChange={() => { setEditEntry(null); setShowSecret(false) }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-mono">{editEntry?.key}</DialogTitle>
          </DialogHeader>
          {editEntry && (
            <div className="py-4">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm text-muted-foreground">Value</Label>
                <div className="flex items-center gap-2">
                  {getValueTypeBadge(getConfigValueType(editEntry.key))}
                  {getConfigValueType(editEntry.key) === 'secret' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {showSecret ? 'Hide' : 'Show'}
                    </Button>
                  )}
                </div>
              </div>
              {getConfigDescription(editEntry.key) && (
                <p className="text-xs text-muted-foreground mb-3">
                  {getConfigDescription(editEntry.key)}
                </p>
              )}
              {getConfigValueType(editEntry.key) === 'json' ||
               editValue?.startsWith('{') ||
               editValue?.startsWith('[') ? (
                <Textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="font-mono text-sm min-h-[200px]"
                  placeholder="Enter JSON value..."
                />
              ) : getConfigValueType(editEntry.key) === 'boolean' ? (
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <Switch
                    checked={editValue === 'true'}
                    onCheckedChange={(checked) => setEditValue(checked ? 'true' : 'false')}
                  />
                  <span>{editValue === 'true' ? 'Enabled' : 'Disabled'}</span>
                </div>
              ) : getConfigValueType(editEntry.key) === 'number' ? (
                <Input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="font-mono"
                />
              ) : (
                <Input
                  type={getConfigValueType(editEntry.key) === 'secret' && !showSecret ? 'password' : 'text'}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="font-mono"
                  placeholder="Enter value..."
                />
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditEntry(null); setShowSecret(false) }} disabled={updateMutation.isPending}>
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
              <Label>Key</Label>
              <Input
                value={newEntry.key}
                onChange={(e) => setNewEntry(prev => ({ ...prev, key: e.target.value }))}
                placeholder="config.key.name"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Use dot notation (e.g., feature.setting)
              </p>
            </div>
            <div className="space-y-2">
              <Label>Value</Label>
              <Textarea
                value={newEntry.value}
                onChange={(e) => setNewEntry(prev => ({ ...prev, value: e.target.value }))}
                placeholder="Value..."
                className="font-mono text-sm"
              />
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
    </Main>
  )
}

export const Route = createLazyFileRoute('/_authenticated/config')({
  component: ConfigPage,
})
