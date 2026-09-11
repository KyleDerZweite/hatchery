import { SpecPlate } from "@/components/eggs/SpecPlate";
import { Button } from "@/components/ui/button";
import { EggConfig, eggsApi, PanelInstance, panelsApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export function DashboardPage() {
  const { data: eggs = [] } = useQuery<EggConfig[]>({
    queryKey: ["eggs"],
    queryFn: () => eggsApi.list(),
  });

  const { data: panels = [] } = useQuery<PanelInstance[]>({
    queryKey: ["panels"],
    queryFn: () => panelsApi.list(),
  });

  const recentEggs = eggs.slice(0, 5);
  const verifiedPanels = panels.filter((p) => p.last_test_status === "ok").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <Button asChild>
          <Link to="/eggs">New egg</Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Eggs" value={eggs.length} />
        <Stat label="Public eggs" value={eggs.filter((e) => e.visibility === "public").length} />
        <Stat label="Panels verified" value={`${verifiedPanels}/${panels.length}`} />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium">Recent eggs</h2>
          <Link to="/eggs" className="text-xs text-muted-foreground hover:text-foreground">
            View all
          </Link>
        </div>

        <div className="rounded-lg border border-border">
          {recentEggs.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              No eggs yet.{" "}
              <Link to="/eggs" className="text-primary hover:underline">
                Generate one from a modpack URL.
              </Link>
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {recentEggs.map((egg) => (
                <li key={egg.id}>
                  <Link
                    to={`/eggs/${egg.id}`}
                    className="flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-secondary/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{egg.name}</p>
                      <SpecPlate egg={egg} className="mt-0.5" />
                    </div>
                    {egg.visibility === "public" && (
                      <span className="ml-3 shrink-0 rounded border border-border px-1.5 py-px text-xs text-muted-foreground">
                        Public
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
