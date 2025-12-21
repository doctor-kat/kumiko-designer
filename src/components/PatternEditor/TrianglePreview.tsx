import React, { useMemo } from 'react';
import { Pattern } from '../../types';
import { generateTrianglePreview } from '../../geometry';
import { PatternSvg } from './PatternSvg';

interface TrianglePreviewProps {
  pattern: Pattern;
  size?: number;
  rotation?: 0 | 120 | 240;
  className?: string;
}

export function TrianglePreview({
  pattern,
  size = 200,
  rotation = 0,
  className = '',
}: TrianglePreviewProps) {
  const triangleSize = 15; // mm - preview triangle size
  const preview = useMemo(
    () => generateTrianglePreview(pattern, triangleSize, rotation),
    [pattern, rotation]
  );
  
  // Calculate scale to fit the triangle in the view
  const triangleHeight = triangleSize * (Math.sqrt(3) / 2);
  const padding = 20;
  const scaleX = (size - padding * 2) / triangleSize;
  const scaleY = (size - padding * 2) / triangleHeight;
  const scale = Math.min(scaleX, scaleY);
  
  const offsetX = (size - triangleSize * scale) / 2;
  const offsetY = (size - triangleHeight * scale) / 2;
  
  return (
    <PatternSvg
      segments={preview.segments}
      edges={preview.edges}
      triangle={preview.triangle}
      width={size}
      height={size}
      scale={scale}
      offsetX={offsetX}
      offsetY={offsetY}
      showTriangle={true}
      className={`block ${className}`}
    />
  );
}
