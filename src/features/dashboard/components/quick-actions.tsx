import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { Database, FileSpreadsheet, PlusCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function QuickActions() {
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)

  const handleRefresh = async () => {
    setRefreshing(true)
    // Simulate refreshing data
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setRefreshing(false)
    // In a real implementation, this would refresh the dashboard data
  }

  const handleNavigate = (path: string) => {
    router.navigate({ to: path })
  }

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault()
    if (importFile) {
      // In a real implementation, this would upload and process the file
      console.log('Importing file:', importFile.name)
      setImportFile(null)
      setShowImportDialog(false)
    }
  }

  return (
    <div className='flex items-center gap-2'>
      <Button
        variant='outline'
        size='sm'
        onClick={handleRefresh}
        disabled={refreshing}
      >
        <RefreshCw
          className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
        />
        Refresh
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size='sm'>
            <PlusCircle className='mr-2 h-4 w-4' />
            Create
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Quick Create</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleNavigate('/resources/new')}>
            <Database className='mr-2 h-4 w-4' />
            New Resource
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleNavigate('/actions/new')}>
            <PlusCircle className='mr-2 h-4 w-4' />
            New Action
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleNavigate('/users/new')}>
            <PlusCircle className='mr-2 h-4 w-4' />
            New User
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowImportDialog(true)}>
            <FileSpreadsheet className='mr-2 h-4 w-4' />
            Import Data
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Data</DialogTitle>
            <DialogDescription>
              Upload a CSV, XLSX, or JSON file to import data into Daptin.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleImport} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='file'>File</Label>
              <Input
                id='file'
                type='file'
                accept='.csv,.xlsx,.json'
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                required
              />
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setShowImportDialog(false)}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={!importFile}>
                Import
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
