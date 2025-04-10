import { useCallback, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Relation } from '../relations/relations-utils'
import { RelationsApiService } from '@/features/entity/services/RelationsApiService.ts'

interface UseRelationRecordsOptions {
  page?: number
  pageSize?: number
  sort?: string
  enabled?: boolean
}

/**
 * Hook to fetch and manage related records for a specific relation
 */
export const useRelationRecords = (
  relation: Relation | null,
  entityName: string,
  entityId?: string,
  options: UseRelationRecordsOptions = {}
) => {
  const {
    page = 1,
    pageSize = 20,
    sort = '-created_at',
    enabled = true,
  } = options

  const [totalPages, setTotalPages] = useState(1)

  // Fetch related records
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: [
      `entity-${entityName}-${entityId}-relation`,
      relation,
      page,
      pageSize,
      sort,
    ],
    queryFn: async () => {
      if (!relation || !entityId) return { data: [], totalCount: 0 }

      return RelationsApiService.fetchRelatedRecords(
        relation,
        entityName,
        entityId,
        { page, pageSize, sort }
      )
    },
    enabled: !!relation && !!entityName && !!entityId && enabled,
    keepPreviousData: true,
    staleTime: 30000,
  })

  // Calculate total pages when data changes
  useEffect(() => {
    if (data) {
      setTotalPages(Math.ceil(data.totalCount / pageSize))
    }
  }, [data, pageSize])

  // Function to handle pagination
  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage > 0 && newPage <= totalPages) {
        return refetch()
      }
    },
    [refetch, totalPages]
  )

  return {
    records: data?.data || [],
    totalCount: data?.totalCount || 0,
    totalPages,
    isLoading,
    isRefetching,
    error,
    refetch,
    handlePageChange,
  }
}
