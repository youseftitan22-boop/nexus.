import React from 'react';
import { Activity, Dumbbell, Sparkles, ChevronRight, CheckCircle2, Flame } from 'lucide-react';
import { FormSessionSummary } from '../types';

interface MovementCardProps {
  movementScore: number;
  onOpenFormCheck: () => void;
  hasRipple?: boolean;
  recentSessions: FormSessionSummary[];
}

export const MovementCard: React.FC<MovementCardProps> = ({
  movementScore,
  onOpenFormCheck,
  hasRipple = false,
  recentSessions
}) => {
  const latestSession = recentSessions[0];

  return (
    <div
      id="movement-playbook-card"
      className={`glass-card p-5 rounded-3xl border transition-all duration-500 relative overflow-hidden flex flex-col justify-between ${
        hasRipple
          ? 'border-[#E8B04B] ring-2 ring-[#E8B04B]/50 shadow-xl shadow-[#E8B04B]/20 animate-pulse'
          : 'border-[#7FA894]/20 hover:border-[#7FA894]/40'
      }`}
    >
      {/* Ripple background overlay */}
      {hasRipple && (
        <div className="absolute inset-0 bg-[#E8B04B]/10 pointer-events-none animate-ping duration-1000 opacity-40 rounded-3xl" />
      )}

      {/* Card Header */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0B1613] border border-[#7FA894]/25 flex items-center justify-center text-[#E8B04B]">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#E8B04B] uppercase tracking-wider font-['IBM_Plex_Mono',monospace]">
                Movement Playbook
              </span>
              <h3 className="text-sm font-bold text-[#F5F1E8] font-['Fraunces',serif]">
                Kinematic & Form Hub
              </h3>
            </div>
          </div>
          <span className="text-[11px] font-bold text-[#7FA894] bg-[#0B1613] px-2.5 py-1 rounded-full border border-[#7FA894]/25 font-['IBM_Plex_Mono',monospace]">
            AI Verified
          </span>
        </div>

        {/* Movement Score Indicator */}
        <div className="flex items-baseline justify-between p-3.5 bg-[#0B1613]/70 rounded-2xl border border-[#7FA894]/20 my-3">
          <div>
            <div className="text-[10px] text-[#7FA894] font-['IBM_Plex_Mono',monospace]">Movement Index</div>
            <div className="text-3xl font-bold text-[#F5F1E8] font-['Fraunces',serif] flex items-baseline gap-1">
              <span>{movementScore}</span>
              <span className="text-xs text-[#7FA894] font-normal font-['IBM_Plex_Mono',monospace]">/100</span>
            </div>
          </div>
          <div className="text-right font-['IBM_Plex_Mono',monospace] text-[11px]">
            <span className="text-[#7FA894] block">Calibration:</span>
            <span className="text-[#E8B04B] font-bold">40% Self • 60% Form</span>
          </div>
        </div>

        {/* Latest Form Check Status */}
        {latestSession ? (
          <div className="p-2.5 bg-[#16241F]/80 rounded-xl border border-[#7FA894]/20 text-xs font-['IBM_Plex_Mono',monospace] space-y-1 mb-3">
            <div className="flex items-center justify-between text-[#F5F1E8]">
              <span className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#7FA894]" />
                Latest {latestSession.exercise}
              </span>
              <span className="text-[#7FA894] font-bold">{latestSession.reps} reps</span>
            </div>
            <div className="flex justify-between text-[10px] text-[#7FA894]">
              <span>Technique: {latestSession.technique}%</span>
              <span>Objective: {latestSession.objectiveScore || 80} pts</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-[#7FA894] leading-relaxed mb-3 font-['IBM_Plex_Sans',sans-serif]">
            Real-time on-device squat analysis. Calibrate your kinematic accuracy with on-device computer vision.
          </p>
        )}
      </div>

      {/* CTA Button to Route #/form */}
      <button
        id="btn-launch-form-check"
        onClick={onOpenFormCheck}
        className="w-full min-h-[44px] py-2.5 px-4 bg-[#E8B04B] hover:bg-[#E8B04B]/90 text-[#0B1613] font-bold text-xs rounded-xl cursor-pointer shadow-sm transition-all flex items-center justify-center gap-2 font-['IBM_Plex_Mono',monospace] active:scale-98"
      >
        <Sparkles className="w-3.5 h-3.5 fill-current" />
        <span>Launch Form Check Coach</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
