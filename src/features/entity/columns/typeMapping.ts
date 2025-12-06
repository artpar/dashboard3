// Centralized column type to component mapping
// Eliminates duplicate switch statements across editor and viewer index files

import { ColumnType } from './types'

// Groups of column types that share the same component
export const TEXT_TYPES = [
  ColumnType.Text,
  ColumnType.Content,
  ColumnType.Email,
  ColumnType.Name,
  ColumnType.Alias,
  ColumnType.Namespace,
  ColumnType.Color,
  ColumnType.Ipaddress,
  ColumnType.City,
  ColumnType.Country,
  ColumnType.State,
  ColumnType.Pincode,
  ColumnType.Continent,
] as const

export const TEXT_TYPES_WITH_ID = [...TEXT_TYPES, ColumnType.Id] as const

export const NUMBER_TYPES = [
  ColumnType.NumberInt,
  ColumnType.NumberFloat,
  ColumnType.Money,
  ColumnType.Measurement,
  ColumnType.Rating5,
  ColumnType.Rating10,
  ColumnType.Rating100,
  ColumnType.Latitude,
  ColumnType.Longitude,
] as const

export const DATE_TYPES = [
  ColumnType.DateTime,
  ColumnType.Date,
  ColumnType.Time,
  ColumnType.Timestamp,
] as const

// Component category for a given column type
export type ComponentCategory =
  | 'text'
  | 'password'
  | 'number'
  | 'date'
  | 'boolean'
  | 'json'
  | 'file'
  | 'foreignKey'
  | 'permission'

// Get the component category for a column type
export function getComponentCategory(columnType: ColumnType): ComponentCategory {
  if (TEXT_TYPES_WITH_ID.includes(columnType as any)) return 'text'
  if (NUMBER_TYPES.includes(columnType as any)) return 'number'
  if (DATE_TYPES.includes(columnType as any)) return 'date'
  if (columnType === ColumnType.Password) return 'password'
  if (columnType === ColumnType.Boolean) return 'boolean'
  if (columnType === ColumnType.Json) return 'json'
  if (columnType === ColumnType.File) return 'file'
  if (columnType === ColumnType.ForeignKey) return 'foreignKey'
  if (columnType === ColumnType.Permission) return 'permission'
  return 'text' // default fallback
}
