import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import { Panel } from '../../types';
import { Button, Select } from '../common';
import { TrianglePreview } from '../PatternEditor/TrianglePreview';
import { GridCanvas } from './GridCanvas';
import { PatternPalette } from './PatternPalette';

export function PanelDesigner() {
  const {
    editingPanelId,
    panels,
    patterns,
    updatePanel,
    setCellPattern,
    setCellRotation,
    clearAllCells,
    editPanel,
  } = useAppStore();
  
  const sourcePanel = panels.find(p => p.id === editingPanelId);
  const [localPanel, setLocalPanel] = useState<Panel | null>(null);
  const [selectedPatternId, setSelectedPatternId] = useState<string>('');
  const [selectedRotation, setSelectedRotation] = useState<0 | 120 | 240>(0);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Initialize local panel
  useEffect(() => {
    if (sourcePanel) {
      setLocalPanel(JSON.parse(JSON.stringify(sourcePanel)));
      setSelectedPatternId(sourcePanel.defaultPatternId);
      setHasChanges(false);
    }
  }, [sourcePanel?.id]);
  
  // Auto-save changes
  useEffect(() => {
    if (localPanel && hasChanges) {
      const timer = setTimeout(() => {
        updatePanel(localPanel);
        setHasChanges(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [localPanel, hasChanges, updatePanel]);
  
  const handlePanelChange = (updated: Panel) => {
    setLocalPanel(updated);
    setHasChanges(true);
  };
  
  const handleCellClick = (row: number, col: number, _shiftKey: boolean) => {
    if (!localPanel) return;
    
    const cellKey = `${row},${col}`;
    const newCells = { ...localPanel.cells };
    newCells[cellKey] = { patternId: selectedPatternId, rotation: selectedRotation };
    
    setLocalPanel({ ...localPanel, cells: newCells });
    setHasChanges(true);
  };
  
  const handleCellRightClick = (row: number, col: number) => {
    if (!localPanel) return;
    
    const cellKey = `${row},${col}`;
    const existingCell = localPanel.cells[cellKey];
    
    if (existingCell) {
      // Cycle rotation: 0 -> 120 -> 240 -> 0
      const newRotation = ((existingCell.rotation + 120) % 360) as 0 | 120 | 240;
      const newCells = { ...localPanel.cells };
      newCells[cellKey] = { ...existingCell, rotation: newRotation };
      setLocalPanel({ ...localPanel, cells: newCells });
      setHasChanges(true);
    }
  };
  
  const handlePatternPick = (patternId: string, rotation: 0 | 120 | 240) => {
    setSelectedPatternId(patternId);
    setSelectedRotation(rotation);
  };
  
  const handleClearAll = () => {
    if (localPanel && confirm('Clear all cell assignments?')) {
      setLocalPanel({ ...localPanel, cells: {} });
      setHasChanges(true);
    }
  };
  
  const handleFillAll = () => {
    if (localPanel) {
      setLocalPanel({ 
        ...localPanel, 
        defaultPatternId: selectedPatternId,
        cells: {} 
      });
      setHasChanges(true);
    }
  };
  
  const handleBack = () => {
    editPanel(null);
  };

  // Filter out test patterns from the designer
  const designerPatterns = patterns.filter(p => !p.tags?.includes('test'));
  const selectedPattern = designerPatterns.find(p => p.id === selectedPatternId);
  
  if (!localPanel) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-stone-400">No panel selected</p>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col bg-stone-900">
      {/* Header */}
      <header className="px-6 py-4 border-b border-stone-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={handleBack}>
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Button>
            <div className="h-6 w-px bg-stone-700" />
            <input
              type="text"
              value={localPanel.name}
              onChange={(e) => handlePanelChange({ ...localPanel, name: e.target.value })}
              className="text-lg font-semibold text-stone-200 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-stone-600 rounded px-2 -mx-2"
            />
          </div>

          <div className="flex items-center gap-3">
            {hasChanges && (
              <span className="text-sm text-stone-500">Saving...</span>
            )}
            <Button variant="secondary" onClick={() => {}}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </Button>
          </div>
        </div>

        {/* Panel Settings Row */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <label className="text-stone-400">Width:</label>
            <input
              type="number"
              value={localPanel.widthMm}
              onChange={(e) => handlePanelChange({ ...localPanel, widthMm: Number(e.target.value) })}
              className="w-20 px-2 py-1 bg-stone-800 text-stone-200 rounded border border-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-600"
              min={10}
              max={1000}
            />
            <span className="text-stone-500">mm</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-stone-400">Height:</label>
            <input
              type="number"
              value={localPanel.heightMm}
              onChange={(e) => handlePanelChange({ ...localPanel, heightMm: Number(e.target.value) })}
              className="w-20 px-2 py-1 bg-stone-800 text-stone-200 rounded border border-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-600"
              min={10}
              max={1000}
            />
            <span className="text-stone-500">mm</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-stone-400">Triangle:</label>
            <input
              type="number"
              value={localPanel.triangleSizeMm}
              onChange={(e) => handlePanelChange({ ...localPanel, triangleSizeMm: Number(e.target.value) })}
              className="w-20 px-2 py-1 bg-stone-800 text-stone-200 rounded border border-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-600"
              min={2}
              max={50}
              step={0.5}
            />
            <span className="text-stone-500">mm</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-stone-400">Default Pattern:</label>
            <select
              value={localPanel.defaultPatternId}
              onChange={(e) => handlePanelChange({ ...localPanel, defaultPatternId: e.target.value })}
              className="px-2 py-1 bg-stone-800 text-stone-200 rounded border border-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-600"
            >
              {designerPatterns.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div className="flex-1">
          <GridCanvas
            panel={localPanel}
            patterns={designerPatterns}
            selectedPatternId={selectedPatternId}
            selectedRotation={selectedRotation}
            onCellClick={handleCellClick}
            onCellRightClick={handleCellRightClick}
            onPatternPick={handlePatternPick}
          />
        </div>
        
        {/* Sidebar */}
        <div className="w-72 border-l border-stone-800 overflow-auto">
          <div className="p-4 space-y-6">
            {/* Active Pattern */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                Painting With
              </h3>
              <div className="flex items-center gap-3 p-3 bg-stone-800/50 rounded-lg">
                {selectedPattern && (
                  <>
                    <TrianglePreview
                      pattern={selectedPattern}
                      size={80}
                      rotation={selectedRotation}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-200 truncate">
                        {selectedPattern.name}
                      </p>
                      <p className="text-xs text-stone-500">
                        Rotation: {selectedRotation}°
                      </p>
                    </div>
                  </>
                )}
              </div>
              <Select
                label="Rotation"
                value={String(selectedRotation)}
                onChange={(v) => setSelectedRotation(Number(v) as 0 | 120 | 240)}
                options={[
                  { value: '0', label: '0°' },
                  { value: '120', label: '120°' },
                  { value: '240', label: '240°' },
                ]}
              />
            </div>
            
            {/* Pattern Palette */}
            <PatternPalette
              patterns={designerPatterns}
              selectedPatternId={selectedPatternId}
              onSelect={setSelectedPatternId}
            />
            
            {/* Quick Actions */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                Actions
              </h3>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={handleFillAll} className="flex-1">
                  Fill All
                </Button>
                <Button variant="secondary" size="sm" onClick={handleClearAll} className="flex-1">
                  Clear All
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
