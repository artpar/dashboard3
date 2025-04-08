// src/components/entity/columns/types.ts
import { ReactNode } from 'react'


// Enum of all supported column types
export enum ColumnType {
  // Text types
  Text = 'label',
  Content = 'content',
  Email = 'email',
  Name = 'name',
  Alias = 'alias',
  Namespace = 'namespace',
  Color = 'color',
  Password = 'password',

  // Number types
  NumberInt = 'number-int',
  NumberFloat = 'number-float',
  Money = 'money',
  Measurement = 'measurement',
  Rating5 = 'rating5',
  Rating10 = 'rating10',
  Rating100 = 'rating100',

  // Date/Time types
  DateTime = 'datetime',
  Date = 'date',
  Time = 'time',
  Timestamp = 'timestamp',

  // Boolean types
  Boolean = 'boolean',

  // Complex types
  Json = 'json',
  File = 'file',

  // Location types
  Latitude = 'location-latitude',
  Longitude = 'location-longitude',
  City = 'location-city',
  Country = 'location-country',
  State = 'location-state',
  Pincode = 'location-pincode',
  Continent = 'location-continent',
  Ipaddress = 'ipaddress',

  // Special types
  ForeignKey = 'foreign-key',
  Id = 'id-col',
  Permission = 'permission', // Added the permission type

  // Default type
  Unknown = 'unknown',
}

/**
 * Foreign key data structure
 */
export interface ForeignKeyData {
  DataSource: string
  Namespace: string
  KeyName: string
}

// Interface for column definitions
export interface ColumnDefinition {
  ColumnName: string
  Name: string
  ColumnType?: string
  DataType?: string
  DefaultValue?: any
  IsNullable?: boolean
  IsUnique?: boolean
  IsPrimaryKey?: boolean
  IsForeignKey?: boolean
  ForeignKeyData?: ForeignKeyData
  Options?: ColumnOption[]
  ColumnDescription?: string
  ExcludeFromApi?: boolean
}

export interface ColumnOption {
  Value: string
  Label: string
}

// Interface for column viewer component props
export interface ColumnViewerProps {
  value: any
  column: ColumnDefinition
  className?: string
}

// Interface for column editor component props
export interface ColumnEditorProps {
  value: any
  column: ColumnDefinition
  onChange: (value: any) => void
  onBlur?: () => void
  className?: string
  error?: string
  disabled?: boolean
  placeholder?: string
}

// Interface for the component manager to map types to components
export interface ColumnComponentMap {
  viewer: React.ComponentType<ColumnViewerProps>
  editor: React.ComponentType<ColumnEditorProps>
}

// Map from field type to formatting function
export type FormatterFunction = (
  value: any,
  column?: ColumnDefinition
) => ReactNode
