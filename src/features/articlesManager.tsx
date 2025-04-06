import React, { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { sendMessageToBackgroundScript } from '@/background'
import {
  Clock,
  Edit,
  Eye,
  FileText,
  Link,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  Share2,
  ThumbsUp,
  Trash,
  UserCircle,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

const ArticlesManager = () => {
  const navigate = useNavigate()
  const { user, creator } = useAuthStore()
  const [articles, setArticles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [newArticleDialog, setNewArticleDialog] = useState(false)
  const [viewArticle, setViewArticle] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [articleReplies, setArticleReplies] = useState([])
  const [repliesLoading, setRepliesLoading] = useState(false)

  const [newArticle, setNewArticle] = useState({
    name: '',
    title: '',
    slug: '',
    category: 'general',
    content: '',
    description: '',
    keywords: '',
  })

  // Fetch data
  useEffect(() => {
    const fetchArticles = async () => {
      setIsLoading(true)
      try {
        let articlesResponse
        if (creator?.reference_id) {
          // If user has a creator profile, fetch their articles
          articlesResponse = await sendMessageToBackgroundScript({
            type: 'getArticlesByCreatorId',
            reference_id: creator.reference_id,
          })
        } else {
          // Otherwise fetch featured articles
          articlesResponse = await sendMessageToBackgroundScript({
            type: 'getFeaturedArticle',
          })
          articlesResponse = articlesResponse?.data || []
        }

        setArticles(articlesResponse || [])
      } catch (error) {
        console.error('Error fetching articles:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchArticles()
  }, [creator])

  // Filter articles based on search query
  const filteredArticles = articles.filter(
    (article) =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (article.description &&
        article.description
          .toLowerCase()
          .includes(searchQuery.toLowerCase())) ||
      (article.keywords &&
        article.keywords.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (article.name &&
        article.name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Create new article
  const createArticle = async () => {
    setIsLoading(true)
    try {
      await sendMessageToBackgroundScript({
        type: 'create_article',
        name: newArticle.name,
        slug: newArticle.slug,
        title: newArticle.title,
        category: newArticle.category,
        description: newArticle.description,
        content: newArticle.content,
        keywords: newArticle.keywords,
      })

      // Refresh articles list
      const articlesResponse = await sendMessageToBackgroundScript({
        type: 'getArticlesByCreatorId',
        reference_id: creator.reference_id,
      })

      setArticles(articlesResponse || [])
      setNewArticleDialog(false)
      setNewArticle({
        name: '',
        title: '',
        slug: '',
        category: 'general',
        content: '',
        description: '',
        keywords: '',
      })
    } catch (error) {
      console.error('Error creating article:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Generate slug from title
  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '-')
  }

  // View article details
  const viewArticleDetails = async (articleId) => {
    try {
      // First find the article in our current list
      const selected = articles.find(
        (article) => article.reference_id === articleId
      )
      setViewArticle(selected)

      // Fetch article replies
      setRepliesLoading(true)
      const repliesResponse = await sendMessageToBackgroundScript({
        type: 'getArticleReplies',
        article_id: articleId,
      })

      setArticleReplies(repliesResponse || [])
      setRepliesLoading(false)
    } catch (error) {
      console.error('Error viewing article:', error)
      setRepliesLoading(false)
    }
  }

  // Delete article
  const deleteArticle = async (articleId) => {
    setIsLoading(true)
    try {
      await sendMessageToBackgroundScript({
        type: 'delete_article',
        articleId: articleId,
      })

      // Remove from state
      setArticles(
        articles.filter((article) => article.reference_id !== articleId)
      )
      setConfirmDelete(null)
    } catch (error) {
      console.error('Error deleting article:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle input change for new article form
  const handleInputChange = (e) => {
    const { name, value } = e.target

    // If title is changing, also update the slug (if slug hasn't been manually edited)
    if (name === 'title' && newArticle.slug === generateSlug(newArticle.name)) {
      setNewArticle({
        ...newArticle,
        [name]: value,
        slug: generateSlug(value),
      })
    } else if (name === 'name' && !newArticle.slug) {
      // If name is changing and slug is empty, generate slug
      setNewArticle({
        ...newArticle,
        [name]: value,
        slug: generateSlug(value),
      })
    } else {
      setNewArticle({
        ...newArticle,
        [name]: value,
      })
    }
  }

  // Render article item
  const renderArticleItem = (article) => {
    const createdDate = new Date(article.created_at).toLocaleDateString()

    return (
      <TableRow key={article.reference_id}>
        <TableCell>
          <div className='flex items-center gap-2'>
            <FileText size={16} />
            <span className='font-medium'>{article.title}</span>
          </div>
        </TableCell>
        <TableCell>
          <Badge>{article.category}</Badge>
        </TableCell>
        <TableCell>{article.slug}</TableCell>
        <TableCell>{createdDate}</TableCell>
        <TableCell>
          <div className='flex items-center gap-2'>
            <Button
              size='icon'
              variant='ghost'
              onClick={() => viewArticleDetails(article.reference_id)}
            >
              <Eye size={16} />
            </Button>
            <Button
              size='icon'
              variant='ghost'
              onClick={() => window.open(article.share_link, '_blank')}
            >
              <Share2 size={16} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size='icon' variant='ghost'>
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem
                  onClick={() => viewArticleDetails(article.reference_id)}
                >
                  <Eye className='mr-2 h-4 w-4' />
                  <span>View</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Edit className='mr-2 h-4 w-4' />
                  <span>Edit</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => window.open(article.share_link, '_blank')}
                >
                  <Share2 className='mr-2 h-4 w-4' />
                  <span>Open Public Link</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setConfirmDelete(article)}>
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
          <h1 className='text-2xl font-bold'>Articles</h1>
          <p className='text-muted-foreground'>
            Create and manage content articles
          </p>
        </div>
        <div className='flex flex-col gap-2 sm:flex-row'>
          <div className='relative w-full sm:w-64'>
            <Search className='text-muted-foreground absolute top-2.5 left-2 h-4 w-4' />
            <Input
              placeholder='Search articles...'
              className='pl-8'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setNewArticleDialog(true)} disabled={!creator}>
            <Plus className='mr-2 h-4 w-4' />
            New Article
          </Button>
        </div>
      </div>

      {!creator && (
        <Card className='bg-muted/40'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-2'>
              <UserCircle className='text-muted-foreground h-6 w-6' />
              <div>
                <p className='font-medium'>Creator Profile Required</p>
                <p className='text-muted-foreground text-sm'>
                  You need to create a creator profile before you can publish
                  articles. Visit Settings to set up your profile.
                </p>
              </div>
              <Button
                variant='outline'
                className='ml-auto'
                onClick={() => navigate({ to: '/settings/account' })}
              >
                Setup Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className='p-0'>
          {isLoading ? (
            <div className='space-y-4 p-4'>
              <Skeleton className='h-10 w-full' />
              <Skeleton className='h-10 w-full' />
              <Skeleton className='h-10 w-full' />
            </div>
          ) : filteredArticles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{filteredArticles.map(renderArticleItem)}</TableBody>
            </Table>
          ) : (
            <div className='p-8 text-center'>
              {creator ? (
                <p className='text-muted-foreground'>
                  No articles found. Create your first article!
                </p>
              ) : (
                <p className='text-muted-foreground'>No articles found</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Article Dialog */}
      <Dialog open={newArticleDialog} onOpenChange={setNewArticleDialog}>
        <DialogContent className='sm:max-w-[800px]'>
          <DialogHeader>
            <DialogTitle>Create New Article</DialogTitle>
            <DialogDescription>
              Create a new article to share knowledge and information with your
              audience.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label htmlFor='name' className='text-sm font-medium'>
                  Name (Internal Reference)
                </label>
                <Input
                  id='name'
                  name='name'
                  placeholder='Article Name'
                  value={newArticle.name}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label htmlFor='category' className='text-sm font-medium'>
                  Category
                </label>
                <select
                  id='category'
                  name='category'
                  className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
                  value={newArticle.category}
                  onChange={handleInputChange}
                >
                  <option value='general'>General</option>
                  <option value='tutorial'>Tutorial</option>
                  <option value='guide'>Guide</option>
                  <option value='news'>News</option>
                  <option value='case-study'>Case Study</option>
                </select>
              </div>
            </div>
            <div>
              <label htmlFor='title' className='text-sm font-medium'>
                Title
              </label>
              <Input
                id='title'
                name='title'
                placeholder='Article Title'
                value={newArticle.title}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label
                htmlFor='slug'
                className='flex items-center justify-between text-sm font-medium'
              >
                <span>URL Slug</span>
                <span className='text-muted-foreground text-xs'>
                  https://100x.bot/article/
                  <span className='font-mono'>
                    {newArticle.slug || 'your-slug'}
                  </span>
                </span>
              </label>
              <Input
                id='slug'
                name='slug'
                placeholder='article-slug'
                value={newArticle.slug}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label htmlFor='keywords' className='text-sm font-medium'>
                Keywords
              </label>
              <Input
                id='keywords'
                name='keywords'
                placeholder='Enter keywords separated by commas'
                value={newArticle.keywords}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label htmlFor='description' className='text-sm font-medium'>
                Description / Summary
              </label>
              <Textarea
                id='description'
                name='description'
                placeholder='Brief description of the article...'
                rows={2}
                value={newArticle.description}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label htmlFor='content' className='text-sm font-medium'>
                Content (Markdown supported)
              </label>
              <Textarea
                id='content'
                name='content'
                placeholder='Article content...'
                rows={10}
                value={newArticle.content}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setNewArticleDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={createArticle}
              disabled={
                !newArticle.name ||
                !newArticle.title ||
                !newArticle.slug ||
                !newArticle.content ||
                isLoading
              }
            >
              {isLoading ? 'Creating...' : 'Publish Article'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Article Dialog */}
      {viewArticle && (
        <Dialog open={!!viewArticle} onOpenChange={() => setViewArticle(null)}>
          <DialogContent className='sm:max-w-[800px]'>
            <DialogHeader>
              <DialogTitle>{viewArticle.title}</DialogTitle>
              <DialogDescription className='flex items-center gap-2'>
                <Clock size={14} />
                <span>
                  Published {new Date(viewArticle.created_at).toLocaleString()}
                </span>
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue='content'>
              <TabsList className='mb-4 grid grid-cols-3'>
                <TabsTrigger value='content'>Content</TabsTrigger>
                <TabsTrigger value='details'>Details</TabsTrigger>
                <TabsTrigger value='comments'>
                  Comments
                  <Badge variant='secondary' className='ml-2'>
                    {articleReplies?.length || 0}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value='content' className='space-y-4'>
                {viewArticle.description && (
                  <div className='border-primary/20 mb-4 border-l-4 pl-4 italic'>
                    {viewArticle.description}
                  </div>
                )}

                <div className='prose prose-sm max-w-none'>
                  {/* Here you could render markdown if you had a markdown renderer */}
                  <div className='whitespace-pre-wrap'>
                    {viewArticle.content}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value='details' className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <h4 className='text-sm font-semibold'>Internal Name</h4>
                    <p className='text-sm'>{viewArticle.name}</p>
                  </div>
                  <div>
                    <h4 className='text-sm font-semibold'>Category</h4>
                    <Badge>{viewArticle.category}</Badge>
                  </div>
                </div>

                <div>
                  <h4 className='text-sm font-semibold'>Public URL</h4>
                  <div className='mt-1 flex items-center gap-2'>
                    <Link size={14} />
                    <a
                      href={viewArticle.share_link}
                      target='_blank'
                      rel='noreferrer'
                      className='text-primary text-sm underline'
                    >
                      {viewArticle.share_link}
                    </a>
                  </div>
                </div>

                {viewArticle.keywords && (
                  <div>
                    <h4 className='text-sm font-semibold'>Keywords</h4>
                    <div className='mt-1 flex flex-wrap gap-2'>
                      {viewArticle.keywords.split(',').map((keyword, idx) => (
                        <Badge key={idx} variant='outline'>
                          {keyword.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <h4 className='text-sm font-semibold'>Created</h4>
                    <p className='text-sm'>
                      {new Date(viewArticle.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <h4 className='text-sm font-semibold'>Last Updated</h4>
                    <p className='text-sm'>
                      {new Date(viewArticle.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value='comments' className='space-y-4'>
                {repliesLoading ? (
                  <div className='space-y-2'>
                    <Skeleton className='h-20 w-full' />
                    <Skeleton className='h-20 w-full' />
                  </div>
                ) : articleReplies.length > 0 ? (
                  <div className='space-y-4'>
                    {articleReplies.map((reply) => (
                      <Card key={reply.reference_id}>
                        <CardContent className='p-4'>
                          <div className='flex items-start justify-between'>
                            <div className='flex items-center gap-2'>
                              <UserCircle size={18} />
                              <div>
                                <p className='text-sm font-medium'>
                                  {reply.customer_id?.name || 'Anonymous'}
                                </p>
                                <p className='text-muted-foreground text-xs'>
                                  {new Date(reply.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant={
                                reply.status === 'active'
                                  ? 'default'
                                  : 'outline'
                              }
                            >
                              {reply.status}
                            </Badge>
                          </div>
                          <div className='mt-2 text-sm'>
                            {reply.reply_id?.content || 'No content available'}
                          </div>
                          <div className='mt-2 flex items-center gap-4'>
                            <Button size='sm' variant='ghost'>
                              <ThumbsUp size={14} className='mr-1' />
                              <span>0</span>
                            </Button>
                            <Button size='sm' variant='ghost'>
                              <MessageSquare size={14} className='mr-1' />
                              <span>Reply</span>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className='p-4 text-center'>
                    <p className='text-muted-foreground'>No comments yet</p>
                  </div>
                )}

                <div className='mt-4'>
                  <Textarea placeholder='Add a comment...' rows={3} />
                  <div className='mt-2 flex justify-end'>
                    <Button>Post Comment</Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant='outline' onClick={() => setViewArticle(null)}>
                Close
              </Button>
              <Button
                variant='secondary'
                onClick={() => window.open(viewArticle.share_link, '_blank')}
              >
                <Share2 className='mr-2 h-4 w-4' />
                Open Public Page
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
              <DialogTitle>Delete Article</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{confirmDelete.title}"? This
                action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant='outline' onClick={() => setConfirmDelete(null)}>
                Cancel
              </Button>
              <Button
                variant='destructive'
                onClick={() => deleteArticle(confirmDelete.reference_id)}
                disabled={isLoading}
              >
                {isLoading ? 'Deleting...' : 'Delete Article'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default ArticlesManager
