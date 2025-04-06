import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { daptinClient } from '@/daptin';
import { useToast } from '@/hooks/use-toast';

// Define the entity data context type
interface EntityContextType {
  entityName: string;
  data: any[];
  schema: any;
  isLoading: boolean;
  error: Error | null;
  fetchData: () => void;
  createItem: (item: any) => Promise<any>;
  updateItem: (id: string, item: any) => Promise<any>;
  deleteItem: (id: string) => Promise<any>;
  executeAction: (actionName: string, payload: any) => Promise<any>;
  selectedItem: any;
  setSelectedItem: (item: any) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  totalPages: number;
  filters: Record<string, any>;
  setFilters: (filters: Record<string, any>) => void;
  showCreateDialog: boolean;
  setShowCreateDialog: (show: boolean) => void;
  showEditDialog: boolean;
  setShowEditDialog: (show: boolean) => void;
  showDeleteDialog: boolean;
  setShowDeleteDialog: (show: boolean) => void;
  showFilterDialog: boolean;
  setShowFilterDialog: (show: boolean) => void;
  columns: any[];
  availableActions: any[];
  relations: any[];
  refresh: () => void;
}

// Create the entity context
export const EntityContext = createContext<EntityContextType | undefined>(undefined);

// Create a provider component for the entity context
export const EntityDataProvider: React.FC<{
  children: React.ReactNode;
  entityName: string;
}> = ({ children, entityName }) => {
  const [data, setData] = useState<any[]>([]);
  const [schema, setSchema] = useState<any>(null);
  const [columns, setColumns] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFilterDialog, setShowFilterDialog] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Parse filter query format for daptin
  const parseFilters = () => {
    if (Object.keys(filters).length === 0) return undefined;

    const filterQuery = Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== '')
      .map(([column, value]) => {
        return {
          column,
          operator: typeof value === 'string' ? 'ilike' : 'eq',
          value: typeof value === 'string' ? `%${value}%` : value,
        };
      });

    return filterQuery.length > 0 ? JSON.stringify(filterQuery) : undefined;
  };

  // State to store available actions
  const [availableActions, setAvailableActions] = useState<any[]>([]);
  const [relations, setRelations] = useState<any[]>([]);

  // Fetch entity data
  const {
    data: queryData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [entityName, currentPage, pageSize, filters],
    queryFn: async () => {
      try {
        // First, try to get the schema (world table) to understand the entity structure
        if (!schema) {
          // Fetch schema information from world entity
          const worldResponse = await daptinClient.jsonApi.findAll('world', {
            query: JSON.stringify([
              {
                column: 'table_name',
                operator: 'eq',
                value: entityName,
              },
            ]),
          });

          if (worldResponse.errors && worldResponse.errors.length) {
            throw new Error(worldResponse.errors[0].detail || `Failed to get schema for ${entityName}`);
          }

          if (worldResponse.data && worldResponse.data.length > 0) {
            const schemaData = worldResponse.data[0];
            setSchema(schemaData);

            // Parse column information from schema
            try {
              // Extract column information directly from the world table's columns_info JSON
              const columnsInfo = schemaData.columns_info || {};

              // Also fetch detailed column information if available
              let columnsResponse;
              try {
                columnsResponse = await daptinClient.jsonApi.findAll('column', {
                  query: JSON.stringify([
                    {
                      column: 'table_name',
                      operator: 'eq',
                      value: entityName,
                    },
                  ]),
                  sort: 'column_position',
                });
              } catch (err) {
                console.log('Column info not available, using schema info only');
              }

              let normalizedColumns = [];

              if (columnsResponse && columnsResponse.data && columnsResponse.data.length > 0) {
                // Use detailed column information when available
                normalizedColumns = columnsResponse.data
                  .filter((col: any) =>
                    !['permission', 'id', 'version'].includes(col.column_name.toLowerCase())
                  )
                  .map((col: any) => ({
                    key: col.column_name,
                    name: col.column_name
                      .split('_')
                      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' '),
                    type: col.column_type,
                    isNullable: col.is_nullable,
                    isUnique: col.is_unique,
                    isPrimaryKey: col.is_primary_key,
                    isForeignKey: col.is_foreign_key,
                    defaultValue: col.default_value,
                    dataType: col.data_type,
                    validations: col.validations,
                    conformations: col.conformations,
                    columnType: col.column_type,
                    relationName: col.relation_name,
                  }));
              } else {
                // Fall back to schema columns_info
                normalizedColumns = Object.entries(columnsInfo)
                  .filter(([key]) => !['permission', 'id', 'version'].includes(key.toLowerCase()))
                  .map(([key, info]: [string, any]) => ({
                    key,
                    name: key
                      .split('_')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' '),
                    type: info.columnType || 'string',
                    isNullable: info.isNullable,
                    isUnique: info.isUnique,
                    isPrimaryKey: key === 'id',
                    isForeignKey: info.isForeignKey,
                    defaultValue: info.defaultValue,
                    dataType: info.dataType,
                    columnType: info.columnType,
                    relationName: info.relationName,
                    options: info.options,
                  }));
              }

              setColumns(normalizedColumns);

              // Fetch available actions for this entity
              try {
                const actionsResponse = await daptinClient.jsonApi.findAll('action', {
                  query: JSON.stringify([
                    {
                      column: 'on_type',
                      operator: 'eq',
                      value: entityName,
                    },
                  ]),
                });

                if (actionsResponse.data && actionsResponse.data.length > 0) {
                  setAvailableActions(actionsResponse.data);
                }
              } catch (actionError) {
                console.warn('Error fetching actions:', actionError);
              }

              // Fetch relations for this entity
              try {
                const relationsResponse = await daptinClient.jsonApi.findAll('relation', {
                  query: JSON.stringify([
                    {
                      column: 'subject',
                      operator: 'eq',
                      value: entityName,
                    },
                  ]),
                });

                if (relationsResponse.data && relationsResponse.data.length > 0) {
                  setRelations(relationsResponse.data);
                }
              } catch (relationError) {
                console.warn('Error fetching relations:', relationError);
              }

            } catch (columnsError) {
              console.error('Error processing schema information:', columnsError);
              // Fall back to basic schema extraction
              const schemaColumns = Object.keys(columnsInfo || {})
                .filter(key => !['permission', 'id', 'version'].includes(key.toLowerCase()))
                .map(key => ({
                  key,
                  name: key
                    .split('_')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' '),
                  type: 'string',  // default
                }));
              setColumns(schemaColumns);
            }
          }
        }

        // Main data query
        const response = await daptinClient.jsonApi.findAll(entityName, {
          'page[size]': pageSize.toString(),
          'page[number]': currentPage.toString(),
          sort: '-created_at',
          query: parseFilters(),
        });

        if (response.errors && response.errors.length) {
          throw new Error(response.errors[0].detail || `Failed to fetch ${entityName} data`);
        }

        // Calculate total pages
        const totalItems = response.meta?.total || response.data.length;
        setTotalPages(Math.ceil(totalItems / pageSize));

        return response.data;
      } catch (err) {
        console.error(`Error fetching ${entityName} data:`, err);
        throw err;
      }
    },
  });

  // Update data state when query data changes
  useEffect(() => {
    if (queryData) {
      setData(queryData);
    }
  }, [queryData]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (newItem: any) => {
      const response = await daptinClient.jsonApi.create(entityName, newItem);
      if (response.errors && response.errors.length) {
        throw new Error(response.errors[0].detail || 'Failed to create item');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [entityName] });
      toast({
        title: 'Success',
        description: 'Item created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to create item',
        description: error.message || 'An error occurred',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, item }: { id: string; item: any }) => {
      const response = await daptinClient.jsonApi.update(entityName, {
        id,
        ...item,
      });
      if (response.errors && response.errors.length) {
        throw new Error(response.errors[0].detail || 'Failed to update item');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [entityName] });
      toast({
        title: 'Success',
        description: 'Item updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to update item',
        description: error.message || 'An error occurred',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await daptinClient.jsonApi.destroy(entityName, id);
      if (response.errors && response.errors.length) {
        throw new Error(response.errors[0].detail || 'Failed to delete item');
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [entityName] });
      toast({
        title: 'Success',
        description: 'Item deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to delete item',
        description: error.message || 'An error occurred',
      });
    },
  });

  // Exposed functions
  const createItem = async (item: any) => {
    return createMutation.mutateAsync(item);
  };

  const updateItem = async (id: string, item: any) => {
    return updateMutation.mutateAsync({ id, item });
  };

  const deleteItem = async (id: string) => {
    return deleteMutation.mutateAsync(id);
  };

  const fetchData = () => {
    refetch();
  };

  const refresh = () => {
    refetch();
  };

  // Execute custom action on an entity
  const executeAction = async (actionName: string, payload: any) => {
    try {
      // Check if the action exists
      const action = availableActions.find(a => a.name === actionName);
      if (!action) {
        throw new Error(`Action '${actionName}' not found for entity '${entityName}'`);
      }

      // Execute the action
      const response = await daptinClient.actionManager.doAction(
        entityName,
        actionName,
        payload
      );

      // Force refresh data after action
      await refetch();

      toast({
        title: 'Success',
        description: `Action ${actionName} executed successfully`,
      });

      return response;
    } catch (error) {
      console.error(`Error executing action ${actionName}:`, error);
      toast({
        variant: 'destructive',
        title: `Failed to execute ${actionName}`,
        description: error instanceof Error ? error.message : 'An error occurred',
      });
      throw error;
    }
  };

  const contextValue: EntityContextType = {
    entityName,
    data,
    schema,
    isLoading,
    error,
    fetchData,
    createItem,
    updateItem,
    deleteItem,
    executeAction,
    selectedItem,
    setSelectedItem,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    filters,
    setFilters,
    showCreateDialog,
    setShowCreateDialog,
    showEditDialog,
    setShowEditDialog,
    showDeleteDialog,
    setShowDeleteDialog,
    showFilterDialog,
    setShowFilterDialog,
    columns,
    availableActions,
    relations,
    refresh,
  };

  return (
    <EntityContext.Provider value={contextValue}>
      {children}
    </EntityContext.Provider>
  );
};

// Custom hook to use the entity context
export const useEntityData = () => {
  const context = useContext(EntityContext);
  if (context === undefined) {
    throw new Error('useEntityData must be used within an EntityDataProvider');
  }
  return context;
};
