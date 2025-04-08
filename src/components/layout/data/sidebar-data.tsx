import React from 'react'
import { IconHelp, IconSettings, IconTool } from '@tabler/icons-react'
import {
  AudioWaveform,
  Building,
  ClipboardList,
  Command,
  FileText,
  GalleryVerticalEnd,
  LayoutDashboard,
  Lightbulb, User, UserRound,
  Users,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'satnaing',
    email: 'satnaingdev@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Shadcn Admin',
      logo: Command,
      plan: 'Vite + ShadcnUI',
    },
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
  ],
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
          title: 'Articles',
          url: '/article',
          icon: FileText,
        },
        {
          title: 'Tasks',
          url: '/rpatask',
          icon: ClipboardList,
        },
        {
          title: 'Customer',
          url: '/customer',
          icon: UserRound,
        },
      ],
    },
    {
      title: 'Other',
      items: [
        {
          title: 'Settings',
          icon: IconSettings,
          items: [
            // {
            //   title: 'Profile',
            //   url: '/settings',
            //   icon: IconUserCog,
            // },
            {
              title: 'Account',
              url: '/settings/account',
              icon: IconTool,
            }, // {
            //   title: 'Appearance',
            //   url: '/settings/appearance',
            //   icon: IconPalette,
            // },
            // {
            //   title: 'Notifications',
            //   url: '/settings/notifications',
            //   icon: IconNotification,
            // },
            // {
            //   title: 'Display',
            //   url: '/settings/display',
            //   icon: IconBrowserCheck,
            // },
          ],
        },
        {
          title: 'Help Center',
          url: '/help-center',
          icon: IconHelp,
        },
      ],
    },
  ],
}
