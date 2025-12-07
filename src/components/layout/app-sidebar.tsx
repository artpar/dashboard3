import React, { useEffect } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { ChevronsUpDown, LogOut, Menu, Settings, User } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore.ts'
import { cn } from '@/lib/utils.ts'
import { Button } from '@/components/ui/button.tsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area.tsx'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useSidebar } from '@/components/ui/sidebar'
import { SidebarHeader } from '@/components/ui/sidebar.tsx'
import { NavGroup } from '@/components/layout/nav-group'
import { TeamSwitcher } from '@/components/layout/team-switcher.tsx'
import { Search } from '@/components/search.tsx'
import { useSidebarData } from './data/sidebar-data'

const AppSidebar = () => {
  const { user, logout } = useAuthStore()

  // Get sidebar state from context
  const { open, isMobile, openMobile, setOpenMobile, toggleSidebar } =
    useSidebar()

  // Derive isExpanded from sidebar context
  const isExpanded = isMobile ? openMobile : open
  const sidebarData = useSidebarData()
  const navigate = useNavigate()

  // Fetch sidebar data

  const handleNavigate = (e, href) => {
    e.preventDefault()
    navigate({ to: href })
    // Close mobile sidebar after navigation
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  // Handle keyboard shortcut for toggling sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault()
        toggleSidebar()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSidebar])

  // Mobile sidebar implementation using Sheet component
  if (isMobile) {
    return (
      <>
        <Sheet open={openMobile} onOpenChange={setOpenMobile}>
          <div className='fixed top-4 left-4 z-40 md:hidden'>
            <SheetTrigger asChild>
              <Button
                variant='outline'
                size='icon'
                className='h-10 w-10 rounded-full'
                aria-label='Open sidebar menu'
              >
                <Menu className='h-5 w-5' />
              </Button>
            </SheetTrigger>
          </div>

          <SheetContent
            side='left'
            className='w-[80%] max-w-[300px] border-r p-0'
          >
            <div className='flex h-full flex-col'>
              {/* Logo & Close button */}
              <div className='flex items-center justify-between p-4'>
                <TeamSwitcher teams={sidebarData.teams} />
              </div>

              <div className='px-4 py-2'>
                <Search />
              </div>

              {/* Main navigation */}
              <ScrollArea className='flex-1 pb-16'>
                <nav className='mb-4 space-y-1 p-2'>
                  {sidebarData.navGroups.map((props) => (
                    <NavGroup key={props.table_name} {...props} />
                  ))}
                </nav>
              </ScrollArea>

              {/* User section */}
              <div className='bg-background z-50 flex items-center border-t p-3'>
                <div className='min-w-0 flex-1'>
                  <p className='truncate font-medium'>
                    {user?.name || 'Guest'}
                  </p>
                </div>
                <Link
                  to='/settings/account'
                  onClick={(e) => handleNavigate(e, '/settings/account')}
                >
                  <Button variant='ghost' size='icon'>
                    <Settings size={16} />
                  </Button>
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </>
    )
  }

  // Desktop sidebar implementation
  return (
    <div
      className={cn(
        'shrink-0 bg-background flex h-screen flex-col overflow-hidden border-r transition-all duration-300 ease-in-out',
        isExpanded ? 'w-64' : 'w-14'
      )}
    >
      {/* Logo & Toggle */}
      <SidebarHeader className='shrink-0'>
        <div className='flex w-full items-center justify-between'>
          <TeamSwitcher teams={sidebarData.teams} />
          <Button
            variant='ghost'
            size='icon'
            className='ml-auto h-8 w-8'
            onClick={toggleSidebar}
            aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <Menu className='h-4 w-4' />
          </Button>
        </div>
        {isExpanded && <Search className='mt-2' />}
      </SidebarHeader>

      {/* Main navigation - scrollable */}
      <ScrollArea className='flex-1 min-h-0'>
        <nav className='space-y-1 pb-4'>
          {sidebarData.navGroups.map((props) => (
            <NavGroup key={props.title} {...props} />
          ))}
        </nav>
      </ScrollArea>

      {/* User section - fixed at bottom */}
      <div
        data-slot='sidebar-footer'
        data-sidebar='footer'
        className={cn(
          'bg-background shrink-0 border-t p-2',
          isExpanded ? 'w-64' : 'w-14'
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              data-slot='dropdown-menu-trigger'
              data-sidebar='menu-button'
              data-size='lg'
              data-active='false'
              className='peer/menu-button ring-sidebar-ring active:bg-sidebar-accent active:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground flex h-12 w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-0! focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:font-medium [&amp;>span:last-child]:truncate [&amp;>svg]:size-4 [&amp;>svg]:shrink-0'
              type='button'
            >
              <span
                data-slot='avatar'
                className='relative flex size-8 h-8 w-8 shrink-0 overflow-hidden rounded-lg'
              >
                <span
                  data-slot='avatar-fallback'
                  className='bg-muted flex size-full items-center justify-center rounded-lg'
                >
                  {user?.email?.substring(0, 2).toUpperCase() || 'GU'}
                </span>
              </span>
              <div className='grid flex-1 text-left text-sm leading-tight'>
                <span className='truncate font-semibold'>
                  {user?.email || 'Guest'}
                </span>
              </div>
              <ChevronsUpDown></ChevronsUpDown>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side='top'
            align='start'
            className='w-[--radix-dropdown-menu-trigger-width]'
          >
            <DropdownMenuLabel className='font-normal'>
              <div className='flex flex-col space-y-1'>
                <p className='text-sm leading-none font-medium'>
                  {user?.name || user?.email || 'Guest'}
                </p>
                <p className='text-muted-foreground text-xs leading-none'>
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to='/settings/account' className='cursor-pointer'>
                <User className='mr-2 h-4 w-4' />
                Account Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to='/settings' className='cursor-pointer'>
                <Settings className='mr-2 h-4 w-4' />
                Preferences
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                await logout()
                navigate({ to: '/sign-in' })
              }}
              className='cursor-pointer text-red-600 focus:text-red-600'
            >
              <LogOut className='mr-2 h-4 w-4' />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export default AppSidebar
