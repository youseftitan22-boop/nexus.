import { getDracoLoader, getOptimizedGLTFLoader } from './dracoLoaderManager';

export interface RankTier {
  n: string;
  nis: number;
  logs: number;
  form?: boolean;
}

export interface RankInfo {
  tier: number;
  name: string;
  next: RankTier | null;
}

export interface UserMetrics {
  totalLogs?: number;
  formSessions?: number;
  streakDays?: number;
  lastActiveTs?: number;
}

export const RANKS: RankTier[] = [
  { n: 'Loose Thread', nis: 0, logs: 0 },
  { n: 'Woven', nis: 45, logs: 3 },
  { n: 'Load-Bearing', nis: 55, logs: 10 },
  { n: 'Keystone', nis: 65, logs: 25 },
  { n: 'Apex Web', nis: 75, logs: 60 }
];

export const TIER_GLYPHS = ['○', '◈', '✦', '⬡', '❖'];

export function computeNIS(p: number | number[] | Record<string, number>): number {
  if (typeof p === 'number') return Math.round(p);
  if (Array.isArray(p)) {
    if (!p.length) return 0;
    const sum = p.reduce((acc, v) => acc + (typeof v === 'number' ? v : 0), 0);
    return Math.round(sum / p.length);
  }
  if (typeof p === 'object' && p !== null) {
    const vals = Object.values(p).filter((v) => typeof v === 'number');
    if (!vals.length) return 0;
    const total = vals.reduce((acc, v) => acc + v, 0);
    return Math.round(total / vals.length);
  }
  return 61;
}

export function computeRank(p: number | number[] | Record<string, number>, m: UserMetrics): RankInfo {
  const nis = computeNIS(p);
  let i = 0;
  for (let k = 1; k < RANKS.length; k++) {
    if (nis >= RANKS[k].nis && (m.totalLogs || 0) >= RANKS[k].logs && (!RANKS[k].form || (m.formSessions || 0) >= 1)) {
      i = k;
    }
  }
  return { tier: i, name: RANKS[i].n, next: RANKS[i + 1] || null };
}

export function pointsFor(a: 'log' | 'firstOfDay' | 'weekly' | 'intake' | string, s: number): number {
  const b: Record<string, number> = { log: 10, firstOfDay: 5, weekly: 50, intake: 20 };
  const base = b[a] || 0;
  return Math.round(base * (1 + Math.min(s, 20) * 0.05));
}

export function computeLevel(xp: number): { level: number; progress: number; currentXp: number; nextLevelXp: number } {
  const level = Math.floor(Math.sqrt(xp / 50));
  const currentThreshold = Math.pow(level, 2) * 50;
  const nextThreshold = Math.pow(level + 1, 2) * 50;
  const diff = nextThreshold - currentThreshold;
  const progress = diff > 0 ? Math.min(100, Math.max(0, ((xp - currentThreshold) / diff) * 100)) : 100;

  return {
    level,
    progress: Math.round(progress),
    currentXp: xp - currentThreshold,
    nextLevelXp: diff
  };
}

export const NEXUS_WEBGL_CONFIG = {
  MAX_DPR: 1.0,
  FORCE_1X_DPR: true,
  MATERIAL_TYPE: 'MeshLambertMaterial',
  SMOOTH_SHADING: true,
  SHADOWS_ENABLED: false,
  POWER_PREFERENCE: 'high-performance',
  DRACO_DECODER_PATH: 'https://www.gstatic.com/draco/versioned/decoders/1.5.6/',
  DRACO_DECODER_TYPE: 'js',
  BATCHED_GEOMETRIES: true,
  THROTTLED_MARKER_UPDATES: true,
  DEMAND_DRIVEN_RENDERING: true,
  FRUSTUM_CULLING: true,
  TARGET_FPS: 60,
  TARGET_DRAW_CALLS: '<10',
  TARGET_IDLE_GPU_PERCENT: 0
};

/**
 * Classifies anatomical mesh node names into standardized anatomical layer categories.
 * Explicitly routes internal organ terms ('heart', 'liver', 'lung', 'stomach', 'kidney', 'gut', 'viscera', 'organ')
 * to 'organs' so no organ components are left categorized as 'other' or 'muscular'.
 */
export function getMeshCategory(rawName: string = ''): string {
  const name = (rawName || '').toLowerCase().trim();

  // 1. Internal organ terms explicitly routed to 'organs'
  if (
    name.includes('heart') ||
    name.includes('liver') ||
    name.includes('lung') ||
    name.includes('stomach') ||
    name.includes('kidney') ||
    name.includes('gut') ||
    name.includes('viscera') ||
    name.includes('organ') ||
    name.includes('brain') ||
    name.includes('cortex') ||
    name.includes('stem') ||
    name.includes('adrenal') ||
    name.includes('gallbladder') ||
    name.includes('parenchyma') ||
    name.includes('gastric')
  ) {
    return 'organs';
  }

  // 2. Vascular terms
  if (
    name.includes('vasc') ||
    name.includes('aorta') ||
    name.includes('arter') ||
    name.includes('vein') ||
    name.includes('vena') ||
    name.includes('vessel') ||
    name.includes('coronary') ||
    name.includes('capillar') ||
    name.includes('blood')
  ) {
    return 'vascular';
  }

  // 3. Skeletal terms
  if (
    name.includes('skelet') ||
    name.includes('bone') ||
    name.includes('rib') ||
    name.includes('spine') ||
    name.includes('vertebra') ||
    name.includes('cartilage') ||
    name.includes('trachea') ||
    name.includes('skull') ||
    name.includes('pelvi') ||
    name.includes('femur')
  ) {
    return 'skeletal';
  }

  // 4. Muscular terms
  if (
    name.includes('musc') ||
    name.includes('myo') ||
    name.includes('tendon') ||
    name.includes('bicep') ||
    name.includes('tricep') ||
    name.includes('deltoid') ||
    name.includes('pectoral') ||
    name.includes('glute')
  ) {
    return 'muscular';
  }

  // 5. Skin terms
  if (
    name.includes('skin') ||
    name.includes('dermis') ||
    name.includes('epidermis') ||
    name.includes('integument')
  ) {
    return 'skin';
  }

  return 'organs'; // Default fallback ensures no organ components are left categorized as 'other' or 'muscular'
}

declare global {
  interface Window {
    NexusEngine?: {
      RANKS: RankTier[];
      computeRank: typeof computeRank;
      pointsFor: typeof pointsFor;
      computeNIS: typeof computeNIS;
      webglConfig?: typeof NEXUS_WEBGL_CONFIG;
      getDracoLoader?: typeof getDracoLoader;
      getOptimizedGLTFLoader?: typeof getOptimizedGLTFLoader;
      getMeshCategory?: typeof getMeshCategory;
      setActiveAnatomicalLayer?: (targetCategory: string) => void;
    };
    setActiveAnatomicalLayer?: (targetCategory: string) => void;
    getMeshCategory?: typeof getMeshCategory;
  }
}

if (typeof window !== 'undefined') {
  window.getMeshCategory = getMeshCategory;
  window.NexusEngine = {
    RANKS,
    computeRank,
    pointsFor,
    computeNIS,
    webglConfig: NEXUS_WEBGL_CONFIG,
    getDracoLoader,
    getOptimizedGLTFLoader,
    getMeshCategory
  };
}
