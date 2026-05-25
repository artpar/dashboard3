/* eslint-disable no-console */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { DaptinObjectUsergroupAccess } from 'daptin-client'
import {
  addPermission,
  hasPermission,
  removePermission,
} from '@/features/entity/columns/PermissionTypes.ts'
import { RelationsApiService } from '@/features/entity/services/RelationsApiService'

type PaginationLinks = {
  current_page?: number
  from?: number
  last_page?: number
  per_page?: number
  to?: number
  total?: number
}

function readPaginationLinks(value: unknown): PaginationLinks {
  if (!value || typeof value !== 'object') return {}
  return value as PaginationLinks
}

export function useEntityGroupRelations(entityName: string, entityId: string) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [groupSearchQuery, setGroupSearchQuery] = useState('')
  const [allGroupsPage, setAllGroupsPage] = useState(1)
  const [allGroupsPageSize, setAllGroupsPageSize] = useState(20)
  const [groupsPage, setGroupsPage] = useState(1)
  const [groupsPageSize, setGroupsPageSize] = useState(10)

  const { data: allGroupsResponse, isLoading: isLoadingAllGroups } = useQuery({
    queryKey: [
      'usergroups',
      groupSearchQuery,
      allGroupsPage,
      allGroupsPageSize,
    ],
    queryFn: async () => {
      return RelationsApiService.fetchUsergroups({
        search: groupSearchQuery,
        page: allGroupsPage,
        pageSize: allGroupsPageSize,
        sort: 'name',
      })
    },
  })

  const allGroups = allGroupsResponse?.data || []
  const allGroupsPagination = readPaginationLinks(allGroupsResponse?.links)

  const {
    data: entityGroupsResponse,
    isLoading: isLoadingGroups,
    refetch: refetchEntityGroups,
    error: entityGroupsError,
  } = useQuery({
    queryKey: [
      'entity-groups',
      entityName,
      entityId,
      groupsPage,
      groupsPageSize,
    ],
    queryFn: async () => {
      if (!entityName || !entityId) {
        console.warn('[entity.access.groups] related-groups:fetch:skip', {
          entityName,
          entityId,
        })
        return null
      }

      return RelationsApiService.fetchObjectUsergroups({
        entityName,
        entityId,
        page: groupsPage,
        pageSize: groupsPageSize,
        sort: 'name',
      })
    },
    enabled: Boolean(entityName && entityId),
  })

  const entityGroups = entityGroupsResponse?.data || []
  const entityGroupsPagination = readPaginationLinks(
    entityGroupsResponse?.links
  )

  const addEntityToGroup = async (groupId: string) => {
    if (!entityName || !entityId || !groupId) return false

    setIsUpdating(true)

    try {
      await RelationsApiService.addObjectUsergroup(
        entityName,
        entityId,
        groupId
      )
      await refetchEntityGroups()
      return true
    } catch (error) {
      console.error('[entity.access.groups] add:handled-error', { error })
      return false
    } finally {
      setIsUpdating(false)
    }
  }

  const removeEntityFromGroup = async (groupId: string) => {
    if (!entityName || !entityId || !groupId) return false

    setIsUpdating(true)

    try {
      await RelationsApiService.removeObjectUsergroup(
        entityName,
        entityId,
        groupId
      )
      await refetchEntityGroups()
      return true
    } catch (error) {
      console.error('[entity.access.groups] remove:handled-error', { error })
      return false
    } finally {
      setIsUpdating(false)
    }
  }

  const toggleGroupPermission = async (
    relationReferenceId: string,
    permissionBit: number,
    currentPermission: number
  ) => {
    if (!entityName || !relationReferenceId) return false

    setIsUpdating(true)
    const newPermission = hasPermission(currentPermission, permissionBit)
      ? removePermission(currentPermission, permissionBit)
      : addPermission(currentPermission, permissionBit)

    try {
      await RelationsApiService.updateObjectUsergroupRelationPermission(
        entityName,
        relationReferenceId,
        newPermission
      )
      await refetchEntityGroups()
      return true
    } catch (error) {
      console.error('[entity.access.groups] permission:update:handled-error', {
        currentPermission,
        newPermission,
        error,
      })
      return false
    } finally {
      setIsUpdating(false)
    }
  }

  const isGroupAlreadyRelated = (groupReferenceId: string) =>
    entityGroups.some(
      (relation) => relation.groupReferenceId === groupReferenceId
    )

  const getGroupRelation = (relationId: string) => {
    return entityGroups.find(
      (relation: DaptinObjectUsergroupAccess) =>
        relation.relationReferenceId === relationId ||
        relation.groupReferenceId === relationId
    )
  }

  return {
    allGroups,
    allGroupsPagination,
    allGroupsPage,
    allGroupsPageSize,
    entityGroups,
    entityGroupsPagination,
    groupsPage,
    groupsPageSize,
    isLoadingGroups,
    isLoadingAllGroups,
    isUpdating,
    entityGroupsError,
    groupSearchQuery,
    setGroupSearchQuery,
    setAllGroupsPage,
    setAllGroupsPageSize,
    setGroupsPage,
    setGroupsPageSize,
    addEntityToGroup,
    removeEntityFromGroup,
    toggleGroupPermission,
    isGroupAlreadyRelated,
    getGroupRelation,
    refetchEntityGroups,
  }
}
