import { daptinClient } from '@/daptin'
import { safelySerializeData } from '@/features/entity/utils/serializer'
import {
  categorizeRelations,
  getRelationQueryParams,
  Relation,
} from '../relations/relations-utils'

/**
 * Centralized service for all relation API operations
 */
export class RelationsApiService {
  /**
   * Fetch relations for an entity
   */
  static async fetchEntityRelations(entityName: string): Promise<Relation[]> {
    try {
      // Fetch schema information from world entity
      const worldResponse = await daptinClient.jsonApi.findAll('world', {
        query: JSON.stringify([
          {
            column: 'table_name',
            operator: 'eq',
            value: entityName,
          },
        ]),
      })

      if (worldResponse.errors && worldResponse.errors.length) {
        throw new Error(
          worldResponse.errors[0].detail ||
            `Failed to get relations for ${entityName}`
        )
      }

      let relations: Relation[] = []

      if (worldResponse.data && worldResponse.data.length > 0) {
        const schema = worldResponse.data[0]

        // Parse relation information from schema
        if (schema.world_schema_json) {
          try {
            const parsedSchema = JSON.parse(schema.world_schema_json)

            // Extract relations
            if (parsedSchema.Relations) {
              relations = parsedSchema.Relations.filter(
                (relation: any) =>
                  relation.Subject === entityName ||
                  relation.Object === entityName
              )

              // Categorize relations by direction
              const { allRelations } = categorizeRelations(
                relations,
                entityName
              )
              return allRelations
            }
          } catch (jsonParseError) {
            console.error('Error parsing world_schema_json:', jsonParseError)
          }
        }
      }

      return relations
    } catch (err) {
      console.error(`Error fetching relations for ${entityName}:`, err)
      throw err
    }
  }

  /**
   * Fetch related records for a specific relation
   */
  static async fetchRelatedRecords(
    relation: Relation,
    entityName: string,
    entityId: string,
    params: {
      page?: number
      pageSize?: number
      sort?: string
    } = {}
  ): Promise<{ data: any[]; totalCount: number }> {
    try {
      const { page = 1, pageSize = 20, sort = '-created_at' } = params

      // Get the related entity name
      const relatedEntityName =
        relation.Object === entityName ? relation.Subject : relation.Object

      // Get query parameters based on relation direction
      const queryParams = getRelationQueryParams(relation, entityName, entityId)

      // Add pagination and sorting
      const enhancedParams = {
        ...queryParams,
        'page[size]': pageSize.toString(),
        'page[number]': page.toString(),
        sort,
      }

      // Fetch the data
      const response = await daptinClient.jsonApi.findAll(
        relatedEntityName,
        enhancedParams
      )

      if (response.errors && response.errors.length) {
        throw new Error(
          response.errors[0].detail ||
            `Failed to fetch related ${relatedEntityName}`
        )
      }

      let data = response.data || []
      if (!(data instanceof Array)) {
        data = [data]
      }

      // Calculate total count
      const totalCount = response.meta?.total || data.length

      return {
        data: safelySerializeData(data),
        totalCount,
      }
    } catch (err) {
      console.error('Error fetching related records:', err)
      throw err
    }
  }

  /**
   * Create a relation between entities
   */
  static async createRelation(
    sourceEntityName: string,
    sourceEntityId: string,
    targetEntityName: string,
    targetEntityId: string,
    relationName: string
  ): Promise<any> {
    try {
      // Implementation depends on how Daptin handles relation creation
      // This is a placeholder for the actual implementation
      const payload = {
        source_entity_name: sourceEntityName,
        source_entity_id: sourceEntityId,
        target_entity_name: targetEntityName,
        target_entity_id: targetEntityId,
        relation_name: relationName,
      }

      const response = await daptinClient.actionManager.doAction(
        'world',
        'create_relation',
        payload
      )

      return response
    } catch (err) {
      console.error('Error creating relation:', err)
      throw err
    }
  }

  /**
   * Delete a relation between entities
   */
  static async deleteRelation(
    sourceEntityName: string,
    sourceEntityId: string,
    targetEntityName: string,
    targetEntityId: string,
    relationName: string
  ): Promise<any> {
    try {
      // Implementation depends on how Daptin handles relation deletion
      // This is a placeholder for the actual implementation
      const payload = {
        source_entity_name: sourceEntityName,
        source_entity_id: sourceEntityId,
        target_entity_name: targetEntityName,
        target_entity_id: targetEntityId,
        relation_name: relationName,
      }

      const response = await daptinClient.actionManager.doAction(
        'world',
        'delete_relation',
        payload
      )

      return response
    } catch (err) {
      console.error('Error deleting relation:', err)
      throw err
    }
  }
}
