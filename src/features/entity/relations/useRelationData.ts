// src/features/entity/components/relations/useRelationData.ts
import { useState, useCallback, useEffect } from 'react'
import { daptinClient } from '@/daptin.ts'
import {
  Relation,
  RelatedRecord,
  getRelatedEntityName,
  getRelationQueryParams
} from './relations-utils.ts'

interface RelationDataState {
  data: RelatedRecord[] | null
  isLoading: boolean
  isError: boolean
  error: Error | null
  fetchData: () => Promise<void>
  refetch: () => Promise<void>
}

/**
 * Hook to fetch and manage relation data
 */
export function useRelationData(
  relation: Relation,
  entityName: string,
  entityId?: string,
  shouldFetch: boolean = false
): RelationDataState {
  const [data, setData] = useState<RelatedRecord[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const relatedEntityName = getRelatedEntityName(relation, entityName)

  // Function to fetch the related data
  const fetchData = useCallback(async () => {
    if (!entityId) {
      setData([])
      return
    }

    try {
      setIsLoading(true)
      setIsError(false)
      setError(null)

      // Get query parameters based on relation direction
      const queryParams = getRelationQueryParams(relation, entityName, entityId)

      // Add pagination and sorting
      const enhancedParams = {
        ...queryParams,
        'page[size]': '20', // Limit initially to 20 records
        'page[number]': '1',
        sort: '-created_at', // Default sort by newest first
      }

      // Fetch the data
      const response = await daptinClient.jsonApi.findAll(
        relatedEntityName,
        enhancedParams
      );
      console.log("fetchData", response)

      if (response.errors && response.errors.length) {
        throw new Error(
          response.errors[0].detail ||
          `Failed to fetch related ${relatedEntityName}`
        )
      }

      let data1 = response.data || [];
      if (!(data1 instanceof Array)) {
        data1 = [data1]
      }
      setData(data1)
    } catch (err) {
      console.error(
        `Error fetching related ${relatedEntityName}:`,
        err
      )
      setIsError(true)
      setError(err instanceof Error ? err : new Error(String(err)))
      setData([])
    } finally {
      setIsLoading(false)
    }
  }, [entityId, entityName, relation, relatedEntityName])

  // Fetch data on mount if shouldFetch is true
  useEffect(() => {
    if (shouldFetch && !data && !isLoading) {
      fetchData()
    }
  }, [shouldFetch, data, isLoading, fetchData])

  return {
    data,
    isLoading,
    isError,
    error,
    fetchData,
    refetch: fetchData, // Alias for fetchData for clarity in components
  }
}
