# Projects Page Mockups

Five distinct design concepts for the Projects page. Each version has a unique aesthetic direction while maintaining dark mode consistency.

## V1: Violet Modern (Base)
- **Fonts**: Inter (body), Space Grotesk (headings)
- **Accent**: Violet (#8b5cf6)
- **Style**: Clean, rounded cards with subtle glow effects
- **Features**: Grid/list toggle, status badges, hover animations

## V2: Terminal
- **Fonts**: JetBrains Mono (mono), Outfit (body)
- **Accent**: Cyan (#06b6d4)
- **Style**: Developer-focused with scanlines, terminal prompts
- **Features**: Table layout, system stats, mono typography

## V3: Grimoire
- **Fonts**: Playfair Display (headings), Source Sans 3 (body)
- **Accent**: Gold (#fbbf24)
- **Style**: Medieval fantasy with rarity tiers (common → legendary)
- **Features**: Ornamental borders, rarity indicators, quest badges

## V4: Glass
- **Fonts**: Space Grotesk (headings), IBM Plex Sans (body)
- **Accent**: Blue (#3b82f6) to Purple (#a855f7) gradient
- **Style**: Glassmorphism with backdrop blur, gradient borders
- **Features**: Stats cards, trend indicators, floating animations

## V5: Brutalist
- **Fonts**: Syne (headings), DM Sans (body)
- **Accent**: Red (#ef4444) + White
- **Style**: Raw, sharp edges, uppercase text, noise texture
- **Features**: Grid/list toggle, fixed footer stats, crosshair cursor

## Usage

To preview a specific version, import directly:
```tsx
import { V1ProjectsPage } from '@/mockups/projects/v1/ProjectsPage';
import { V2ProjectsPage } from '@/mockups/projects/v2/ProjectsPage';
// etc.
```

Or use the index with version switcher:
```tsx
import { MockupIndex } from '@/mockups/projects';
```
