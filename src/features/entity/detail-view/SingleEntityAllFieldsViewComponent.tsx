// src/features/entity/components/detail-view/EntityDetailView.tsx
import { useEffect, useState } from 'react'
import { Clock, Info, Layers, Search, Tag } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ColumnDefinition } from '@/features/entity/columns'
import { FieldGroup, SYSTEM_COLUMNS } from '@/features/entity/types'
import { EntityFieldGroup } from './EntityFieldGroup'
import { EntityViewHeader } from './EntityViewHeader'
import { filterFieldsBySearch} from './entity-detail-utils'


export interface EntityDetailViewProps {
  columns: ColumnDefinition[]
  entityItem: any
  title?: string
  showSearch?: boolean
  enableFieldExpansion?: boolean
}

/**
 * Main component to display entity details in organized field groups
 */
export function SingleEntityAllFieldsViewComponent({
  columns,
  entityItem,
  title,
  showSearch = true,
  enableFieldExpansion = true,
}: EntityDetailViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFields, setExpandedFields] = useState<Record<string, boolean>>(
    {}
  )
  const [fieldGroups, setFieldGroups] = useState<FieldGroup[]>([])
  useEffect(() => {
    console.log("SingleEntityAllFields.usHook", columns, entityItem)
    if (columns && columns.length > 0 && entityItem) {
      // Categorize fields into groups
      const basicFields = columns
        .filter(
          (col) =>
            !col.ColumnName.includes('_id') &&
            !SYSTEM_COLUMNS.includes(col.ColumnName) &&
            (!col.ForeignKeyData || !col.ForeignKeyData.DataSource ||
              col.ForeignKeyData.DataSource.length === 0) &&
            entityItem[col.ColumnName] !== null &&
            entityItem[col.ColumnName] !== undefined
        )
        .map((col) => col.ColumnName)

      console.log('columns', columns)
      const relationFields = columns
        .filter(
          (col) =>
            (col.ForeignKeyData &&
              col.ForeignKeyData.DataSource &&
              col.ForeignKeyData.DataSource.length > 0 &&
              col.ForeignKeyData.Namespace &&
              col.ForeignKeyData.Namespace.length > 0) ||
            (col.ColumnName.endsWith('_id') &&
              !['reference_id'].includes(col.ColumnName))
        ).filter(col => col.ColumnName !== "user_account_id")
        .map((col) => col.ColumnName)

      const metadataFields = ['reference_id', 'user_account_id', 'permission', 'version'].filter(
        (fieldName) =>
          entityItem[fieldName] !== null && entityItem[fieldName] !== undefined
      )

      const timeFields = ['created_at', 'updated_at'].filter(
        (fieldName) =>
          entityItem[fieldName] !== null && entityItem[fieldName] !== undefined
      )

      // Define groups
      const groups: FieldGroup[] = [
        {
          id: 'basic',
          title: 'Basic Information',
          icon: <Info className='h-4 w-4' />,
          fields: basicFields,
        },
      ]

      if (relationFields.length > 0) {
        groups.push({
          id: 'relations',
          title: 'Relations',
          icon: <Layers className='h-4 w-4' />,
          fields: relationFields,
        })
      }

      if (metadataFields.length > 0) {
        groups.push({
          id: 'metadata',
          title: 'Metadata',
          icon: <Tag className='h-4 w-4' />,
          fields: metadataFields,
        })
      }

      if (timeFields.length > 0) {
        groups.push({
          id: 'time',
          title: 'Time Information',
          icon: <Clock className='h-4 w-4' />,
          fields: timeFields,
        })
      }

      console.log('groups', groups)
      setFieldGroups(groups)
    }
  }, [columns, entityItem])
  // Filter fields based on search query
  const filteredGroups = filterFieldsBySearch(
    fieldGroups,
    columns,
    searchQuery,
    entityItem
  )
  // const allFields = getAllFields(fieldGroups)

  // Toggle field expansion
  const toggleFieldExpansion = (fieldName: string) => {
    if (!enableFieldExpansion) return

    setExpandedFields((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }))
  }

  // If no field groups, show a message
  if (fieldGroups.length === 0) {
    return (
      <div className='flex items-center justify-center rounded-lg border border-dashed p-8 text-center'>
        <div className='max-w-sm'>
          <h3 className='text-lg font-medium'>No fields configured</h3>
          <p className='text-muted-foreground mt-2'>
            There are no field groups configured for this entity.
          </p>
        </div>
      </div>
    )
  }

  // If no field groups, show a message
  if (fieldGroups.length === 0) {
    return (
      <div className='flex items-center justify-center rounded-lg border border-dashed p-8 text-center'>
        <div className='max-w-sm'>
          <h3 className='text-lg font-medium'>No fields configured</h3>
          <p className='text-muted-foreground mt-2'>
            There are no field groups configured for this entity.
          </p>
        </div>
      </div>
    )
  }
  return (
    <div className='space-y-4'>
      {title && <EntityViewHeader title={title} entityItem={entityItem} />}

      {showSearch && (
        <div className='relative mb-4'>
          <Search className='text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4' />
          <Input
            type='search'
            placeholder='Search fields...'
            className='bg-background pl-9'
            value={searchQuery}
            onChange={(e) => {
              console.log("Set search query", e.target.value)
              setSearchQuery(e.target.value)
            }}
          />
        </div>
      )}

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {filteredGroups.map((group) => (
          <div key={group.id} className={`h-full col-span-1 ${group.id === 'basic' ? 'lg:col-span-2' : ''}`}>
            <EntityFieldGroup
              group={group}
              columns={columns}
              entityItem={entityItem}
              expandedFields={expandedFields}
              toggleFieldExpansion={toggleFieldExpansion}
              enableFieldExpansion={enableFieldExpansion}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default SingleEntityAllFieldsViewComponent
