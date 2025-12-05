import React, { useMemo } from 'react';
import { Pattern } from '../../types';
import { generateTiledPreview, triangleHeight } from '../../geometry';
import { PatternSvg } from './PatternSvg';

interface TiledPreviewProps {
  pattern: Pattern;
  width?: number;
  height?: number;
  className?: string;
}

export function TiledPreview({
  pattern,
  width = 300,
  height = 200,
  className = '',
}: TiledPreviewProps) {
  const triangleSize = 12; // mm for tiled preview
  
  const preview = useMemo(
    () => generateTiledPreview(pattern, triangleSize),
    [pattern]
  );
  
  // Calculate bounds of the generated geometry
  const triHeight = triangleHeight(triangleSize);
  const contentWidth = triangleSize * 2;
  const contentHeight = triHeight * 3;
  
  // Scale to fit
  const padding = 10;
  const scaleX = (width - padding * 2) / contentWidth;
  const scaleY = (height - padding * 2) / contentHeight;
  const scale = Math.min(scaleX, scaleY);
  
  const offsetX = (width - contentWidth * scale) / 2;
  const offsetY = (height - contentHeight * scale) / 2;
  
  // Combine all segments
  const allSegments = {
    lines: [...preview.allSegments.lines, ...preview.allEdges],
    arcs: preview.allSegments.arcs,
    polygons: preview.allSegments.polygons,
  };
  
  return (
    <div className={`bg-stone-900 rounded-lg overflow-hidden border border-stone-700 ${className}`}>
      <PatternSvg
        segments={allSegments}
        width={width}
        height={height}
        scale={scale}
        offsetX={offsetX}
        offsetY={offsetY}
        showTriangle={false}
        fillColor="transparent"
      />
    </div>
  );
}
