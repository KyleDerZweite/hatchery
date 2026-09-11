import { EditEggDialog } from "@/components/eggs/EditEggDialog";
import { SpecPlate } from "@/components/eggs/SpecPlate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { EggConfig, EggCreateData, eggsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { openExternalUrl } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export function EggsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canManage } = useAuth();
  const [editingEgg, setEditingEgg] = useState<EggConfig | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [javaVersion, setJavaVersion] = useState("17");

  const { data: eggs = [], isLoading } = useQuery<EggConfig[]>({
    queryKey: ["eggs"],
    queryFn: () => eggsApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data: EggCreateData) => eggsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eggs"] });
      setSourceUrl("");
      toast({ title: "Egg generated", description: "The egg is ready to edit and export." });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Could not generate egg", description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => eggsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eggs"] });
      toast({ title: "Egg deleted" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Could not delete egg", description: error.message });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      source_url: sourceUrl,
      visibility,
      java_version: parseInt(javaVersion),
    });
  };

  return (
    <div className="space-y-6">
      {editingEgg && (
        <EditEggDialog
          egg={editingEgg}
          open={!!editingEgg}
          onOpenChange={(open) => !open && setEditingEgg(null)}
        />
      )}

      <div>
        <h1 className="text-xl font-semibold">Eggs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate a Pterodactyl egg from a Modrinth or CurseForge modpack.
        </p>
      </div>

      <form
        onSubmit={handleCreate}
        className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 lg:flex-row lg:items-end"
      >
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="source-url">Modpack URL</Label>
          <Input
            id="source-url"
            type="url"
            placeholder="https://modrinth.com/modpack/..."
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            required
          />
        </div>

        <div className="w-36 space-y-1.5">
          <Label htmlFor="visibility">Visibility</Label>
          <Select value={visibility} onValueChange={(v) => setVisibility(v as "private" | "public")}>
            <SelectTrigger id="visibility">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="public">Public</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-32 space-y-1.5">
          <Label htmlFor="java">Java</Label>
          <Select value={javaVersion} onValueChange={setJavaVersion}>
            <SelectTrigger id="java">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[8, 11, 17, 21].map((v) => (
                <SelectItem key={v} value={String(v)}>
                  Java {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Generating…" : "Generate egg"}
        </Button>
      </form>

      <div className="rounded-lg border border-border">
        {isLoading ? (
          <p role="status" className="px-4 py-10 text-center text-sm text-muted-foreground">
            Loading eggs…
          </p>
        ) : eggs.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            No eggs yet. Paste a modpack URL above to generate your first one.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {eggs.map((egg) => (
              <li
                key={egg.id}
                className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-secondary/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link to={`/eggs/${egg.id}`} className="truncate text-sm font-medium">
                      {egg.name}
                    </Link>
                    {egg.visibility === "public" && (
                      <span className="rounded border border-border px-1.5 py-px text-xs text-muted-foreground">
                        Public
                      </span>
                    )}
                  </div>
                  <SpecPlate egg={egg} className="mt-0.5" />
                </div>

                {/* Row actions stay out of the way until the row is hovered or focused. */}
                <div className="flex items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openExternalUrl(egg.source_url)}
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">Open source page for {egg.name}</span>
                  </Button>
                  {canManage(egg.owner_id) && (
                    <>
                      <Button variant="ghost" size="icon" onClick={() => setEditingEgg(egg)}>
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Edit {egg.name}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-destructive"
                        onClick={() => deleteMutation.mutate(egg.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Delete {egg.name}</span>
                      </Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
