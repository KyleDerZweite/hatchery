import { useState } from 'react';
import './styles.css';
import {
  Sprout, Palette, Store, Egg, Server, Download,
  ArrowRight, Plus, Search, Zap, Globe, Lock,
  Box, ExternalLink, MoreHorizontal, Layers,
  Wand2, FileCode, Play, Pause, Trash2, Copy,
  ChevronRight, Check, Clock, FileText, Sparkles,
  Terminal, Cpu, HardDrive, Activity, Menu, X
} from 'lucide-react';

type ServiceView = 'hatchery' | 'morphic' | 'store';

const mockEggs = [
  { id: 1, name: 'All the Mods 9', source: 'CurseForge', mcVersion: '1.20.4', status: 'ready', visibility: 'public', downloads: 1247 },
  { id: 2, name: 'Create: Above and Beyond', source: 'Modrinth', mcVersion: '1.19.2', status: 'ready', visibility: 'public', downloads: 892 },
  { id: 3, name: 'Custom Skyblock', source: 'Morphic', mcVersion: '1.20.1', status: 'building', visibility: 'private', downloads: 0 },
  { id: 4, name: 'RPG Adventures', source: 'Morphic', mcVersion: '1.20.4', status: 'ready', visibility: 'public', downloads: 456 },
];

const mockModpacks = [
  { id: 1, name: 'Custom Tech Pack', mods: 89, quests: true, status: 'draft', lastEdited: '2 hours ago' },
  { id: 2, name: 'Magic World', mods: 124, quests: true, status: 'ready', lastEdited: '1 day ago' },
  { id: 3, name: 'Vanilla+', mods: 15, quests: false, status: 'ready', lastEdited: '3 days ago' },
];

