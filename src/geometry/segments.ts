import {
  Point,
  Triangle,
  Pattern,
  LineSegment,
  ArcSegment,
  Polygon,
  RenderedSegments,
  Corner,
  Edge,
} from '../types';
import {
  getCornerPoint,
  getEdgeVertices,
  getOppositeEdge,
  subtract,
  add,
  scale,
  normalize,
  perpendicular,
  distance,
  midpoint,
  rotateTriangle,
} from './triangle';
import { lineLineIntersection, clipPolygonToTriangle } from './clipping';

/**
 * Generate all rendered segments for a pattern applied to a triangle
 */
export function generatePatternSegments(
  pattern: Pattern,
  triangle: Triangle,
  rotation: 0 | 120 | 240 = 0
): RenderedSegments {
  // Apply rotation to triangle if needed
  const tri = rotateTriangle(triangle, rotation);
  
  const result: RenderedSegments = {
    lines: [],
    arcs: [],
    polygons: [],
  };
  
  // Generate edge-parallel segments first (they may block corner-to-center)
  const edgeParallelGeometry = generateEdgeParallelSegments(pattern, tri);
  result.polygons.push(...edgeParallelGeometry.polygons);
  
  // Generate corner-to-center segments (may be blocked)
  const cornerToCenterLines = generateCornerToCenterSegments(
    pattern,
    tri,
    edgeParallelGeometry.blockerInfo
  );
  result.lines.push(...cornerToCenterLines);
  
  // Generate corner arcs
  const arcs = generateCornerArcs(pattern, tri);
  result.arcs.push(...arcs);
  
  return result;
}

interface BlockerInfo {
  corner: Corner;
  outerEdge: Point[]; // line from outer edge of blocker
  innerEdge: Point[]; // line from inner edge of blocker (toward centroid)
}

interface EdgeParallelResult {
  polygons: Polygon[];
  blockerInfo: BlockerInfo[];
}

/**
 * Generate edge-parallel segments (potentially blockers)
 */
function generateEdgeParallelSegments(
  pattern: Pattern,
  tri: Triangle
): EdgeParallelResult {
  const polygons: Polygon[] = [];
  const blockerInfo: BlockerInfo[] = [];
  
  const edges: Edge[] = ['BC', 'CA', 'AB'];
  const nearCorners: Corner[] = ['A', 'B', 'C'];
  
  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i];
    const nearCorner = nearCorners[i];
    const config = pattern.edgeParallel[edge];
    
    if (!config) continue;
    
    const weight = pattern.baseWeight * config.weightMultiplier;
    const [edgeStart, edgeEnd] = getEdgeVertices(tri, edge);
    const cornerPoint = getCornerPoint(tri, nearCorner);
    
    // Calculate the direction along the edge
    const edgeVec = normalize(subtract(edgeEnd, edgeStart));
    
    // Calculate perpendicular direction (toward the corner)
    const toCorner = subtract(cornerPoint, midpoint(edgeStart, edgeEnd));
    let perpDir = perpendicular(edgeVec);
    
    // Make sure perpDir points toward the corner
    if (toCorner.x * perpDir.x + toCorner.y * perpDir.y < 0) {
      perpDir = scale(perpDir, -1);
    }
    
    // Calculate the position of the parallel line
    let parallelDistance: number;
    if (config.positionMode === 'from-corner') {
      // Distance from corner toward the edge
      parallelDistance = config.distance;
    } else {
      // Distance from edge toward corner
      const altitude = distance(cornerPoint, midpoint(edgeStart, edgeEnd));
      parallelDistance = altitude - config.distance;
    }
    
    // The center line of the segment
    const centerLineStart = add(cornerPoint, scale(perpDir, -parallelDistance));
    const centerLineEnd = add(centerLineStart, scale(edgeVec, distance(edgeStart, edgeEnd) * 2));
    const centerLineStart2 = subtract(centerLineStart, scale(edgeVec, distance(edgeStart, edgeEnd)));
    
    // Create the rectangle (before clipping)
    const halfWeight = weight / 2;
    const offsetOuter = scale(perpDir, halfWeight); // toward corner
    const offsetInner = scale(perpDir, -halfWeight); // toward edge
    
    // Rectangle corners (extend far enough to clip properly)
    const rectPoints: Point[] = [
      add(centerLineStart2, offsetOuter),
      add(centerLineEnd, offsetOuter),
      add(centerLineEnd, offsetInner),
      add(centerLineStart2, offsetInner),
    ];
    
    // Clip to triangle
    const clippedPolygon = clipPolygonToTriangle(rectPoints, tri);
    
    if (clippedPolygon.length >= 3) {
      polygons.push({
        points: clippedPolygon,
        weight,
      });
      
      // If this is a blocker, store the edge lines for blocking calculations
      if (config.isBlocker) {
        // Calculate the actual lines of the outer and inner edges
        const outerLine = [
          add(centerLineStart2, offsetOuter),
          add(centerLineEnd, offsetOuter),
        ];
        const innerLine = [
          add(centerLineStart2, offsetInner),
          add(centerLineEnd, offsetInner),
        ];
        
        blockerInfo.push({
          corner: nearCorner,
          outerEdge: outerLine,
          innerEdge: innerLine,
        });
      }
    }
  }
  
  return { polygons, blockerInfo };
}

