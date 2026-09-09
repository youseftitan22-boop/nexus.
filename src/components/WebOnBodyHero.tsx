import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Human3DCanvas } from './Human3DCanvas';
import {
  Heart,
  Moon,
  Sparkles,
  Zap,
  Activity,
  Flame,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Info,
  Footprints,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Calendar,
  User,
  Sliders,
  X,
  Target
} from 'lucide-react';
import { RankInfo } from '../utils/nexusEngine';
import { VitalMetrics, UserProfile } from '../types';

interface WebOnBodyHeroProps {
  nis: number;
  biometricProfile: {
    sleep: number;
    nutrition: number;
    readiness: number;
    stress: number;
    hrv: number;
    movement: number;
  };
  profile: UserProfile;
  heartRate: number;
  vitals: VitalMetrics;
  rank: RankInfo;
  streakDays: number;
  onOpenProfile: () => void;
  onOpenNodePlaybook?: (nodeId: string) => void;
  onOpenFormCheck?: () => void;
  onOpenCalendar?: () => void;
}

export const WebOnBodyHero: React.FC<WebOnBodyHeroProps> = ({
  nis,
  biometricProfile,
  profile,
  heartRate,
  vitals,
  rank,
  streakDays,
  onOpenProfile,
  onOpenNodePlaybook,
  onOpenFormCheck,
  onOpenCalendar
}) => {
  const [, setActiveNode] = useState<string | null>(null);
  const [centerMode, setCenterMode] = useState<'3D' | 'WEB'>('3D');
  const [iframeLoaded, setIframeLoaded] = useState<boolean>(false);
  const [iframeFailed, setIframeFailed] = useState<boolean>(false);
  const stageFrameRef = useRef<HTMLIFrameElement | null>(null);

  const stageUrl = import.meta.env.VITE_STAGE_URL || '/anatomy-stage.html';

  // Send state updates to iframe stage
  const sendWebStateToStage = useCallback(() => {
    if (!stageFrameRef.current?.contentWindow) return;
    const nodesPayload = [
      { id: 'sleep', level: biometricProfile.sleep },
      { id: 'stress', level: biometricProfile.stress },
      { id: 'readiness', level: biometricProfile.readiness },
      { id: 'hrv', level: biometricProfile.hrv },
      { id: 'nutrition', level: biometricProfile.nutrition },
      { id: 'movement', level: biometricProfile.movement },
    ];
    const edgesPayload = [
      { a: 'sleep', b: 'stress', strength: 0.8, strained: biometricProfile.sleep < 50 || biometricProfile.stress < 50 },
      { a: 'sleep', b: 'readiness', strength: 0.9, strained: biometricProfile.sleep < 50 || biometricProfile.readiness < 50 },
      { a: 'readiness', b: 'nutrition', strength: 0.7, strained: biometricProfile.readiness < 50 || biometricProfile.nutrition < 50 },
      { a: 'stress', b: 'hrv', strength: 0.85, strained: biometricProfile.stress < 50 || biometricProfile.hrv < 50 },
      { a: 'hrv', b: 'movement', strength: 0.75, strained: biometricProfile.hrv < 50 || biometricProfile.movement < 50 },
      { a: 'nutrition', b: 'movement', strength: 0.7, strained: biometricProfile.nutrition < 50 || biometricProfile.movement < 50 },
    ];
    try {
      stageFrameRef.current.contentWindow.postMessage({
        type: 'setWeb',
        payload: { nodes: nodesPayload, edges: edgesPayload }
      }, '*');
    } catch {
      // ignore
    }
  }, [biometricProfile]);

  // Handle postMessages from stage iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data) return;
      if (e.data.type === 'stage-ready') {
        setIframeLoaded(true);
        sendWebStateToStage();
      } else if (e.data.type === 'node-tap' && e.data.id) {
        onOpenNodePlaybook?.(e.data.id);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onOpenNodePlaybook, sendWebStateToStage]);

  // Sync state whenever biometric profile changes
  useEffect(() => {
    if (iframeLoaded) {
      sendWebStateToStage();
    }
  }, [biometricProfile, iframeLoaded, sendWebStateToStage]);

  // Fallback timer: if iframe load doesn't fire within 2.5s or fails, activate fallback
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!iframeLoaded) {
        setIframeFailed(true);
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [iframeLoaded]);

  // Quiet dismissible banner state
  const [showMakeItYoursBanner, setShowMakeItYoursBanner] = useState<boolean>(() => {
    return localStorage.getItem('healthlog_make_it_yours_dismissed') !== 'true';
  });

  const handleDismissBanner = () => {
    localStorage.setItem('healthlog_make_it_yours_dismissed', 'true');
    setShowMakeItYoursBanner(false);
  };

  // Helper for node strain color
  const getNodeColor = (score: number) => {
    if (score < 50) return { text: 'text-[#C1553B]', bg: 'bg-[#C1553B]', border: 'border-[#C1553B]', glow: 'shadow-[#C1553B]/30' }; // Rust (Strained)
    if (score < 70) return { text: 'text-[#E8B04B]', bg: 'bg-[#E8B04B]', border: 'border-[#E8B04B]', glow: 'shadow-[#E8B04B]/30' }; // Marrow (Moderate)
    return { text: 'text-[#7FA894]', bg: 'bg-[#7FA894]', border: 'border-[#7FA894]', glow: 'shadow-[#7FA894]/30' }; // Lichen (Optimal)
  };

  // Initials generator
  const getInitials = (text: string) => {
    const parts = (text || 'Your Web').trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Node definitions with coordinates relative to center figure
  const nodes = [
    { id: 'sleep', name: 'Sleep', score: biometricProfile.sleep, x: '24%', y: '16%', icon: Moon, organ: 'Pineal / Rest' },
    { id: 'stress', name: 'Stress', score: biometricProfile.stress, x: '74%', y: '20%', icon: Zap, organ: 'Cortisol Tone' },
    { id: 'readiness', name: 'Readiness', score: biometricProfile.readiness, x: '18%', y: '38%', icon: Activity, organ: 'Autonomic CNS' },
    { id: 'hrv', name: 'HRV / Heart', score: biometricProfile.hrv, x: '78%', y: '42%', icon: Heart, organ: 'Cardiovascular' },
    { id: 'nutrition', name: 'Metabolic', score: biometricProfile.nutrition, x: '22%', y: '62%', icon: Sparkles, organ: 'Gut / Energy' },
    { id: 'movement', name: 'Movement', score: biometricProfile.movement, x: '76%', y: '66%', icon: Flame, organ: 'Joint & Force' },
  ];

  // Timeline Days Data
  const timelineDays = [
    { day: 'Mon', date: '12', active: true, nis: 58, state: 'normal' },
    { day: 'Tue', date: '13', active: true, nis: 59, state: 'normal' },
    { day: 'Wed', date: '14', active: true, nis: 58, state: 'strained' },
    { day: 'Thu', date: '15', active: true, nis: 60, state: 'normal' },
    { day: 'Fri', date: '16', active: true, nis: 61, state: 'normal' },
    { day: 'Sat', date: '17', active: true, nis: 60, state: 'normal' },
    { day: 'Sun', date: '18', active: true, nis: 61, state: 'optimal', today: true },
  ];

  return (
    <section id="hero-web-on-body" className="w-full space-y-4">
      {/* Quiet Dismissible "Make it yours" Banner */}
      {showMakeItYoursBanner && (
        <div
          id="banner-make-it-yours"
          className="w-full bg-[#16241F]/90 border border-[#E8B04B]/50 text-[#F5F1E8] px-4 py-2.5 rounded-2xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300 font-['IBM_Plex_Mono',monospace]"
        >
          <div className="flex items-center gap-2.5 text-xs">
            <div className="w-6 h-6 rounded-lg bg-[#E8B04B]/20 text-[#E8B04B] flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span>
              <strong className="text-[#E8B04B]">Make it yours</strong> — name, photo, pronouns & focus goals.
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={onOpenProfile}
              className="min-h-[32px] px-3 py-1 bg-[#E8B04B] hover:bg-[#E8B04B]/90 text-[#0B1613] text-xs font-bold rounded-lg transition-all cursor-pointer shadow-xs"
            >
              Customize Profile
            </button>
            <button
              onClick={handleDismissBanner}
              className="p-1 text-[#7FA894] hover:text-[#F5F1E8] rounded-lg transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3-Column Glass Master Hero Composition */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* =========================================================================
            LEFT COLUMN: Profile Card + Floating Chips + Heart Rate Bars
            ========================================================================= */}
        <div
          id="hero-profile-card"
          className="lg:col-span-3 flex flex-col justify-between glass-card p-5 rounded-[28px] border border-[#7FA894]/25 shadow-2xl relative overflow-hidden group"
        >
          {/* Subtle background ambient light */}
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-[#7FA894]/15 rounded-full blur-2xl pointer-events-none" />

          {/* User Profile Header */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <button
                onClick={onOpenProfile}
                className="text-[11px] font-bold text-[#E8B04B] hover:underline font-['IBM_Plex_Mono',monospace] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
              >
                <span>Identity Profile</span>
                <Sliders className="w-3 h-3 text-[#E8B04B]" />
              </button>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#7FA894]/20 text-[#7FA894] font-['IBM_Plex_Mono',monospace]">
                Verified
              </span>
            </div>

            {/* Photo Avatar Card with Floating Metric Badges & Edit overlay */}
            <div
              onClick={onOpenProfile}
              className="relative mx-auto w-full max-w-[200px] aspect-square rounded-2xl overflow-hidden ring-2 ring-[#7FA894]/30 shadow-lg cursor-pointer group/avatar"
              title="Click to customize profile"
            >
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover/avatar:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-[#E8B04B]/30 to-[#7FA894]/30 flex items-center justify-center font-bold text-3xl text-[#F5F1E8] font-['Fraunces',serif]">
                  {getInitials(profile.name)}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1613] via-transparent to-transparent opacity-80" />
              
              {/* Tap to edit hover badge */}
              <div className="absolute inset-0 bg-[#0B1613]/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold text-[#E8B04B] font-['IBM_Plex_Mono',monospace]">
                Tap to Edit
              </div>

              <div className="absolute bottom-2.5 inset-x-2.5 text-center">
                <h3 className="text-base font-bold text-[#F5F1E8] font-['Fraunces',serif] leading-tight truncate">
                  {profile.name}
                </h3>
                <p className="text-[10px] text-[#7FA894] font-['IBM_Plex_Mono',monospace] leading-tight mt-0.5">
                  {profile.pronouns ? `${profile.pronouns} · ` : ''}{profile.age} yrs
                </p>
                <p className="text-[10px] text-[#E8B04B] font-['Fraunces',serif] italic mt-0.5">{rank.name}</p>
              </div>
            </div>

            {/* Focus Nodes Cosmetic Chips */}
            {profile.focusNodes && profile.focusNodes.length > 0 && (
              <div className="flex items-center justify-center gap-1.5 flex-wrap pt-0.5">
                {profile.focusNodes.map((fn) => (
                  <span
                    key={fn}
                    className="px-2 py-0.5 bg-[#E8B04B]/15 text-[#E8B04B] border border-[#E8B04B]/30 rounded-full text-[9px] font-bold font-['IBM_Plex_Mono',monospace] flex items-center gap-1"
                  >
                    <Target className="w-2.5 h-2.5" />
                    <span>Focus: {fn}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Floating Metric Chips (kg, cm, age, BMI) */}
            <div className="grid grid-cols-3 gap-2 font-['IBM_Plex_Mono',monospace] text-center pt-1">
              <div className="bg-[#0B1613]/80 p-2 rounded-xl border border-[#7FA894]/20">
                <span className="text-[9px] text-[#7FA894] block">HEIGHT</span>
                <span className="text-xs font-bold text-[#F5F1E8]">{profile.heightCm} cm</span>
              </div>
              <div className="bg-[#0B1613]/80 p-2 rounded-xl border border-[#7FA894]/20">
                <span className="text-[9px] text-[#7FA894] block">WEIGHT</span>
                <span className="text-xs font-bold text-[#F5F1E8]">{profile.weightKg} kg</span>
              </div>
              <div className="bg-[#0B1613]/80 p-2 rounded-xl border border-[#7FA894]/20">
                <span className="text-[9px] text-[#7FA894] block">AGE</span>
                <span className="text-xs font-bold text-[#F5F1E8]">{profile.age} yrs</span>
              </div>
            </div>
          </div>

          {/* Heart Rate Real-Time Bar Strip with 156 Bubble */}
          <div className="mt-4 pt-3.5 border-t border-[#7FA894]/15 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-[#F5F1E8] font-semibold">
                <Heart className="w-3.5 h-3.5 text-[#C1553B] fill-[#C1553B] animate-pulse" />
                <span>Cardiac Load</span>
              </div>
              {/* Peak HR bubble */}
              <div className="px-2 py-0.5 bg-[#C1553B]/20 text-[#C1553B] border border-[#C1553B]/40 rounded-full text-[10px] font-bold font-['IBM_Plex_Mono',monospace] flex items-center gap-1 animate-bounce">
                <span>156 peak</span>
              </div>
            </div>

            {/* Micro HR Spectrum Bars */}
            <div className="flex items-end justify-between gap-1 h-12 bg-[#0B1613]/60 p-2 rounded-xl border border-[#7FA894]/20">
              {[45, 62, 78, 110, 156, 124, 98, 82, 120, 142, 95, 80].map((val, idx) => {
                const heightPercent = Math.min(100, Math.round((val / 160) * 100));
                const isPeak = val === 156;
                return (
                  <div
                    key={idx}
                    className="flex-1 rounded-t-sm transition-all duration-300 relative group"
                    style={{
                      height: `${heightPercent}%`,
                      backgroundColor: isPeak ? '#C1553B' : val > 100 ? '#E8B04B' : '#7FA894'
                    }}
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 bg-[#0B1613] text-[9px] px-1.5 py-0.5 rounded text-[#F5F1E8] pointer-events-none font-['IBM_Plex_Mono',monospace] whitespace-nowrap z-20">
                      {val} bpm
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[10px] text-[#7FA894] font-['IBM_Plex_Mono',monospace]">
              <span>Resting: 64 bpm</span>
              <span className="text-[#E8B04B] font-bold">Current: {heartRate} bpm</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            CENTER COLUMN: Canonical Locked Stage Block (3D Interactive Anatomy / Web)
            ========================================================================= */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center glass-card p-2 sm:p-4 rounded-[28px] border border-[#7FA894]/25 shadow-2xl relative min-h-[580px] overflow-hidden bg-[#0B1613]">
          {/* Central Radial Ambient Glow in Marrow/Lichen */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <div className="w-[380px] h-[380px] rounded-full bg-gradient-radial from-[#E8B04B]/15 via-[#7FA894]/10 to-transparent blur-2xl" />
          </div>

          {/* Top Stage View Mode Switcher */}
          <div className="w-full flex items-center justify-between px-2 pt-1 pb-2 z-20 border-b border-[#7FA894]/15 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#E8B04B] animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#F5F1E8] font-['IBM_Plex_Mono',monospace]">
                Center Anatomy Stage
              </span>
            </div>
            <div className="flex items-center gap-1 bg-[#12221D] border border-[#7FA894]/25 rounded-full p-0.5 shadow-md">
              <button
                type="button"
                id="toggle-hero-3d"
                onClick={() => setCenterMode('3D')}
                className={`px-3 py-1 rounded-full text-[10px] font-semibold transition-all cursor-pointer ${
                  centerMode === '3D'
                    ? 'bg-[#E8B04B] text-[#0B1613] font-bold shadow-sm'
                    : 'text-[#7FA894] hover:text-[#F5F1E8]'
                }`}
              >
                ✨ 3D Anatomy
              </button>
              <button
                type="button"
                id="toggle-hero-web"
                onClick={() => setCenterMode('WEB')}
                className={`px-3 py-1 rounded-full text-[10px] font-semibold transition-all cursor-pointer ${
                  centerMode === 'WEB'
                    ? 'bg-[#E8B04B] text-[#0B1613] font-bold shadow-sm'
                    : 'text-[#7FA894] hover:text-[#F5F1E8]'
                }`}
              >
                🧬 Longevity Web
              </button>
            </div>
          </div>

          {/* Canonical Locked Stage Frame / 3D Anatomy Viewport */}
          <div className="relative z-10 w-full flex-1 flex items-center justify-center min-h-[520px]">
            {centerMode === '3D' ? (
              <div className="w-full h-full min-h-[520px]">
                <Human3DCanvas
                  heightCm={profile.heightCm}
                  weightKg={profile.weightKg}
                  chestIn={38}
                  waistIn={32}
                  hipIn={38}
                />
              </div>
            ) : !iframeFailed ? (
              <iframe
                id="stageFrame"
                ref={stageFrameRef}
                src={stageUrl}
                onLoad={() => {
                  setIframeLoaded(true);
                  sendWebStateToStage();
                }}
                onError={() => setIframeFailed(true)}
                style={{ width: '100%', height: '100%', minHeight: '520px', border: 0, display: 'block' }}
                title="Anatomy stage"
              />
            ) : (
              /* Fallback: Static Front Sprite (body.png) with 6 hotspots + curved edges */
              <div className="relative w-full h-full flex items-center justify-center">
                {/* SVG Glued Edges Network connecting Biometric Nodes across the Anatomy Stage */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 460 520" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <linearGradient id="edgeGradStrained" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#C1553B" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#E8B04B" stopOpacity="0.3" />
                    </linearGradient>
                    <linearGradient id="edgeGradOptimal" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#7FA894" stopOpacity="0.7" />
                      <stop offset="100%" stopColor="#E8B04B" stopOpacity="0.4" />
                    </linearGradient>
                  </defs>
                  {/* Hexagonal Biometric Web Edges */}
                  <line x1="24%" y1="16%" x2="74%" y2="20%" stroke="url(#edgeGradStrained)" strokeWidth="1.5" strokeDasharray="3 3" />
                  <line x1="24%" y1="16%" x2="18%" y2="38%" stroke="#C1553B" strokeWidth="1.5" strokeDasharray="2 2" />
                  <line x1="18%" y1="38%" x2="22%" y2="62%" stroke="url(#edgeGradOptimal)" strokeWidth="1.5" strokeDasharray="3 3" />
                  <line x1="74%" y1="20%" x2="78%" y2="42%" stroke="url(#edgeGradOptimal)" strokeWidth="1.5" strokeDasharray="3 3" />
                  <line x1="78%" y1="42%" x2="76%" y2="66%" stroke="#7FA894" strokeWidth="1.5" strokeDasharray="3 3" />
                  <line x1="22%" y1="62%" x2="76%" y2="66%" stroke="url(#edgeGradOptimal)" strokeWidth="1.5" strokeDasharray="3 3" />
                  <line x1="18%" y1="38%" x2="78%" y2="42%" stroke="rgba(232, 176, 75, 0.25)" strokeWidth="1" />
                </svg>

                {/* Static Anatomical Body Sprite */}
                <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
                  <img
                    src="/body.png"
                    alt="Nexus Anatomical Body"
                    className="max-h-[380px] w-auto object-contain select-none drop-shadow-[0_0_35px_rgba(127,168,148,0.3)]"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== '/assets/anatomical_front_transparent.png') {
                        target.src = '/assets/anatomical_front_transparent.png';
                      }
                    }}
                  />
                </div>

                {/* Interactive Glued Nodes with Strain Colors */}
                {nodes.map((node) => {
                  const colors = getNodeColor(node.score);
                  const Icon = node.icon;
                  const isStrained = node.score < 50;
                  const isFocus = profile.focusNodes?.includes(node.id);

                  return (
                    <button
                      key={node.id}
                      id={`hero-node-${node.id}`}
                      onClick={() => onOpenNodePlaybook?.(node.id)}
                      onMouseEnter={() => setActiveNode(node.id)}
                      onMouseLeave={() => setActiveNode(null)}
                      style={{ top: node.y, left: node.x }}
                      className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 p-1.5 sm:p-2 rounded-2xl bg-[#0B1613]/90 backdrop-blur-md border ${colors.border} ${
                        isFocus ? 'ring-2 ring-[#E8B04B] ring-offset-2 ring-offset-[#0B1613]' : ''
                      } shadow-lg transition-all duration-300 cursor-pointer hover:scale-110 group`}
                      title={`${node.name}: ${node.score}/100 capacity.${isFocus ? ' [Focus Priority]' : ''} Click to view playbook.`}
                    >
                      <div className={`w-7 h-7 rounded-xl ${colors.bg}/20 ${colors.text} flex items-center justify-center relative`}>
                        <Icon className="w-4 h-4" />
                        {isStrained && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#C1553B] animate-ping" />
                        )}
                      </div>

                      <div className="text-left pr-1 hidden xs:block font-['IBM_Plex_Mono',monospace]">
                        <div className="text-[10px] font-semibold text-[#F5F1E8] leading-tight flex items-center gap-1">
                          <span>{node.name}</span>
                          {isFocus && <span className="text-[8px] text-[#E8B04B]">★</span>}
                        </div>
                        <div className={`text-[10px] font-bold ${colors.text} leading-tight`}>
                          {node.score} <span className="text-[8px] text-[#7FA894]/60">/100</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Stage Platform Legend */}
          {centerMode === 'WEB' && (
            <div className="absolute bottom-3 inset-x-6 z-20 flex items-center justify-between text-[10px] text-[#7FA894] font-['IBM_Plex_Mono',monospace] bg-[#0B1613]/70 px-3 py-1.5 rounded-full border border-[#7FA894]/20 backdrop-blur-md">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#C1553B]" /> &lt;50 Strained
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#E8B04B]" /> 50–74 Compensating
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#7FA894]" /> 75+ Optimal
              </span>
            </div>
          )}
        </div>

        {/* =========================================================================
            RIGHT COLUMN: Giant NIS Serif Numeral + Causal Line + Top Fixes + Minis
            ========================================================================= */}
        <div className="lg:col-span-3 flex flex-col justify-between glass-card p-5 rounded-[28px] border border-[#7FA894]/25 shadow-2xl space-y-4">
          {/* Header & Giant Fraunces Serif NIS Numeral */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#7FA894] font-['IBM_Plex_Mono',monospace] uppercase tracking-wider">
                Nexus Integration
              </span>
              <div className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#7FA894]/20 text-[#7FA894] font-['IBM_Plex_Mono',monospace]">
                +3 vs W3
              </div>
            </div>

            {/* Giant Serif NIS */}
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-5xl sm:text-6xl font-bold text-[#F5F1E8] font-['Fraunces',serif] tracking-tight">
                {nis}
              </span>
              <div className="text-left font-['IBM_Plex_Mono',monospace]">
                <span className="text-xs text-[#E8B04B] font-bold block">Capacity</span>
                <span className="text-[10px] text-[#7FA894]">/100 Web Score</span>
              </div>
            </div>

            {/* Causal Diagnostic Line (Strained-Sleep bottleneck story on first open) */}
            <div className="mt-2.5 p-3 rounded-2xl bg-[#0B1613]/80 border border-[#C1553B]/30 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-[#C1553B] shrink-0 mt-0.5" />
              <p className="text-xs text-[#F5F1E8] leading-snug">
                <strong className="text-[#C1553B]">Strained Sleep (42)</strong> is currently the primary bottleneck dampening your autonomic recovery and Movement capacity.
              </p>
            </div>
          </div>

          {/* Top Fixes (Yellow & Blue Populated Action Items, Tie-Broken by Focus) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#E8B04B] font-['IBM_Plex_Mono',monospace] uppercase tracking-wider block">
                Top Fixes & Calibration
              </span>
              {profile.focusNodes && profile.focusNodes.length > 0 && (
                <span className="text-[9px] text-[#7FA894] font-['IBM_Plex_Mono',monospace]">
                  Prioritized
                </span>
              )}
            </div>

            {/* Fix 1: Yellow/Marrow Highlighted Fix */}
            <div
              onClick={() => onOpenNodePlaybook?.('sleep')}
              className="p-2.5 rounded-2xl bg-[#E8B04B]/10 border border-[#E8B04B]/40 hover:bg-[#E8B04B]/20 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#E8B04B]/20 text-[#E8B04B] flex items-center justify-center font-bold text-xs font-['IBM_Plex_Mono',monospace]">
                  01
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-[#F5F1E8] group-hover:text-[#E8B04B] transition-colors">
                    Anchor 15m Morning Light
                  </div>
                  <div className="text-[10px] text-[#7FA894] font-['IBM_Plex_Mono',monospace]">
                    +8 Sleep Capacity · Restores Circadian
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#E8B04B] group-hover:translate-x-0.5 transition-transform" />
            </div>

            {/* Fix 2: Blue/Lichen Populated Fix */}
            <div
              onClick={() => onOpenFormCheck?.()}
              className="p-2.5 rounded-2xl bg-[#7FA894]/10 border border-[#7FA894]/40 hover:bg-[#7FA894]/20 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#7FA894]/20 text-[#7FA894] flex items-center justify-center font-bold text-xs font-['IBM_Plex_Mono',monospace]">
                  02
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-[#F5F1E8] group-hover:text-[#7FA894] transition-colors">
                    Squat Kinematic Calibration
                  </div>
                  <div className="text-[10px] text-[#7FA894] font-['IBM_Plex_Mono',monospace]">
                    Form Check · Releases Thoracic Tightness
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#7FA894] group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Mini Cards (Sleep & Steps) */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {/* Sleep Mini */}
            <div className="p-2.5 bg-[#0B1613]/80 rounded-2xl border border-[#7FA894]/20">
              <div className="flex items-center justify-between text-[10px] text-[#7FA894] font-['IBM_Plex_Mono',monospace]">
                <span>SLEEP</span>
                <Moon className="w-3 h-3 text-[#C1553B]" />
              </div>
              <div className="text-base font-bold text-[#F5F1E8] font-['Fraunces',serif] mt-0.5">
                5h 42m
              </div>
              <div className="text-[9px] text-[#C1553B] font-['IBM_Plex_Mono',monospace] font-semibold mt-0.5">
                -1h 18m below baseline
              </div>
            </div>

            {/* Steps Mini */}
            <div className="p-2.5 bg-[#0B1613]/80 rounded-2xl border border-[#7FA894]/20">
              <div className="flex items-center justify-between text-[10px] text-[#7FA894] font-['IBM_Plex_Mono',monospace]">
                <span>STEPS</span>
                <Footprints className="w-3 h-3 text-[#7FA894]" />
              </div>
              <div className="text-base font-bold text-[#F5F1E8] font-['Fraunces',serif] mt-0.5">
                7,166
              </div>
              <div className="text-[9px] text-[#7FA894] font-['IBM_Plex_Mono',monospace] font-semibold mt-0.5">
                71% of daily goal
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BOTTOM OF HERO: Timeline Strip (7-Day Web & Telemetry Progression)
          ========================================================================= */}
      <div className="glass-card p-4 sm:p-5 rounded-[24px] border border-[#7FA894]/25 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-9 h-9 rounded-2xl bg-[#0B1613] border border-[#7FA894]/30 flex items-center justify-center text-[#E8B04B]">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#F5F1E8] font-['Fraunces',serif]">
              7-Day Telemetry Web Progression
            </div>
            <div className="text-[10px] text-[#7FA894] font-['IBM_Plex_Mono',monospace]">
              {streakDays}-day unbroken streak · Strained nodes tracked across time
            </div>
          </div>
        </div>

        {/* 7-Day Timeline Dots / Chips */}
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto overflow-x-auto no-scrollbar font-['IBM_Plex_Mono',monospace]">
          {timelineDays.map((item, idx) => {
            return (
              <div
                key={idx}
                className={`flex flex-col items-center py-1.5 px-3 rounded-xl border transition-all ${
                  item.today
                    ? 'bg-[#E8B04B] text-[#0B1613] font-bold border-[#E8B04B] shadow-md shadow-[#E8B04B]/20'
                    : 'bg-[#0B1613]/70 text-[#F5F1E8] border-[#7FA894]/20 hover:border-[#7FA894]/50'
                }`}
              >
                <span className={`text-[9px] ${item.today ? 'text-[#0B1613]' : 'text-[#7FA894]'}`}>
                  {item.day}
                </span>
                <span className="text-xs font-bold my-0.5">{item.date}</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      item.state === 'strained'
                        ? 'bg-[#C1553B]'
                        : item.state === 'optimal'
                        ? 'bg-[#7FA894]'
                        : 'bg-[#E8B04B]'
                    }`}
                  />
                  <span className={`text-[9px] ${item.today ? 'text-[#0B1613]' : 'text-[#7FA894]'}`}>
                    {item.nis}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
