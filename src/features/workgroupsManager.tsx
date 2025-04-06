import React, { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { sendMessageToBackgroundScript } from '@/background.ts'
import {
  Building,
  Edit,
  Eye,
  Folder,
  MoreHorizontal,
  Plus,
  Search,
  Trash,
  UserCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge.tsx'
import { Button } from '@/components/ui/button.tsx'
import { Card, CardContent } from '@/components/ui/card.tsx'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.tsx'
import { Textarea } from '@/components/ui/textarea.tsx'

const WorkgroupsManager = () => {
  const navigate = useNavigate()
  const [workgroups, setWorkgroups] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [newWorkgroupDialog, setNewWorkgroupDialog] = useState(false)
  const [viewWorkgroup, setViewWorkgroup] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [workgroupMemories, setWorkgroupMemories] = useState([])
  const [workgroupMemoriesLoading, setWorkgroupMemoriesLoading] =
    useState(false)

  const [newWorkgroup, setNewWorkgroup] = useState({
    name: '',
    description: '',
    group_type: 'public',
    category: 'none',
    show_on_sidepanel: true,
    display_order: 100,
  })

  // Fetch data
  useEffect(() => {
    const fetchWorkgroups = async () => {
      setIsLoading(true)
      try {
        // Fetch workgroups
        const workgroupsResponse = await sendMessageToBackgroundScript({
          type: 'getWorkgroups',
        })

        setWorkgroups(workgroupsResponse?.data || [])
      } catch (error) {
        console.error('Error fetching workgroups:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWorkgroups()
  }, [])

  // Filter workgroups based on search query
  const filteredWorkgroups = workgroups.filter(
    (workgroup) =>
      workgroup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (workgroup.description &&
        workgroup.description
          .toLowerCase()
          .includes(searchQuery.toLowerCase())) ||
      (workgroup.category &&
        workgroup.category.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Create new workgroup
  const createWorkgroup = async () => {
    setIsLoading(true)
    try {
      // This endpoint would need to be implemented in background.ts
      await sendMessageToBackgroundScript({
        type: 'createWorkgroup',
        payload: {
          name: newWorkgroup.name,
          description: newWorkgroup.description,
          group_type: newWorkgroup.group_type,
          category: newWorkgroup.category,
          show_on_sidepanel: newWorkgroup.show_on_sidepanel ? 1 : 0,
          display_order: Number(newWorkgroup.display_order),
        },
      })

      // Refresh workgroups list
      const workgroupsResponse = await sendMessageToBackgroundScript({
        type: 'getWorkgroups',
      })

      setWorkgroups(workgroupsResponse?.data || [])
      setNewWorkgroupDialog(false)
      setNewWorkgroup({
        name: '',
        description: '',
        group_type: 'public',
        category: 'none',
        show_on_sidepanel: true,
        display_order: 100,
      })
    } catch (error) {
      console.error('Error creating workgroup:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // View workgroup details
  const viewWorkgroupDetails = async (workgroupId) => {
    const selected = workgroups.find((wg) => wg.reference_id === workgroupId)
    setViewWorkgroup(selected)

    // Fetch memories associated with this workgroup
    setWorkgroupMemoriesLoading(true)
    try {
      const memoriesResponse = await sendMessageToBackgroundScript({
        type: 'getMemoriesForWorkgroup',
        reference_id: workgroupId,
      })

      setWorkgroupMemories(memoriesResponse || [])
    } catch (error) {
      console.error('Error fetching workgroup memories:', error)
      setWorkgroupMemories([])
    } finally {
      setWorkgroupMemoriesLoading(false)
    }
  }

  // Delete workgroup
  const deleteWorkgroup = async (workgroupId) => {
    setIsLoading(true)
    try {
      // This endpoint would need to be implemented in background.ts
      await sendMessageToBackgroundScript({
        type: 'deleteWorkgroup',
        workgroup_id: workgroupId,
      })

      // Remove from state
      setWorkgroups(workgroups.filter((wg) => wg.reference_id !== workgroupId))
      setConfirmDelete(null)
    } catch (error) {
      console.error('Error deleting workgroup:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle input change for new workgroup form
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setNewWorkgroup({
      ...newWorkgroup,
      [name]: type === 'checkbox' ? checked : value,
    })
  }

  // Get appropriate icon for workgroup type
  const getWorkgroupIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'public':
        return <Building size={16} />
      case 'private':
        return <Building size={16} />
      case 'personal':
        return <UserCircle size={16} />
      default:
        return <Folder size={16} />
    }
  }

  // Render workgroup item
  const renderWorkgroupItem = (workgroup) => {
    const createdDate = new Date(workgroup.created_at).toLocaleDateString()

    return (
      <TableRow key={workgroup.reference_id}>
        <TableCell>
          <div className='flex items-center gap-2'>
            {getWorkgroupIcon(workgroup.group_type)}
            <span className='font-medium'>{workgroup.name}</span>
          </div>
        </TableCell>
        <TableCell>
          <Badge>{workgroup.group_type}</Badge>
        </TableCell>
        <TableCell>
          {workgroup.category !== 'none' ? workgroup.category : '-'}
        </TableCell>
        <TableCell>{createdDate}</TableCell>
        <TableCell>
          <Badge variant={workgroup.show_on_sidepanel ? 'default' : 'outline'}>
            {workgroup.show_on_sidepanel ? 'Visible' : 'Hidden'}
          </Badge>
        </TableCell>
        <TableCell>
          <div className='flex items-center gap-2'>
            <Button
              size='icon'
              variant='ghost'
              onClick={() => viewWorkgroupDetails(workgroup.reference_id)}
            >
              <Eye size={16} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size='icon' variant='ghost'>
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem
                  onClick={() => viewWorkgroupDetails(workgroup.reference_id)}
                >
                  <Eye className='mr-2 h-4 w-4' />
                  <span>View</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Edit className='mr-2 h-4 w-4' />
                  <span>Edit</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setConfirmDelete(workgroup)}>
                  <Trash className='mr-2 h-4 w-4' />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col justify-between gap-4 md:flex-row md:items-center'>
        <div>
          <h1 className='text-2xl font-bold'>Workgroups</h1>
          <p className='text-muted-foreground'>
            Manage workgroups to organize your team and content
          </p>
        </div>
        <div className='flex flex-col gap-2 sm:flex-row'>
          <div className='relative w-full sm:w-64'>
            <Search className='text-muted-foreground absolute top-2.5 left-2 h-4 w-4' />
            <Input
              placeholder='Search workgroups...'
              className='pl-8'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setNewWorkgroupDialog(true)}>
            <Plus className='mr-2 h-4 w-4' />
            New Workgroup
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className='p-0'>
          {isLoading ? (
            <div className='space-y-4 p-4'>
              <Skeleton className='h-10 w-full' />
              <Skeleton className='h-10 w-full' />
              <Skeleton className='h-10 w-full' />
            </div>
          ) : filteredWorkgroups.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkgroups.map(renderWorkgroupItem)}
              </TableBody>
            </Table>
          ) : (
            <div className='p-8 text-center'>
              <p className='text-muted-foreground'>No workgroups found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Workgroup Dialog */}
      <Dialog open={newWorkgroupDialog} onOpenChange={setNewWorkgroupDialog}>
        <DialogContent className='sm:max-w-[600px]'>
          <DialogHeader>
            <DialogTitle>Create New Workgroup</DialogTitle>
            <DialogDescription>
              Create a new workgroup to organize your team, memories, and
              content.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <label htmlFor='name' className='text-sm font-medium'>
                Name
              </label>
              <Input
                id='name'
                name='name'
                placeholder='Workgroup Name'
                value={newWorkgroup.name}
                onChange={handleInputChange}
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label htmlFor='group_type' className='text-sm font-medium'>
                  Type
                </label>
                <select
                  id='group_type'
                  name='group_type'
                  className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
                  value={newWorkgroup.group_type}
                  onChange={handleInputChange}
                >
                  <option value='public'>Public</option>
                  <option value='private'>Private</option>
                  <option value='personal'>Personal</option>
                </select>
              </div>
              <div>
                <label htmlFor='category' className='text-sm font-medium'>
                  Category
                </label>
                <select
                  id='category'
                  name='category'
                  className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
                  value={newWorkgroup.category}
                  onChange={handleInputChange}
                >
                  <option value='none'>None</option>
                  <option value='teams'>Teams</option>
                  <option value='projects'>Projects</option>
                  <option value='departments'>Departments</option>
                  <option value='resources'>Resources</option>
                </select>
              </div>
            </div>
            <div>
              <label htmlFor='display_order' className='text-sm font-medium'>
                Display Order
              </label>
              <Input
                id='display_order'
                name='display_order'
                type='number'
                placeholder='100'
                value={newWorkgroup.display_order}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label htmlFor='description' className='text-sm font-medium'>
                Description
              </label>
              <Textarea
                id='description'
                name='description'
                placeholder='Workgroup description...'
                rows={3}
                value={newWorkgroup.description}
                onChange={handleInputChange}
              />
            </div>
            <div className='flex items-center space-x-2'>
              <input
                type='checkbox'
                id='show_on_sidepanel'
                name='show_on_sidepanel'
                checked={newWorkgroup.show_on_sidepanel}
                onChange={handleInputChange}
                className='text-primary focus:ring-primary h-4 w-4 rounded border-gray-300'
              />
              <label
                htmlFor='show_on_sidepanel'
                className='text-sm font-medium'
              >
                Show on sidebar
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setNewWorkgroupDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={createWorkgroup}
              disabled={!newWorkgroup.name || isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Workgroup'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Workgroup Dialog */}
      {viewWorkgroup && (
        <Dialog
          open={!!viewWorkgroup}
          onOpenChange={() => setViewWorkgroup(null)}
        >
          <DialogContent className='sm:max-w-[700px]'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                {getWorkgroupIcon(viewWorkgroup.group_type)}
                {viewWorkgroup.name}
              </DialogTitle>
              <DialogDescription>
                Created {new Date(viewWorkgroup.created_at).toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-4'>
              {viewWorkgroup.description && (
                <div>
                  <h4 className='mb-1 text-sm font-semibold'>Description</h4>
                  <p className='text-muted-foreground text-sm'>
                    {viewWorkgroup.description}
                  </p>
                </div>
              )}

              <div className='flex flex-wrap gap-2'>
                <Badge variant='secondary'>{viewWorkgroup.group_type}</Badge>
                {viewWorkgroup.category !== 'none' && (
                  <Badge variant='outline'>{viewWorkgroup.category}</Badge>
                )}
                <Badge
                  variant={
                    viewWorkgroup.show_on_sidepanel ? 'default' : 'outline'
                  }
                >
                  {viewWorkgroup.show_on_sidepanel
                    ? 'Visible on Sidebar'
                    : 'Hidden'}
                </Badge>
              </div>

              <div>
                <h4 className='mb-2 text-sm font-semibold'>
                  Associated Memories
                </h4>
                {workgroupMemoriesLoading ? (
                  <div className='space-y-2'>
                    <Skeleton className='h-8 w-full' />
                    <Skeleton className='h-8 w-full' />
                  </div>
                ) : workgroupMemories.length > 0 ? (
                  <div className='divide-y rounded-md border'>
                    {workgroupMemories.map((memory) => (
                      <div
                        key={memory.reference_id}
                        className='flex items-center justify-between p-2'
                      >
                        <div className='flex items-center gap-2'>
                          <FileText size={14} />
                          <span>{memory.title}</span>
                        </div>
                        <Badge size='sm' variant='outline'>
                          {memory.memory_type || 'workflow'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className='text-muted-foreground text-sm'>
                    No memories associated with this workgroup
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setViewWorkgroup(null)}>
                Close
              </Button>
              <Button variant='default'>
                <Edit className='mr-2 h-4 w-4' />
                Edit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {confirmDelete && (
        <Dialog
          open={!!confirmDelete}
          onOpenChange={() => setConfirmDelete(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Workgroup</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{confirmDelete.name}"? This
                action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant='outline' onClick={() => setConfirmDelete(null)}>
                Cancel
              </Button>
              <Button
                variant='destructive'
                onClick={() => deleteWorkgroup(confirmDelete.reference_id)}
                disabled={isLoading}
              >
                {isLoading ? 'Deleting...' : 'Delete Workgroup'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default WorkgroupsManager
