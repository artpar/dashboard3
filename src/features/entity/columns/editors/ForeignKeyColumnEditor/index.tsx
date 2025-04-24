import React, { useEffect, useState } from 'react'
import { useWorldEntities } from '@/hooks/use-world-entities'
import { EntityReferenceEditor } from './EntityReference'
import { FileReferenceEditor } from './FileReference'
import { ForeignKeyColumnEditorProps } from './types.js'

export const DAPTIN_ENDPOINT = import.meta.env.VITE_DAPTIN_URL

/**
 * Component for editing foreign key values
 */
export const ForeignKeyColumnEditor: React.FC<ForeignKeyColumnEditorProps> = ({
  value,
  column,
  onChange,
  onBlur,
  className,
  error,
  entity,
  disabled,
  placeholder,
}) => {
  const [labelColumn, setLabelColumn] = useState<string | null>(null)
  const { entities } = useWorldEntities()

  // Get the referenced entity from the column's ForeignKeyData
  const referencedEntity = column.ForeignKeyData?.Namespace || ''
  const dataSource = column.ForeignKeyData?.DataSource || ''
  const columnType = column.ColumnType || ''

  // Determine if this is a file reference column
  const isFileReference =
    dataSource === 'cloud_store' || columnType.startsWith('file.')

  // Determine if it's an image based on column type
  const isImage =
    columnType.includes('png') ||
    columnType.includes('jpg') ||
    columnType.includes('jpeg') ||
    columnType.includes('webp') ||
    columnType.includes('gif')

  // Find label column for the referenced entity
  useEffect(() => {
    if (!referencedEntity) return

    // Find the entity in world entities
    const entityMetadata = entities.find(
      (e) => e.table_name === referencedEntity
    )
    if (!entityMetadata || !entityMetadata.world_schema_json) return

    try {
      // Parse the schema to find a label column
      const schema = JSON.parse(entityMetadata.world_schema_json)
      if (!schema || !schema.Columns) return

      // First look for a column with ColumnType 'label'
      let labelCol = schema.Columns.find((col) => col.ColumnType === 'label')

      // If no label column found, look for name, title, or other common label fields
      if (!labelCol) {
        const commonLabelFields = ['name', 'title', 'label', 'display_name']
        for (const fieldName of commonLabelFields) {
          labelCol = schema.Columns.find(
            (col) => col.ColumnName.toLowerCase() === fieldName.toLowerCase()
          )
          if (labelCol) break
        }
      }

      // Set the label column name if found
      setLabelColumn(labelCol ? labelCol.ColumnName : null)
    } catch (err) {
      console.error('Error parsing schema for label column:', err)
    }
  }, [referencedEntity, entities])

  // File references should always be arrays
  // If we receive a non-array value, we'll normalize it
  const normalizedValue = Array.isArray(value) ? value : value ? [value] : []

  // Get asset URL for displaying current image
  const assetUrl =
    entity && column.ColumnName
      ? `${DAPTIN_ENDPOINT}/asset/${entity.__type}/${entity.reference_id}/${column.ColumnName}.png`
      : ''

  // Render appropriate editor based on type
  if (isFileReference) {
    return (
      <FileReferenceEditor
        value={normalizedValue}
        onChange={onChange}
        onBlur={onBlur}
        className={className}
        error={error}
        disabled={disabled}
        isImage={isImage}
        column={column}
        entity={entity}
        assetUrl={assetUrl}
      />
    )
  }

  // Render entity reference editor
  return (
    <EntityReferenceEditor
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      className={className}
      error={error}
      disabled={disabled}
      placeholder={placeholder}
      referencedEntity={referencedEntity}
      labelColumn={labelColumn}
    />
  )
}

export default ForeignKeyColumnEditor
