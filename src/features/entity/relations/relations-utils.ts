// src/features/entity/components/relations/relations-utils.ts

import { SYSTEM_COLUMNS } from '@/features/entity/types.ts'

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
export interface TableRelation {
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
export function categorizeRelations(relations: TableRelation[], entityName: string) {
  const inbound: TableRelation[] = []
  const outbound: TableRelation[] = []
  const allRelations: TableRelation[] = []

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
export function getRelationKey(relation: TableRelation): string {
  return `${relation.Subject}-${relation.SubjectName || 'default'}-${relation.Relation}-${relation.Object}-${relation.ObjectName || 'default'}`
}

/**
 * Get the name of the related entity
 */
export function getRelatedEntityName(relation: TableRelation, entityName: string): string {
  return relation.Object === entityName ? relation.Subject : relation.Object
}

/**
 * Get the query parameters for fetching related records
 */
export function getRelationQueryParams(relation: TableRelation, entityName: string, entityId?: string): Record<string, any> {
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
  const displayFields: Record<string, any> = {}

  Object.entries(data)
    .filter(
      ([key, value]) =>
        !SYSTEM_COLUMNS.includes(key) &&
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
 * Get a human-readable name for a relation type based on direction
 */
export function getRelationLabel(relationType: string, direction?: RelationDirection, currentEntity?: string, relation?: TableRelation): string {
  // Map of relation types to human-readable labels
  const relationLabels: Record<string, string> = {
    'belongs_to': 'Belongs To',
    'has_one': 'Has One',
    'has_many': 'Has Many',
    'many_to_many': 'Many to Many',
    'has_many_and_belongs_to_many': 'Has and Belongs to Many',
  }

  // If we don't have direction or relation info, just return the basic label
  if (!direction || !relation || !currentEntity) {
    return relationLabels[relationType] || relationType
  }

  // Adjust the label based on direction and current entity
  if (direction === RelationDirection.Inbound) {
    if (relationType === 'belongs_to') {
      return 'Referenced By' // Something belongs to this entity
    } else if (relationType === 'has_one' || relationType === 'has_many') {
      return 'Parent Of' // This entity has the other entity
    }
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
