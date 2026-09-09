import * as THREE from 'three';
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
 * Strict regex/keyword mapping for anatomical mesh categorization.
 * Ensures skeletal, muscular, organs, vascular, and skin meshes are uniquely identified.
 */
export function getMeshCategory(meshName: string = ''): string {
  const name = (meshName || '').toLowerCase();
  if (name.match(/bone|rib|skull|spine|femur|clavicle|skelet|joint|vertebra/)) return 'skeletal';
  if (name.match(/muscle|musc|bicep|pectoral|deltoid|glute|tendon|flexor/)) return 'muscular';
  if (name.match(/heart|lung|liver|stomach|kidney|brain|organ|intestine|viscera/)) return 'organs';
  if (name.match(/vein|artery|vascular|vessel|aorta/)) return 'vascular';
  if (name.match(/skin|dermis|integument|surface/)) return 'skin';
  return 'other';
}

/**
 * Strict Layer Isolation Pass:
 * Before applying any active layer filter, traverse the scene and explicitly set
 * node.visible = false on every single mesh in the model (unless 'Full body' is selected).
 */
export function switchAnatomicalLayer(selectedLayer: string, customModel?: any) {
  if (typeof window !== 'undefined' && typeof (window as any).switchAnatomicalLayer === 'function' && !customModel) {
    (window as any).switchAnatomicalLayer(selectedLayer);
    return;
  }
  const target = (selectedLayer || '').toLowerCase().trim();
  const model = customModel || (typeof window !== 'undefined' && ((window as any).__THREE_MODEL__ || (window as any).sceneRef?.current));
  if (!model) return;

  // Hard Visibility Reset Pass
  if (target !== 'full body') {
    model.traverse?.((node: any) => {
      if (node?.isMesh) {
        node.visible = false;
      }
    });
  }

  model.traverse?.((node: any) => {
    if (node?.isMesh) {
      const mesh = node;
      const category = (mesh.userData?.category || getMeshCategory(mesh.name)).toLowerCase();
      if (target === 'full body') {
        mesh.visible = true;
      } else {
        // Strict equality check: ONLY visible if category matches target exactly
        mesh.visible = (category === target);
      }
    }
  });

  if (typeof (window as any)?.requestRender === 'function') {
    (window as any).requestRender();
  }
}

export const setActiveAnatomicalLayer = switchAnatomicalLayer;

// =========================================================================
// BIOMETRIC STRAIN DATA MODEL & HEATMAP COLOR INTERPOLATION
// =========================================================================
export const biometricData: Record<string, number> = {
  pectorals: 85,  // High strain -> Red
  quadriceps: 40, // Moderate fatigue -> Yellow
  biceps: 10,     // Recovered -> Green
  abs: 0          // Baseline -> Normal tissue material
};

export function getHeatmapColor(score: number): THREE.Color {
  const normalized = Math.min(Math.max(score, 0), 100) / 100;
  const color = new THREE.Color();
  if (normalized < 0.5) {
    // Green to Yellow
    color.lerpColors(new THREE.Color(0x22c55e), new THREE.Color(0xeab308), normalized * 2);
  } else {
    // Yellow to Red
    color.lerpColors(new THREE.Color(0xeab308), new THREE.Color(0xef4444), (normalized - 0.5) * 2);
  }
  return color;
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
      switchAnatomicalLayer?: (selectedLayer: string, customModel?: any) => void;
      setActiveAnatomicalLayer?: (targetCategory: string) => void;
      biometricData?: typeof biometricData;
      getHeatmapColor?: typeof getHeatmapColor;
      applyBiometricHeatmap?: (data?: Record<string, number>) => void;
      resetHeatmap?: () => void;
      requestRender?: () => void;
    };
    switchAnatomicalLayer?: (selectedLayer: string, customModel?: any) => void;
    setActiveAnatomicalLayer?: (targetCategory: string) => void;
    getMeshCategory?: typeof getMeshCategory;
    biometricData?: typeof biometricData;
    getHeatmapColor?: typeof getHeatmapColor;
    applyBiometricHeatmap?: (data?: Record<string, number>) => void;
    resetHeatmap?: () => void;
    requestRender?: () => void;
  }
}

if (typeof window !== 'undefined') {
  window.getMeshCategory = getMeshCategory;
  window.biometricData = biometricData;
  window.getHeatmapColor = getHeatmapColor;
  window.switchAnatomicalLayer = switchAnatomicalLayer;
  window.setActiveAnatomicalLayer = switchAnatomicalLayer;
  window.NexusEngine = {
    RANKS,
    computeRank,
    pointsFor,
    computeNIS,
    webglConfig: NEXUS_WEBGL_CONFIG,
    getDracoLoader,
    getOptimizedGLTFLoader,
    getMeshCategory,
    switchAnatomicalLayer,
    setActiveAnatomicalLayer: switchAnatomicalLayer,
    biometricData,
    getHeatmapColor,
    applyBiometricHeatmap: (data) => (window as any).applyBiometricHeatmap?.(data),
    resetHeatmap: () => (window as any).resetHeatmap?.(),
    requestRender: () => (window as any).requestRender?.()
  };
}
