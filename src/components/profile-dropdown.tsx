import { Link } from '@tanstack/react-router'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/stores/authStore'
import { useNavigate } from '@tanstack/react-router'

export function ProfileDropdown() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate({ to: '/sign-in' })
  }

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user || !user.name) return 'U'
    const nameParts = user.name.split(' ')
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
    }
    return nameParts[0][0].toUpperCase()
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
          <Avatar className='h-8 w-8'>
            <AvatarImage src='/avatars/01.png' alt={user?.name || 'User'} />
            <AvatarFallback>{getUserInitials()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56' align='end' forceMount>
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col space-y-1'>
            <p className='text-sm leading-none font-medium'>{user?.name || 'User'}</p>
            <p className='text-muted-foreground text-xs leading-none'>
              {user?.email || 'user@example.com'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to='/settings'>
              Account
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
          {/*<DropdownMenuItem asChild>*/}
          {/*  <Link to='/settings'>*/}
          {/*    Billing*/}
          {/*    <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>*/}
          {/*  </Link>*/}
          {/*</DropdownMenuItem>*/}
          {/*<DropdownMenuItem asChild>*/}
          {/*  <Link to='/settings'>*/}
          {/*    Settings*/}
          {/*    <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>*/}
          {/*  </Link>*/}
          {/*</DropdownMenuItem>*/}
          {/*<DropdownMenuItem>New Team</DropdownMenuItem>*/}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          Log out
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
