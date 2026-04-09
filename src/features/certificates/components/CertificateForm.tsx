import React, { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, ShieldCheck, ShieldAlert, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/components/ui/use-toast'
import { EntityApiService } from '@/features/entity/services/EntityApiService'
import { CERTIFICATE_TYPES, type CertificateType } from '../config/certificate-types'

// Form validation schema
const certificateFormSchema = z.object({
  hostname: z
    .string()
    .min(1, 'Hostname is required')
    .regex(
      /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/,
      'Invalid hostname format'
    ),
  certificate_type: z.enum(['self-signed', 'acme', 'uploaded']),
  email: z.string().email('Valid email required').optional().or(z.literal('')),
  certificate_pem: z.string().optional(),
  private_key_pem: z.string().optional(),
})

type CertificateFormValues = z.infer<typeof certificateFormSchema>

interface CertificateFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export const CertificateForm: React.FC<CertificateFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedType, setSelectedType] = useState<CertificateType | null>(null)

  const form = useForm<CertificateFormValues>({
    resolver: zodResolver(certificateFormSchema),
    defaultValues: {
      hostname: '',
      certificate_type: 'self-signed',
      email: '',
      certificate_pem: '',
      private_key_pem: '',
    },
  })

  const handleTypeChange = (value: CertificateType) => {
    setSelectedType(value)
    form.setValue('certificate_type', value)
    // Clear irrelevant fields when type changes
    if (value !== 'acme') {
      form.setValue('email', '')
    }
    if (value !== 'uploaded') {
      form.setValue('certificate_pem', '')
      form.setValue('private_key_pem', '')
    }
  }

  const onSubmit = async (data: CertificateFormValues) => {
    setIsSubmitting(true)

    try {
      // Create the certificate record first
      const certificateData: Record<string, any> = {
        hostname: data.hostname,
      }

      // If uploading, include the certificate data
      if (data.certificate_type === 'uploaded') {
        if (!data.certificate_pem || !data.private_key_pem) {
          toast({
            variant: 'destructive',
            title: 'Missing certificate data',
            description: 'Please provide both certificate and private key PEM',
          })
          setIsSubmitting(false)
          return
        }
        certificateData.certificate_pem = data.certificate_pem
        certificateData.private_key_pem = data.private_key_pem
      }

      const response = await EntityApiService.createEntity('certificate', certificateData)

      // Get the created certificate ID
      const certId = response?.data?.id || response?.data?.reference_id

      // If self-signed or ACME, trigger the generation action
      if (certId && data.certificate_type !== 'uploaded') {
        const { daptinClient } = await import('@/daptin')
        const actionName =
          data.certificate_type === 'self-signed'
            ? 'self.tls.generate'
            : 'acme.tls.generate'

        const actionParams: Record<string, any> = {
          certificate_id: certId,
        }

        if (data.certificate_type === 'acme' && data.email) {
          actionParams.email = data.email
        }

        try {
          await daptinClient.actionManager.doAction(
            'certificate',
            actionName,
            actionParams
          )

          toast({
            title: 'Success',
            description:
              data.certificate_type === 'self-signed'
                ? 'Self-signed certificate generated successfully'
                : "Let's Encrypt certificate generation initiated",
          })
        } catch (actionError: any) {
          // Certificate was created, but generation failed
          toast({
            variant: 'destructive',
            title: 'Certificate created, but generation failed',
            description:
              actionError.message ||
              'You can try generating the certificate again from the detail page',
          })
        }
      } else {
        toast({
          title: 'Success',
          description: 'Certificate created successfully',
        })
      }

      if (onSuccess) {
        onSuccess()
      } else {
        navigate({ to: '/storage/certificates' })
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to create certificate',
        description: error.message || 'An error occurred',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedTypeConfig = selectedType ? CERTIFICATE_TYPES[selectedType] : null

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Hostname */}
        <Card>
          <CardHeader>
            <CardTitle>Certificate Details</CardTitle>
            <CardDescription>
              Specify the hostname this certificate will secure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="hostname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hostname</FormLabel>
                  <FormControl>
                    <Input placeholder="example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    The domain name this certificate will be used for (e.g.,
                    example.com, api.example.com)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Certificate Type */}
        <Card>
          <CardHeader>
            <CardTitle>Certificate Type</CardTitle>
            <CardDescription>
              Choose how you want to create or obtain the certificate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="certificate_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={(value: CertificateType) => {
                      field.onChange(value)
                      handleTypeChange(value)
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select certificate type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(CERTIFICATE_TYPES).map((type) => {
                        const Icon = type.icon
                        return (
                          <SelectItem key={type.id} value={type.id}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <span>{type.label}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  {selectedTypeConfig && (
                    <FormDescription>
                      {selectedTypeConfig.description}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ACME-specific fields */}
            {selectedType === 'acme' && (
              <>
                <Alert>
                  <ShieldCheck className="h-4 w-4" />
                  <AlertTitle>Let's Encrypt Requirements</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>
                        The hostname must resolve to this Daptin server's IP
                        address
                      </li>
                      <li>Port 80 must be accessible for ACME challenge</li>
                      <li>A valid email is required for registration</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="admin@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Used for Let's Encrypt account registration and renewal
                        notifications
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Self-signed info */}
            {selectedType === 'self-signed' && (
              <Alert>
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Self-Signed Certificate</AlertTitle>
                <AlertDescription>
                  Self-signed certificates are useful for development and
                  internal systems. Browsers will show a security warning when
                  accessing sites using self-signed certificates.
                </AlertDescription>
              </Alert>
            )}

            {/* Upload fields */}
            {selectedType === 'uploaded' && (
              <>
                <Alert>
                  <Upload className="h-4 w-4" />
                  <AlertTitle>Upload Your Certificate</AlertTitle>
                  <AlertDescription>
                    Paste your certificate and private key in PEM format. The
                    private key will be encrypted before storage.
                  </AlertDescription>
                </Alert>

                <FormField
                  control={form.control}
                  name="certificate_pem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Certificate (PEM)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                          className="font-mono text-sm"
                          rows={6}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Paste the full certificate chain in PEM format
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="private_key_pem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Private Key (PEM)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                          className="font-mono text-sm"
                          rows={6}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Paste the private key in PEM format (will be encrypted)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          ) : (
            <Button type="button" variant="outline" asChild>
              <Link to="/storage/certificates">Cancel</Link>
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {selectedType === 'uploaded'
              ? 'Upload Certificate'
              : selectedType === 'acme'
                ? 'Create & Generate (ACME)'
                : 'Create & Generate'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default CertificateForm
