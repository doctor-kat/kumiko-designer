import React from 'react';
import { Pattern } from '../../types';
import { TrianglePreview } from '../PatternEditor/TrianglePreview';

interface PatternPaletteProps {
  patterns: Pattern[];
  selectedPatternId: string;
  onSelect: (patternId: string) => void;
}

export function PatternPalette({ patterns, selectedPatternId, onSelect }: PatternPaletteProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
        Palette
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {patterns.map(pattern => (
          <button
            key={pattern.id}
            onClick={() => onSelect(pattern.id)}
            className={`
              p-2 rounded-lg transition-all duration-150
              ${selectedPatternId === pattern.id 
                ? 'bg-amber-900/40 ring-2 ring-amber-500' 
                : 'bg-stone-800/50 hover:bg-stone-800'
              }
            `}
            title={pattern.name}
          >
            <TrianglePreview pattern={pattern} size={48} />
          </button>
        ))}
      </div>
    </div>
  );
}
