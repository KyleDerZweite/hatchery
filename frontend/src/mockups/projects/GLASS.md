# Glass Theme

## Overview
A futuristic glassmorphism design with blue-purple gradients, blurred glass effects, and smooth animations. Modern tech aesthetic with depth.

## Design Philosophy
- **Depth Through Glass**: Backdrop blur creates layered depth
- **Gradient Accents**: Blue-to-purple color transitions
- **Smooth Motion**: Float animations, gradient border effects
- **Futuristic Polish**: Rounded corners, glowing elements, subtle shadows

## Color Palette

| Variable | HSL Value | Description |
|----------|-----------|-------------|
| Background | `224 71% 4%` | Deep dark blue |
| Foreground | `213 31% 95%` | Cool white |
| Card | `224 60% 8%` | Dark blue card |
| Primary | `210 100% 66%` | Bright blue |
| Accent | `280 100% 70%` | Purple |
| Secondary | `224 50% 14%` | Dark secondary |
| Muted | `215 20% 55%` | Muted blue-gray |
| Border | `224 40% 20%` | Blue-tinted border |

### Semantic Colors
- Success: Teal (`160 84% 39%`)
- Warning: Yellow (`48 96% 53%`)
- Error: Red (`0 91% 57%`)

## Typography

### Fonts
- **Body**: IBM Plex Sans (technical sans-serif)
- **Headings**: Space Grotesk (geometric, modern)

### Type Scale
- H1: 3xl (30px), bold, gradient text effect
- Body: sm (14px)
- Labels: sm, muted

## Visual Effects

### Glass Effect
```css
background: rgba(255, 255, 255, 0.03);
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
```

### Gradient Border
```css
background: linear-gradient(card, card) padding-box,
            linear-gradient(135deg, primary/0.3, accent/0.3) border-box;
border: 1px solid transparent;
```

### Gradient Text
```css
background: linear-gradient(135deg, primary, accent);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

### Float Animation
```css
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
```

## Components

### Stats Cards
- 3-column grid at top
- Glass background with gradient border
- Large numbers with subtle labels
- Icon indicators

### Project Cards
- Full-width rows
- Icon with glow effect on hover
- Status badge with colored background
- Trend indicator (up/down percentage)
- Action buttons appear on hover

### Primary Button
- Gradient blue-to-purple background
- Scale on hover
- Overflow hidden for smooth transitions
- Multiple gradient layers for hover states

### Status Badges
| Status | Color | Label |
|--------|-------|-------|
| Ready | Blue | "Live" |
| Processing | Purple | "Building" |
| Draft | Muted | "Draft" |

## Layout Patterns

### Stats Section
- 3 equal columns
- Glass cards with gradient borders
- Label, value, change indicator

### Project List
- Single column
- Horizontal card layout
- Icon + content + actions

### Card Structure
1. Icon box with hover glow
2. Title + status badge
3. Metadata row (loader, version, mods, quests)
4. Trend indicator (if applicable)
5. Action buttons + arrow icon

## Interactions
- Icon glow effect on card hover
- Gradient background shift on button hover
- Smooth opacity transitions for hidden elements
- Scale transforms on hover

## Strengths
1. Modern, futuristic appearance
2. Unique gradient border technique
3. Good use of glassmorphism
4. Trend indicators add data visualization

## Areas for Improvement
1. Glass effects can impact performance
2. Blue-purple gradients feel generic tech
3. Lacks distinctive personality
4. Float animation may be distracting

## Best For
- SaaS applications
- Tech-forward products
- Projects targeting younger demographics
- Applications emphasizing modernity

## Critical Issues
1. **Generic Aesthetic**: Feels like many other "modern tech" sites
2. **Over-styled**: Multiple effects compete for attention
3. **Lacks Identity**: No unique memorable element
4. **Performance Concerns**: Backdrop blur is expensive