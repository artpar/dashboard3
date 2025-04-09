// Helper function to safely serialize circular references
export const safelySerializeData = (data: any): any => {
  // Create a new object to avoid modifying the original
  if (!data) return data

  // Set to keep track of processed objects to detect circular references
  const seen = new WeakSet()

  const replacer = (key: string, value: any) => {
    // If the value is an object (but not null) and we've seen it before, return a simplified version
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        // Return a simplified representation for circular references
        if (value.reference_id) {
          return { reference_id: value.reference_id, __circular: true }
        }
        if (value.id) {
          return { id: value.id, __circular: true }
        }
        return '[Circular Reference]'
      }
      seen.add(value)
    }
    return value
  }

  // Use JSON.parse/stringify to deep clone and handle circular references
  try {
    return JSON.parse(JSON.stringify(data, replacer))
  } catch (err) {
    console.error('Error serializing entity data:', err)
    // Fallback: return a simplified version with just the ID
    if (data.reference_id) {
      return { reference_id: data.reference_id }
    }
    if (data.id) {
      return { id: data.id }
    }
    return {}
  }
}
