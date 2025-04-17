// src/components/entity/columns/viewers/index.ts
import PermissionColumnViewer from '@/features/entity/columns/viewers/PermissionColumnViewer.tsx'
import { ColumnDefinition, ColumnType, ColumnViewerProps } from '../types'
import { getColumnType } from '../utils'
import BooleanColumnViewer from './BooleanColumnViewer'
import DateColumnViewer from './DateColumnViewer'
import FileColumnViewer from './FileColumnViewer'
import ForeignKeyColumnViewer from './ForeignKeyColumnViewer'
import JsonColumnViewer from './JsonColumnViewer'
import NumberColumnViewer from './NumberColumnViewer'
import PasswordColumnViewer from './PasswordColumnViewer'
import TextColumnViewer from './TextColumnViewer'


// import ForeignKeyColumnViewer from './ForeignKeyColumnViewer';

/**
 * Default column viewer that redirects to appropriate component based on column type
 */
export const DefaultColumnViewer: React.FC<ColumnViewerProps> = (props) => {
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
    case ColumnType.Id:
      return <TextColumnViewer {...props} />
    case ColumnType.Password:
      return <PasswordColumnViewer {...props} />
    case ColumnType.Permission:
      return <PermissionColumnViewer {...props} />

    case ColumnType.DateTime:
    case ColumnType.Date:
    case ColumnType.Time:
    case ColumnType.Timestamp:
      return <DateColumnViewer {...props} />

    case ColumnType.NumberInt:
    case ColumnType.NumberFloat:
    case ColumnType.Money:
    case ColumnType.Measurement:
    case ColumnType.Rating5:
    case ColumnType.Rating10:
    case ColumnType.Rating100:
    case ColumnType.Latitude:
    case ColumnType.Longitude:
      return <NumberColumnViewer {...props} />

    case ColumnType.Boolean:
      return <BooleanColumnViewer {...props} />

    case ColumnType.Json:
      return <JsonColumnViewer {...props} />

    case ColumnType.File:
      return <FileColumnViewer {...props} />

    // case ColumnType.ForeignKey:
    //   return <ForeignKeyColumnViewer {...props} />;

    default:
      return <TextColumnViewer {...props} />
  }
}

/**
 * Get the column viewer component for a specific column type
 */
export function getColumnViewer(columnType: ColumnType) {
  // console.log('GetColumnViewer', columnType)
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
    case ColumnType.Id:
      return TextColumnViewer

    case ColumnType.Password:
      return PasswordColumnViewer

    case ColumnType.DateTime:
    case ColumnType.Date:
    case ColumnType.Time:
    case ColumnType.Timestamp:
      return DateColumnViewer

    case ColumnType.NumberInt:
    case ColumnType.NumberFloat:
    case ColumnType.Money:
    case ColumnType.Measurement:
    case ColumnType.Rating5:
    case ColumnType.Rating10:
    case ColumnType.Rating100:
    case ColumnType.Latitude:
    case ColumnType.Longitude:
      return NumberColumnViewer

    case ColumnType.Boolean:
      return BooleanColumnViewer

    case ColumnType.Json:
      return JsonColumnViewer

    case ColumnType.File:
      return FileColumnViewer

    case ColumnType.ForeignKey:
      return ForeignKeyColumnViewer

    case ColumnType.Permission:
      return PermissionColumnViewer

    default:
      return TextColumnViewer
  }
}

/**
 * Get the appropriate column viewer component for a specific column
 */
export function getColumnViewerForColumn(column: ColumnDefinition) {
  const columnType = getColumnType(column)
  return getColumnViewer(columnType)
}

export {
  TextColumnViewer,
  DateColumnViewer,
  NumberColumnViewer,
  BooleanColumnViewer,
  JsonColumnViewer,
  FileColumnViewer,
  PasswordColumnViewer,
}
