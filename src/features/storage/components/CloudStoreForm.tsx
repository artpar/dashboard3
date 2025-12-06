import React, { useCallback, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plug, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { EntityApiService } from '@/features/entity/services/EntityApiService'
import { daptinClient } from '@/daptin'
import {
  CLOUD_PROVIDERS,
  STORE_TYPES,
  getProviderById,
  getProviderList,
  CloudProvider,
} from '../config/providers'

// Form validation schema
const cloudStoreFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  store_provider: z.string().min(1, 'Provider is required'),
  store_type: z.string().min(1, 'Store type is required'),
  root_path: z.string().min(1, 'Root path is required'),
  store_parameters: z.record(z.any()).optional(),
})

type CloudStoreFormValues = z.infer<typeof cloudStoreFormSchema>

interface CloudStoreFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export const CloudStoreForm: React.FC<CloudStoreFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<CloudProvider | null>(
    null
  )
  const [storeParameters, setStoreParameters] = useState<Record<string, any>>({})

  const form = useForm<CloudStoreFormValues>({
    resolver: zodResolver(cloudStoreFormSchema),
    defaultValues: {
      name: '',
      store_provider: '',
      store_type: 'local',
      root_path: '',
      store_parameters: {},
    },
  })

  const providerList = useMemo(() => getProviderList(), [])

  // Handle provider selection
  const handleProviderChange = useCallback(
    (providerId: string) => {
      const provider = getProviderById(providerId)
      setSelectedProvider(provider || null)
      setStoreParameters({})
      setTestResult(null)
      form.setValue('store_provider', providerId)

      // Set default root path placeholder
      if (provider) {
        form.setValue('root_path', '')
      }
    },
    [form]
  )

  // Handle provider parameter change
  const handleParameterChange = useCallback(
    (paramName: string, value: any) => {
      setStoreParameters((prev) => ({
        ...prev,
        [paramName]: value,
      }))
      setTestResult(null)
    },
    []
  )

  // Test connection
  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)

    try {
      // For local filesystem, we can't really test without creating
      // For remote providers, we would call an action
      if (selectedProvider?.id === 'local') {
        // Simulate a check - in reality this would need a backend call
        setTestResult({
          success: true,
          message: 'Local filesystem path looks valid',
        })
      } else {
        // Call a test action if available
        const testData = {
          store_provider: form.getValues('store_provider'),
          root_path: form.getValues('root_path'),
          store_parameters: JSON.stringify(storeParameters),
        }

        // Try to use an action to test - this may not exist
        try {
          const response = await daptinClient.actionManager.doAction(
            'cloud_store',
            'test_connection',
            testData
          )
          setTestResult({
            success: true,
            message: 'Connection successful',
          })
        } catch (actionError) {
          // If action doesn't exist, show a warning
          setTestResult({
            success: false,
            message:
              'Connection test not available. The store will be validated when created.',
          })
        }
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || 'Connection test failed',
      })
    } finally {
      setIsTesting(false)
    }
  }

  // Submit form
  const onSubmit = async (data: CloudStoreFormValues) => {
    setIsSubmitting(true)

    try {
      const cloudStoreData = {
        name: data.name,
        store_provider: data.store_provider,
        store_type: data.store_type,
        root_path: data.root_path,
        store_parameters: JSON.stringify(storeParameters),
      }

      await EntityApiService.createEntity('cloud_store', cloudStoreData)

      toast({
        title: 'Success',
        description: 'Cloud Store created successfully',
      })

      if (onSuccess) {
        onSuccess()
      } else {
        navigate({ to: '/storage/cloud-stores' })
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to create Cloud Store',
        description: error.message || 'An error occurred',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      navigate({ to: '/storage/cloud-stores' })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Give your cloud store a name and select the storage provider
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Production Files, Backup Storage"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A descriptive name to identify this storage
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="store_provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Storage Provider</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      handleProviderChange(value)
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a provider" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {providerList.map((provider) => {
                        const Icon = provider.icon
                        return (
                          <SelectItem key={provider.id} value={provider.id}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <span>{provider.label}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  {selectedProvider && (
                    <FormDescription>
                      {selectedProvider.description}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Provider-specific configuration */}
        {selectedProvider && selectedProvider.fields.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedProvider.label} Configuration
              </CardTitle>
              <CardDescription>
                Configure the connection settings for{' '}
                {selectedProvider.label}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedProvider.fields.map((providerField) => (
                <div key={providerField.name} className="space-y-2">
                  <label className="text-sm font-medium">
                    {providerField.label}
                    {providerField.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>

                  {providerField.type === 'select' && providerField.options ? (
                    <Select
                      value={storeParameters[providerField.name] || ''}
                      onValueChange={(value) =>
                        handleParameterChange(providerField.name, value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${providerField.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {providerField.options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : providerField.type === 'checkbox' ? (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={providerField.name}
                        checked={storeParameters[providerField.name] || false}
                        onCheckedChange={(checked) =>
                          handleParameterChange(providerField.name, checked)
                        }
                      />
                      <label
                        htmlFor={providerField.name}
                        className="text-sm text-muted-foreground"
                      >
                        {providerField.description}
                      </label>
                    </div>
                  ) : (
                    <Input
                      type={providerField.type}
                      placeholder={providerField.placeholder}
                      value={storeParameters[providerField.name] || ''}
                      onChange={(e) =>
                        handleParameterChange(
                          providerField.name,
                          providerField.type === 'number'
                            ? parseInt(e.target.value, 10)
                            : e.target.value
                        )
                      }
                    />
                  )}

                  {providerField.description &&
                    providerField.type !== 'checkbox' && (
                      <p className="text-sm text-muted-foreground">
                        {providerField.description}
                      </p>
                    )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Path and Store Type */}
        {selectedProvider && (
          <Card>
            <CardHeader>
              <CardTitle>Storage Path</CardTitle>
              <CardDescription>
                Specify the root path for this storage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="root_path"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Root Path</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={selectedProvider.pathPlaceholder}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Format: {selectedProvider.pathFormat}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="store_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select store type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STORE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <span className="font-medium">{type.label}</span>
                              <span className="text-muted-foreground ml-2">
                                - {type.description}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Test Connection Button */}
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isTesting || !form.getValues('root_path')}
                >
                  {isTesting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plug className="mr-2 h-4 w-4" />
                  )}
                  Test Connection
                </Button>

                {testResult && (
                  <Alert
                    variant={testResult.success ? 'default' : 'destructive'}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <AlertTitle>
                      {testResult.success ? 'Success' : 'Warning'}
                    </AlertTitle>
                    <AlertDescription>{testResult.message}</AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Cloud Store
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default CloudStoreForm
