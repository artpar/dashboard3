// src/features/entity/components/relations/RelationGroup.tsx
import React, { useCallback, useState } from 'react'
import { ArrowRightIcon, Loader2Icon, RefreshCwIcon } from 'lucide-react'
import { cn } from '@/lib/utils.ts'
import { Button } from '@/components/ui/button.tsx'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible.tsx'
import { Badge } from '@/components/ui/badge.tsx'
import {
  Relation,
  RelationDirection,
  getRelatedEntityName,
  getRelationLabel,
  getRelationDirectionStyles
} from './relations-utils.ts'
import { useRelationData } from './useRelationData.ts'
import { RelationRecordsList } from './RelationRecordsList.tsx'

interface RelationGroupProps {
  entityName: string
  entityId?: string
  relation: Relation
  direction: RelationDirection
}

/**
 * Component to display and manage a single relation group
 */
export function RelationGroup({ entityName, entityId, relation, direction }: RelationGroupProps) {
  const [isOpen, setIsOpen] = useState(false)
  const relatedEntityName = getRelatedEntityName(relation, entityName)
  const { dirStyles } = useRelationStyles(direction)

  // Get relation data
  const {
    data,
    isLoading,
    isError,
    error,
    fetchData,
    refetch
  } = useRelationData(relation, entityName, entityId, isOpen)

  // Format the relation label parts
  const { sourceLabel, targetLabel, relationLabel } = useRelationLabels(relation, entityName)

  return (
    <div className={cn(
      "overflow-hidden rounded-lg border border-border transition-all duration-200",
      isOpen && dirStyles.borderClass
    )}>
      <Collapsible
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open)
          if (open && !data && !isLoading) {
            fetchData()
          }
        }}
      >
        <CollapsibleTrigger asChild>
          <div className={cn(
            "flex cursor-pointer items-center justify-between p-4 hover:bg-accent/50 transition-colors",
            isOpen && dirStyles.bgClass
          )}>
            <div className="flex items-center space-x-2">
              <div className={cn(
                "rounded-full p-2",
                dirStyles.bgClass
              )}>
                <ArrowRightIcon
                  className={cn(
                    "h-4 w-4",
                    dirStyles.textClass,
                    dirStyles.iconClass
                  )}
                />
              </div>

              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className={cn("font-semibold", dirStyles.textClass)}>
                    {relationLabel}
                  </Badge>

                  <div className="text-sm font-medium">
                    <span className={cn(relation.Subject === entityName ? "font-bold" : "")}>
                      {sourceLabel}
                    </span>
                    <span className="mx-1 text-muted-foreground">→</span>
                    <span className={cn(relation.Object === entityName ? "font-bold" : "")}>
                      {targetLabel}
                    </span>
                  </div>
                </div>

                <p className="text-muted-foreground text-xs">
                  {direction === RelationDirection.Inbound
                    ? `Records that reference this ${entityName}`
                    : `Records referenced by this ${entityName}`}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {isLoading && <Loader2Icon className="h-4 w-4 animate-spin" />}

              {isOpen && !isLoading && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    refetch()
                  }}
                >
                  <RefreshCwIcon className="h-4 w-4" />
                </Button>
              )}

              <Badge
                variant="secondary"
                className={cn(!isOpen && "invisible")}
              >
                {isLoading ? '...' : data?.length || 0} records
              </Badge>

              <div className={cn(
                "h-6 w-6 rounded-full transition-transform",
                isOpen && "rotate-180"
              )}>
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="overflow-hidden transition-all">
          <div className="p-4">
            <RelationRecordsList
              data={data || []}
              isLoading={isLoading}
              isError={isError}
              error={error}
              relatedEntityName={relatedEntityName}
              onRefresh={refetch}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

/**
 * Format relation labels for display
 */
function useRelationLabels(relation: Relation, entityName: string) {
  const sourceLabel = relation.Subject === entityName
    ? `This ${relation.Subject}`
    : relation.Subject;

  const targetLabel = relation.Object === entityName
    ? `This ${relation.Object}`
    : relation.Object;

  const relationLabel = getRelationLabel(relation.Relation);

  return { sourceLabel, targetLabel, relationLabel };
}

/**
 * Calculate direction-based styles
 */
function useRelationStyles(direction: RelationDirection) {
  const dirStyles = getRelationDirectionStyles(direction);
  return { dirStyles };
}
