import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eggsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { ArrowLeft, Download, RefreshCw, ExternalLink, Copy, Pencil } from 'lucide-react'
import { AxiosError } from 'axios'
import { useAuth } from '@/lib/auth'
import { EditEggDialog } from '@/components/eggs/EditEggDialog'
import { useState } from 'react'

export function EggDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [isEditOpen, setIsEditOpen] = useState(false)

  const { data: egg, isLoading, error } = useQuery({
    queryKey: ['egg', id],
    queryFn: () => eggsApi.get(parseInt(id!)),
    enabled: !!id,
  })

  const regenerateMutation = useMutation({
    mutationFn: () => eggsApi.regenerate(parseInt(id!)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['egg', id] })
      toast({
        title: 'Egg regenerated',
        description: 'The egg configuration has been updated.',
      })
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      toast({
        variant: 'destructive',
        title: 'Failed to regenerate',
        description: error.response?.data?.detail || 'An error occurred',
      })
    },
  })

  const handleExport = async () => {
    try {
      const json = await eggsApi.export(parseInt(id!))
      const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `egg-${egg?.name?.toLowerCase().replace(/\s+/g, '-')}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast({
        title: 'Egg exported',
        description: 'The egg JSON file has been downloaded.',
      })
    } catch {
      toast({
        variant: 'destructive',
        title: 'Export failed',
        description: 'Could not export the egg configuration.',
      })
    }
  }

  const handleCopyJson = () => {
    if (egg?.json_data) {
      navigator.clipboard.writeText(JSON.stringify(egg.json_data, null, 2))
      toast({
        title: 'Copied to clipboard',
        description: 'The egg JSON has been copied.',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        Loading egg details...
      </div>
    )
  }

  if (error || !egg) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/eggs')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Eggs
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Egg not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <EditEggDialog egg={egg} open={isEditOpen} onOpenChange={setIsEditOpen} />
      
      <div className="bg-wood rounded-xl p-8 shadow-lg border border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="text-white hover:bg-white/20">
            <Link to="/eggs">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">{egg.name}</h1>
            <p className="text-white/80 capitalize">
              {egg.source} • Java {egg.java_version} • {egg.visibility}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => window.open(egg.source_url, '_blank')}
            className="bg-black/20 border-white/10 text-white hover:bg-black/40 hover:text-white border-none"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Source
          </Button>
          {(user?.id === egg.owner_id || user?.role === 'admin') && (
            <Button 
                variant="outline" 
                onClick={() => setIsEditOpen(true)}
                className="bg-black/20 border-white/10 text-white hover:bg-black/40 hover:text-white border-none"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => regenerateMutation.mutate()} 
            disabled={regenerateMutation.isPending}
            className="bg-black/20 border-white/10 text-white hover:bg-black/40 hover:text-white border-none"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Regenerate
          </Button>
          <Button 
            onClick={handleExport}
            className="bg-primary hover:bg-primary/90 text-white border-none shadow-lg"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="card-vine bg-card/50 border-primary/10">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Minecraft Version</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{egg.minecraft_version || 'Unknown'}</p>
          </CardContent>
        </Card>
        <Card className="card-vine bg-card/50 border-primary/10">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Modloader</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold capitalize">
              {egg.modloader || 'Unknown'}
            </p>
            {egg.modloader_version && (
              <p className="text-sm text-muted-foreground">{egg.modloader_version}</p>
            )}
          </CardContent>
        </Card>
        <Card className="card-vine bg-card/50 border-primary/10">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Java Version</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Java {egg.java_version}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="card-vine bg-card/50 border-primary/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Egg JSON</CardTitle>
              <CardDescription>
                The generated Pterodactyl egg configuration
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleCopyJson}>
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="bg-black/30 border border-primary/10 p-4 rounded-lg overflow-auto max-h-96 text-sm">
            {JSON.stringify(egg.json_data, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {egg.description && (
        <Card className="card-vine bg-card/50 border-primary/10">
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{egg.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