const statusStyles = {
  ready: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  building: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  draft: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

export function ProjectsPage() {
  const [activeService, setActiveService] = useState<ServiceView>('hatchery');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-white/5 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 p-6 border-b border-white/5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600">
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white">Hatchery</h1>
              <p className="text-xs text-muted-foreground">Modpack Platform</p>
            </div>
            <button className="lg:hidden ml-auto p-2 hover:bg-white/5 rounded-lg" onClick={() => setSidebarOpen(false)}>
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Service Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-3">Services</p>
            
            <button
              onClick={() => setActiveService('hatchery')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                activeService === 'hatchery'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-white'
              }`}
            >
              <Egg className="w-4 h-4" />
              <span>Hatchery Builder</span>
              {activeService === 'hatchery' && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
            
            <button
              onClick={() => setActiveService('morphic')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                activeService === 'morphic'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-white'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Morphic Editor</span>
              {activeService === 'morphic' && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
            
            <button
              onClick={() => setActiveService('store')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                activeService === 'store'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-white'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Modpack Store</span>
              {activeService === 'store' && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>

            <div className="pt-4 mt-4 border-t border-white/5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-3">Quick Links</p>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-white/5 hover:text-white transition-all">
                <Server className="w-4 h-4" />
                <span>Panel Instances</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-white/5 hover:text-white transition-all">
                <FileCode className="w-4 h-4" />
                <span>Documentation</span>
              </button>
            </div>
          </nav>

          {/* User */}
          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center text-sm font-bold text-white">
                K
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">Kyle</p>
                <p className="text-xs text-muted-foreground">Admin</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-white/5 p-4 flex items-center gap-4">
        <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-white/5 rounded-lg">
          <Menu className="w-5 h-5 text-muted-foreground" />
        </button>
        <span className="font-bold text-white">Hatchery</span>
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">
          {activeService === 'hatchery' && <HatcheryView />}
          {activeService === 'morphic' && <MorphicView />}
          {activeService === 'store' && <StoreView />}
        </div>
      </main>
    </div>
  );
}

function HatcheryView() {
  const [inputUrl, setInputUrl] = useState('');
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <Egg className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-white">Hatchery Builder</h2>
          </div>
          <p className="text-muted-foreground">Convert modpack URLs into deployable Pelican/Pterodactyl eggs</p>
        </div>
        <button className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-violet-900/20 transition-all hover:scale-[1.02]">
          <Plus className="w-4 h-4" />
          New Egg
        </button>
      </div>

      {/* URL Input Section */}
      <div className="bg-card border border-white/5 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Create from URL</h3>
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Paste CurseForge or Modrinth modpack URL..."
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="w-full bg-secondary/50 border border-white/5 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            />
          </div>
          <button className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-6 py-3 rounded-xl font-medium transition-all">
            <Zap className="w-4 h-4" />
            Generate Egg
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Supported: CurseForge modpacks, Modrinth modpacks, custom pack URLs
        </p>
      </div>

      {/* Recent Eggs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Eggs</h3>
          <button className="text-sm text-primary hover:text-primary/80 transition-colors">View All</button>
        </div>
        <div className="grid gap-4">
          {mockEggs.map((egg) => (
            <div
              key={egg.id}
              className="group bg-card border border-white/5 rounded-xl p-4 hover:border-primary/20 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Egg className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-semibold text-white group-hover:text-primary transition-colors">{egg.name}</h4>
                    <span className={`px-2 py-0.5 rounded text-xs ${egg.visibility === 'public' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-500/10 text-zinc-400'}`}>
                      {egg.visibility}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{egg.source}</span>
                    <span>•</span>
                    <span>MC {egg.mcVersion}</span>
                    {egg.downloads > 0 && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {egg.downloads}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${statusStyles[egg.status]}`}>
                  {egg.status}
                </span>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MorphicView() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <Palette className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-white">Morphic Editor</h2>
          </div>
          <p className="text-muted-foreground">Build custom modpacks with AI assistance</p>
        </div>
        <button className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-violet-900/20 transition-all hover:scale-[1.02]">
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* AI Assistant Panel */}
      <div className="bg-gradient-to-r from-violet-600/10 to-indigo-600/10 border border-primary/20 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/20">
            <Wand2 className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">AI Assistant</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Describe the modpack you want to create. The AI will help you select mods, configure quests, and set up custom content.
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Describe your ideal modpack... (e.g., 'A tech-focused pack with quests and custom recipes')"
                className="flex-1 bg-secondary/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
              <button className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-5 py-3 rounded-xl font-medium transition-all">
                <Sparkles className="w-4 h-4" />
                Generate
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modpack Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Your Projects</h3>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 text-muted-foreground hover:text-white px-3 py-2 rounded-lg text-sm hover:bg-white/5 transition-all">
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mockModpacks.map((pack) => (
            <div
              key={pack.id}
              className="group bg-card border border-white/5 rounded-2xl p-5 hover:border-primary/20 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Layers className="w-5 h-5 text-primary" />
                </div>
                <span className={`px-2 py-0.5 rounded text-xs ${statusStyles[pack.status]}`}>
                  {pack.status}
                </span>
              </div>
              <h4 className="font-semibold text-white mb-2 group-hover:text-primary transition-colors">{pack.name}</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Mods</span>
                  <span className="text-white">{pack.mods}</span>
                </div>
                {pack.quests && (
                  <div className="flex items-center justify-between">
                    <span>Quests</span>
                    <span className="text-primary">Enabled</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                  <span>Last edited</span>
                  <span>{pack.lastEdited}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="flex-1 flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary py-2 rounded-lg text-sm font-medium transition-colors">
                  <Play className="w-4 h-4" />
                  Open
                </button>
                <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StoreView() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <Store className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-white">Modpack Store</h2>
          </div>
          <p className="text-muted-foreground">Browse and download community modpacks and eggs</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search modpacks..."
              className="bg-secondary/50 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 w-64 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="flex items-center gap-3">
        {['All', 'Tech', 'Magic', 'Adventure', 'Skyblock', 'Vanilla+'].map((cat) => (
          <button
            key={cat}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              cat === 'All'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/50 text-muted-foreground hover:text-white hover:bg-secondary'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Featured */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Featured</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mockEggs.filter(e => e.visibility === 'public').map((egg) => (
            <div
              key={egg.id}
              className="group bg-card border border-white/5 rounded-2xl overflow-hidden hover:border-primary/20 transition-all cursor-pointer"
            >
              <div className="h-32 bg-gradient-to-br from-violet-600/20 to-indigo-600/20 flex items-center justify-center">
                <Box className="w-12 h-12 text-primary/50 group-hover:text-primary transition-colors" />
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-white group-hover:text-primary transition-colors">{egg.name}</h4>
                  <span className={`px-2 py-0.5 rounded text-xs ${statusStyles[egg.status]}`}>
                    {egg.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                  <span>{egg.source}</span>
                  <span>•</span>
                  <span>MC {egg.mcVersion}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Download className="w-4 h-4" />
                    <span>{egg.downloads}</span>
                  </div>
                  <button className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}