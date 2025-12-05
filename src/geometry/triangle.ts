import { Point, Triangle } from '../types';

/**
 * Calculate the height of an equilateral triangle given edge length
 */
export function triangleHeight(edgeLength: number): number {
  return edgeLength * (Math.sqrt(3) / 2);
}

/**
 * Calculate the centroid of a triangle
 */
export function centroid(A: Point, B: Point, C: Point): Point {
  return {
    x: (A.x + B.x + C.x) / 3,
    y: (A.y + B.y + C.y) / 3,
  };
}

/**
 * Calculate midpoint between two points
 */
export function midpoint(p1: Point, p2: Point): Point {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}

/**
 * Calculate distance between two points
 */
export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Normalize a vector
 */
export function normalize(v: Point): Point {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

/**
 * Get perpendicular vector (rotated 90 degrees counterclockwise)
 */
export function perpendicular(v: Point): Point {
  return { x: -v.y, y: v.x };
}

/**
 * Add two points/vectors
 */
export function add(p1: Point, p2: Point): Point {
  return { x: p1.x + p2.x, y: p1.y + p2.y };
}

/**
 * Subtract two points/vectors (p1 - p2)
 */
export function subtract(p1: Point, p2: Point): Point {
  return { x: p1.x - p2.x, y: p1.y - p2.y };
}

/**
 * Scale a vector
 */
export function scale(p: Point, factor: number): Point {
  return { x: p.x * factor, y: p.y * factor };
}

/**
 * Rotate a point around an origin by given angle (radians)
 */
export function rotatePoint(point: Point, origin: Point, angle: number): Point {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  return {
    x: origin.x + dx * cos - dy * sin,
    y: origin.y + dx * sin + dy * cos,
  };
}

/**
 * Rotate a triangle's vertices around its centroid
 */
export function rotateTriangle(tri: Triangle, degrees: 0 | 120 | 240): Triangle {
  if (degrees === 0) return tri;
  
  const angle = (degrees * Math.PI) / 180;
  const c = tri.centroid;
  
  return {
    A: rotatePoint(tri.A, c, angle),
    B: rotatePoint(tri.B, c, angle),
    C: rotatePoint(tri.C, c, angle),
    centroid: c,
    isUpPointing: tri.isUpPointing,
  };
}

/**
 * Calculate triangle vertices for a grid cell
 * 
 * Grid layout:
 * - Row 0: starts with up-pointing triangle
 * - Triangles alternate up/down within each row
 * - Each row is offset by triangle height
 * 
 * @param row - Grid row index
 * @param col - Grid column index
 * @param edgeLength - Triangle edge length in mm
 * @param originX - X offset for the grid origin
 * @param originY - Y offset for the grid origin
 */
export function getTriangleForCell(
  row: number,
  col: number,
  edgeLength: number,
  originX: number = 0,
  originY: number = 0
): Triangle {
  const h = triangleHeight(edgeLength);
  const halfEdge = edgeLength / 2;
  
  // Determine if this triangle points up or down
  // In row 0: col 0 is up, col 1 is down, col 2 is up, etc.
  const isUpPointing = (row + col) % 2 === 0;
  
  // Calculate the horizontal position
  // Each triangle takes up halfEdge in width
  const baseX = originX + col * halfEdge;
  
  // Calculate vertical position
  const baseY = originY + row * h;
  
  let A: Point, B: Point, C: Point;
  
  if (isUpPointing) {
    // Apex at top
    A = { x: baseX + halfEdge, y: baseY };
    B = { x: baseX, y: baseY + h };
    C = { x: baseX + edgeLength, y: baseY + h };
  } else {
    // Apex at bottom
    A = { x: baseX + halfEdge, y: baseY + h };
    B = { x: baseX, y: baseY };
    C = { x: baseX + edgeLength, y: baseY };
  }
  
  return {
    A,
    B,
    C,
    centroid: centroid(A, B, C),
    isUpPointing,
  };
}

/**
 * Get the edge vertices for a given edge name
 */
export function getEdgeVertices(tri: Triangle, edge: 'AB' | 'BC' | 'CA'): [Point, Point] {
  switch (edge) {
    case 'AB': return [tri.A, tri.B];
    case 'BC': return [tri.B, tri.C];
    case 'CA': return [tri.C, tri.A];
  }
}

/**
 * Get the corner opposite to an edge
 */
export function getOppositeCorner(edge: 'AB' | 'BC' | 'CA'): 'A' | 'B' | 'C' {
  switch (edge) {
    case 'BC': return 'A';
    case 'CA': return 'B';
    case 'AB': return 'C';
  }
}

/**
 * Get the edge opposite to a corner
 */
export function getOppositeEdge(corner: 'A' | 'B' | 'C'): 'AB' | 'BC' | 'CA' {
  switch (corner) {
    case 'A': return 'BC';
    case 'B': return 'CA';
    case 'C': return 'AB';
  }
}

/**
 * Get corner point from triangle
 */
export function getCornerPoint(tri: Triangle, corner: 'A' | 'B' | 'C'): Point {
  return tri[corner];
}

/**
 * Calculate the altitude (height) from a corner to the opposite edge
 */
export function altitudeFromCorner(tri: Triangle, corner: 'A' | 'B' | 'C'): number {
  const cornerPoint = getCornerPoint(tri, corner);
  const oppositeEdge = getOppositeEdge(corner);
  const [e1, e2] = getEdgeVertices(tri, oppositeEdge);
  
  // Distance from point to line
  const edgeVec = subtract(e2, e1);
  const toCorner = subtract(cornerPoint, e1);
  const edgeLen = distance(e1, e2);
  
  // Cross product magnitude gives area of parallelogram, divide by base for height
  const cross = edgeVec.x * toCorner.y - edgeVec.y * toCorner.x;
  return Math.abs(cross) / edgeLen;
}

/**
 * Calculate grid dimensions for a panel
 */
export function calculateGridDimensions(
  panelWidthMm: number,
  panelHeightMm: number,
  triangleSizeMm: number
): { rows: number; cols: number } {
  const h = triangleHeight(triangleSizeMm);
  const halfEdge = triangleSizeMm / 2;
  
  // Calculate how many triangles fit
  const cols = Math.ceil(panelWidthMm / halfEdge) + 1;
  const rows = Math.ceil(panelHeightMm / h) + 1;
  
  return { rows, cols };
}

/**
 * Check if a point is inside a triangle
 */
export function pointInTriangle(p: Point, tri: Triangle): boolean {
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
 * Find which grid cell contains a point
 */
export function findCellAtPoint(
  point: Point,
  triangleSizeMm: number,
  originX: number = 0,
  originY: number = 0
): { row: number; col: number } | null {
  const h = triangleHeight(triangleSizeMm);
  const halfEdge = triangleSizeMm / 2;
  
  // Approximate row and column
  const approxRow = Math.floor((point.y - originY) / h);
  const approxCol = Math.floor((point.x - originX) / halfEdge);
  
  // Check this cell and neighbors
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const row = approxRow + dr;
      const col = approxCol + dc;
      if (row < 0 || col < 0) continue;
      
      const tri = getTriangleForCell(row, col, triangleSizeMm, originX, originY);
      if (pointInTriangle(point, tri)) {
        return { row, col };
      }
    }
  }
  
  return null;
}
