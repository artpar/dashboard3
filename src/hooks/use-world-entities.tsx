import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { daptinClient } from '@/daptin'
import { TableRelation } from '@/features/entity/EntityRelations'
// Import icon packs as needed
import { ColumnDefinition } from '@/features/entity/columns'

export interface WorldEntity {
  id: string
  reference_id: string
  table_name: string
  world_schema_json: string
  is_hidden: boolean
  is_top_level: boolean
  icon?: string
}

export type AuthPermission = number

/**
 * Represents a tag applied to a column for validation or conformation
 */
export interface ColumnTag {
  /** The name of the column this tag applies to */
  ColumnName: string
  /** Tag string containing validation or conformation rules */
  Tags: string
}

export interface TableInfo {
  /** Name of the table */
  TableName: string
  /** Table ID */
  TableId?: number
  /** Default permission for the table */
  DefaultPermission: AuthPermission
  /** Columns in the table */
  Columns: ColumnDefinition[]
  /** Relations this table has with others */
  Relations: TableRelation[]
  /** Whether this is a top level entity */
  IsTopLevel: boolean
  /** Permission value for the current user */
  Permission: AuthPermission
  /** User ID of the owner */
  UserId?: number
  /** Whether the table is hidden in APIs */
  IsHidden: boolean
  /** Whether this is a join table */
  IsJoinTable: boolean
  /** Whether state tracking is enabled */
  IsStateTrackingEnabled: boolean
  /** Whether audit tracking is enabled */
  IsAuditEnabled: boolean
  /** Whether translations are enabled */
  TranslationsEnabled: boolean
  /** Default user groups for this table */
  DefaultGroups: string[]
  /** Default relations for this table */
  DefaultRelations: Record<string, string[]>
  /** Column validations */
  Validations: ColumnTag[]
  /** Column conformations */
  Conformations: ColumnTag[]
  /** Default sort order */
  DefaultOrder?: string
  /** Icon for UI representation */
  Icon?: string
  /** Composite keys */
  CompositeKeys: string[][]
}

export function useWorldEntities() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['world-entities'],
    queryFn: async () => {
      try {
        const response = await daptinClient.jsonApi.findAll('world', {
          'page[size]': '500',
          sort: 'table_name',
          query: JSON.stringify([
            {
              column: 'is_hidden',
              operator: 'eq',
              value: false,
            },
          ]),
        })

        if (response.errors && response.errors.length) {
          throw new Error(
            response.errors[0].detail || 'Failed to fetch world entities'
          )
        }

        return response.data.map((entity: any) => ({
          ...entity,
          icon: entity.icon,
        }))
      } catch (err) {
        console.error('Error fetching world entities:', err)
        throw err
      }
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  })

  // Group entities by category (top-level vs others)
  const groupedEntities = useMemo(() => {
    if (!data) return { topLevel: [], others: [] }

    return {
      topLevel: data.filter((entity: WorldEntity) => entity.is_top_level),
      others: data.filter((entity: WorldEntity) => !entity.is_top_level),
    }
  }, [data])

  return {
    entities: data || [],
    groupedEntities,
    isLoading,
    error,
    refetch,
  }
}
