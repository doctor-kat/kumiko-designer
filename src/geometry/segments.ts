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
    subtract,
    add,
    scale,
    normalize,
    perpendicular,
    distance,
    midpoint,
    rotateTriangle,
} from './triangle';
import { lineLineIntersection } from './clipping';

/**
 * Generate all rendered segments for a pattern applied to a triangle
 */
export function generatePatternSegments(
    pattern: Pattern,
    triangle: Triangle,
    rotation: 0 | 120 | 240 = 0,
    edgeWeight: number = 0.8
): RenderedSegments {
    // Apply rotation to triangle if needed
    const tri = rotateTriangle(triangle, rotation);

    const result: RenderedSegments = {
        lines: [],
        arcs: [],
        polygons: [],
    };

    // Generate edge-parallel segments first (they may block corner-to-center)
    const edgeParallelResult = generateEdgeParallelSegments(pattern, tri, edgeWeight);
    result.lines.push(...edgeParallelResult.lines);

    // Generate corner-to-center segments (may be blocked)
    const cornerToCenterLines = generateCornerToCenterSegments(
        pattern,
        tri,
        edgeParallelResult.blockerInfo,
        edgeWeight
    );
    result.lines.push(...cornerToCenterLines);

    // Generate corner arcs
    const arcs = generateCornerArcs(pattern, tri);
    result.arcs.push(...arcs);

    return result;
}

interface BlockerInfo {
    corner: Corner;
    line: { start: Point; end: Point }; // The centerline of the blocker
    halfWidth: number; // Half the weight of the blocker
}

interface EdgeParallelResult {
    lines: LineSegment[];
    blockerInfo: BlockerInfo[];
}

/**
 * Generate edge-parallel segments as lines
 *
 * For edge BC (opposite corner A):
 * - "from-edge" mode: line is 'distance' mm away from edge BC, toward A
 * - "from-corner" mode: line is 'distance' mm away from corner A, toward BC
 */
function generateEdgeParallelSegments(
    pattern: Pattern,
    tri: Triangle,
    edgeWeight: number
): EdgeParallelResult {
    const lines: LineSegment[] = [];
    const blockerInfo: BlockerInfo[] = [];

    // Edge -> opposite corner mapping
    const edgeConfig: { edge: Edge; corner: Corner }[] = [
        { edge: 'BC', corner: 'A' },
        { edge: 'CA', corner: 'B' },
        { edge: 'AB', corner: 'C' },
    ];

    for (const { edge, corner } of edgeConfig) {
        const config = pattern.edgeParallel[edge];
        if (!config) continue;

        const weight = pattern.baseWeight * config.weightMultiplier;
        const [edgeP1, edgeP2] = getEdgeVertices(tri, edge);
        const cornerPoint = getCornerPoint(tri, corner);

        // Get the edge direction (this is what we're parallel to)
        const edgeDir = normalize(subtract(edgeP2, edgeP1));

        // Get perpendicular to edge, pointing toward the corner
        let perpToEdge = perpendicular(edgeDir);

        // Make sure perpToEdge points toward corner
        const toCorner = subtract(cornerPoint, edgeP1);
        if (perpToEdge.x * toCorner.x + perpToEdge.y * toCorner.y < 0) {
            perpToEdge = scale(perpToEdge, -1);
        }

        // Calculate altitude (perpendicular distance from corner to edge)
        const altitudeLength = Math.abs(toCorner.x * perpToEdge.x + toCorner.y * perpToEdge.y);

        // Calculate how far from the edge the parallel line should be
        let distFromEdge: number;
        if (config.positionMode === 'from-corner') {
            distFromEdge = altitudeLength - config.distance;
        } else {
            distFromEdge = config.distance;
        }

        // Clamp to valid range
        if (distFromEdge <= 0 || distFromEdge >= altitudeLength) {
            continue;
        }

        // Find a point on the parallel line by starting from the edge midpoint
        // and moving perpendicular toward the corner
        const edgeMid = midpoint(edgeP1, edgeP2);
        const linePoint: Point = add(edgeMid, scale(perpToEdge, distFromEdge));

        // Find where this line intersects the two edges adjacent to the opposite edge
        // For edge BC (opposite corner A): intersect with AB and CA
        // For edge CA (opposite corner B): intersect with AB and BC
        // For edge AB (opposite corner C): intersect with BC and CA
        let edge1Start: Point, edge1End: Point;
        let edge2Start: Point, edge2End: Point;

        if (edge === 'BC') {
            // Adjacent edges: AB and CA
            edge1Start = tri.A; edge1End = tri.B;
            edge2Start = tri.C; edge2End = tri.A;
        } else if (edge === 'CA') {
            // Adjacent edges: AB and BC
            edge1Start = tri.A; edge1End = tri.B;
            edge2Start = tri.B; edge2End = tri.C;
        } else {
            // edge === 'AB', Adjacent edges: BC and CA
            edge1Start = tri.B; edge1End = tri.C;
            edge2Start = tri.C; edge2End = tri.A;
        }

        // Intersect the parallel line with the two adjacent edges
        const int1 = lineLineIntersection(
            linePoint,
            add(linePoint, edgeDir),
            edge1Start,
            edge1End
        );
        const int2 = lineLineIntersection(
            linePoint,
            add(linePoint, edgeDir),
            edge2Start,
            edge2End
        );

        if (!int1 || !int2) continue;

        // Edge-parallel lines intersect with triangle edges at both ends
        // We'll use edgeWeight which is passed in from the caller
        lines.push({
            start: int1,
            end: int2,
            weight,
            startIntersectWeight: edgeWeight,
            endIntersectWeight: edgeWeight,
        });

        // If this is a blocker, store info for corner-to-center blocking
        if (config.isBlocker) {
            blockerInfo.push({
                corner,
                line: { start: int1, end: int2 },
                halfWidth: weight / 2,
            });
        }
    }

    return { lines, blockerInfo };
}

