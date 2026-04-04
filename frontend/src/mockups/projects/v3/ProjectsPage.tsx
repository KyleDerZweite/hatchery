import { useState } from 'react';
import './styles.css';
import {
  Sprout, Palette, Store, Egg, Server, Download,
  ArrowRight, Plus, Search, Zap, Globe, Lock,
  Box, ExternalLink, MoreHorizontal, Layers,
  Wand2, FileCode, Play, Pause, Trash2, Copy,
  ChevronRight, Check, Clock, FileText, Sparkles,
  Terminal, Cpu, HardDrive, Activity, Menu, X,
  CheckCircle2, Loader2, Archive, Settings, ArrowUpRight, List, Grid3X3
} from 'lucide-react';

type ServiceView = 'hatchery' | 'morphic' | 'store';

const mockEggs = [
  { id: 1, name: 'ALL THE MODS 9', source: 'CURSEFORGE', mcVersion: '1.20.4', status: 'READY', visibility: 'PUBLIC', downloads: 1247 },
  { id: 2, name: 'CREATE: ABOVE AND BEYOND', source: 'MODRINTH', mcVersion: '1.19.2', status: 'READY', visibility: 'PUBLIC', downloads: 892 },
  { id: 3, name: 'CUSTOM SKYBLOCK', source: 'MORPHIC', mcVersion: '1.20.1', status: 'BUILDING', visibility: 'PRIVATE', downloads: 0 },
  { id: 4, name: 'RPG ADVENTURES', source: 'MORPHIC', mcVersion: '1.20.4', status: 'READY', visibility: 'PUBLIC', downloads: 456 },
];

const mockModpacks = [
  { id: 1, name: 'CUSTOM TECH PACK', mods: 89, quests: true, status: 'DRAFT', lastEdited: '2H AGO' },
  { id: 2, name: 'MAGIC WORLD', mods: 124, quests: true, status: 'READY', lastEdited: '1D AGO' },
  { id: 3, name: 'VANILLA PLUS', mods: 15, quests: false, status: 'READY', lastEdited: '3D AGO' },
];

const statusConfig = {
  READY: { bg: 'bg-white text-black', label: 'READY' },
  BUILDING: { bg: 'bg-accent text-white', label: 'BUILDING' },
  DRAFT: { bg: 'bg-muted text-white', label: 'DRAFT' },
};

