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
      const worldResponse = await daptinClient.worldManager.getWorldByName(entityName)

      let schema: any = null
      let columns: ColumnDefinition[] = []
      let relations: any[] = []
      let actions: any[] = []

      if (worldResponse) {
        schema = worldResponse;

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
                'action', {
                  world_id: schema['reference_id'],
                }
              )

              if (actionsResponse.data && actionsResponse.data.length > 0) {
                actions = actionsResponse.data.map(row => {
                  return {
                    ActionName: row.action_name,
                    Label: row.label,
                    ReferenceId: row.reference_id,
                    InstanceOptional: row.instance_optional,
                  }
                })
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
   * @param entityName The name of the entity to fetch
   * @param entityId The ID of the entity to fetch
   * @param options Additional options for the fetch
   * @param options.includedRelations Specify relations to include, use '*' for all relations
   */
  static async fetchSingleEntity(
    entityName: string,
    entityId: string,
    options: { includedRelations?: string } = {}
  ): Promise<any> {
    try {
      const params: Record<string, any> = {}

      // Add included relations if specified
      if (options.includedRelations) {
        params['included_relations'] = options.includedRelations
      }

      const response = await daptinClient.jsonApi.find(entityName, entityId, params)

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
  ): Promise<{
    data: any[]
    totalPages: number
    pagination: {
      currentPage: number
      from: number
      lastPage: number
      perPage: number
      to: number
      total: number
    }
  }> {
    try {
      const { page, pageSize, filters, sort = '-created_at' } = params
      // Define requestObject with proper typing to include all possible properties
      let requestObject: Record<string, any> = {
        'page[size]': pageSize.toString(),
        'page[number]': page.toString(),
        sort,
      }
      console.log('fetchEntityCollection:', JSON.stringify(filters))

      // Handle search filter separately
      const searchTerm = filters?._search
      const otherFilters = { ...filters }

      if (searchTerm && typeof searchTerm === 'string') {
        requestObject['filter'] = [searchTerm]
        delete otherFilters._search // Remove from other filters to avoid duplication
      }

      // Parse filter query format for daptin
      const parseFilters = () => {
        if (!otherFilters || Object.keys(otherFilters).length === 0) return undefined

        const filterQuery = Object.entries(otherFilters)
          .filter(([_, value]) => value !== undefined && value !== '')
          .map(([column, value]) => {
            // Check if the string value is numeric
            const isNumericString = typeof value === 'string' && !isNaN(Number(value))

            return {
              column,
              operator: typeof value === 'string'
                ? (isNumericString ? 'eq' : 'ilike')
                : 'eq',
              value: typeof value === 'string'
                ? (isNumericString ? value : `%${value}%`)
                : value,
            }
          })

        return filterQuery.length > 0 ? JSON.stringify(filterQuery) : undefined
      }

      // Main data query
      requestObject['query'] = parseFilters()
      const response = await daptinClient.jsonApi.findAll(entityName, requestObject)

      if (response.errors && response.errors.length) {
        throw new Error(
          response.errors[0].detail || `Failed to fetch ${entityName} data`
        )
      }

      // Extract pagination information from response.links
      const links = response.links || {}
      const pagination = {
        currentPage: links.current_page || params.page,
        from: links.from || 0,
        lastPage: links.last_page || 1,
        perPage: links.per_page || params.pageSize,
        to: links.to || (links.from ? links.from + response.data.length - 1 : response.data.length - 1),
        total: links.total || response.meta?.total || response.data.length,
      }

      // Calculate total pages based on pagination information
      const totalPages = pagination.lastPage || Math.ceil(pagination.total / pagination.perPage)

      return {
        data: safelySerializeData(response.data),
        totalPages,
        pagination,
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
