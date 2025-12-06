import React, { useState, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Globe,
  FileJson,
  Key,
  Upload,
  Loader2,
  ChevronDown,
  Check,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/ui/use-toast'
import { EntityApiService } from '@/features/entity/services/EntityApiService'
import {
  SPECIFICATION_LANGUAGES,
  SPECIFICATION_FORMATS,
  AUTHENTICATION_TYPES,
  getAuthenticationTypeById,
} from '../config/integration-options'

const integrationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  specification_language: z.string().min(1, 'Specification language is required'),
  specification_format: z.string().min(1, 'Specification format is required'),
  specification: z.string().min(1, 'Specification is required'),
  authentication_type: z.string(),
  authentication_specification: z.string().optional(),
  enable: z.boolean(),
})

type IntegrationFormData = z.infer<typeof integrationSchema>

interface IntegrationFormProps {
  onSuccess?: (id: string) => void
}

export function IntegrationForm({ onSuccess }: IntegrationFormProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [specError, setSpecError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<IntegrationFormData>({
    resolver: zodResolver(integrationSchema),
    defaultValues: {
      name: '',
      specification_language: 'openapi3',
      specification_format: 'json',
      specification: '',
      authentication_type: 'none',
      authentication_specification: '',
      enable: true,
    },
  })

  const selectedAuthType = watch('authentication_type')
  const specFormat = watch('specification_format')
  const authTypeConfig = getAuthenticationTypeById(selectedAuthType)

  // Handle file upload for specification
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setValue('specification', content)
        setSpecError(null)

        // Try to detect format from file extension
        if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
          setValue('specification_format', 'yaml')
        } else if (file.name.endsWith('.json')) {
          setValue('specification_format', 'json')
        } else if (file.name.endsWith('.xml')) {
          setValue('specification_format', 'xml')
        }
      }
      reader.readAsText(file)
    },
    [setValue]
  )

  // Validate JSON specification
  const validateSpec = useCallback((spec: string, format: string) => {
    if (format === 'json') {
      try {
        JSON.parse(spec)
        setSpecError(null)
        return true
      } catch {
        setSpecError('Invalid JSON format')
        return false
      }
    }
    setSpecError(null)
    return true
  }, [])

  // Build auth specification JSON from form fields
  const buildAuthSpec = useCallback((authType: string, formData: Record<string, string>) => {
    if (authType === 'none') return ''
    const authConfig = getAuthenticationTypeById(authType)
    if (!authConfig) return ''

    const spec: Record<string, string> = {}
    authConfig.fields.forEach((field) => {
      if (formData[field.name]) {
        spec[field.name] = formData[field.name]
      }
    })
    return JSON.stringify(spec)
  }, [])

  const onSubmit = async (data: IntegrationFormData) => {
    // Validate spec format
    if (!validateSpec(data.specification, data.specification_format)) {
      return
    }

    setIsSubmitting(true)
    try {
      const result = await EntityApiService.createEntity('integration', {
        name: data.name,
        specification_language: data.specification_language,
        specification_format: data.specification_format,
        specification: data.specification,
        authentication_type: data.authentication_type,
        authentication_specification: data.authentication_specification || '',
        enable: data.enable,
      })

      toast({
        title: 'Integration created',
        description: `Successfully created integration "${data.name}"`,
      })

      const newId = result?.data?.id || result?.data?.attributes?.reference_id
      if (onSuccess && newId) {
        onSuccess(newId)
      } else {
        navigate({ to: '/data/integrations' })
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to create integration',
        description: error?.message || 'An error occurred',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Basic Information
          </CardTitle>
          <CardDescription>
            Configure the basic details for this API integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Integration Name *</Label>
            <Input
              id="name"
              placeholder="e.g., stripe-api, github-api"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Integration</Label>
              <p className="text-sm text-muted-foreground">
                Enable this integration to make it active
              </p>
            </div>
            <Switch
              checked={watch('enable')}
              onCheckedChange={(checked) => setValue('enable', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Specification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            API Specification
          </CardTitle>
          <CardDescription>
            Upload or paste your API specification document
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Specification Language *</Label>
              <Select
                value={watch('specification_language')}
                onValueChange={(value) => setValue('specification_language', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIFICATION_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.id} value={lang.id}>
                      <div className="flex items-center gap-2">
                        <lang.icon className="h-4 w-4" />
                        <span>{lang.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {SPECIFICATION_LANGUAGES.find(l => l.id === watch('specification_language'))?.description}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Format *</Label>
              <Select
                value={watch('specification_format')}
                onValueChange={(value) => setValue('specification_format', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIFICATION_FORMATS.map((format) => (
                    <SelectItem key={format.id} value={format.id}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Specification Document *</Label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".json,.yaml,.yml,.xml"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="spec-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('spec-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Upload File
                </Button>
              </div>
            </div>
            <Textarea
              placeholder={`Paste your ${watch('specification_language').toUpperCase()} specification here...`}
              className="font-mono text-sm min-h-[300px]"
              {...register('specification')}
              onBlur={(e) => validateSpec(e.target.value, specFormat)}
            />
            {specError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{specError}</AlertDescription>
              </Alert>
            )}
            {errors.specification && (
              <p className="text-sm text-destructive">{errors.specification.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Authentication
          </CardTitle>
          <CardDescription>
            Configure how to authenticate with this API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Authentication Type</Label>
            <Select
              value={selectedAuthType}
              onValueChange={(value) => {
                setValue('authentication_type', value)
                setValue('authentication_specification', '')
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select authentication type" />
              </SelectTrigger>
              <SelectContent>
                {AUTHENTICATION_TYPES.map((auth) => (
                  <SelectItem key={auth.id} value={auth.id}>
                    <div className="flex items-center gap-2">
                      <auth.icon className="h-4 w-4" />
                      <span>{auth.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {authTypeConfig?.description}
            </p>
          </div>

          {authTypeConfig && authTypeConfig.fields.length > 0 && (
            <div className="space-y-4 pt-4 border-t">
              <p className="text-sm font-medium">Authentication Details</p>
              <p className="text-xs text-muted-foreground mb-4">
                Enter the authentication credentials as JSON
              </p>
              <Textarea
                placeholder={`{\n${authTypeConfig.fields.map(f => `  "${f.name}": ""`).join(',\n')}\n}`}
                className="font-mono text-sm min-h-[150px]"
                {...register('authentication_specification')}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate({ to: '/data/integrations' })}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Integration'
          )}
        </Button>
      </div>
    </form>
  )
}

export default IntegrationForm
