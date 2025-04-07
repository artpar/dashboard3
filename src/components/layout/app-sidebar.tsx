import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { sendMessageToBackgroundScript } from '@/background.ts'
import {
  Building,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Lightbulb,
  Plus,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore.ts'
import { cn } from '@/lib/utils.ts'
import { Button } from '@/components/ui/button.tsx'
import { ScrollArea } from '@/components/ui/scroll-area.tsx'
import { Separator } from '@/components/ui/separator.tsx'
import { Search } from '@/components/search.tsx'

const AppSidebar = () => {
  const { user, customer } = useAuthStore()
  const [isExpanded, setIsExpanded] = useState(true)
  const [memories, setMemories] = useState([])
  const [workgroups, setWorkgroups] = useState([])
  const [memoriesOpen, setMemoriesOpen] = useState(true)
  const [workgroupsOpen, setWorkgroupsOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const routerState = useRouterState()
  const currentPath = routerState.location.pathname
  const navigate = useNavigate()

  // Fetch sidebar data
  useEffect(() => {
    const fetchSidebarData = async () => {
      setIsLoading(true)
      try {
        // Fetch memories
        const memoriesResponse = await sendMessageToBackgroundScript({
          type: 'getAllMemories',
          query: searchQuery || undefined,
        })

        // Filter to only show memories marked for sidebar
        const sidebarMemories =
          memoriesResponse?.filter((memory) => memory.show_on_sidepanel) || []

        // Fetch workgroups
        const workgroupsResponse = await sendMessageToBackgroundScript({
          type: 'getWorkgroups',
        })

        // Filter to only show workgroups marked for sidebar
        const sidebarWorkgroups =
          workgroupsResponse?.data?.filter(
            (group) => group.show_on_sidepanel
          ) || []

        setMemories(sidebarMemories)
        setWorkgroups(sidebarWorkgroups)
      } catch (error) {
        console.error('Error fetching sidebar data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSidebarData()
  }, [searchQuery])

  const mainNavItems = [
    {
      title: 'Dashboard',
      href: '/',
      icon: <LayoutDashboard size={18} />,
    },
    {
      title: 'Memories',
      href: '/memories',
      icon: <Lightbulb size={18} />,
    },
    {
      title: 'User accounts',
      href: '/user_accounts',
      icon: <Users size={18} />,
    },
    {
      title: 'User groups',
      href: '/usergroups',
      icon: <Users size={18} />,
    },
    {
      title: 'Workgroups',
      href: '/workgroups',
      icon: <Building size={18} />,
    },
    {
      title: 'Articles',
      href: '/articles',
      icon: <FileText size={18} />,
    },
    {
      title: 'Tasks',
      href: '/tasks',
      icon: <ClipboardList size={18} />,
    },
    {
      title: 'Users',
      href: '/users',
      icon: <Users size={18} />,
    },
  ]

  const isActive = (href) => {
    return currentPath === href || currentPath.startsWith(`${href}/`)
  }

  const filteredMemories = memories.filter(
    (memory) =>
      !searchQuery ||
      memory.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredWorkgroups = workgroups.filter(
    (group) =>
      !searchQuery ||
      group.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleNavigate = (e, href) => {
    e.preventDefault()
    navigate({ to: href })
  }

  return (
    <div
      className={cn(
        'bg-background flex h-screen flex-col border-r w-full overflow-hidden',
        isExpanded ? 'w-64' : 'w-14'
      )}
    >
      <div className='flex flex-col h-full'>

        {/* Logo & Toggle */}
        <div className='flex h-14 items-center border-b px-3 py-4 flex-shrink-0'>
          {isExpanded ? (
            <h2 className='flex-1 text-lg font-semibold'>100x Bot</h2>
          ) : (
            <div className='flex w-full justify-center'>
              <Sparkles size={20} />
            </div>
          )}
          <Button
            variant='ghost'
            size='icon'
            onClick={() => setIsExpanded(!isExpanded)}
            className='ml-auto'
          >
            {isExpanded ? (
              <ChevronRight size={16} />
            ) : (
              <ChevronRight size={16} className='rotate-180' />
            )}
          </Button>
        </div>

        {/* Main navigation */}
        <ScrollArea>
          <div>
            {isExpanded && (
              <div className='mb-2'>
                <Search />
              </div>
            )}

            <nav className='mb-4 space-y-1'>
              {mainNavItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'hover:bg-accent hover:text-accent-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive(item.href)
                      ? 'bg-accent text-accent-foreground'
                      : 'transparent',
                    !isExpanded && 'justify-center'
                  )}
                  onClick={(e) => handleNavigate(e, item.href)}
                >
                  {item.icon}
                  {isExpanded && <span>{item.title}</span>}
                </Link>
              ))}
            </nav>

            {isExpanded && !searchQuery && (
              <>
                <Separator className='my-4' />

                {/* Memories section */}
                <div>
                  <div
                    className='mb-1 flex cursor-pointer items-center justify-between px-3 py-1'
                    onClick={() => setMemoriesOpen(!memoriesOpen)}
                  >
                    <div className='flex items-center gap-2 text-sm font-medium'>
                      <Lightbulb size={16} />
                      <span>Memories</span>
                    </div>
                    <Button variant='ghost' size='icon' className='h-6 w-6'>
                      {memoriesOpen ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                    </Button>
                  </div>

                  {memoriesOpen && (
                    <div className='my-1 ml-2 space-y-1'>
                      {isLoading ? (
                        <div className='text-muted-foreground px-4 py-2 text-xs'>
                          Loading...
                        </div>
                      ) : filteredMemories.length > 0 ? (
                        filteredMemories.map((memory) => (
                          <Link
                            key={memory.reference_id}
                            to={`/memories/${memory.reference_id}`}
                            className='hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-md px-3 py-1 text-xs font-medium transition-colors'
                            onClick={(e) =>
                              handleNavigate(
                                e,
                                `/memories/${memory.reference_id}`
                              )
                            }
                          >
                            <div className='bg-primary h-1.5 w-1.5 rounded-full'></div>
                            <span className='truncate'>{memory.title}</span>
                          </Link>
                        ))
                      ) : (
                        <div className='text-muted-foreground px-4 py-2 text-xs'>
                          No memories found
                        </div>
                      )}

                      <Link
                        to='/memories'
                        className='text-muted-foreground hover:text-foreground flex items-center gap-2 rounded-md px-3 py-1 text-xs transition-colors'
                        onClick={(e) => handleNavigate(e, '/memories')}
                      >
                        <Plus size={12} />
                        <span>View all memories</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Workgroups section */}
                <div className='mt-2'>
                  <div
                    className='mb-1 flex cursor-pointer items-center justify-between px-3 py-1'
                    onClick={() => setWorkgroupsOpen(!workgroupsOpen)}
                  >
                    <div className='flex items-center gap-2 text-sm font-medium'>
                      <Building size={16} />
                      <span>Workgroups</span>
                    </div>
                    <Button variant='ghost' size='icon' className='h-6 w-6'>
                      {workgroupsOpen ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                    </Button>
                  </div>

                  {workgroupsOpen && (
                    <div className='my-1 ml-2 space-y-1'>
                      {isLoading ? (
                        <div className='text-muted-foreground px-4 py-2 text-xs'>
                          Loading...
                        </div>
                      ) : filteredWorkgroups.length > 0 ? (
                        filteredWorkgroups.map((group) => (
                          <Link
                            key={group.reference_id}
                            to={`/workgroups/${group.reference_id}`}
                            className='hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-md px-3 py-1 text-xs font-medium transition-colors'
                            onClick={(e) =>
                              handleNavigate(
                                e,
                                `/workgroups/${group.reference_id}`
                              )
                            }
                          >
                            <div className='bg-primary h-1.5 w-1.5 rounded-full'></div>
                            <span className='truncate'>{group.name}</span>
                          </Link>
                        ))
                      ) : (
                        <div className='text-muted-foreground px-4 py-2 text-xs'>
                          No workgroups found
                        </div>
                      )}

                      <Link
                        to='/workgroups'
                        className='text-muted-foreground hover:text-foreground flex items-center gap-2 rounded-md px-3 py-1 text-xs transition-colors'
                        onClick={(e) => handleNavigate(e, '/workgroups')}
                      >
                        <Plus size={12} />
                        <span>View all workgroups</span>
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}

            {isExpanded && searchQuery && (
              <div className='mt-4 space-y-4'>
                {/* Search results for memories */}
                {filteredMemories.length > 0 && (
                  <div>
                    <h4 className='text-muted-foreground mb-1 px-3 text-xs font-semibold'>
                      MEMORIES
                    </h4>
                    <div className='space-y-1'>
                      {filteredMemories.map((memory) => (
                        <Link
                          key={memory.reference_id}
                          to={`/memories/${memory.reference_id}`}
                          className='hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-md px-3 py-1 text-xs font-medium transition-colors'
                          onClick={(e) =>
                            handleNavigate(e, `/memories/${memory.reference_id}`)
                          }
                        >
                          <Lightbulb size={12} />
                          <span className='truncate'>{memory.title}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search results for workgroups */}
                {filteredWorkgroups.length > 0 && (
                  <div>
                    <h4 className='text-muted-foreground mb-1 px-3 text-xs font-semibold'>
                      WORKGROUPS
                    </h4>
                    <div className='space-y-1'>
                      {filteredWorkgroups.map((group) => (
                        <Link
                          key={group.reference_id}
                          to={`/workgroups/${group.reference_id}`}
                          className='hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-md px-3 py-1 text-xs font-medium transition-colors'
                          onClick={(e) =>
                            handleNavigate(e, `/workgroups/${group.reference_id}`)
                          }
                        >
                          <Building size={12} />
                          <span className='truncate'>{group.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {filteredMemories.length === 0 &&
                  filteredWorkgroups.length === 0 && (
                    <div className='text-muted-foreground py-4 text-center text-sm'>
                      No results found for "{searchQuery}"
                    </div>
                  )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* User section */}
      <div className='mt-auto flex items-center border-t p-3'>
        {isExpanded ? (
          <>
            <div className='min-w-0 flex-1'>
              <p className='truncate font-medium'>{user?.name || 'Guest'}</p>
              <p className='text-muted-foreground truncate text-xs'>
                {customer?.credit || 0} credits
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
          </>
        ) : (
          <Link
            to='/settings/account'
            onClick={(e) => handleNavigate(e, '/settings/account')}
            className='flex w-full justify-center'
          >
            <Settings size={18} />
          </Link>
        )}
      </div>
    </div>
  )
}

export default AppSidebar
