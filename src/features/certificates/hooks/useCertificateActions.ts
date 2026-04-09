import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { daptinClient } from '@/daptin'

interface GenerateCertResult {
  success: boolean
  message?: string
}

interface CertificateActionsResult {
  isLoading: boolean
  error: Error | null
  generateSelfSigned: () => Promise<GenerateCertResult>
  generateACME: (email: string) => Promise<GenerateCertResult>
}

/**
 * Hook for certificate entity actions
 *
 * Available actions on certificate:
 * - self.tls.generate: Generate a self-signed certificate
 * - acme.tls.generate: Generate a Let's Encrypt certificate via ACME
 */
export function useCertificateActions(certificateId: string): CertificateActionsResult {
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Helper to execute certificate actions
  const executeAction = useCallback(
    async (actionName: string, params: Record<string, any> = {}) => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await daptinClient.actionManager.doAction(
          'certificate',
          actionName,
          {
            certificate_id: certificateId,
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
    [certificateId]
  )

  // Generate self-signed certificate
  const generateSelfSigned = useCallback(async (): Promise<GenerateCertResult> => {
    try {
      const response = await executeAction('self.tls.generate', {})

      // Invalidate certificate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ['certificate', certificateId],
      })

      // Parse response
      const actionResponse = response?.[0]
      if (actionResponse?.ResponseType === 'error') {
        return {
          success: false,
          message: actionResponse.Attributes?.message || 'Failed to generate certificate',
        }
      }

      return {
        success: true,
        message: 'Self-signed certificate generated successfully',
      }
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to generate self-signed certificate',
      }
    }
  }, [executeAction, queryClient, certificateId])

  // Generate ACME (Let's Encrypt) certificate
  const generateACME = useCallback(
    async (email: string): Promise<GenerateCertResult> => {
      if (!email || !email.includes('@')) {
        return {
          success: false,
          message: 'Valid email address required for ACME registration',
        }
      }

      try {
        const response = await executeAction('acme.tls.generate', { email })

        // Invalidate certificate queries to refresh data
        queryClient.invalidateQueries({
          queryKey: ['certificate', certificateId],
        })

        // Parse response
        const actionResponse = response?.[0]
        if (actionResponse?.ResponseType === 'error') {
          return {
            success: false,
            message: actionResponse.Attributes?.message || 'Failed to generate ACME certificate',
          }
        }

        return {
          success: true,
          message: "Let's Encrypt certificate generated successfully",
        }
      } catch (err: any) {
        return {
          success: false,
          message: err.message || 'Failed to generate ACME certificate',
        }
      }
    },
    [executeAction, queryClient, certificateId]
  )

  return {
    isLoading,
    error,
    generateSelfSigned,
    generateACME,
  }
}
