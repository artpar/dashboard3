import { daptinClient } from '@/daptin'
import { safelySerializeData } from '@/features/entity/utils/serializer'
import { validateDaptinResponse } from '@/lib/utils'
import {
  categorizeRelations,
  getRelationQueryParams,
  TableRelation,
} from '../relations/relations-utils'

/**
 * Centralized service for all relation API operations
 * Uses daptinClient.worldModel methods for consistent data access
 */
export class RelationsApiService {
  /**
   * Fetch relations for an entity
   */
  static async fetchEntityRelations(
    entityName: string
  ): Promise<TableRelation[]> {
    try {
      // Fetch world model using the worldManager API
      const worldModel = await daptinClient.worldManager.getWorldByName(entityName)

      if (!worldModel) {
        throw new Error(`Failed to get world model for ${entityName}`)
      }

      let relations: TableRelation[] = []

      // Extract relations from the world_schema_json
      if (worldModel.world_schema_json) {
        try {
          const parsedSchema = typeof worldModel.world_schema_json === 'string'
            ? JSON.parse(worldModel.world_schema_json)
            : worldModel.world_schema_json

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
    relation: TableRelation,
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

      validateDaptinResponse(response, `Failed to fetch related ${relatedEntityName}`)

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
    relation: TableRelation
  ): Promise<any> {
    try {
      // Get the world model which contains all entity metadata
      const worldModel = await daptinClient.worldManager.getWorldByName(sourceEntityName)

      if (!worldModel) {
        throw new Error(`Failed to get world model for ${sourceEntityName}`)
      }

      // If it's a belongs_to or has_one relation, use direct update
      if (
        relation &&
        (relation.Relation === 'belongs_to' || relation.Relation === 'has_one')
      ) {
        // For belongs_to, we update the foreign key on the source entity
        const foreignKeyField =
          relation.Relation === 'belongs_to'
            ? `${targetEntityName}_id`
            : `${relation.SubjectName || targetEntityName}_id`

        // Update the entity with the new foreign key
        const updateResponse = await daptinClient.jsonApi.update(
          sourceEntityName,
          {
            id: sourceEntityId,
            [foreignKeyField]: targetEntityId,
          }
        )

        return updateResponse
      }

      // For many-to-many relations, use the relationships API
      const relationName = relation.ObjectName === sourceEntityName
        ? relation.SubjectName
        : relation.ObjectName

      const response = await daptinClient.jsonApi
        .one(sourceEntityName, sourceEntityId)
        .relationships(relationName)
        .patch([
          {
            type: targetEntityName,
            id: targetEntityId,
          },
        ])

      return response
    } catch (err) {
      console.error('Error creating relation:', err)
      throw err
    }
  }

  /**
   * Update a belongs_to relation between entities
   * For belongs_to relations, the foreign key is on the source entity
   */
  static async updateBelongsToRelation(
    sourceEntityName: string,
    sourceEntityId: string,
    targetEntityName: string,
    targetEntityId: string,
    relation: TableRelation
  ): Promise<any> {
    try {
      // Get the world model which contains all entity metadata
      const worldModel = await daptinClient.worldManager.getWorldByName(sourceEntityName)

      if (!worldModel) {
        throw new Error(`Failed to get world model for ${sourceEntityName}`)
      }

      // Determine the foreign key field based on relation type
      let foreignKeyField: string

      if (relation.Relation === 'belongs_to') {
        // For belongs_to, the FK is on the source entity pointing to the target
        foreignKeyField = `${targetEntityName}_id`
      } else {
        // For other relations, use the SubjectName if available
        foreignKeyField = `${relation.SubjectName || targetEntityName}_id`
      }

      // Update the entity with the new foreign key
      const updateResponse = await daptinClient.jsonApi.update(
        sourceEntityName,
        {
          id: sourceEntityId,
          [foreignKeyField]: targetEntityId,
        }
      )

      return updateResponse
    } catch (err) {
      console.error('Error updating belongs_to relation:', err)
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
    relation: TableRelation
  ): Promise<any> {
    try {
      // Get the world model which contains all entity metadata
      const worldModel = await daptinClient.worldManager.getWorldByName(sourceEntityName)

      if (!worldModel) {
        throw new Error(`Failed to get world model for ${sourceEntityName}`)
      }

      // Handle different relation types
      if (relation) {
        switch (relation.Relation) {
          case 'belongs_to':
            // belongs_to relations are non-nullable FKs and can't be set to null
            // We need to find another valid value to set it to or throw an error
            throw new Error(
              `Cannot delete 'belongs_to' relation from ${sourceEntityName} to ${targetEntityName}. ` +
              `This is a required foreign key and must be set to a valid value. Use updateBelongsToRelation instead.`
            )

          case 'has_one':
            // has_one relations can be set to null
            const foreignKeyField = `${relation.SubjectName || targetEntityName}_id`

            // Update the entity with null for the foreign key
            const updateResponse = await daptinClient.jsonApi.update(
              sourceEntityName,
              {
                id: sourceEntityId,
                [foreignKeyField]: null,
              }
            )
            return updateResponse

          case 'has_many':
          case 'many_to_many':
          case 'has_many_and_belongs_to_many':
            // For many-to-many relations, use the relationships API
            const relationName = relation.Object === sourceEntityName
              ? relation.SubjectName
              : relation.ObjectName

            const response = await daptinClient.jsonApi
              .one(sourceEntityName, sourceEntityId)
              .relationships(relationName)
              .destroy([
                {
                  type: targetEntityName,
                  id: targetEntityId,
                },
              ])
            return response

          default:
            // For file type foreign keys, use direct update
            if (worldModel.columns) {
              // Find file columns that reference the target entity
              const fileColumn = Object.entries(worldModel.columns).find(
                ([_, colDef]: [string, any]) =>
                  colDef.ColumnType?.startsWith('file.') &&
                  colDef.ForeignKeyData?.Namespace === targetEntityName
              )

              if (fileColumn) {
                const [columnName] = fileColumn
                // Update the entity with null for the file column
                const fileUpdateResponse = await daptinClient.jsonApi.update(
                  sourceEntityName,
                  {
                    id: sourceEntityId,
                    [columnName]: null,
                  }
                )
                return fileUpdateResponse
              }
            }

            // Default to relationships API for unknown relation types
            const defaultRelationName = relation.Object === sourceEntityName
              ? relation.Subject
              : relation.Object

            const defaultResponse = await daptinClient.jsonApi
              .one(sourceEntityName, sourceEntityId)
              .relationships(defaultRelationName)
              .destroy([
                {
                  type: targetEntityName,
                  id: targetEntityId,
                },
              ])
            return defaultResponse
        }
      }

      throw new Error(`Invalid relation between ${sourceEntityName} and ${targetEntityName}`)
    } catch (err) {
      console.error('Error deleting relation:', err)
      throw err
    }
  }
}
