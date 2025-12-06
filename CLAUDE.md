# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kumiko Designer is a web application for designing custom kumiko (Japanese woodworking) patterns for hexagonal/triangular grid panels. It allows users to create patterns by toggling geometric segments within equilateral triangles, then tile these patterns across panels for woodworking fabrication.

## Development Commands

**Package Manager**: This project uses Bun (not npm). All commands should use `bun` instead of `npm`.

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Lint code
bun run lint

# Preview production build
bun run preview
```

## Architecture Overview

### State Management

The entire application state is managed by a **single Zustand store** (`src/store/index.ts`) with localStorage persistence:

- **Patterns**: User-created and built-in pattern definitions
- **Panels**: Panel designs with cell-by-cell pattern assignments
- **Navigation**: Current view and editing context

**Critical**: Built-in patterns are immutable (`isBuiltIn: true`). They are always re-merged from `src/data/builtInPatterns.ts` on load to ensure updates propagate. Users can only duplicate built-ins to create editable copies.

### Pattern System

Patterns define geometric segments within an equilateral triangle (`src/types/index.ts`):

1. **Corner-to-center lines**: Lines from corners (A/B/C) to centroid
   - Can be blocked by edge-parallel segments
   - `startSide` determines which side of blocker the line appears on

2. **Edge-parallel segments**: Lines parallel to triangle edges
   - Positioning modes: `from-edge` (distance from edge) or `from-corner` (distance from opposite corner)
   - Can act as blockers for corner-to-center lines via `isBlocker: true`

3. **Corner arcs**: Curved segments between two corners
   - Always bulge inward (toward centroid)
   - Radius must be >= half the edge length

Each segment type has a `weightMultiplier` applied to `pattern.baseWeight` for line thickness.

### Geometry System (`src/geometry/`)

**No external geometry libraries are used.** All calculations are custom implementations:

- `triangle.ts`: Core vector math, triangle generation for grid cells, point-in-triangle tests
- `segments.ts`: Converts pattern definitions into renderable line/arc segments
  - Handles blocking logic (edge-parallel blocking corner-to-center)
  - Calculates arc geometry
  - Applies rotation (0°, 120°, 240°)
- `grid.ts`: Grid layout calculations for panels
- `clipping.ts`: Line-line intersection utilities

**Important**: The grid uses a coordinate system where:
- Row 0 starts at the top
- Cell (row, col) position is calculated as: `baseX = col * (edgeLength/2)`, `baseY = row * height`
- Triangles alternate up/down pointing: `(row + col) % 2 === 0` means up-pointing

### Component Architecture

The app uses a **view-based navigation** system (`src/App.tsx`):

1. **Library** (`src/components/Library/`): Browse patterns and panels
2. **PatternEditor** (`src/components/PatternEditor/`): Edit individual patterns
   - `SegmentControls.tsx`: Form inputs for pattern configuration
   - `TrianglePreview.tsx`: Single triangle preview
   - `TiledPreview.tsx`: 3x3 tiled preview showing how patterns repeat
   - `PatternSvg.tsx`: SVG rendering logic for patterns
3. **PanelDesigner** (`src/components/PanelDesigner/`): Design full panels
   - `GridCanvas.tsx`: Interactive canvas with zoom/pan, click to paint patterns
   - `PatternPalette.tsx`: Pattern selection palette
   - `PanelSettings.tsx`: Panel dimensions and triangle size

### Built-in Patterns

Four traditional kumiko patterns are defined in `src/data/builtInPatterns.ts`:
- **Asanoha** (hemp leaf): Corner-to-center lines with arcs
- **Goma** (sesame seed): Edge-parallel trapezoids blocking corner lines
- **Sakura** (cherry blossom): Complex pattern with arcs and edge segments
- **Shippo** (seven treasures): Pure corner arcs forming interlocking circles

When modifying these, update the definitions in `builtInPatterns.ts`. Changes will automatically propagate to all users due to the merge logic in the store.

## Key Implementation Details

### Pattern Rotation

Patterns can be rotated per-cell in 120° increments (0°, 120°, 240°) to create complex tilings. Rotation is implemented by rotating the triangle vertices around the centroid before generating segments (`rotateTriangle` in `triangle.ts`).

### SVG Rendering

All patterns render to SVG. The rendering pipeline:
1. Pattern definition → `generatePatternSegments()` → `RenderedSegments` (lines, arcs, polygons)
2. Lines/arcs rendered as SVG `<line>` and `<path>` elements
3. Stroke width derived from `baseWeight * weightMultiplier`

### Grid Cell Storage

Panel cells are stored in a sparse dictionary: `cells: Record<string, CellConfig>` with key format `"row,col"`. Only cells that differ from `defaultPatternId` are stored explicitly.

### Canvas Interaction (Panel Designer)

- **Click**: Paint selected pattern at 0° rotation
- **Shift+Click**: Pick pattern from cell (eyedropper)
- **Right-Click**: Cycle cell rotation (0° → 120° → 240° → 0°)
- **Scroll**: Zoom in/out
- **Middle-mouse drag**: Pan canvas

Implemented via pointer events in `GridCanvas.tsx` with viewport state tracking.

## Common Patterns

### Adding a New Segment Type

1. Add config interface to `src/types/index.ts`
2. Add field to `Pattern` interface
3. Implement generation logic in `src/geometry/segments.ts`
4. Add UI controls in `src/components/PatternEditor/SegmentControls.tsx`
5. Update `createEmptyPattern()` and `duplicatePattern()` in `src/data/builtInPatterns.ts`

### Modifying Built-in Patterns

Edit definitions in `src/data/builtInPatterns.ts`. The store's `merge` function ensures these propagate to existing users while preserving their custom patterns.

### Adding Panel Export (DXF/STL)

Future export features should:
1. Iterate all grid cells via `calculateGridDimensions()`
2. Generate segments for each cell's pattern with rotation
3. Convert segments to target format (DXF entities, STL triangles)
4. Handle coordinate transformations and units

## Tech Stack

- **React 19** + **TypeScript** (strict mode)
- **Vite** (build tool)
- **Tailwind CSS** (styling)
- **Zustand** (state management with persistence)
- **No external geometry libraries** (all math is custom)
