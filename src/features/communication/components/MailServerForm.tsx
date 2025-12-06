import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Send, Server, Loader2, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { daptinClient } from '@/daptin'
import {
  MAIL_SERVER_TYPES,
  ENCRYPTION_TYPES,
  AUTH_TYPES,
  PRESET_PROVIDERS,
  getPresetProviderById,
} from '../config/mail-server-options'
import { EntityApiService } from '@/features/entity/services/EntityApiService'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  server_type: z.string().min(1, 'Server type is required'),
  hostname: z.string().min(1, 'Hostname is required'),
  port: z.coerce.number().min(1).max(65535),
  encryption: z.string(),
  authentication_type: z.string(),
  username: z.string().optional(),
  password: z.string().optional(),
  from_email: z.string().email().optional().or(z.literal('')),
  from_name: z.string().optional(),
  enable: z.boolean().default(true),
})

type FormData = z.infer<typeof formSchema>

export function MailServerForm() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<string>('')
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      server_type: 'smtp',
      hostname: '',
      port: 587,
      encryption: 'starttls',
      authentication_type: 'plain',
      username: '',
      password: '',
      from_email: '',
      from_name: '',
      enable: true,
    },
  })

  const watchServerType = form.watch('server_type')
  const watchAuthType = form.watch('authentication_type')

  const handlePresetChange = (presetId: string) => {
    setSelectedPreset(presetId)
    const preset = getPresetProviderById(presetId)
    if (preset) {
      const isSmtp = watchServerType === 'smtp'
      form.setValue('hostname', isSmtp ? preset.smtpHost : preset.imapHost)
      form.setValue('port', isSmtp ? preset.smtpPort : preset.imapPort)
      form.setValue('encryption', preset.encryption)
      form.setValue('authentication_type', preset.authType)
      if (!form.getValues('name')) {
        form.setValue('name', `${preset.label} ${isSmtp ? 'SMTP' : 'IMAP'}`)
      }
    }
  }

  const handleServerTypeChange = (type: string) => {
    form.setValue('server_type', type)
    // Update defaults based on server type
    const serverType = MAIL_SERVER_TYPES.find((t) => t.id === type)
    if (serverType) {
      form.setValue('port', serverType.defaultPort)
      form.setValue('encryption', serverType.defaultEncryption)
    }
    // Re-apply preset if one is selected
    if (selectedPreset && selectedPreset !== 'custom') {
      const preset = getPresetProviderById(selectedPreset)
      if (preset) {
        const isSmtp = type === 'smtp'
        form.setValue('hostname', isSmtp ? preset.smtpHost : preset.imapHost)
        form.setValue('port', isSmtp ? preset.smtpPort : preset.imapPort)
      }
    }
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)
    try {
      // Test connection action would be called here
      // For now, simulate a test
      const result = await daptinClient.actionManager.doAction(
        'mail_server',
        'test_connection',
        {
          hostname: form.getValues('hostname'),
          port: form.getValues('port'),
          encryption: form.getValues('encryption'),
          authentication_type: form.getValues('authentication_type'),
          username: form.getValues('username'),
          password: form.getValues('password'),
        }
      )
      setTestResult('success')
      toast({ title: 'Connection successful', description: 'Mail server is reachable' })
    } catch (error: any) {
      setTestResult('error')
      toast({
        title: 'Connection failed',
        description: error?.message || 'Could not connect to mail server',
        variant: 'destructive',
      })
    } finally {
      setIsTesting(false)
    }
  }

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      await EntityApiService.createEntity('mail_server', {
        name: data.name,
        server_type: data.server_type,
        hostname: data.hostname,
        port: data.port,
        encryption: data.encryption,
        authentication_type: data.authentication_type,
        username: data.username || '',
        password: data.password || '',
        from_email: data.from_email || '',
        from_name: data.from_name || '',
        enable: data.enable,
      })
      toast({ title: 'Mail server created', description: `${data.name} has been configured` })
      navigate({ to: '/communication/email' })
    } catch (error: any) {
      toast({
        title: 'Error creating mail server',
        description: error?.message || 'An error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      {/* Provider Presets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Quick Setup
          </CardTitle>
          <CardDescription>
            Choose a provider preset or configure a custom server
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {PRESET_PROVIDERS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetChange(preset.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${
                  selectedPreset === preset.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }`}
              >
                <preset.icon className="h-6 w-6" />
                <span className="text-sm font-medium text-center">{preset.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Server Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Server Configuration</CardTitle>
          <CardDescription>Configure mail server connection settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Server Name *</Label>
              <Input
                id="name"
                placeholder="My Mail Server"
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="server_type">Server Type *</Label>
              <Select
                value={watchServerType}
                onValueChange={handleServerTypeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select server type" />
                </SelectTrigger>
                <SelectContent>
                  {MAIL_SERVER_TYPES.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hostname">Hostname *</Label>
              <Input
                id="hostname"
                placeholder="smtp.example.com"
                {...form.register('hostname')}
              />
              {form.formState.errors.hostname && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.hostname.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="port">Port *</Label>
              <Input
                id="port"
                type="number"
                placeholder="587"
                {...form.register('port')}
              />
              {form.formState.errors.port && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.port.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="encryption">Encryption</Label>
              <Select
                value={form.watch('encryption')}
                onValueChange={(value) => form.setValue('encryption', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select encryption" />
                </SelectTrigger>
                <SelectContent>
                  {ENCRYPTION_TYPES.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="authentication_type">Authentication</Label>
              <Select
                value={watchAuthType}
                onValueChange={(value) => form.setValue('authentication_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select auth type" />
                </SelectTrigger>
                <SelectContent>
                  {AUTH_TYPES.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authentication */}
      {watchAuthType !== 'none' && (
        <Card>
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>Enter your mail server credentials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="user@example.com"
                {...form.register('username')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Your password or app-specific password"
                  {...form.register('password')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sender Settings (SMTP only) */}
      {watchServerType === 'smtp' && (
        <Card>
          <CardHeader>
            <CardTitle>Sender Settings</CardTitle>
            <CardDescription>Default sender information for outgoing emails</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="from_email">From Email</Label>
                <Input
                  id="from_email"
                  type="email"
                  placeholder="noreply@example.com"
                  {...form.register('from_email')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="from_name">From Name</Label>
                <Input
                  id="from_name"
                  placeholder="My Application"
                  {...form.register('from_name')}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enable/Disable */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enable">Enable Server</Label>
              <p className="text-sm text-muted-foreground">
                Activate this mail server for sending/receiving emails
              </p>
            </div>
            <Switch
              id="enable"
              checked={form.watch('enable')}
              onCheckedChange={(checked) => form.setValue('enable', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleTestConnection}
          disabled={isTesting || !form.watch('hostname')}
        >
          {isTesting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : testResult === 'success' ? (
            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
          ) : testResult === 'error' ? (
            <XCircle className="h-4 w-4 mr-2 text-red-500" />
          ) : (
            <Server className="h-4 w-4 mr-2" />
          )}
          Test Connection
        </Button>

        <div className="flex-1" />

        <Button
          type="button"
          variant="outline"
          onClick={() => navigate({ to: '/communication/email' })}
        >
          Cancel
        </Button>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Create Mail Server
        </Button>
      </div>
    </form>
  )
}
