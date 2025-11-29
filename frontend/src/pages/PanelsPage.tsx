import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { toast } from "@/components/ui/use-toast";
import { PanelCreateData, PanelInstance, panelsApi } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  CheckCircle,
  ExternalLink,
  Plus,
  Server,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";

export function PanelsPage() {
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
      resetForm();
      toast({
        title: "Panel added!",
        description: "The panel instance has been added.",
      });
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      toast({
        variant: "destructive",
        title: "Failed to add panel",
        description: error.response?.data?.detail || "An error occurred",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => panelsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["panels"] });
      toast({
        title: "Panel deleted",
        description: "The panel instance has been removed.",
      });
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      toast({
        variant: "destructive",
        title: "Failed to delete panel",
        description: error.response?.data?.detail || "An error occurred",
      });
    },
  });

  const testMutation = useMutation<
    { success: boolean; message: string },
    AxiosError<{ detail: string }>,
    number
  >({
    mutationFn: (id: number) => panelsApi.test(id),
    onSuccess: (data) => {
      toast({
        title: data.success ? "Connection successful" : "Connection failed",
        description: data.message,
      });
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      toast({
        variant: "destructive",
        title: "Connection test failed",
        description: error.response?.data?.detail || "An error occurred",
      });
    },
  });

  const resetForm = () => {
    setName("");
    setUrl("");
    setApiKey("");
    setDescription("");
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name,
      url: url.replace(/\/$/, ""), // Remove trailing slash
      api_key: apiKey,
      description: description || undefined,
    });
  };

  return (
    <div className="space-y-8">
      <div className="bg-wood rounded-xl p-8 shadow-lg border border-white/5 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Panels</h1>
          <p className="text-white/80">
            Manage your Pterodactyl/Pelican panel instances
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white border-none shadow-lg">
              <Plus className="mr-2 h-4 w-4" />
              Add Panel
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Add Panel Instance</DialogTitle>
                <DialogDescription>
                  Connect a Pterodactyl or Pelican panel to deploy eggs.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="My Game Panel"
                    value={name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setName(e.target.value)
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">Panel URL</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://panel.example.com"
                    value={url}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setUrl(e.target.value)
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Enter your panel API key"
                    value={apiKey}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setApiKey(e.target.value)
                    }
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Get this from your panel's admin settings
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    placeholder="Production server panel"
                    value={description}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setDescription(e.target.value)
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Adding..." : "Add Panel"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading panels...</div>
      ) : panels.length === 0 ? (
        <Card className="card-vine bg-card/50 border-primary/10">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Server className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No panels connected</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add a Pterodactyl or Pelican panel to start deploying eggs.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Panel
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {panels.map((panel: PanelInstance) => (
            <Card key={panel.id} className="card-vine bg-card/50 border-primary/10 transition-all hover:border-primary/30">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{panel.name}</CardTitle>
                    <CardDescription className="truncate max-w-[200px] text-muted-foreground/70">
                      {panel.url}
                    </CardDescription>
                  </div>
                  <div className="flex items-center">
                    {panel.is_active ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {panel.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {panel.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1 border border-primary/20 hover:bg-primary/10 hover:text-primary"
                    onClick={() => testMutation.mutate(panel.id)}
                    disabled={testMutation.isPending}
                  >
                    Test Connection
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="hover:bg-primary/10 hover:text-primary"
                    onClick={() => window.open(panel.url, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => deleteMutation.mutate(panel.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
