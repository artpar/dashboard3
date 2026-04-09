import { createLazyFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Clock,
  RefreshCcw,
  Settings,
  XCircle,
  Loader2,
  Copy,
  CheckCircle,
  Globe,
  Mail,
  ExternalLink,
} from 'lucide-react'
import { daptinClient } from '@/daptin'
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
import { useCertificateActions } from '@/features/certificates/hooks/useCertificateActions'
import {
  type CertificateEntity,
  CERTIFICATE_STATUS,
  getCertificateStatus,
  getDKIMRecordName,
  generateDKIMRecord,
} from '@/features/certificates/config/certificate-types'

interface SiteEntity {
  id: string
  reference_id: string
  hostname: string
  enable: boolean
}

function CertificateDetailPage() {
  const { certId } = Route.useParams()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('info')
  const [acmeEmail, setAcmeEmail] = useState('')
  const [isAcmeDialogOpen, setIsAcmeDialogOpen] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const { generateSelfSigned, generateACME, isLoading: isActionsLoading } =
    useCertificateActions(certId)

  // Fetch certificate data
  const {
    data: certificate,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['certificate', certId],
    queryFn: async () => {
      const response = await daptinClient.jsonApi.findAll('certificate', {})
      const certs = response.data as any[]
      if (certs && certs.length > 0) {
        const found = certs.find(
          (c) =>
            c.id === certId ||
            c.reference_id === certId ||
            c.attributes?.reference_id === certId
        )
        if (found) {
          if (found.attributes) {
            return {
              id: found.id,
              reference_id: found.attributes.reference_id || found.id,
              ...found.attributes,
            } as CertificateEntity
          }
          return found as CertificateEntity
        }
      }
      throw new Error('Certificate not found')
    },
    enabled: !!certId,
  })

  // Fetch sites using this certificate (by hostname match)
  const { data: connectedSites } = useQuery({
    queryKey: ['certificate-sites', certificate?.hostname],
    queryFn: async () => {
      if (!certificate?.hostname) return []
      try {
        const response = await daptinClient.jsonApi.findAll('site', {})
        const sites = response.data as any[]
        return sites
          .filter((s) => {
            const hostname = s.attributes?.hostname || s.hostname
            return hostname === certificate.hostname
          })
          .map((s) => ({
            id: s.id,
            reference_id: s.attributes?.reference_id || s.id,
            hostname: s.attributes?.hostname || s.hostname,
            enable: s.attributes?.enable ?? s.enable ?? true,
          })) as SiteEntity[]
      } catch {
        return []
      }
    },
    enabled: !!certificate?.hostname,
  })

  // Certificate status
  const hasCertificate = !!(certificate?.certificate_pem)
  const status = getCertificateStatus(undefined, hasCertificate)
  const statusConfig = CERTIFICATE_STATUS[status]
  const StatusIcon = statusConfig.icon

  // Handle copy to clipboard
  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldName)
      toast({ title: 'Copied to clipboard' })
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      toast({ variant: 'destructive', title: 'Failed to copy' })
    }
  }

  // Handle generate self-signed
  const handleGenerateSelfSigned = async () => {
    const result = await generateSelfSigned()
    toast({
      variant: result.success ? 'default' : 'destructive',
      title: result.success ? 'Success' : 'Error',
      description: result.message,
    })
    if (result.success) {
      refetch()
    }
  }

  // Handle generate ACME
  const handleGenerateACME = async () => {
    if (!acmeEmail) {
      toast({
        variant: 'destructive',
        title: 'Email required',
        description: 'Please enter an email address for ACME registration',
      })
      return
    }
    const result = await generateACME(acmeEmail)
    toast({
      variant: result.success ? 'default' : 'destructive',
      title: result.success ? 'Success' : 'Error',
      description: result.message,
    })
    if (result.success) {
      setIsAcmeDialogOpen(false)
      refetch()
    }
  }

  // DKIM record
  const dkimRecord = certificate?.public_key_pem
    ? generateDKIMRecord(certificate.hostname, certificate.public_key_pem)
    : null
  const dkimRecordName = certificate?.hostname
    ? getDKIMRecordName(certificate.hostname)
    : null

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 w-full">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!certificate) {
    return (
      <div className="p-6 w-full">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>Certificate not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="p-6 border-b">
        <Link
          to="/storage/certificates"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Certificates
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-6 w-6" />
              {certificate.hostname}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={statusConfig.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
              {hasCertificate && (
                <Badge variant="outline">Certificate Present</Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {!hasCertificate && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateSelfSigned}
                  disabled={isActionsLoading}
                >
                  {isActionsLoading ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <ShieldAlert className="h-4 w-4 mr-1" />
                  )}
                  Generate Self-Signed
                </Button>
                <Dialog open={isAcmeDialogOpen} onOpenChange={setIsAcmeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" disabled={isActionsLoading}>
                      <ShieldCheck className="h-4 w-4 mr-1" />
                      Generate ACME
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Generate Let's Encrypt Certificate</DialogTitle>
                      <DialogDescription>
                        Obtain a free, trusted SSL certificate from Let's Encrypt
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <Alert>
                        <ShieldCheck className="h-4 w-4" />
                        <AlertTitle>Requirements</AlertTitle>
                        <AlertDescription>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>
                              {certificate.hostname} must resolve to this server
                            </li>
                            <li>Port 80 must be accessible</li>
                          </ul>
                        </AlertDescription>
                      </Alert>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Email Address
                        </label>
                        <Input
                          type="email"
                          placeholder="admin@example.com"
                          value={acmeEmail}
                          onChange={(e) => setAcmeEmail(e.target.value)}
                        />
                        <p className="text-sm text-muted-foreground">
                          Used for Let's Encrypt registration and renewal notices
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsAcmeDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleGenerateACME}
                        disabled={isActionsLoading || !acmeEmail}
                      >
                        {isActionsLoading && (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        )}
                        Generate Certificate
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
            {hasCertificate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isActionsLoading}
              >
                <RefreshCcw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            )}
            <Link to={`/certificate/${certId}`}>
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
              <TabsTrigger value="info">Information</TabsTrigger>
              <TabsTrigger value="certificate">Certificate</TabsTrigger>
              <TabsTrigger value="dkim">DKIM</TabsTrigger>
              <TabsTrigger value="usage">Usage</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="info" className="p-6 overflow-auto">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Certificate Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Hostname</span>
                    <span className="font-medium">{certificate.hostname}</span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Status</span>
                    <Badge className={statusConfig.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Certificate</span>
                    <span>
                      {hasCertificate ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Present
                        </span>
                      ) : (
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Not Generated
                        </span>
                      )}
                    </span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Private Key</span>
                    <span>
                      {certificate.private_key_pem ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Stored (encrypted)
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">
                      {certificate.created_at
                        ? new Date(certificate.created_at).toLocaleString()
                        : '-'}
                    </span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Updated</span>
                    <span className="font-medium">
                      {certificate.updated_at
                        ? new Date(certificate.updated_at).toLocaleString()
                        : '-'}
                    </span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Reference ID</span>
                    <span className="font-mono text-xs">
                      {certificate.reference_id}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Generate or regenerate certificates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={handleGenerateSelfSigned}
                      disabled={isActionsLoading}
                    >
                      {isActionsLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ShieldAlert className="h-4 w-4 mr-2" />
                      )}
                      {hasCertificate ? 'Regenerate' : 'Generate'} Self-Signed
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsAcmeDialogOpen(true)}
                      disabled={isActionsLoading}
                    >
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      {hasCertificate ? 'Regenerate' : 'Generate'} ACME (Let's Encrypt)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="certificate" className="p-6 overflow-auto">
            <div className="space-y-6">
              {hasCertificate ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Certificate PEM</CardTitle>
                      <CardDescription>
                        The SSL/TLS certificate in PEM format
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="relative">
                        <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-64 text-xs font-mono">
                          {certificate.certificate_pem}
                        </pre>
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() =>
                            handleCopy(certificate.certificate_pem!, 'cert')
                          }
                        >
                          {copiedField === 'cert' ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {certificate.public_key_pem && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Public Key PEM</CardTitle>
                        <CardDescription>
                          The public key extracted from the certificate
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="relative">
                          <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-64 text-xs font-mono">
                            {certificate.public_key_pem}
                          </pre>
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() =>
                              handleCopy(certificate.public_key_pem!, 'pubkey')
                            }
                          >
                            {copiedField === 'pubkey' ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {certificate.root_certificate && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Root/Issuer Certificate</CardTitle>
                        <CardDescription>
                          The issuer's certificate (for chain verification)
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="relative">
                          <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-64 text-xs font-mono">
                            {certificate.root_certificate}
                          </pre>
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() =>
                              handleCopy(certificate.root_certificate!, 'root')
                            }
                          >
                            {copiedField === 'root' ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertTitle>No Certificate Generated</AlertTitle>
                  <AlertDescription>
                    Generate a certificate using the buttons above to see the
                    certificate data here.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          <TabsContent value="dkim" className="p-6 overflow-auto">
            <div className="space-y-6">
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertTitle>DKIM Email Signing</AlertTitle>
                <AlertDescription>
                  Use this certificate to sign outgoing emails from{' '}
                  {certificate.hostname}. Add the DNS record below to enable DKIM
                  verification.
                </AlertDescription>
              </Alert>

              {dkimRecord && dkimRecordName ? (
                <Card>
                  <CardHeader>
                    <CardTitle>DKIM DNS Record</CardTitle>
                    <CardDescription>
                      Add this TXT record to your DNS configuration
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Record Name</label>
                      <div className="flex gap-2">
                        <code className="flex-1 bg-muted p-3 rounded text-sm font-mono">
                          {dkimRecordName}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(dkimRecordName, 'dkim-name')}
                        >
                          {copiedField === 'dkim-name' ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Record Value (TXT)</label>
                      <div className="flex gap-2">
                        <code className="flex-1 bg-muted p-3 rounded text-xs font-mono break-all">
                          {dkimRecord}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(dkimRecord, 'dkim-value')}
                        >
                          {copiedField === 'dkim-value' ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertTitle>DKIM Not Available</AlertTitle>
                  <AlertDescription>
                    Generate a certificate first to get the DKIM DNS record for
                    email signing.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          <TabsContent value="usage" className="p-6 overflow-auto">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Connected Sites</CardTitle>
                  <CardDescription>
                    Sites using certificates for this hostname
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {connectedSites && connectedSites.length > 0 ? (
                    <div className="space-y-2">
                      {connectedSites.map((site) => (
                        <div
                          key={site.id}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Globe className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{site.hostname}</div>
                              <Badge
                                variant={site.enable ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {site.enable ? 'Enabled' : 'Disabled'}
                              </Badge>
                            </div>
                          </div>
                          <Link
                            to={`/storage/sites/${site.reference_id || site.id}`}
                          >
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Globe className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No sites using this certificate hostname</p>
                      <p className="text-sm mt-1">
                        Create a site with hostname {certificate.hostname} to use
                        this certificate
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Usage Information</CardTitle>
                  <CardDescription>
                    How this certificate can be used
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <Globe className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <div className="font-medium">HTTPS for Sites</div>
                      <p className="text-sm text-muted-foreground">
                        This certificate enables HTTPS for sites with hostname{' '}
                        {certificate.hostname}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <Mail className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <div className="font-medium">DKIM Email Signing</div>
                      <p className="text-sm text-muted-foreground">
                        Sign outgoing emails from {certificate.hostname} for
                        improved deliverability
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <ShieldCheck className="h-5 w-5 text-purple-500 mt-0.5" />
                    <div>
                      <div className="font-medium">TLS for Mail Servers</div>
                      <p className="text-sm text-muted-foreground">
                        Secure SMTP/IMAP connections for mail servers on{' '}
                        {certificate.hostname}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export const Route = createLazyFileRoute(
  '/_authenticated/storage/certificates/$certId'
)({
  component: CertificateDetailPage,
})
