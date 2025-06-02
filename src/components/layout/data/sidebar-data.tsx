import { useMemo } from 'react'
import { Command } from 'lucide-react'
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
        icon: '',
      },
    ]
    console.log('sidebar.groupedEntities', groupedEntities)

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
      ],
    }
  }, [groupedEntities, isLoading])
}
