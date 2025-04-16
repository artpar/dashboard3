import React, { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { categorizeRelations, TableRelation } from '../relations/relations-utils'
import { RelationsApiService } from '../services/RelationsApiService'
import { BaseEntityContextType } from '@/features/entity/providers/BaseEntityDataProvider.tsx'

// Base relations context type
export interface BaseRelationsContextType extends BaseEntityContextType {
  entityName: string
  relations: TableRelation[]
  inboundRelations: TableRelation[]
  outboundRelations: TableRelation[]
  isLoading: boolean
  error: Error | null
}

// Create a base provider component for relations
export const BaseRelationsProvider: React.FC<{
  children: React.ReactNode
  entityName: string
  context: React.Context<any>
  contextValue: Partial<BaseRelationsContextType>
}> = ({ children, entityName, context, contextValue }) => {
  const [relations, setRelations] = useState<TableRelation[]>([])
  const [inboundRelations, setInboundRelations] = useState<TableRelation[]>([])
  const [outboundRelations, setOutboundRelations] = useState<TableRelation[]>([])

  // Fetch relations for the entity
  const {
    data: relationsData,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: [`entity-${entityName}-relations`],
    queryFn: async () => {
      return RelationsApiService.fetchEntityRelations(entityName)
    },
    staleTime: 60000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    enabled: !!entityName,
  })

  // Update relations state when query data changes
  useEffect(() => {
    if (relationsData) {
      const { inbound, outbound, allRelations } = categorizeRelations(
        relationsData,
        entityName
      )
      setRelations(allRelations)
      setInboundRelations(inbound)
      setOutboundRelations(outbound)
    }
  }, [relationsData, entityName])

  // Combine base context with provided context
  const baseContextValue: BaseRelationsContextType = {
    entityName,
    relations,
    inboundRelations,
    outboundRelations,
    isLoading,
    error:
      queryError instanceof Error
        ? queryError
        : queryError
          ? new Error(String(queryError))
          : null,
    ...contextValue,
  }

  // Create Provider element with the context value
  const Provider = context.Provider
  return <Provider value={baseContextValue}>{children}</Provider>
}
