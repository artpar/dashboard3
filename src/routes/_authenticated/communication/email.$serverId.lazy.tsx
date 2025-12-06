import { createLazyFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { daptinClient } from '@/daptin'
import {
  ArrowLeft,
  Server,
  Mail,
  Send,
  CheckCircle,
  XCircle,
  Loader2,
  Settings,
  Shield,
  Key,
  Copy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  getMailServerTypeById,
  getEncryptionTypeById,
  getAuthTypeById,
  MAIL_SERVER_TYPES,
  ENCRYPTION_TYPES,
} from '@/features/communication'

interface MailServerEntity {
  id: string
  reference_id: string
  name: string
  server_type: string
  hostname: string
  port: number
  encryption: string
  authentication_type: string
  username: string
  from_email: string
  from_name: string
  enable: boolean
  created_at: string
  updated_at: string
}

function MailServerDetailPage() {
  const { serverId } = Route.useParams()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('overview')
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [testEmailTo, setTestEmailTo] = useState('')
  const [testEmailSubject, setTestEmailSubject] = useState('Test Email from Daptin')
  const [testEmailBody, setTestEmailBody] = useState('This is a test email sent from your Daptin mail server configuration.')
  const [showSendDialog, setShowSendDialog] = useState(false)

  // Fetch mail server data
  const { data: mailServer, isLoading, error } = useQuery({
    queryKey: ['mail_server', serverId],
    queryFn: async () => {
      const response = await daptinClient.jsonApi.findAll('mail_server', {})
      const servers = response.data as any[]
      const found = servers.find(
        (s) =>
          s.id === serverId ||
          s.reference_id === serverId ||
          s.attributes?.reference_id === serverId
      )
      if (found) {
        if (found.attributes) {
          return {
            id: found.id,
            reference_id: found.attributes.reference_id || found.id,
            ...found.attributes,
          } as MailServerEntity
        }
        return found as MailServerEntity
      }
      throw new Error('Mail server not found')
    },
    enabled: !!serverId,
  })

  const handleTestConnection = async () => {
    if (!mailServer) return
    setIsTesting(true)
    setTestResult(null)
    try {
      await daptinClient.actionManager.doAction(
        'mail_server',
        'test_connection',
        { mail_server_id: mailServer.reference_id }
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

  const handleSendTestEmail = async () => {
    if (!mailServer || !testEmailTo) return
    setIsSendingTest(true)
    try {
      await daptinClient.actionManager.doAction(
        'mail_server',
        'send_mail',
        {
          mail_server_id: mailServer.reference_id,
          to: testEmailTo,
          subject: testEmailSubject,
          body: testEmailBody,
        }
      )
      toast({ title: 'Test email sent', description: `Email sent to ${testEmailTo}` })
      setShowSendDialog(false)
    } catch (error: any) {
      toast({
        title: 'Failed to send email',
        description: error?.message || 'Could not send test email',
        variant: 'destructive',
      })
    } finally {
      setIsSendingTest(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: 'Copied to clipboard' })
  }

  const serverType = getMailServerTypeById(mailServer?.server_type || '')
  const encryptionType = getEncryptionTypeById(mailServer?.encryption || '')
  const authType = getAuthTypeById(mailServer?.authentication_type || '')

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 w-full">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error || !mailServer) {
    return (
      <div className="p-6 w-full">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>Mail server not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="p-6 border-b">
        <Link
          to="/communication/email"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Email Servers
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {serverType?.icon ? (
                <serverType.icon className="h-6 w-6" />
              ) : (
                <Server className="h-6 w-6" />
              )}
              {mailServer.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">
                {serverType?.label || mailServer.server_type}
              </Badge>
              <Badge variant="outline">
                {encryptionType?.label || mailServer.encryption}
              </Badge>
              <Badge variant={mailServer.enable ? 'default' : 'secondary'}>
                {mailServer.enable ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={isTesting}
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : testResult === 'success' ? (
                <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
              ) : testResult === 'error' ? (
                <XCircle className="h-4 w-4 mr-1 text-red-500" />
              ) : (
                <Server className="h-4 w-4 mr-1" />
              )}
              Test Connection
            </Button>
            {mailServer.server_type === 'smtp' && (
              <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Send className="h-4 w-4 mr-1" />
                    Send Test Email
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send Test Email</DialogTitle>
                    <DialogDescription>
                      Send a test email to verify your SMTP configuration
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="to">To *</Label>
                      <Input
                        id="to"
                        type="email"
                        placeholder="recipient@example.com"
                        value={testEmailTo}
                        onChange={(e) => setTestEmailTo(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        value={testEmailSubject}
                        onChange={(e) => setTestEmailSubject(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="body">Body</Label>
                      <Textarea
                        id="body"
                        rows={4}
                        value={testEmailBody}
                        onChange={(e) => setTestEmailBody(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowSendDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSendTestEmail}
                      disabled={isSendingTest || !testEmailTo}
                    >
                      {isSendingTest ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-1" />
                      )}
                      Send
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            <Link to={`/mail_server/${serverId}`}>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col h-full"
        >
          <div className="border-b px-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="p-6 overflow-auto">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Connection Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Connection Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Server Type</span>
                    <span className="font-medium">
                      {serverType?.label || mailServer.server_type}
                    </span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Hostname</span>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-muted px-2 py-0.5 rounded">
                        {mailServer.hostname}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(mailServer.hostname)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Port</span>
                    <span className="font-medium">{mailServer.port}</span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Encryption</span>
                    <Badge variant="outline">
                      <Shield className="h-3 w-3 mr-1" />
                      {encryptionType?.label || mailServer.encryption}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Authentication */}
              <Card>
                <CardHeader>
                  <CardTitle>Authentication</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Method</span>
                    <Badge variant="outline">
                      <Key className="h-3 w-3 mr-1" />
                      {authType?.label || mailServer.authentication_type}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Username</span>
                    <span className="font-medium">
                      {mailServer.username || '-'}
                    </span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Password</span>
                    <span className="text-muted-foreground">
                      {mailServer.username ? '••••••••' : '-'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Sender Settings (SMTP only) */}
              {mailServer.server_type === 'smtp' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Sender Settings</CardTitle>
                    <CardDescription>
                      Default sender for outgoing emails
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-muted-foreground">From Email</span>
                      <span className="font-medium">
                        {mailServer.from_email || '-'}
                      </span>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-muted-foreground">From Name</span>
                      <span className="font-medium">
                        {mailServer.from_name || '-'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Metadata */}
              <Card>
                <CardHeader>
                  <CardTitle>Metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Status</span>
                    <span className="flex items-center gap-1">
                      {mailServer.enable ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-green-600">Enabled</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="text-red-600">Disabled</span>
                        </>
                      )}
                    </span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">
                      {mailServer.created_at
                        ? new Date(mailServer.created_at).toLocaleString()
                        : '-'}
                    </span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Updated</span>
                    <span className="font-medium">
                      {mailServer.updated_at
                        ? new Date(mailServer.updated_at).toLocaleString()
                        : '-'}
                    </span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Reference ID</span>
                    <span className="font-mono text-xs">{mailServer.reference_id}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="p-6 overflow-auto">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common operations for this mail server
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Test Connection</div>
                    <div className="text-sm text-muted-foreground">
                      Verify the server is reachable
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                  >
                    {isTesting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Test'
                    )}
                  </Button>
                </div>

                {mailServer.server_type === 'smtp' && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Send Test Email</div>
                      <div className="text-sm text-muted-foreground">
                        Send a test email to verify SMTP configuration
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowSendDialog(true)}
                    >
                      Send Test
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export const Route = createLazyFileRoute(
  '/_authenticated/communication/email/$serverId'
)({
  component: MailServerDetailPage,
})
