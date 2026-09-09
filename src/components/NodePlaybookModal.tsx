import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Moon,
  Sparkles,
  Zap,
  Activity,
  Heart,
  Flame,
  Clock,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Volume2,
  VolumeX,
  Droplets,
  Sun,
  ShieldAlert,
  ArrowRight,
  Target
} from 'lucide-react';
import { bioAudio } from '../utils/audioFeedback';

interface NodePlaybookModalProps {
  nodeId: string | null;
  score: number;
  onClose: () => void;
  onLaunchFormCheck?: () => void;
}

export const NodePlaybookModal: React.FC<NodePlaybookModalProps> = ({
  nodeId,
  score,
  onClose,
  onLaunchFormCheck
}) => {
  // Breathing Tool State (for Stress / HRV)
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathingTimer, setBreathingTimer] = useState(4);
  const [completedCycles, setCompletedCycles] = useState(0);

  // Circadian Sun Timer State (for Sleep)
  const [sunTimerSeconds, setSunTimerSeconds] = useState(900); // 15 mins default
  const [isSunTimerRunning, setIsSunTimerRunning] = useState(false);

  // Hydration Calculator State (for Nutrition)
  const [waterCups, setWaterCups] = useState(6);
  const [saltLogged, setSaltLogged] = useState(false);

  // CNS Readiness Checklist
  const [cnsChecks, setCnsChecks] = useState<Record<string, boolean>>({
    gripStrength: true,
    eyeFocus: false,
    restingHrNormal: true,
    mentalClarity: false
  });

  const [isMuted, setIsMuted] = useState(bioAudio.getMuted());

  // 4-7-8 Breathing Loop
  useEffect(() => {
    let interval: any = null;
    if (isBreathingActive) {
      interval = setInterval(() => {
        setBreathingTimer((prev) => {
          if (prev <= 1) {
            if (breathingPhase === 'inhale') {
              setBreathingPhase('hold');
              bioAudio.playBreathingTransition('hold');
              return 7;
            } else if (breathingPhase === 'hold') {
              setBreathingPhase('exhale');
              bioAudio.playBreathingTransition('exhale');
              return 8;
            } else {
              setBreathingPhase('inhale');
              setCompletedCycles((c) => c + 1);
              bioAudio.playBreathingTransition('inhale');
              return 4;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isBreathingActive, breathingPhase]);

  // Circadian Sun Timer
  useEffect(() => {
    let interval: any = null;
    if (isSunTimerRunning && sunTimerSeconds > 0) {
      interval = setInterval(() => {
        setSunTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (sunTimerSeconds === 0 && isSunTimerRunning) {
      setIsSunTimerRunning(false);
      bioAudio.playRepSuccessChime();
    }
    return () => clearInterval(interval);
  }, [isSunTimerRunning, sunTimerSeconds]);

  if (!nodeId) return null;

  const nodeConfigs: Record<string, { title: string; icon: any; color: string; desc: string }> = {
    sleep: {
      title: 'Circadian Rest & Sleep',
      icon: Moon,
      color: '#C1553B',
      desc: 'Restores parasympathetic autonomic tone, growth hormone release, and prefrontal cognitive bandwidth.'
    },
    stress: {
      title: 'Neuro-Stress Load & Cortisol',
      icon: Zap,
      color: '#E8B04B',
      desc: 'Modulates hypothalamic-pituitary-adrenal (HPA) axis balance and autonomic arousal levels.'
    },
    readiness: {
      title: 'Daily Readiness & CNS Recovery',
      icon: Activity,
      color: '#7FA894',
      desc: 'Measures neuromuscular fatigue thresholds and systemic readiness for physical work.'
    },
    hrv: {
      title: 'Heart Rate Variability & Vagal Tone',
      icon: Heart,
      color: '#7FA894',
      desc: 'Direct marker of autonomic flexibility, respiratory sinus arrhythmia, and cardiovascular resilience.'
    },
    nutrition: {
      title: 'Metabolic Fuel & Hydration',
      icon: Sparkles,
      color: '#E8B04B',
      desc: 'Maintains glycogen replenishment, electrolyte osmolarity, and cellular mitochondrial energy.'
    },
    movement: {
      title: 'Kinematic Movement & Joint Capacity',
      icon: Flame,
      color: '#7FA894',
      desc: 'Objective multi-joint symmetry, range-of-motion control, and motor recruitment.'
    }
  };

  const config = nodeConfigs[nodeId] || nodeConfigs['sleep'];
  const Icon = config.icon;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      id="node-playbook-scrim"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-[#0B1613]/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        id="node-playbook-modal"
        className="w-full max-w-xl max-h-[92vh] bg-[#16241F] border border-[#7FA894]/30 rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-300"
      >
        {/* Header Strip */}
        <div className="flex items-center justify-between p-5 border-b border-[#7FA894]/20 bg-[#0B1613]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0B1613] border border-[#7FA894]/30 flex items-center justify-center text-[#E8B04B] shadow-inner">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#E8B04B] uppercase tracking-wider font-['IBM_Plex_Mono',monospace]">
                  Biometric Playbook
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0B1613] text-[#7FA894] font-['IBM_Plex_Mono',monospace]">
                  Score: {score}/100
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#F5F1E8] font-['Fraunces',serif]">
                {config.title}
              </h2>
            </div>
          </div>

          <button
            id="btn-close-playbook"
            onClick={onClose}
            aria-label="Close"
            className="w-10 h-10 rounded-2xl bg-[#0B1613] hover:bg-[#0B1613]/80 border border-[#7FA894]/30 flex items-center justify-center text-[#7FA894] hover:text-[#F5F1E8] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs text-[#F5F1E8]">
          <p className="text-xs text-[#7FA894] leading-relaxed">
            {config.desc}
          </p>

          {/* =========================================================================
              TOOL 1: SLEEP CIRCADIAN SUNLIGHT ANCHOR
              ========================================================================= */}
          {nodeId === 'sleep' && (
            <div className="p-4 bg-[#0B1613]/70 rounded-2xl border border-[#E8B04B]/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-[#E8B04B]" />
                  <span className="text-xs font-bold text-[#F5F1E8] uppercase font-['IBM_Plex_Mono',monospace]">
                    15-Minute Morning Lux Anchor
                  </span>
                </div>
                <span className="text-[10px] text-[#7FA894] font-['IBM_Plex_Mono',monospace]">
                  Cortisol Pulse
                </span>
              </div>

              <div className="flex items-center justify-center py-4">
                <div className="text-center space-y-1">
                  <div className="text-4xl font-bold text-[#E8B04B] font-['IBM_Plex_Mono',monospace]">
                    {formatTime(sunTimerSeconds)}
                  </div>
                  <p className="text-[11px] text-[#7FA894]">
                    Look toward natural sky light (no sunglasses) to anchor circadian suprachiasmatic nucleus.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setIsSunTimerRunning(!isSunTimerRunning)}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-[#E8B04B] hover:bg-[#E8B04B]/90 text-[#0B1613] font-bold flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-[#E8B04B]/20"
                >
                  {isSunTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isSunTimerRunning ? 'Pause Session' : 'Start Sun Exposure'}</span>
                </button>
                <button
                  onClick={() => {
                    setIsSunTimerRunning(false);
                    setSunTimerSeconds(900);
                  }}
                  className="min-h-[44px] px-3 py-2 rounded-xl bg-[#16241F] text-[#7FA894] hover:text-[#F5F1E8] border border-[#7FA894]/30 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              TOOL 2: STRESS & HRV 4-7-8 DIAPHRAGMATIC PACER
              ========================================================================= */}
          {(nodeId === 'stress' || nodeId === 'hrv') && (
            <div className="p-5 bg-[#0B1613]/70 rounded-2xl border border-[#7FA894]/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#7FA894]" />
                  <span className="text-xs font-bold text-[#F5F1E8] uppercase font-['IBM_Plex_Mono',monospace]">
                    4-7-8 Autonomic Vagal Pacer
                  </span>
                </div>
                <button
                  onClick={() => setIsMuted(bioAudio.toggleMute())}
                  className="p-1 text-[#7FA894] hover:text-[#E8B04B] transition-colors"
                  title="Toggle Audio Cues"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

              {/* Animated Pacing Visualizer */}
              <div className="flex flex-col items-center justify-center py-6">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <div
                    className={`w-32 h-32 rounded-full border-4 transition-all duration-1000 flex items-center justify-center shadow-2xl ${
                      breathingPhase === 'inhale'
                        ? 'border-[#7FA894] bg-[#7FA894]/20 scale-110'
                        : breathingPhase === 'hold'
                        ? 'border-[#E8B04B] bg-[#E8B04B]/20 scale-105 animate-pulse'
                        : 'border-[#C1553B] bg-[#C1553B]/20 scale-90'
                    }`}
                  >
                    <div className="text-center font-['IBM_Plex_Mono',monospace]">
                      <span className="text-xs font-bold text-[#E8B04B] uppercase block">
                        {breathingPhase}
                      </span>
                      <span className="text-2xl font-bold text-[#F5F1E8]">
                        {breathingTimer}s
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-[#7FA894] mt-2 font-['IBM_Plex_Mono',monospace]">
                  Cycles Completed: {completedCycles}
                </span>
              </div>

              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setIsBreathingActive(!isBreathingActive)}
                  className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#7FA894] hover:bg-[#7FA894]/90 text-[#0B1613] font-bold flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-[#7FA894]/20"
                >
                  {isBreathingActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isBreathingActive ? 'Pause Breath' : 'Start 4-7-8 Loop'}</span>
                </button>
                <button
                  onClick={() => {
                    setIsBreathingActive(false);
                    setBreathingPhase('inhale');
                    setBreathingTimer(4);
                  }}
                  className="min-h-[44px] px-3 py-2 rounded-xl bg-[#16241F] text-[#7FA894] hover:text-[#F5F1E8] border border-[#7FA894]/30 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              TOOL 3: NUTRITION & HYDRATION TRACKER
              ========================================================================= */}
          {nodeId === 'nutrition' && (
            <div className="p-4 bg-[#0B1613]/70 rounded-2xl border border-[#E8B04B]/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-[#7FA894]" />
                  <span className="text-xs font-bold text-[#F5F1E8] uppercase font-['IBM_Plex_Mono',monospace]">
                    Electrolyte & Water Balance
                  </span>
                </div>
                <span className="text-[10px] text-[#E8B04B] font-['IBM_Plex_Mono',monospace]">
                  Target: 8 Cups (2.5L)
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#16241F] rounded-xl border border-[#7FA894]/20">
                <div>
                  <span className="text-xs font-bold text-[#F5F1E8]">Water Intake Today</span>
                  <p className="text-[10px] text-[#7FA894]">{waterCups * 300}ml logged</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setWaterCups(Math.max(0, waterCups - 1))}
                    className="w-8 h-8 rounded-lg bg-[#0B1613] text-[#7FA894] hover:text-[#F5F1E8] font-bold text-sm"
                  >
                    -
                  </button>
                  <span className="text-base font-bold text-[#E8B04B] font-['IBM_Plex_Mono',monospace]">
                    {waterCups} / 8
                  </span>
                  <button
                    onClick={() => setWaterCups(waterCups + 1)}
                    className="w-8 h-8 rounded-lg bg-[#E8B04B] text-[#0B1613] font-bold text-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              <div
                onClick={() => setSaltLogged(!saltLogged)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  saltLogged ? 'bg-[#7FA894]/20 border-[#7FA894]' : 'bg-[#16241F] border-[#7FA894]/20'
                }`}
              >
                <div>
                  <span className="text-xs font-bold text-[#F5F1E8]">Morning Sodium / Potassium Pinch</span>
                  <p className="text-[10px] text-[#7FA894]">500mg unrefined salt to stabilize blood volume</p>
                </div>
                <CheckCircle2 className={`w-5 h-5 ${saltLogged ? 'text-[#7FA894]' : 'text-[#7FA894]/30'}`} />
              </div>
            </div>
          )}

          {/* =========================================================================
              TOOL 4: CNS READINESS CHECKLIST
              ========================================================================= */}
          {nodeId === 'readiness' && (
            <div className="p-4 bg-[#0B1613]/70 rounded-2xl border border-[#7FA894]/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#F5F1E8] uppercase font-['IBM_Plex_Mono',monospace]">
                  CNS Readiness Triage
                </span>
                <span className="text-[10px] text-[#7FA894]">4-point check</span>
              </div>

              <div className="space-y-2 font-['IBM_Plex_Mono',monospace]">
                {[
                  { key: 'gripStrength', label: 'Grip Strength Reflex Crisp' },
                  { key: 'eyeFocus', label: 'Saccadic Eye Tracking Stable' },
                  { key: 'restingHrNormal', label: 'Resting Heart Rate within ±3 bpm' },
                  { key: 'mentalClarity', label: 'Zero Morning Brain Fog' }
                ].map((item) => (
                  <div
                    key={item.key}
                    onClick={() => setCnsChecks({ ...cnsChecks, [item.key]: !cnsChecks[item.key] })}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                      cnsChecks[item.key] ? 'bg-[#7FA894]/20 border-[#7FA894]' : 'bg-[#16241F] border-[#7FA894]/20'
                    }`}
                  >
                    <span className="text-xs text-[#F5F1E8]">{item.label}</span>
                    <CheckCircle2 className={`w-4 h-4 ${cnsChecks[item.key] ? 'text-[#7FA894]' : 'text-[#7FA894]/30'}`} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              TOOL 5: MOVEMENT SHORTCUT
              ========================================================================= */}
          {nodeId === 'movement' && (
            <div className="p-4 bg-[#0B1613]/70 rounded-2xl border border-[#E8B04B]/30 space-y-3">
              <span className="text-xs font-bold text-[#F5F1E8] uppercase font-['IBM_Plex_Mono',monospace]">
                Direct Kinematic Form Verification
              </span>
              <p className="text-xs text-[#7FA894]">
                Launch on-device computer vision to verify squat depth, push-up mechanics, or spinal plank hold.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onLaunchFormCheck?.();
                }}
                className="w-full min-h-[44px] px-4 py-2.5 bg-[#E8B04B] hover:bg-[#E8B04B]/90 text-[#0B1613] font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#E8B04B]/20"
              >
                <span>Launch Movement Form Check</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#7FA894]/20 bg-[#0B1613]/80 flex justify-end">
          <button
            onClick={onClose}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-[#16241F] text-[#F5F1E8] font-semibold border border-[#7FA894]/30 hover:border-[#E8B04B]/50 transition-colors cursor-pointer"
          >
            Close Playbook
          </button>
        </div>
      </div>
    </div>
  );
};
