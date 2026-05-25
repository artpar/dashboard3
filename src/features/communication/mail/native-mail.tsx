import { Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Mail,
  RefreshCw,
  Search,
  Send,
  Server,
  Settings,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { Main } from '@/components/layout/main'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { DAPTIN_ENDPOINT, daptinClient } from '@/daptin'
import { configApi } from '@/lib/configApi'
import { EntityApiService } from '@/features/entity/services/EntityApiService'
import { getEntityId } from '@/features/entity/utils/entityIdentity'

type DaptinRow = Record<string, unknown> & {
  id?: string | number
  reference_id?: string | number
}

type MailCollectionResult = Awaited<
  ReturnType<typeof EntityApiService.fetchEntityCollection>
>

const PAGE_SIZE = 10
type MailFilter = { column: string; operator: string; value: string }
type MailCollectionFilters = {
  _search?: string
  _advanced?: MailFilter[]
}

function valueText(row: DaptinRow | null | undefined, key: string): string {
  const value = row?.[key]
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

function valueBool(row: DaptinRow | null | undefined, key: string): boolean {
  const value = row?.[key]
  return value === true || value === 1 || value === '1' || value === 'true'
}

function boolText(row: DaptinRow | null | undefined, key: string): string {
  return valueBool(row, key) ? 'Yes' : 'No'
}

function relationFilter(column: string, value?: string): MailFilter[] | undefined {
  if (!value) return undefined
  return [{ column, operator: 'is', value }]
}

function useMailCollection(
  entityName: string,
  page: number,
  filters?: MailCollectionFilters
) {
  return useQuery({
    queryKey: ['native-mail', entityName, page, filters],
    queryFn: () => {
      console.log('Mail collection fetch', {
        entityName,
        page,
        pageSize: PAGE_SIZE,
        filters,
        endpoint: DAPTIN_ENDPOINT,
      })
      return EntityApiService.fetchEntityCollection(entityName, {
        page,
        pageSize: PAGE_SIZE,
        filters,
        sort: '-created_at',
      })
    },
    refetchOnWindowFocus: false,
  })
}

function useMailSingle(entityName: string, id?: string) {
  return useQuery({
    queryKey: ['native-mail-single', entityName, id],
    queryFn: () => {
      if (!id) throw new Error(`${entityName} id is required`)
      console.log('Mail single fetch', { entityName, id, endpoint: DAPTIN_ENDPOINT })
      return EntityApiService.fetchSingleEntity(entityName, id)
    },
    enabled: !!id,
    refetchOnWindowFocus: false,
  })
}

function useMailConfig() {
  return useQuery({
    queryKey: ['native-mail-config'],
    queryFn: async () => {
      console.log('Mail config fetch', { endpoint: DAPTIN_ENDPOINT })
      const config = await configApi.getAll().catch((error) => {
        console.warn('Failed to fetch Daptin config map', error)
        return {}
      })

      return {
        imapEnabled: config['imap.enabled'] === 'true',
        imapListenInterface: config['imap.listen_interface'] || ':1143',
      }
    },
    refetchOnWindowFocus: false,
  })
}

function useSetMailConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      key,
      value,
    }: {
      key: 'imap.enabled' | 'imap.listen_interface'
      value: string
    }) => {
      console.log('Mail config update start', { key, value, endpoint: DAPTIN_ENDPOINT })
      try {
        await configApi.set(key, value)
      } catch (error) {
        console.warn('Mail config set failed, trying create', { key, error })
        await configApi.create(key, value)
      }
      console.log('Mail config update complete', { key, value })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['native-mail-config'] })
    },
  })
}

function useNativeMailAction(entityName: string, actionName: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      console.log('Native Daptin mail action start', {
        entityName,
        actionName,
        endpoint: DAPTIN_ENDPOINT,
      })
      try {
        const response = await daptinClient.actionManager.doAction(
          entityName,
          actionName,
          {}
        )
        console.log('Native Daptin mail action complete', {
          entityName,
          actionName,
          response,
        })
        return response
      } catch (error) {
        console.error('Native Daptin mail action failed', {
          entityName,
          actionName,
          error,
        })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['native-mail'] })
      queryClient.invalidateQueries({ queryKey: ['native-mail-single'] })
    },
  })
}

