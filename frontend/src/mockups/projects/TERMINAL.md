# Terminal Theme

## Overview
A developer-focused aesthetic with JetBrains Mono font, cyan accents, and scanline effects. Emulates a command-line interface aesthetic.

## Design Philosophy
- **Developer-First**: Monospace typography, command-like interactions
- **Technical Authenticity**: Scanlines, terminal glow, CLI-style prompts
- **Information Dense**: Table-based layouts showing all data at once
- **Retro-Modern**: CRT-inspired effects with modern polish

## Color Palette

| Variable | HSL Value | Description |
|----------|-----------|-------------|
| Background | `220 20% 8%` | Very dark blue-black |
| Foreground | `210 20% 95%` | Cool white |
| Card | `220 18% 12%` | Dark card surfaces |
| Primary | `199 89% 48%` | Cyan (terminal green/blue) |
| Secondary | `220 15% 18%` | Dark secondary |
| Muted | `215 15% 55%` | Muted gray-blue |
| Border | `220 15% 22%` | Subtle borders |

### Semantic Colors
- Success: Green-cyan (`162 63% 41%`)
- Warning: Gold (`43 96% 56%`)
- Error: Red (`0 72% 51%`)

## Typography

### Fonts
- **Body**: Outfit (modern sans-serif)
- **Headings**: JetBrains Mono (monospace)
- **Code/Labels**: JetBrains Mono

### Type Scale
- H1: 2xl (24px), mono, bold with `projects.list` naming style
- Body: sm (14px), mono
- Labels: xs (12px), uppercase, tracking-wider

## Visual Effects

### Scanlines
```css
background: repeating-linear-gradient(
  0deg,
  transparent,
  transparent 2px,
  rgba(0, 0, 0, 0.1) 2px,
  rgba(0, 0, 0, 0.1) 4px
);
```
Applied as overlay with 30% opacity.

### Terminal Glow
```css
box-shadow: 0 0 30px hsl(primary / 0.15),
            inset 0 1px 0 rgba(255,255,255,0.05);
```

## Components

### Table Layout
- 12-column grid system
- Header row with uppercase tracking-wider labels
- Row numbers padded (01, 02, etc.)
- Hover state: primary/5 background

### Status Indicators
- Icons with animated spin for processing
- Uppercase labels (READY, BUILDING, DRAFT)
- Color-coded backgrounds

### Input Field
- `$` prompt prefix inside field
- Placeholder styled as grep command
- Mono font throughout

### System Stats Bar
- Bottom-positioned status bar
- CPU, Memory, Active processes
- Last sync timestamp
- Fixed at bottom of viewport

## Naming Conventions
- Projects use lowercase-hyphenated names
- Commands styled as `new_project`
- URL-style header: `hatchery://`

## Layout Patterns

### Table View (Primary)
```
| Name (4 cols) | Loader (2) | Version (2) | Mods (1) | Status (2) | Actions (1) |
```

### Row Structure
- Index number (zero-padded)
- Box icon
- Project name
- Tags (e.g., `+quests`)
- Metadata columns
- Status badge
- Action buttons (hidden until hover)

## Interactions
- Cursor remains default (not pointer)
- Row hover: subtle background highlight
- Action buttons appear on row hover
- Processing status shows spinning icon

## Strengths
1. Strong developer identity
2. Information-dense layout
3. Authentic terminal aesthetic
4. Good use of monospace typography

## Areas for Improvement
1. Scanlines may cause eye strain over time
2. Table layout lacks mobile responsiveness
3. Very specific to developer audience
4. Could benefit from keyboard navigation indicators

## Best For
- Developer tools and CLIs
- Technical users who appreciate nostalgic aesthetics
- Projects where information density is prioritized
- Teams that work primarily in terminal environments