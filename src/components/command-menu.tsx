import React from 'react'
import { Link } from '@tanstack/react-router'
import {
  IconArrowRightDashed,
  IconDeviceLaptop,
  IconMoon,
  IconSun,
} from '@tabler/icons-react'
import { useSearch } from '@/context/search-context'
import { useTheme } from '@/context/theme-context'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { useSidebarData } from './layout/data/sidebar-data.tsx'
import { ScrollArea } from './ui/scroll-area'

export function CommandMenu() {
  const { setTheme } = useTheme()
  const { open, setOpen } = useSearch()
  const sidebarData = useSidebarData();

  const runCommand = React.useCallback(
    (command: () => unknown) => {
      setOpen(false)
      command()
    },
    [setOpen]
  )

  const closeMenu = React.useCallback(() => {
    setOpen(false)
  }, [setOpen])

  return (
    <CommandDialog modal open={open} onOpenChange={setOpen}>
      <CommandInput placeholder='Type a command or search...' />
      <CommandList>
        <ScrollArea type='hover' className='h-72 pr-1'>
          <CommandEmpty>No results found.</CommandEmpty>
          {sidebarData.navGroups.map((group) => (
            <CommandGroup key={group.title} heading={group.title}>
              {group.items.map((navItem, i) => {
                if (navItem.url)
                  return (
                    <CommandItem
                      key={`${navItem.url}-${i}`}
                      value={navItem.title}
                      asChild
                    >
                      <Link to={navItem.url} onClick={closeMenu}>
                        <div className='mr-2 flex h-4 w-4 items-center justify-center'>
                          <IconArrowRightDashed className='text-muted-foreground/80 size-2' />
                        </div>
                        {navItem.title}
                      </Link>
                    </CommandItem>
                  )

                return navItem.items?.map((subItem, i) => (
                  <CommandItem
                    key={`${subItem.url}-${i}`}
                    value={subItem.title}
                    asChild
                  >
                    <Link to={subItem.url} onClick={closeMenu}>
                      <div className='mr-2 flex h-4 w-4 items-center justify-center'>
                        <IconArrowRightDashed className='text-muted-foreground/80 size-2' />
                      </div>
                      {subItem.title}
                    </Link>
                  </CommandItem>
                ))
              })}
            </CommandGroup>
          ))}
          <CommandSeparator />
          <CommandGroup heading='Theme'>
            <CommandItem onSelect={() => runCommand(() => setTheme('light'))}>
              <IconSun /> <span>Light</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('dark'))}>
              <IconMoon className='scale-90' />
              <span>Dark</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('system'))}>
              <IconDeviceLaptop />
              <span>System</span>
            </CommandItem>
          </CommandGroup>
        </ScrollArea>
      </CommandList>
    </CommandDialog>
  )
}
