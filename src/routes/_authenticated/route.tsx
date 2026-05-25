import Cookies from 'js-cookie';
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { SearchProvider } from '@/context/search-context';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AuthGuard } from '@/components/auth-guard';
import AppSidebar from '@/components/layout/app-sidebar'
import SkipToMain from '@/components/skip-to-main';


export const Route = createFileRoute('/_authenticated')({
  component: RouteComponent,
})

function RouteComponent() {
  const defaultOpen = Cookies.get('sidebar:state') !== 'false'
  return (
    <AuthGuard>
      <SearchProvider>
        <SidebarProvider defaultOpen={defaultOpen} className="h-svh overflow-hidden">
          <SkipToMain />
          <AppSidebar />
          <div
            id='content'
            className={cn(
              'flex-1 min-w-0',
              'transition-[width] duration-200 ease-linear',
              'flex h-full flex-col',
              'overflow-hidden'
            )}
          >
            <main className='min-h-0 flex-1 overflow-auto p-2'>
              <Outlet />
            </main>
          </div>
        </SidebarProvider>
      </SearchProvider>
    </AuthGuard>
  )
}
