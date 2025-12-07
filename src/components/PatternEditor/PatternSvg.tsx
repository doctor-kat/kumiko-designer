import React from 'react';
import { RenderedSegments, LineSegment, ArcSegment, Polygon, Triangle } from '../../types';

interface PatternSvgProps {
    segments: RenderedSegments;
    edges?: LineSegment[];
    triangle?: Triangle;
    triangles?: Triangle[];
    width: number;
    height: number;
    scale?: number;
    offsetX?: number;
    offsetY?: number;
    strokeColor?: string;
    fillColor?: string;
    showTriangle?: boolean;
    className?: string;
}

export function PatternSvg({
                               segments,
                               edges = [],
                               triangle,
                               triangles,
                               width,
                               height,
                               scale = 1,
                               offsetX = 0,
                               offsetY = 0,
                               strokeColor = '#d6d3d1', // stone-300
                               fillColor = '#44403c', // stone-700
                               showTriangle = true,
                               className = '',
                           }: PatternSvgProps) {
    const transform = `translate(${offsetX}, ${offsetY}) scale(${scale})`;
    const clipId = `triangle-clip-${Math.random().toString(36).substr(2, 9)}`;

    // Use triangles array if provided, otherwise use single triangle
    const allTriangles = triangles || (triangle ? [triangle] : []);

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className={className}
        >
            {/* Define clip path for all triangles */}
            {allTriangles.length > 0 && (
                <defs>
                    <clipPath id={clipId}>
                        {allTriangles.map((tri, i) => (
                            <polygon
                                key={i}
                                points={`${tri.A.x},${tri.A.y} ${tri.B.x},${tri.B.y} ${tri.C.x},${tri.C.y}`}
                                transform={transform}
                            />
                        ))}
                    </clipPath>
                </defs>
            )}

            <g transform={transform}>
                {/* Triangle fills (background) */}
                {showTriangle && allTriangles.map((tri, i) => (
                    <polygon
                        key={i}
                        points={`${tri.A.x},${tri.A.y} ${tri.B.x},${tri.B.y} ${tri.C.x},${tri.C.y}`}
                        fill={fillColor}
                        stroke="none"
                    />
                ))}
            </g>

            {/* Clipped content */}
            <g clipPath={allTriangles.length > 0 ? `url(#${clipId})` : undefined}>
                <g transform={transform}>
                    {/* Polygon segments */}
                    {segments.polygons.map((poly, i) => (
                        <PolygonShape key={`poly-${i}`} polygon={poly} strokeColor={strokeColor} />
                    ))}

                    {/* Line segments (shortened by half weight at each end) */}
                    {segments.lines.map((line, i) => (
                        <ShortenedLineShape key={`line-${i}`} line={line} strokeColor={strokeColor} />
                    ))}

                    {/* Arc segments */}
                    {segments.arcs.map((arc, i) => (
                        <ArcShape key={`arc-${i}`} arc={arc} strokeColor={strokeColor} />
                    ))}

                    {/* Triangle edges */}
                    {showTriangle && edges.map((edge, i) => (
                        <LineShape key={`edge-${i}`} line={edge} strokeColor={strokeColor} />
                    ))}
                </g>
            </g>
        </svg>
    );
}

function LineShape({ line, strokeColor }: { line: LineSegment; strokeColor: string }) {
    return (
        <line
            x1={line.start.x}
            y1={line.start.y}
            x2={line.end.x}
            y2={line.end.y}
            stroke={strokeColor}
            strokeWidth={line.weight}
            strokeLinecap="round"
        />
    );
}

function ShortenedLineShape({ line, strokeColor }: { line: LineSegment; strokeColor: string }) {
    // Only shorten if our line is thicker than the intersecting line
    // If the intersecting line is thicker, it will hide our endpoint
    const dx = line.end.x - line.start.x;
    const dy = line.end.y - line.start.y;
    const len = Math.sqrt(dx * dx + dy * dy);

    const startIntersect = line.startIntersectWeight ?? 0;
    const endIntersect = line.endIntersectWeight ?? 0;

    // Only shorten by the amount our line extends past the intersecting line
    const startShorten = Math.max(0, (line.weight - startIntersect) / 2);
    const endShorten = Math.max(0, (line.weight - endIntersect) / 2);

    if (len < startShorten + endShorten || (startShorten === 0 && endShorten === 0)) {
        // No shortening needed or line too short
        return <LineShape line={line} strokeColor={strokeColor} />;
    }

    const startRatio = startShorten / len;
    const endRatio = endShorten / len;

    const newStart = {
        x: line.start.x + dx * startRatio,
        y: line.start.y + dy * startRatio,
    };
    const newEnd = {
        x: line.end.x - dx * endRatio,
        y: line.end.y - dy * endRatio,
    };

    return (
        <line
            x1={newStart.x}
            y1={newStart.y}
            x2={newEnd.x}
            y2={newEnd.y}
            stroke={strokeColor}
            strokeWidth={line.weight}
            strokeLinecap="round"
        />
    );
}

function PolygonShape({ polygon, strokeColor }: { polygon: Polygon; strokeColor: string }) {
    const points = polygon.points.map(p => `${p.x},${p.y}`).join(' ');
    return (
        <polygon
            points={points}
            fill={strokeColor}
            stroke={strokeColor}
            strokeWidth={0.5}
            strokeLinejoin="round"
        />
    );
}

function ArcShape({ arc, strokeColor }: { arc: ArcSegment; strokeColor: string }) {
    // Calculate start and end points
    const startX = arc.center.x + arc.radius * Math.cos(arc.startAngle);
    const startY = arc.center.y + arc.radius * Math.sin(arc.startAngle);
    const endX = arc.center.x + arc.radius * Math.cos(arc.endAngle);
    const endY = arc.center.y + arc.radius * Math.sin(arc.endAngle);

    // We always want the shorter arc (< 180 degrees)
    let angleDiff = arc.endAngle - arc.startAngle;

    // Normalize to [-π, π]
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

    // Determine sweep direction
    const sweepFlag = angleDiff < 0 ? 0 : 1;

    // SVG arc path - always use small arc (largeArc = 0)
    const d = `M ${startX} ${startY} A ${arc.radius} ${arc.radius} 0 0 ${sweepFlag} ${endX} ${endY}`;

    return (
        <path
            d={d}
            fill="none"
            stroke={strokeColor}
            strokeWidth={arc.weight}
            strokeLinecap="round"
        />
    );
}