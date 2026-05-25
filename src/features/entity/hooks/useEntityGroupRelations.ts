/* eslint-disable no-console */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { daptinClient } from '@/daptin.ts'
import type { DaptinObjectUsergroupAccess } from 'daptin-client'
import {
  addPermission,
  hasPermission,
  removePermission,
} from '@/features/entity/columns/PermissionTypes.ts'

const ACCESS_LOG_PREFIX = '[entity.access.groups]'

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
      const params: Record<string, unknown> = {
        'page[size]': allGroupsPageSize,
        'page[number]': allGroupsPage,
        sort: 'name',
      }

      if (groupSearchQuery.trim()) {
        params.query = JSON.stringify([
          {
            column: 'name',
            operator: 'contains',
            value: `%${groupSearchQuery.trim()}%`,
          },
        ])
      }

      console.info(`${ACCESS_LOG_PREFIX} all-groups:fetch:start`, {
        groupSearchQuery,
        params,
      })
      const response = await daptinClient.jsonApi.findAll('usergroup', params)
      console.info(`${ACCESS_LOG_PREFIX} all-groups:fetch:success`, {
        count: Array.isArray(response.data) ? response.data.length : 0,
        links: response.links,
      })
      return response
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
        console.warn(`${ACCESS_LOG_PREFIX} related-groups:fetch:skip`, {
          entityName,
          entityId,
        })
        return null
      }

      const params = {
        'page[size]': groupsPageSize,
        'page[number]': groupsPage,
        sort: 'name',
      }

      console.info(`${ACCESS_LOG_PREFIX} related-groups:fetch:start`, {
        entityName,
        entityId,
        params,
      })

      const response = await daptinClient.accessManager.listObjectUsergroups<{
        name?: string
      }>(entityName, entityId, params)

      console.info(`${ACCESS_LOG_PREFIX} related-groups:fetch:success`, {
        entityName,
        entityId,
        count: response.data.length,
        links: response.links,
      })

      return response
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
    console.info(`${ACCESS_LOG_PREFIX} add:start`, {
      entityName,
      entityId,
      groupId,
    })

    try {
      await daptinClient.accessManager.addObjectUsergroup(
        entityName,
        entityId,
        groupId
      )
      await refetchEntityGroups()
      console.info(`${ACCESS_LOG_PREFIX} add:success`, {
        entityName,
        entityId,
        groupId,
      })
      return true
    } catch (error) {
      console.error(`${ACCESS_LOG_PREFIX} add:error`, {
        entityName,
        entityId,
        groupId,
        error,
      })
      return false
    } finally {
      setIsUpdating(false)
    }
  }

  const removeEntityFromGroup = async (groupId: string) => {
    if (!entityName || !entityId || !groupId) return false

    setIsUpdating(true)
    console.info(`${ACCESS_LOG_PREFIX} remove:start`, {
      entityName,
      entityId,
      groupId,
    })

    try {
      await daptinClient.accessManager.removeObjectUsergroup(
        entityName,
        entityId,
        groupId
      )
      await refetchEntityGroups()
      console.info(`${ACCESS_LOG_PREFIX} remove:success`, {
        entityName,
        entityId,
        groupId,
      })
      return true
    } catch (error) {
      console.error(`${ACCESS_LOG_PREFIX} remove:error`, {
        entityName,
        entityId,
        groupId,
        error,
      })
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

    console.info(`${ACCESS_LOG_PREFIX} permission:update:start`, {
      entityName,
      relationReferenceId,
      currentPermission,
      newPermission,
    })

    try {
      await daptinClient.accessManager.updateObjectUsergroupRelationPermission(
        entityName,
        relationReferenceId,
        newPermission
      )
      await refetchEntityGroups()
      console.info(`${ACCESS_LOG_PREFIX} permission:update:success`, {
        entityName,
        relationReferenceId,
        newPermission,
      })
      return true
    } catch (error) {
      console.error(`${ACCESS_LOG_PREFIX} permission:update:error`, {
        entityName,
        relationReferenceId,
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
