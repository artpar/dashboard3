'use client'

import { useState } from 'react'
import { IconAlertTriangle } from '@tabler/icons-react'
import { toast } from '@/hooks/use-toast'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { User } from '../data/schema'
import { useUsersStore } from '@/stores/usersStore'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: User
}

export function UsersDeleteDialog({ open, onOpenChange, currentRow }: Props) {
  const [value, setValue] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const { deleteUser } = useUsersStore()

  const handleDelete = async () => {
    if (value.trim() !== currentRow.email) return

    try {
      setIsDeleting(true)
      await deleteUser(currentRow.id)

      onOpenChange(false)
      toast({
        title: 'User deleted',
        description: `${currentRow.firstName} ${currentRow.lastName} has been permanently removed.`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
      setValue('')
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) setValue('')
        onOpenChange(isOpen)
      }}
      handleConfirm={handleDelete}
      disabled={value.trim() !== currentRow.email || isDeleting}
      title={
        <span className='text-destructive'>
          <IconAlertTriangle
            className='stroke-destructive mr-1 inline-block'
            size={18}
          />{' '}
          Delete User
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p className='mb-2'>
            Are you sure you want to delete{' '}
            <span className='font-bold'>{currentRow.email}</span>?
            <br />
            This action will permanently remove the user with the role of{' '}
            {' '}
            from the system. This cannot be undone.
          </p>

          <Label className='my-2'>
            Email:
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder='Enter email to confirm deletion.'
              disabled={isDeleting}
            />
          </Label>

          <Alert variant='destructive'>
            <AlertTitle>Warning!</AlertTitle>
            <AlertDescription>
              Please be careful, this operation can not be rolled back.
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText={isDeleting ? 'Deleting...' : 'Delete'}
      destructive
    />
  )
}
