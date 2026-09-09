import React, { useState } from 'react';
import {
  X,
  TrendingUp,
  Activity,
  Network,
  Moon,
  Flame,
  Heart,
  Zap,
  Sparkles,
  ArrowRight,
  Info,
  Layers
} from 'lucide-react';
import { BiometricCorrelation } from '../types';

interface CorrelationEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_CORRELATIONS: BiometricCorrelation[] = [
  {
    nodeA: 'Sleep Recovery',
    nodeB: 'Movement Technique',
    coefficient: 0.74,
    sampleCount: 14,
    description: 'Strong positive relationship between sleep duration (>7h) and squat depth stability.',
    insight: 'On days when Sleep score exceeds 60, your verified Movement technique averages 89% vs 68% after short nights.',
    impactTier: 'high'
  },
  {
    nodeA: 'HRV Vagal Tone',
    nodeB: 'Daily Readiness',
    coefficient: 0.82,
    sampleCount: 14,
    description: 'High cardiovascular autonomic flexibility correlates directly with readiness scores.',
    insight: 'Elevated morning HRV (>65ms) strongly predicts higher resilience against neuro-stress during intense afternoons.',
    impactTier: 'high'
  },
  {
    nodeA: 'Step Volume',
    nodeB: 'Neuro-Stress Load',
    coefficient: -0.58,
    sampleCount: 14,
    description: 'Inverse correlation: Walking >8,000 steps moderates evening cortisol spikes.',
    insight: 'Consistent afternoon movement breaks down circulating cortisol and drops reported stress by 18 points.',
    impactTier: 'moderate'
  },
  {
    nodeA: 'Morning Light',
    nodeB: 'Sleep Latency',
    coefficient: -0.66,
    sampleCount: 14,
    description: 'Morning sunlight exposure reduces time-to-sleep onset by 22 minutes.',
    insight: 'Anchoring 15 minutes of early lux advances melatonin timing, stabilizing nocturnal heart rate dips.',
    impactTier: 'moderate'
  }
];

