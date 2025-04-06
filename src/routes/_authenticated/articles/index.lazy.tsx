import { createLazyFileRoute } from '@tanstack/react-router'
import ArticlesManager from '@/features/articlesManager.tsx'

export const Route = createLazyFileRoute('/_authenticated/articles/')({
  component: ArticlesManager,
})
