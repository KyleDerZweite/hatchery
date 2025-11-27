import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eggsApi, EggCreateData } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { Plus, Egg, ExternalLink, Trash2, Eye, EyeOff } from 'lucide-react'
import { AxiosError } from 'axios'

export function EggsPage() {
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [sourceUrl, setSourceUrl] = useState('')
  const [visibility, setVisibility] = useState<'private' | 'public'>('private')
  const [javaVersion, setJavaVersion] = useState('17')

  const { data: eggs = [], isLoading } = useQuery({
    queryKey: ['eggs'],
    queryFn: () => eggsApi.list(),
  })

  const createMutation = useMutation({
    mutationFn: (data: EggCreateData) => eggsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eggs'] })
      setIsDialogOpen(false)
      setSourceUrl('')
      toast({
        title: 'Egg created!',
        description: 'Your egg configuration has been generated.',
      })
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      toast({
        variant: 'destructive',
        title: 'Failed to create egg',
        description: error.response?.data?.detail || 'An error occurred',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => eggsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eggs'] })
      toast({
        title: 'Egg deleted',
        description: 'The egg configuration has been removed.',
      })
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      toast({
        variant: 'destructive',
        title: 'Failed to delete egg',
        description: error.response?.data?.detail || 'An error occurred',
      })
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      source_url: sourceUrl,
      visibility,
      java_version: parseInt(javaVersion),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Eggs</h1>
          <p className="text-muted-foreground">
            Manage your Pterodactyl egg configurations
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Egg
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create New Egg</DialogTitle>
                <DialogDescription>
                  Enter a CurseForge or Modrinth modpack URL to generate an egg configuration.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="url">Modpack URL</Label>
                  <Input
                    id="url"
                    placeholder="https://modrinth.com/modpack/..."
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Supports CurseForge and Modrinth modpack URLs
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="visibility">Visibility</Label>
                    <Select value={visibility} onValueChange={(v) => setVisibility(v as 'private' | 'public')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="public">Public</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="java">Java Version</Label>
                    <Select value={javaVersion} onValueChange={setJavaVersion}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="8">Java 8</SelectItem>
                        <SelectItem value="11">Java 11</SelectItem>
                        <SelectItem value="17">Java 17</SelectItem>
                        <SelectItem value="21">Java 21</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Egg'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading eggs...</div>
      ) : eggs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Egg className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No eggs yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first egg from a modpack URL to get started.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Egg
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {eggs.map((egg) => (
            <Card key={egg.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{egg.name}</CardTitle>
                    <CardDescription className="capitalize">
                      {egg.source} • Java {egg.java_version}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    {egg.visibility === 'public' ? (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {egg.description || 'No description'}
                </p>
                <div className="flex items-center gap-2">
                  <Button asChild size="sm" className="flex-1">
                    <Link to={`/eggs/${egg.id}`}>View Details</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(egg.source_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteMutation.mutate(egg.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
