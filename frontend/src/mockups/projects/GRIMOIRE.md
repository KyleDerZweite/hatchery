# Grimoire Theme

## Overview
A medieval fantasy aesthetic with gold accents, parchment-like backgrounds, and RPG-style rarity tiers. Evokes magical tomes and ancient scrolls.

## Design Philosophy
- **Fantasy Immersion**: Medieval-inspired typography and ornamental details
- **Rarity System**: Color-coded tiers (common → legendary) for gamification
- **Elegant Craftsmanship**: Serif typography, sepia tones, decorative borders
- **Storytelling Elements**: Flavor text, ornamental dividers, immersive copy

## Color Palette

| Variable | HSL Value | Description |
|----------|-----------|-------------|
| Background | `40 20% 6%` | Dark warm brown |
| Foreground | `40 10% 92%` | Warm off-white |
| Card | `40 18% 10%` | Sepia-tinted card |
| Primary | `38 92% 50%` | Gold |
| Secondary | `40 12% 18%` | Warm brown |
| Muted | `30 10% 50%` | Aged paper gray |
| Border | `40 15% 25%` | Brown border |

### Rarity Colors
| Rarity | Color | Icon |
|--------|-------|------|
| Common | Stone gray | Scroll |
| Uncommon | Green | Shield |
| Rare | Blue | Sparkles |
| Epic | Purple | Crown |
| Legendary | Amber/Gold | Crown |

## Typography

### Fonts
- **Body**: Source Sans 3 (modern humanist)
- **Headings**: Playfair Display (elegant serif)

### Type Scale
- H1: 3xl (30px), semibold, wide tracking
- Gold accent color for titles
- Flavor text: italic, muted

## Visual Effects

### Sepia Card Gradient
```css
background: linear-gradient(135deg, card 0%, darker-card 100%);
```

### Ornamental Dividers
```css
background: linear-gradient(to right, transparent, border, transparent)
```
Horizontal rules with gradient fade on edges.

### Corner Ornaments
Pseudo-elements with diamond characters (◆) at card corners.

## Components

### Project Cards
- Rarity-based border colors
- Rarity icon in top-right corner
- Icon box with rarity-colored background
- Metadata with wrench icon
- Status indicators colored by state

### Status Badges
- Ready: Green text with Check icon
- Processing: Amber text with Clock icon
- Draft: Stone gray with FileText icon

### Primary Button
- Gold/amber border
- Sparkles icon appears on hover
- Subtle scale on hover

## Copy & Language
- Title: "Modpack Grimoire"
- Subtitle: "Forge your legacy. Each project a tome of boundless adventure."
- Footer quote: "In the forge of creativity, legends are born"
- Search placeholder: "Search the archives..."

## Layout Patterns

### Grid View
- 3 columns on large screens
- Gap: 1.5rem
- Cards with rarity indicators

### Card Structure
1. Rarity icon (top-right)
2. Icon box + title section
3. Metadata row (loader, version)
4. Footer (mods count, quests, status)
5. Action buttons (hidden until hover)

## Interactions
- Card hover: 1.01 scale
- Button hover: sparkle icon fades in
- Smooth transitions throughout

## Strengths
1. Unique, memorable identity
2. Gamification through rarity system
3. Immersive, thematic copy
4. Elegant serif typography

## Areas for Improvement
1. Color contrast on some rarity colors
2. May not suit all audiences
3. Could be too "gamey" for professional contexts
4. Sepia tones may feel dated to some

## Best For
- Gaming-related applications
- Minecraft modpack tools (fits the theme)
- Projects wanting distinct personality
- Communities that enjoy RPG elements