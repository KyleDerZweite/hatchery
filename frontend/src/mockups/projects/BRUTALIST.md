# Brutalist Theme

## Overview
A raw monochrome design with sharp edges, uppercase typography, and exposed structural elements. Intentionally stark and utilitarian.

## Design Philosophy
- **Radical Simplicity**: No rounded corners, minimal decoration
- **Structural Honesty**: Borders and grids are visible and emphasized
- **Bold Typography**: Uppercase, tight tracking, heavy weights
- **Functional Focus**: Every element serves a clear purpose

## Color Palette

| Variable | HSL Value | Description |
|----------|-----------|-------------|
| Background | `0 0% 5%` | Near-black |
| Foreground | `0 0% 95%` | Near-white |
| Card | `0 0% 8%` | Dark gray |
| Primary | `0 0% 100%` | Pure white |
| Accent | `355 100% 60%` | Red-pink (solemn accent) |
| Secondary | `0 0% 12%` | Dark gray |
| Muted | `0 0% 50%` | Mid gray |
| Border | `0 0% 20%` | Visible border |

### Semantic Colors
- Success: Green (`142 76% 36%`)
- Warning: Yellow (`45 93% 47%`)
- Error: Red-pink (matches accent)

## Typography

### Fonts
- **Body**: DM Sans (clean sans-serif)
- **Headings**: Syne (bold, geometric)
- **Monospace**: JetBrains Mono for data

### Type Scale
- H1: 4xl (36px), extrabold, uppercase, tight tracking
- All headings: `text-transform: uppercase`
- Labels: xs, tracking-widest

## Visual Effects

### Noise Texture
```css
background-image: url("data:image/svg+xml,...<feTurbulence>...");
```
Subtle grain overlay for texture.

### Brutal Shadow
```css
box-shadow: 4px 4px 0 border-color;
box-shadow: 4px 4px 0 accent-color; /* for accent */
```
Hard-edged offset shadow, no blur.

### Crosshair Cursor
Applied to interactive elements for precision feel.

## Components

### Primary Button
- White background, black text
- Hard offset shadow (accent-colored)
- No border-radius (sharp corners)
- Hover: accent background, white text

### Table Layout
- Visible grid borders
- 12-column system
- Alternating rows via border-bottom
- No background distinction between rows

### Status Badges
| Status | Style | Label |
|--------|-------|-------|
| READY | White bg, black text | READY |
| BUILDING | Accent bg, black text | BUILDING |
| DRAFT | Muted bg, white text | DRAFT |

### Input Fields
- Transparent background
- Bottom border only (2px)
- Uppercase placeholder
- No border-radius

### System Footer
- Fixed at bottom
- Visible border-top
- System stats (CPU, MEM)
- Version and timestamp

## Layout Patterns

### Header
- Left: Title + stats summary
- Right: Primary action button
- Bottom border separator

### Toolbar
- Search input (underline style)
- View toggle (sharp buttons)
- Border separator

### List View (Primary)
- Grid-based table
- Visible borders
- Row numbers (zero-padded)
- No hover background change

### Grid View
- No gaps between cards (border collapse)
- Cards separated by 1px borders
- Status badge top-right
- Icon top-left

## Typography Conventions
- ALL TEXT IN UPPERCASE
- Labels use TRACKING-WIDEST
- Numbers in monospace
- Tight letter-spacing throughout

## Interactions
- Crosshair cursor on interactive elements
- No rounded hover states
- Hard shadow on buttons
- Minimal animation (functional only)

## Strengths
1. Distinctive, memorable identity
2. Clear visual hierarchy through contrast
3. Fast performance (minimal effects)
4. Bold, confident aesthetic

## Areas for Improvement
1. Very specific aesthetic may polarize users
2. Lack of softness can feel harsh
3. All-uppercase can reduce readability
4. Limited color variety

## Best For
- Developer tools with technical audiences
- Projects wanting radical differentiation
- Applications emphasizing functionality
- Teams that value brutalist design principles

## Design Recommendations
1. Consider selective use of accent color
2. Add keyboard shortcuts for power users
3. Implement keyboard navigation indicators
4. Keep the raw aesthetic but improve subtle feedback