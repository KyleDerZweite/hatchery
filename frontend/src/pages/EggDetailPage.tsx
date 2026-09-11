import { EditEggDialog } from '@/components/eggs/EditEggDialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { eggsApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { openExternalUrl } from '@/lib/utils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Copy, Download, ExternalLink, Pencil, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm">{value}</p>
    </div>
  )
}

export function EggDetailPage() {
  const { toast } = useToast()
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { canManage } = useAuth()
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
      queryClient.invalidateQueries({ queryKey: ['eggs'] })
      toast({ title: 'Egg regenerated', description: 'The egg JSON was rebuilt from the source.' })
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Could not regenerate egg', description: error.message })
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
      toast({ title: 'Egg exported', description: 'Import the JSON file into your panel.' })
    } catch {
      toast({ variant: 'destructive', title: 'Could not export egg' })
    }
  }

  const handleCopyJson = () => {
    if (!egg?.json_data) return
    navigator.clipboard.writeText(JSON.stringify(egg.json_data, null, 2))
    toast({ title: 'Egg JSON copied' })
  }

  if (isLoading) {
    return (
      <p role="status" className="py-16 text-center text-sm text-muted-foreground">
        Loading egg…
      </p>
    )
  }

  if (error || !egg) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/eggs">
            <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Eggs
          </Link>
        </Button>
        <p className="py-16 text-center text-sm text-muted-foreground">
          That egg does not exist, or you cannot access it.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <EditEggDialog
        key={`${egg.id}-${isEditOpen ? 'open' : 'closed'}`}
        egg={egg}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />

      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/eggs">
            <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Eggs
          </Link>
        </Button>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-xl font-semibold">{egg.name}</h1>
              {egg.visibility === 'public' && (
                <span className="rounded border border-border px-1.5 py-px text-xs text-muted-foreground">
                  Public
                </span>
              )}
            </div>
            {egg.description && (
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{egg.description}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => openExternalUrl(egg.source_url)}>
              <ExternalLink className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Source
            </Button>
            {canManage(egg.owner_id) && (
              <>
                <Button variant="outline" onClick={() => setIsEditOpen(true)}>
                  <Pencil className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => regenerateMutation.mutate()}
                  disabled={regenerateMutation.isPending}
                >
                  <RefreshCw className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {regenerateMutation.isPending ? 'Regenerating…' : 'Regenerate'}
                </Button>
              </>
            )}
            <Button onClick={handleExport}>
              <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Export JSON
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-card px-4 py-3 sm:grid-cols-4">
        <Field label="Source" value={egg.source} />
        <Field label="Minecraft" value={egg.minecraft_version || '—'} />
        <Field
          label="Modloader"
          value={
            egg.modloader
              ? `${egg.modloader}${egg.modloader_version ? ` ${egg.modloader_version}` : ''}`
              : '—'
          }
        />
        <Field label="Java" value={String(egg.java_version)} />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium">Egg JSON</h2>
          <Button variant="ghost" size="sm" onClick={handleCopyJson}>
            <Copy className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Copy
          </Button>
        </div>
        <pre className="max-h-[32rem] overflow-auto rounded-lg border border-border bg-card p-4 font-mono text-xs leading-relaxed text-muted-foreground">
          {JSON.stringify(egg.json_data, null, 2)}
        </pre>
      </div>
    </div>
  )
}
