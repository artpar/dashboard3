import React from 'react'
import { EntityManagementContent, EntityManagementProps } from '@/features/entity/EntityManagementContent.tsx'
import { CollectionEntityDataProvider } from '@/features/entity/providers/CollectionEntityDataProvider.tsx'
import { useToast } from '@/components/ui/use-toast'

/**
 * Container component that wraps the data provider
 */
export const CollectionEntityManagementComponent: React.FC<
  EntityManagementProps
> = ({ entityName, title, description }) => {
  const { toast } = useToast()

  // Set up keyboard shortcuts for copy/paste
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Ctrl+C or Command+C is pressed
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        // We don't trigger the copy here because we need access to the selected items
        // The copy button in the UI will handle this
        console.log('Copy shortcut detected')
      }

      // Check if Ctrl+V or Command+V is pressed
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        // Try to get clipboard data
        navigator.clipboard.readText()
          .then(text => {
            try {
              // Try to parse the clipboard text as JSON
              const data = JSON.parse(text)

              // Check if it's an array of objects (our expected format)
              if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
                console.log('Valid clipboard data detected, opening paste dialog')
                // The paste dialog will be shown by the EntityDataTable component
                // We just need to dispatch a custom event to trigger it
                window.dispatchEvent(new CustomEvent('entity-paste-trigger', { detail: { data } }))
              }
            } catch (err) {
              // Not valid JSON, ignore
              console.log('Invalid clipboard data format', text, err)
            }
          })
          .catch(err => {
            console.error('Failed to read clipboard:', err)
          })
      }
    }

    // Add event listener
    window.addEventListener('keydown', handleKeyDown)

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [toast])

  return (
    <CollectionEntityDataProvider entityName={entityName}>
      <EntityManagementContent
        entityName={entityName}
        title={
          title ||
          `${entityName.charAt(0).toUpperCase() + entityName.slice(1)}`
        }
        description={description || `Manage ${entityName} records`}
      />
    </CollectionEntityDataProvider>
  )
}

export default CollectionEntityManagementComponent
