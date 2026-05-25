import type { DaptinEntityBase } from 'daptin-client'

export type EntityRecord = {
  id?: DaptinEntityBase['id']
  reference_id?: DaptinEntityBase['reference_id']
}

const SPECIALIZED_DETAIL_ROUTES: Record<string, string> = {
  site: '/storage/sites',
  cloud_store: '/storage/cloud-stores',
  certificate: '/storage/certificates',
  integration: '/data/integrations',
  smd: '/admin/state-machines',
  mail_server: '/mail/servers',
  mail_account: '/mail/accounts',
  action: '/admin/actions',
  template: '/templates',
}

export function getEntityCollectionPath(entityName: string): string {
  return SPECIALIZED_DETAIL_ROUTES[entityName] ?? `/${entityName}`
}

export function getEntityId(item: EntityRecord): string {
  const entityId = item.reference_id ?? item.id
  return entityId == null ? '' : String(entityId)
}

export function getEntityDetailPath(
  entityName: string,
  itemOrId: EntityRecord | string | number
): string {
  const entityId =
    typeof itemOrId === 'object' ? getEntityId(itemOrId) : String(itemOrId)
  const specializedRoute = SPECIALIZED_DETAIL_ROUTES[entityName]

  if (specializedRoute) {
    return `${specializedRoute}/${entityId}`
  }

  return `/${entityName}/${entityId}`
}
