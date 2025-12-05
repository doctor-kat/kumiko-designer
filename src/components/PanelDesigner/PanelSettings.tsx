import React from 'react';
import { Panel, Pattern } from '../../types';
import { NumberInput, TextInput, Select } from '../common';

interface PanelSettingsProps {
  panel: Panel;
  patterns: Pattern[];
  onChange: (panel: Panel) => void;
}

export function PanelSettings({ panel, patterns, onChange }: PanelSettingsProps) {
  const update = (changes: Partial<Panel>) => {
    onChange({ ...panel, ...changes });
  };
  
  return (
    <div className="space-y-6">
      {/* Panel Info */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
          Panel
        </h3>
        <TextInput
          label="Name"
          value={panel.name}
          onChange={(v) => update({ name: v })}
        />
      </div>
      
      {/* Dimensions */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
          Dimensions
        </h3>
        <NumberInput
          label="Width"
          value={panel.widthMm}
          onChange={(v) => update({ widthMm: v })}
          min={10}
          max={1000}
          step={1}
          unit="mm"
        />
        <NumberInput
          label="Height"
          value={panel.heightMm}
          onChange={(v) => update({ heightMm: v })}
          min={10}
          max={1000}
          step={1}
          unit="mm"
        />
        <NumberInput
          label="Triangle Size"
          value={panel.triangleSizeMm}
          onChange={(v) => update({ triangleSizeMm: v })}
          min={2}
          max={50}
          step={0.5}
          unit="mm"
        />
      </div>
      
      {/* Export Settings */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
          Export
        </h3>
        <NumberInput
          label="STL Depth"
          value={panel.stlDepthMm}
          onChange={(v) => update({ stlDepthMm: v })}
          min={0.5}
          max={20}
          step={0.5}
          unit="mm"
        />
      </div>
      
      {/* Default Pattern */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
          Default Pattern
        </h3>
        <Select
          label="Pattern"
          value={panel.defaultPatternId}
          onChange={(v) => update({ defaultPatternId: v })}
          options={patterns.map(p => ({ value: p.id, label: p.name }))}
        />
        <p className="text-xs text-stone-500">
          Used for cells without a specific pattern assigned
        </p>
      </div>
    </div>
  );
}
