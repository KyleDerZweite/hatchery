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
import { ArrowRight, Egg, Plus, Server, Lock, Globe } from "lucide-react";
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
    <div className="space-y-8">
      <div className="bg-wood rounded-xl p-8 shadow-lg border border-white/5">
        <h1 className="text-4xl font-bold text-white mb-2 text-shadow-sm">Dashboard</h1>
        <p className="text-white/80 text-lg">Welcome back, {user?.username}!</p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-vine bg-card/50 border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Eggs</CardTitle>
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center ring-1 ring-primary/50 shadow-[0_0_15px_rgba(124,58,237,0.3)]">
              <Egg className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{eggs.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Generated egg configurations
            </p>
          </CardContent>
        </Card>
        <Card className="card-vine bg-card/50 border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Panel Instances
            </CardTitle>
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center ring-1 ring-primary/50 shadow-[0_0_15px_rgba(124,58,237,0.3)]">
              <Server className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{panels.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Connected game panels
            </p>
          </CardContent>
        </Card>
        <Card className="card-vine bg-card/50 border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Public Eggs</CardTitle>
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center ring-1 ring-primary/50 shadow-[0_0_15px_rgba(124,58,237,0.3)]">
              <Globe className="h-5 w-5 text-primary" />
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
        <Card className="card-vine bg-card/50 border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Private Eggs</CardTitle>
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center ring-1 ring-primary/50 shadow-[0_0_15px_rgba(124,58,237,0.3)]">
              <Lock className="h-5 w-5 text-primary" />
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
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="card-vine bg-card/50 border-primary/10">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with common tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button asChild className="w-full bg-wood hover:opacity-90 border-none h-14 text-lg font-semibold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]">
              <Link to="/eggs">
                <Plus className="mr-2 h-5 w-5 text-white" />
                <span className="text-white">Create New Egg</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full border-primary/20 hover:bg-primary/10 hover:text-primary h-14 text-lg bg-transparent">
              <Link to="/panels">
                <Server className="mr-2 h-5 w-5" />
                Add Panel Instance
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="card-vine bg-card/50 border-primary/10">
          <CardHeader>
            <CardTitle>Recent Eggs</CardTitle>
            <CardDescription>Your latest egg configurations</CardDescription>
          </CardHeader>
          <CardContent>
            {recentEggs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Egg className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">
                  No eggs created yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentEggs.map((egg: EggConfig) => (
                  <Link
                    key={egg.id}
                    to={`/eggs/${egg.id}`}
                    className="flex items-center justify-between rounded-lg border border-primary/10 p-4 hover:bg-primary/10 transition-colors bg-black/20"
                  >
                    <div>
                      <p className="font-medium text-primary-foreground">{egg.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {egg.source} • Java {egg.java_version}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-primary" />
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

