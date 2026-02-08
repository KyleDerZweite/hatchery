import { useState } from 'react';
import './styles.css';
import { 
  Plus, Search, Box, Download, ArrowUpRight,
  Check, Clock, FileText, Grid3X3, List,
  Terminal, Cpu, HardDrive
} from 'lucide-react';

const mockProjects = [
  { id: 1, name: 'VANILLA ENHANCED', loader: 'FABRIC', mcVersion: '1.20.4', mods: 47, status: 'READY', quests: true },
  { id: 2, name: 'TECH REVOLUTION', loader: 'FORGE', mcVersion: '1.19.2', mods: 156, status: 'BUILDING', quests: true },
  { id: 3, name: 'MEDIEVAL ADVENTURES', loader: 'QUILT', mcVersion: '1.20.4', mods: 89, status: 'READY', quests: false },
  { id: 4, name: 'SKYBLOCK EVOLUTION', loader: 'FABRIC', mcVersion: '1.20.2', mods: 62, status: 'DRAFT', quests: true },
  { id: 5, name: 'MAGIC AND MAYHEM', loader: 'FORGE', mcVersion: '1.18.2', mods: 203, status: 'READY', quests: true },
  { id: 6, name: 'CREATE INDUSTRIAL', loader: 'FORGE', mcVersion: '1.20.1', mods: 134, status: 'BUILDING', quests: true },
];

const statusConfig = {
  READY: { icon: Check, color: 'text-white', bg: 'bg-white text-black' },
  BUILDING: { icon: Clock, color: 'text-accent', bg: 'bg-accent text-black' },
  DRAFT: { icon: FileText, color: 'text-muted-foreground', bg: 'bg-muted text-white' },
};

export function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  return (
    <div className="min-h-screen noise">
      <div className="border-b border-border p-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tighter mb-1">
              PROJECTS
            </h1>
            <p className="text-muted-foreground text-sm tracking-wide">
              6 TOTAL / 2 ACTIVE / 4 COMPLETE
            </p>
          </div>
          <button className="flex items-center gap-3 bg-white text-black px-6 py-3 font-bold text-sm tracking-wide hover:bg-accent hover:text-white transition-colors brutal-shadow-accent crosshair">
            <Plus className="w-4 h-4" />
            NEW PROJECT
          </button>
        </div>
      </div>

      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto gap-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="SEARCH"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-b-2 border-border px-1 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-white transition-colors uppercase tracking-wider"
              />
            </div>
          </div>
          <div className="flex items-center border border-border">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-white text-black' : 'text-muted-foreground hover:text-white'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-white text-black' : 'text-muted-foreground hover:text-white'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {viewMode === 'list' ? (
          <div className="border border-border">
            <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border bg-secondary/50 text-xs tracking-widest text-muted-foreground">
              <div className="col-span-4">NAME</div>
              <div className="col-span-2">LOADER</div>
              <div className="col-span-2">VERSION</div>
              <div className="col-span-1">MODS</div>
              <div className="col-span-2">STATUS</div>
              <div className="col-span-1"></div>
            </div>
            
            {mockProjects.map((project, index) => {
              const status = statusConfig[project.status];
              const StatusIcon = status.icon;
              
              return (
                <div
                  key={project.id}
                  className="grid grid-cols-12 gap-4 px-4 py-4 border-b border-border hover:bg-white/5 transition-colors cursor-pointer crosshair group items-center"
                >
                  <div className="col-span-4 flex items-center gap-4">
                    <span className="text-muted-foreground text-xs w-8 mono">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <Box className="w-4 h-4 text-muted-foreground" />
                    <span className="font-bold text-sm tracking-wide group-hover:text-accent transition-colors">
                      {project.name}
                    </span>
                    {project.quests && (
                      <span className="text-[10px] tracking-widest text-accent border border-accent px-1.5 py-0.5">
                        QUESTS
                      </span>
                    )}
                  </div>
                  <div className="col-span-2 text-sm text-muted-foreground mono">
                    {project.loader}
                  </div>
                  <div className="col-span-2 text-sm mono">
                    {project.mcVersion}
                  </div>
                  <div className="col-span-1 text-sm text-muted-foreground">
                    {project.mods}
                  </div>
                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-bold tracking-wider ${status.bg}`}>
                      <StatusIcon className="w-3 h-3" />
                      {project.status}
                    </span>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-px bg-border">
            {mockProjects.map((project) => {
              const status = statusConfig[project.status];
              const StatusIcon = status.icon;
              
              return (
                <div
                  key={project.id}
                  className="bg-card p-6 hover:bg-white/5 transition-colors cursor-pointer crosshair group"
                >
                  <div className="flex items-start justify-between mb-6">
                    <Box className="w-5 h-5 text-muted-foreground" />
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-bold tracking-wider ${status.bg}`}>
                      <StatusIcon className="w-3 h-3" />
                      {project.status}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-lg tracking-tight mb-2 group-hover:text-accent transition-colors">
                    {project.name}
                  </h3>
                  
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                    <span className="mono">{project.loader}</span>
                    <span>•</span>
                    <span className="mono">{project.mcVersion}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{project.mods} MODS</span>
                    {project.quests && (
                      <span className="text-accent text-xs tracking-widest">+QUESTS</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-muted-foreground tracking-wide">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5" />
              HATCHERY v0.1.0
            </span>
            <span className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5" />
              CPU: 23%
            </span>
            <span className="flex items-center gap-2">
              <HardDrive className="w-3.5 h-3.5" />
              MEM: 4.2GB
            </span>
          </div>
          <span>
            LAST UPDATED: 2024-01-15 14:32:00 UTC
          </span>
        </div>
      </div>
    </div>
  );
}
