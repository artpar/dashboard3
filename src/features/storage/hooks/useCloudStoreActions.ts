import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'
import { daptinClient } from '@/daptin'

interface CloudStoreActionsResult {
  isLoading: boolean
  error: Error | null
  // Cloud Store actions
  createFolder: (options: { path: string; name: string }) => Promise<void>
  deletePath: (path: string) => Promise<void>
  movePath: (source: string, destination: string) => Promise<void>
  uploadFile: (options: { path: string; file: File }) => Promise<void>
  createSite: (options: { hostname: string; path?: string; siteType?: string }) => Promise<void>
}

/**
 * Hook for cloud_store entity actions
 *
 * Available actions on cloud_store:
 * - create_folder: Creates a new directory
 * - delete_path: Deletes a file or directory
 * - move_path: Moves or renames files/folders
 * - upload_file: Uploads a file
 * - create_site: Creates a new site from this store
 *
 * Note: list_files is on the site entity, not cloud_store
 */
export function useCloudStoreActions(
  cloudStoreId: string
): CloudStoreActionsResult {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Helper to execute cloud store actions
  const executeAction = useCallback(
    async (actionName: string, params: Record<string, any>) => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await daptinClient.actionManager.doAction(
          'cloud_store',
          actionName,
          {
            cloud_store_id: cloudStoreId,
            ...params,
          }
        )
        return response
      } catch (err: any) {
        const error = new Error(err.message || `Failed to execute ${actionName}`)
        setError(error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [cloudStoreId]
  )

  // Create folder
  const createFolder = useCallback(
    async (options: { path: string; name: string }): Promise<void> => {
      await executeAction('create_folder', {
        path: options.path,
        name: options.name,
      })
      toast({
        title: 'Folder Created',
        description: `Folder "${options.name}" has been created`,
      })
    },
    [executeAction, toast]
  )

  // Delete path (file or folder)
  const deletePath = useCallback(
    async (path: string): Promise<void> => {
      await executeAction('delete_path', { path })
      toast({
        title: 'Deleted',
        description: 'Path has been deleted successfully',
      })
    },
    [executeAction, toast]
  )

  // Move path (rename or relocate)
  const movePath = useCallback(
    async (source: string, destination: string): Promise<void> => {
      await executeAction('move_path', {
        source,
        destination,
      })
      toast({
        title: 'Moved',
        description: 'Path has been moved successfully',
      })
    },
    [executeAction, toast]
  )

  // Upload file
  const uploadFile = useCallback(
    async (options: { path: string; file: File }): Promise<void> => {
      // For file uploads, we need to handle the file content
      // The API expects a base64 encoded file or multipart form data
      const reader = new FileReader()

      return new Promise((resolve, reject) => {
        reader.onload = async () => {
          try {
            const base64Content = reader.result?.toString().split(',')[1] || ''
            await executeAction('upload_file', {
              path: options.path,
              file: {
                name: options.file.name,
                type: options.file.type,
                contents: base64Content,
              },
            })
            toast({
              title: 'File Uploaded',
              description: `"${options.file.name}" has been uploaded`,
            })
            resolve()
          } catch (err) {
            reject(err)
          }
        }
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsDataURL(options.file)
      })
    },
    [executeAction, toast]
  )

  // Create site from this cloud store
  const createSite = useCallback(
    async (options: { hostname: string; path?: string; siteType?: string }): Promise<void> => {
      await executeAction('create_site', {
        hostname: options.hostname,
        path: options.path || '/',
        site_type: options.siteType || 'static',
      })
      queryClient.invalidateQueries({
        queryKey: ['cloud-store-sites', cloudStoreId],
      })
      toast({
        title: 'Site Created',
        description: `Site "${options.hostname}" has been created`,
      })
    },
    [executeAction, queryClient, cloudStoreId, toast]
  )

  return {
    isLoading,
    error,
    createFolder,
    deletePath,
    movePath,
    uploadFile,
    createSite,
  }
}
