import React, { useEffect, useRef } from 'react';
import { Activity, Droplets, Heart, Gauge, ArrowUpRight } from 'lucide-react';
import { VitalMetrics } from '../types';

interface VitalsGridProps {
  vitals: VitalMetrics;
  onHeartRateChange?: (bpm: number) => void;
  onOpenMetricModal?: (metricName: string) => void;
}

export const VitalsGrid: React.FC<VitalsGridProps> = ({
  vitals,
  onHeartRateChange,
  onOpenMetricModal,
}) => {
  const ecgCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Live real-time ECG Pulse Wave Renderer in Deep Biology palette
  useEffect(() => {
    const canvas = ecgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let offset = 0;

    const width = canvas.width;
    const height = canvas.height;
    const midY = height / 2;

    const renderECG = () => {
      // Speed factor proportional to heartRate
      const speed = (vitals.heartRate / 75) * 1.6;
      offset = (offset + speed) % 180;

      ctx.clearRect(0, 0, width, height);

      // Grid background dots
      ctx.fillStyle = 'rgba(127, 168, 148, 0.15)';
      for (let x = 0; x < width; x += 16) {
        for (let y = 0; y < height; y += 16) {
          ctx.fillRect(x, y, 1.2, 1.2);
        }
      }

      // Draw ECG Line in Lichen tone
      ctx.beginPath();
      ctx.strokeStyle = '#7FA894';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let x = 0; x < width; x++) {
        const cyclePos = (x + offset) % 180;
        let y = midY;

        // P wave
        if (cyclePos > 25 && cyclePos < 45) {
          y -= Math.sin(((cyclePos - 25) / 20) * Math.PI) * 6;
        }
        // Q-R-S complex
        else if (cyclePos >= 55 && cyclePos < 62) {
          // Q dip
          y += 5;
        } else if (cyclePos >= 62 && cyclePos < 74) {
          // High R peak
          const rPos = (cyclePos - 62) / 12;
          y -= Math.sin(rPos * Math.PI) * 28;
        } else if (cyclePos >= 74 && cyclePos < 82) {
          // S dip
          y += 8;
        }
        // T wave
        else if (cyclePos > 100 && cyclePos < 135) {
          y -= Math.sin(((cyclePos - 100) / 35) * Math.PI) * 9;
        }

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Glowing pulse head in Marrow tone
      const leadX = (180 - offset) % width;
      ctx.beginPath();
      ctx.arc(leadX, midY, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = '#E8B04B';
      ctx.shadowColor = '#E8B04B';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(renderECG);
    };

    renderECG();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [vitals.heartRate]);

  return (
    <div id="vitals-metrics-grid" className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
      {/* 1. Blood Sugar Card */}
      <div
        id="widget-blood-sugar"
        onClick={() => onOpenMetricModal?.('Blood Sugar')}
        className="bg-[#0B1613]/70 hover:bg-[#0B1613]/90 rounded-2xl p-4 border border-[#7FA894]/20 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#E8B04B]/15 text-[#E8B04B] flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-[#F5F1E8]">Blood Sugar</span>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-[#7FA894]/60 group-hover:text-[#E8B04B] transition-colors" />
        </div>

        <div className="my-2.5">
          <div className="text-xl sm:text-2xl font-bold text-[#F5F1E8] font-['Fraunces',serif]">
            {vitals.bloodSugar}{' '}
            <span className="text-xs font-semibold text-[#7FA894] font-['IBM_Plex_Mono',monospace]">mg / dL</span>
          </div>
        </div>

        {/* Dynamic Wave Chart */}
        <div className="h-10 w-full relative">
          <svg viewBox="0 0 160 40" className="w-full h-full" preserveAspectRatio="none">
            <path
              d="M0,28 Q20,12 40,24 T80,18 T120,30 T160,16 L160,40 L0,40 Z"
              fill="rgba(232, 176, 75, 0.15)"
            />
            <path
              d="M0,28 Q20,12 40,24 T80,18 T120,30 T160,16"
              fill="none"
              stroke="#E8B04B"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* 2. Blood Status Card */}
      <div
        id="widget-blood-status"
        onClick={() => onOpenMetricModal?.('Blood Status')}
        className="bg-[#0B1613]/70 hover:bg-[#0B1613]/90 rounded-2xl p-4 border border-[#7FA894]/20 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#C1553B]/15 text-[#C1553B] flex items-center justify-center">
              <Droplets className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-[#F5F1E8]">Blood Status</span>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-[#7FA894]/60 group-hover:text-[#E8B04B] transition-colors" />
        </div>

        <div className="my-2.5">
          <div className="text-xl sm:text-2xl font-bold text-[#F5F1E8] font-['Fraunces',serif]">
            {vitals.bloodStatusMin}-{vitals.bloodStatusMax}
          </div>
          <span className="text-[10px] font-semibold text-[#7FA894] font-['IBM_Plex_Mono',monospace]">Oxygen Saturation Index</span>
        </div>

        {/* Dynamic Blood Droplet Graphic */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#7FA894]" />
            <span className="text-[11px] font-semibold text-[#7FA894] font-['IBM_Plex_Mono',monospace]">Optimal Range</span>
          </div>

          {/* Liquid droplet icon with animated glow */}
          <div className="relative flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-[#C1553B]/20 flex items-center justify-center">
              <div className="w-3.5 h-3.5 bg-[#C1553B] rounded-full animate-pulse shadow-sm shadow-[#C1553B]/50" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Heart Rate Card */}
      <div
        id="widget-heart-rate"
        onClick={() => onOpenMetricModal?.('Heart Rate')}
        className="bg-[#0B1613]/70 hover:bg-[#0B1613]/90 rounded-2xl p-4 border border-[#7FA894]/20 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#C1553B]/15 text-[#C1553B] flex items-center justify-center">
              <Heart className="w-4 h-4 fill-[#C1553B] text-[#C1553B] animate-pulse" />
            </div>
            <span className="text-xs font-bold text-[#F5F1E8]">Heart Rate</span>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-[#7FA894]/60 group-hover:text-[#E8B04B] transition-colors" />
        </div>

        <div className="my-1.5">
          <div className="text-xl sm:text-2xl font-bold text-[#F5F1E8] font-['Fraunces',serif]">
            {vitals.heartRate}{' '}
            <span className="text-xs font-semibold text-[#7FA894] font-['IBM_Plex_Mono',monospace]">bpm</span>
          </div>
        </div>

        {/* Live Running Electrocardiogram (ECG) Canvas in Deep Biology */}
        <div className="h-10 w-full rounded-lg bg-[#0B1613] border border-[#7FA894]/20 overflow-hidden relative">
          <canvas
            ref={ecgCanvasRef}
            width={240}
            height={40}
            className="w-full h-full block"
          />
        </div>
      </div>

      {/* 4. Blood Pressure Card */}
      <div
        id="widget-blood-pressure"
        onClick={() => onOpenMetricModal?.('Blood Pressure')}
        className="bg-[#0B1613]/70 hover:bg-[#0B1613]/90 rounded-2xl p-4 border border-[#7FA894]/20 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#7FA894]/15 text-[#7FA894] flex items-center justify-center">
              <Gauge className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-[#F5F1E8]">Blood Pressure</span>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-[#7FA894]/60 group-hover:text-[#E8B04B] transition-colors" />
        </div>

        <div className="my-1.5">
          <div className="text-xl sm:text-2xl font-bold text-[#F5F1E8] font-['Fraunces',serif]">
            {vitals.bloodPressureSys}/{vitals.bloodPressureDia}
          </div>
          <span className="text-[10px] font-semibold text-[#7FA894] font-['IBM_Plex_Mono',monospace]">mmHg (Systolic / Diastolic)</span>
        </div>

        {/* Dual Gauge Status Bar with Deep Biology color zones */}
        <div className="pt-1">
          <div className="w-full h-2 rounded-full bg-[#0B1613] flex overflow-hidden border border-[#7FA894]/20">
            <div className="w-1/3 h-full bg-[#7FA894]" />
            <div className="w-1/2 h-full bg-[#E8B04B]" />
            <div className="w-1/6 h-full bg-[#C1553B]" />
          </div>
          <div className="flex items-center justify-between text-[9px] font-semibold text-[#7FA894] font-['IBM_Plex_Mono',monospace] mt-1">
            <span>Low</span>
            <span className="text-[#E8B04B] font-bold">Optimal</span>
            <span className="text-[#C1553B]">High</span>
          </div>
        </div>
      </div>
    </div>
  );
};
