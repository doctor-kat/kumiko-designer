import React from 'react';
import { Panel } from '../../types';

interface PanelCardProps {
  panel: Panel;
  onClick: () => void;
  onDelete?: () => void;
}

export function PanelCard({ panel, onClick, onDelete }: PanelCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && confirm(`Delete panel "${panel.name}"?`)) {
      onDelete();
    }
  };
  
  return (
    <button
      onClick={onClick}
      className={`
        group relative flex flex-col p-4 rounded-xl text-left
        bg-stone-800/50 hover:bg-stone-800 
        transition-all duration-200 ease-out
        hover:ring-1 hover:ring-stone-600
      `}
    >
      {/* Preview placeholder */}
      <div className="w-full aspect-video mb-3 rounded-lg bg-stone-900 flex items-center justify-center overflow-hidden">
        <div className="text-stone-600">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 9h16M9 4v16" />
          </svg>
        </div>
      </div>
      
      {/* Name */}
      <h3 className="text-sm font-medium text-stone-200 truncate">
        {panel.name}
      </h3>
      
      {/* Dimensions */}
      <p className="text-xs text-stone-500 mt-1">
        {panel.widthMm} × {panel.heightMm} mm
      </p>
      
      {/* Delete button */}
      {onDelete && (
        <button
          onClick={handleDelete}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-stone-900/80 text-stone-500 
                     opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-900/30
                     transition-all duration-150"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </button>
  );
}
