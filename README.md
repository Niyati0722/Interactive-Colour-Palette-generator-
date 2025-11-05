# Palette Forge — Interactive Color Palette Generator

A modern, responsive, and delightfully interactive color palette generator built with pure HTML, CSS, and JavaScript. Generate, tweak, preview, export, and manage beautiful 5‑color palettes with smooth animations and accessibility tools.

## Demo (Local)

```bash
# from the project root
npx --yes serve -l 5500
# open http://localhost:5500
```

- Press Space to generate new palettes
- Click a color to copy hex; use the lock icon to keep colors while regenerating

## Screenshots

> Replace these placeholders with real screenshots:
- `screenshots/hero.png` — Hero preview with gradient background
- `screenshots/palette.png` — Palette cards with locks and hover details
- `screenshots/tools.png` — Export & accessibility tools

## Features

### Palette generation
- Generate random 5‑color palettes with “Generate” button or Spacebar
- Lock/unlock any color (locked colors persist across regenerations)
- Smooth color transition animations

### Color interaction
- Click any color card to copy its hex code (toast notification)
- Hover shows RGB/HSL values; cards subtly scale
- Drag & drop to reorder colors
- Shades panel: 9 lighter→darker variations of a color

### Generation modes
- Random (default)
- Mood presets: Calm, Energetic, Professional, Playful, Vintage
- Harmony rules: Complementary, Analogous, Triadic, Tetradic
- Monochromatic mode

### Live previews
- Hero section: heading, subtext, buttons over a gradient
- UI card component: background, text, border, and button
- Buttons gallery: primary, secondary, outline
- Data viz: simple bar chart colored by the palette

### Export options
- Copy all colors as:
  - CSS variables
  - Tailwind config snippet
  - JSON
  - SCSS variables
- Download palette as PNG (labels with hex)
- Shareable URLs (colors encoded in query string)

### Accessibility tools
- Contrast checker with WCAG AA/AAA pass/fail for pairs
- Colorblind simulation toggle: Protanopia, Deuteranopia, Tritanopia
- Identifies which combinations pass standards

### Palette management
- History: last 10 generated palettes (localStorage)
- Favorites: save palettes with custom names
- Trending: curated/premade palettes for quick start

### Visual design & UX
- Modern glassmorphism/gradient background
- Dark/Light mode toggle
- Smooth micro‑interactions and hover states
- Inter font via Google Fonts and Tabler Icons via CDN
- Responsive grid layout (mobile → desktop)
- Floating action button for quick generate
- Color names shown on cards (nearest from a small set)

## Getting Started

### Prerequisites
- Node.js (LTS) and npm

### Install & Run
```bash
# 1) Clone or download this repo
# 2) In project root, run a static server
npx --yes serve -l 5500
# 3) Visit http://localhost:5500
```

No build step required. Pure HTML/CSS/JS.

## Usage

- Generate: click “Generate” or press Space
- Lock: click the lock icon on a color; press L to lock the focused card
- Reorder: drag & drop color cards
- Shades: click the shades icon to open a 9‑step shade grid; click any shade to copy
- Adjust: Temperature, Saturation, Brightness sliders apply to the current palette
- Seed: enter a hex in the seed field and click Use to build around it
- Modes: choose a Mood or a Harmony rule; Monochrome available via Harmony → Monochromatic
- Previews: hero/card/buttons/chart update live
- Exports: click a format chip; content is copied to clipboard and shown in the textarea
- PNG: export a labeled stripe image of your palette
- Share: click Share URL to copy the current URL with encoded colors
- History: click any past palette to re‑apply
- Favorites: click the star in header to save with a custom name

### Keyboard Shortcuts
- Space — Generate new palette
- L — Lock/unlock the focused color card
- ? — Open keyboard shortcuts help

## Shareable URLs

- Format: `?c=HEX1-HEX2-HEX3-HEX4-HEX5` (hashes removed, uppercase or lowercase allowed)
- Example: `http://localhost:5500/?c=7C3AED-0EA5E9-22C55E-F59E0B-EF4444`

## Export Examples

### CSS Variables
```css
:root {
  --color-1: #7C3AED;
  --color-2: #0EA5E9;
  --color-3: #22C55E;
  --color-4: #F59E0B;
  --color-5: #EF4444;
}
```

### Tailwind Config Snippet
```js
module.exports = {
  theme: {
    extend: {
      colors: {
        c1: '#7C3AED',
        c2: '#0EA5E9',
        c3: '#22C55E',
        c4: '#F59E0B',
        c5: '#EF4444'
      }
    }
  }
}
```

### JSON
```json
{
  "colors": ["#7C3AED", "#0EA5E9", "#22C55E", "#F59E0B", "#EF4444"]
}
```

### SCSS Variables
```scss
$color-1: #7C3AED;
$color-2: #0EA5E9;
$color-3: #22C55E;
$color-4: #F59E0B;
$color-5: #EF4444;
```

## Accessibility Notes
- Contrast: calculates relative luminance and shows AA (≥4.5:1) and AAA (≥7:1)
- Colorblind simulation: toggles visual filter on the page for quick checks
- Readable text: components choose white/dark text dynamically for legibility

## Persistence
- Stored under `localStorage` key: `pf_state`
- Includes: `colors`, `locks`, `mode`, `adjust`, `history`, `favorites`, `isLight`

## Tech Stack
- HTML, CSS (Grid/Flexbox, custom properties, backdrop‑filter), Vanilla JS
- Google Fonts (Inter), Tabler Icons via CDN
- No frameworks, no build step

## Project Structure
```
.
├── index.html
├── styles.css
├── app.js
└── README.md
```

## Roadmap
- Optional: richer color naming; advanced color‑blind filters; ASE export

## License
MIT


