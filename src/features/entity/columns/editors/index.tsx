// src/components/entity/columns/editors/index.ts
import PermissionColumnEditor from '@/features/entity/columns/editors/PermissionColumnEditor.tsx'
import { ColumnDefinition, ColumnEditorProps, ColumnType } from '../types'
import { getColumnType } from '../utils'
import BooleanColumnEditor from './BooleanColumnEditor'
import DateColumnEditor from './DateColumnEditor'
import FileColumnEditor from './FileColumnEditor'
import ForeignKeyColumnEditor from './ForeignKeyColumnEditor'
import JsonColumnEditor from './JsonColumnEditor'
import NumberColumnEditor from './NumberColumnEditor'
import TextColumnEditor from './TextColumnEditor'


/**
 * Default column editor that redirects to appropriate component based on column type
 */
export const DefaultColumnEditor: React.FC<ColumnEditorProps> = (props) => {
  const columnType = getColumnType(props.column)

  switch (columnType) {
    case ColumnType.Text:
    case ColumnType.Content:
    case ColumnType.Email:
    case ColumnType.Name:
    case ColumnType.Alias:
    case ColumnType.Namespace:
    case ColumnType.Color:
    case ColumnType.Ipaddress:
    case ColumnType.City:
    case ColumnType.Country:
    case ColumnType.State:
    case ColumnType.Pincode:
    case ColumnType.Continent:
    case ColumnType.Password:
      return <TextColumnEditor {...props} />

    case ColumnType.DateTime:
    case ColumnType.Date:
    case ColumnType.Time:
    case ColumnType.Timestamp:
      return <DateColumnEditor {...props} />

    case ColumnType.NumberInt:
    case ColumnType.NumberFloat:
    case ColumnType.Money:
    case ColumnType.Measurement:
    case ColumnType.Rating5:
    case ColumnType.Rating10:
    case ColumnType.Rating100:
    case ColumnType.Latitude:
    case ColumnType.Longitude:
      return <NumberColumnEditor {...props} />

    case ColumnType.Boolean:
      return <BooleanColumnEditor {...props} />

    case ColumnType.Json:
      return <JsonColumnEditor {...props} />

    case ColumnType.File:
      return <FileColumnEditor {...props} />

    case ColumnType.ForeignKey:
      return <ForeignKeyColumnEditor {...props} />

    case ColumnType.Permission:
      return <PermissionColumnEditor {...props} />

    default:
      return <TextColumnEditor {...props} />
  }
}

/**
 * Get the column editor component for a specific column type
 */
export function getColumnEditor(columnType: ColumnType) {
  switch (columnType) {
    case ColumnType.Text:
    case ColumnType.Content:
    case ColumnType.Email:
    case ColumnType.Name:
    case ColumnType.Alias:
    case ColumnType.Namespace:
    case ColumnType.Color:
    case ColumnType.Ipaddress:
    case ColumnType.City:
    case ColumnType.Country:
    case ColumnType.State:
    case ColumnType.Pincode:
    case ColumnType.Continent:
    case ColumnType.Password:
      return TextColumnEditor

    case ColumnType.DateTime:
    case ColumnType.Date:
    case ColumnType.Time:
    case ColumnType.Timestamp:
      return DateColumnEditor

    case ColumnType.NumberInt:
    case ColumnType.NumberFloat:
    case ColumnType.Money:
    case ColumnType.Measurement:
    case ColumnType.Rating5:
    case ColumnType.Rating10:
    case ColumnType.Rating100:
    case ColumnType.Latitude:
    case ColumnType.Longitude:
      return NumberColumnEditor

    case ColumnType.Boolean:
      return BooleanColumnEditor

    case ColumnType.Json:
      return JsonColumnEditor

    case ColumnType.File:
      return FileColumnEditor

    case ColumnType.ForeignKey:
      return ForeignKeyColumnEditor

    case ColumnType.Permission:
      return PermissionColumnEditor

    default:
      return TextColumnEditor
  }
}

/**
 * Get the appropriate column editor component for a specific column
 */
export function getColumnEditorForColumn(column: ColumnDefinition) {
  const columnType = getColumnType(column)
  return getColumnEditor(columnType)
}

export {
  TextColumnEditor,
  DateColumnEditor,
  NumberColumnEditor,
  BooleanColumnEditor,
  JsonColumnEditor,
  FileColumnEditor,
  ForeignKeyColumnEditor,
}
