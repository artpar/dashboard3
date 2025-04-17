// src/features/entity/SingleEntityAllRelationsViewComponent.tsx
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { RelationsContainer } from './components/relations/RelationsContainer'
import { RelationsHeader } from './components/relations/RelationsHeader'

export interface EntityRelationsProps {
  entityName: string
  entityId?: string
  relations: TableRelation[]
  title?: string
  description?: string
}

export interface TableRelation {
  Subject: string
  SubjectName?: string
  Object: string
  ObjectName?: string
  Relation: string
}

/**
 * Main component for displaying and interacting with entity relations
 * Refactored to use smaller, more focused components
 */
export function SingleEntityAllRelationsViewComponent({
  entityName,
  entityId,
  relations,
  title = 'Related Records',
  description,
}: EntityRelationsProps) {
  const defaultDescription = `Records connected to this ${entityName}`
  const finalDescription = description || defaultDescription

  return (
    <Card className='animate-in fade-in-50 duration-300'>
      <RelationsHeader 
        title={title} 
        description={finalDescription} 
      />
      <CardContent>
        <RelationsContainer 
          entityName={entityName} 
          entityId={entityId} 
          relations={relations} 
        />
      </CardContent>
    </Card>
  )
}

export default SingleEntityAllRelationsViewComponent
