/* eslint-disable no-console */
import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { daptinClient } from '@/daptin'
import type {
  DaptinActionResponse,
  DaptinSiteFileGetAttributes,
  DaptinSiteFileListAttributes,
} from 'daptin-client'

export interface FileInfo {
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

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {}
}

function normalizeFileInfo(item: unknown, currentPath: string): FileInfo {
  const record = asRecord(item)
  const name = String(record.Name || record.name || '')
  const filePath =
    String(record.Path || record.path || '') ||
    (currentPath === '/' || currentPath === ''
      ? `/${name}`
      : `${currentPath}/${name}`)

  return {
    name,
    path: filePath,
    size: Number(record.Size || record.size || 0),
    isDir: Boolean(record.IsDir || record.isDir || record.is_dir || false),
    modTime: String(record.ModTime || record.modTime || record.mod_time || ''),
    mimeType:
      typeof record.MimeType === 'string'
        ? record.MimeType
        : typeof record.mimeType === 'string'
          ? record.mimeType
          : typeof record.mime_type === 'string'
            ? record.mime_type
            : undefined,
  }
}

function readSiteFileList(
  response: DaptinActionResponse<DaptinSiteFileListAttributes>,
  currentPath: string
): FileInfo[] {
  const firstAttributes = response[0]?.Attributes || {}
  const rawFiles = firstAttributes.list || firstAttributes.files

  if (!Array.isArray(rawFiles)) {
    console.warn('[storage.site] list_files returned no file list', {
      currentPath,
      responseTypes: response.map((item) => item.ResponseType),
    })
    return []
  }

  return rawFiles.map((item) => normalizeFileInfo(item, currentPath))
}

function readSiteFileContent(
  response: DaptinActionResponse<DaptinSiteFileGetAttributes>
): { content: string; mimeType: string } {
  const attributes = response[0]?.Attributes || {}
  return {
    content: String(attributes.content || attributes.data || ''),
    mimeType: String(
      attributes.mimeType || attributes.mime_type || 'application/octet-stream'
    ),
  }
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

  const runSiteAction = useCallback(
    async <T>(actionName: string, action: () => Promise<T>): Promise<T> => {
      setIsLoading(true)
      setError(null)
      console.info('[storage.site] action:start', { actionName, siteId })

      try {
        const response = await action()
        console.info('[storage.site] action:success', { actionName, siteId })
        return response
      } catch (err: unknown) {
        const error = new Error(
          err instanceof Error ? err.message : `Failed to execute ${actionName}`
        )
        console.error('[storage.site] action:failed', {
          actionName,
          siteId,
          error,
        })
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
      const response = await runSiteAction('list_files', () =>
        daptinClient.storageManager.site.listFiles(siteId, { path })
      )
      return readSiteFileList(response, path)
    },
    [runSiteAction, siteId]
  )

  // Get file content
  const getFile = useCallback(
    async (path: string): Promise<{ content: string; mimeType: string }> => {
      const response = await runSiteAction('get_file', () =>
        daptinClient.storageManager.site.getFile(siteId, { path })
      )
      return readSiteFileContent(response)
    },
    [runSiteAction, siteId]
  )

  // Delete file
  const deleteFile = useCallback(
    async (path: string): Promise<void> => {
      await runSiteAction('delete_file', () =>
        daptinClient.storageManager.site.deleteFile(siteId, { path })
      )
      queryClient.invalidateQueries({
        queryKey: ['site-files', siteId],
      })
    },
    [runSiteAction, queryClient, siteId]
  )

  // Sync site storage
  const syncStorage = useCallback(async (): Promise<void> => {
    await runSiteAction('sync_site_storage', () =>
      daptinClient.storageManager.site.syncStorage(siteId)
    )
    queryClient.invalidateQueries({
      queryKey: ['site-files', siteId],
    })
  }, [runSiteAction, queryClient, siteId])

  return {
    isLoading,
    error,
    listFiles,
    getFile,
    deleteFile,
    syncStorage,
  }
}
