import React from 'react';
import { Human3DCanvas } from './Human3DCanvas';
import { BmiStatus } from '../types';

interface BmiCardProps {
  heightCm: number;
  weightKg: number;
  onHeightChange: (height: number) => void;
  onWeightChange: (weight: number) => void;
}

export const BmiCard: React.FC<BmiCardProps> = ({
  heightCm,
  weightKg,
  onHeightChange,
  onWeightChange,
}) => {
  // Calculate BMI
  const heightM = heightCm / 100;
  const bmiValue = parseFloat((weightKg / (heightM * heightM)).toFixed(1));

  // Determine BMI category & colors according to Deep Biology tokens
  const getBmiStatus = (bmi: number): BmiStatus => {
    if (bmi < 18.5) {
      return {
        category: 'Underweight',
        color: '#7FA894',
        bgLight: 'bg-[#7FA894]/20',
        textDark: 'text-[#7FA894]',
      };
    } else if (bmi <= 24.9) {
      return {
        category: 'Normal Weight',
        color: '#7FA894',
        bgLight: 'bg-[#7FA894]/25',
        textDark: 'text-[#7FA894]',
      };
    } else if (bmi <= 29.9) {
      return {
        category: 'Overweight',
        color: '#E8B04B',
        bgLight: 'bg-[#E8B04B]/20',
        textDark: 'text-[#E8B04B]',
      };
    } else {
      return {
        category: 'Obese',
        color: '#C1553B',
        bgLight: 'bg-[#C1553B]/20',
        textDark: 'text-[#C1553B]',
      };
    }
  };

  const status = getBmiStatus(bmiValue);

  // Dynamic calculated measurements for callouts
  const baseChest = 44.5;
  const baseWaist = 34.0;
  const baseHip = 42.5;

  const chestIn = parseFloat((baseChest * (weightKg / 72) * 0.96 + (heightCm - 170) * 0.05).toFixed(1));
  const waistIn = parseFloat((baseWaist * (weightKg / 72) * 1.05 - (heightCm - 170) * 0.08).toFixed(1));
  const hipIn = parseFloat((baseHip * (weightKg / 72) * 0.98).toFixed(1));

  // Gauge position percentage (range 15 to 40)
  const clampedBmi = Math.max(15, Math.min(40, bmiValue));
  const gaugePercent = ((clampedBmi - 15) / (40 - 15)) * 100;

  return (
    <div
      id="bmi-calculator-card"
      className="glass-card rounded-[22px] p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:shadow-xl w-full"
    >
      {/* Top: Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base sm:text-lg font-bold text-[#F5F1E8] tracking-tight font-['Fraunces',serif]">
          BMI Calculator
        </h2>
        <span className="text-[11px] font-semibold text-[#7FA894] bg-[#0B1613]/70 border border-[#7FA894]/30 px-2.5 py-0.5 rounded-full font-['IBM_Plex_Mono',monospace]">
          Metric Units
        </span>
      </div>

      {/* Controls: Height & Weight Interactive Sliders + BMI Badge & Visual Scale */}
      <div className="space-y-4 mb-2">
        {/* Sliders Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Height Slider */}
          <div id="control-height" className="bg-[#0B1613]/60 rounded-xl p-3 border border-[#7FA894]/20">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-[#7FA894] font-['IBM_Plex_Mono',monospace] uppercase">Height</span>
              <span className="text-xs font-bold text-[#F5F1E8] bg-[#16241F] px-2 py-0.5 rounded-md border border-[#7FA894]/30 shadow-2xs font-['IBM_Plex_Mono',monospace]">
                {heightCm} <span className="text-[10px] text-[#7FA894]">cm</span>
              </span>
            </div>
            <input
              id="slider-height"
              type="range"
              min="130"
              max="210"
              value={heightCm}
              onChange={(e) => onHeightChange(Number(e.target.value))}
              className="w-full h-1.5 bg-[#16241F] rounded-lg appearance-none cursor-pointer accent-[#E8B04B] focus:outline-none"
            />
            {/* Ruler Ticks */}
            <div className="flex justify-between text-[9px] text-[#7FA894]/80 font-['IBM_Plex_Mono',monospace] mt-1 px-0.5">
              <span>130</span>
              <span>150</span>
              <span>170</span>
              <span>190</span>
              <span>210</span>
            </div>
          </div>

          {/* Weight Slider */}
          <div id="control-weight" className="bg-[#0B1613]/60 rounded-xl p-3 border border-[#7FA894]/20">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-[#7FA894] font-['IBM_Plex_Mono',monospace] uppercase">Weight</span>
              <span className="text-xs font-bold text-[#F5F1E8] bg-[#16241F] px-2 py-0.5 rounded-md border border-[#7FA894]/30 shadow-2xs font-['IBM_Plex_Mono',monospace]">
                {weightKg} <span className="text-[10px] text-[#7FA894]">kg</span>
              </span>
            </div>
            <input
              id="slider-weight"
              type="range"
              min="40"
              max="140"
              value={weightKg}
              onChange={(e) => onWeightChange(Number(e.target.value))}
              className="w-full h-1.5 bg-[#16241F] rounded-lg appearance-none cursor-pointer accent-[#E8B04B] focus:outline-none"
            />
            {/* Ruler Ticks */}
            <div className="flex justify-between text-[9px] text-[#7FA894]/80 font-['IBM_Plex_Mono',monospace] mt-1 px-0.5">
              <span>40</span>
              <span>65</span>
              <span>90</span>
              <span>115</span>
              <span>140</span>
            </div>
          </div>
        </div>

        {/* BMI Readout & Rainbow Scale Bar */}
        <div id="bmi-score-indicator" className="bg-[#0B1613]/70 rounded-xl p-3 border border-[#7FA894]/25 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-[11px] font-medium text-[#7FA894] leading-tight font-['IBM_Plex_Mono',monospace] uppercase">
                Body Mass Index (BMI)
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#F5F1E8] tracking-tight font-['Fraunces',serif]">
                {bmiValue}
              </div>
            </div>
            <div className={`px-2.5 py-1 rounded-full text-xs font-bold font-['IBM_Plex_Mono',monospace] border border-current/30 ${status.bgLight} ${status.textDark}`}>
              {status.category}
            </div>
          </div>

          {/* Deep Biology Gradient Gauge Bar (Lichen -> Marrow -> Rust) */}
          <div className="relative pt-2 pb-1">
            <div className="h-2 w-full rounded-full bg-gradient-to-r from-[#7FA894] via-[#E8B04B] to-[#C1553B] relative overflow-hidden" />

            {/* Dynamic Needle Pin Indicator */}
            <div
              className="absolute top-1.5 transform -translate-x-1/2 transition-all duration-300"
              style={{ left: `${gaugePercent}%` }}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-[#F5F1E8] border-2 border-[#0B1613] shadow-md" />
            </div>

            {/* Scale Marker Ticks */}
            <div className="flex justify-between text-[9px] font-semibold text-[#7FA894]/80 font-['IBM_Plex_Mono',monospace] mt-1 px-0.5">
              <span>15</span>
              <span>18.5</span>
              <span>25</span>
              <span>30</span>
              <span>40</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3D Anatomical Human Male Model Canvas with Dynamic Callouts */}
      <div className="mt-1 flex-1 flex flex-col justify-center">
        <Human3DCanvas
          heightCm={heightCm}
          weightKg={weightKg}
          chestIn={chestIn}
          waistIn={waistIn}
          hipIn={hipIn}
        />
      </div>
    </div>
  );
};
