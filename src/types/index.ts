// Core geometry types
export interface Point {
  x: number;
  y: number;
}

export interface Triangle {
  A: Point; // apex
  B: Point; // bottom-left (up-pointing) or top-left (down-pointing)
  C: Point; // bottom-right (up-pointing) or top-right (down-pointing)
  centroid: Point;
  isUpPointing: boolean;
}

// Segment configuration types
export interface CornerToCenterConfig {
  weightMultiplier: number;
  blockedBy: 'edgeParallel' | null;
  startSide: 'corner' | 'center';
}

export interface EdgeParallelConfig {
  positionMode: 'from-edge' | 'from-corner';
  distance: number; // mm
  weightMultiplier: number;
  isBlocker: boolean;
}

export interface ArcConfig {
  radius: number; // mm
  weightMultiplier: number;
}

// Pattern definition
export interface Pattern {
  id: string;
  name: string;
  description: string;
  tags: string[];
  created: number;
  modified: number;
  isBuiltIn: boolean;
  
  baseWeight: number; // mm
  
  cornerToCenter: {
    A: CornerToCenterConfig | null;
    B: CornerToCenterConfig | null;
    C: CornerToCenterConfig | null;
  };
  
  edgeParallel: {
    BC: EdgeParallelConfig | null; // near corner A
    CA: EdgeParallelConfig | null; // near corner B
    AB: EdgeParallelConfig | null; // near corner C
  };
  
  cornerArcs: {
    AB: ArcConfig | null;
    BC: ArcConfig | null;
    CA: ArcConfig | null;
  };
}

// Panel definition
export interface CellConfig {
  patternId: string;
  rotation: 0 | 120 | 240;
}

export interface Panel {
  id: string;
  name: string;
  created: number;
  modified: number;
  
  widthMm: number;
  heightMm: number;
  triangleSizeMm: number; // edge length
  stlDepthMm: number;
  
  defaultPatternId: string;
  cells: Record<string, CellConfig>; // key: "row,col"
}

// Rendered geometry types for export/display
export interface LineSegment {
  start: Point;
  end: Point;
  weight: number;
}

export interface ArcSegment {
  center: Point;
  radius: number;
  startAngle: number; // radians
  endAngle: number; // radians
  weight: number;
}

export interface Polygon {
  points: Point[];
  weight: number; // for reference, the stroke weight that created this
}

export interface RenderedSegments {
  lines: LineSegment[];
  arcs: ArcSegment[];
  polygons: Polygon[]; // for thick segments like edge-parallel trapezoids
}

// Application state
export interface AppSettings {
  defaultBaseWeight: number;
  defaultTriangleSize: number;
  defaultStlDepth: number;
}

export type Corner = 'A' | 'B' | 'C';
export type Edge = 'AB' | 'BC' | 'CA';

// View/navigation types
export type View = 'library' | 'pattern-editor' | 'panel-designer';

export interface AppState {
  currentView: View;
  editingPatternId: string | null;
  editingPanelId: string | null;
}
