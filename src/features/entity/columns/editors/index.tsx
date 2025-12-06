// src/components/entity/columns/editors/index.ts
import { ColumnDefinition, ColumnEditorProps, ColumnType } from '../types'
import { getComponentCategory } from '../typeMapping'
import { getColumnType } from '../utils'
import BooleanColumnEditor from './BooleanColumnEditor'
import DateColumnEditor from './DateColumnEditor'
import FileColumnEditor from './FileColumnEditor'
import ForeignKeyColumnEditor from './ForeignKeyColumnEditor'
import JsonColumnEditor from './JsonColumnEditor'
import NumberColumnEditor from './NumberColumnEditor'
import PasswordColumnEditor from './PasswordColumnEditor'
import PermissionColumnEditor from './PermissionColumnEditor'
import TextColumnEditor from './TextColumnEditor'

// Map component categories to their editor components
const EDITOR_MAP = {
  text: TextColumnEditor,
  password: PasswordColumnEditor,
  number: NumberColumnEditor,
  date: DateColumnEditor,
  boolean: BooleanColumnEditor,
  json: JsonColumnEditor,
  file: FileColumnEditor,
  foreignKey: ForeignKeyColumnEditor,
  permission: PermissionColumnEditor,
} as const

/**
 * Get the column editor component for a specific column type
 */
export function getColumnEditor(columnType: ColumnType) {
  const category = getComponentCategory(columnType)
  return EDITOR_MAP[category]
}

/**
 * Default column editor that redirects to appropriate component based on column type
 */
export const DefaultColumnEditor: React.FC<ColumnEditorProps> = (props) => {
  const columnType = getColumnType(props.column)
  const Editor = getColumnEditor(columnType)
  return <Editor {...props} />
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
  PasswordColumnEditor,
}
