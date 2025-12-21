import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Pattern, Panel, View, AppSettings, CellConfig } from '../types';
import { builtInPatterns, createEmptyPattern, duplicatePattern } from '../data/builtInPatterns';
import { testPatterns } from '../data/testPatterns';

interface AppStore {
  // Navigation
  currentView: View;
  editingPatternId: string | null;
  editingPanelId: string | null;
  
  // Data
  patterns: Pattern[];
  panels: Panel[];
  settings: AppSettings;
  
  // Navigation actions
  setView: (view: View) => void;
  editPattern: (patternId: string | null) => void;
  editPanel: (panelId: string | null) => void;
  
  // Pattern actions
  createPattern: () => string;
  updatePattern: (pattern: Pattern) => void;
  deletePattern: (patternId: string) => void;
  duplicatePatternById: (patternId: string) => string;
  
  // Panel actions
  createPanel: () => string;
  updatePanel: (panel: Panel) => void;
  deletePanel: (panelId: string) => void;
  setCellPattern: (panelId: string, row: number, col: number, patternId: string, rotation?: 0 | 120 | 240) => void;
  setCellRotation: (panelId: string, row: number, col: number, rotation: 0 | 120 | 240) => void;
  clearCell: (panelId: string, row: number, col: number) => void;
  clearAllCells: (panelId: string) => void;
  fillAllCells: (panelId: string, patternId: string, rotation?: 0 | 120 | 240) => void;
  
  // Settings actions
  updateSettings: (settings: Partial<AppSettings>) => void;
  
  // Helpers
  getPatternById: (id: string) => Pattern | undefined;
  getPanelById: (id: string) => Panel | undefined;
}

