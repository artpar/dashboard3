// src/components/entity/columns/ColumnComponentManager.tsx
import React from 'react';
import { DefaultColumnEditor, getColumnEditorForColumn } from './editors';
import { getFormatterForColumn } from './formatters';
import { ColumnComponentMap, ColumnDefinition, ColumnEditorProps, ColumnType, ColumnViewerProps, FormatterFunction } from './types';
import { getColumnDisplayName, getColumnType, isColumnEditable } from './utils';
import { DefaultColumnViewer, getColumnViewerForColumn } from './viewers';


/**
 * Component map that maps column types to their viewer and editor components
 */
const componentMap: Record<ColumnType, ColumnComponentMap> = Object.values(
  ColumnType
).reduce(
  (acc, type) => {
    acc[type] = {
      viewer: getColumnViewerForColumn({
        ColumnName: '',
        Name: '',
        ColumnType: type,
      }),
      editor: getColumnEditorForColumn({
        ColumnName: '',
        Name: '',
        ColumnType: type,
      }),
    }
    return acc
  },
  {} as Record<ColumnType, ColumnComponentMap>
)

/**
 * Class for managing column components based on their type
 */
export class ColumnComponentManager {
  /**
   * Get the viewer component for a column
   */
  static getViewer(
    column: ColumnDefinition
  ): React.ComponentType<ColumnViewerProps> {
    const columnType = getColumnType(column)
    return componentMap[columnType]?.viewer || DefaultColumnViewer
  }

  /**
   * Get the editor component for a column
   */
  static getEditor(
    column: ColumnDefinition
  ): React.ComponentType<ColumnEditorProps> {
    const columnType = getColumnType(column)
    return componentMap[columnType]?.editor || DefaultColumnEditor
  }

  /**
   * Get the formatter function for a column
   */
  static getFormatter(column: ColumnDefinition): FormatterFunction {
    return getFormatterForColumn(column)
  }

  /**
   * Get the display name for a column
   */
  static getDisplayName(column: ColumnDefinition): string {
    return getColumnDisplayName(column)
  }

  /**
   * Check if a column is editable
   */
  static isEditable(column: ColumnDefinition): boolean {
    return isColumnEditable(column)
  }

  /**
   * Render a column viewer for the given value and column definition
   */
  static renderViewer(props: ColumnViewerProps): React.ReactNode {
    const Viewer = this.getViewer(props.column)
    return <Viewer {...props} />
  }

  /**
   * Render a column editor for the given value and column definition
   */
  static renderEditor(props: ColumnEditorProps): React.ReactNode {
    const Editor = this.getEditor(props.column)
    return <Editor {...props} />
  }

  /**
   * Format a value for display based on the column type
   */
  static formatValue(value: any, column: ColumnDefinition): React.ReactNode {
    const formatter = this.getFormatter(column)
    return formatter(value, column)
  }
}

/**
 * Component for displaying a column value
 */
export const ColumnViewer: React.FC<ColumnViewerProps> = (props) => {
  return ColumnComponentManager.renderViewer(props)
}

/**
 * Component for editing a column value
 */
export const ColumnEditor: React.FC<ColumnEditorProps> = (props) => {
  return ColumnComponentManager.renderEditor(props)
}

export default ColumnComponentManager
