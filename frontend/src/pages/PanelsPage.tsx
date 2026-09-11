import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { PanelConnectionResult, PanelCreateData, PanelInstance, panelsApi } from "@/lib/api";
import { cn, openExternalUrl } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

/** Verified, refused, or never tested. */
function StatusDot({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "h-1.5 w-1.5 shrink-0 rounded-full",
        status === "ok" && "bg-success",
        status === "failed" && "bg-destructive",
        status !== "ok" && status !== "failed" && "bg-muted-foreground/40",
      )}
      aria-hidden="true"
    />
  );
}

export function PanelsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [description, setDescription] = useState("");

  const { data: panels = [], isLoading } = useQuery<PanelInstance[]>({
    queryKey: ["panels"],
    queryFn: () => panelsApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data: PanelCreateData) => panelsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["panels"] });
      setIsDialogOpen(false);
      setName("");
      setUrl("");
      setApiKey("");
      setDescription("");
      toast({ title: "Panel added", description: "Test the connection to verify the API key." });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Could not add panel", description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => panelsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["panels"] });
      toast({ title: "Panel deleted" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Could not delete panel", description: error.message });
    },
  });

  const testMutation = useMutation<PanelConnectionResult, Error, number>({
    mutationFn: (id: number) => panelsApi.test(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["panels"] });
      toast({
        variant: data.success ? "default" : "destructive",
        title: data.success ? "Panel verified" : "Panel refused the connection",
        description: data.panel_type ? `${data.message} (${data.panel_type})` : data.message,
      });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Connection test failed", description: error.message });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name,
      url: url.replace(/\/$/, ""),
      api_key: apiKey,
      description: description || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Panels</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pterodactyl and Pelican panels you can verify an application API key against.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Add panel
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Add panel</DialogTitle>
                <DialogDescription>
                  The API key is encrypted before it is stored.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-5">
                <div className="space-y-1.5">
                  <Label htmlFor="panel-name">Name</Label>
                  <Input
                    id="panel-name"
                    placeholder="Home panel"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="panel-url">Panel URL</Label>
                  <Input
                    id="panel-url"
                    type="url"
                    placeholder="https://panel.example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="panel-key">Application API key</Label>
                  <Input
                    id="panel-key"
                    type="password"
                    placeholder="ptla_…"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    aria-describedby="panel-key-hint"
                    required
                  />
                  <p id="panel-key-hint" className="text-xs text-muted-foreground">
                    Create one in your panel under Admin → Application API.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="panel-desc">Description (optional)</Label>
                  <Input
                    id="panel-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Adding…" : "Add panel"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border border-border">
        {isLoading ? (
          <p role="status" className="px-4 py-10 text-center text-sm text-muted-foreground">
            Loading panels…
          </p>
        ) : panels.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            No panels yet. Add one to verify its application API key.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {panels.map((panel) => (
              <li
                key={panel.id}
                className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-secondary/50"
              >
                <StatusDot status={panel.last_test_status} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{panel.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {panel.url} · {panel.last_test_message || "Not tested yet."}
                  </p>
                </div>

                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
                    onClick={() => openExternalUrl(panel.url)}
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">Open {panel.name}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 transition-opacity hover:text-destructive focus:opacity-100 group-hover:opacity-100"
                    onClick={() => deleteMutation.mutate(panel.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">Delete {panel.name}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-1.5"
                    onClick={() => testMutation.mutate(panel.id)}
                    disabled={testMutation.isPending}
                  >
                    {testMutation.isPending && testMutation.variables === panel.id
                      ? "Testing…"
                      : "Test"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
