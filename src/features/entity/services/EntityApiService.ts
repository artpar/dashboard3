import { daptinClient } from '@/daptin'
import { TableInfo } from '@/hooks/use-world-entities.tsx'
import { TableRelation } from '@/features/entity/SingleEntityAllRelationsViewComponent.tsx'
import { ColumnDefinition } from '@/features/entity/columns'
import { safelySerializeData } from '@/features/entity/utils/serializer.ts'

/**
 * Centralized service for all entity API operations
 */
export class EntityApiService {
  /**
   * Fetch schema information for an entity
   */
  static async fetchSchema(entityName: string): Promise<{
    schema: any
    columns: ColumnDefinition[]
    relations: any[]
    actions: any[]
  }> {
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
            `Failed to get schema for ${entityName}`
        )
      }

      let schema = null
      let columns: ColumnDefinition[] = []
      let relations: any[] = []
      let actions: any[] = []

      if (worldResponse.data && worldResponse.data.length > 0) {
        schema = worldResponse.data[0]

        // Parse column information from schema
        if (schema.world_schema_json) {
          try {
            const parsedSchema: TableInfo = JSON.parse(schema.world_schema_json)

            // Extract columns
            if (parsedSchema && parsedSchema.Columns) {
              columns = parsedSchema.Columns
            }

            // Extract relations
            if (parsedSchema.Relations) {
              relations = parsedSchema.Relations.filter(
                (relation: any) =>
                  relation.Subject === entityName ||
                  relation.Object === entityName
              )
            }

            // Fetch actions for this entity
            try {
              const actionsResponse = await daptinClient.jsonApi.findAll(
                'action',
                {
                  world_id: schema['reference_id'],
                }
              )

              if (actionsResponse.data && actionsResponse.data.length > 0) {
                actions = actionsResponse.data
              }
            } catch (actionError) {
              console.warn('Error fetching actions:', actionError)
            }
          } catch (jsonParseError) {
            console.error('Error parsing world_schema_json:', jsonParseError)
          }
        }
      }

      return { schema, columns, relations, actions }
    } catch (err) {
      console.error(`Error fetching schema for ${entityName}:`, err)
      throw err
    }
  }

  /**
   * Fetch a single entity by ID
   */
  static async fetchSingleEntity(
    entityName: string,
    entityId: string
  ): Promise<any> {
    try {
      const response = await daptinClient.jsonApi.find(entityName, entityId, {
        included_relations: '*',
      })

      if (response.errors && response.errors.length) {
        throw new Error(
          response.errors[0].detail || `Failed to fetch ${entityName} data`
        )
      }

      return safelySerializeData(response.data)
    } catch (err) {
      console.error(
        `Error fetching ${entityName} data for ID ${entityId}:`,
        err
      )
      throw err
    }
  }

  /**
   * Fetch related entities for a single entity
   */
  static async fetchRelatedEntities(
    entityName: string,
    entityId: string,
    relations: TableRelation[]
  ): Promise<Record<string, any[]>> {
    const relatedData: Record<string, any[]> = {}

    try {
      relations = relations || []
      for (const relation of relations) {
        let relationEntityName: string
        let queryParam: any

        if (relation.Subject === entityName) {
          // This entity is the subject, we need to find objects
          relationEntityName = relation.Object
          queryParam = {}
          queryParam[relationEntityName + '_id'] = entityId
          queryParam[relationEntityName + 'Name'] = relation.SubjectName
        } else {
          // This entity is the object, we need to find subjects
          relationEntityName = relation.Subject
          queryParam = {}
          queryParam[relationEntityName + '_id'] = entityId
          queryParam[relationEntityName + 'Name'] = relation.ObjectName
        }

        try {
          const relationResponse = await daptinClient.jsonApi.findAll(
            relationEntityName,
            queryParam
          )

          if (!relationResponse.errors) {
            relatedData[relationEntityName] = safelySerializeData(
              relationResponse.data
            )
          }
        } catch (relationError) {
          console.warn(
            `Error fetching related entity ${relationEntityName}:`,
            relationError
          )
        }
      }

      return relatedData
    } catch (err) {
      console.error('Error fetching related entities:', err)
      throw err
    }
  }

  /**
   * Fetch a collection of entities
   */
  static async fetchEntityCollection(
    entityName: string,
    params: {
      page: number
      pageSize: number
      filters?: Record<string, any>
      sort?: string
    }
  ): Promise<{ data: any[]; totalPages: number }> {
    try {
      const { page, pageSize, filters, sort = '-created_at' } = params

      // Parse filter query format for daptin
      const parseFilters = () => {
        if (!filters || Object.keys(filters).length === 0) return undefined

        const filterQuery = Object.entries(filters)
          .filter(([_, value]) => value !== undefined && value !== '')
          .map(([column, value]) => {
            return {
              column,
              operator: typeof value === 'string' ? 'ilike' : 'eq',
              value: typeof value === 'string' ? `%${value}%` : value,
            }
          })

        return filterQuery.length > 0 ? JSON.stringify(filterQuery) : undefined
      }

      // Main data query
      const response = await daptinClient.jsonApi.findAll(entityName, {
        'page[size]': pageSize.toString(),
        'page[number]': page.toString(),
        included_relations: '*',
        sort,
        query: parseFilters(),
      })

      if (response.errors && response.errors.length) {
        throw new Error(
          response.errors[0].detail || `Failed to fetch ${entityName} data`
        )
      }

      // Calculate total pages
      const totalItems = response.meta?.total || response.data.length
      const totalPages = Math.ceil(totalItems / pageSize)

      return {
        data: safelySerializeData(response.data),
        totalPages,
      }
    } catch (err) {
      console.error(`Error fetching ${entityName} data:`, err)
      throw err
    }
  }

  /**
   * Create a new entity
   */
  static async createEntity(entityName: string, item: any): Promise<any> {
    try {
      const response = await daptinClient.jsonApi.create(entityName, item)

      if (response.errors && response.errors.length) {
        throw new Error(response.errors[0].detail || 'Failed to create item')
      }

      return response.data
    } catch (err) {
      console.error(`Error creating ${entityName}:`, err)
      throw err
    }
  }

  /**
   * Update an existing entity
   */
  static async updateEntity(
    entityName: string,
    entityId: string,
    item: any
  ): Promise<any> {
    try {
      const response = await daptinClient.jsonApi.update(entityName, {
        id: entityId,
        ...item,
      })

      if (response.errors && response.errors.length) {
        throw new Error(response.errors[0].detail || 'Failed to update item')
      }

      return response.data
    } catch (err) {
      console.error(`Error updating ${entityName}:`, err)
      throw err
    }
  }

  /**
   * Delete an entity
   */
  static async deleteEntity(
    entityName: string,
    entityId: string
  ): Promise<any> {
    try {
      const response = await daptinClient.jsonApi.destroy(entityName, entityId)

      if (response.errors && response.errors.length) {
        throw new Error(response.errors[0].detail || 'Failed to delete item')
      }

      return entityId
    } catch (err) {
      console.error(`Error deleting ${entityName}:`, err)
      throw err
    }
  }

  /**
   * Execute a custom action on an entity
   */
  static async executeAction(
    entityName: string,
    actionName: string,
    payload: any
  ): Promise<any> {
    try {
      const response = await daptinClient.actionManager.doAction(
        entityName,
        actionName,
        payload
      )

      return response
    } catch (err) {
      console.error(`Error executing action ${actionName}:`, err)
      throw err
    }
  }
}
