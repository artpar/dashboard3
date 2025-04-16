import { VisualPermissionEditor } from '@/features/entity/components/permission/VisualPermissionEditor.tsx'
import { usePermissionValue } from '@/features/entity/hooks/usePermissionValue.ts'
import { PermissionPresetSelector } from '../../components/permission/PermissionPresetSelector'

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

  // Log entity information
  console.log('PermissionColumnEditor entity info:', {
    entityType,
    entityId,
  })

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
      </div>

      {/* Visual editor */}
      <VisualPermissionEditor
        permissionValue={permissionValue}
        togglePermission={togglePermission}
        toggleAllForScope={toggleAllForScope}
        disabled={disabled}
      />

      {error && <p className='text-sm text-red-500'>{error}</p>}
    </div>
  )
}
