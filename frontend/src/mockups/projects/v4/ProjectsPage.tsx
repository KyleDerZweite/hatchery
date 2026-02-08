import { useState } from 'react';
import './styles.css';
import { 
  Plus, Search, Box, Download, Settings,
  Sparkles, Layers, Zap, ArrowUpRight,
  CheckCircle2, Clock, FileText, MoreHorizontal,
  TrendingUp, Activity
} from 'lucide-react';

const mockProjects = [
  { id: 1, name: 'Vanilla Enhanced', loader: 'Fabric', mcVersion: '1.20.4', mods: 47, status: 'ready', quests: true, trend: 12 },
  { id: 2, name: 'Tech Revolution', loader: 'Forge', mcVersion: '1.19.2', mods: 156, status: 'processing', quests: true, trend: -3 },
  { id: 3, name: 'Medieval Adventures', loader: 'Quilt', mcVersion: '1.20.4', mods: 89, status: 'ready', quests: false, trend: 8 },
  { id: 4, name: 'Skyblock Evolution', loader: 'Fabric', mcVersion: '1.20.2', mods: 62, status: 'draft', quests: true, trend: 0 },
  { id: 5, name: 'Magic & Mayhem', loader: 'Forge', mcVersion: '1.18.2', mods: 203, status: 'ready', quests: true, trend: 24 },
  { id: 6, name: 'Create: Industrial', loader: 'Forge', mcVersion: '1.20.1', mods: 134, status: 'processing', quests: true, trend: 5 },
];

const statusConfig = {
  ready: { icon: CheckCircle2, text: 'Live', color: 'text-blue', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  processing: { icon: Clock, text: 'Building', color: 'text-purple', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  draft: { icon: FileText, text: 'Draft', color: 'text-muted-foreground', bg: 'bg-muted/50', border: 'border-muted' },
};

export function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-8 pt-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur-lg opacity-30" />
            <div className="relative p-2.5 rounded-xl glass border border-white/10">
              <Layers className="w-6 h-6 text-blue" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Projects</h1>
            <p className="text-muted-foreground text-sm">AI-powered modpack creation</p>
          </div>
        </div>
        <button className="group relative flex items-center gap-2 overflow-hidden rounded-xl px-5 py-2.5 font-medium">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 transition-transform group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Plus className="w-4 h-4 text-white relative z-10" />
          <span className="text-white relative z-10">New Project</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 px-2">
        {[
          { label: 'Total Projects', value: 6, icon: Box, change: '+2 this week' },
          { label: 'Active Builds', value: 2, icon: Activity, change: 'Processing now' },
          { label: 'Total Mods', value: 691, icon: Sparkles, change: 'Across all projects' },
        ].map((stat) => (
          <div key={stat.label} className="glass gradient-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <stat.icon className="w-4 h-4 text-blue" />
            </div>
            <div className="text-3xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.change}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 px-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full glass border border-white/5 rounded-xl px-4 py-2.5 pl-11 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/30 focus:ring-2 focus:ring-blue-500/10 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 text-muted-foreground hover:text-white hover:bg-white/5 px-4 py-2.5 rounded-xl transition-all text-sm border border-transparent hover:border-white/5">
            <Zap className="w-4 h-4" />
            Quick Actions
          </button>
        </div>
      </div>

      <div className="grid gap-4 px-2">
        {mockProjects.map((project) => {
          const status = statusConfig[project.status];
          const StatusIcon = status.icon;
          
          return (
            <div
              key={project.id}
              className="group glass gradient-border rounded-2xl p-5 hover:border-blue-500/30 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/5">
                    <Box className="w-5 h-5 text-blue" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-white group-hover:text-blue transition-colors">
                      {project.name}
                    </h3>
                    <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs ${status.bg} ${status.color} border ${status.border}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.text}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-purple" />
                      {project.loader}
                    </span>
                    <span>v{project.mcVersion}</span>
                    <span className="text-border">•</span>
                    <span>{project.mods} mods</span>
                    {project.quests && (
                      <>
                        <span className="text-border">•</span>
                        <span className="text-blue">Quests enabled</span>
                      </>
                    )}
                  </div>
                </div>

                {project.trend !== 0 && (
                  <div className={`flex items-center gap-1 text-sm ${project.trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    <TrendingUp className={`w-4 h-4 ${project.trend < 0 ? 'rotate-180' : ''}`} />
                    <span>{Math.abs(project.trend)}%</span>
                  </div>
                )}

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue px-4 py-2 rounded-xl text-sm font-medium transition-colors border border-blue-500/20">
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                  <button className="p-2 hover:bg-white/5 rounded-xl transition-colors border border-transparent hover:border-white/5">
                    <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                <ArrowUpRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
