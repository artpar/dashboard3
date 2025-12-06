// src/components/entity/columns/viewers/index.ts
import { ColumnDefinition, ColumnType, ColumnViewerProps } from '../types'
import { getComponentCategory } from '../typeMapping'
import { getColumnType } from '../utils'
import BooleanColumnViewer from './BooleanColumnViewer'
import DateColumnViewer from './DateColumnViewer'
import FileColumnViewer from './FileColumnViewer'
import ForeignKeyColumnViewer from './ForeignKeyColumnViewer'
import JsonColumnViewer from './JsonColumnViewer'
import NumberColumnViewer from './NumberColumnViewer'
import PasswordColumnViewer from './PasswordColumnViewer'
import PermissionColumnViewer from './PermissionColumnViewer'
import TextColumnViewer from './TextColumnViewer'

// Map component categories to their viewer components
const VIEWER_MAP = {
  text: TextColumnViewer,
  password: PasswordColumnViewer,
  number: NumberColumnViewer,
  date: DateColumnViewer,
  boolean: BooleanColumnViewer,
  json: JsonColumnViewer,
  file: FileColumnViewer,
  foreignKey: ForeignKeyColumnViewer,
  permission: PermissionColumnViewer,
} as const

/**
 * Get the column viewer component for a specific column type
 */
export function getColumnViewer(columnType: ColumnType) {
  const category = getComponentCategory(columnType)
  return VIEWER_MAP[category]
}

/**
 * Default column viewer that redirects to appropriate component based on column type
 */
export const DefaultColumnViewer: React.FC<ColumnViewerProps> = (props) => {
  const columnType = getColumnType(props.column)
  const Viewer = getColumnViewer(columnType)
  return <Viewer {...props} />
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
