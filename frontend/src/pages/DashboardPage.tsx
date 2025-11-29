import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EggConfig, eggsApi, PanelInstance, panelsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Egg, Plus, Server } from "lucide-react";
import { Link } from "react-router-dom";

export function DashboardPage() {
  const { user } = useAuth();

  const { data: eggs = [] } = useQuery<EggConfig[]>({
    queryKey: ["eggs"],
    queryFn: () => eggsApi.list(),
  });

  const { data: panels = [] } = useQuery<PanelInstance[]>({
    queryKey: ["panels"],
    queryFn: () => panelsApi.list(),
  });

  const recentEggs = eggs.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.username}!</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Eggs</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Egg className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{eggs.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Generated egg configurations
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Panel Instances
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Server className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{panels.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Connected game panels
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Public Eggs</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Egg className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {eggs.filter((e) => e.visibility === "public").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Shared with the community
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Private Eggs</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Egg className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {eggs.filter((e) => e.visibility === "private").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Only visible to you</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with common tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button asChild className="justify-start">
              <Link to="/eggs">
                <Plus className="mr-2 h-4 w-4" />
                Create New Egg
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/panels">
                <Server className="mr-2 h-4 w-4" />
                Add Panel Instance
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Eggs</CardTitle>
            <CardDescription>Your latest egg configurations</CardDescription>
          </CardHeader>
          <CardContent>
            {recentEggs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No eggs created yet. Create your first egg from a modpack URL!
              </p>
            ) : (
              <div className="space-y-2">
                {recentEggs.map((egg: EggConfig) => (
                  <Link
                    key={egg.id}
                    to={`/eggs/${egg.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
                  >
                    <div>
                      <p className="font-medium">{egg.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {egg.source} • Java {egg.java_version}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
