# Kumiko Designer

A web application for designing custom kumiko (Japanese woodworking) patterns for hexagonal/triangular grid panels.

## Features

### Phase 1-4 (Current)

- **Pattern Editor**: Create and modify patterns with toggleable segments
  - Corner-to-center lines (with blocking support)
  - Edge-parallel segments (trapezoid shapes)
  - Corner arcs (curved segments)
  - Per-segment weight multipliers
  
- **Built-in Patterns**: 
  - Asanoha (hemp leaf)
  - Goma (sesame seed)
  - Sakura (cherry blossom)
  - Shippo (seven treasures)

- **Panel Designer**: Design full panels using patterns
  - Configurable panel dimensions (mm)
  - Variable triangle size
  - Click/drag to paint patterns
  - Pattern rotation per cell (0°, 120°, 240°)
  - Zoom and pan canvas

- **Library**: Manage patterns and panels
  - View all patterns and panels
  - Create/duplicate/delete custom patterns
  - Auto-save to localStorage

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Geometry**: Custom implementation (no external libs)

## Project Structure

```
src/
├── components/
│   ├── Library/         # Main library view
│   ├── PatternEditor/   # Pattern editing UI
│   ├── PanelDesigner/   # Panel design canvas
│   └── common/          # Reusable UI components
├── geometry/
│   ├── triangle.ts      # Triangle calculations
│   ├── segments.ts      # Pattern segment generation
│   ├── clipping.ts      # Geometry clipping utilities
│   └── grid.ts          # Grid layout calculations
├── store/               # Zustand state management
├── data/                # Built-in pattern definitions
└── types/               # TypeScript type definitions
```

## Upcoming Features (Phase 5-6)

- Export to DXF (2D vector format)
- Export to STL (3D printing)
- JSON backup/restore
- Undo/redo

## Usage Tips

### Pattern Editor
- Enable/disable segment groups with checkboxes
- Adjust parameters to see real-time preview
- "Duplicate" built-in patterns to create editable copies

### Panel Designer
- **Click**: Paint selected pattern
- **Shift+Click**: Pick pattern from cell
- **Right-Click**: Rotate cell pattern
- **Scroll**: Zoom
- **Middle-drag**: Pan canvas

## License

MIT
