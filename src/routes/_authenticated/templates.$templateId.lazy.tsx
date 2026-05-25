/* eslint-disable no-console */
import type { ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createLazyFileRoute, Link } from '@tanstack/react-router'
import { daptinClient } from '@/daptin'
import type { DaptinSiteEntity, DaptinTemplateEntity } from 'daptin-client'
import {
  ArrowLeft,
  Braces,
  CalendarClock,
  Code,
  FileText,
  Globe,
  Settings,
  XCircle,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PermissionColumnEditor from '@/features/entity/columns/editors/PermissionColumnEditor'
import { SingleEntityAllGroupsListWithPermission } from '@/features/entity/components/permission/SingleEntityAllGroupsListWithPermission'

function formatDateTime(value?: string | null): string {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}

function formatStructuredValue(value: unknown): string {
  if (value == null || value === '') return '-'

  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2)
    } catch {
      return value
    }
  }

  return JSON.stringify(value, null, 2)
}

function parseSiteSource(value: string) {
  const match = /^(subsite|site):\/\/([^/]+)\/(.+)$/.exec(value.trim())
  if (!match) return null

  return {
    scheme: match[1],
    siteReferenceId: match[2],
    filePath: match[3],
  }
}

function getTemplateSiteSource(content?: string) {
  if (!content) return null

  const directSource = parseSiteSource(content)
  if (directSource) {
    return {
      ...directSource,
      encoded: false,
    }
  }

  try {
    const decodedContent = atob(content)
    const decodedSource = parseSiteSource(decodedContent)
    if (decodedSource) {
      return {
        ...decodedSource,
        encoded: true,
      }
    }
  } catch {
    return null
  }

  return null
}

function FieldRow({
  label,
  value,
  mono = false,
}: {
  label: string
  value: ReactNode
  mono?: boolean
}) {
  return (
    <div className='grid gap-1 border-b py-3 last:border-b-0 md:grid-cols-[180px_1fr] md:gap-6'>
      <dt className='text-muted-foreground text-sm'>{label}</dt>
      <dd className={mono ? 'font-mono text-sm break-all' : 'text-sm'}>
        {value || '-'}
      </dd>
    </div>
  )
}

function CodeBlock({
  title,
  description,
  value,
}: {
  title: string
  description?: string
  value: unknown
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-base'>
          <Braces className='h-4 w-4' />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <pre className='bg-muted/40 max-h-[420px] overflow-auto rounded-md border p-4 text-sm leading-6'>
          <code>{formatStructuredValue(value)}</code>
        </pre>
      </CardContent>
    </Card>
  )
}