const defaultSettings: AppSettings = {
  defaultBaseWeight: 0.8,
  defaultTriangleSize: 10,
  defaultStlDepth: 3,
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentView: 'library',
      editingPatternId: null,
      editingPanelId: null,
      patterns: [...builtInPatterns, ...testPatterns],
      panels: [],
      settings: defaultSettings,
      
      // Navigation actions
      setView: (view) => set({ currentView: view }),
      
      editPattern: (patternId) => set({
        editingPatternId: patternId,
        currentView: patternId ? 'pattern-editor' : 'library',
      }),
      
      editPanel: (panelId) => set({
        editingPanelId: panelId,
        currentView: panelId ? 'panel-designer' : 'library',
      }),
      
      // Pattern actions
      createPattern: () => {
        const id = uuidv4();
        const pattern = createEmptyPattern(id);
        set((state) => ({
          patterns: [...state.patterns, pattern],
          editingPatternId: id,
          currentView: 'pattern-editor',
        }));
        return id;
      },
      
      updatePattern: (pattern) => {
        set((state) => ({
          patterns: state.patterns.map((p) =>
            p.id === pattern.id ? { ...pattern, modified: Date.now() } : p
          ),
        }));
      },
      
      deletePattern: (patternId) => {
        const pattern = get().patterns.find((p) => p.id === patternId);
        // Can't delete built-ins or test patterns
        if (pattern?.isBuiltIn || pattern?.tags?.includes('test')) return;

        set((state) => ({
          patterns: state.patterns.filter((p) => p.id !== patternId),
          editingPatternId: state.editingPatternId === patternId ? null : state.editingPatternId,
        }));
      },
      
      duplicatePatternById: (patternId) => {
        const source = get().patterns.find((p) => p.id === patternId);
        if (!source) return '';
        
        const newId = uuidv4();
        const duplicate = duplicatePattern(source, newId);
        
        set((state) => ({
          patterns: [...state.patterns, duplicate],
        }));
        
        return newId;
      },
      
      // Panel actions
      createPanel: () => {
        const id = uuidv4();
        const { settings, patterns } = get();
        const emptyPattern = patterns.find(p => p.id === 'builtin-empty');

        const panel: Panel = {
          id,
          name: 'New Panel',
          created: Date.now(),
          modified: Date.now(),
          widthMm: 100,
          heightMm: 100,
          triangleSizeMm: settings.defaultTriangleSize,
          stlDepthMm: settings.defaultStlDepth,
          defaultPatternId: emptyPattern?.id || '',
          cells: {},
        };

        set((state) => ({
          panels: [...state.panels, panel],
          editingPanelId: id,
          currentView: 'panel-designer',
        }));

        return id;
      },
      
      updatePanel: (panel) => {
        set((state) => ({
          panels: state.panels.map((p) =>
            p.id === panel.id ? { ...panel, modified: Date.now() } : p
          ),
        }));
      },
      
      deletePanel: (panelId) => {
        set((state) => ({
          panels: state.panels.filter((p) => p.id !== panelId),
          editingPanelId: state.editingPanelId === panelId ? null : state.editingPanelId,
        }));
      },
      
      setCellPattern: (panelId, row, col, patternId, rotation = 0) => {
        set((state) => {
          const panel = state.panels.find((p) => p.id === panelId);
          if (!panel) return state;
          
          const cellKey = `${row},${col}`;
          const newCells = { ...panel.cells };
          newCells[cellKey] = { patternId, rotation };
          
          return {
            panels: state.panels.map((p) =>
              p.id === panelId ? { ...p, cells: newCells, modified: Date.now() } : p
            ),
          };
        });
      },
      
      setCellRotation: (panelId, row, col, rotation) => {
        set((state) => {
          const panel = state.panels.find((p) => p.id === panelId);
          if (!panel) return state;
          
          const cellKey = `${row},${col}`;
          const existingCell = panel.cells[cellKey];
          if (!existingCell) return state;
          
          const newCells = { ...panel.cells };
          newCells[cellKey] = { ...existingCell, rotation };
          
          return {
            panels: state.panels.map((p) =>
              p.id === panelId ? { ...p, cells: newCells, modified: Date.now() } : p
            ),
          };
        });
      },
      
      clearCell: (panelId, row, col) => {
        set((state) => {
          const panel = state.panels.find((p) => p.id === panelId);
          if (!panel) return state;
          
          const cellKey = `${row},${col}`;
          const newCells = { ...panel.cells };
          delete newCells[cellKey];
          
          return {
            panels: state.panels.map((p) =>
              p.id === panelId ? { ...p, cells: newCells, modified: Date.now() } : p
            ),
          };
        });
      },
      
      clearAllCells: (panelId) => {
        set((state) => ({
          panels: state.panels.map((p) =>
            p.id === panelId ? { ...p, cells: {}, modified: Date.now() } : p
          ),
        }));
      },
      
      fillAllCells: (panelId, patternId, rotation = 0) => {
        // This would need grid dimensions - for now, just clear and set default
        set((state) => {
          const panel = state.panels.find((p) => p.id === panelId);
          if (!panel) return state;
          
          return {
            panels: state.panels.map((p) =>
              p.id === panelId
                ? { ...p, defaultPatternId: patternId, cells: {}, modified: Date.now() }
                : p
            ),
          };
        });
      },
      
      // Settings actions
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },
      
      // Helpers
      getPatternById: (id) => get().patterns.find((p) => p.id === id),
      getPanelById: (id) => get().panels.find((p) => p.id === id),
    }),
    {
      name: 'kumiko-designer-storage',
      partialize: (state) => ({
        patterns: state.patterns,
        panels: state.panels,
        settings: state.settings,
      }),
      merge: (persisted, current) => {
        const persistedState = persisted as Partial<AppStore>;

        // Ensure built-in and test patterns are always present
        // Filter out built-in patterns, test patterns, and keep only user custom patterns
        const customPatterns = (persistedState.patterns || []).filter(
          p => !p.isBuiltIn && !p.tags?.includes('test')
        );
        const allPatterns = [...builtInPatterns, ...testPatterns, ...customPatterns];

        return {
          ...current,
          patterns: allPatterns,
          panels: persistedState.panels || [],
          settings: { ...defaultSettings, ...persistedState.settings },
        };
      },
    }
  )
);
