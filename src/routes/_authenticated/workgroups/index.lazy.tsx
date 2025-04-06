import { createLazyFileRoute } from '@tanstack/react-router'
import WorkgroupsManager from '@/features/workgroupsManager.tsx'

export const Route = createLazyFileRoute('/_authenticated/workgroups/')({
  component: WorkgroupsManager,
})
