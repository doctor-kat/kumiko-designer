import React from 'react';
import { useAppStore } from '../../store';
import { Button } from '../common';
import { PatternCard } from './PatternCard';
import { PanelCard } from './PanelCard';

export function LibraryView() {
  const {
    patterns,
    panels,
    createPattern,
    createPanel,
    deletePanel,
    editPattern,
    editPanel
  } = useAppStore();

  const [isTestPatternsCollapsed, setIsTestPatternsCollapsed] = React.useState(true);

  const traditionalPatterns = patterns.filter(p => p.isBuiltIn);
  const testPatterns = patterns.filter(p => p.tags?.includes('test'));
  const customPatterns = patterns.filter(p => !p.isBuiltIn && !p.tags?.includes('test'));
  
  return (
    <div className="h-full flex flex-col bg-stone-900">
      {/* Header */}
      <header className="px-8 py-6 border-b border-stone-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-100 tracking-tight">
              Kumiko Designer
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              Design custom kumiko patterns for woodworking
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={createPattern}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Pattern
            </Button>
            <Button variant="primary" onClick={createPanel}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Panel
            </Button>
          </div>
        </div>
      </header>
      
      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="px-8 py-6 space-y-10">
          {/* Traditional Patterns */}
          <section>
            <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-4">
              Traditional Patterns
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {traditionalPatterns.map(pattern => (
                <PatternCard
                  key={pattern.id}
                  pattern={pattern}
                  onClick={() => editPattern(pattern.id)}
                />
              ))}
            </div>
          </section>

          {/* Test Patterns */}
          <section>
            <button
              onClick={() => setIsTestPatternsCollapsed(!isTestPatternsCollapsed)}
              className="flex items-center gap-2 mb-4 text-sm font-semibold text-stone-400 uppercase tracking-wider hover:text-stone-300 transition-colors"
            >
              <svg
                className={`w-4 h-4 transition-transform ${isTestPatternsCollapsed ? '' : 'rotate-90'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Test Patterns
              <span className="text-xs text-stone-600 normal-case">
                ({testPatterns.length})
              </span>
            </button>
            {!isTestPatternsCollapsed && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {testPatterns.map(pattern => (
                  <PatternCard
                    key={pattern.id}
                    pattern={pattern}
                    onClick={() => editPattern(pattern.id)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Custom Patterns */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider">
                Custom Patterns
              </h2>
              {customPatterns.length === 0 && (
                <span className="text-xs text-stone-600">
                  No custom patterns yet
                </span>
              )}
            </div>
            {customPatterns.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {customPatterns.map(pattern => (
                  <PatternCard
                    key={pattern.id}
                    pattern={pattern}
                    onClick={() => editPattern(pattern.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-stone-800 rounded-xl p-8 text-center">
                <p className="text-stone-500 mb-4">
                  Create custom patterns by duplicating built-in patterns or starting from scratch
                </p>
                <Button variant="secondary" onClick={createPattern}>
                  Create Your First Pattern
                </Button>
              </div>
            )}
          </section>
          
          {/* Panels */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider">
                Panels
              </h2>
              {panels.length === 0 && (
                <span className="text-xs text-stone-600">
                  No panels yet
                </span>
              )}
            </div>
            {panels.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {panels.map(panel => (
                  <PanelCard
                    key={panel.id}
                    panel={panel}
                    onClick={() => editPanel(panel.id)}
                    onDelete={() => deletePanel(panel.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-stone-800 rounded-xl p-8 text-center">
                <p className="text-stone-500 mb-4">
                  Panels are where you design your kumiko layouts using patterns
                </p>
                <Button variant="primary" onClick={createPanel}>
                  Create Your First Panel
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="px-8 py-4 border-t border-stone-800 text-xs text-stone-600 flex justify-between">
        <span>Kumiko Designer v0.1.0</span>
        <span>{patterns.length} patterns · {panels.length} panels</span>
      </footer>
    </div>
  );
}
