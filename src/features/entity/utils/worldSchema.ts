import type { DaptinWorldEntity } from 'daptin-client'
import type { TableInfo } from '@/hooks/use-world-entities'

export function getWorldSchema(
  world: DaptinWorldEntity,
  entityName: string
): TableInfo {
  const schema = world.world_schema_json

  if (!schema || typeof schema !== 'object' || !Array.isArray(schema.Columns)) {
    throw new Error(
      `Invalid world schema for ${entityName}: expected an object with Columns`
    )
  }

  return schema as unknown as TableInfo
}
