import { useState } from 'react';
import './styles.css';
import { 
  Plus, Search, Box, Download, Settings,
  Scroll, Crown, Shield, Sparkles, ArrowRight,
  Check, Clock, FileText, Wrench
} from 'lucide-react';

const mockProjects = [
  { id: 1, name: 'Vanilla Enhanced', loader: 'Fabric', mcVersion: '1.20.4', mods: 47, status: 'ready', quests: true, rarity: 'common' },
  { id: 2, name: 'Tech Revolution', loader: 'Forge', mcVersion: '1.19.2', mods: 156, status: 'processing', quests: true, rarity: 'rare' },
  { id: 3, name: 'Medieval Adventures', loader: 'Quilt', mcVersion: '1.20.4', mods: 89, status: 'ready', quests: false, rarity: 'uncommon' },
  { id: 4, name: 'Skyblock Evolution', loader: 'Fabric', mcVersion: '1.20.2', mods: 62, status: 'draft', quests: true, rarity: 'epic' },
  { id: 5, name: 'Magic & Mayhem', loader: 'Forge', mcVersion: '1.18.2', mods: 203, status: 'ready', quests: true, rarity: 'legendary' },
  { id: 6, name: 'Create: Industrial', loader: 'Forge', mcVersion: '1.20.1', mods: 134, status: 'processing', quests: true, rarity: 'rare' },
];

const rarityConfig = {
  common: { color: 'text-stone-400', border: 'border-stone-600/30', bg: 'bg-stone-800/20', icon: Scroll },
  uncommon: { color: 'text-green-400', border: 'border-green-600/30', bg: 'bg-green-800/20', icon: Shield },
  rare: { color: 'text-blue-400', border: 'border-blue-600/30', bg: 'bg-blue-800/20', icon: Sparkles },
  epic: { color: 'text-purple-400', border: 'border-purple-600/30', bg: 'bg-purple-800/20', icon: Crown },
  legendary: { color: 'text-amber-400', border: 'border-amber-500/40', bg: 'bg-amber-800/20', icon: Crown },
};

const statusConfig = {
  ready: { icon: Check, text: 'Ready', color: 'text-green-400' },
  processing: { icon: Clock, text: 'Processing', color: 'text-amber-400' },
  draft: { icon: FileText, text: 'Draft', color: 'text-stone-400' },
};

export function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-10 pt-6">
      <div className="px-2">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          <h1 className="text-3xl font-semibold text-gold tracking-wide">
            Modpack Grimoire
          </h1>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>
        <p className="text-center text-muted-foreground text-sm max-w-md mx-auto">
          Forge your legacy. Each project a tome of boundless adventure.
        </p>
      </div>

      <div className="flex items-center justify-between px-2 gap-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search the archives..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-secondary/50 border border-border rounded px-4 py-2 pl-10 text-sm text-white placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary/50 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary px-5 py-2 rounded transition-all group">
          <Plus className="w-4 h-4" />
          <span className="font-medium">New Project</span>
          <Sparkles className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 px-2">
        {mockProjects.map((project) => {
          const rarity = rarityConfig[project.rarity];
          const status = statusConfig[project.status];
          const RarityIcon = rarity.icon;
          const StatusIcon = status.icon;
          
          return (
            <div
              key={project.id}
              className={`group sepia-card border ${rarity.border} rounded p-5 hover:scale-[1.01] transition-all duration-300 cursor-pointer relative`}
            >
              <div className="absolute top-3 right-3">
                <RarityIcon className={`w-4 h-4 ${rarity.color} opacity-60`} />
              </div>
              
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-2.5 rounded ${rarity.bg} border ${rarity.border}`}>
                  <Box className={`w-5 h-5 ${rarity.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white truncate">
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                    <Wrench className="w-3 h-3" />
                    <span>{project.loader}</span>
                    <span className="text-border">•</span>
                    <span>v{project.mcVersion}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">
                    {project.mods} mods
                  </span>
                  {project.quests && (
                    <span className="flex items-center gap-1 text-primary/80">
                      <Scroll className="w-3 h-3" />
                      Quests
                    </span>
                  )}
                </div>
                <span className={`flex items-center gap-1 ${status.color}`}>
                  <StatusIcon className="w-3 h-3" />
                  {status.text}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="flex-1 flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary py-2 rounded text-sm transition-colors">
                  <Download className="w-3.5 h-3.5" />
                  Export
                </button>
                <button className="p-2 hover:bg-secondary rounded transition-colors">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-4 px-2 pt-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/50 to-transparent" />
        <span className="text-xs text-muted-foreground italic">
          "In the forge of creativity, legends are born"
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/50 to-transparent" />
      </div>
    </div>
  );
}