/**
 * Generate corner-to-center line segments
 */
function generateCornerToCenterSegments(
  pattern: Pattern,
  tri: Triangle,
  blockers: BlockerInfo[]
): LineSegment[] {
  const lines: LineSegment[] = [];
  const corners: Corner[] = ['A', 'B', 'C'];
  
  for (const corner of corners) {
    const config = pattern.cornerToCenter[corner];
    if (!config) continue;
    
    const weight = pattern.baseWeight * config.weightMultiplier;
    const cornerPoint = getCornerPoint(tri, corner);
    const centerPoint = tri.centroid;
    
    let start = cornerPoint;
    let end = centerPoint;
    
    // Handle blocking
    if (config.blockedBy === 'edgeParallel') {
      const blocker = blockers.find(b => b.corner === corner);
      
      if (blocker) {
        // Find intersection with blocker edges
        const lineDir = subtract(centerPoint, cornerPoint);
        
        if (config.startSide === 'center') {
          // Line goes from inner edge of blocker to center
          const intersection = lineLineIntersection(
            cornerPoint,
            centerPoint,
            blocker.innerEdge[0],
            blocker.innerEdge[1]
          );
          if (intersection) {
            start = intersection;
          }
        } else {
          // Line goes from corner to outer edge of blocker
          const intersection = lineLineIntersection(
            cornerPoint,
            centerPoint,
            blocker.outerEdge[0],
            blocker.outerEdge[1]
          );
          if (intersection) {
            end = intersection;
          }
        }
      }
    }
    
    lines.push({ start, end, weight });
  }
  
  return lines;
}

/**
 * Generate corner arc segments
 */
function generateCornerArcs(pattern: Pattern, tri: Triangle): ArcSegment[] {
  const arcs: ArcSegment[] = [];
  
  const arcEdges: { edge: Edge; corners: [Corner, Corner] }[] = [
    { edge: 'AB', corners: ['A', 'B'] },
    { edge: 'BC', corners: ['B', 'C'] },
    { edge: 'CA', corners: ['C', 'A'] },
  ];
  
  for (const { edge, corners } of arcEdges) {
    const config = pattern.cornerArcs[edge];
    if (!config) continue;
    
    const weight = pattern.baseWeight * config.weightMultiplier;
    const [c1, c2] = corners;
    const p1 = getCornerPoint(tri, c1);
    const p2 = getCornerPoint(tri, c2);
    
    // Calculate arc that bulges inward (toward centroid)
    const arcData = calculateInwardArc(p1, p2, config.radius, tri.centroid);
    
    if (arcData) {
      arcs.push({
        center: arcData.center,
        radius: arcData.radius,
        startAngle: arcData.startAngle,
        endAngle: arcData.endAngle,
        weight,
      });
    }
  }
  
  return arcs;
}

/**
 * Calculate an arc between two points that bulges toward a reference point
 */
function calculateInwardArc(
  p1: Point,
  p2: Point,
  radius: number,
  bulgeToward: Point
): { center: Point; radius: number; startAngle: number; endAngle: number } | null {
  const d = distance(p1, p2);
  
  // Check if radius is large enough
  if (radius < d / 2) {
    // Radius too small, use minimum radius
    radius = d / 2 + 0.001;
  }
  
  // Midpoint between p1 and p2
  const mid = midpoint(p1, p2);
  
  // Distance from midpoint to arc center
  const h = Math.sqrt(radius * radius - (d / 2) * (d / 2));
  
  // Direction from p1 to p2
  const dir = normalize(subtract(p2, p1));
  
  // Perpendicular direction
  const perp = perpendicular(dir);
  
  // Two possible centers
  const center1 = add(mid, scale(perp, h));
  const center2 = add(mid, scale(perp, -h));
  
  // Choose the center that makes the arc bulge toward bulgeToward
  // The arc bulges away from its center, so pick center farther from bulgeToward
  const dist1 = distance(center1, bulgeToward);
  const dist2 = distance(center2, bulgeToward);
  const center = dist1 > dist2 ? center1 : center2;
  
  // Calculate start and end angles
  const startAngle = Math.atan2(p1.y - center.y, p1.x - center.x);
  const endAngle = Math.atan2(p2.y - center.y, p2.x - center.x);
  
  return { center, radius, startAngle, endAngle };
}

/**
 * Generate triangle edge segments (always present)
 */
export function generateTriangleEdges(tri: Triangle, weight: number): LineSegment[] {
  return [
    { start: tri.A, end: tri.B, weight },
    { start: tri.B, end: tri.C, weight },
    { start: tri.C, end: tri.A, weight },
  ];
}