function MailPageHeader({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className='border-b px-6 py-5'>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
        <div className='max-w-3xl space-y-1'>
          <h1 className='text-2xl font-semibold tracking-tight'>{title}</h1>
          <p className='text-muted-foreground text-sm leading-6'>{description}</p>
        </div>
        {action ? <div className='flex shrink-0 gap-2'>{action}</div> : null}
      </div>
    </div>
  )
}

function LoadingRows() {
  return (
    <div className='space-y-3 p-6'>
      <Skeleton className='h-9 w-full' />
      <Skeleton className='h-48 w-full' />
    </div>
  )
}

function ErrorPanel({ title, error }: { title: string; error: unknown }) {
  return (
    <Alert variant='destructive' className='m-6'>
      <AlertTriangle className='h-4 w-4' />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {error instanceof Error ? error.message : 'Daptin returned an error'}
      </AlertDescription>
    </Alert>
  )
}

function PaginationControls({
  page,
  result,
  onPageChange,
}: {
  page: number
  result?: MailCollectionResult
  onPageChange: (page: number) => void
}) {
  const pagination = result?.pagination
  const totalPages = pagination?.lastPage || result?.totalPages || 1
  return (
    <div className='flex items-center justify-between border-t px-6 py-3'>
      <div className='text-muted-foreground text-sm'>
        {pagination
          ? `${pagination.from || 0}-${pagination.to || 0} of ${pagination.total || 0}`
          : 'No rows'}
      </div>
      <div className='flex items-center gap-2'>
        <Button
          variant='outline'
          size='sm'
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className='mr-1 h-4 w-4' />
          Previous
        </Button>
        <span className='text-muted-foreground min-w-20 text-center text-sm'>
          Page {page} / {totalPages}
        </span>
        <Button
          variant='outline'
          size='sm'
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight className='ml-1 h-4 w-4' />
        </Button>
      </div>
    </div>
  )
}

