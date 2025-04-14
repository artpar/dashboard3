import { useState } from 'react'
import { Check, Edit2, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { ColumnDefinition, ColumnViewer } from '@/features/entity/columns'
import { ColumnEditor } from '@/features/entity/columns/ColumnComponentManager'
import { useEntitySingleData } from '@/features/entity/hooks/useEntitySingleData'

interface EditableEntityFieldProps {
  fieldName: string
  column: ColumnDefinition
  value: any
  entity: any
  className?: string
  disabled?: boolean
  showLabel?: boolean
}

export function EditableEntityField({
  fieldName,
  column,
  value,
  entity,
  className = '',
  disabled = false,
  showLabel = false,
}: EditableEntityFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState<any>(value)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentValue, setCurrentValue] = useState<any>(value)
  const { toast } = useToast()
  const { updateItem } = useEntitySingleData()

  // Skip editing for system fields, reference IDs, and permission fields
  const isReadOnly =
    fieldName === 'id' ||
    fieldName === 'reference_id' ||
    fieldName === 'created_at' ||
    fieldName === 'updated_at' ||
    fieldName === 'permission' ||
    column.ColumnType === 'id-col' ||
    column.IsPrimaryKey ||
    disabled

  const startEditing = () => {
    if (isReadOnly) return
    setEditValue(currentValue)
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setEditValue(currentValue)
  }

  const saveChanges = async () => {
    if (editValue === currentValue) {
      setIsEditing(false)
      return
    }

    try {
      setIsSubmitting(true)

      // Prepare update payload with just the changed field
      const updatePayload = {
        [fieldName]: editValue,
      }

      // Update the entity
      await updateItem(updatePayload)
      setCurrentValue(editValue)

      toast({
        title: 'Field updated',
        description: `${column.ColumnName || fieldName} has been updated successfully.`,
        duration: 3000,
      })

      // Update the local value to reflect the change
      setCurrentValue(editValue)

      // Update the UI to show the new value
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating field:', error)
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description:
          error instanceof Error ? error.message : 'Failed to update field',
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // If in edit mode, show editor
  if (isEditing) {
    return (
      <div className={`flex w-full flex-col space-y-2 ${className}`}>
        {showLabel && (
          <div className='text-muted-foreground flex text-sm font-medium'>
            {fieldName}
          </div>
        )}
        {JSON.stringify(editValue)}
        <ColumnEditor
          value={editValue}
          column={column}
          onChange={setEditValue}
          disabled={isSubmitting}
          entity={entity}
          className='w-full'
        />
        <div className='p-2 flex !space-x-4 w-full rounded !border !border-black'>
          <Button
            variant='secondary'
            size='sm'
            onClick={saveChanges}
            disabled={isSubmitting}
          >
            <Check className='mr-1 h-4 w-4' />
            Save
          </Button>
          <Button
            variant='ghost'
            size='sm'
            onClick={cancelEditing}
            disabled={isSubmitting}
          >
            <X className='mr-1 h-4 w-4' />
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  // If not in edit mode, show the value with edit button
  return (
    <div
      className={`group relative flex w-full flex-col items-start space-x-2 ${className}`}
      data-field-name={fieldName}
    >
      {showLabel && (
        <div className='flex text-muted-foreground py-1 text-sm font-medium'>
          {fieldName}
        </div>
      )}
      <ColumnViewer
        column={column}
        value={currentValue}
        entity={entity}
        className='w-full px-2'
      />
      {!isReadOnly && (
        <Button
          variant='ghost'
          size='icon'
          onClick={startEditing}
          className='absolute top-0 -right-0 opacity-0 group-hover:opacity-100'
          title={`Edit ${column.ColumnName || fieldName}`}
        >
          <Edit2 className='h-4 w-4' />
        </Button>
      )}
    </div>
  )
}
