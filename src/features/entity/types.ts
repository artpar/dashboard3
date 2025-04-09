// src/features/entity/types.ts
import { ReactNode } from 'react';


/**
 * Represents a group of fields in an entity
 */
export interface FieldGroup {
  /**
   * Unique identifier for the group
   */
  id: string

  /**
   * The display title for the group
   */
  title: string

  /**
   * List of field names in this group
   */
  fields: string[]

  /**
   * Optional icon to display next to the group title
   */
  icon?: ReactNode

  /**
   * Optional name of the tab this group belongs to
   */
  tabName?: string

  /**
   * Optional badge text to display next to the title
   */
  badge?: string

  /**
   * Optional CSS class for the group card
   */
  colorClass?: string

  /**
   * Optional CSS class for the group header
   */
  headerClass?: string

  /**
   * Optional CSS class for the group title
   */
  titleClass?: string

  /**
   * Optional CSS class for the icon background
   */
  iconBgClass?: string

  /**
   * Optional function to render content when fields array is empty
   */
  renderEmpty?: () => ReactNode

  /**
   * Optional card variant - 'default' or 'flat'
   */
  variant?: 'default' | 'flat'

  /**
   * Whether this group should be visually highlighted
   */
  highlighted?: boolean
}
