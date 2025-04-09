// src/features/entity/components/relations/RelationsList.tsx
import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx'
import { Separator } from '@/components/ui/separator.tsx'
import {
  Relation,
  RelationDirection,
  categorizeRelations,
  getRelationKey,
} from './relations-utils.ts'
import { RelationGroup } from './RelationGroup.tsx'

interface RelationsListProps {
  entityName: string
  entityId?: string
  relations: Relation[]
}

/**
 * List of entity relations, categorized by direction
 */
export function RelationsList({ entityName, entityId, relations }: RelationsListProps) {
  const [activeTab, setActiveTab] = useState<string>('all')

  // Group relations by their relationship to this entity
  const { inbound, outbound, allRelations } = categorizeRelations(relations, entityName)

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
                {allRelations.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="inbound" className="px-4">
              Inbound
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                {inbound.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="outbound" className="px-4">
              Outbound
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                {outbound.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        <Separator className="my-4" />

        <TabsContent value="all" className="space-y-4">
          {allRelations.length > 0 ? (
            allRelations.map((relation) => (
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
          {inbound.length > 0 ? (
            inbound.map((relation) => (
              <RelationGroup
                key={getRelationKey(relation)}
                entityName={entityName}
                entityId={entityId}
                relation={relation}
                direction={RelationDirection.Inbound}
              />
            ))
          ) : (
            <p className="text-muted-foreground py-4 text-center">
              No inbound relations available
            </p>
          )}
        </TabsContent>

        <TabsContent value="outbound" className="space-y-4">
          {outbound.length > 0 ? (
            outbound.map((relation) => (
              <RelationGroup
                key={getRelationKey(relation)}
                entityName={entityName}
                entityId={entityId}
                relation={relation}
                direction={RelationDirection.Outbound}
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
