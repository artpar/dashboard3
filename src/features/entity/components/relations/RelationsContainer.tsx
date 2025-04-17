// src/features/entity/components/relations/RelationsContainer.tsx
import { EntityRelationsProvider } from '../../providers/EntityRelationsProvider';
import { RelationsEmpty } from '../../relations/RelationsEmpty';
import { RelationsList } from '../../relations/RelationsList';
import { TableRelation } from '../../SingleEntityAllRelationsViewComponent';

interface RelationsContainerProps {
  entityName: string;
  entityId?: string;
  relations: TableRelation[];
}

/**
 * Container component for relations content
 * Handles empty state and wraps content in provider
 */
export function RelationsContainer({
  entityName,
  entityId,
  relations,
}: RelationsContainerProps) {
  if (relations.length === 0) {
    return <RelationsEmpty entityName={entityName} />;
  }

  return (
    <EntityRelationsProvider entityName={entityName}>
      <RelationsList entityName={entityName} entityId={entityId} />
    </EntityRelationsProvider>
  );
}
