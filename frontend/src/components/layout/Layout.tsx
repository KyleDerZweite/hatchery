import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Egg, LayoutDashboard, LogOut, Menu, Server, Settings, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Eggs", href: "/eggs", icon: Egg },
  { name: "Panels", href: "/panels", icon: Server },
  { name: "Settings", href: "/settings", icon: Settings },
];

function Wordmark() {
  return (
    <Link to="/dashboard" className="flex items-center gap-2">
      <span className="flex h-5 w-5 items-center justify-center rounded bg-primary text-[11px] font-semibold text-primary-foreground">
        H
      </span>
      <span className="text-sm font-semibold">Hatchery</span>
    </Link>
  );
}

export function Layout() {
  const { user, isAdmin, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 transform flex-col border-r border-border bg-sidebar transition-transform duration-150 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-12 items-center justify-between px-4">
          <Wordmark />
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close menu</span>
          </Button>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 px-2 py-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                  isActive
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-2">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-medium text-foreground">
              {(user?.name || user?.email || "?").charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-foreground">{user?.email ?? user?.name}</p>
              <p className="text-xs text-muted-foreground">{isAdmin ? "Admin" : "Member"}</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start gap-2 px-2" onClick={logout}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-60">
        <header className="sticky top-0 z-30 flex h-12 items-center gap-3 border-b border-border bg-sidebar px-3 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
          <Wordmark />
        </header>

        <main className="flex-1 px-6 py-8 md:px-10">
          <div className="mx-auto max-w-5xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
