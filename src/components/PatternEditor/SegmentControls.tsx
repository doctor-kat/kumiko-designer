import React from 'react';
import { Pattern, CornerToCenterConfig, EdgeParallelConfig, ArcConfig, Corner, Edge } from '../../types';
import { NumberInput, Checkbox, Select } from '../common';

interface SegmentControlsProps {
  pattern: Pattern;
  onChange: (pattern: Pattern) => void;
}

export function SegmentControls({ pattern, onChange }: SegmentControlsProps) {
  const updateCornerToCenter = (corner: Corner, config: CornerToCenterConfig | null) => {
    onChange({
      ...pattern,
      cornerToCenter: { ...pattern.cornerToCenter, [corner]: config },
    });
  };
  
  const updateEdgeParallel = (edge: Edge, config: EdgeParallelConfig | null) => {
    onChange({
      ...pattern,
      edgeParallel: { ...pattern.edgeParallel, [edge]: config },
    });
  };
  
  const updateCornerArc = (edge: Edge, config: ArcConfig | null) => {
    onChange({
      ...pattern,
      cornerArcs: { ...pattern.cornerArcs, [edge]: config },
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-stone-700">
        <NumberInput
          label="Base Weight"
          value={pattern.baseWeight}
          onChange={(v) => onChange({ ...pattern, baseWeight: v })}
          min={0.1}
          max={5}
          step={0.1}
          unit="mm"
        />
      </div>
      
      <SegmentSection title="Corner to Center">
        <CornerToCenterControl
          label="A → Center"
          config={pattern.cornerToCenter.A}
          onChange={(c) => updateCornerToCenter('A', c)}
        />
        <CornerToCenterControl
          label="B → Center"
          config={pattern.cornerToCenter.B}
          onChange={(c) => updateCornerToCenter('B', c)}
        />
        <CornerToCenterControl
          label="C → Center"
          config={pattern.cornerToCenter.C}
          onChange={(c) => updateCornerToCenter('C', c)}
        />
      </SegmentSection>
      
      <SegmentSection title="Edge Parallel">
        <EdgeParallelControl
          label="Near A (∥ to BC)"
          config={pattern.edgeParallel.BC}
          onChange={(c) => updateEdgeParallel('BC', c)}
        />
        <EdgeParallelControl
          label="Near B (∥ to CA)"
          config={pattern.edgeParallel.CA}
          onChange={(c) => updateEdgeParallel('CA', c)}
        />
        <EdgeParallelControl
          label="Near C (∥ to AB)"
          config={pattern.edgeParallel.AB}
          onChange={(c) => updateEdgeParallel('AB', c)}
        />
      </SegmentSection>
      
      <SegmentSection title="Corner Arcs">
        <CornerArcControl
          label="A ↔ B"
          config={pattern.cornerArcs.AB}
          onChange={(c) => updateCornerArc('AB', c)}
        />
        <CornerArcControl
          label="B ↔ C"
          config={pattern.cornerArcs.BC}
          onChange={(c) => updateCornerArc('BC', c)}
        />
        <CornerArcControl
          label="C ↔ A"
          config={pattern.cornerArcs.CA}
          onChange={(c) => updateCornerArc('CA', c)}
        />
      </SegmentSection>
    </div>
  );
}

function SegmentSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-stone-300 uppercase tracking-wider">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

interface CornerToCenterControlProps {
  label: string;
  config: CornerToCenterConfig | null;
  onChange: (config: CornerToCenterConfig | null) => void;
}

function CornerToCenterControl({ label, config, onChange }: CornerToCenterControlProps) {
  const enabled = config !== null;
  
  const toggleEnabled = (checked: boolean) => {
    if (checked) {
      onChange({ weightMultiplier: 1.0, blockedBy: null, startSide: 'corner' });
    } else {
      onChange(null);
    }
  };
  
  const updateConfig = (updates: Partial<CornerToCenterConfig>) => {
    if (config) {
      onChange({ ...config, ...updates });
    }
  };
  
  return (
    <div className="bg-stone-800/50 rounded-lg p-3 space-y-3">
      <Checkbox label={label} checked={enabled} onChange={toggleEnabled} />
      
      {enabled && config && (
        <div className="pl-7 space-y-3">
          <NumberInput
            label="Weight"
            value={config.weightMultiplier}
            onChange={(v) => updateConfig({ weightMultiplier: v })}
            min={0.1}
            max={5}
            step={0.1}
            unit="×"
          />
          
          <Select
            label="Blocked by"
            value={config.blockedBy || 'none'}
            onChange={(v) => updateConfig({ blockedBy: v === 'none' ? null : 'edgeParallel' })}
            options={[
              { value: 'none', label: 'None' },
              { value: 'edgeParallel', label: 'Edge Parallel' },
            ]}
          />
          
          {config.blockedBy && (
            <div className="space-y-2">
              <label className="text-xs text-stone-400 font-medium">Appears on</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`startSide-${label}`}
                    checked={config.startSide === 'corner'}
                    onChange={() => updateConfig({ startSide: 'corner' })}
                    className="accent-amber-500"
                  />
                  <span className="text-sm text-stone-300">Corner side</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`startSide-${label}`}
                    checked={config.startSide === 'center'}
                    onChange={() => updateConfig({ startSide: 'center' })}
                    className="accent-amber-500"
                  />
                  <span className="text-sm text-stone-300">Center side</span>
                </label>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface EdgeParallelControlProps {
  label: string;
  config: EdgeParallelConfig | null;
  onChange: (config: EdgeParallelConfig | null) => void;
}

function EdgeParallelControl({ label, config, onChange }: EdgeParallelControlProps) {
  const enabled = config !== null;
  
  const toggleEnabled = (checked: boolean) => {
    if (checked) {
      onChange({
        positionMode: 'from-edge',
        distance: 3.0,
        weightMultiplier: 1.0,
        isBlocker: false,
      });
    } else {
      onChange(null);
    }
  };
  
  const updateConfig = (updates: Partial<EdgeParallelConfig>) => {
    if (config) {
      onChange({ ...config, ...updates });
    }
  };
  
  return (
    <div className="bg-stone-800/50 rounded-lg p-3 space-y-3">
      <Checkbox label={label} checked={enabled} onChange={toggleEnabled} />
      
      {enabled && config && (
        <div className="pl-7 space-y-3">
          <Select
            label="Position from"
            value={config.positionMode}
            onChange={(v) => updateConfig({ positionMode: v as 'from-edge' | 'from-corner' })}
            options={[
              { value: 'from-edge', label: 'From Edge' },
              { value: 'from-corner', label: 'From Corner' },
            ]}
          />
          
          <NumberInput
            label="Distance"
            value={config.distance}
            onChange={(v) => updateConfig({ distance: v })}
            min={0.1}
            max={20}
            step={0.1}
            unit="mm"
          />
          
          <NumberInput
            label="Weight"
            value={config.weightMultiplier}
            onChange={(v) => updateConfig({ weightMultiplier: v })}
            min={0.1}
            max={5}
            step={0.1}
            unit="×"
          />
          
          <Checkbox
            label="Blocks other segments"
            checked={config.isBlocker}
            onChange={(v) => updateConfig({ isBlocker: v })}
          />
        </div>
      )}
    </div>
  );
}

interface CornerArcControlProps {
  label: string;
  config: ArcConfig | null;
  onChange: (config: ArcConfig | null) => void;
}

function CornerArcControl({ label, config, onChange }: CornerArcControlProps) {
  const enabled = config !== null;
  
  const toggleEnabled = (checked: boolean) => {
    if (checked) {
      onChange({ radius: 8.0, weightMultiplier: 1.0 });
    } else {
      onChange(null);
    }
  };
  
  const updateConfig = (updates: Partial<ArcConfig>) => {
    if (config) {
      onChange({ ...config, ...updates });
    }
  };
  
  return (
    <div className="bg-stone-800/50 rounded-lg p-3 space-y-3">
      <Checkbox label={label} checked={enabled} onChange={toggleEnabled} />
      
      {enabled && config && (
        <div className="pl-7 space-y-3">
          <NumberInput
            label="Radius"
            value={config.radius}
            onChange={(v) => updateConfig({ radius: v })}
            min={1}
            max={50}
            step={0.5}
            unit="mm"
          />
          
          <NumberInput
            label="Weight"
            value={config.weightMultiplier}
            onChange={(v) => updateConfig({ weightMultiplier: v })}
            min={0.1}
            max={5}
            step={0.1}
            unit="×"
          />
        </div>
      )}
    </div>
  );
}
