import { useState } from 'react';
import './styles.css';
import {
  Sprout, Palette, Store, Egg, Server, Download,
  ArrowRight, Plus, Search, Zap, Globe, Lock,
  Box, ExternalLink, MoreHorizontal, Layers,
  Wand2, FileCode, Play, Pause, Trash2, Copy,
  ChevronRight, Check, Clock, FileText, Sparkles,
  Terminal, Cpu, HardDrive, Activity, Menu, X,
  CheckCircle2, Loader2, Archive, Settings, ArrowUpRight
} from 'lucide-react';

type ServiceView = 'hatchery' | 'morphic' | 'store';

const mockEggs = [
  { id: 1, name: 'all-the-mods-9', source: 'curseforge', mcVersion: '1.20.4', status: 'ready', visibility: 'public', downloads: 1247 },
  { id: 2, name: 'create-above-and-beyond', source: 'modrinth', mcVersion: '1.19.2', status: 'ready', visibility: 'public', downloads: 892 },
  { id: 3, name: 'custom-skyblock', source: 'morphic', mcVersion: '1.20.1', status: 'building', visibility: 'private', downloads: 0 },
  { id: 4, name: 'rpg-adventures', source: 'morphic', mcVersion: '1.20.4', status: 'ready', visibility: 'public', downloads: 456 },
];

const mockModpacks = [
  { id: 1, name: 'custom-tech-pack', mods: 89, quests: true, status: 'draft', lastEdited: '2h ago' },
  { id: 2, name: 'magic-world', mods: 124, quests: true, status: 'ready', lastEdited: '1d ago' },
  { id: 3, name: 'vanilla-plus', mods: 15, quests: false, status: 'ready', lastEdited: '3d ago' },
];

const statusConfig = {
  ready: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'READY' },
  building: { icon: Loader2, color: 'text-amber-400', bg: 'bg-amber-400/10', label: 'BUILDING', animate: true },
  draft: { icon: FileText, color: 'text-zinc-400', bg: 'bg-zinc-400/10', label: 'DRAFT' },
};

