import { Point, Triangle, Panel, Pattern, RenderedSegments, LineSegment, Polygon, ArcSegment } from '../types';
import { getTriangleForCell, calculateGridDimensions, triangleHeight } from './triangle';
import { generatePatternSegments, generateTriangleEdges } from './segments';
import { clipLineToRect, clipPolygonToRect } from './clipping';

/**
 * Generate all rendered geometry for a panel
 */
export function generatePanelGeometry(
  panel: Panel,
  patterns: Pattern[]
): RenderedSegments {
  const { rows, cols } = calculateGridDimensions(
    panel.widthMm,
    panel.heightMm,
    panel.triangleSizeMm
  );
  
  const result: RenderedSegments = {
    lines: [],
    arcs: [],
    polygons: [],
  };
  
  const defaultPattern = patterns.find(p => p.id === panel.defaultPatternId);
  if (!defaultPattern) {
    console.warn('Default pattern not found:', panel.defaultPatternId);
    return result;
  }
  
  // Track which edges have been drawn to avoid duplicates
  const drawnEdges = new Set<string>();
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const tri = getTriangleForCell(row, col, panel.triangleSizeMm);
      
      // Check if triangle is at least partially within panel bounds
      if (!triangleIntersectsRect(tri, 0, 0, panel.widthMm, panel.heightMm)) {
        continue;
      }
      
      // Get pattern for this cell
      const cellKey = `${row},${col}`;
      const cellConfig = panel.cells[cellKey];
      const pattern = cellConfig
        ? patterns.find(p => p.id === cellConfig.patternId) || defaultPattern
        : defaultPattern;
      const rotation = cellConfig?.rotation || 0;
      
      // Generate pattern segments
      const segments = generatePatternSegments(pattern, tri, rotation);
      
      // Clip and add to result
      clipAndAddSegments(segments, result, panel, drawnEdges);
      
      // Generate triangle edges (if not already drawn)
      const edgeLines = generateTriangleEdges(tri, pattern.baseWeight);
      for (const edge of edgeLines) {
        const edgeKey = edgeToKey(edge.start, edge.end);
        if (!drawnEdges.has(edgeKey)) {
          drawnEdges.add(edgeKey);
          const clipped = clipLineToRect(
            edge.start,
            edge.end,
            0,
            0,
            panel.widthMm,
            panel.heightMm
          );
          if (clipped) {
            result.lines.push({ ...clipped, weight: edge.weight });
          }
        }
      }
    }
  }
  
  return result;
}

/**
 * Check if a triangle intersects a rectangle
 */
