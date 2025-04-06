import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.tsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog.tsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { sendMessageToBackgroundScript } from '@/background.ts';
import {
  Lightbulb,
  Star,
  StarOff,
  MoreHorizontal,
  Edit,
  Trash,
  Plus,
  Search,
  ThumbsUp,
  MessageSquare,
  Eye,
  EyeOff,
  ArrowUpDown,
  RefreshCcw,
} from 'lucide-react';

const MemoriesManager = () => {
  const navigate = useNavigate();
  const [memories, setMemories] = useState([]);
  const [favoriteMemories, setFavoriteMemories] = useState([]);
  const [workgroups, setWorkgroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMemoryDialog, setNewMemoryDialog] = useState(false);
  const [newMemory, setNewMemory] = useState({
    title: '',
    content: '',
    description: '',
    keywords: '',
    workgroup_id: '',
    memory_type: 'workflow',
    show_on_sidepanel: true
  });
  const [viewMemory, setViewMemory] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch memories
        const memoriesResponse = await sendMessageToBackgroundScript({
          type: 'getAllMemories'
        });

        // Fetch workgroups
        const workgroupsResponse = await sendMessageToBackgroundScript({
          type: 'getWorkgroups'
        });

        // Fetch favorites
        const favoritesResponse = await sendMessageToBackgroundScript({
          type: 'getCustomerFavourites'
        });

        setMemories(memoriesResponse || []);
        setWorkgroups(workgroupsResponse?.data || []);
        setFavoriteMemories(favoritesResponse?.data || []);
      } catch (error) {
        console.error("Error fetching memories:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter memories based on search query
  const filteredMemories = memories.filter(memory =>
    memory.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (memory.description && memory.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (memory.keywords && memory.keywords.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Check if memory is favorite
  const isFavorite = (memoryId) => {
    return favoriteMemories.some(fav => fav.id === memoryId);
  };

  // Add/remove from favorites
  const toggleFavorite = async (memoryId) => {
    try {
      if (isFavorite(memoryId)) {
        await sendMessageToBackgroundScript({
          type: 'removeFavouriteMemory',
          memory_id: memoryId
        });
        setFavoriteMemories(favoriteMemories.filter(fav => fav.id !== memoryId));
      } else {
        await sendMessageToBackgroundScript({
          type: 'addFavouriteMemory',
          memory_id: memoryId
        });
        // Add to favorites
        const memory = memories.find(m => m.reference_id === memoryId);
        setFavoriteMemories([...favoriteMemories, { id: memoryId, ...memory }]);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  // Create new memory
  const createMemory = async () => {
    setIsLoading(true);
    try {
      await sendMessageToBackgroundScript({
        type: 'create_memory',
        title: newMemory.title,
        content: newMemory.content,
        description: newMemory.description,
        keywords: newMemory.keywords,
        workgroup_id: newMemory.workgroup_id,
        memory_type: newMemory.memory_type,
        show_on_sidepanel: newMemory.show_on_sidepanel ? 1 : 0,
      });

      // Refresh memories list
      const memoriesResponse = await sendMessageToBackgroundScript({
        type: 'getAllMemories'
      });

      setMemories(memoriesResponse || []);
      setNewMemoryDialog(false);
      setNewMemory({
        title: '',
        content: '',
        description: '',
        keywords: '',
        workgroup_id: '',
        memory_type: 'workflow',
        show_on_sidepanel: true
      });
    } catch (error) {
      console.error("Error creating memory:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // View memory details
  const viewMemoryDetails = async (memoryId) => {
    try {
      const memoryResponse = await sendMessageToBackgroundScript({
        type: 'getMemoryById',
        reference_id: memoryId
      });
      setViewMemory(memoryResponse);
    } catch (error) {
      console.error("Error viewing memory:", error);
    }
  };

  // Delete memory
  const deleteMemory = async (memoryId) => {
    setIsLoading(true);
    try {
      // Would need to implement this endpoint in background.ts
      await sendMessageToBackgroundScript({
        type: 'deleteMemory',
        memory_id: memoryId
      });

      // Remove from state
      setMemories(memories.filter(memory => memory.reference_id !== memoryId));
      setConfirmDelete(null);
    } catch (error) {
      console.error("Error deleting memory:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change for new memory form
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewMemory({
      ...newMemory,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Render memory item
  const renderMemoryItem = (memory) => {
    const createdDate = new Date(memory.created_at).toLocaleDateString();
    const updatedDate = new Date(memory.updated_at).toLocaleDateString();
    const isFav = isFavorite(memory.reference_id);

    return (
      <TableRow key={memory.reference_id}>
        <TableCell>
          <div className="flex items-center gap-2">
            <Lightbulb size={16} />
            <span className="font-medium">{memory.title}</span>
          </div>
        </TableCell>
        <TableCell>{memory.memory_type || 'workflow'}</TableCell>
        <TableCell>{createdDate}</TableCell>
        <TableCell>{updatedDate}</TableCell>
        <TableCell>
          <Badge variant={memory.show_on_sidepanel ? "default" : "outline"}>
            {memory.show_on_sidepanel ? "Visible" : "Hidden"}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => toggleFavorite(memory.reference_id)}
            >
              {isFav ? <Star size={16} className="text-yellow-500" /> : <StarOff size={16} />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => viewMemoryDetails(memory.reference_id)}
            >
              <Eye size={16} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost">
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => viewMemoryDetails(memory.reference_id)}>
                  <Eye className="mr-2 h-4 w-4" />
                  <span>View</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Edit</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setConfirmDelete(memory)}>
                  <Trash className="mr-2 h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Memories</h1>
          <p className="text-muted-foreground">Manage and organize your workflow memories</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search memories..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setNewMemoryDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Memory
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Memories</TabsTrigger>
          <TabsTrigger value="favorites">
            Favorites
            <Badge variant="secondary" className="ml-2">
              {favoriteMemories.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : filteredMemories.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead>Visibility</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMemories.map(renderMemoryItem)}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground">No memories found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="favorites" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : favoriteMemories.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead>Visibility</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {favoriteMemories
                      .map(fav => memories.find(m => m.reference_id === fav.id))
                      .filter(Boolean)
                      .filter(memory =>
                        memory.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (memory.description && memory.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        (memory.keywords && memory.keywords.toLowerCase().includes(searchQuery.toLowerCase()))
                      )
                      .map(renderMemoryItem)}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground">No favorite memories</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Memory Dialog */}
      <Dialog open={newMemoryDialog} onOpenChange={setNewMemoryDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Memory</DialogTitle>
            <DialogDescription>
              Create a new workflow memory that can be used in your application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="title"
                name="title"
                placeholder="Memory Title"
                value={newMemory.title}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="memory_type" className="text-sm font-medium">
                  Type
                </label>
                <select
                  id="memory_type"
                  name="memory_type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newMemory.memory_type}
                  onChange={handleInputChange}
                >
                  <option value="workflow">Workflow</option>
                  <option value="knowledge">Knowledge</option>
                  <option value="guide">Guide</option>
                </select>
              </div>
              <div>
                <label htmlFor="workgroup_id" className="text-sm font-medium">
                  Workgroup
                </label>
                <select
                  id="workgroup_id"
                  name="workgroup_id"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newMemory.workgroup_id}
                  onChange={handleInputChange}
                >
                  <option value="">None</option>
                  {workgroups.map(group => (
                    <option key={group.reference_id} value={group.reference_id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="keywords" className="text-sm font-medium">
                Keywords
              </label>
              <Input
                id="keywords"
                name="keywords"
                placeholder="Enter keywords separated by commas"
                value={newMemory.keywords}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                name="description"
                placeholder="Memory description..."
                rows={2}
                value={newMemory.description}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label htmlFor="content" className="text-sm font-medium">
                Content
              </label>
              <Textarea
                id="content"
                name="content"
                placeholder="Memory content..."
                rows={5}
                value={newMemory.content}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="show_on_sidepanel"
                name="show_on_sidepanel"
                checked={newMemory.show_on_sidepanel}
                onChange={handleInputChange}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="show_on_sidepanel" className="text-sm font-medium">
                Show on sidebar
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewMemoryDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createMemory} disabled={!newMemory.title || !newMemory.content || isLoading}>
              {isLoading ? "Creating..." : "Create Memory"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Memory Dialog */}
      {viewMemory && (
        <Dialog open={!!viewMemory} onOpenChange={() => setViewMemory(null)}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>{viewMemory.title}</DialogTitle>
              <DialogDescription>
                Created {new Date(viewMemory.created_at).toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {viewMemory.description && (
                <div>
                  <h4 className="text-sm font-semibold mb-1">Description</h4>
                  <p className="text-sm text-muted-foreground">{viewMemory.description}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {viewMemory.keywords && viewMemory.keywords.split(',').map((keyword, idx) => (
                  <Badge key={idx} variant="secondary">{keyword.trim()}</Badge>
                ))}
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-1">Content</h4>
                <div className="border rounded-md p-4 bg-muted/30 whitespace-pre-wrap">
                  {viewMemory.content}
                </div>
              </div>

              <div className="flex flex-wrap justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={viewMemory.memory_type ? "default" : "outline"}>
                    {viewMemory.memory_type || "Workflow"}
                  </Badge>
                  <Badge variant={viewMemory.show_on_sidepanel ? "default" : "outline"}>
                    {viewMemory.show_on_sidepanel ? "Visible on Sidebar" : "Hidden"}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleFavorite(viewMemory.reference_id)}
                  >
                    {isFavorite(viewMemory.reference_id) ? (
                      <>
                        <Star className="mr-2 h-4 w-4 text-yellow-500" />
                        Favorite
                      </>
                    ) : (
                      <>
                        <StarOff className="mr-2 h-4 w-4" />
                        Add to favorites
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewMemory(null)}>
                Close
              </Button>
              <Button variant="default">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {confirmDelete && (
        <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Memory</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{confirmDelete.title}"?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteMemory(confirmDelete.reference_id)}
                disabled={isLoading}
              >
                {isLoading ? "Deleting..." : "Delete Memory"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default MemoriesManager;
