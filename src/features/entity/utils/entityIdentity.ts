export type EntityRecord = {
  id?: string | number | null
  reference_id?: string | number | null
}

const SPECIALIZED_DETAIL_ROUTES: Record<string, string> = {
  site: '/storage/sites',
  cloud_store: '/storage/cloud-stores',
  certificate: '/storage/certificates',
  integration: '/data/integrations',
  smd: '/admin/state-machines',
  mail_server: '/communication/email',
  action: '/admin/actions',
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
