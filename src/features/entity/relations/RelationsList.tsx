// src/features/entity/relations/RelationsList.tsx
import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { getRelationKey } from './relations-utils'
import { RelationGroup } from './RelationGroup'
import { useEntityRelations } from '../hooks/useEntityRelations'

interface RelationsListProps {
  entityName: string
  entityId?: string
}

/**
 * List of entity relations, categorized by direction
 */
export function RelationsList({ entityName, entityId }: RelationsListProps) {
  const [activeTab, setActiveTab] = useState<string>('all')

  const {
    relations,
    inboundRelations,
    outboundRelations,
    isLoading
  } = useEntityRelations()

  if (isLoading) {
    return <div className="py-4 text-center">Loading relations...</div>
  }

  return (
    <div className="space-y-4">
      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="flex items-center justify-between">
          <TabsList className="grid w-auto grid-cols-3">
            <TabsTrigger value="all" className="px-4">
              All Relations
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                {relations.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="inbound" className="px-4">
              Inbound
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                {inboundRelations.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="outbound" className="px-4">
              Outbound
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                {outboundRelations.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        <Separator className="my-4" />

        <TabsContent value="all" className="space-y-4">
          {relations.length > 0 ? (
            relations.map((relation) => (
              <RelationGroup
                key={getRelationKey(relation)}
                entityName={entityName}
                entityId={entityId}
                relation={relation}
                direction={relation.direction}
              />
            ))
          ) : (
            <p className="text-muted-foreground py-4 text-center">
              No relations available
            </p>
          )}
        </TabsContent>

        <TabsContent value="inbound" className="space-y-4">
          {inboundRelations.length > 0 ? (
            inboundRelations.map((relation) => (
              <RelationGroup
                key={getRelationKey(relation)}
                entityName={entityName}
                entityId={entityId}
                relation={relation}
                direction={relation.direction}
              />
            ))
          ) : (
            <p className="text-muted-foreground py-4 text-center">
              No inbound relations available
            </p>
          )}
        </TabsContent>

        <TabsContent value="outbound" className="space-y-4">
          {outboundRelations.length > 0 ? (
            outboundRelations.map((relation) => (
              <RelationGroup
                key={getRelationKey(relation)}
                entityName={entityName}
                entityId={entityId}
                relation={relation}
                direction={relation.direction}
              />
            ))
          ) : (
            <p className="text-muted-foreground py-4 text-center">
              No outbound relations available
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
