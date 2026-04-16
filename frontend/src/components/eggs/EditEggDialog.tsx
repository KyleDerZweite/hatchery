import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { EggConfig, eggsApi } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useState } from "react";

interface EditEggDialogProps {
  egg: EggConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditEggDialog({ egg, open, onOpenChange }: EditEggDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(egg.name);
  const [description, setDescription] = useState(egg.description || "");
  const [visibility, setVisibility] = useState<"private" | "public">(egg.visibility);
  const [javaVersion, setJavaVersion] = useState(egg.java_version.toString());

  const updateMutation = useMutation({
    mutationFn: (data: Partial<EggConfig>) => eggsApi.update(egg.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eggs"] });
      queryClient.invalidateQueries({ queryKey: ["egg", egg.id.toString()] });
      onOpenChange(false);
      toast({
        title: "Egg updated",
        description: "The egg configuration has been updated successfully.",
      });
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      toast({
        variant: "destructive",
        title: "Failed to update egg",
        description: error.response?.data?.detail || "An error occurred",
      });
    },
  });

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      name,
      description,
      visibility,
      java_version: parseInt(javaVersion),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleUpdate}>
          <DialogHeader>
            <DialogTitle>Edit Egg</DialogTitle>
            <DialogDescription>
              Update the egg configuration details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="visibility">Visibility</Label>
                <Select
                  value={visibility}
                  onValueChange={(v) => setVisibility(v as "private" | "public")}
                >
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
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
