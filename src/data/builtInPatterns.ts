import { Pattern } from '../types';

export const builtInPatterns: Pattern[] = [
  {
    id: 'builtin-asanoha',
    name: 'Asanoha',
    description: 'Traditional hemp leaf pattern - three lines from corners meeting at center',
    tags: ['traditional', 'geometric'],
    created: Date.now(),
    modified: Date.now(),
    isBuiltIn: true,
    baseWeight: 0.8,
    cornerToCenter: {
      A: { weightMultiplier: 1.0, blockedBy: null, startSide: 'corner' },
      B: { weightMultiplier: 1.0, blockedBy: null, startSide: 'corner' },
      C: { weightMultiplier: 1.0, blockedBy: null, startSide: 'corner' },
    },
    edgeParallel: { BC: null, CA: null, AB: null },
    cornerArcs: { AB: null, BC: null, CA: null },
  },
  {
    id: 'builtin-goma',
    name: 'Goma',
    description: 'Sesame seed pattern - inner triangle formed by edge-parallel segments',
    tags: ['traditional', 'geometric'],
    created: Date.now(),
    modified: Date.now(),
    isBuiltIn: true,
    baseWeight: 0.8,
    cornerToCenter: { A: null, B: null, C: null },
    edgeParallel: {
      BC: { positionMode: 'from-edge', distance: 2.0, weightMultiplier: 1.0, isBlocker: false },
      CA: { positionMode: 'from-edge', distance: 2.0, weightMultiplier: 1.0, isBlocker: false },
      AB: { positionMode: 'from-edge', distance: 2.0, weightMultiplier: 1.0, isBlocker: false },
    },
    cornerArcs: { AB: null, BC: null, CA: null },
  },
  {
    id: 'builtin-sakura',
    name: 'Sakura',
    description: 'Cherry blossom pattern - thick segments near corners with center lines',
    tags: ['traditional', 'floral'],
    created: Date.now(),
    modified: Date.now(),
    isBuiltIn: true,
    baseWeight: 0.8,
    cornerToCenter: {
      A: { weightMultiplier: 1.0, blockedBy: 'edgeParallel', startSide: 'center' },
      B: { weightMultiplier: 1.0, blockedBy: 'edgeParallel', startSide: 'center' },
      C: { weightMultiplier: 1.0, blockedBy: 'edgeParallel', startSide: 'center' },
    },
    edgeParallel: {
      BC: { positionMode: 'from-corner', distance: 2.5, weightMultiplier: 1.5, isBlocker: true },
      CA: { positionMode: 'from-corner', distance: 2.5, weightMultiplier: 1.5, isBlocker: true },
      AB: { positionMode: 'from-corner', distance: 2.5, weightMultiplier: 1.5, isBlocker: true },
    },
    cornerArcs: { AB: null, BC: null, CA: null },
  },
  {
    id: 'builtin-shippo',
    name: 'Shippo',
    description: 'Seven treasures pattern - inner triangle with curved arcs',
    tags: ['traditional', 'curved'],
    created: Date.now(),
    modified: Date.now(),
    isBuiltIn: true,
    baseWeight: 0.8,
    cornerToCenter: { A: null, B: null, C: null },
      edgeParallel: { BC: null, CA: null, AB: null },
    cornerArcs: {
      AB: { radius: 15.0, weightMultiplier: 1.0 },
      BC: { radius: 15.0, weightMultiplier: 1.0 },
      CA: { radius: 15.0, weightMultiplier: 1.0 },
    },
  },
];

/**
 * Create a new empty pattern with default values
 */
export function createEmptyPattern(id: string, name: string = 'New Pattern'): Pattern {
  return {
    id,
    name,
    description: '',
    tags: [],
    created: Date.now(),
    modified: Date.now(),
    isBuiltIn: false,
    baseWeight: 0.8,
    cornerToCenter: { A: null, B: null, C: null },
    edgeParallel: { BC: null, CA: null, AB: null },
    cornerArcs: { AB: null, BC: null, CA: null },
  };
}

/**
 * Duplicate a pattern with a new ID and name
 */
export function duplicatePattern(source: Pattern, newId: string): Pattern {
  return {
    ...JSON.parse(JSON.stringify(source)),
    id: newId,
    name: `${source.name} (copy)`,
    isBuiltIn: false,
    created: Date.now(),
    modified: Date.now(),
  };
}
