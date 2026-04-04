# Violet Modern Theme

## Overview
A Pangolin-inspired design with soft violet accents and rounded cards. Modern, approachable, and professional.

## Design Philosophy
- **Soft & Approachable**: Rounded corners (0.75rem radius) create a friendly, modern feel
- **Gradient Accents**: Violet-to-indigo gradients for primary actions
- **Subtle Depth**: Low-opacity backgrounds and soft shadows for depth without heaviness
- **Clean Hierarchy**: Clear visual hierarchy with generous whitespace

## Color Palette

| Variable | HSL Value | Description |
|----------|-----------|-------------|
| Background | `240 6% 10%` | Dark charcoal base |
| Foreground | `0 0% 98%` | Near-white text |
| Card | `240 5% 13%` | Slightly lighter than background |
| Primary | `262 83% 58%` | Vibrant violet |
| Secondary | `240 5% 17%` | Muted gray-purple |
| Muted | `240 5% 64%` | Gray for secondary text |
| Border | `240 4% 20%` | Subtle border color |

### Semantic Colors
- Success: Emerald green (`152 69% 45%`)
- Warning: Amber (`38 92% 50%`)
- Error: Red (`0 84% 60%`)

## Typography

### Fonts
- **Body**: Inter (100-900 weights)
- **Headings**: Space Grotesk (300-700 weights)

### Type Scale
- H1: 4xl (36px), bold, tight tracking (-0.025em)
- H3: lg (18px), semibold
- Body: sm (14px), regular
- Muted text: sm, muted-foreground color

## Components

### Cards
```css
border-radius: 1rem (rounded-2xl)
border: 1px solid rgba(255,255,255,0.05)
padding: 1.5rem
hover: border-primary/20, subtle background change
```

### Buttons
- **Primary**: Gradient violet-to-indigo background, rounded-xl, shadow-lg with violet tint
- **Secondary**: Transparent/low-opacity, rounded-lg
- **Hover Effects**: Scale transform (1.02x on hover, 0.98x on active)

### Status Badges
- Ready: Emerald background/text with emerald border
- Processing: Amber background/text with amber border
- Draft: Zinc/gray tones

### Input Fields
- Background: secondary/50 opacity
- Border: white/5
- Focus: ring-2 primary/50, border primary/50

## Layout Patterns

### Grid View
- 3 columns on large screens
- Gap: 1.5rem
- Cards with icon box, status badge, metadata row

### List View
- Horizontal layout
- Icon + name + metadata inline
- Status and chevron on right

## Interactions
- Group hover reveals action buttons (opacity 0 → 1)
- Card hover: border color change, subtle scale
- Button hover: gradient shift, scale transform
- Icon containers: background intensifies on hover

## Strengths
1. Approachable and friendly aesthetic
2. Clear visual hierarchy
3. Pleasant gradient accents
4. Good use of rounded corners throughout

## Areas for Improvement
1. Could use more distinctive personality
2. Gradient buttons may feel generic
3. Consider adding unique micro-interactions
4. Card hover effects could be more pronounced

## Best For
- General-purpose applications
- Users who prefer softer, less intimidating interfaces
- Projects targeting mixed audiences (technical + non-technical)