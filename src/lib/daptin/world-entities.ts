import type { DaptinWorldEntity } from 'daptin-client'

function isTruthyDaptinFlag(value: unknown): boolean {
  return value === true || value === 1 || value === '1'
}

export function isDaptinJoinWorldEntity(
  entity: Pick<DaptinWorldEntity, 'is_join_table' | 'table_name'>
): boolean {
  return (
    isTruthyDaptinFlag(entity.is_join_table) ||
    Boolean(entity.table_name?.includes('_has_'))
  )
}

export function isVisibleDaptinWorldEntity(
  entity: Pick<DaptinWorldEntity, 'is_hidden' | 'is_join_table' | 'table_name'>
): boolean {
  return (
    !isTruthyDaptinFlag(entity.is_hidden) && !isDaptinJoinWorldEntity(entity)
  )
}

export function daptinVisibleWorldEntityQuery(search?: string) {
  const query: Array<{
    column: string
    operator: string
    value: unknown
  }> = [
    {
      column: 'is_join_table',
      operator: 'is',
      value: false,
    },
    {
      column: 'is_hidden',
      operator: 'is',
      value: false,
    },
  ]

  if (search?.trim()) {
    query.push({
      column: 'table_name',
      operator: 'contains',
      value: `%${search.trim()}%`,
    })
  }

  return query
}
