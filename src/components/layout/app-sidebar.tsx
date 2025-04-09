import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { sendMessageToBackgroundScript } from '@/background.ts'
import {
  Building,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  Menu,
  Plus,
  Settings,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore.ts'
import { cn } from '@/lib/utils.ts'
import { Button } from '@/components/ui/button.tsx'
import { ScrollArea } from '@/components/ui/scroll-area.tsx'
import { Separator } from '@/components/ui/separator.tsx'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useSidebar } from '@/components/ui/sidebar'
import { SidebarHeader } from '@/components/ui/sidebar.tsx'
import { NavGroup } from '@/components/layout/nav-group'
import { TeamSwitcher } from '@/components/layout/team-switcher.tsx'
import { Search } from '@/components/search.tsx'
import { sidebarData } from './data/sidebar-data'


const AppSidebar = () => {
  const { user, customer } = useAuthStore()
  const [memories, setMemories] = useState([])
  const [workgroups, setWorkgroups] = useState([])
  const [memoriesOpen, setMemoriesOpen] = useState(true)
  const [workgroupsOpen, setWorkgroupsOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Get sidebar state from context
  const { open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar } =
    useSidebar()

  // Derive isExpanded from sidebar context
  const isExpanded = isMobile ? openMobile : open

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

  const isActive = (href) => {
    return currentPath === href || currentPath.startsWith(`${href}/`)
  }

  const filteredMemories = memories.filter(
    (memory: { title }) =>
      !searchQuery ||
      memory.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredWorkgroups = workgroups.filter(
    (group: { name }) =>
      !searchQuery ||
      group.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
                    <NavGroup key={props.title} {...props} />
                  ))}
                </nav>

                {!searchQuery && (
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
                                to={`/memory/${memory.reference_id}`}
                                className='hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-md px-3 py-1 text-xs font-medium transition-colors'
                                onClick={(e) =>
                                  handleNavigate(
                                    e,
                                    `/memory/${memory.reference_id}`
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

                {searchQuery && (
                  <div className='mt-4 space-y-4 px-2'>
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
                                handleNavigate(
                                  e,
                                  `/memories/${memory.reference_id}`
                                )
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
                                handleNavigate(
                                  e,
                                  `/workgroups/${group.reference_id}`
                                )
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
        'bg-background flex h-screen flex-col overflow-hidden border-r transition-all duration-300 ease-in-out',
        isExpanded ? 'w-64' : 'w-14'
      )}
    >
      <div className='flex h-full flex-col'>
        {/* Logo & Toggle */}
        <SidebarHeader>
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

        {/* Main navigation */}
        <ScrollArea className='flex-1 pb-16'>
          <nav className='mb-4 space-y-1'>
            {sidebarData.navGroups.map((props) => (
              <NavGroup key={props.title} {...props} />
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
                          to={`/memory/${memory.reference_id}`}
                          className='hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-md px-3 py-1 text-xs font-medium transition-colors'
                          onClick={(e) =>
                            handleNavigate(e, `/memory/${memory.reference_id}`)
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
        </ScrollArea>
      </div>

      {/* User section */}
      <div
        className={cn(
          'bg-background flex items-center border-t p-3 transition-all duration-300',
          isExpanded ? 'w-64' : 'w-14 justify-center'
        )}
      >
        {isExpanded ? (
          <>
            <div className='min-w-0 flex-1'>
              <p className='truncate font-medium'>{user?.name || 'Guest'}</p>
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
