import React, { useState } from 'react';
import { Organ3DCanvas } from './Organ3DCanvas';
import { VitalsGrid } from './VitalsGrid';
import { OrganType, VitalMetrics } from '../types';
import {
  Heart,
  Brain,
  Wind,
  Layers,
  CircleDot,
  Flame,
  Activity,
  Sliders,
} from 'lucide-react';

interface HealthOverviewPanelProps {
  vitals: VitalMetrics;
  onHeartRateChange: (bpm: number) => void;
  onOpenMetricModal?: (metricName: string) => void;
}

export const HealthOverviewPanel: React.FC<HealthOverviewPanelProps> = ({
  vitals,
  onHeartRateChange,
  onOpenMetricModal,
}) => {
  const [activeOrgan, setActiveOrgan] = useState<OrganType>('heart');
  const [showHeartRateAdjuster, setShowHeartRateAdjuster] = useState(false);

  const organsList: { id: OrganType; label: string; icon: string }[] = [
    { id: 'lungs', label: 'Lungs', icon: '🫁' },
    { id: 'brain', label: 'Brain', icon: '🧠' },
    { id: 'heart', label: 'Heart', icon: '🫀' },
    { id: 'kidneys', label: 'Kidneys', icon: '🫘' },
    { id: 'liver', label: 'Liver', icon: '🩸' },
    { id: 'stomach', label: 'Stomach', icon: '🫃' },
  ];

  return (
    <div
      id="health-overview-panel"
      className="glass-card rounded-[22px] p-5 sm:p-6 transition-all duration-300 hover:shadow-xl relative overflow-hidden"
    >
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#7FA894]/20">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-[#F5F1E8] tracking-tight font-['Fraunces',serif]">
              Health Overview
            </h2>
            <span className="text-[10px] font-semibold text-[#7FA894] bg-[#7FA894]/15 border border-[#7FA894]/30 px-2 py-0.5 rounded-full font-['IBM_Plex_Mono',monospace]">
              Deep Biology Telemetry
            </span>
          </div>
          <p className="text-xs text-[#7FA894] font-medium mt-0.5 font-['IBM_Plex_Sans',sans-serif]">
            Real-time biometric telemetry and 3D organ visualization
          </p>
        </div>

        {/* Anatomical Quick Selector (Top Right of Panel) */}
        <div
          id="anatomical-quick-selector"
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1"
        >
          {organsList.map((organ) => {
            const isActive = activeOrgan === organ.id;
            return (
              <button
                key={organ.id}
                id={`organ-pill-${organ.id}`}
                onClick={() => setActiveOrgan(organ.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer shrink-0 font-['IBM_Plex_Mono',monospace] ${
                  isActive
                    ? 'bg-[#E8B04B] text-[#0B1613] shadow-sm shadow-[#E8B04B]/30 ring-1 ring-[#E8B04B]'
                    : 'bg-[#0B1613]/70 hover:bg-[#0B1613] text-[#7FA894] hover:text-[#F5F1E8] border border-[#7FA894]/20'
                }`}
              >
                <span>{organ.icon}</span>
                <span>{organ.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Left Micro-Nav + Center 3D Organ + Right Vitals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-4">
        {/* Left Side: Micro-Nav + 3D Organ Center (7 Columns on desktop) */}
        <div className="lg:col-span-6 xl:col-span-7 flex items-center gap-3 sm:gap-4 relative">
          {/* Icon Selection Sidebar (Left of Heart/Organ) */}
          <div
            id="organ-sidebar-nav"
            className="flex flex-col items-center gap-2 p-1.5 bg-[#0B1613]/80 backdrop-blur-md rounded-2xl border border-[#7FA894]/25 shadow-2xs z-20 shrink-0"
          >
            <button
              id="sidebar-organ-heart"
              onClick={() => setActiveOrgan('heart')}
              title="Heart"
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                activeOrgan === 'heart'
                  ? 'bg-[#C1553B] text-[#F5F1E8] shadow-sm shadow-[#C1553B]/30'
                  : 'text-[#7FA894] hover:bg-[#16241F] hover:text-[#F5F1E8]'
              }`}
            >
              <Heart className="w-4 h-4" />
            </button>

            <button
              id="sidebar-organ-brain"
              onClick={() => setActiveOrgan('brain')}
              title="Brain"
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                activeOrgan === 'brain'
                  ? 'bg-[#E8B04B] text-[#0B1613] shadow-sm shadow-[#E8B04B]/30'
                  : 'text-[#7FA894] hover:bg-[#16241F] hover:text-[#F5F1E8]'
              }`}
            >
              <Brain className="w-4 h-4" />
            </button>

            <button
              id="sidebar-organ-lungs"
              onClick={() => setActiveOrgan('lungs')}
              title="Lungs"
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                activeOrgan === 'lungs'
                  ? 'bg-[#7FA894] text-[#0B1613] shadow-sm shadow-[#7FA894]/30'
                  : 'text-[#7FA894] hover:bg-[#16241F] hover:text-[#F5F1E8]'
              }`}
            >
              <Wind className="w-4 h-4" />
            </button>

            <button
              id="sidebar-organ-stomach"
              onClick={() => setActiveOrgan('stomach')}
              title="Stomach"
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                activeOrgan === 'stomach'
                  ? 'bg-[#E8B04B] text-[#0B1613] shadow-sm shadow-[#E8B04B]/30'
                  : 'text-[#7FA894] hover:bg-[#16241F] hover:text-[#F5F1E8]'
              }`}
            >
              <Layers className="w-4 h-4" />
            </button>

            <button
              id="sidebar-organ-kidneys"
              onClick={() => setActiveOrgan('kidneys')}
              title="Kidneys"
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                activeOrgan === 'kidneys'
                  ? 'bg-[#C1553B] text-[#F5F1E8] shadow-sm shadow-[#C1553B]/30'
                  : 'text-[#7FA894] hover:bg-[#16241F] hover:text-[#F5F1E8]'
              }`}
            >
              <CircleDot className="w-4 h-4" />
            </button>

            <button
              id="sidebar-organ-liver"
              onClick={() => setActiveOrgan('liver')}
              title="Liver"
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                activeOrgan === 'liver'
                  ? 'bg-[#C1553B] text-[#F5F1E8] shadow-sm shadow-[#C1553B]/30'
                  : 'text-[#7FA894] hover:bg-[#16241F] hover:text-[#F5F1E8]'
              }`}
            >
              <Flame className="w-4 h-4" />
            </button>

            {/* Quick Heart Rate Modulation Button */}
            <div className="pt-2 border-t border-[#7FA894]/20 w-full flex justify-center">
              <button
                id="btn-adjust-bpm"
                onClick={() => setShowHeartRateAdjuster(!showHeartRateAdjuster)}
                title="Adjust Heart Rate"
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  showHeartRateAdjuster
                    ? 'bg-[#E8B04B] text-[#0B1613]'
                    : 'text-[#7FA894] hover:text-[#E8B04B] hover:bg-[#16241F]'
                }`}
              >
                <Sliders className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Center 3D Organ Canvas */}
          <div className="flex-1 relative flex items-center justify-center min-h-[300px]">
            <Organ3DCanvas activeOrgan={activeOrgan} heartRate={vitals.heartRate} />

            {/* Interactive Heart Rate Adjuster Slider Popover */}
            {showHeartRateAdjuster && (
              <div
                id="bpm-slider-popover"
                className="absolute top-2 right-2 bg-[#16241F]/95 backdrop-blur-md p-3 rounded-2xl border border-[#7FA894]/30 shadow-xl z-30 w-52 animate-in fade-in"
              >
                <div className="flex items-center justify-between mb-1 text-xs font-bold text-[#F5F1E8] font-['IBM_Plex_Mono',monospace]">
                  <span>Pulse Simulator</span>
                  <span className="text-[#E8B04B] font-extrabold">{vitals.heartRate} bpm</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="160"
                  value={vitals.heartRate}
                  onChange={(e) => onHeartRateChange(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#0B1613] rounded-lg appearance-none cursor-pointer accent-[#E8B04B]"
                />
                <div className="flex justify-between text-[9px] text-[#7FA894] font-['IBM_Plex_Mono',monospace] mt-1">
                  <span>60 (Rest)</span>
                  <span>120</span>
                  <span>160 (Cardio)</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: 2x2 Vital Metrics Grid (5 Columns on desktop) */}
        <div className="lg:col-span-6 xl:col-span-5">
          <VitalsGrid
            vitals={vitals}
            onHeartRateChange={onHeartRateChange}
            onOpenMetricModal={onOpenMetricModal}
          />
        </div>
      </div>
    </div>
  );
};
