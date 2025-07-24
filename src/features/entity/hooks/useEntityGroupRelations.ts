import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { daptinClient } from '@/daptin.ts'
import {
  addPermission,
  hasPermission,
  removePermission,
} from '@/features/entity/columns/PermissionTypes.ts'
// We use patterns from RelationsApiService but with specialized implementation for usergroup relations
// import { RelationsApiService } from '@/features/entity/services/RelationsApiService.ts'

/**
 * Hook for managing the groups that a specific entity belongs to
 * and their associated permissions
 */
export function useEntityGroupRelations(entityName: string, entityId: string) {
  const [isUpdating, setIsUpdating] = useState(false)

  // Fetch all available groups
  const { data: allGroups } = useQuery({
    queryKey: ['usergroups'],
    queryFn: async () => {
      const response = await daptinClient.jsonApi.findAll('usergroup')
      return response.data || []
    },
  })

  // Fetch all groups that this entity belongs to
  const {
    data: entityGroups,
    isLoading: isLoadingGroups,
    refetch: refetchEntityGroups,
    error: entityGroupsError,
  } = useQuery({
    queryKey: ['entity-groups', entityName, entityId],
    queryFn: async () => {
      if (!entityName || !entityId) {
        console.log('useEntityGroupRelations: Missing entityName or entityId', {
          entityName,
          entityId,
        })
        return []
      }

      try {
        // Use the RelationsApiService to fetch related records
        // Since we don't have a specific relation object for usergroups,
        // we'll use the direct API approach
        const response = await daptinClient.jsonApi
          .one(entityName, entityId)
          .all('usergroup_id')
          .get()

        return response.data || []
      } catch (error) {
        console.error(
          `Failed to load groups for ${entityName}:${entityId}:`,
          error
        )
        return []
      }
    },
    enabled: !!entityName && !!entityId,
  })

  /**
   * Add entity to a group
   * Uses the relationships API pattern from RelationsApiService
   */
  const addEntityToGroup = async (groupId: string) => {
    if (!entityName || !entityId || !groupId) return false

    setIsUpdating(true)

    try {
      // Use the relationships API to create a relation between usergroup and entity
      // This follows the pattern used in RelationsApiService.createRelation for many-to-many relations
      await daptinClient.jsonApi
        .one('usergroup', groupId)
        .relationships(`${entityName}_id`)
        .patch([
          {
            type: entityName,
            id: entityId,
          },
        ])

      // Refresh entity groups
      await refetchEntityGroups()
      setIsUpdating(false)
      return true
    } catch (error) {
      console.error('Failed to add entity to group:', error)
      setIsUpdating(false)
      return false
    }
  }

  /**
   * Remove entity from a group
   * Uses the relationships API pattern from RelationsApiService
   */
  const removeEntityFromGroup = async (groupId: any) => {
    if (!entityName || !entityId || !groupId) return false

    setIsUpdating(true)

    try {
      console.log("RemoveEntityFromGroup", entityName, entityId, groupId)
      // Use the relationships API to delete the relation
      // This follows the pattern used in RelationsApiService.deleteRelation for many-to-many relations
      await daptinClient.jsonApi
        .one('usergroup', groupId)
        .relationships(`${entityName}_id`)
        .destroy([{
            type: entityName,
            id: entityId,
          },
        ])

      // Refresh entity groups
      await refetchEntityGroups()
      setIsUpdating(false)
      return true
    } catch (error) {
      console.error('Failed to remove entity from group:', error)
      setIsUpdating(false)
      return false
    }
  }

  /**
   * Toggle permission for entity-group relation
   * Updates the permission value on the relation record
   */
  const toggleGroupPermission = async (
    relationReferenceId: any,
    permissionBit: number,
    currentPermission: number
  ) => {
    if (!entityName || !entityId || !relationReferenceId) return false

    setIsUpdating(true)

    // Calculate new permission value
    const newPermission = hasPermission(currentPermission, permissionBit)
      ? removePermission(currentPermission, permissionBit)
      : addPermission(currentPermission, permissionBit)

    try {
      // Get the relation ID and table name
      const relationId = relationReferenceId
      const relationTableName = `${entityName}_${entityName}_id_has_usergroup_usergroup_id`
      await daptinClient.worldManager.loadModel(relationTableName, false)

      // Update the relation record using the correct jsonApi update method
      await daptinClient.jsonApi.update(relationTableName, {
        id: relationId,
        permission: newPermission,
      })

      // Refresh entity groups
      await refetchEntityGroups()
      setIsUpdating(false)
      return true
    } catch (error) {
      console.error('Failed to update permission:', error)
      setIsUpdating(false)
      return false
    }
  }

  /**
   * Get groups that the entity is not a member of yet
   */
  const getAvailableGroups = () => {
    if (!allGroups || !entityGroups) return []

    // Get the IDs of groups the entity is already a member of
    const memberGroupIds = entityGroups.map(
      (relation: any) => relation.usergroup_id
    )

    // Filter out groups the entity is already a member of
    return allGroups.filter(
      (group: any) => !memberGroupIds.includes(group.reference_id)
    )
  }

  console.log('useEntityGroupRelations: Hook state', {
    entityName,
    entityId,
    entityGroups,
    allGroups: allGroups?.length,
    entityGroupsError,
    isLoadingGroups,
  })

  /**
   * Get a specific group relation by ID
   */
  const getGroupRelation = (relationId: string) => {
    if (!entityGroups) return null
    return entityGroups.find((relation: any) => relation.id === relationId)
  }

  return {
    allGroups,
    entityGroups,
    isLoadingGroups,
    isUpdating,
    entityGroupsError,
    addEntityToGroup,
    removeEntityFromGroup,
    toggleGroupPermission,
    getAvailableGroups,
    getGroupRelation,
    refetchEntityGroups,
  }
}
