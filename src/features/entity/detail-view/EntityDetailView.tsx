// src/features/entity/components/detail-view/EntityDetailView.tsx
import { useEffect, useState } from 'react'
import { Clock, Info, Layers, Search, Tag } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  enableTabNavigation?: boolean
}

/**
 * Main component to display entity details in organized field groups
 */
export function EntityDetailView({
  columns,
  entityItem,
  title,
  showSearch = true,
  enableFieldExpansion = true,
  enableTabNavigation = true,
}: EntityDetailViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFields, setExpandedFields] = useState<Record<string, boolean>>(
    {}
  )
  const [fieldGroups, setFieldGroups] = useState<FieldGroup[]>([])
  useEffect(() => {
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
        )
        .map((col) => col.ColumnName)

      const metadataFields = ['reference_id', 'permission', 'version'].filter(
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

  // Content to display based on filtering
  const renderContent = () => (
    <div className='animate-in fade-in-50 space-y-6 duration-300'>
      {filteredGroups.map((group) => (
        <EntityFieldGroup
          key={group.id}
          group={group}
          columns={columns}
          entityItem={entityItem}
          expandedFields={expandedFields}
          toggleFieldExpansion={toggleFieldExpansion}
          enableFieldExpansion={enableFieldExpansion}
        />
      ))}
    </div>
  )

  // Render all content without tabs if tab navigation is disabled
  if (!enableTabNavigation) {
    return (
      <div className='space-y-4'>
        {title && <EntityViewHeader title={title} entityItem={entityItem} />}

        {showSearch && (
          <div className='relative mb-6'>
            <Search className='text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4' />
            <Input
              type='search'
              placeholder='Search fields...'
              className='bg-background pl-9'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}

        {renderContent()}
      </div>
    )
  }

  // Determine which groups go in which tabs
  const mainGroups = fieldGroups.filter(
    (group) => !group.tabName || group.tabName === 'main'
  )
  const otherTabs: Record<string, FieldGroup[]> = {}

  fieldGroups.forEach((group) => {
    if (group.tabName && group.tabName !== 'main') {
      if (!otherTabs[group.tabName]) {
        otherTabs[group.tabName] = []
      }
      otherTabs[group.tabName].push(group)
    }
  })

  return (
    <div className='space-y-4'>
      {title && <EntityViewHeader title={title} entityItem={entityItem} />}

      {showSearch && (
        <div className='relative mb-6'>
          <Search className='text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4' />
          <Input
            type='search'
            placeholder='Search fields...'
            className='bg-background pl-9'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      <Tabs defaultValue='main' className='w-full'>
        <TabsList className='mb-4'>
          <TabsTrigger value='main'>Main Information</TabsTrigger>
          {Object.keys(otherTabs).map((tabName) => (
            <TabsTrigger key={tabName} value={tabName} className='capitalize'>
              {tabName}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent
          value='main'
          className='animate-in fade-in-50 duration-300'
        >
          <div className='space-y-6'>
            {mainGroups.map((group) => (
              <EntityFieldGroup
                key={group.id}
                group={{
                  ...group,
                  fields:
                    filterFieldsBySearch(
                      [group],
                      columns,
                      searchQuery,
                      entityItem
                    )[0]?.fields || [],
                }}
                columns={columns}
                entityItem={entityItem}
                expandedFields={expandedFields}
                toggleFieldExpansion={toggleFieldExpansion}
                enableFieldExpansion={enableFieldExpansion}
              />
            ))}
          </div>
        </TabsContent>

        {Object.entries(otherTabs).map(([tabName, groups]) => (
          <TabsContent
            key={tabName}
            value={tabName}
            className='animate-in fade-in-50 duration-300'
          >
            <div className='space-y-6'>
              {groups.map((group) => (
                <EntityFieldGroup
                  key={group.id}
                  group={{
                    ...group,
                    fields:
                      filterFieldsBySearch(
                        [group],
                        columns,
                        searchQuery,
                        entityItem
                      )[0]?.fields || [],
                  }}
                  columns={columns}
                  entityItem={entityItem}
                  expandedFields={expandedFields}
                  toggleFieldExpansion={toggleFieldExpansion}
                  enableFieldExpansion={enableFieldExpansion}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default EntityDetailView
