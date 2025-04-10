import React, { createContext, useState } from 'react';
import { Relation, RelationDirection } from '../relations/relations-utils'
import { BaseRelationsContextType, BaseRelationsProvider } from './BaseRelationsProvider'


// Define the entity relations context type
export interface EntityRelationsContextType extends BaseRelationsContextType {
  activeRelation: Relation | null
  setActiveRelation: React.Dispatch<React.SetStateAction<Relation | null>>
  activeDirection: RelationDirection | null
  setActiveDirection: React.Dispatch<React.SetStateAction<RelationDirection | null>>
}

// Create the entity relations context
export const EntityRelationsContext = createContext<
  EntityRelationsContextType | undefined
>(undefined)

// Create a provider component for the entity relations context
export const EntityRelationsProvider: React.FC<{
  children: React.ReactNode
  entityName: string
}> = ({ children, entityName }) => {
  const [activeRelation, setActiveRelation] = useState<Relation | null>(null)
  const [activeDirection, setActiveDirection] = useState<RelationDirection | null>(null)

  // Entity relations specific context
  const entityRelationsContextValue: Partial<EntityRelationsContextType> = {
    activeRelation,
    setActiveRelation,
    activeDirection,
    setActiveDirection,
  }

  return (
    <BaseRelationsProvider
      entityName={entityName}
      context={EntityRelationsContext}
      contextValue={entityRelationsContextValue}
    >
      {children}
    </BaseRelationsProvider>
  )
}
