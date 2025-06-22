// src/features/entity/relations/RelationsList.tsx
import { useEffect, useState } from 'react'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useEntityRelations } from '../hooks/useEntityRelations'
import { RelationGroup } from './RelationGroup'
import { getRelationKey, TableRelation } from './relations-utils'

interface RelationsListProps {
  entityName: string
  entityId?: string
}

/**
 * Enhanced list of entity relations, with special handling for user_account and usergroup
 * Excludes default relations (user_account_id and usergroup_id) as they have dedicated pages
 */
export function RelationsList({ entityName, entityId }: RelationsListProps) {
  const [activeTab, setActiveTab] = useState<string>('all')

  const { relations, inboundRelations, outboundRelations, isLoading } =
    useEntityRelations()

  // Identify default relations that every entity has (these have dedicated pages)
  const isDefaultRelation = function (e: TableRelation): boolean {
    if (entityName === "user_account" || entityName === "usergroup") {
      return false
    }
    if (e.Relation === 'belongs_to' && e.ObjectName === 'user_account_id') {
      return true
    }
    if (e.Relation === 'has_many' && e.ObjectName === 'usergroup_id') {
      return true
    }
    return false
  }

  // Filter out default relations from all relation lists
  const [relationsToDisplay, setRelationsToDisplay] = useState<TableRelation[]>([])
  const [filteredInboundRelations, setFilteredInboundRelations] = useState<TableRelation[]>([])
  const [filteredOutboundRelations, setFilteredOutboundRelations] = useState<TableRelation[]>([])

  useEffect(() => {
    setRelationsToDisplay(relations.filter((e) => !isDefaultRelation(e)))
    setFilteredInboundRelations(inboundRelations.filter((e) => !isDefaultRelation(e)))
    setFilteredOutboundRelations(outboundRelations.filter((e) => !isDefaultRelation(e)))
  }, [relations, inboundRelations, outboundRelations, isDefaultRelation])

  if (isLoading) {
    return <div className='py-4 text-center'>Loading relations...</div>
  }

  return (
    <div className='space-y-6'>
      {/* Standard Relations Tabs */}
      <Tabs
        defaultValue='all'
        value={activeTab}
        onValueChange={setActiveTab}
        className='w-full'
      >
        <div className='flex items-center justify-between'>
          <TabsList className='grid w-auto grid-cols-3'>
            <TabsTrigger value='all' className='px-4'>
              All Relations
              <span className='bg-muted ml-2 rounded-full px-2 py-0.5 text-xs'>
                {relationsToDisplay.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value='inbound' className='px-4'>
              Inbound
              <span className='bg-muted ml-2 rounded-full px-2 py-0.5 text-xs'>
                {filteredInboundRelations.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value='outbound' className='px-4'>
              Outbound
              <span className='bg-muted ml-2 rounded-full px-2 py-0.5 text-xs'>
                {filteredOutboundRelations.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        <Separator className='my-4' />

        <TabsContent value='all' className='space-y-4'>
          {relationsToDisplay.length > 0 ? (
            relationsToDisplay.map((relation) => (
              <RelationGroup
                key={getRelationKey(relation)}
                entityName={entityName}
                entityId={entityId}
                relation={relation}
                direction={relation.direction}
              />
            ))
          ) : (
            <p className='text-muted-foreground py-4 text-center'>
              No relations available
            </p>
          )}
        </TabsContent>

        <TabsContent value='inbound' className='space-y-4'>
          {filteredInboundRelations.length > 0 ? (
            filteredInboundRelations.map((relation) => (
              <RelationGroup
                key={getRelationKey(relation)}
                entityName={entityName}
                entityId={entityId}
                relation={relation}
                direction={relation.direction}
              />
            ))
          ) : (
            <p className='text-muted-foreground py-4 text-center'>
              No inbound relations available
            </p>
          )}
        </TabsContent>

        <TabsContent value='outbound' className='space-y-4'>
          {filteredOutboundRelations.length > 0 ? (
            filteredOutboundRelations.map((relation) => (
              <RelationGroup
                key={getRelationKey(relation)}
                entityName={entityName}
                entityId={entityId}
                relation={relation}
                direction={relation.direction}
              />
            ))
          ) : (
            <p className='text-muted-foreground py-4 text-center'>
              No outbound relations available
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
