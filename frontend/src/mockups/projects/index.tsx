import { useState } from 'react';

const versions = [
  { id: 'v1', name: 'Violet Modern', description: 'Pangolin-inspired with soft violet accents and rounded cards' },
  { id: 'v2', name: 'Terminal', description: 'Developer-focused with JetBrains Mono, cyan accents, scanlines' },
  { id: 'v3', name: 'Grimoire', description: 'Medieval fantasy aesthetic with gold accents and rarity tiers' },
  { id: 'v4', name: 'Glass', description: 'Futuristic glassmorphism with blue-purple gradients' },
  { id: 'v5', name: 'Brutalist', description: 'Raw monochrome with sharp edges, uppercase typography' },
];

export function MockupIndex() {
  const [selectedVersion, setSelectedVersion] = useState<string>('v1');

  const renderVersion = () => {
    switch (selectedVersion) {
      case 'v1': {
        const { ProjectsPage } = require('./v1/ProjectsPage');
        return <ProjectsPage />;
      }
      case 'v2': {
        const { ProjectsPage } = require('./v2/ProjectsPage');
        return <ProjectsPage />;
      }
      case 'v3': {
        const { ProjectsPage } = require('./v3/ProjectsPage');
        return <ProjectsPage />;
      }
      case 'v4': {
        const { ProjectsPage } = require('./v4/ProjectsPage');
        return <ProjectsPage />;
      }
      case 'v5': {
        const { ProjectsPage } = require('./v5/ProjectsPage');
        return <ProjectsPage />;
      }
      default: {
        const { ProjectsPage } = require('./v1/ProjectsPage');
        return <ProjectsPage />;
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b border-white/10 p-4">
        <div className="flex items-center justify-center gap-2">
          {versions.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelectedVersion(v.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedVersion === v.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-white hover:bg-secondary/80'
              }`}
            >
              {v.name}
            </button>
          ))}
        </div>
      </div>
      <div className="pt-16">
        {renderVersion()}
      </div>
    </div>
  );
}

export { ProjectsPage as V1ProjectsPage } from './v1/ProjectsPage';
export { ProjectsPage as V2ProjectsPage } from './v2/ProjectsPage';
export { ProjectsPage as V3ProjectsPage } from './v3/ProjectsPage';
export { ProjectsPage as V4ProjectsPage } from './v4/ProjectsPage';
export { ProjectsPage as V5ProjectsPage } from './v5/ProjectsPage';
