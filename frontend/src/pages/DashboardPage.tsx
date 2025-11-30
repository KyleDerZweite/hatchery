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
import { ArrowRight, Egg, FileText, Lock, Plus, Server, Unlock } from "lucide-react";
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
    <div className="space-y-8 pt-4">
      {/* Page Header */}
      <div className="flex items-center justify-between px-2">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.username}!</p>
        </div>
        <div className="flex gap-3">
          <Button className="bg-primary/10 text-primary hover:bg-primary/20 border-none shadow-none">
            View Documentation
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Eggs", value: eggs.length, icon: Egg, desc: "Generated configurations" },
          { title: "Panel Instances", value: panels.length, icon: FileText, desc: "Connected game panels" },
          { title: "Public Eggs", value: eggs.filter((e) => e.visibility === "public").length, icon: Unlock, desc: "Shared with community" },
          { title: "Private Eggs", value: eggs.filter((e) => e.visibility === "private").length, icon: Lock, desc: "Only visible to you" },
        ].map((stat, i) => (
          <Card key={i} className="hover:shadow-2xl hover:bg-card/80 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-white transition-colors">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-primary opacity-70 group-hover:opacity-100 transition-opacity" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <p className="text-xs text-muted-foreground group-hover:text-white/60 transition-colors">
                {stat.desc}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-success/10">
            <CardTitle className="text-xl font-bold text-white">Quick Actions</CardTitle>
            <CardDescription className="text-white/70">Get started with common tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6">
            <Button asChild className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-none h-auto py-4 text-base font-medium shadow-lg shadow-violet-900/20 transition-all hover:scale-[1.01] active:scale-[0.99] rounded-xl justify-start px-6 group relative overflow-hidden">
              <Link to="/eggs">
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                <div className="bg-white/20 p-2 rounded-lg mr-4 group-hover:bg-white/30 transition-colors relative z-10 shadow-inner">
                  <Plus className="h-5 w-5 text-white drop-shadow-md" />
                </div>
                <div className="flex flex-col items-start relative z-10">
                  <span className="text-white font-bold text-lg tracking-wide drop-shadow-md">Create New Egg</span>
                  <span className="text-white/90 text-xs font-medium drop-shadow-sm">Generate a new server configuration</span>
                </div>
              </Link>
            </Button>
            <Button asChild className="w-full bg-secondary hover:bg-secondary/80 border border-white/5 h-auto py-4 text-base font-medium shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] rounded-xl justify-start px-6 group">
              <Link to="/panels">
                <div className="bg-primary/10 p-2 rounded-lg mr-4 group-hover:bg-primary/20 transition-colors">
                  <Server className="h-5 w-5 text-primary" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-white font-semibold">Add Panel Instance</span>
                  <span className="text-muted-foreground text-xs font-normal">Connect a new game panel</span>
                </div>
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Eggs */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">Recent Eggs</CardTitle>
            <CardDescription>Your latest egg configurations</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {recentEggs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-8 text-center min-h-[200px] border-2 border-dashed border-white/5 rounded-xl bg-white/5">
                <div className="p-4 rounded-full bg-white/5 mb-4">
                  <Egg className="h-8 w-8 text-muted-foreground opacity-50" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  No eggs created yet
                </p>
                <Button variant="link" asChild className="text-primary mt-2">
                  <Link to="/eggs">Create your first egg</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentEggs.map((egg: EggConfig) => (
                  <Link
                    key={egg.id}
                    to={`/eggs/${egg.id}`}
                    className="flex items-center justify-between rounded-xl border border-white/5 p-4 hover:bg-white/5 hover:border-primary/20 transition-all bg-secondary/30 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Egg className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-white group-hover:text-primary transition-colors">{egg.name}</p>
                        <p className="text-xs text-muted-foreground capitalize flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
                          {egg.source} • Java {egg.java_version}
                        </p>
                      </div>
                    </div>
                    <div className="p-2 rounded-full hover:bg-white/10 transition-colors">
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-white transition-colors" />
                    </div>
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

