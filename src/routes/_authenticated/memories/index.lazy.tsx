import { createLazyFileRoute } from '@tanstack/react-router'
import MemoriesManager from '@/features/memoriesManager'

export const Route = createLazyFileRoute('/_authenticated/memories/')({
  component: MemoriesManager,
})
