import { Point, Triangle } from '../types';
import { subtract, add, scale } from './triangle';

/**
 * Find intersection point of two line segments
 * Returns null if lines don't intersect or are parallel
 */
export function lineLineIntersection(
  p1: Point,
  p2: Point,
  p3: Point,
  p4: Point
): Point | null {
  const d1 = subtract(p2, p1);
  const d2 = subtract(p4, p3);
  const d3 = subtract(p1, p3);
  
  const cross = d1.x * d2.y - d1.y * d2.x;
  
  // Lines are parallel
  if (Math.abs(cross) < 1e-10) {
    return null;
  }
  
  const t = (d3.x * d2.y - d3.y * d2.x) / cross;
  
  return {
    x: p1.x + t * d1.x,
    y: p1.y + t * d1.y,
  };
}

/**
 * Find intersection of a line segment with a line (infinite)
 * Returns the parameter t where intersection occurs (0-1 means within segment)
 */
export function segmentLineIntersection(
  segStart: Point,
  segEnd: Point,
  linePoint: Point,
  lineDir: Point
): { t: number; point: Point } | null {
  const d1 = subtract(segEnd, segStart);
  const d2 = lineDir;
  const d3 = subtract(segStart, linePoint);
  
  const cross = d1.x * d2.y - d1.y * d2.x;
  
  if (Math.abs(cross) < 1e-10) {
    return null;
  }
  
  const t = -(d3.x * d2.y - d3.y * d2.x) / cross;
  
  return {
    t,
    point: {
      x: segStart.x + t * d1.x,
      y: segStart.y + t * d1.y,
    },
  };
}

/**
 * Check which side of a line a point is on
 * Returns positive if on left side, negative if on right side, 0 if on line
 */
function lineSide(lineStart: Point, lineEnd: Point, point: Point): number {
  return (lineEnd.x - lineStart.x) * (point.y - lineStart.y) -
         (lineEnd.y - lineStart.y) * (point.x - lineStart.x);
}

/**
 * Sutherland-Hodgman polygon clipping algorithm
 * Clips a polygon against a convex clipping polygon (the triangle)
 */
export function clipPolygonToTriangle(polygon: Point[], tri: Triangle): Point[] {
  const clipEdges: [Point, Point][] = [
    [tri.A, tri.B],
    [tri.B, tri.C],
    [tri.C, tri.A],
  ];
  
  let outputList = [...polygon];
  
  for (const [clipStart, clipEnd] of clipEdges) {
    if (outputList.length === 0) break;
    
    const inputList = outputList;
    outputList = [];
    
    for (let i = 0; i < inputList.length; i++) {
      const current = inputList[i];
      const next = inputList[(i + 1) % inputList.length];
      
      const currentInside = lineSide(clipStart, clipEnd, current) >= 0;
      const nextInside = lineSide(clipStart, clipEnd, next) >= 0;
      
      if (currentInside) {
        outputList.push(current);
        
        if (!nextInside) {
          // Exiting: add intersection
          const intersection = lineLineIntersection(current, next, clipStart, clipEnd);
          if (intersection) {
            outputList.push(intersection);
          }
        }
      } else if (nextInside) {
        // Entering: add intersection
        const intersection = lineLineIntersection(current, next, clipStart, clipEnd);
        if (intersection) {
          outputList.push(intersection);
        }
      }
    }
  }
  
  return outputList;
}

/**
 * Clip a line segment to a rectangle
 * Uses Cohen-Sutherland algorithm
 */
export function clipLineToRect(
  start: Point,
  end: Point,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number
): { start: Point; end: Point } | null {
  const INSIDE = 0;
  const LEFT = 1;
  const RIGHT = 2;
  const BOTTOM = 4;
  const TOP = 8;
  
  function computeCode(p: Point): number {
    let code = INSIDE;
    if (p.x < minX) code |= LEFT;
    else if (p.x > maxX) code |= RIGHT;
    if (p.y < minY) code |= BOTTOM;
    else if (p.y > maxY) code |= TOP;
    return code;
  }
  
  let x0 = start.x, y0 = start.y;
  let x1 = end.x, y1 = end.y;
  let code0 = computeCode({ x: x0, y: y0 });
  let code1 = computeCode({ x: x1, y: y1 });
  
  while (true) {
    if ((code0 | code1) === 0) {
      // Both inside
      return { start: { x: x0, y: y0 }, end: { x: x1, y: y1 } };
    }
    
    if ((code0 & code1) !== 0) {
      // Both outside same region
      return null;
    }
    
    // Pick an outside point
    const codeOut = code0 !== 0 ? code0 : code1;
    let x: number, y: number;
    
    if (codeOut & TOP) {
      x = x0 + (x1 - x0) * (maxY - y0) / (y1 - y0);
      y = maxY;
    } else if (codeOut & BOTTOM) {
      x = x0 + (x1 - x0) * (minY - y0) / (y1 - y0);
      y = minY;
    } else if (codeOut & RIGHT) {
      y = y0 + (y1 - y0) * (maxX - x0) / (x1 - x0);
      x = maxX;
    } else {
      y = y0 + (y1 - y0) * (minX - x0) / (x1 - x0);
      x = minX;
    }
    
    if (codeOut === code0) {
      x0 = x;
      y0 = y;
      code0 = computeCode({ x: x0, y: y0 });
    } else {
      x1 = x;
      y1 = y;
      code1 = computeCode({ x: x1, y: y1 });
    }
  }
}

/**
 * Clip a polygon to a rectangle
 */
export function clipPolygonToRect(
  polygon: Point[],
  minX: number,
  minY: number,
  maxX: number,
  maxY: number
): Point[] {
  // Use Sutherland-Hodgman with rectangle edges
  const clipEdges: [Point, Point][] = [
    [{ x: minX, y: minY }, { x: maxX, y: minY }], // bottom
    [{ x: maxX, y: minY }, { x: maxX, y: maxY }], // right
    [{ x: maxX, y: maxY }, { x: minX, y: maxY }], // top
    [{ x: minX, y: maxY }, { x: minX, y: minY }], // left
  ];
  
  let outputList = [...polygon];
  
  for (const [clipStart, clipEnd] of clipEdges) {
    if (outputList.length === 0) break;
    
    const inputList = outputList;
    outputList = [];
    
    for (let i = 0; i < inputList.length; i++) {
      const current = inputList[i];
      const next = inputList[(i + 1) % inputList.length];
      
      const currentInside = lineSide(clipStart, clipEnd, current) >= 0;
      const nextInside = lineSide(clipStart, clipEnd, next) >= 0;
      
      if (currentInside) {
        outputList.push(current);
        
        if (!nextInside) {
          const intersection = lineLineIntersection(current, next, clipStart, clipEnd);
          if (intersection) {
            outputList.push(intersection);
          }
        }
      } else if (nextInside) {
        const intersection = lineLineIntersection(current, next, clipStart, clipEnd);
        if (intersection) {
          outputList.push(intersection);
        }
      }
    }
  }
  
  return outputList;
}
