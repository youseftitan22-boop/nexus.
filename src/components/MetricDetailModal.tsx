import React from 'react';
import { X, Info } from 'lucide-react';
import { VitalMetrics } from '../types';

interface MetricDetailModalProps {
  metricName: string | null;
  vitals: VitalMetrics;
  onClose: () => void;
  onUpdateVitals?: (newVitals: Partial<VitalMetrics>) => void;
}

export const MetricDetailModal: React.FC<MetricDetailModalProps> = ({
  metricName,
  vitals,
  onClose,
  onUpdateVitals,
}) => {
  if (!metricName) return null;

  const renderMetricContent = () => {
    switch (metricName) {
      case 'Blood Sugar':
        return (
          <div className="space-y-4 font-['IBM_Plex_Sans',sans-serif]">
            <div className="flex items-center justify-between p-4 bg-[#0B1613]/80 rounded-2xl border border-[#7FA894]/25">
              <div>
                <div className="text-xs font-semibold text-[#7FA894] font-['IBM_Plex_Mono',monospace]">Fasting Glucose Level</div>
                <div className="text-3xl font-bold text-[#F5F1E8] font-['Fraunces',serif]">
                  {vitals.bloodSugar} <span className="text-sm font-normal text-[#7FA894] font-['IBM_Plex_Mono',monospace]">mg/dL</span>
                </div>
              </div>
              <span className="px-3 py-1 bg-[#7FA894]/20 text-[#7FA894] text-xs font-bold rounded-full border border-[#7FA894]/30 font-['IBM_Plex_Mono',monospace]">
                Normal (70-99 mg/dL)
              </span>
            </div>
            <p className="text-xs text-[#7FA894] leading-relaxed">
              Your fasting blood glucose level is in the optimal physiological range. Hemoglobin A1c projection is stable at 5.2%.
            </p>
            <div className="p-3 bg-[#0B1613]/60 rounded-xl border border-[#7FA894]/20 text-xs space-y-1 text-[#7FA894] font-['IBM_Plex_Mono',monospace]">
              <div className="flex justify-between font-medium"><span>Pre-prandial target:</span> <span className="text-[#F5F1E8]">80-130 mg/dL</span></div>
              <div className="flex justify-between font-medium"><span>Post-prandial target:</span> <span className="text-[#F5F1E8]">&lt; 140 mg/dL</span></div>
            </div>
          </div>
        );
      case 'Blood Status':
        return (
          <div className="space-y-4 font-['IBM_Plex_Sans',sans-serif]">
            <div className="flex items-center justify-between p-4 bg-[#0B1613]/80 rounded-2xl border border-[#7FA894]/25">
              <div>
                <div className="text-xs font-semibold text-[#7FA894] font-['IBM_Plex_Mono',monospace]">Oxygen Saturation (SpO2)</div>
                <div className="text-3xl font-bold text-[#F5F1E8] font-['Fraunces',serif]">
                  {vitals.bloodStatusMin}-{vitals.bloodStatusMax}%
                </div>
              </div>
              <span className="px-3 py-1 bg-[#7FA894]/20 text-[#7FA894] text-xs font-bold rounded-full border border-[#7FA894]/30 font-['IBM_Plex_Mono',monospace]">
                Healthy Hemoglobin
              </span>
            </div>
            <p className="text-xs text-[#7FA894] leading-relaxed">
              Peripheral capillary oxygen saturation indicates excellent arterial oxygen delivery and lung ventilation capacity.
            </p>
          </div>
        );
      case 'Heart Rate':
        return (
          <div className="space-y-4 font-['IBM_Plex_Sans',sans-serif]">
            <div className="flex items-center justify-between p-4 bg-[#0B1613]/80 rounded-2xl border border-[#7FA894]/25">
              <div>
                <div className="text-xs font-semibold text-[#7FA894] font-['IBM_Plex_Mono',monospace]">Current Heart Rate Telemetry</div>
                <div className="text-3xl font-bold text-[#F5F1E8] font-['Fraunces',serif]">
                  {vitals.heartRate} <span className="text-sm font-normal text-[#7FA894] font-['IBM_Plex_Mono',monospace]">bpm</span>
                </div>
              </div>
              <span className="px-3 py-1 bg-[#C1553B]/20 text-[#C1553B] text-xs font-bold rounded-full border border-[#C1553B]/30 font-['IBM_Plex_Mono',monospace]">
                Active Cardio Rhythm
              </span>
            </div>
            <div>
              <label className="text-xs font-bold text-[#F5F1E8] block mb-1 font-['IBM_Plex_Mono',monospace]">
                Simulate Pulse (Modulate 3D Heart): {vitals.heartRate} bpm
              </label>
              <input
                type="range"
                min="50"
                max="160"
                value={vitals.heartRate}
                onChange={(e) => onUpdateVitals?.({ heartRate: Number(e.target.value) })}
                className="w-full h-2 bg-[#0B1613] rounded-lg appearance-none cursor-pointer accent-[#E8B04B]"
              />
            </div>
          </div>
        );
      case 'Blood Pressure':
        return (
          <div className="space-y-4 font-['IBM_Plex_Sans',sans-serif]">
            <div className="flex items-center justify-between p-4 bg-[#0B1613]/80 rounded-2xl border border-[#7FA894]/25">
              <div>
                <div className="text-xs font-semibold text-[#7FA894] font-['IBM_Plex_Mono',monospace]">Arterial Blood Pressure</div>
                <div className="text-3xl font-bold text-[#F5F1E8] font-['Fraunces',serif]">
                  {vitals.bloodPressureSys}/{vitals.bloodPressureDia} <span className="text-sm font-normal text-[#7FA894] font-['IBM_Plex_Mono',monospace]">mmHg</span>
                </div>
              </div>
              <span className="px-3 py-1 bg-[#7FA894]/20 text-[#7FA894] text-xs font-bold rounded-full border border-[#7FA894]/30 font-['IBM_Plex_Mono',monospace]">
                Optimal
              </span>
            </div>
            <p className="text-xs text-[#7FA894] leading-relaxed">
              Systolic pressure is 80 mmHg and Diastolic pressure is 120 mmHg. Your cardiovascular elasticity and vascular resistance are within ideal parameters.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      id="metric-detail-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1613]/85 backdrop-blur-md animate-in fade-in"
    >
      <div
        id="metric-detail-card"
        className="bg-[#16241F] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#7FA894]/30 relative animate-in zoom-in-95"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#7FA894]/20">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-[#E8B04B]" />
            <h3 className="text-base font-bold text-[#F5F1E8] font-['Fraunces',serif]">{metricName} Diagnostic Report</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#0B1613] hover:bg-[#0B1613]/80 flex items-center justify-center text-[#7FA894] hover:text-[#F5F1E8] border border-[#7FA894]/20 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="my-4">{renderMetricContent()}</div>

        <div className="flex justify-end pt-2 font-['IBM_Plex_Mono',monospace]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold bg-[#E8B04B] hover:bg-[#E8B04B]/90 text-[#0B1613] rounded-xl cursor-pointer shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
