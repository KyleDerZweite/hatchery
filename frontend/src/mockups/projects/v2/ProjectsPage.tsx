import { useState } from 'react';
import './styles.css';
import { 
  Plus, Search, Terminal, Box, Download, Settings,
  Cpu, HardDrive, Activity, ChevronRight, Clock,
  CheckCircle2, Loader2, FileCode, Archive
} from 'lucide-react';

const mockProjects = [
  { id: 1, name: 'vanilla-enhanced', loader: 'fabric', mcVersion: '1.20.4', mods: 47, status: 'ready', quests: true },
  { id: 2, name: 'tech-revolution', loader: 'forge', mcVersion: '1.19.2', mods: 156, status: 'building', quests: true },
  { id: 3, name: 'medieval-adventures', loader: 'quilt', mcVersion: '1.20.4', mods: 89, status: 'ready', quests: false },
  { id: 4, name: 'skyblock-evolution', loader: 'fabric', mcVersion: '1.20.2', mods: 62, status: 'draft', quests: true },
  { id: 5, name: 'magic-and-mayhem', loader: 'forge', mcVersion: '1.18.2', mods: 203, status: 'ready', quests: true },
  { id: 6, name: 'create-industrial', loader: 'forge', mcVersion: '1.20.1', mods: 134, status: 'building', quests: true },
];

const statusConfig = {
  ready: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'READY' },
  building: { icon: Loader2, color: 'text-amber-400', bg: 'bg-amber-400/10', label: 'BUILDING', animate: true },
  draft: { icon: FileCode, color: 'text-zinc-400', bg: 'bg-zinc-400/10', label: 'DRAFT' },
};

export function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 scanline opacity-30" />
      
      <div className="relative space-y-6 pt-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-primary">
              <Terminal className="w-5 h-5" />
              <span className="text-muted-foreground text-sm mono">hatchery://</span>
            </div>
            <h1 className="text-2xl font-bold text-white mono">
              projects<span className="text-primary">.</span>list
            </h1>
          </div>
          <button className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary px-4 py-2 rounded-lg font-medium mono text-sm transition-all terminal-glow">
            <Plus className="w-4 h-4" />
            new_project
          </button>
        </div>

        <div className="flex items-center gap-4 px-2">
          <div className="flex-1 max-w-xl relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground mono text-sm">
              $
            </span>
            <input
              type="text"
              placeholder="grep -i 'search' projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-border rounded-lg pl-8 pr-4 py-2.5 text-sm text-white placeholder:text-muted-foreground/50 mono focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mono">
            <span className="text-primary">6</span> projects found
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden terminal-glow">
          <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border bg-secondary/30 text-xs mono text-muted-foreground uppercase tracking-wider">
            <div className="col-span-4">Name</div>
            <div className="col-span-2">Loader</div>
            <div className="col-span-2">Version</div>
            <div className="col-span-1">Mods</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1">Actions</div>
          </div>
          
          {mockProjects.map((project, index) => {
            const status = statusConfig[project.status];
            const StatusIcon = status.icon;
            
            return (
              <div
                key={project.id}
                className="grid grid-cols-12 gap-4 px-4 py-4 border-b border-border/50 hover:bg-primary/5 transition-colors group cursor-pointer items-center"
              >
                <div className="col-span-4 flex items-center gap-3">
                  <span className="text-muted-foreground mono text-xs w-6">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <Box className="w-4 h-4 text-primary" />
                  <span className="mono text-white group-hover:text-primary transition-colors">
                    {project.name}
                  </span>
                  {project.quests && (
                    <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] mono rounded">
                      +quests
                    </span>
                  )}
                </div>
                <div className="col-span-2">
                  <span className="mono text-sm text-muted-foreground">
                    [{project.loader}]
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="mono text-sm text-cyan">
                    v{project.mcVersion}
                  </span>
                </div>
                <div className="col-span-1">
                  <span className="mono text-sm text-muted-foreground">
                    {project.mods}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs mono ${status.bg} ${status.color}`}>
                    <StatusIcon className={`w-3 h-3 ${status.animate ? 'animate-spin' : ''}`} />
                    {status.label}
                  </span>
                </div>
                <div className="col-span-1 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 hover:bg-primary/10 rounded transition-colors" title="Export">
                    <Archive className="w-4 h-4 text-primary" />
                  </button>
                  <button className="p-1.5 hover:bg-secondary rounded transition-colors" title="Settings">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between px-2 text-xs mono text-muted-foreground">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-primary" />
              CPU: <span className="text-white">23%</span>
            </span>
            <span className="flex items-center gap-2">
              <HardDrive className="w-3.5 h-3.5 text-cyan" />
              MEM: <span className="text-white">4.2GB</span>
            </span>
            <span className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              ACTIVE: <span className="text-white">2</span>
            </span>
          </div>
          <span className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            Last sync: <span className="text-white">2s ago</span>
          </span>
        </div>
      </div>
    </div>
  );
}
