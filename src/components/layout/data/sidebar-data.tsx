import { IconHelp, IconSettings, IconTool } from '@tabler/icons-react'
import {
  Building,
  ClipboardList,
  Command,
  FileText,
  LayoutDashboard,
  Lightbulb,
  User,
  UserCircle,
  UserRound,
  Users,
} from 'lucide-react'
import { type SidebarData } from '../types'
import { useWorldEntities } from '@/hooks/use-world-entities'
import { useMemo } from 'react'

// Static user and team data
const userData = {
  name: 'satnaing',
  email: 'satnaingdev@gmail.com',
  avatar: '/avatars/shadcn.jpg',
}

const teamsData = [
  {
    name: 'Daptin',
    logo: Command,
    plan: '',
  },
]

// Static settings and help items
const otherItems = [
  {
    title: 'Settings',
    icon: IconSettings,
    items: [
      {
        title: 'Account',
        url: '/settings/account',
        icon: IconTool,
      },
    ],
  },
  {
    title: 'Help Center',
    url: '/help-center',
    icon: IconHelp,
  },
]

// Custom hook to generate sidebar data from world entities
export function useSidebarData(): SidebarData {
  const { groupedEntities, isLoading } = useWorldEntities()

  return useMemo(() => {
    // Default items that are always present
    const defaultItems = [
      {
        title: 'Dashboard',
        url: '/',
        icon: LayoutDashboard,
      },
    ]

    // Create nav items from top-level entities
    const entityItems = isLoading
      ? []
      : groupedEntities.topLevel.map((entity) => ({
          title: entity.table_name,
          url: `/${entity.table_name}`,
          icon: entity.icon,
        }))

    return {
      user: userData,
      teams: teamsData,
      navGroups: [
        {
          title: 'General',
          items: [...defaultItems, ...entityItems],
        },
        {
          title: 'Other',
          items: otherItems,
        },
      ],
    }
  }, [groupedEntities, isLoading])
}

// Export a static version for SSR/initial render
export const sidebarData: SidebarData = {
  user: userData,
  teams: teamsData,
  navGroups: [
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Memories',
          url: '/memory',
          icon: Lightbulb,
        },
        {
          title: 'User accounts',
          url: '/user_account',
          icon: User,
        },
        {
          title: 'User groups',
          url: '/usergroup',
          icon: Users,
        },
        {
          title: 'Workgroups',
          url: '/workgroup',
          icon: Building,
        },
        {
          title: 'Customer',
          url: '/customer',
          icon: UserRound,
        },
        {
          title: 'Creator',
          url: '/creator',
          icon: UserCircle,
        },
        {
          title: 'Articles',
          url: '/article',
          icon: FileText,
        },
        {
          title: 'Tasks',
          url: '/rpatask',
          icon: ClipboardList,
        },
      ],
    },
    {
      title: 'Other',
      items: otherItems,
    },
  ],
}
