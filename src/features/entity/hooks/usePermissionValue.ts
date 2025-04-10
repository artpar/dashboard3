// hooks/usePermissionValue.ts
// hooks/useGroupData.ts
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { daptinClient } from '@/daptin';
import {
  addPermission,
  getPermissionFlag,
  hasPermission,
  PermissionAction,
  PermissionScope,
  removePermission,
} from '@/features/entity/columns/PermissionTypes.ts'


export function usePermissionValue(initialValue: any, onChange: (value: number) => void) {
  // Parse initial permission value
  const parsePermissionValue = (input: any): number => {
    if (typeof input === 'number') return input
    if (typeof input === 'string') {
      const parsed = parseInt(input, 10)
      return isNaN(parsed) ? 0 : parsed
    }
    return 0
  }

  const [permissionValue, setPermissionValue] = useState<number>(parsePermissionValue(initialValue))

  // Update internal state when props change
  useEffect(() => {
    setPermissionValue(parsePermissionValue(initialValue))
  }, [initialValue])

  // Toggle a specific permission
  const togglePermission = (scope: PermissionScope, action: PermissionAction) => {
    console.log("togglePermission", scope, action)
    const flag = getPermissionFlag(scope, action)
    const newValue = hasPermission(permissionValue, flag) ? removePermission(permissionValue, flag) : addPermission(permissionValue, flag)

    setPermissionValue(newValue)
    onChange(newValue)
  }

  // Toggle all permissions for a scope
  const toggleAllForScope = (scope: PermissionScope, enabled: boolean) => {
    let newValue = permissionValue

    Object.values(PermissionAction).forEach((action) => {
      const flag = getPermissionFlag(scope, action)
      newValue = enabled ? addPermission(newValue, flag) : removePermission(newValue, flag)
    })

    setPermissionValue(newValue)
    onChange(newValue)
  }

  // Handle preset selection
  const handlePresetChange = (presetValue: string) => {
    const newValue = parseInt(presetValue, 10)
    setPermissionValue(newValue)
    onChange(newValue)
  }

  return {
    permissionValue, togglePermission, toggleAllForScope, handlePresetChange,
  }
}

export interface EntityOption {
  label: string;
  value: string;
}

export function useGroupData() {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [entityFilter, setEntityFilter] = useState('')
  const [objectTypeToAdd, setObjectTypeToAdd] = useState<string | null>(null)
  const [selectedEntities, setSelectedEntities] = useState<EntityOption[]>([])
  const [showAddObjectDialog, setShowAddObjectDialog] = useState(false)

  // Fetch groups
  const { data: groups } = useQuery({
    queryKey: ['usergroups'], queryFn: async () => {
      const response = await daptinClient.jsonApi.findAll('usergroup')
      return response.data || []
    },
  })

  // Fetch tables/entities
  const { data: tables } = useQuery({
    queryKey: ['tables'], queryFn: async () => {
      const response = await daptinClient.jsonApi.findAll('world')
      return (response.data || []).filter((table: any) => !table.table_name.startsWith('tab_'))
    },
  })

  // Fetch objects in the selected group
  const { data: groupObjects, refetch: refetchGroupObjects } = useQuery({
    queryKey: ['group-objects', selectedGroup], queryFn: async () => {
      if (!selectedGroup) return {}

      const result: Record<string, any[]> = {}

      if (tables && tables.length > 0) {
        for (const table of tables) {
          try {
            const relationName = `${table.table_name}_id`
            const response = await daptinClient.jsonApi.findAll(`usergroup_${relationName}`, {
              'filter[usergroup_id]': selectedGroup
            })

            if (response.data && response.data.length > 0) {
              // Add __type field to each object for reference
              const objectsWithType = response.data.map((obj: any) => ({
                ...obj, __type: table.table_name, __label: obj.name || obj.label || obj.title || obj.reference_id,
              }))

              result[relationName] = objectsWithType
            } else {
              result[relationName] = []
            }
          } catch (error) {
            console.error(`Failed to load relation for ${table.table_name}:`, error)
            result[`${table.table_name}_id`] = []
          }
        }
      }

      return result
    }, enabled: !!selectedGroup && !!tables && tables.length > 0,
  })

  // Fetch entity options for the add dialog
  const { data: entityOptions, refetch: refetchEntityOptions } = useQuery({
    queryKey: ['entity-options', objectTypeToAdd, entityFilter], queryFn: async () => {
      if (!objectTypeToAdd) return []

      const response = await daptinClient.jsonApi.findAll(objectTypeToAdd, {
        filter: entityFilter, 'page[size]': 50,
      })

      return (response.data || []).map((entity: any) => ({
        label: entity.name || entity.label || entity.title || entity.reference_id, value: entity.reference_id,
      }))
    }, enabled: !!objectTypeToAdd,
  })

  // Add entity to group
  const addEntityToGroup = async () => {
    if (!selectedGroup || !objectTypeToAdd || !selectedEntities.length) return

    try {
      for (const entity of selectedEntities) {
        await daptinClient.jsonApi.addRelation({
          tableName: 'usergroup', id: selectedGroup, relationName: `${objectTypeToAdd}_id`, relationId: entity.value,
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

  // Toggle object permission (for group permissions)
  const toggleObjectPermission = (object: any, permissionBit: number) => {
    const newPermission = hasPermission(object.permission, permissionBit) ? removePermission(object.permission, permissionBit) : addPermission(object.permission, permissionBit)

    // Update the object's permission
    if (object.__type && object.reference_id) {
      const relationTableName = `${object.__type}_${object.__type}_id_has_usergroup_usergroup_id`

      daptinClient.jsonApi
        .update({
          tableName: relationTableName, id: object.reference_id, data: {
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

  // Filter tables based on search input
  const filteredTables = tables ? tables.filter((table) => !entityFilter || table.table_name.toLowerCase().includes(entityFilter.toLowerCase())) : []

  return {
    selectedGroup,
    setSelectedGroup,
    entityFilter,
    setEntityFilter,
    objectTypeToAdd,
    setObjectTypeToAdd,
    selectedEntities,
    setSelectedEntities,
    showAddObjectDialog,
    setShowAddObjectDialog,
    groups,
    tables,
    filteredTables,
    groupObjects,
    entityOptions,
    refetchEntityOptions,
    addEntityToGroup,
    removeEntityFromGroup,
    toggleObjectPermission,
    refetchGroupObjects,
  }
}
