import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard, 
  Egg, 
  Server, 
  Settings, 
  LogOut,
  Menu,
  X,
  Sprout
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Eggs', href: '/eggs', icon: Egg },
  { name: 'Panels', href: '/panels', icon: Server },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[180px] transform bg-sidebar border-r border-white/5 transition-transform duration-200 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-20 items-center px-6 border-b border-white/5">
          <Link to="/dashboard" className="flex items-center gap-3">
            <Sprout className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-white tracking-tight">Hatchery</span>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden ml-auto"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-1 p-4 mt-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-r-lg px-3 py-2.5 text-sm font-medium transition-all group relative overflow-hidden",
                  isActive
                    ? "bg-card text-white"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                )}
                <item.icon className={cn("h-[18px] w-[18px] transition-colors", isActive ? "text-primary" : "group-hover:text-white")} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Profile */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/5 p-4 bg-sidebar">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-full bg-card border border-white/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium text-white truncate">{user?.username}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{user?.role || 'User'}</span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-white hover:bg-white/5 h-8 text-xs mt-1" 
            onClick={logout}
          >
            <LogOut className="h-3 w-3 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-[180px] min-h-screen flex flex-col transition-all duration-200">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-white/5 bg-sidebar px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-bold text-lg">Hatchery</span>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
