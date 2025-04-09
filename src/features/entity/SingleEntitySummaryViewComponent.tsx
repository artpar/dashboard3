import React, { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx'
import { FieldGroup } from '@/features/entity/FieldGroup.tsx'
import { getFieldLabel } from '@/features/entity/GetFieldLabel.tsx'
import { ColumnDefinition, ColumnViewer } from '@/features/entity/columns'
import { Clock, Info, Layers, Tag } from 'lucide-react'

export function SingleEntitySummaryViewComponent({columns, entityItem}: {
  columns: ColumnDefinition[]
  entityItem: any
}) {
  const [fieldGroups, setFieldGroups] = useState<FieldGroup[]>([])

  useEffect(() => {
    if (columns && columns.length > 0 && entityItem) {
      // Categorize fields into groups
      const basicFields = columns
        .filter(
          (col) =>
            !col.ColumnName.includes('_id') &&
            ![
              'id',
              'reference_id',
              'created_at',
              'updated_at',
              'permission',
              'version',
            ].includes(col.ColumnName) &&
            (!col.ForeignKeyData.DataSource ||
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


  return (
    <div className='grid gap-6 md:grid-cols-2'>
      {fieldGroups.slice(0, 2).map((group) => {
        return (
          <Card key={group.id} className='h-fit'>
            <CardHeader className='pb-2'>
              <CardTitle className='flex items-center text-base'>
                {group.icon}
                <span className='ml-2'>{group.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {group.fields.slice(0, 5).map((fieldName) => (
                <div key={fieldName} className='flex flex-col space-y-1'>
                  <div className='text-muted-foreground flex text-sm font-medium'>
                    {getFieldLabel(columns, fieldName)}
                  </div>
                  <div className='flex justify-start text-sm'>
                    <ColumnViewer
                      column={
                        columns.filter(
                          (e) => e.ColumnName === fieldName
                        )[0]
                      }
                      value={entityItem[fieldName]}
                      entity={entityItem}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )
      })}
      <Card  className='h-fit'>
        <CardHeader className='pb-2'>
          <CardTitle className='flex items-center text-base'>

            <span className='ml-2'>Permission</span>
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
            <div className='flex flex-col space-y-1'>
              <div className='text-muted-foreground flex text-sm font-medium'>
                {getFieldLabel(columns, "permission")}
              </div>
              <div className='flex justify-start text-sm'>
                <ColumnViewer
                  column={
                    columns.filter(
                      (e) => e.ColumnName === "permission"
                    )[0]
                  }
                  value={entityItem["permission"]}
                  entity={entityItem}
                />
              </div>
            </div>
        </CardContent>
      </Card>
    </div>
  )
}
