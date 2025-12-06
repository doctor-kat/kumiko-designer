import React from 'react';
import { RenderedSegments, LineSegment, ArcSegment, Polygon, Triangle } from '../../types';

interface PatternSvgProps {
    segments: RenderedSegments;
    edges?: LineSegment[];
    triangle?: Triangle;
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

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className={className}
        >
            <g transform={transform}>
                {/* Triangle fill (background) */}
                {showTriangle && triangle && (
                    <polygon
                        points={`${triangle.A.x},${triangle.A.y} ${triangle.B.x},${triangle.B.y} ${triangle.C.x},${triangle.C.y}`}
                        fill={fillColor}
                        stroke="none"
                    />
                )}

                {/* Polygon segments (edge-parallel trapezoids) */}
                {segments.polygons.map((poly, i) => (
                    <PolygonShape key={`poly-${i}`} polygon={poly} strokeColor={strokeColor} />
                ))}

                {/* Line segments */}
                {segments.lines.map((line, i) => (
                    <LineShape key={`line-${i}`} line={line} strokeColor={strokeColor} />
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
    // largeArc = 0 means use the arc < 180°
    // sweepFlag determines direction: 1 = clockwise, 0 = counter-clockwise

    // Calculate which direction gives us the shorter arc
    let angleDiff = arc.endAngle - arc.startAngle;

    // Normalize to [-π, π]
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

    // If angleDiff > 0, we go counter-clockwise from start to end (sweepFlag = 0)
    // If angleDiff < 0, we go clockwise from start to end (sweepFlag = 1)
    // But SVG Y-axis is flipped, so we need to invert
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