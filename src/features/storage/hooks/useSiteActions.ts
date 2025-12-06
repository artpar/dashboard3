import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { daptinClient } from '@/daptin'

interface FileInfo {
  name: string
  path: string
  size: number
  isDir: boolean
  modTime: string
  mimeType?: string
}

interface SiteActionsResult {
  isLoading: boolean
  error: Error | null
  listFiles: (path: string) => Promise<FileInfo[]>
  getFile: (path: string) => Promise<{ content: string; mimeType: string }>
  deleteFile: (path: string) => Promise<void>
  syncStorage: () => Promise<void>
}

/**
 * Hook for site entity actions
 *
 * Available actions on site:
 * - list_files: Lists files and directories at a path
 * - get_file: Gets a specific file content
 * - delete_file: Deletes a file
 * - sync_site_storage: Syncs site with cloud storage
 */
export function useSiteActions(siteId: string): SiteActionsResult {
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Helper to execute site actions
  const executeAction = useCallback(
    async (actionName: string, params: Record<string, any>) => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await daptinClient.actionManager.doAction(
          'site',
          actionName,
          {
            site_id: siteId,
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
    [siteId]
  )

  // List files at a path
  const listFiles = useCallback(
    async (path: string): Promise<FileInfo[]> => {
      try {
        const response = await executeAction('list_files', { path })

        // Parse the response - adjust based on actual API response format
        if (Array.isArray(response)) {
          return response.map((item: any) => ({
            name: item.Name || item.name,
            path: item.Path || item.path,
            size: item.Size || item.size || 0,
            isDir: item.IsDir || item.isDir || item.is_dir || false,
            modTime: item.ModTime || item.modTime || item.mod_time || '',
            mimeType: item.MimeType || item.mimeType || item.mime_type,
          }))
        }

        // Handle response wrapped in an object
        if (response?.data && Array.isArray(response.data)) {
          return response.data.map((item: any) => ({
            name: item.Name || item.name,
            path: item.Path || item.path,
            size: item.Size || item.size || 0,
            isDir: item.IsDir || item.isDir || item.is_dir || false,
            modTime: item.ModTime || item.modTime || item.mod_time || '',
            mimeType: item.MimeType || item.mimeType || item.mime_type,
          }))
        }

        // Handle action response format
        if (response?.[0]?.Attributes?.files) {
          return response[0].Attributes.files.map((item: any) => ({
            name: item.Name || item.name,
            path: item.Path || item.path,
            size: item.Size || item.size || 0,
            isDir: item.IsDir || item.isDir || item.is_dir || false,
            modTime: item.ModTime || item.modTime || item.mod_time || '',
            mimeType: item.MimeType || item.mimeType || item.mime_type,
          }))
        }

        return []
      } catch (err) {
        console.error('Failed to list files:', err)
        return []
      }
    },
    [executeAction]
  )

  // Get file content
  const getFile = useCallback(
    async (path: string): Promise<{ content: string; mimeType: string }> => {
      const response = await executeAction('get_file', { path })

      // Parse response based on actual API format
      if (response?.[0]?.Attributes) {
        return {
          content: response[0].Attributes.content || response[0].Attributes.data || '',
          mimeType: response[0].Attributes.mimeType || response[0].Attributes.mime_type || 'application/octet-stream',
        }
      }

      return {
        content: response?.content || response?.data || '',
        mimeType: response?.mimeType || response?.mime_type || 'application/octet-stream',
      }
    },
    [executeAction]
  )

  // Delete file
  const deleteFile = useCallback(
    async (path: string): Promise<void> => {
      await executeAction('delete_file', { path })
      queryClient.invalidateQueries({
        queryKey: ['site-files', siteId],
      })
    },
    [executeAction, queryClient, siteId]
  )

  // Sync site storage
  const syncStorage = useCallback(async (): Promise<void> => {
    await executeAction('sync_site_storage', {})
    queryClient.invalidateQueries({
      queryKey: ['site-files', siteId],
    })
  }, [executeAction, queryClient, siteId])

  return {
    isLoading,
    error,
    listFiles,
    getFile,
    deleteFile,
    syncStorage,
  }
}
