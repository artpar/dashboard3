/* eslint-disable no-console */
import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { daptinClient } from '@/daptin'
import type { DaptinActionFileInput } from 'daptin-client'
import { useToast } from '@/components/ui/use-toast'

interface CloudStoreActionsResult {
  isLoading: boolean
  error: Error | null
  // Cloud Store actions
  createFolder: (options: { path: string; name: string }) => Promise<void>
  deletePath: (path: string) => Promise<void>
  movePath: (source: string, destination: string) => Promise<void>
  uploadFile: (options: { path: string; file: File }) => Promise<void>
  createSite: (options: {
    hostname: string
    path?: string
    siteType?: string
  }) => Promise<void>
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

  const runCloudStoreAction = useCallback(
    async <T>(actionName: string, action: () => Promise<T>): Promise<T> => {
      setIsLoading(true)
      setError(null)
      console.info('[storage.cloudStore] action:start', {
        actionName,
        cloudStoreId,
      })

      try {
        const response = await action()
        console.info('[storage.cloudStore] action:success', {
          actionName,
          cloudStoreId,
        })
        return response
      } catch (err: unknown) {
        const error = new Error(
          err instanceof Error ? err.message : `Failed to execute ${actionName}`
        )
        console.error('[storage.cloudStore] action:failed', {
          actionName,
          cloudStoreId,
          error,
        })
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
      await runCloudStoreAction('create_folder', () =>
        daptinClient.storageManager.cloudStore.createFolder(cloudStoreId, {
          path: options.path,
          name: options.name,
        })
      )
      toast({
        title: 'Folder Created',
        description: `Folder "${options.name}" has been created`,
      })
    },
    [cloudStoreId, runCloudStoreAction, toast]
  )

  // Delete path (file or folder)
  const deletePath = useCallback(
    async (path: string): Promise<void> => {
      await runCloudStoreAction('delete_path', () =>
        daptinClient.storageManager.cloudStore.deletePath(cloudStoreId, {
          path,
        })
      )
      toast({
        title: 'Deleted',
        description: 'Path has been deleted successfully',
      })
    },
    [cloudStoreId, runCloudStoreAction, toast]
  )

  // Move path (rename or relocate)
  const movePath = useCallback(
    async (source: string, destination: string): Promise<void> => {
      await runCloudStoreAction('move_path', () =>
        daptinClient.storageManager.cloudStore.movePath(cloudStoreId, {
          source,
          destination,
        })
      )
      toast({
        title: 'Moved',
        description: 'Path has been moved successfully',
      })
    },
    [cloudStoreId, runCloudStoreAction, toast]
  )

  // Upload file
  const uploadFile = useCallback(
    async (options: { path: string; file: File }): Promise<void> => {
      const reader = new FileReader()

      return new Promise((resolve, reject) => {
        reader.onload = async () => {
          try {
            const base64Content = reader.result?.toString().split(',')[1] || ''
            const fileInput: DaptinActionFileInput = {
              name: options.file.name,
              type: options.file.type,
              file: base64Content,
            }

            await runCloudStoreAction('upload_file', () =>
              daptinClient.storageManager.cloudStore.uploadFile(cloudStoreId, {
                path: options.path,
                file: fileInput,
              })
            )
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
    [cloudStoreId, runCloudStoreAction, toast]
  )

  // Create site from this cloud store
  const createSite = useCallback(
    async (options: {
      hostname: string
      path?: string
      siteType?: string
    }): Promise<void> => {
      await runCloudStoreAction('create_site', () =>
        daptinClient.storageManager.cloudStore.createSite(cloudStoreId, {
          hostname: options.hostname,
          path: options.path || '/',
          siteType: options.siteType || 'static',
        })
      )
      queryClient.invalidateQueries({
        queryKey: ['cloud-store-sites', cloudStoreId],
      })
      toast({
        title: 'Site Created',
        description: `Site "${options.hostname}" has been created`,
      })
    },
    [runCloudStoreAction, queryClient, cloudStoreId, toast]
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
