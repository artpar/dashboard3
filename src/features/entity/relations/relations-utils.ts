// src/features/entity/components/relations/relations-utils.ts

/**
 * Enum for relation direction relative to the current entity
 */
export enum RelationDirection {
  Inbound = 'inbound',
  Outbound = 'outbound',
}

/**
 * Relation type with direction information
 */
export interface Relation {
  Subject: string
  SubjectName?: string
  Object: string
  ObjectName?: string
  Relation: string
  direction?: RelationDirection
}

export interface RelatedRecord {
  id: string
  reference_id: string
  [key: string]: any
}

/**
 * Categorize relations as inbound or outbound relative to the current entity
 */
export function categorizeRelations(relations: Relation[], entityName: string) {
  const inbound: Relation[] = []
  const outbound: Relation[] = []
  const allRelations: Relation[] = []

  relations.forEach(relation => {
    const clone = { ...relation }

    if (relation.Object === entityName) {
      // This entity is the target of the relation
      clone.direction = RelationDirection.Inbound
      inbound.push(clone)
    } else {
      // This entity is the source of the relation
      clone.direction = RelationDirection.Outbound
      outbound.push(clone)
    }

    allRelations.push(clone)
  })

  return { inbound, outbound, allRelations }
}

/**
 * Get a unique key for a relation
 */
export function getRelationKey(relation: Relation): string {
  return `${relation.Subject}-${relation.SubjectName || 'default'}-${relation.Relation}-${relation.Object}-${relation.ObjectName || 'default'}`
}

/**
 * Get the name of the related entity
 */
export function getRelatedEntityName(relation: Relation, entityName: string): string {
  return relation.Object === entityName ? relation.Subject : relation.Object
}

/**
 * Get the query parameters for fetching related records
 */
export function getRelationQueryParams(relation: Relation, entityName: string, entityId?: string): Record<string, any> {
  if (!entityId) return {}

  // If the current entity is the Object, query using ObjectName, otherwise use SubjectName
  if (relation.Object === entityName) {
    return {
      [relation.ObjectName || entityName + '_id']: entityId,
      [relation.Object + 'Name']: relation.SubjectName,
    }
  } else {
    return {
      [relation.SubjectName || entityName + '_id']: entityId,
      [relation.Subject + 'Name']: relation.ObjectName,
    }
  }
}

/**
 * Get priority display fields for a record
 */
export function getDisplayFields(data: RelatedRecord, maxFields: number = 3): Record<string, any> {
  // Priority fields to display if they exist
  const priorityFields = ['name', 'title', 'label', 'description', 'email']

  // Find the first available priority field
  for (const field of priorityFields) {
    if (data[field]) {
      return { [field]: data[field] }
    }
  }

  // If no priority fields, get first N non-system fields
  const systemFields = [
    'id', 'reference_id', 'type', '__type', 'created_at', 'updated_at',
    'permission', 'version', 'user_id'
  ]
  const displayFields: Record<string, any> = {}

  Object.entries(data)
    .filter(
      ([key, value]) =>
        !systemFields.includes(key) &&
        value !== null &&
        value !== undefined &&
        !key.endsWith('_id') &&
        typeof value !== 'object'
    )
    .slice(0, maxFields)
    .forEach(([key, value]) => {
      displayFields[key] = value
    })

  return displayFields
}

/**
 * Get a human-readable name for a relation type
 */
export function getRelationLabel(relationType: string): string {
  // Map of relation types to human-readable labels
  const relationLabels: Record<string, string> = {
    'belongs_to': 'Belongs To',
    'has_one': 'Has One',
    'has_many': 'Has Many',
    'many_to_many': 'Many to Many',
    'has_many_and_belongs_to_many': 'Has and Belongs to Many',
  }

  return relationLabels[relationType] || relationType
}

/**
 * Get icon and color for a relation direction
 */
export function getRelationDirectionStyles(direction: RelationDirection): {
  iconClass: string
  bgClass: string
  textClass: string
  borderClass: string
} {
  if (direction === RelationDirection.Inbound) {
    return {
      iconClass: 'rotate-180',
      bgClass: 'bg-blue-50',
      textClass: 'text-blue-800',
      borderClass: 'border-blue-200'
    }
  } else {
    return {
      iconClass: '',
      bgClass: 'bg-green-50',
      textClass: 'text-green-800',
      borderClass: 'border-green-200'
    }
  }
}
