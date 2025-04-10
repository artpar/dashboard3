import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { daptinClient } from '@/daptin';
import { HelpCircle, Info, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { addPermission, findPermissionPresetName, getPermissionFlag, hasPermission, PERMISSION_COLORS, PERMISSION_EXPLANATIONS, PERMISSION_PRESET_OPTIONS, PermissionAction, PermissionFlag, PermissionScope, removePermission } from './../PermissionTypes';


interface PermissionColumnEditorProps {
  value: number
  onChange: (value: number) => void
  onBlur?: () => void
  className?: string
  error?: string
  disabled?: boolean
  entityType?: string
  entityId?: string
}

interface EntityOption {
  label: string
  value: string
}

/**
 * Component for editing permission values with human-readable labels and group-specific permissions
 */
export default function PermissionColumnEditor({
  value,
  onChange,
  onBlur,
  className,
  error,
  disabled,
  entityType,
  entityId,
}: PermissionColumnEditorProps) {
  // Parse initial permission value
  const parsePermissionValue = (input: any): number => {
    if (typeof input === 'number') return input
    if (typeof input === 'string') {
      const parsed = parseInt(input, 10)
      return isNaN(parsed) ? 0 : parsed
    }
    return 0
  }

  const [permissionValue, setPermissionValue] = useState<number>(
    parsePermissionValue(value)
  )
  const [activeTab, setActiveTab] = useState<PermissionScope>(
    PermissionScope.Guest
  )
  const [displayMode, setDisplayMode] = useState<'visual' | 'text' | 'groups'>(
    'visual'
  )

  // Group management state
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [showAddObjectDialog, setShowAddObjectDialog] = useState(false)
  const [objectTypeToAdd, setObjectTypeToAdd] = useState<string | null>(null)
  const [entityFilter, setEntityFilter] = useState('')
  const [selectedEntities, setSelectedEntities] = useState<EntityOption[]>([])

  // Update internal state when props change
  useEffect(() => {
    setPermissionValue(parsePermissionValue(value))
  }, [value])

  // Toggle a specific permission
  const togglePermission = (
    scope: PermissionScope,
    action: PermissionAction
  ) => {
    const flag = getPermissionFlag(scope, action)
    const newValue = hasPermission(permissionValue, flag)
      ? removePermission(permissionValue, flag)
      : addPermission(permissionValue, flag)

    setPermissionValue(newValue)
    onChange(newValue)
  }

  // Handle preset selection
  const handlePresetChange = (presetValue: string) => {
    const newValue = parseInt(presetValue, 10)
    setPermissionValue(newValue)
    onChange(newValue)
  }

  // Toggle all permissions for a scope
  const toggleAllForScope = (scope: PermissionScope, enabled: boolean) => {
    let newValue = permissionValue

    Object.values(PermissionAction).forEach((action) => {
      const flag = getPermissionFlag(scope, action)
      newValue = enabled
        ? addPermission(newValue, flag)
        : removePermission(newValue, flag)
    })

    setPermissionValue(newValue)
    onChange(newValue)
  }

  // Toggle object permission (for group permissions)
  const toggleObjectPermission = (object: any, permissionBit: number) => {
    const newPermission = hasPermission(object.permission, permissionBit)
      ? removePermission(object.permission, permissionBit)
      : addPermission(object.permission, permissionBit)

    // Update the object's permission
    if (object.__type && object.reference_id) {
      const relationTableName = `${object.__type}_${object.__type}_id_has_usergroup_usergroup_id`

      daptinClient.jsonApi
        .update({
          tableName: relationTableName,
          id: object.reference_id,
          data: {
            permission: newPermission,
          },
        })
        .then(() => {
          // Refresh the group objects data
          refetchGroupObjects()
        })
        .catch((error) => {
          console.error('Failed to update permission:', error)
        })
    }
  }

  // Get preset name
  const presetName = findPermissionPresetName(permissionValue)

  // Fetch groups
  const { data: groups } = useQuery({
    queryKey: ['usergroups'],
    queryFn: async () => {
      const response = await daptinClient.jsonApi.findAll("usergroup");
      console.log("Fetched usergroup", response)
      return response.data || []
    },
  })

  // Fetch tables/entities
  const { data: tables } = useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      const response = await daptinClient.jsonApi.findAll("world")
      return (response.data || []).filter(
        (table: any) => !table.table_name.startsWith('tab_')
      )
    },
  })

  // Fetch objects in the selected group
  const { data: groupObjects, refetch: refetchGroupObjects } = useQuery({
    queryKey: ['group-objects', selectedGroup],
    queryFn: async () => {
      if (!selectedGroup) return {}

      const result: Record<string, any[]> = {}

      if (tables && tables.length > 0) {
        for (const table of tables) {
          try {
            const relationName = `${table.table_name}_id`
            const response = await daptinClient.jsonApi.getRelation({
              tableName: 'usergroup',
              id: selectedGroup,
              relationName: relationName,
            })

            if (response.data && response.data.length > 0) {
              // Add __type field to each object for reference
              const objectsWithType = response.data.map((obj: any) => ({
                ...obj,
                __type: table.table_name,
                __label: obj.name || obj.label || obj.title || obj.reference_id,
              }))

              result[relationName] = objectsWithType
            } else {
              result[relationName] = []
            }
          } catch (error) {
            console.error(
              `Failed to load relation for ${table.table_name}:`,
              error
            )
            result[`${table.table_name}_id`] = []
          }
        }
      }

      return result
    },
    enabled: !!selectedGroup && !!tables && tables.length > 0,
  })

  // Fetch entity options for the add dialog
  const { data: entityOptions, refetch: refetchEntityOptions } = useQuery({
    queryKey: ['entity-options', objectTypeToAdd, entityFilter],
    queryFn: async () => {
      if (!objectTypeToAdd) return []

      const response = await daptinClient.jsonApi.findAll(objectTypeToAdd, {
          filter: entityFilter,
          "page[size]": 50,
      })

      return (response.data || []).map((entity: any) => ({
        label:
          entity.name || entity.label || entity.title || entity.reference_id,
        value: entity.reference_id,
      }))
    },
    enabled: !!objectTypeToAdd,
  })

  // Add entity to group
  const addEntityToGroup = async () => {
    if (!selectedGroup || !objectTypeToAdd || !selectedEntities.length) return

    try {
      for (const entity of selectedEntities) {
        await daptinClient.jsonApi.addRelation({
          tableName: 'usergroup',
          id: selectedGroup,
          relationName: `${objectTypeToAdd}_id`,
          relationId: entity.value,
        })
      }

      // Refresh group objects
      refetchGroupObjects()
      setShowAddObjectDialog(false)
      setSelectedEntities([])
    } catch (error) {
      console.error('Failed to add entity to group:', error)
    }
  }

  // Remove entity from group
  const removeEntityFromGroup = async (tableName: string, object: any) => {
    if (!selectedGroup) return

    try {
      await daptinClient.jsonApi.removeRelation({
        tableName: 'usergroup',
        id: selectedGroup,
        relationName: `${tableName}_id`,
        relationId: object.relation_reference_id,
      })

      // Refresh group objects
      refetchGroupObjects()
    } catch (error) {
      console.error('Failed to remove entity from group:', error)
    }
  }

  // Filter tables based on search input
  const filteredTables = tables
    ? tables.filter(
        (table) =>
          !entityFilter ||
          table.table_name.toLowerCase().includes(entityFilter.toLowerCase())
      )
    : []

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Preset selector and view toggle */}
      <div className='flex items-center space-x-2'>
        <Select
          value={permissionValue.toString()}
          onValueChange={handlePresetChange}
          disabled={disabled}
        >
          <SelectTrigger
            className={`w-full ${error ? 'border-red-500' : ''} ${disabled ? 'opacity-50' : ''}`}
          >
            <SelectValue placeholder='Select permission preset' />
          </SelectTrigger>
          <SelectContent>
            {PERMISSION_PRESET_OPTIONS.map((preset) => (
              <SelectItem key={preset.value} value={preset.value.toString()}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className='flex overflow-hidden rounded-md border'>
          <Button
            type='button'
            variant={displayMode === 'visual' ? 'default' : 'outline'}
            className='rounded-none px-3'
            onClick={() => setDisplayMode('visual')}
            disabled={disabled}
          >
            Visual
          </Button>
          <Button
            type='button'
            variant={displayMode === 'text' ? 'default' : 'outline'}
            className='rounded-none px-3'
            onClick={() => setDisplayMode('text')}
            disabled={disabled}
          >
            Text
          </Button>
          <Button
            type='button'
            variant={displayMode === 'groups' ? 'default' : 'outline'}
            className='rounded-none px-3'
            onClick={() => setDisplayMode('groups')}
            disabled={disabled}
          >
            Groups
          </Button>
        </div>
      </div>

      {/* Visual editor */}
      {displayMode === 'visual' && (
        <div className='rounded-md border p-4'>
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              console.log("setActiveTab", v)
              setActiveTab(v as PermissionScope);
            }}
          >
            <TabsList className='mb-4 grid grid-cols-3'>
              {Object.values(PermissionScope).map((scope) => {
                const colors = PERMISSION_COLORS[scope]
                return (
                  <TabsTrigger
                    key={scope}
                    value={scope}
                    className={`data-[state=active]:${colors.selected} data-[state=active]:${colors.text}`}
                  >
                    {scope}
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {Object.values(PermissionScope).map((scope) => {
              const colors = PERMISSION_COLORS[scope]

              return (
                <TabsContent key={scope} value={scope} className='space-y-4'>
                  <div className='mb-2 flex items-center justify-between'>
                    <h3 className={`text-sm font-medium ${colors.text}`}>
                      {scope} Permissions
                    </h3>

                    <div className='flex items-center space-x-2'>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => toggleAllForScope(scope, true)}
                        disabled={disabled}
                        className={`h-8 text-xs ${colors.border}`}
                      >
                        Select All
                      </Button>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => toggleAllForScope(scope, false)}
                        disabled={disabled}
                        className='h-8 text-xs'
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>

                  <div className='grid grid-cols-1 gap-2'>
                    {Object.values(PermissionAction).map((action) => {
                      const flag = getPermissionFlag(scope, action)
                      const isChecked = hasPermission(permissionValue, flag)
                      const permissionKey = `${scope}${action}`
                      const explanation =
                        PERMISSION_EXPLANATIONS[permissionKey] ||
                        `Allows ${scope.toLowerCase()}s to ${action.toLowerCase()} this resource`

                      return (
                        <div
                          key={action}
                          className={`flex items-center space-x-2 rounded-md p-2 ${isChecked ? colors.selected : 'bg-background'} transition-colors`}
                        >
                          <Checkbox
                            id={`${scope}-${action}`}
                            checked={isChecked}
                            onCheckedChange={() =>
                              togglePermission(scope, action)
                            }
                            disabled={disabled}
                            className={isChecked ? colors.border : ''}
                          />

                          <label
                            htmlFor={`${scope}-${action}`}
                            className='flex-1 cursor-pointer text-sm font-medium'
                          >
                            {action}
                          </label>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className='text-muted-foreground h-4 w-4' />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{explanation}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )
                    })}
                  </div>
                </TabsContent>
              )
            })}
          </Tabs>
        </div>
      )}

      {/* Text mode */}
      {displayMode === 'text' && (
        <div className='rounded-md border p-4'>
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <div>
                <h3 className='text-sm font-medium'>Permission Value</h3>
                <p className='text-muted-foreground text-xs'>
                  The current permission setting is:{' '}
                  <span className='font-mono'>{permissionValue}</span>
                </p>
              </div>
              <div>
                {presetName !== 'Custom' && (
                  <span className='rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800'>
                    {presetName}
                  </span>
                )}
              </div>
            </div>

            {Object.values(PermissionScope).map((scope) => {
              const colors = PERMISSION_COLORS[scope]
              const actionBits = Object.values(PermissionAction).map(
                (action) => {
                  const flag = getPermissionFlag(scope, action)
                  const isGranted = hasPermission(permissionValue, flag)

                  return { action, isGranted }
                }
              )

              const grantedActions = actionBits.filter((a) => a.isGranted)
              const hasPermissions = grantedActions.length > 0

              return (
                <div
                  key={scope}
                  className={`rounded-md p-3 ${hasPermissions ? colors.bg : 'bg-gray-50'}`}
                >
                  <h4 className={`mb-2 text-sm font-medium ${colors.text}`}>
                    {scope}
                  </h4>

                  {!hasPermissions && (
                    <p className='text-sm text-gray-500 italic'>
                      No permissions granted
                    </p>
                  )}

                  {hasPermissions && (
                    <div className='flex flex-wrap gap-1'>
                      {grantedActions.map(({ action }) => (
                        <span
                          key={`${scope}-${action}`}
                          className={`rounded-full px-2 py-1 text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border}`}
                        >
                          {action}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            <TooltipProvider>
              <div className='text-muted-foreground mt-4 flex items-center text-xs'>
                <span>
                  Permission value is stored as a bitmask in the database
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className='ml-1 h-3 w-3' />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Each permission is represented by a bit in the permission
                      value.
                    </p>
                    <p>
                      This makes it efficient to store and check multiple
                      permissions.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
        </div>
      )}

      {/* Group permissions mode */}
      {displayMode === 'groups' && (
        <div className='rounded-md border p-4'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            {/* Group selection */}
            <div className='space-y-4'>
              <h3 className='text-sm font-medium'>Select User Group</h3>
              <Select
                value={selectedGroup || ''}
                onValueChange={setSelectedGroup}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select a user group' />
                </SelectTrigger>
                <SelectContent>
                  {groups &&
                    groups.map((group: any) => (
                      <SelectItem
                        key={group.reference_id}
                        value={group.reference_id}
                      >
                        {group.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Group details */}
            {selectedGroup && (
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <h3 className='text-sm font-medium'>
                    {groups?.find((g: any) => g.reference_id === selectedGroup)
                      ?.name || 'Group'}
                  </h3>
                </div>
                <Input
                  placeholder='Filter entities...'
                  value={entityFilter}
                  onChange={(e) => setEntityFilter(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Entity permissions */}
          {selectedGroup && (
            <div className='mt-4'>
              <ScrollArea className='h-[60vh]'>
                <div className='space-y-4 p-1'>
                  {filteredTables &&
                    filteredTables.map((table: any) => {
                      const relationName = `${table.table_name}_id`
                      const objectsInGroup = groupObjects?.[relationName] || []

                      return (
                        <Card key={table.table_name}>
                          <CardHeader className='pb-2'>
                            <div className='flex items-center justify-between'>
                              <CardTitle className='text-sm'>
                                {table.table_name}
                                <Badge variant='outline' className='ml-2'>
                                  {objectsInGroup.length}
                                </Badge>
                              </CardTitle>
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() => {
                                  setObjectTypeToAdd(table.table_name)
                                  setShowAddObjectDialog(true)
                                  setSelectedEntities([])
                                }}
                              >
                                <Plus className='mr-1 h-4 w-4' />
                                Add
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {objectsInGroup.length === 0 ? (
                              <p className='text-muted-foreground text-sm italic'>
                                No items
                              </p>
                            ) : (
                              <Table className='sticky-header-table'>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Read</TableHead>
                                    <TableHead>Create</TableHead>
                                    <TableHead>Update</TableHead>
                                    <TableHead>Delete</TableHead>
                                    <TableHead>Execute</TableHead>
                                    <TableHead></TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {objectsInGroup.map((object: any) => (
                                    <TableRow key={object.reference_id}>
                                      <TableCell className='font-medium'>
                                        {object.__label}
                                      </TableCell>
                                      <TableCell>
                                        <Checkbox
                                          checked={
                                            (object.permission &
                                              PermissionFlag.GroupRead) ===
                                            PermissionFlag.GroupRead
                                          }
                                          onCheckedChange={() =>
                                            toggleObjectPermission(
                                              object,
                                              PermissionFlag.GroupRead
                                            )
                                          }
                                          size='sm'
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Checkbox
                                          checked={
                                            (object.permission &
                                              PermissionFlag.GroupCreate) ===
                                            PermissionFlag.GroupCreate
                                          }
                                          onCheckedChange={() =>
                                            toggleObjectPermission(
                                              object,
                                              PermissionFlag.GroupCreate
                                            )
                                          }
                                          size='sm'
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Checkbox
                                          checked={
                                            (object.permission &
                                              PermissionFlag.GroupUpdate) ===
                                            PermissionFlag.GroupUpdate
                                          }
                                          onCheckedChange={() =>
                                            toggleObjectPermission(
                                              object,
                                              PermissionFlag.GroupUpdate
                                            )
                                          }
                                          size='sm'
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Checkbox
                                          checked={
                                            (object.permission &
                                              PermissionFlag.GroupDelete) ===
                                            PermissionFlag.GroupDelete
                                          }
                                          onCheckedChange={() =>
                                            toggleObjectPermission(
                                              object,
                                              PermissionFlag.GroupDelete
                                            )
                                          }
                                          size='sm'
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Checkbox
                                          checked={
                                            (object.permission &
                                              PermissionFlag.GroupExecute) ===
                                            PermissionFlag.GroupExecute
                                          }
                                          onCheckedChange={() =>
                                            toggleObjectPermission(
                                              object,
                                              PermissionFlag.GroupExecute
                                            )
                                          }
                                          size='sm'
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Button
                                          variant='ghost'
                                          size='sm'
                                          onClick={() =>
                                            removeEntityFromGroup(
                                              table.table_name,
                                              object
                                            )
                                          }
                                        >
                                          <Trash2 className='h-4 w-4' />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      )}

      {/* Add object dialog */}
      <Dialog open={showAddObjectDialog} onOpenChange={setShowAddObjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {objectTypeToAdd}</DialogTitle>
            <DialogDescription>
              Select entities to add to the group
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <Input
              placeholder='Search...'
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value)
                refetchEntityOptions()
              }}
            />

            <Select
              value={selectedEntities.length > 0 ? 'selected' : ''}
              onValueChange={() => {}}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={`${selectedEntities.length} entities selected`}
                />
              </SelectTrigger>
              <SelectContent>
                {entityOptions &&
                  entityOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => {
                        if (
                          !selectedEntities.some(
                            (e) => e.value === option.value
                          )
                        ) {
                          setSelectedEntities([...selectedEntities, option])
                        }
                      }}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {selectedEntities.length > 0 && (
              <div className='mt-2 flex flex-wrap gap-1'>
                {selectedEntities.map((entity) => (
                  <Badge
                    key={entity.value}
                    variant='secondary'
                    className='flex items-center gap-1'
                  >
                    {entity.label}
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-4 w-4 p-0'
                      onClick={() =>
                        setSelectedEntities(
                          selectedEntities.filter(
                            (e) => e.value !== entity.value
                          )
                        )
                      }
                    >
                      <span className='sr-only'>Remove</span>
                      <HelpCircle className='h-3 w-3' />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowAddObjectDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={addEntityToGroup}
              disabled={selectedEntities.length === 0}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {error && <p className='text-sm text-red-500'>{error}</p>}
    </div>
  )
}
