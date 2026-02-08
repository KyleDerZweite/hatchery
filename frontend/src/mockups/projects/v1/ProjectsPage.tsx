import { useState } from 'react';
import './styles.css';
import { 
  Plus, Search, Filter, Grid, List, Sparkles, Download, 
  Clock, Users, Box, ChevronRight, MoreHorizontal,
  Zap, Target, Palette
} from 'lucide-react';

const mockProjects = [
  { id: 1, name: 'Vanilla Enhanced', loader: 'Fabric', mcVersion: '1.20.4', mods: 47, status: 'ready', quests: true },
  { id: 2, name: 'Tech Revolution', loader: 'Forge', mcVersion: '1.19.2', mods: 156, status: 'processing', quests: true },
  { id: 3, name: 'Medieval Adventures', loader: 'Quilt', mcVersion: '1.20.4', mods: 89, status: 'ready', quests: false },
  { id: 4, name: 'Skyblock Evolution', loader: 'Fabric', mcVersion: '1.20.2', mods: 62, status: 'draft', quests: true },
  { id: 5, name: 'Magic & Mayhem', loader: 'Forge', mcVersion: '1.18.2', mods: 203, status: 'ready', quests: true },
  { id: 6, name: 'Create: Industrial', loader: 'Forge', mcVersion: '1.20.1', mods: 134, status: 'processing', quests: true },
];

const statusStyles = {
  ready: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  processing: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  draft: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

export function ProjectsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-8 pt-4">
      <div className="flex items-center justify-between px-2">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
            Projects
          </h1>
          <p className="text-muted-foreground">
            Create and manage your AI-generated modpacks
          </p>
        </div>
        <button className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-violet-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      <div className="flex items-center gap-4 px-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-secondary/50 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 text-muted-foreground hover:text-white hover:bg-secondary/50 px-3 py-2.5 rounded-xl transition-colors text-sm">
          <Filter className="w-4 h-4" />
          Filters
        </button>
        <div className="flex items-center bg-secondary/50 rounded-xl p-1 border border-white/5">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-white'}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-white'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className={viewMode === 'grid' ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
        {mockProjects.map((project) => (
          viewMode === 'grid' ? (
            <div
              key={project.id}
              className="group bg-card border border-white/5 rounded-2xl p-6 hover:border-primary/20 hover:bg-card/80 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Box className="w-6 h-6 text-primary" />
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${statusStyles[project.status]}`}>
                  {project.status}
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-primary transition-colors">
                {project.name}
              </h3>
              
              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  {project.loader}
                </span>
                <span>•</span>
                <span>{project.mcVersion}</span>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Target className="w-4 h-4" />
                  <span>{project.mods} mods</span>
                </div>
                {project.quests && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Palette className="w-4 h-4" />
                    <span>Quests</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="flex-1 flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary py-2 rounded-lg text-sm font-medium transition-colors">
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          ) : (
            <div
              key={project.id}
              className="group flex items-center justify-between bg-card border border-white/5 rounded-xl p-4 hover:border-primary/20 hover:bg-card/80 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Box className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-white group-hover:text-primary transition-colors">
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{project.loader}</span>
                    <span>•</span>
                    <span>{project.mcVersion}</span>
                    <span>•</span>
                    <span>{project.mods} mods</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${statusStyles[project.status]}`}>
                  {project.status}
                </span>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" />
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}