/**
 * Generate corner-to-center line segments
 */
function generateCornerToCenterSegments(
    pattern: Pattern,
    tri: Triangle,
    blockers: BlockerInfo[],
    edgeWeight: number
): LineSegment[] {
    const lines: LineSegment[] = [];
    const corners: Corner[] = ['A', 'B', 'C'];

    // Calculate weight of lines meeting at center (for other corner-to-center lines)
    const centerWeights: number[] = corners
        .map(c => pattern.cornerToCenter[c])
        .filter(config => config !== null)
        .map(config => pattern.baseWeight * config!.weightMultiplier);
    const avgCenterWeight = centerWeights.length > 0
        ? centerWeights.reduce((a, b) => a + b, 0) / centerWeights.length
        : 0;

    for (const corner of corners) {
        const config = pattern.cornerToCenter[corner];
        if (!config) continue;

        const weight = pattern.baseWeight * config.weightMultiplier;
        const cornerPoint = getCornerPoint(tri, corner);
        const centerPoint = tri.centroid;

        let start = cornerPoint;
        let end = centerPoint;
        let startIntersectWeight = edgeWeight; // starts at triangle edge
        let endIntersectWeight = avgCenterWeight; // ends at center meeting other lines

        // Handle blocking
        if (config.blockedBy === 'edgeParallel') {
            const blocker = blockers.find(b => b.corner === corner);

            if (blocker) {
                // Find where the corner-to-center line intersects the blocker line
                const intersection = lineLineIntersection(
                    cornerPoint,
                    centerPoint,
                    blocker.line.start,
                    blocker.line.end
                );

                if (intersection) {
                    // Direction from corner to center
                    const dir = normalize(subtract(centerPoint, cornerPoint));

                    if (config.startSide === 'center') {
                        // Line goes from blocker (offset by half width toward center) to center
                        start = add(intersection, scale(dir, blocker.halfWidth));
                        startIntersectWeight = blocker.halfWidth * 2; // blocker weight
                    } else {
                        // Line goes from corner to blocker (offset by half width toward corner)
                        end = add(intersection, scale(dir, -blocker.halfWidth));
                        endIntersectWeight = blocker.halfWidth * 2; // blocker weight
                    }
                }
            }
        }

        lines.push({ start, end, weight, startIntersectWeight, endIntersectWeight });
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