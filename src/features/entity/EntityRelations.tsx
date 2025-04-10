// src/features/entity/components/relations/EntityRelations.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { RelationsEmpty } from './relations/RelationsEmpty'
import { RelationsList } from './relations/RelationsList'
import { EntityRelationsProvider } from './providers/EntityRelationsProvider'

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
 */
export function EntityRelations({
  entityName,
  entityId,
  relations,
  title = 'Related Records',
  description,
}: EntityRelationsProps) {
  const defaultDescription = `Records connected to this ${entityName}`

  return (
    <Card className='animate-in fade-in-50 duration-300'>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description || defaultDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {relations.length === 0 ? (
          <RelationsEmpty entityName={entityName} />
        ) : (
          <EntityRelationsProvider entityName={entityName}>
            <RelationsList
              entityName={entityName}
              entityId={entityId}
            />
          </EntityRelationsProvider>
        )}
      </CardContent>
    </Card>
  )
}

export default EntityRelations
