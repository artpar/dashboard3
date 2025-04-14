import { useState } from 'react'
import { GroupPermissionManager } from '@/features/entity/components/permission/GroupPermissionManager.tsx'
import { VisualPermissionEditor } from '@/features/entity/components/permission/VisualPermissionEditor.tsx'
import {
  useGroupData,
  usePermissionValue,
} from '@/features/entity/hooks/usePermissionValue.ts'
import { PermissionPresetSelector } from '../../components/permission/PermissionPresetSelector'
import { DisplayModeToggle } from '@/features/entity/components/permission/DisplayModeToggle.tsx'

interface PermissionColumnEditorProps {
  value: number
  onChange: (value: number) => void
  onBlur?: () => void
  className?: string
  error?: string
  disabled?: boolean
  entityType?: string
  entityId?: string
}

/**
 * Component for editing permission values with human-readable labels and group-specific permissions
 */
export default function PermissionColumnEditor({
  value,
  onChange,
  onBlur,
  className,
  error,
  disabled,
  entityType,
  entityId,
}: PermissionColumnEditorProps) {
  // Permission value management
  const {
    permissionValue,
    togglePermission,
    toggleAllForScope,
    handlePresetChange,
  } = usePermissionValue(value, onChange)

  // Group data management
  const groupData = useGroupData()

  // Display mode state
  const [displayMode, setDisplayMode] = useState<'visual' | 'groups'>('visual')

  return (
    <div className={`flex flex-col space-y-4 ${className}`}>
      {/* Preset selector and view toggle */}
      <div className='flex w-full items-center space-x-2'>
        <PermissionPresetSelector
          value={permissionValue}
          onValueChange={handlePresetChange}
          disabled={disabled}
          error={error}
        />

        <DisplayModeToggle
          mode={displayMode}
          onChange={setDisplayMode}
          disabled={disabled}
        />
      </div>

      {/* Visual editor */}
      {displayMode === 'visual' && (
        <VisualPermissionEditor
          permissionValue={permissionValue}
          togglePermission={togglePermission}
          toggleAllForScope={toggleAllForScope}
          disabled={disabled}
        />
      )}

      {/* Group permissions mode */}
      {displayMode === 'groups' && (
        <GroupPermissionManager
          selectedGroup={groupData.selectedGroup}
          setSelectedGroup={groupData.setSelectedGroup}
          entityFilter={groupData.entityFilter}
          setEntityFilter={groupData.setEntityFilter}
          objectTypeToAdd={groupData.objectTypeToAdd}
          setObjectTypeToAdd={groupData.setObjectTypeToAdd}
          selectedEntities={groupData.selectedEntities}
          setSelectedEntities={groupData.setSelectedEntities}
          showAddObjectDialog={groupData.showAddObjectDialog}
          setShowAddObjectDialog={groupData.setShowAddObjectDialog}
          groups={groupData.groups || []}
          filteredTables={groupData.filteredTables}
          groupObjects={groupData.groupObjects || {}}
          entityOptions={groupData.entityOptions || []}
          refetchEntityOptions={groupData.refetchEntityOptions}
          addEntityToGroup={groupData.addEntityToGroup}
          removeEntityFromGroup={groupData.removeEntityFromGroup}
          toggleObjectPermission={groupData.toggleObjectPermission}
          disabled={disabled}
        />
      )}

      {error && <p className='text-sm text-red-500'>{error}</p>}
    </div>
  )
}
