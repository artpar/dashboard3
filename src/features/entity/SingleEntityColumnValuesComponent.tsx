import { FieldGroup } from '@/features/entity/FieldGroup.tsx'
import { ColumnDefinition, ColumnViewer } from '@/features/entity/columns'
import { getFieldLabel } from './GetFieldLabel'

export function SingleEntityColumnValuesComponent(props: {
  fieldGroups: FieldGroup[]
  columns: ColumnDefinition[]
  entityItem: any
}) {
  return (
    <div className='space-y-6'>
      {props.fieldGroups.map((group) => {
        return (
          <div key={group.id} className='space-y-4'>
            <div className='flex items-center space-x-2 font-semibold'>
              {group.icon}
              <h3>{group.title}</h3>
            </div>

            <div className='rounded-lg border'>
              <div className='divide-y'>
                {group.fields.sort().map((fieldName, idx) => (
                  <div
                    key={fieldName}
                    className={`flex ${idx % 2 === 0 ? 'bg-muted/50' : ''}`}
                  >
                    <div className='flex w-1/3 px-4 py-3 font-medium'>
                      {getFieldLabel(props.columns, fieldName)}
                    </div>
                    <div className='flex w-2/3 px-4 py-3'>
                      <ColumnViewer
                        column={
                          props.columns.filter(
                            (e) => e.ColumnName === fieldName
                          )[0]
                        }
                        value={props.entityItem[fieldName]}
                        entity={props.entityItem}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
