import { useMemo } from 'react'
import { Command, LayoutDashboard } from 'lucide-react'
import { useWorldEntities } from '@/hooks/use-world-entities.tsx'
import { type SidebarData } from '../types'

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
    icon: '',
    items: [
      {
        title: 'Account',
        url: '/settings/account',
        icon: '',
      },
    ],
  },
  {
    title: 'Help Center',
    url: '/help-center',
    icon: '',
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
        icon: "",
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
          icon: 'fa-dashboard',
        },
        {
          title: 'Memories',
          url: '/memory',
          icon: 'fa-bulb',
        },
        {
          title: 'User accounts',
          url: '/user_account',
          icon: 'fa-user',
        },
        {
          title: 'User groups',
          url: '/usergroup',
          icon: 'fa-users',
        },
        {
          title: 'Workgroups',
          url: '/workgroup',
          icon: 'fa-building',
        },
        {
          title: 'Customer',
          url: '/customer',
          icon: 'fa-user',
        },
        {
          title: 'Creator',
          url: '/creator',
          icon: '',
        },
        {
          title: 'Articles',
          url: '/article',
          icon: '',
        },
        {
          title: 'Tasks',
          url: '/rpatask',
          icon: '',
        },
      ],
    },
    {
      title: 'Other',
      items: otherItems,
    },
  ],
}
