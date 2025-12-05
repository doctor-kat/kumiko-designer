import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import { Panel } from '../../types';
import { Button, Select } from '../common';
import { TrianglePreview } from '../PatternEditor/TrianglePreview';
import { GridCanvas } from './GridCanvas';
import { PatternPalette } from './PatternPalette';
import { PanelSettings } from './PanelSettings';

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
  
  const selectedPattern = patterns.find(p => p.id === selectedPatternId);
  
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
            {localPanel.name}
          </h1>
          <span className="text-sm text-stone-500">
            {localPanel.widthMm} × {localPanel.heightMm} mm
          </span>
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
      </header>
      
      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div className="flex-1">
          <GridCanvas
            panel={localPanel}
            patterns={patterns}
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
                      size={56} 
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
              patterns={patterns}
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
            
            {/* Panel Settings */}
            <PanelSettings
              panel={localPanel}
              patterns={patterns}
              onChange={handlePanelChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
