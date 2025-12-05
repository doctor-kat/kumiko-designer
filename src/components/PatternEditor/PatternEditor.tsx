import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import { Pattern } from '../../types';
import { Button, TextInput } from '../common';
import { TrianglePreview } from './TrianglePreview';
import { TiledPreview } from './TiledPreview';
import { SegmentControls } from './SegmentControls';

export function PatternEditor() {
  const { 
    editingPatternId, 
    patterns, 
    updatePattern, 
    deletePattern, 
    duplicatePatternById,
    editPattern,
    setView 
  } = useAppStore();
  
  const sourcePattern = patterns.find(p => p.id === editingPatternId);
  const [localPattern, setLocalPattern] = useState<Pattern | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Initialize local pattern when source changes
  useEffect(() => {
    if (sourcePattern) {
      setLocalPattern(JSON.parse(JSON.stringify(sourcePattern)));
      setHasChanges(false);
    }
  }, [sourcePattern?.id]);
  
  const handleChange = (updated: Pattern) => {
    setLocalPattern(updated);
    setHasChanges(true);
  };
  
  const handleSave = () => {
    if (localPattern) {
      updatePattern(localPattern);
      setHasChanges(false);
    }
  };
  
  const handleBack = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Discard them?')) {
        editPattern(null);
      }
    } else {
      editPattern(null);
    }
  };
  
  const handleDelete = () => {
    if (localPattern && !localPattern.isBuiltIn) {
      if (confirm(`Delete pattern "${localPattern.name}"?`)) {
        deletePattern(localPattern.id);
        setView('library');
      }
    }
  };
  
  const handleDuplicate = () => {
    if (localPattern) {
      // Save current changes first
      if (hasChanges) {
        updatePattern(localPattern);
      }
      const newId = duplicatePatternById(localPattern.id);
      editPattern(newId);
    }
  };
  
  if (!localPattern) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-stone-400">No pattern selected</p>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col bg-stone-900">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-stone-800">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleBack}>
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Button>
          <div className="h-6 w-px bg-stone-700" />
          <h1 className="text-lg font-semibold text-stone-200">
            {localPattern.isBuiltIn ? 'View Pattern' : 'Edit Pattern'}
          </h1>
          {localPattern.isBuiltIn && (
            <span className="px-2 py-0.5 text-xs bg-amber-900/50 text-amber-200 rounded">
              Built-in
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-sm text-amber-400">Unsaved changes</span>
          )}
          <Button variant="secondary" onClick={handleDuplicate}>
            Duplicate
          </Button>
          {!localPattern.isBuiltIn && (
            <Button variant="primary" onClick={handleSave} disabled={!hasChanges}>
              Save
            </Button>
          )}
        </div>
      </header>
      
      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Preview panel */}
        <div className="flex-1 p-6 flex flex-col gap-6 overflow-auto">
          <div className="space-y-2">
            <TextInput
              label="Pattern Name"
              value={localPattern.name}
              onChange={(v) => handleChange({ ...localPattern, name: v })}
              disabled={localPattern.isBuiltIn}
            />
            <TextInput
              label="Description"
              value={localPattern.description}
              onChange={(v) => handleChange({ ...localPattern, description: v })}
              disabled={localPattern.isBuiltIn}
            />
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center gap-8">
            {/* Single triangle preview */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-stone-400 text-center">Single Triangle</h3>
              <TrianglePreview pattern={localPattern} size={250} />
            </div>
            
            {/* Tiled preview */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-stone-400 text-center">Tiled Preview</h3>
              <TiledPreview pattern={localPattern} width={400} height={250} />
            </div>
          </div>
        </div>
        
        {/* Controls panel */}
        <div className="w-96 border-l border-stone-800 overflow-auto">
          <div className="p-6">
            <h2 className="text-sm font-semibold text-stone-300 uppercase tracking-wider mb-4">
              Segment Configuration
            </h2>
            {localPattern.isBuiltIn ? (
              <div className="mb-4 p-3 bg-amber-900/20 border border-amber-800/30 rounded-lg">
                <p className="text-sm text-amber-200/80">
                  Built-in patterns cannot be modified. Use "Duplicate" to create an editable copy.
                </p>
              </div>
            ) : null}
            <div className={localPattern.isBuiltIn ? 'opacity-50 pointer-events-none' : ''}>
              <SegmentControls pattern={localPattern} onChange={handleChange} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      {!localPattern.isBuiltIn && (
        <footer className="px-6 py-4 border-t border-stone-800 flex justify-between">
          <Button variant="danger" onClick={handleDelete}>
            Delete Pattern
          </Button>
          <div className="text-xs text-stone-500">
            Last modified: {new Date(localPattern.modified).toLocaleString()}
          </div>
        </footer>
      )}
    </div>
  );
}