export function ProjectsPage() {
  const [activeService, setActiveService] = useState<ServiceView>('hatchery');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 scanline opacity-20 pointer-events-none" />
      
      <div className="flex min-h-screen relative">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-56 bg-card border-r border-border transform transition-transform duration-300 lg:translate-x-0 terminal-glow ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <div className="p-1.5 rounded border border-primary/30">
                <Sprout className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h1 className="font-bold text-white mono text-sm">hatchery</h1>
                <p className="text-xs text-muted-foreground mono">v0.1.0</p>
              </div>
              <button className="lg:hidden ml-auto p-1 hover:bg-white/5 rounded" onClick={() => setSidebarOpen(false)}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-2 px-2 mono">services</p>
              
              <button
                onClick={() => setActiveService('hatchery')}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs mono transition-all ${
                  activeService === 'hatchery'
                    ? 'bg-primary/10 text-primary border border-primary/30'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                <Egg className="w-3.5 h-3.5" />
                <span>hatchery</span>
              </button>
              
              <button
                onClick={() => setActiveService('morphic')}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs mono transition-all ${
                  activeService === 'morphic'
                    ? 'bg-primary/10 text-primary border border-primary/30'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>morphic</span>
              </button>
              
              <button
                onClick={() => setActiveService('store')}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs mono transition-all ${
                  activeService === 'store'
                    ? 'bg-primary/10 text-primary border border-primary/30'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>store</span>
              </button>

              <div className="pt-3 mt-3 border-t border-border">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-2 px-2 mono">system</p>
                <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs mono text-muted-foreground hover:bg-white/5 hover:text-white transition-all">
                  <Server className="w-3.5 h-3.5" />
                  <span>panels</span>
                </button>
                <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs mono text-muted-foreground hover:bg-white/5 hover:text-white transition-all">
                  <FileCode className="w-3.5 h-3.5" />
                  <span>docs</span>
                </button>
              </div>
            </nav>

            {/* System Status */}
            <div className="p-3 border-t border-border space-y-2">
              <div className="flex items-center justify-between text-[10px] mono text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-primary" />
                  CPU
                </span>
                <span className="text-white">23%</span>
              </div>
              <div className="flex items-center justify-between text-[10px] mono text-muted-foreground">
                <span className="flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-cyan" />
                  MEM
                </span>
                <span className="text-white">4.2GB</span>
              </div>
              <div className="flex items-center justify-between text-[10px] mono text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Activity className="w-3 h-3 text-emerald-400" />
                  JOBS
                </span>
                <span className="text-white">2 active</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border p-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 hover:bg-white/5 rounded">
            <Menu className="w-4 h-4 text-muted-foreground" />
          </button>
          <span className="font-bold text-white mono text-sm">hatchery</span>
        </div>

        {/* Main Content */}
        <main className="flex-1 lg:ml-56 pt-12 lg:pt-0">
          <div className="p-4 lg:p-6">
            {activeService === 'hatchery' && <HatcheryView />}
            {activeService === 'morphic' && <MorphicView />}
            {activeService === 'store' && <StoreView />}
          </div>
        </main>
      </div>
    </div>
  );
}

function HatcheryView() {
  const [inputUrl, setInputUrl] = useState('');
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Terminal className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground mono text-sm">hatchery://</span>
          <h2 className="text-xl font-bold text-white mono">builder</h2>
        </div>
        <button className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary px-3 py-1.5 rounded text-xs mono terminal-glow transition-all">
          <Plus className="w-3 h-3" />
          new_egg
        </button>
      </div>

      {/* URL Input */}
      <div className="bg-card border border-border rounded terminal-glow p-4">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs mono text-muted-foreground uppercase tracking-wider">url import</span>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground mono text-xs">$</span>
            <input
              type="text"
              placeholder="curl https://curseforge.com/modpacks/..."
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="w-full bg-background border border-border rounded pl-7 pr-3 py-2 text-xs text-white placeholder:text-muted-foreground/50 mono focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>
          <button className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary px-4 py-2 rounded text-xs mono transition-all">
            <Zap className="w-3 h-3" />
            build
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 mono">
          // supported: curseforge, modrinth, custom urls
        </p>
      </div>

      {/* Eggs Table */}
      <div className="bg-card border border-border rounded overflow-hidden terminal-glow">
        <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-border bg-secondary/30 text-[10px] mono text-muted-foreground uppercase tracking-wider">
          <div className="col-span-4">Name</div>
          <div className="col-span-2">Source</div>
          <div className="col-span-2">Version</div>
          <div className="col-span-1">DLs</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1"></div>
        </div>
        
        {mockEggs.map((egg, index) => {
          const status = statusConfig[egg.status];
          const StatusIcon = status.icon;
          
          return (
            <div
              key={egg.id}
              className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border/50 hover:bg-primary/5 transition-colors group cursor-pointer items-center"
            >
              <div className="col-span-4 flex items-center gap-2">
                <span className="text-muted-foreground mono text-[10px] w-5">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <Egg className="w-3 h-3 text-primary" />
                <span className="mono text-white text-xs group-hover:text-primary transition-colors">
                  {egg.name}
                </span>
                <span className={`px-1 py-0.5 text-[9px] mono rounded ${egg.visibility === 'public' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-zinc-400/10 text-zinc-400'}`}>
                  {egg.visibility}
                </span>
              </div>
              <div className="col-span-2">
                <span className="mono text-xs text-muted-foreground">[{egg.source}]</span>
              </div>
              <div className="col-span-2">
                <span className="mono text-xs text-cyan">v{egg.mcVersion}</span>
              </div>
              <div className="col-span-1">
                <span className="mono text-xs text-muted-foreground">{egg.downloads}</span>
              </div>
              <div className="col-span-2">
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] mono ${status.bg} ${status.color}`}>
                  <StatusIcon className={`w-2.5 h-2.5 ${status.animate ? 'animate-spin' : ''}`} />
                  {status.label}
                </span>
              </div>
              <div className="col-span-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1 hover:bg-primary/10 rounded transition-colors" title="Export">
                  <Archive className="w-3 h-3 text-primary" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MorphicView() {
  const [aiInput, setAiInput] = useState('');
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Terminal className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground mono text-sm">morphic://</span>
          <h2 className="text-xl font-bold text-white mono">editor</h2>
        </div>
        <button className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary px-3 py-1.5 rounded text-xs mono terminal-glow transition-all">
          <Plus className="w-3 h-3" />
          new_project
        </button>
      </div>

      {/* AI Panel */}
      <div className="bg-card border border-primary/30 rounded terminal-glow p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs mono text-primary uppercase tracking-wider">ai assistant</span>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground mono text-xs">&gt;</span>
            <input
              type="text"
              placeholder="describe your modpack..."
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              className="w-full bg-background border border-border rounded pl-7 pr-3 py-2 text-xs text-white placeholder:text-muted-foreground/50 mono focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>
          <button className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-black px-4 py-2 rounded text-xs mono font-medium transition-all">
            <Wand2 className="w-3 h-3" />
            generate
          </button>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-card border border-border rounded overflow-hidden terminal-glow">
        <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-border bg-secondary/30 text-[10px] mono text-muted-foreground uppercase tracking-wider">
          <div className="col-span-4">Project</div>
          <div className="col-span-2">Mods</div>
          <div className="col-span-2">Quests</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Updated</div>
        </div>
        
        {mockModpacks.map((pack, index) => {
          const status = statusConfig[pack.status];
          const StatusIcon = status.icon;
          
          return (
            <div
              key={pack.id}
              className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border/50 hover:bg-primary/5 transition-colors group cursor-pointer items-center"
            >
              <div className="col-span-4 flex items-center gap-2">
                <span className="text-muted-foreground mono text-[10px] w-5">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <Layers className="w-3 h-3 text-primary" />
                <span className="mono text-white text-xs group-hover:text-primary transition-colors">
                  {pack.name}
                </span>
              </div>
              <div className="col-span-2">
                <span className="mono text-xs text-muted-foreground">{pack.mods}</span>
              </div>
              <div className="col-span-2">
                <span className={`mono text-xs ${pack.quests ? 'text-primary' : 'text-muted-foreground'}`}>
                  {pack.quests ? 'enabled' : 'disabled'}
                </span>
              </div>
              <div className="col-span-2">
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] mono ${status.bg} ${status.color}`}>
                  <StatusIcon className={`w-2.5 h-2.5 ${status.animate ? 'animate-spin' : ''}`} />
                  {status.label}
                </span>
              </div>
              <div className="col-span-2 flex items-center justify-between">
                <span className="mono text-xs text-muted-foreground">{pack.lastEdited}</span>
                <ArrowUpRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StoreView() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Terminal className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground mono text-sm">store://</span>
          <h2 className="text-xl font-bold text-white mono">browse</h2>
        </div>
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground mono text-xs">$</span>
          <input
            type="text"
            placeholder="search..."
            className="bg-background border border-border rounded pl-6 pr-3 py-1.5 text-xs text-white placeholder:text-muted-foreground/50 mono focus:outline-none focus:border-primary/50 w-48 transition-all"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex items-center gap-2">
        {['all', 'tech', 'magic', 'adventure', 'skyblock'].map((cat) => (
          <button
            key={cat}
            className={`px-2 py-1 rounded text-[10px] mono transition-all border ${
              cat === 'all'
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'bg-transparent text-muted-foreground hover:text-white border-border hover:border-white/20'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Store Table */}
      <div className="bg-card border border-border rounded overflow-hidden terminal-glow">
        <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-border bg-secondary/30 text-[10px] mono text-muted-foreground uppercase tracking-wider">
          <div className="col-span-5">Modpack</div>
          <div className="col-span-2">Source</div>
          <div className="col-span-2">Version</div>
          <div className="col-span-2">Downloads</div>
          <div className="col-span-1"></div>
        </div>
        
        {mockEggs.filter(e => e.visibility === 'public').map((egg, index) => (
          <div
            key={egg.id}
            className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border/50 hover:bg-primary/5 transition-colors group cursor-pointer items-center"
          >
            <div className="col-span-5 flex items-center gap-2">
              <span className="text-muted-foreground mono text-[10px] w-5">
                {String(index + 1).padStart(2, '0')}
              </span>
              <Box className="w-3 h-3 text-primary" />
              <span className="mono text-white text-xs group-hover:text-primary transition-colors">
                {egg.name}
              </span>
            </div>
            <div className="col-span-2">
              <span className="mono text-xs text-muted-foreground">[{egg.source}]</span>
            </div>
            <div className="col-span-2">
              <span className="mono text-xs text-cyan">v{egg.mcVersion}</span>
            </div>
            <div className="col-span-2">
              <span className="mono text-xs text-muted-foreground">{egg.downloads}</span>
            </div>
            <div className="col-span-1">
              <button className="p-1 hover:bg-primary/10 rounded transition-colors">
                <Download className="w-3 h-3 text-primary" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}