function triangleIntersectsRect(
  tri: Triangle,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number
): boolean {
  // Check if any vertex is inside
  for (const p of [tri.A, tri.B, tri.C]) {
    if (p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY) {
      return true;
    }
  }
  
  // Check if rectangle center is inside triangle
  const rectCenter: Point = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
  if (pointInTriangle(rectCenter, tri)) {
    return true;
  }
  
  // Check if any triangle edge intersects rectangle
  const edges: [Point, Point][] = [
    [tri.A, tri.B],
    [tri.B, tri.C],
    [tri.C, tri.A],
  ];
  
  for (const [p1, p2] of edges) {
    if (lineIntersectsRect(p1, p2, minX, minY, maxX, maxY)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Simple point-in-triangle test
 */
function pointInTriangle(p: Point, tri: Triangle): boolean {
  const { A, B, C } = tri;
  
  const sign = (p1: Point, p2: Point, p3: Point): number => {
    return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
  };
  
  const d1 = sign(p, A, B);
  const d2 = sign(p, B, C);
  const d3 = sign(p, C, A);
  
  const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
  const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
  
  return !(hasNeg && hasPos);
}

/**
 * Check if a line segment intersects a rectangle
 */
function lineIntersectsRect(
  p1: Point,
  p2: Point,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number
): boolean {
  // Check if line is completely outside
  if ((p1.x < minX && p2.x < minX) || (p1.x > maxX && p2.x > maxX)) return false;
  if ((p1.y < minY && p2.y < minY) || (p1.y > maxY && p2.y > maxY)) return false;
  
  // Check if either endpoint is inside
  if (p1.x >= minX && p1.x <= maxX && p1.y >= minY && p1.y <= maxY) return true;
  if (p2.x >= minX && p2.x <= maxX && p2.y >= minY && p2.y <= maxY) return true;
  
  // Use clipping to determine intersection
  return clipLineToRect(p1, p2, minX, minY, maxX, maxY) !== null;
}

/**
 * Create a unique key for an edge (order-independent)
 */
function edgeToKey(p1: Point, p2: Point): string {
  const key1 = `${p1.x.toFixed(4)},${p1.y.toFixed(4)}`;
  const key2 = `${p2.x.toFixed(4)},${p2.y.toFixed(4)}`;
  return key1 < key2 ? `${key1}-${key2}` : `${key2}-${key1}`;
}

/**
 * Clip segments and add to result
 */
function clipAndAddSegments(
  segments: RenderedSegments,
  result: RenderedSegments,
  panel: Panel,
  _drawnEdges: Set<string>
): void {
  const { widthMm, heightMm } = panel;
  
  // Clip lines
  for (const line of segments.lines) {
    const clipped = clipLineToRect(line.start, line.end, 0, 0, widthMm, heightMm);
    if (clipped) {
      result.lines.push({ ...clipped, weight: line.weight });
    }
  }
  
  // Clip polygons
  for (const poly of segments.polygons) {
    const clipped = clipPolygonToRect(poly.points, 0, 0, widthMm, heightMm);
    if (clipped.length >= 3) {
      result.polygons.push({ points: clipped, weight: poly.weight });
    }
  }
  
  // Arcs - for now, just include them (clipping arcs is complex)
  // In a full implementation, you'd clip arcs to the rectangle
  for (const arc of segments.arcs) {
    // Simple bounds check - if arc center is reasonably close to panel
    const margin = arc.radius + 10;
    if (
      arc.center.x >= -margin &&
      arc.center.x <= widthMm + margin &&
      arc.center.y >= -margin &&
      arc.center.y <= heightMm + margin
    ) {
      result.arcs.push(arc);
    }
  }
}

/**
 * Generate geometry for a single triangle preview (pattern editor)
 */
export function generateTrianglePreview(
  pattern: Pattern,
  triangleSize: number,
  rotation: 0 | 120 | 240 = 0
): { triangle: Triangle; segments: RenderedSegments; edges: LineSegment[] } {
  // Create a centered triangle
  const h = triangleHeight(triangleSize);
  const centerX = triangleSize / 2;
  const centerY = h / 2;
  
  const tri: Triangle = {
    A: { x: centerX, y: 0 },
    B: { x: 0, y: h },
    C: { x: triangleSize, y: h },
    centroid: { x: centerX, y: h / 1.5 },
    isUpPointing: true,
  };
  
  const segments = generatePatternSegments(pattern, tri, rotation);
  const edges = generateTriangleEdges(tri, pattern.baseWeight);
  
  return { triangle: tri, segments, edges };
}

/**
 * Generate geometry for tiled preview (6 triangles around a point)
 */
export function generateTiledPreview(
  pattern: Pattern,
  triangleSize: number
): { triangles: Triangle[]; allSegments: RenderedSegments; allEdges: LineSegment[] } {
  const triangles: Triangle[] = [];
  const allSegments: RenderedSegments = { lines: [], arcs: [], polygons: [] };
  const allEdges: LineSegment[] = [];
  const drawnEdges = new Set<string>();
  
  // Generate a small grid that shows the pattern tiling
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      const tri = getTriangleForCell(row, col, triangleSize);
      triangles.push(tri);
      
      const segments = generatePatternSegments(pattern, tri, 0);
      allSegments.lines.push(...segments.lines);
      allSegments.arcs.push(...segments.arcs);
      allSegments.polygons.push(...segments.polygons);
      
      // Add edges (deduplicated)
      const edges = generateTriangleEdges(tri, pattern.baseWeight);
      for (const edge of edges) {
        const key = edgeToKey(edge.start, edge.end);
        if (!drawnEdges.has(key)) {
          drawnEdges.add(key);
          allEdges.push(edge);
        }
      }
    }
  }
  
  return { triangles, allSegments, allEdges };
}
