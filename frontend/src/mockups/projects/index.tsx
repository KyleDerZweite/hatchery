import { useState } from 'react';
import { ProjectsPage as V1ProjectsPage } from './v1/ProjectsPage';
import { ProjectsPage as V2ProjectsPage } from './v2/ProjectsPage';
import { ProjectsPage as V3ProjectsPage } from './v3/ProjectsPage';

const versions = [
  { id: 'v1', name: 'Violet Modern', description: 'Soft violet accents, rounded cards, gradient buttons' },
  { id: 'v2', name: 'Terminal', description: 'Developer-focused, JetBrains Mono, cyan accents, scanlines' },
  { id: 'v3', name: 'Brutalist', description: 'Raw monochrome, sharp edges, uppercase typography' },
];

export function MockupIndex() {
  const [selectedVersion, setSelectedVersion] = useState<string>('v1');

  const renderVersion = () => {
    switch (selectedVersion) {
      case 'v1':
        return <V1ProjectsPage />;
      case 'v2':
        return <V2ProjectsPage />;
      case 'v3':
        return <V3ProjectsPage />;
      default:
        return <V1ProjectsPage />;
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