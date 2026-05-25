/* eslint-disable no-console, @typescript-eslint/no-explicit-any, no-case-declarations */
import { daptinClient } from '@/daptin'
import type {
  DaptinJsonApiListResponse,
  DaptinJsonApiQueryParams,
  DaptinObjectUsergroupAccessResponse,
  DaptinReferenceId,
} from 'daptin-client'
import { validateDaptinResponse } from '@/lib/utils'
import { safelySerializeData } from '@/features/entity/utils/serializer'
import {
  categorizeRelations,
  getRelationQueryParams,
  TableRelation,
} from '../relations/relations-utils'

const ACCESS_LOG_PREFIX = '[entity.access.groups]'

type RelationPaginationParams = {
  page?: number
  pageSize?: number
  sort?: string
}

/**
 * Centralized service for all relation API operations
 * Uses daptinClient.worldModel methods for consistent data access
 */
export class RelationsApiService {
  static async fetchUsergroups({
    search,
    page = 1,
    pageSize = 20,
    sort = 'name',
  }: RelationPaginationParams & {
    search?: string
  }): Promise<DaptinJsonApiListResponse<{ name?: string }>> {
    const params: DaptinJsonApiQueryParams = {
      'page[size]': pageSize,
      'page[number]': page,
      sort,
    }

    if (search?.trim()) {
      params.query = JSON.stringify([
        {
          column: 'name',
          operator: 'contains',
          value: `%${search.trim()}%`,
        },
      ])
    }

    console.info(`${ACCESS_LOG_PREFIX} all-groups:fetch:start`, {
      search,
      params,
    })

    try {
      const response = await daptinClient.jsonApi.findAll<{ name?: string }>(
        'usergroup',
        params
      )
      console.info(`${ACCESS_LOG_PREFIX} all-groups:fetch:success`, {
        count: Array.isArray(response.data) ? response.data.length : 0,
        links: response.links,
      })
      return response
    } catch (error) {
      console.error(`${ACCESS_LOG_PREFIX} all-groups:fetch:error`, {
        search,
        params,
        error,
      })
      throw error
    }
  }

  static async fetchObjectUsergroups({
    entityName,
    entityId,
    page = 1,
    pageSize = 10,
    sort = 'name',
  }: RelationPaginationParams & {
    entityName: string
    entityId: DaptinReferenceId
  }): Promise<DaptinObjectUsergroupAccessResponse<{ name?: string }>> {
    const params: DaptinJsonApiQueryParams = {
      'page[size]': pageSize,
      'page[number]': page,
      sort,
    }

    console.info(`${ACCESS_LOG_PREFIX} related-groups:fetch:start`, {
      entityName,
      entityId,
      params,
    })

    try {
      const response = await daptinClient.accessManager.listObjectUsergroups<{
        name?: string
      }>(entityName, entityId, params)
      console.info(`${ACCESS_LOG_PREFIX} related-groups:fetch:success`, {
        entityName,
        entityId,
        count: response.data.length,
        links: response.links,
      })
      return response
    } catch (error) {
      console.error(`${ACCESS_LOG_PREFIX} related-groups:fetch:error`, {
        entityName,
        entityId,
        params,
        error,
      })
      throw error
    }
  }

  static async addObjectUsergroup(
    entityName: string,
    entityId: DaptinReferenceId,
    groupId: DaptinReferenceId
  ): Promise<unknown> {
    console.info(`${ACCESS_LOG_PREFIX} add:start`, {
      entityName,
      entityId,
      groupId,
    })

    try {
      const response = await daptinClient.accessManager.addObjectUsergroup(
        entityName,
        entityId,
        groupId
      )
      console.info(`${ACCESS_LOG_PREFIX} add:success`, {
        entityName,
        entityId,
        groupId,
      })
      return response
    } catch (error) {
      console.error(`${ACCESS_LOG_PREFIX} add:error`, {
        entityName,
        entityId,
        groupId,
        error,
      })
      throw error
    }
  }

  static async removeObjectUsergroup(
    entityName: string,
    entityId: DaptinReferenceId,
    groupId: DaptinReferenceId
  ): Promise<unknown> {
    console.info(`${ACCESS_LOG_PREFIX} remove:start`, {
      entityName,
      entityId,
      groupId,
    })

    try {
      const response = await daptinClient.accessManager.removeObjectUsergroup(
        entityName,
        entityId,
        groupId
      )
      console.info(`${ACCESS_LOG_PREFIX} remove:success`, {
        entityName,
        entityId,
        groupId,
      })
      return response
    } catch (error) {
      console.error(`${ACCESS_LOG_PREFIX} remove:error`, {
        entityName,
        entityId,
        groupId,
        error,
      })
      throw error
    }
  }

  static async updateObjectUsergroupRelationPermission(
    entityName: string,
    relationReferenceId: DaptinReferenceId,
    permission: number
  ): Promise<unknown> {
    console.info(`${ACCESS_LOG_PREFIX} permission:update:start`, {
      entityName,
      relationReferenceId,
      permission,
    })

    try {
      const response =
        await daptinClient.accessManager.updateObjectUsergroupRelationPermission(
          entityName,
          relationReferenceId,
          permission
        )
      console.info(`${ACCESS_LOG_PREFIX} permission:update:success`, {
        entityName,
        relationReferenceId,
        permission,
      })
      return response
    } catch (error) {
      console.error(`${ACCESS_LOG_PREFIX} permission:update:error`, {
        entityName,
        relationReferenceId,
        permission,
        error,
      })
      throw error
    }
  }

  /**
   * Fetch relations for an entity
   */
  static async fetchEntityRelations(
    entityName: string
  ): Promise<TableRelation[]> {
    try {
      // Fetch world model using the worldManager API
      const worldModel =
        await daptinClient.worldManager.getWorldByName(entityName)

      if (!worldModel) {
        throw new Error(`Failed to get world model for ${entityName}`)
      }

      let relations: TableRelation[] = []

      // Extract relations from the world_schema_json
      if (worldModel.world_schema_json) {
        try {
          const parsedSchema =
            typeof worldModel.world_schema_json === 'string'
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
            const { allRelations } = categorizeRelations(relations, entityName)
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

      validateDaptinResponse(
        response,
        `Failed to fetch related ${relatedEntityName}`
      )

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
      const worldModel =
        await daptinClient.worldManager.getWorldByName(sourceEntityName)

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
      const relationName =
        relation.ObjectName === sourceEntityName
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
      const worldModel =
        await daptinClient.worldManager.getWorldByName(sourceEntityName)

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
      const worldModel =
        await daptinClient.worldManager.getWorldByName(sourceEntityName)

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
            const relationName =
              relation.Object === sourceEntityName
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
            const defaultRelationName =
              relation.Object === sourceEntityName
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

      throw new Error(
        `Invalid relation between ${sourceEntityName} and ${targetEntityName}`
      )
    } catch (err) {
      console.error('Error deleting relation:', err)
      throw err
    }
  }
}