function NativeMailTable({
  rows,
  columns,
  emptyMessage,
}: {
  rows: DaptinRow[]
  columns: Array<{
    key: string
    label: string
    render?: (row: DaptinRow) => ReactNode
  }>
  emptyMessage: string
}) {
  if (!rows.length) {
    return (
      <div className='text-muted-foreground border-y px-6 py-10 text-sm'>
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className='overflow-auto border-y'>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key}>{column.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={getEntityId(row)}>
              {columns.map((column) => (
                <TableCell key={column.key}>
                  {column.render ? column.render(row) : valueText(row, column.key)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function NativeCollectionPage({
  title,
  description,
  entityName,
  columns,
  emptyMessage,
  filters,
  action,
}: {
  title: string
  description: string
  entityName: string
  columns: Parameters<typeof NativeMailTable>[0]['columns']
  emptyMessage: string
  filters?: MailFilter[]
  action?: ReactNode
}) {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const collectionFilters: MailCollectionFilters | undefined =
    searchQuery || filters
      ? {
          ...(searchQuery ? { _search: searchQuery } : {}),
          ...(filters ? { _advanced: filters } : {}),
        }
      : undefined
  const query = useMailCollection(entityName, page, collectionFilters)

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextSearch = searchInput.trim()
    console.log('Native mail collection search', {
      entityName,
      search: nextSearch || null,
      endpoint: DAPTIN_ENDPOINT,
    })
    setSearchQuery(nextSearch)
    setPage(1)
  }

  return (
    <Main className='flex h-full flex-col overflow-hidden p-0'>
      <MailPageHeader title={title} description={description} action={action} />
      <div className='border-b px-6 py-3'>
        <form onSubmit={handleSearch} className='relative max-w-xl'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
          <Input
            type='search'
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={`Search ${entityName.replace(/_/g, ' ')}...`}
            className='pl-9'
          />
        </form>
      </div>
      <div className='min-h-0 flex-1 overflow-auto'>
        {query.isLoading ? <LoadingRows /> : null}
        {query.error ? <ErrorPanel title={`Could not load ${title}`} error={query.error} /> : null}
        {query.data ? (
          <NativeMailTable
            rows={(query.data.data || []) as DaptinRow[]}
            columns={columns}
            emptyMessage={emptyMessage}
          />
        ) : null}
      </div>
      <PaginationControls page={page} result={query.data} onPageChange={setPage} />
    </Main>
  )
}

function StatusBadge({ enabled }: { enabled: boolean }) {
  return (
    <Badge variant={enabled ? 'default' : 'secondary'}>
      {enabled ? 'Enabled' : 'Disabled'}
    </Badge>
  )
}

function CountPanel({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number | string
  icon: typeof Server
}) {
  return (
    <div className='rounded-md border px-4 py-3'>
      <div className='text-muted-foreground flex items-center gap-2 text-sm'>
        <Icon className='h-4 w-4' />
        {label}
      </div>
      <div className='mt-2 text-2xl font-semibold'>{value}</div>
    </div>
  )
}

export function NativeMailHomePage() {
  const servers = useMailCollection('mail_server', 1)
  const accounts = useMailCollection('mail_account', 1)
  const boxes = useMailCollection('mail_box', 1)
  const outbox = useMailCollection('outbox', 1)
  const config = useMailConfig()
  const setConfig = useSetMailConfig()
  const { toast } = useToast()
  const [listenInterface, setListenInterface] = useState('')

  const resolvedListenInterface =
    listenInterface || config.data?.imapListenInterface || ':1143'

  async function updateImapEnabled(enabled: boolean) {
    try {
      await setConfig.mutateAsync({
        key: 'imap.enabled',
        value: enabled ? 'true' : 'false',
      })
      toast({
        title: 'IMAP config updated',
        description: 'Restart Daptin for listener changes to take effect.',
      })
    } catch (error) {
      toast({
        title: 'Failed to update IMAP config',
        description: error instanceof Error ? error.message : 'Daptin rejected the update',
        variant: 'destructive',
      })
    }
  }

  async function updateListenInterface() {
    try {
      await setConfig.mutateAsync({
        key: 'imap.listen_interface',
        value: resolvedListenInterface,
      })
      toast({
        title: 'IMAP listener updated',
        description: 'Restart Daptin for listener changes to take effect.',
      })
    } catch (error) {
      toast({
        title: 'Failed to update IMAP listener',
        description: error instanceof Error ? error.message : 'Daptin rejected the update',
        variant: 'destructive',
      })
    }
  }

  return (
    <Main className='flex h-full flex-col overflow-hidden p-0'>
      <MailPageHeader
        title='Mail'
        description='Operate Daptin native SMTP and IMAP mail. Servers, accounts, mailboxes, messages, and outbox queue are backed by Daptin entities and runtime config.'
      />
      <div className='min-h-0 flex-1 overflow-auto p-6'>
        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
          <CountPanel
            label='Mail servers'
            value={servers.data?.pagination.total ?? '-'}
            icon={Server}
          />
          <CountPanel
            label='Accounts'
            value={accounts.data?.pagination.total ?? '-'}
            icon={Mail}
          />
          <CountPanel
            label='Mailboxes'
            value={boxes.data?.pagination.total ?? '-'}
            icon={Inbox}
          />
          <CountPanel
            label='Outbox rows'
            value={outbox.data?.pagination.total ?? '-'}
            icon={Send}
          />
        </div>

        <div className='mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]'>
          <Card>
            <CardHeader>
              <CardTitle>Native protocol readiness</CardTitle>
              <CardDescription>
                Daptin starts SMTP and IMAP listeners from database rows and backend config. Listener changes may require a Daptin restart.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-start gap-3 rounded-md border p-4'>
                <CheckCircle2 className='mt-0.5 h-4 w-4' />
                <div>
                  <div className='text-sm font-medium'>
                    SMTP is configured through <code>mail_server</code> rows.
                  </div>
                  <p className='text-muted-foreground mt-1 text-sm'>
                    Use Sync Mail Servers after creating or editing rows. If the SMTP daemon was not initialized at startup, restart Daptin.
                  </p>
                </div>
              </div>
              <div className='flex items-start gap-3 rounded-md border p-4'>
                <AlertTriangle className='mt-0.5 h-4 w-4' />
                <div>
                  <div className='text-sm font-medium'>IMAP authentication requires TLS.</div>
                  <p className='text-muted-foreground mt-1 text-sm'>
                    Daptin sets IMAP insecure auth off, so clients will see LOGINDISABLED until TLS is available.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Settings className='h-4 w-4' />
                IMAP config
              </CardTitle>
              <CardDescription>
                Values are written to <code>_config/backend</code>.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {config.isLoading ? <Skeleton className='h-20 w-full' /> : null}
              {config.data ? (
                <>
                  <div className='flex items-center justify-between gap-3'>
                    <div>
                      <Label htmlFor='imap-enabled'>Enable IMAP</Label>
                      <p className='text-muted-foreground mt-1 text-xs'>
                        Writes <code>imap.enabled</code>.
                      </p>
                    </div>
                    <Switch
                      id='imap-enabled'
                      checked={config.data.imapEnabled}
                      disabled={setConfig.isPending}
                      onCheckedChange={updateImapEnabled}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='imap-listen'>Listen interface</Label>
                    <Input
                      id='imap-listen'
                      value={resolvedListenInterface}
                      onChange={(event) => setListenInterface(event.target.value)}
                      placeholder=':1143'
                    />
                    <Button
                      variant='outline'
                      size='sm'
                      disabled={setConfig.isPending}
                      onClick={updateListenInterface}
                    >
                      Save listener
                    </Button>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </Main>
  )
}

export function NativeMailServersPage() {
  const syncMailServers = useNativeMailAction('mail_server', 'sync_mail_servers')
  const { toast } = useToast()

  async function handleSync() {
    try {
      await syncMailServers.mutateAsync()
      toast({
        title: 'Mail servers synced',
        description: 'Daptin reloaded mail server configuration from the database.',
      })
    } catch (error) {
      toast({
        title: 'Mail server sync failed',
        description: error instanceof Error ? error.message : 'Daptin rejected the action',
        variant: 'destructive',
      })
    }
  }

  return (
    <NativeCollectionPage
      title='Mail servers'
      description='Native Daptin SMTP listener rows. These are not third-party provider integrations.'
      entityName='mail_server'
      emptyMessage='No mail servers exist. Create a mail_server row to configure the native SMTP listener.'
      action={
        <>
          <Button asChild variant='outline' size='sm'>
            <Link to='/create/$entity' params={{ entity: 'mail_server' }}>
              New server
            </Link>
          </Button>
          <Button size='sm' disabled={syncMailServers.isPending} onClick={handleSync}>
            <RefreshCw className='mr-2 h-4 w-4' />
            Sync mail servers
          </Button>
        </>
      }
      columns={[
        {
          key: 'hostname',
          label: 'Hostname',
          render: (row) => (
            <Link
              to='/mail/servers/$serverId'
              params={{ serverId: getEntityId(row) }}
              className='font-medium hover:underline'
            >
              {valueText(row, 'hostname')}
            </Link>
          ),
        },
        { key: 'listen_interface', label: 'Listen interface' },
        {
          key: 'is_enabled',
          label: 'Status',
          render: (row) => <StatusBadge enabled={valueBool(row, 'is_enabled')} />,
        },
        { key: 'max_clients', label: 'Max clients' },
        { key: 'max_size', label: 'Max size' },
      ]}
    />
  )
}

export function NativeMailServerDetailPage({ serverId }: { serverId: string }) {
  const server = useMailSingle('mail_server', serverId)
  const [accountsPage, setAccountsPage] = useState(1)
  const accountFilters = relationFilter('mail_server_id', serverId)
  const accounts = useMailCollection(
    'mail_account',
    accountsPage,
    accountFilters ? { _advanced: accountFilters } : undefined
  )
  const syncMailServers = useNativeMailAction('mail_server', 'sync_mail_servers')
  const { toast } = useToast()

  async function handleSync() {
    try {
      await syncMailServers.mutateAsync()
      toast({
        title: 'Mail servers synced',
        description: 'Daptin reloaded mail server configuration from the database.',
      })
    } catch (error) {
      toast({
        title: 'Mail server sync failed',
        description: error instanceof Error ? error.message : 'Daptin rejected the action',
        variant: 'destructive',
      })
    }
  }

  return (
    <Main className='flex h-full flex-col overflow-hidden p-0'>
      <MailPageHeader
        title={server.data ? valueText(server.data, 'hostname') : 'Mail server'}
        description='Inspect a native Daptin mail_server row, related accounts, and the runtime sync boundary.'
        action={
          <Button size='sm' disabled={syncMailServers.isPending} onClick={handleSync}>
            <RefreshCw className='mr-2 h-4 w-4' />
            Sync mail servers
          </Button>
        }
      />
      <div className='min-h-0 flex-1 overflow-auto p-6'>
        {server.isLoading ? <LoadingRows /> : null}
        {server.error ? <ErrorPanel title='Could not load mail server' error={server.error} /> : null}
        {server.data ? (
          <Tabs defaultValue='overview' className='space-y-4'>
            <TabsList>
              <TabsTrigger value='overview'>Overview</TabsTrigger>
              <TabsTrigger value='accounts'>Accounts</TabsTrigger>
              <TabsTrigger value='raw'>Raw</TabsTrigger>
            </TabsList>
            <TabsContent value='overview' className='space-y-4'>
              <div className='max-w-3xl space-y-3'>
                {[
                  ['Hostname', 'hostname'],
                  ['Listen interface', 'listen_interface'],
                  ['Enabled', 'is_enabled'],
                  ['Always on TLS', 'always_on_tls'],
                  ['Authentication required', 'authentication_required'],
                  ['XCLIENT enabled', 'xclient_on'],
                  ['Max clients', 'max_clients'],
                  ['Max message size', 'max_size'],
                ].map(([label, key]) => (
                  <div key={key} className='rounded-md border px-4 py-3'>
                    <div className='text-muted-foreground text-xs uppercase tracking-wide'>
                      {label}
                    </div>
                    <div className='mt-1 text-sm font-medium'>
                      {[
                        'is_enabled',
                        'always_on_tls',
                        'authentication_required',
                        'xclient_on',
                      ].includes(key)
                        ? boolText(server.data, key)
                        : valueText(server.data, key)}
                    </div>
                  </div>
                ))}
              </div>
              <Alert>
                <AlertTriangle className='h-4 w-4' />
                <AlertTitle>Daptin runtime lifecycle</AlertTitle>
                <AlertDescription>
                  Sync reloads server rows into Daptin. If no SMTP daemon was initialized when Daptin started, restart the local Daptin instance after creating the first server.
                </AlertDescription>
              </Alert>
            </TabsContent>
            <TabsContent value='accounts' className='space-y-0'>
              {accounts.isLoading ? <LoadingRows /> : null}
              {accounts.error ? (
                <ErrorPanel title='Could not load mail accounts' error={accounts.error} />
              ) : null}
              {accounts.data ? (
                <>
                  <NativeMailTable
                    rows={(accounts.data.data || []) as DaptinRow[]}
                    emptyMessage='No mail accounts reference this server.'
                    columns={[
                      {
                        key: 'username',
                        label: 'Username',
                        render: (row) => (
                          <Link
                            to='/mail/accounts/$accountId'
                            params={{ accountId: getEntityId(row) }}
                            className='font-medium hover:underline'
                          >
                            {valueText(row, 'username')}
                          </Link>
                        ),
                      },
                      { key: 'mail_server_id', label: 'Mail server' },
                      { key: 'created_at', label: 'Created' },
                    ]}
                  />
                  <PaginationControls
                    page={accountsPage}
                    result={accounts.data}
                    onPageChange={setAccountsPage}
                  />
                </>
              ) : null}
            </TabsContent>
            <TabsContent value='raw'>
              <pre className='bg-muted overflow-auto rounded-md p-4 text-xs'>
                {JSON.stringify(server.data, null, 2)}
              </pre>
            </TabsContent>
          </Tabs>
        ) : null}
      </div>
    </Main>
  )
}

export function NativeMailAccountsPage() {
  return (
    <NativeCollectionPage
      title='Mail accounts'
      description='Native IMAP/SMTP accounts linked to Daptin mail_server rows.'
      entityName='mail_account'
      emptyMessage='No mail accounts exist. Create mail_account rows with username, password, password_md5, and mail_server_id.'
      action={
        <Button asChild variant='outline' size='sm'>
          <Link to='/create/$entity' params={{ entity: 'mail_account' }}>
            New account
          </Link>
        </Button>
      }
      columns={[
        {
          key: 'username',
          label: 'Username',
          render: (row) => (
            <Link
              to='/mail/accounts/$accountId'
              params={{ accountId: getEntityId(row) }}
              className='font-medium hover:underline'
            >
              {valueText(row, 'username')}
            </Link>
          ),
        },
        { key: 'mail_server_id', label: 'Mail server' },
        { key: 'created_at', label: 'Created' },
        { key: 'updated_at', label: 'Updated' },
      ]}
    />
  )
}

export function NativeMailAccountDetailPage({ accountId }: { accountId: string }) {
  const account = useMailSingle('mail_account', accountId)
  const [boxPage, setBoxPage] = useState(1)
  const boxFilters = relationFilter('mail_account_id', accountId)
  const boxes = useMailCollection(
    'mail_box',
    boxPage,
    boxFilters ? { _advanced: boxFilters } : undefined
  )

  return (
    <Main className='flex h-full flex-col overflow-hidden p-0'>
      <MailPageHeader
        title={account.data ? valueText(account.data, 'username') : 'Mail account'}
        description='Inspect a Daptin mail_account row and server-side paginated mailbox/message state.'
      />
      <div className='min-h-0 flex-1 overflow-auto p-6'>
        {account.isLoading ? <LoadingRows /> : null}
        {account.error ? <ErrorPanel title='Could not load mail account' error={account.error} /> : null}
        {account.data ? (
          <Tabs defaultValue='mailboxes' className='space-y-4'>
            <TabsList>
              <TabsTrigger value='mailboxes'>Mailboxes</TabsTrigger>
              <TabsTrigger value='overview'>Overview</TabsTrigger>
              <TabsTrigger value='raw'>Raw</TabsTrigger>
            </TabsList>
            <TabsContent value='mailboxes' className='space-y-0'>
              {boxes.isLoading ? <LoadingRows /> : null}
              {boxes.error ? <ErrorPanel title='Could not load mailboxes' error={boxes.error} /> : null}
              {boxes.data ? (
                <>
                  <NativeMailTable
                    rows={(boxes.data.data || []) as DaptinRow[]}
                    emptyMessage='No mailboxes exist for this account.'
                    columns={[
                      { key: 'name', label: 'Mailbox' },
                      { key: 'subscribed', label: 'Subscribed' },
                      { key: 'uidvalidity', label: 'UID validity' },
                      { key: 'nextuid', label: 'Next UID' },
                      { key: 'flags', label: 'Flags' },
                    ]}
                  />
                  <PaginationControls
                    page={boxPage}
                    result={boxes.data}
                    onPageChange={setBoxPage}
                  />
                </>
              ) : null}
            </TabsContent>
            <TabsContent value='overview'>
              <div className='max-w-3xl space-y-3'>
                {[
                  ['Username', 'username'],
                  ['Mail server', 'mail_server_id'],
                  ['Created', 'created_at'],
                  ['Updated', 'updated_at'],
                ].map(([label, key]) => (
                  <div key={key} className='rounded-md border px-4 py-3'>
                    <div className='text-muted-foreground text-xs uppercase tracking-wide'>
                      {label}
                    </div>
                    <div className='mt-1 text-sm font-medium'>
                      {valueText(account.data, key)}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value='raw'>
              <pre className='bg-muted overflow-auto rounded-md p-4 text-xs'>
                {JSON.stringify(account.data, null, 2)}
              </pre>
            </TabsContent>
          </Tabs>
        ) : null}
      </div>
    </Main>
  )
}

export function NativeMailOutboxPage() {
  const processOutbox = useNativeMailAction('outbox', 'process_outbox')
  const { toast } = useToast()

  async function handleProcess() {
    try {
      await processOutbox.mutateAsync()
      toast({
        title: 'Outbox processing started',
        description: 'Daptin processed queued outbox rows.',
      })
    } catch (error) {
      toast({
        title: 'Outbox processing failed',
        description: error instanceof Error ? error.message : 'Daptin rejected the action',
        variant: 'destructive',
      })
    }
  }

  return (
    <NativeCollectionPage
      title='Outbox'
      description='Queued and failed outgoing work from Daptin outbox. Processing is action-backed by Daptin.'
      entityName='outbox'
      emptyMessage='The outbox has no rows.'
      action={
        <Button size='sm' disabled={processOutbox.isPending} onClick={handleProcess}>
          <Send className='mr-2 h-4 w-4' />
          Process outbox
        </Button>
      }
      columns={[
        { key: 'reference_id', label: 'Reference' },
        { key: 'status', label: 'Status' },
        { key: 'last_error', label: 'Last error' },
        { key: 'created_at', label: 'Created' },
        { key: 'updated_at', label: 'Updated' },
      ]}
    />
  )
}
