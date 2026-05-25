import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  CircleAlert,
  CircleHelp,
  Search as SearchIcon,
  Server,
} from 'lucide-react'
import { DAPTIN_ENDPOINT, daptinClient } from '@/daptin'
import { useSearch } from '@/context/search-context'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { Search } from '@/components/search'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type ConnectionState = 'checking' | 'connected' | 'failed'

const LOG_PREFIX = '[shell.status]'

export function ShellStatusBar() {
  const { user, isAuthenticated } = useAuthStore()
  const { setOpen } = useSearch()
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('checking')
  const [connectionDetail, setConnectionDetail] = useState('Checking /ping')

  const userMode = useMemo(() => {
    if (!isAuthenticated || !user) {
      return 'No session'
    }

    const roles = user.roles || []
    const isAdmin = roles.some((role) => {
      const normalized = role.toLowerCase()
      return normalized === 'admin' || normalized === 'administrator'
    })

    return isAdmin ? 'Admin mode' : 'Normal user'
  }, [isAuthenticated, user])

  useEffect(() => {
    let cancelled = false

    console.info(`${LOG_PREFIX} connection-check:start`, {
      endpoint: DAPTIN_ENDPOINT,
    })

    daptinClient.runtimeManager
      .ping()
      .then((result) => {
        if (cancelled) {
          return
        }

        setConnectionState('connected')
        setConnectionDetail(typeof result === 'string' ? result : 'Connected')
        console.info(`${LOG_PREFIX} connection-check:success`, {
          endpoint: DAPTIN_ENDPOINT,
          result,
        })
      })
      .catch((error) => {
        if (cancelled) {
          return
        }

        setConnectionState('failed')
        setConnectionDetail('Daptin ping failed')
        console.error(`${LOG_PREFIX} connection-check:failed`, {
          endpoint: DAPTIN_ENDPOINT,
          error,
        })
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    console.info(`${LOG_PREFIX} user-mode:resolved`, {
      email: user?.email || null,
      mode: userMode,
    })
  }, [user?.email, userMode])

  const StatusIcon =
    connectionState === 'connected'
      ? CheckCircle2
      : connectionState === 'failed'
        ? CircleAlert
        : CircleHelp

  return (
    <header className='bg-background/95 supports-[backdrop-filter]:bg-background/80 flex min-h-14 shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2 backdrop-blur sm:gap-3'>
      <div className='flex min-w-0 flex-1 items-center gap-2'>
        <div className='flex min-w-0 items-center gap-2'>
          <Server className='text-muted-foreground h-4 w-4 shrink-0' />
          <span className='text-muted-foreground hidden text-xs font-medium md:inline'>
            Endpoint
          </span>
          <span className='max-w-[38vw] truncate font-mono text-xs md:max-w-[28vw]'>
            {DAPTIN_ENDPOINT}
          </span>
        </div>
        <Badge
          variant='outline'
          className={cn(
            'inline-flex shrink-0 gap-1 rounded-sm px-2 py-0.5 text-xs font-normal',
            connectionState === 'connected' &&
              'border-emerald-500/40 text-emerald-700 dark:text-emerald-300',
            connectionState === 'failed' &&
              'border-destructive/40 text-destructive'
          )}
          title={connectionDetail}
        >
          <StatusIcon className='h-3 w-3' />
          {connectionState === 'checking'
            ? 'Checking'
            : connectionState === 'connected'
              ? 'Connected'
              : 'Disconnected'}
        </Badge>
      </div>

      <Search className='hidden w-52 lg:flex' placeholder='Command or search' />
      <Button
        variant='outline'
        size='icon'
        className='h-8 w-8 lg:hidden'
        aria-label='Open command menu'
        onClick={() => setOpen(true)}
      >
        <SearchIcon className='h-4 w-4' />
      </Button>

      <div className='flex min-w-0 items-center gap-2 text-xs'>
        <span className='text-muted-foreground max-w-20 truncate sm:max-w-40'>
          {user?.email || 'Not signed in'}
        </span>
        <Badge variant='secondary' className='rounded-sm px-2 py-0.5'>
          {userMode}
        </Badge>
      </div>
    </header>
  )
}