function TemplateDetailPage() {
  const { templateId } = Route.useParams()
  const queryClient = useQueryClient()

  const {
    data: template,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['template', templateId],
    queryFn: async () => {
      console.info('[templates.detail] fetch:start', { templateId })
      const response = await daptinClient.jsonApi.find<DaptinTemplateEntity>(
        'template',
        templateId
      )
      if (!response.data) {
        throw new Error('Template not found')
      }
      console.info('[templates.detail] fetch:success', { templateId })
      return response.data as DaptinTemplateEntity
    },
    enabled: Boolean(templateId),
  })

  const siteSource = getTemplateSiteSource(template?.content)
  const siteReferenceId = siteSource?.siteReferenceId
  const {
    data: attachedSite,
    isFetching: isAttachedSiteFetching,
    error: attachedSiteError,
  } = useQuery({
    queryKey: ['template', templateId, 'site-source', siteReferenceId],
    queryFn: async () => {
      if (!siteReferenceId) {
        throw new Error('Template does not reference a site file')
      }

      console.info('[templates.detail.site] fetch:start', {
        templateId,
        siteReferenceId,
      })

      try {
        const response = await daptinClient.jsonApi.find<DaptinSiteEntity>(
          'site',
          siteReferenceId
        )
        if (!response.data) {
          throw new Error('Attached site not found')
        }
        console.info('[templates.detail.site] fetch:success', {
          templateId,
          siteReferenceId,
        })
        return response.data as DaptinSiteEntity
      } catch (siteFetchError) {
        console.error('[templates.detail.site] fetch:error', {
          templateId,
          siteReferenceId,
          error: siteFetchError,
        })
        throw siteFetchError
      }
    },
    enabled: Boolean(siteReferenceId),
  })

  const updatePermissionMutation = useMutation({
    mutationFn: async (permission: number) => {
      console.info('[templates.detail.permission] update:start', {
        templateId,
        permission,
      })
      const response = await daptinClient.jsonApi.update('template', {
        id: templateId,
        permission,
      })
      console.info('[templates.detail.permission] update:success', {
        templateId,
        permission,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template', templateId] })
    },
    onError: (permissionError) => {
      console.error('[templates.detail.permission] update:error', {
        templateId,
        error: permissionError,
      })
    },
  })

  if (isLoading) {
    return (
      <div className='w-full space-y-4 p-6'>
        <Skeleton className='h-8 w-64' />
        <Skeleton className='h-4 w-96' />
        <Skeleton className='h-[520px] w-full' />
      </div>
    )
  }

  if (error || !template) {
    return (
      <div className='w-full p-6'>
        <Alert variant='destructive'>
          <XCircle className='h-4 w-4' />
          <AlertTitle>Template not found</AlertTitle>
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : 'Daptin did not return a template for this reference id.'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const displayName =
    template.name || `template ${template.reference_id || template.id}`

  return (
    <div className='flex h-full w-full flex-col'>
      <div className='border-b p-6'>
        <Link
          to='/templates'
          className='text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-1 text-sm'
        >
          <ArrowLeft className='h-4 w-4' />
          Back to Templates
        </Link>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div className='min-w-0 space-y-2'>
            <h1 className='flex items-center gap-2 text-2xl font-bold'>
              <FileText className='h-6 w-6 shrink-0' />
              <span className='break-words'>{displayName}</span>
            </h1>
            <div className='flex flex-wrap items-center gap-2'>
              <Badge variant='outline'>
                {template.mime_type || 'template'}
              </Badge>
              {template.url_pattern && (
                <Badge variant='secondary'>
                  {String(template.url_pattern)}
                </Badge>
              )}
            </div>
          </div>
          <Button variant='outline' size='sm' asChild>
            <Link to={`/template/${templateId}/edit`}>
              <Settings className='mr-1 h-4 w-4' />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      <div className='flex-1 overflow-auto p-6'>
        <Tabs defaultValue='overview' className='space-y-6'>
          <TabsList>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='content'>Content</TabsTrigger>
            <TabsTrigger value='permissions'>Permissions</TabsTrigger>
            <TabsTrigger value='groups'>Groups</TabsTrigger>
            <TabsTrigger value='raw'>Raw</TabsTrigger>
          </TabsList>

          <TabsContent value='overview' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <FileText className='h-4 w-4' />
                  Template Configuration
                </CardTitle>
                <CardDescription>
                  Stored Daptin template fields and routing metadata.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <dl>
                  <FieldRow label='Name' value={template.name} />
                  <FieldRow label='MIME Type' value={template.mime_type} />
                  <FieldRow
                    label='URL Pattern'
                    value={template.url_pattern}
                    mono
                  />
                  <FieldRow
                    label='Reference ID'
                    value={template.reference_id}
                    mono
                  />
                  <FieldRow
                    label='Created'
                    value={
                      <span className='inline-flex items-center gap-2'>
                        <CalendarClock className='text-muted-foreground h-4 w-4' />
                        {formatDateTime(template.created_at)}
                      </span>
                    }
                  />
                  <FieldRow
                    label='Updated'
                    value={formatDateTime(template.updated_at)}
                  />
                </dl>
              </CardContent>
            </Card>

            <CodeBlock
              title='Headers'
              description='Response headers stored on the template row.'
              value={template.headers}
            />
            <CodeBlock
              title='Action Config'
              description='Action configuration stored by Daptin.'
              value={template.action_config}
            />
            <CodeBlock
              title='Cache Config'
              description='Cache configuration stored by Daptin.'
              value={template.cache_config}
            />

            {siteSource && (
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-base'>
                    <Globe className='h-4 w-4' />
                    Attached Site File
                  </CardTitle>
                  <CardDescription>
                    Resolved from Daptin template content source.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <dl>
                    <FieldRow label='Source' value={siteSource.scheme} />
                    <FieldRow
                      label='Site Reference ID'
                      value={
                        <Link
                          to={`/storage/sites/${siteSource.siteReferenceId}`}
                          className='text-primary underline-offset-4 hover:underline'
                        >
                          {siteSource.siteReferenceId}
                        </Link>
                      }
                      mono
                    />
                    <FieldRow
                      label='File Path'
                      value={siteSource.filePath}
                      mono
                    />
                    <FieldRow
                      label='Stored Content'
                      value={
                        siteSource.encoded
                          ? 'base64 site source'
                          : 'site source'
                      }
                    />
                    <FieldRow
                      label='Site'
                      value={
                        isAttachedSiteFetching
                          ? 'Loading site...'
                          : attachedSite
                            ? attachedSite.name ||
                              attachedSite.hostname ||
                              attachedSite.reference_id
                            : attachedSiteError instanceof Error
                              ? attachedSiteError.message
                              : '-'
                      }
                    />
                  </dl>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value='content'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <Code className='h-4 w-4' />
                  Content
                </CardTitle>
                <CardDescription>
                  Template body exactly as stored in Daptin.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className='bg-muted/40 min-h-[420px] overflow-auto rounded-md border p-4 text-sm leading-6'>
                  <code>{template.content || ''}</code>
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='permissions'>
            <PermissionColumnEditor
              value={Number(template.permission || 0)}
              onChange={(permission) =>
                updatePermissionMutation.mutate(permission)
              }
              disabled={updatePermissionMutation.isPending}
              entityType='template'
              entityId={templateId}
            />
          </TabsContent>

          <TabsContent value='groups'>
            <SingleEntityAllGroupsListWithPermission
              entityName='template'
              entityId={templateId}
              disabled={false}
            />
          </TabsContent>

          <TabsContent value='raw'>
            <CodeBlock
              title='Raw Template Row'
              description='SDK entity returned by Daptin JSON:API.'
              value={template}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export const Route = createLazyFileRoute(
  '/_authenticated/templates/$templateId'
)({
  component: TemplateDetailPage,
})
