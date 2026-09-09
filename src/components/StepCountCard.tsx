import React, { useState, useEffect } from 'react';
import { Flame, Navigation, TrendingUp } from 'lucide-react';

interface StepCountCardProps {
  initialSteps?: number;
}

export const StepCountCard: React.FC<StepCountCardProps> = ({ initialSteps = 7166 }) => {
  const [steps, setSteps] = useState(6670);
  const targetSteps = 10000;

  // Animate initial count up to 7,166
  useEffect(() => {
    let start = 6670;
    const end = initialSteps;
    const duration = 1200;
    const startTime = performance.now();

    const animateSteps = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (end - start) * ease);
      setSteps(current);

      if (progress < 1) {
        requestAnimationFrame(animateSteps);
      }
    };

    const timer = setTimeout(() => {
      requestAnimationFrame(animateSteps);
    }, 400);

    return () => clearTimeout(timer);
  }, [initialSteps]);

  const progressPercent = Math.min(100, Math.round((steps / targetSteps) * 100));
  const distanceKm = (steps * 0.00076).toFixed(1);
  const caloriesBurned = Math.round(steps * 0.042);

  return (
    <div
      id="step-count-card"
      className="glass-card rounded-[22px] p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:shadow-xl w-full"
    >
      {/* Background Subtle Wave SVG Trend Line in Deep Biology tones */}
      <div className="absolute inset-0 pointer-events-none opacity-30 overflow-hidden flex items-end">
        <svg
          viewBox="0 0 400 120"
          className="w-full h-24 text-[#7FA894] fill-current"
          preserveAspectRatio="none"
        >
          <path
            d="M0,60 C60,20 120,90 180,40 C240,0 300,70 360,30 L400,50 L400,120 L0,120 Z"
            className="fill-[#7FA894]/10"
          />
          <path
            d="M0,60 C60,20 120,90 180,40 C240,0 300,70 360,30 L400,50"
            fill="none"
            stroke="#E8B04B"
            strokeWidth="2.2"
            strokeDasharray="4 4"
          />
        </svg>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-bold text-[#F5F1E8] tracking-tight font-['Fraunces',serif]">
            Step Count
          </h2>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-bold text-[#7FA894] bg-[#7FA894]/15 border border-[#7FA894]/30 px-2 py-0.5 rounded-full font-['IBM_Plex_Mono',monospace]">
          <TrendingUp className="w-3 h-3 text-[#7FA894]" />
          <span>+12%</span>
        </div>
      </div>

      {/* Main Content: Numbers Left, 3D Running Shoe Right */}
      <div className="grid grid-cols-12 gap-2 items-center my-3 z-10">
        {/* Left: Step Numbers & Metrics */}
        <div className="col-span-6 sm:col-span-7 flex flex-col">
          <div className="text-2xl sm:text-3xl font-bold text-[#F5F1E8] tracking-tight font-['Fraunces',serif] leading-tight">
            {steps.toLocaleString()}
          </div>
          <span className="text-xs font-semibold text-[#7FA894] font-['IBM_Plex_Mono',monospace] mt-0.5">
            Today's Steps
          </span>

          {/* Mini info pills */}
          <div className="flex items-center gap-3 mt-3 text-[11px] text-[#F5F1E8] font-medium font-['IBM_Plex_Mono',monospace]">
            <span className="flex items-center gap-1 bg-[#0B1613]/60 px-2 py-1 rounded-lg border border-[#7FA894]/20">
              <Flame className="w-3.5 h-3.5 text-[#E8B04B]" />
              {caloriesBurned} kcal
            </span>
            <span className="flex items-center gap-1 bg-[#0B1613]/60 px-2 py-1 rounded-lg border border-[#7FA894]/20">
              <Navigation className="w-3.5 h-3.5 text-[#7FA894]" />
              {distanceKm} km
            </span>
          </div>
        </div>

        {/* Right: 3D Translucent Running Shoe Illustration with Deep Biology Gradients */}
        <div className="col-span-6 sm:col-span-5 flex items-center justify-center relative">
          <div className="relative w-28 h-20 sm:w-32 sm:h-24 flex items-center justify-center">
            {/* Ambient Radial Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#7FA894]/20 to-[#E8B04B]/20 rounded-full blur-lg" />

            {/* Stylized 3D Translucent Running Sneaker Graphic */}
            <svg
              viewBox="0 0 160 100"
              className="w-full h-full drop-shadow-md z-10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Sole Outer Air Cushion */}
              <path
                d="M15 75 Q40 82 85 80 Q130 78 150 68 Q148 60 135 60 Q95 62 60 63 Q30 63 15 75 Z"
                fill="url(#soleGlow)"
                opacity="0.9"
              />
              {/* Midsole Layer */}
              <path
                d="M20 70 Q45 74 90 73 Q130 71 142 62 Q130 55 110 55 Q70 56 40 58 Q25 60 20 70 Z"
                fill="#16241F"
                stroke="#7FA894"
                strokeWidth="1"
                opacity="0.9"
              />
              {/* Upper Mesh Shoe Body */}
              <path
                d="M30 62 Q50 60 80 56 Q100 48 108 36 Q112 28 118 28 Q125 35 128 45 Q135 52 140 60 Q120 54 90 54 Q50 56 30 62 Z"
                fill="url(#upperGradient)"
              />
              {/* Translucent overlay accents */}
              <path
                d="M60 55 Q85 45 105 34 Q108 30 114 30 Q118 35 120 44 Q100 48 75 54 Z"
                fill="url(#meshGlow)"
                opacity="0.7"
              />
              {/* Laces & Eyelets */}
              <line x1="88" y1="46" x2="98" y2="40" stroke="#E8B04B" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="94" y1="50" x2="104" y2="44" stroke="#E8B04B" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="100" y1="54" x2="110" y2="48" stroke="#E8B04B" strokeWidth="2.5" strokeLinecap="round" />

              {/* Dynamic Gradients */}
              <defs>
                <linearGradient id="soleGlow" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#7FA894" />
                  <stop offset="50%" stopColor="#E8B04B" />
                  <stop offset="100%" stopColor="#C1553B" />
                </linearGradient>
                <linearGradient id="upperGradient" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stopColor="#16241F" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#7FA894" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#E8B04B" stopOpacity="0.95" />
                </linearGradient>
                <linearGradient id="meshGlow" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#F5F1E8" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#7FA894" stopOpacity="0.4" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      {/* Bottom: Progress Bar towards 10k Goal */}
      <div className="z-10 mt-1">
        <div className="flex items-center justify-between text-[11px] font-semibold text-[#7FA894] font-['IBM_Plex_Mono',monospace] mb-1">
          <span>Daily Goal</span>
          <span>{progressPercent}% (10,000)</span>
        </div>
        <div className="w-full h-2 rounded-full bg-[#0B1613] border border-[#7FA894]/20 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#7FA894] to-[#E8B04B] transition-all duration-700"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
