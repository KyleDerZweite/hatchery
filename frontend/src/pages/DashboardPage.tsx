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
import { ArrowRight, Egg, Plus, FileText, Lock, Unlock, Server } from "lucide-react";
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
    <div className="space-y-8 pt-8">
      {/* Page Header */}
      <div className="px-2">
        <h1 className="text-[32px] font-bold text-white mb-1">Dashboard</h1>
        <p className="text-base text-muted-foreground">Welcome back, {user?.username}!</p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-vine bg-card border-none shadow-lg min-h-[120px] relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-white">Total Eggs</CardTitle>
            <Egg className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-[48px] font-bold text-white leading-tight">{eggs.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Generated egg configurations
            </p>
          </CardContent>
        </Card>
        <Card className="card-vine bg-card border-none shadow-lg min-h-[120px] relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-white">
              Panel Instances
            </CardTitle>
            <FileText className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-[48px] font-bold text-white leading-tight">{panels.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Connected game panels
            </p>
          </CardContent>
        </Card>
        <Card className="card-vine bg-card border-none shadow-lg min-h-[120px] relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-white">Public Eggs</CardTitle>
            <Unlock className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-[48px] font-bold text-white leading-tight">
              {eggs.filter((e) => e.visibility === "public").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Shared with the community
            </p>
          </CardContent>
        </Card>
        <Card className="card-vine bg-card border-none shadow-lg min-h-[120px] relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-white">Private Eggs</CardTitle>
            <Lock className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-[48px] font-bold text-white leading-tight">
              {eggs.filter((e) => e.visibility === "private").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Only visible to you</p>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <Card className="card-vine bg-card border-none shadow-lg relative overflow-hidden">
          <CardHeader className="relative z-10">
            <CardTitle className="text-2xl font-bold text-white">Quick Actions</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">Get started with common tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 relative z-10">
            <Button asChild className="w-full bg-wood hover:opacity-90 border-none h-auto py-3 text-sm font-medium shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] rounded-lg justify-start px-4">
              <Link to="/eggs">
                <div className="bg-primary/20 p-1 rounded-full mr-3">
                  <Plus className="h-4 w-4 text-primary" />
                </div>
                <span className="text-white">Create New Egg</span>
              </Link>
            </Button>
            <Button asChild className="w-full bg-wood hover:opacity-90 border-none h-auto py-3 text-sm font-medium shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] rounded-lg justify-start px-4">
              <Link to="/panels">
                <div className="bg-primary/20 p-1 rounded-full mr-3">
                  <Server className="h-4 w-4 text-primary" />
                </div>
                <span className="text-white">Add Panel Instance</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Eggs */}
        <Card className="card-vine bg-card border-none shadow-lg relative overflow-hidden">
          <CardHeader className="relative z-10">
            <CardTitle className="text-2xl font-bold text-white">Recent Eggs</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">Your latest egg configurations</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            {recentEggs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center min-h-[200px]">
                <div className="relative h-32 w-32 mb-4 opacity-60">
                  <img 
                    src="/assets/flower_in_between_decoration-removebg-preview.png" 
                    alt="Empty state plant" 
                    className="h-full w-full object-contain"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  No eggs created yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentEggs.map((egg: EggConfig) => (
                  <Link
                    key={egg.id}
                    to={`/eggs/${egg.id}`}
                    className="flex items-center justify-between rounded-lg border border-white/5 p-4 hover:bg-white/5 transition-colors bg-[#1a1a2e]/50"
                  >
                    <div>
                      <p className="font-medium text-white">{egg.name}</p>
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

