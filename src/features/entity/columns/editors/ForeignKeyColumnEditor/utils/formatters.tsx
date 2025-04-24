/**
 * Helper function to format file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) {
    return bytes + ' B'
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + ' KB'
  } else if (bytes < 1024 * 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  } else {
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
  }
}

/**
 * Get a display label for an entity item
 */
export const getItemLabel = (item: any, labelColumn: string | null): string => {
  if (!item) return ''

  // First check if we have a pre-computed label
  if (item._computedLabel) {
    return item._computedLabel
  }

  // Otherwise compute it on the fly
  if (labelColumn && item[labelColumn]) {
    return item[labelColumn]
  } else {
    return item.name || item.title || item.label || item.reference_id || 'Unnamed'
  }
}
