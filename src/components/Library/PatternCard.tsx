import React from 'react';
import { Pattern } from '../../types';
import { TrianglePreview } from '../PatternEditor/TrianglePreview';

interface PatternCardProps {
  pattern: Pattern;
  onClick: () => void;
  isSelected?: boolean;
}

export function PatternCard({ pattern, onClick, isSelected = false }: PatternCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        group relative flex flex-col items-center p-4 rounded-xl
        transition-all duration-200 ease-out
        ${isSelected 
          ? 'bg-amber-900/30 ring-2 ring-amber-500' 
          : 'bg-stone-800/50 hover:bg-stone-800 hover:ring-1 hover:ring-stone-600'
        }
      `}
    >
      {/* Preview */}
      <div className="w-24 h-24 mb-3">
        <TrianglePreview pattern={pattern} size={96} />
      </div>
      
      {/* Name */}
      <h3 className="text-sm font-medium text-stone-200 text-center truncate w-full">
        {pattern.name}
      </h3>
      
      {/* Built-in badge */}
      {pattern.isBuiltIn && (
        <span className="mt-1 px-2 py-0.5 text-xs bg-stone-700 text-stone-400 rounded">
          Built-in
        </span>
      )}
      
      {/* Hover overlay */}
      <div className="absolute inset-0 rounded-xl bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </button>
  );
}
