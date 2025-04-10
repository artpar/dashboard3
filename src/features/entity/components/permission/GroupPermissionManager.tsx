// components/GroupPermissionManager.tsx
import { ScrollArea } from '@/components/ui/scroll-area';
import { EntityOption } from '../hooks/useGroupData';
import { GroupSelector } from './GroupSelector';
import { EntityTable } from './EntityTable';
import { AddEntityDialog } from './AddEntityDialog';

interface GroupPermissionManagerProps {
  selectedGroup: string | null;
  setSelectedGroup: (groupId: string) => void;
  entityFilter: string;
  setEntityFilter: (filter: string) => void;
  objectTypeToAdd: string | null;
  setObjectTypeToAdd: (type: string | null) => void;
  selectedEntities: EntityOption[];
  setSelectedEntities: (entities: EntityOption[]) => void;
  showAddObjectDialog: boolean;
  setShowAddObjectDialog: (show: boolean) => void;
  groups: any[];
  filteredTables: any[];
  groupObjects: Record<string, any[]>;
  entityOptions: EntityOption[];
  refetchEntityOptions: () => void;
  addEntityToGroup: () => Promise<void>;
  removeEntityFromGroup: (tableName: string, object: any) => Promise<void>;
  toggleObjectPermission: (object: any, permissionBit: number) => void;
  disabled?: boolean;
}

export function GroupPermissionManager({
  selectedGroup,
  setSelectedGroup,
  entityFilter,
  setEntityFilter,
  objectTypeToAdd,
  setObjectTypeToAdd,
  selectedEntities,
  setSelectedEntities,
  showAddObjectDialog,
  setShowAddObjectDialog,
  groups,
  filteredTables,
  groupObjects,
  entityOptions,
  refetchEntityOptions,
  addEntityToGroup,
  removeEntityFromGroup,
  toggleObjectPermission,
  disabled
}: GroupPermissionManagerProps) {
  return (
    <div className='rounded-md border p-4'>
      <GroupSelector
        selectedGroup={selectedGroup}
        onGroupChange={setSelectedGroup}
        groups={groups}
        entityFilter={entityFilter}
        onFilterChange={setEntityFilter}
        disabled={disabled}
      />

      {/* Entity permissions */}
      {selectedGroup && (
        <div className='mt-4'>
          <ScrollArea className='h-[60vh]'>
            <div className='space-y-4 p-1'>
              {filteredTables &&
                filteredTables.map((table: any) => {
                  const relationName = `${table.table_name}_id`;
                  const objectsInGroup = groupObjects?.[relationName] || [];

                  return (
                    <EntityTable
                      key={table.table_name}
                      table={table}
                      objects={objectsInGroup}
                      onAddClick={() => {
                        setObjectTypeToAdd(table.table_name);
                        setShowAddObjectDialog(true);
                        setSelectedEntities([]);
                      }}
                      onRemoveEntity={removeEntityFromGroup}
                      onTogglePermission={toggleObjectPermission}
                    />
                  );
                })}
            </div>
          </ScrollArea>
        </div>
      )}

      <AddEntityDialog
        open={showAddObjectDialog}
        onOpenChange={setShowAddObjectDialog}
        entityType={objectTypeToAdd}
        entityOptions={entityOptions || []}
        selectedEntities={selectedEntities}
        onSelectedEntitiesChange={setSelectedEntities}
        entityFilter={entityFilter}
        onEntityFilterChange={setEntityFilter}
        onFilterSubmit={refetchEntityOptions}
        onAddEntities={addEntityToGroup}
      />
    </div>
  );
}