export const CorrelationEngineModal: React.FC<CorrelationEngineModalProps> = ({
  isOpen,
  onClose
}) => {
  const [selectedCorrelation, setSelectedCorrelation] = useState<BiometricCorrelation>(DEFAULT_CORRELATIONS[0]);

  if (!isOpen) return null;

  return (
    <div
      id="correlation-modal-scrim"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-[#0B1613]/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        id="correlation-modal"
        className="w-full max-w-2xl max-h-[92vh] bg-[#16241F] border border-[#7FA894]/30 rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-300"
      >
        {/* Header Strip */}
        <div className="flex items-center justify-between p-5 border-b border-[#7FA894]/20 bg-[#0B1613]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0B1613] border border-[#7FA894]/30 flex items-center justify-center text-[#E8B04B]">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#E8B04B] uppercase tracking-wider font-['IBM_Plex_Mono',monospace]">
                Causal Telemetry Analysis
              </span>
              <h2 className="text-xl font-bold text-[#F5F1E8] font-['Fraunces',serif]">
                Biometric Correlations
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="w-10 h-10 rounded-2xl bg-[#0B1613] hover:bg-[#0B1613]/80 border border-[#7FA894]/30 flex items-center justify-center text-[#7FA894] hover:text-[#F5F1E8] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs text-[#F5F1E8]">
          {/* Top Overview banner */}
          <div className="p-4 bg-[#0B1613]/70 rounded-2xl border border-[#7FA894]/20 flex items-start gap-3">
            <Info className="w-4 h-4 text-[#E8B04B] shrink-0 mt-0.5" />
            <p className="text-xs text-[#7FA894] leading-relaxed">
              Healthlog analyzes your on-device check-ins to compute real-time cross-domain Pearson correlations. This reveals how individual organs and habits trigger downstream effects on your overall web capacity.
            </p>
          </div>

          {/* Featured Dynamic Correlation Visualizer */}
          <div className="p-5 bg-[#0B1613]/80 rounded-2xl border border-[#E8B04B]/40 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#E8B04B] font-['IBM_Plex_Mono',monospace] uppercase">
                  Active Relationship
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8B04B]/20 text-[#E8B04B] font-['IBM_Plex_Mono',monospace]">
                r = {selectedCorrelation.coefficient > 0 ? `+${selectedCorrelation.coefficient}` : selectedCorrelation.coefficient}
              </span>
            </div>

            <div className="flex items-center justify-between text-base font-bold font-['Fraunces',serif] text-[#F5F1E8]">
              <span>{selectedCorrelation.nodeA}</span>
              <ArrowRight className="w-5 h-5 text-[#7FA894]" />
              <span>{selectedCorrelation.nodeB}</span>
            </div>

            {/* Scatter Simulation Points */}
            <div className="p-3 bg-[#16241F]/60 rounded-xl border border-[#7FA894]/15">
              <div className="flex justify-between text-[10px] text-[#7FA894] font-['IBM_Plex_Mono',monospace] mb-2">
                <span>{selectedCorrelation.nodeA} (X-Axis)</span>
                <span>{selectedCorrelation.nodeB} (Y-Axis)</span>
              </div>
              <div className="relative h-20 bg-[#0B1613] rounded-lg border border-[#7FA894]/20 flex items-center justify-around px-4">
                {[20, 35, 45, 60, 72, 85, 90].map((val, i) => {
                  const yPos = selectedCorrelation.coefficient > 0 ? val : 100 - val;
                  return (
                    <div
                      key={i}
                      className="w-2.5 h-2.5 rounded-full bg-[#E8B04B] ring-2 ring-[#0B1613] transition-all duration-500 shadow-sm shadow-[#E8B04B]/30"
                      style={{ transform: `translateY(${-((yPos / 100) * 40 - 20)}px)` }}
                      title={`Sample ${i + 1}: x=${val}, y=${yPos}`}
                    />
                  );
                })}
                {/* Trend line */}
                <div
                  className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-[#7FA894] to-[#E8B04B] opacity-60"
                  style={{
                    transform: `rotate(${selectedCorrelation.coefficient > 0 ? '-12deg' : '12deg'})`
                  }}
                />
              </div>
            </div>

            <div className="p-3 bg-[#16241F] rounded-xl border border-[#7FA894]/20">
              <span className="text-[10px] font-bold text-[#7FA894] uppercase font-['IBM_Plex_Mono',monospace] block">
                Causal Takeaway
              </span>
              <p className="text-xs text-[#F5F1E8] mt-1 leading-snug">
                {selectedCorrelation.insight}
              </p>
            </div>
          </div>

          {/* List of Cross-Domain Correlations */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-bold text-[#7FA894] uppercase font-['IBM_Plex_Mono',monospace] tracking-wider block">
              Discovered Biometric Loops (Tap to Inspect)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DEFAULT_CORRELATIONS.map((c, idx) => {
                const isSelected = selectedCorrelation.nodeA === c.nodeA && selectedCorrelation.nodeB === c.nodeB;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedCorrelation(c)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#E8B04B]/15 border-[#E8B04B] shadow-md shadow-[#E8B04B]/10'
                        : 'bg-[#0B1613]/70 border-[#7FA894]/20 hover:border-[#7FA894]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#F5F1E8] truncate">
                        {c.nodeA} × {c.nodeB}
                      </span>
                      <span className={`text-[10px] font-bold font-['IBM_Plex_Mono',monospace] ${
                        c.coefficient > 0 ? 'text-[#7FA894]' : 'text-[#E8B04B]'
                      }`}>
                        {c.coefficient > 0 ? `+${c.coefficient}` : c.coefficient}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#7FA894] mt-1 leading-tight line-clamp-2">
                      {c.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#7FA894]/20 bg-[#0B1613]/80 flex justify-end">
          <button
            onClick={onClose}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-[#E8B04B] text-[#0B1613] font-bold shadow-md shadow-[#E8B04B]/20 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