export function ProjectsPage() {
  const [activeService, setActiveService] = useState<ServiceView>('hatchery');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen noise">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-48 bg-card border-r border-border transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Sprout className="w-4 h-4 text-white" />
                <h1 className="font-bold text-white uppercase tracking-tight text-sm">Hatchery</h1>
              </div>
              <button className="lg:hidden p-1 hover:bg-white/5" onClick={() => setSidebarOpen(false)}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-px">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-2">Services</p>
              
              <button
                onClick={() => setActiveService('hatchery')}
                className={`w-full flex items-center gap-2 px-2 py-2 text-xs font-bold uppercase tracking-wide transition-all ${
                  activeService === 'hatchery'
                    ? 'bg-white text-black'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                }`}
              >
                <Egg className="w-3.5 h-3.5" />
                <span>Hatchery</span>
              </button>
              
              <button
                onClick={() => setActiveService('morphic')}
                className={`w-full flex items-center gap-2 px-2 py-2 text-xs font-bold uppercase tracking-wide transition-all ${
                  activeService === 'morphic'
                    ? 'bg-white text-black'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Morphic</span>
              </button>
              
              <button
                onClick={() => setActiveService('store')}
                className={`w-full flex items-center gap-2 px-2 py-2 text-xs font-bold uppercase tracking-wide transition-all ${
                  activeService === 'store'
                    ? 'bg-white text-black'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Store</span>
              </button>

              <div className="pt-3 mt-3 border-t border-border">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-2">System</p>
                <button className="w-full flex items-center gap-2 px-2 py-2 text-xs font-bold uppercase tracking-wide text-muted-foreground hover:bg-white/5 hover:text-white transition-all">
                  <Server className="w-3.5 h-3.5" />
                  <span>Panels</span>
                </button>
                <button className="w-full flex items-center gap-2 px-2 py-2 text-xs font-bold uppercase tracking-wide text-muted-foreground hover:bg-white/5 hover:text-white transition-all">
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Docs</span>
                </button>
              </div>
            </nav>

            {/* Status */}
            <div className="p-3 border-t border-border space-y-1">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground tracking-wide">
                <span>CPU</span>
                <span className="text-white">23%</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground tracking-wide">
                <span>MEM</span>
                <span className="text-white">4.2GB</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground tracking-wide">
                <span>JOBS</span>
                <span className="text-accent">2</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-1 hover:bg-white/5">
              <Menu className="w-5 h-5 text-muted-foreground" />
            </button>
            <span className="font-bold text-white uppercase tracking-tight">Hatchery</span>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 lg:ml-48 pt-16 lg:pt-0">
          {activeService === 'hatchery' && <HatcheryView />}
          {activeService === 'morphic' && <MorphicView />}
          {activeService === 'store' && <StoreView />}
        </main>
      </div>
    </div>
  );
}

function HatcheryView() {
  const [inputUrl, setInputUrl] = useState('');
  
  return (
    <div>
      {/* Header */}
      <div className="border-b border-border p-6">
        <div className="flex items-center justify-between max-w-5xl">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tighter uppercase">Hatchery Builder</h2>
            <p className="text-muted-foreground text-xs tracking-wide mt-1">CONVERT MODPACK URLS TO DEPLOYABLE EGGS</p>
          </div>
          <button className="flex items-center gap-2 bg-white text-black px-5 py-3 font-bold text-xs tracking-wide hover:bg-accent hover:text-white transition-colors brutal-shadow-accent">
            <Plus className="w-4 h-4" />
            NEW EGG
          </button>
        </div>
      </div>

      {/* URL Input */}
      <div className="border-b border-border p-6">
        <div className="max-w-5xl">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">URL IMPORT</p>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="PASTE CURSEFORGE OR MODRINTH URL"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value.toUpperCase())}
              className="flex-1 bg-transparent border-b-2 border-border px-1 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-white transition-colors uppercase tracking-wider"
            />
            <button className="flex items-center gap-2 bg-accent text-white px-6 py-3 font-bold text-xs tracking-wide hover:bg-white hover:text-black transition-colors brutal-shadow">
              <Zap className="w-4 h-4" />
              BUILD
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="p-6">
        <div className="max-w-5xl border border-border">
          <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border bg-secondary/50 text-[10px] tracking-widest text-muted-foreground uppercase font-bold">
            <div className="col-span-4">Name</div>
            <div className="col-span-2">Source</div>
            <div className="col-span-2">Version</div>
            <div className="col-span-1">DLs</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1"></div>
          </div>
          
          {mockEggs.map((egg, index) => {
            const status = statusConfig[egg.status as keyof typeof statusConfig];
            
            return (
              <div
                key={egg.id}
                className="grid grid-cols-12 gap-4 px-4 py-4 border-b border-border hover:bg-white/5 transition-colors cursor-pointer group items-center"
              >
                <div className="col-span-4 flex items-center gap-3">
                  <span className="text-muted-foreground text-xs mono w-6">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <Egg className="w-4 h-4 text-muted-foreground" />
                  <span className="font-bold text-sm tracking-tight group-hover:text-accent transition-colors">
                    {egg.name}
                  </span>
                  <span className={`text-[9px] tracking-widest px-1.5 py-0.5 border ${egg.visibility === 'PUBLIC' ? 'border-white/20 text-white' : 'border-muted text-muted-foreground'}`}>
                    {egg.visibility}
                  </span>
                </div>
                <div className="col-span-2 text-sm text-muted-foreground mono">
                  {egg.source}
                </div>
                <div className="col-span-2 text-sm mono">
                  {egg.mcVersion}
                </div>
                <div className="col-span-1 text-sm text-muted-foreground">
                  {egg.downloads}
                </div>
                <div className="col-span-2">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold tracking-wider ${status.bg}`}>
                    {egg.status}
                  </span>
                </div>
                <div className="col-span-1 flex justify-end">
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MorphicView() {
  const [aiInput, setAiInput] = useState('');
  
  return (
    <div>
      {/* Header */}
      <div className="border-b border-border p-6">
        <div className="flex items-center justify-between max-w-5xl">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tighter uppercase">Morphic Editor</h2>
            <p className="text-muted-foreground text-xs tracking-wide mt-1">BUILD CUSTOM MODPACKS WITH AI ASSISTANCE</p>
          </div>
          <button className="flex items-center gap-2 bg-white text-black px-5 py-3 font-bold text-xs tracking-wide hover:bg-accent hover:text-white transition-colors brutal-shadow-accent">
            <Plus className="w-4 h-4" />
            NEW PROJECT
          </button>
        </div>
      </div>

      {/* AI Panel */}
      <div className="border-b border-accent p-6 bg-accent/5">
        <div className="max-w-5xl">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-xs font-bold text-accent uppercase tracking-widest">AI Assistant</span>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="DESCRIBE YOUR IDEAL MODPACK"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value.toUpperCase())}
              className="flex-1 bg-transparent border-b-2 border-border px-1 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors uppercase tracking-wider"
            />
            <button className="flex items-center gap-2 bg-accent text-white px-6 py-3 font-bold text-xs tracking-wide hover:bg-white hover:text-black transition-colors brutal-shadow">
              <Wand2 className="w-4 h-4" />
              GENERATE
            </button>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="p-6">
        <div className="max-w-5xl border border-border">
          <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border bg-secondary/50 text-[10px] tracking-widest text-muted-foreground uppercase font-bold">
            <div className="col-span-4">Project</div>
            <div className="col-span-2">Mods</div>
            <div className="col-span-2">Quests</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Updated</div>
          </div>
          
          {mockModpacks.map((pack, index) => {
            const status = statusConfig[pack.status as keyof typeof statusConfig];
            
            return (
              <div
                key={pack.id}
                className="grid grid-cols-12 gap-4 px-4 py-4 border-b border-border hover:bg-white/5 transition-colors cursor-pointer group items-center"
              >
                <div className="col-span-4 flex items-center gap-3">
                  <span className="text-muted-foreground text-xs mono w-6">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <Layers className="w-4 h-4 text-muted-foreground" />
                  <span className="font-bold text-sm tracking-tight group-hover:text-accent transition-colors">
                    {pack.name}
                  </span>
                </div>
                <div className="col-span-2 text-sm text-muted-foreground">
                  {pack.mods} MODS
                </div>
                <div className="col-span-2 text-sm">
                  <span className={pack.quests ? 'text-accent' : 'text-muted-foreground'}>
                    {pack.quests ? 'YES' : 'NO'}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold tracking-wider ${status.bg}`}>
                    {pack.status}
                  </span>
                </div>
                <div className="col-span-2 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{pack.lastEdited}</span>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StoreView() {
  return (
    <div>
      {/* Header */}
      <div className="border-b border-border p-6">
        <div className="flex items-center justify-between max-w-5xl">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tighter uppercase">Modpack Store</h2>
            <p className="text-muted-foreground text-xs tracking-wide mt-1">BROWSE AND DOWNLOAD COMMUNITY PACKS</p>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="SEARCH"
              className="bg-transparent border-b-2 border-border px-1 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-white transition-colors uppercase tracking-wider w-48"
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="border-b border-border px-6 py-4">
        <div className="max-w-5xl flex items-center gap-2">
          {['ALL', 'TECH', 'MAGIC', 'ADVENTURE', 'SKYBLOCK'].map((cat) => (
            <button
              key={cat}
              className={`px-3 py-1.5 text-xs font-bold tracking-wide transition-all border ${
                cat === 'ALL'
                  ? 'bg-white text-black border-white'
                  : 'bg-transparent text-muted-foreground border-border hover:border-white hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Store Table */}
      <div className="p-6">
        <div className="max-w-5xl border border-border">
          <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border bg-secondary/50 text-[10px] tracking-widest text-muted-foreground uppercase font-bold">
            <div className="col-span-5">Modpack</div>
            <div className="col-span-2">Source</div>
            <div className="col-span-2">Version</div>
            <div className="col-span-2">Downloads</div>
            <div className="col-span-1"></div>
          </div>
          
          {mockEggs.filter(e => e.visibility === 'PUBLIC').map((egg, index) => (
            <div
              key={egg.id}
              className="grid grid-cols-12 gap-4 px-4 py-4 border-b border-border hover:bg-white/5 transition-colors cursor-pointer group items-center"
            >
              <div className="col-span-5 flex items-center gap-3">
                <span className="text-muted-foreground text-xs mono w-6">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <Box className="w-4 h-4 text-muted-foreground" />
                <span className="font-bold text-sm tracking-tight group-hover:text-accent transition-colors">
                  {egg.name}
                </span>
              </div>
              <div className="col-span-2 text-sm text-muted-foreground mono">
                {egg.source}
              </div>
              <div className="col-span-2 text-sm mono">
                {egg.mcVersion}
              </div>
              <div className="col-span-2 text-sm text-muted-foreground">
                {egg.downloads}
              </div>
              <div className="col-span-1 flex justify-end">
                <button className="p-1 hover:bg-white/10 transition-colors">
                  <Download className="w-4 h-4 text-white group-hover:text-accent transition-colors" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}