import React, { useState, useEffect } from 'react';
import {
  Award,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Flame,
  ShieldCheck,
  Moon,
  SunMedium,
  Network,
  Activity,
  CheckCircle2,
  Lock,
  ChevronLeft,
  Calendar,
  Layers,
  HeartPulse,
  User,
  Sliders,
  Download,
  Trash2,
  UploadCloud,
  Zap,
  Smartphone,
  Fingerprint,
  FileCode2,
  BellRing,
  Droplets,
  Wind,
  Sun,
  Database,
  UserCheck
} from 'lucide-react';
import { Badge, FormSessionSummary, HistoryEntry, NodeStat, UserProfile } from '../types';
import { RankInfo, computeLevel, TIER_GLYPHS } from '../utils/nexusEngine';
import { authService, AuthUser, ROLE_PERMISSIONS } from '../utils/authService';
import { notificationService, LongevityHabit } from '../utils/notificationService';
import { indexedDbService } from '../utils/indexedDbService';

interface YouScreenProps {
  rank: RankInfo;
  nis: number;
  xp: number;
  streakDays: number;
  totalLogs: number;
  badges: Badge[];
  history: HistoryEntry[];
  formSessions: FormSessionSummary[];
  movementScore: number;
  profile: UserProfile;
  onOpenProfile: () => void;
  onExportData: () => void;
  onDissolveData: () => void;
  onNavigateHome: () => void;
  onOpenFormCheck: () => void;
  onOpenCorrelations?: () => void;
  onOpenDataImport?: () => void;
  onInstallApp?: () => void;
  onOpenVault?: () => void;
  onOpenAuth?: () => void;
  onOpenClinicalExport?: () => void;
  onToast?: (msg: string) => void;
}

export const YouScreen: React.FC<YouScreenProps> = ({
  rank,
  nis,
  xp,
  streakDays,
  totalLogs,
  badges,
  history,
  formSessions,
  movementScore,
  profile,
  onOpenProfile,
  onExportData,
  onDissolveData,
  onNavigateHome,
  onOpenFormCheck,
  onOpenCorrelations,
  onOpenDataImport,
  onInstallApp,
  onOpenVault,
  onOpenAuth,
  onOpenClinicalExport,
  onToast
}) => {
  const [authUser, setAuthUser] = useState<AuthUser>(authService.getCurrentUser());
  const [habits, setHabits] = useState<LongevityHabit[]>(notificationService.getHabits());
  const [pendingSyncs, setPendingSyncs] = useState<number>(0);
  const [pushStatus, setPushStatus] = useState<string>('idle');

  useEffect(() => {
    const unsub = authService.subscribe((u) => {
      if (u) setAuthUser(u);
    });
    indexedDbService.getPendingQueueCount().then(setPendingSyncs);
    return unsub;
  }, []);

  const handleToggleHabit = (id: string) => {
    notificationService.toggleHabit(id);
    setHabits([...notificationService.getHabits()]);
    if (onToast) onToast('Updated habit reminder schedule');
  };

  const handleTriggerHabitNow = async (id: string) => {
    const res = await notificationService.triggerHabitReminder(id);
    if (onToast) onToast(`${res.title}: ${res.body}`);
  };

  const handleEnablePush = async () => {
    const perm = await notificationService.requestPushPermission();
    setPushStatus(perm);
    if (onToast) onToast(perm === 'granted' ? 'Web Push Notifications enabled for habit alerts' : 'Push notifications blocked in browser');
  };

  const levelInfo = computeLevel(xp);
  const tierGlyph = TIER_GLYPHS[rank.tier] || '◈';
  const permissions = authService.getPermissions();

  const getInitials = (text: string) => {
    const parts = (text || 'Your Web').trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Consistency %: (days-with-log / days-since-intake, cap 90)
  const daysSinceIntake = 14;
  const daysWithLog = Math.min(totalLogs, 13);
  const rawConsistency = Math.round((daysWithLog / Math.max(daysSinceIntake, 1)) * 100);
  const consistencyPercent = Math.min(rawConsistency, 90);

  // Form Technique Average
  const formTechniqueAvg = formSessions.length > 0
    ? Math.round(formSessions.reduce((acc, s) => acc + s.technique, 0) / formSessions.length)
    : 85;

  // "vs last week" NIS delta
  const lastWeekNis = history.length >= 2 ? history[history.length - 2].nis : Math.max(nis - 4, 30);
  const nisDelta = nis - lastWeekNis;
  const isNisDeltaPositive = nisDelta >= 0;

  // Per-Node Biometric Telemetry
  const nodeStats: NodeStat[] = [
    {
      id: 'sleep',
      name: 'Sleep Recovery',
      score: 42,
      level: 1,
      xp: 65,
      streak: 7,
      checkIns: 14,
      trend: 'up',
      trendDelta: 3,
      category: 'Circadian Rest'
    },
    {
      id: 'nutrition',
      name: 'Metabolic & Nutrition',
      score: 47,
      level: 1,
      xp: 80,
      streak: 5,
      checkIns: 12,
      trend: 'stable',
      trendDelta: 0,
      category: 'Biochemical'
    },
    {
      id: 'readiness',
      name: 'Daily Readiness',
      score: 61,
      level: 2,
      xp: 130,
      streak: 6,
      checkIns: 18,
      trend: 'up',
      trendDelta: 4,
      category: 'Autonomic'
    },
    {
      id: 'stress',
      name: 'Neuro-Stress Load',
      score: 68,
      level: 2,
      xp: 155,
      streak: 7,
      checkIns: 20,
      trend: 'down',
      trendDelta: -2,
      category: 'Cortisol / Tone'
    },
    {
      id: 'hrv',
      name: 'Heart Rate Variability',
      score: 70,
      level: 2,
      xp: 190,
      streak: 7,
      checkIns: 22,
      trend: 'up',
      trendDelta: 5,
      category: 'Cardiovascular'
    },
    {
      id: 'movement',
      name: 'Kinematic Movement',
      score: movementScore,
      level: Math.max(1, Math.floor(movementScore / 30)),
      xp: 220,
      streak: 8,
      checkIns: 24,
      trend: 'up',
      trendDelta: 6,
      category: 'Joint & Force'
    }
  ];

  const renderBadgeIcon = (iconName: string, unlocked: boolean) => {
    const iconClass = `w-6 h-6 ${unlocked ? 'text-[#E8B04B]' : 'text-[#7FA894]/40'}`;
    switch (iconName) {
      case 'SunMedium':
        return <SunMedium className={iconClass} />;
      case 'Moon':
        return <Moon className={iconClass} />;
      case 'ShieldCheck':
        return <ShieldCheck className={iconClass} />;
      case 'Sparkles':
        return <Sparkles className={iconClass} />;
      case 'Network':
        return <Network className={iconClass} />;
      case 'Flame':
        return <Flame className={iconClass} />;
      default:
        return <Award className={iconClass} />;
    }
  };

  const sparkWidth = 260;
  const sparkHeight = 60;
  const sparkPoints = history.map((entry, index) => {
    const x = (index / (history.length - 1 || 1)) * (sparkWidth - 20) + 10;
    const minVal = Math.min(...history.map((h) => h.nis), 40);
    const maxVal = Math.max(...history.map((h) => h.nis), 80);
    const y = sparkHeight - ((entry.nis - minVal) / (maxVal - minVal || 1)) * (sparkHeight - 20) - 10;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300 pb-8">
      {/* Top Header Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-4 sm:p-5 rounded-3xl border border-[#7FA894]/20">
        <div className="flex items-center gap-3">
          <button
            id="btn-you-back"
            onClick={onNavigateHome}
            className="w-10 h-10 rounded-2xl bg-[#0B1613] hover:bg-[#0B1613]/80 border border-[#7FA894]/25 flex items-center justify-center text-[#7FA894] hover:text-[#F5F1E8] transition-colors cursor-pointer"
            title="Back to Dashboard"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#E8B04B] uppercase tracking-wider font-['IBM_Plex_Mono',monospace]">
                Bio-Identity & Telemetry
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#F5F1E8] font-['Fraunces',serif]">
              Your Nexus Intelligence
            </h1>
          </div>
        </div>

        {/* User Identity Pill (Clickable -> Opens Profile Bottom Sheet) */}
        <div
          id="you-user-profile-row"
          onClick={onOpenProfile}
          className="flex items-center justify-between gap-3 bg-[#0B1613] hover:bg-[#0B1613]/90 px-3.5 py-2 rounded-2xl border border-[#7FA894]/25 hover:border-[#E8B04B]/50 transition-all cursor-pointer group shadow-sm"
          title="Click to customize profile"
        >
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden ring-1 ring-[#7FA894]/40 bg-[#16241F] flex items-center justify-center">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-[#E8B04B]/30 to-[#7FA894]/30 flex items-center justify-center font-bold text-xs text-[#F5F1E8] font-['Fraunces',serif]">
                  {getInitials(profile.name)}
                </div>
              )}
            </div>
            <div className="text-left leading-none">
              <div className="text-xs font-bold text-[#F5F1E8] flex items-center gap-1.5">
                <span>{profile.name}</span>
                <span className="text-[10px] text-[#7FA894] font-normal font-['IBM_Plex_Mono',monospace]">
                  {profile.pronouns ? `${profile.pronouns} · ` : ''}{profile.age}y
                </span>
              </div>
              <div className="text-[11px] text-[#E8B04B] font-['Fraunces',serif] italic flex items-center gap-1 mt-0.5">
                <span>{tierGlyph}</span>
                <span>{rank.name}</span>
              </div>
            </div>
          </div>

          <div className="p-1.5 rounded-xl bg-[#16241F] text-[#7FA894] group-hover:text-[#E8B04B] transition-colors">
            <Sliders className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Advanced Telemetry Action Bar (Correlations & Import) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          onClick={onOpenCorrelations}
          className="glass-card p-4 rounded-3xl border border-[#7FA894]/25 hover:border-[#E8B04B]/50 transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0B1613] border border-[#7FA894]/30 flex items-center justify-center text-[#E8B04B] group-hover:scale-105 transition-transform">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F5F1E8] font-['Fraunces',serif]">
                Biometric Correlations
              </h3>
              <p className="text-[11px] text-[#7FA894]">Cross-domain Pearson causal loops</p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#E8B04B] font-['IBM_Plex_Mono',monospace] px-2.5 py-1 rounded-xl bg-[#0B1613]">
            Inspect →
          </span>
        </div>

        <div
          onClick={onOpenDataImport}
          className="glass-card p-4 rounded-3xl border border-[#7FA894]/25 hover:border-[#7FA894]/60 transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0B1613] border border-[#7FA894]/30 flex items-center justify-center text-[#7FA894] group-hover:scale-105 transition-transform">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F5F1E8] font-['Fraunces',serif]">
                Import Wearable Data
              </h3>
              <p className="text-[11px] text-[#7FA894]">Apple Health XML, Oura & CSV dumps</p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#7FA894] font-['IBM_Plex_Mono',monospace] px-2.5 py-1 rounded-xl bg-[#0B1613]">
            Import →
          </span>
        </div>
      </div>

      {/* Main Stats & Performance Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Global NIS & Sparkline with Delta Chip */}
        <div className="glass-card p-4 sm:p-5 rounded-3xl border border-[#7FA894]/20 space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#7FA894] font-['IBM_Plex_Mono',monospace] uppercase font-semibold">
              Nexus Score (NIS)
            </span>
            <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-['IBM_Plex_Mono',monospace] flex items-center gap-1 ${
              isNisDeltaPositive ? 'bg-[#7FA894]/20 text-[#7FA894]' : 'bg-[#C1553B]/20 text-[#C1553B]'
            }`}>
              {isNisDeltaPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{isNisDeltaPositive ? `+${nisDelta}` : nisDelta} vs last week</span>
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-bold text-[#F5F1E8] font-['Fraunces',serif]">
              {nis}
            </span>
            <span className="text-xs text-[#7FA894] font-['IBM_Plex_Mono',monospace]">/ 100 Web Capacity</span>
          </div>

          {/* Sparkline Visual */}
          <div className="pt-2">
            <svg className="w-full h-12 overflow-visible" viewBox={`0 0 ${sparkWidth} ${sparkHeight}`}>
              <polyline
                fill="none"
                stroke="#E8B04B"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={sparkPoints}
              />
            </svg>
            <div className="flex justify-between text-[9px] text-[#7FA894] font-['IBM_Plex_Mono',monospace] mt-1">
              <span>{history[0]?.week || 'W1'}</span>
              <span>{history[history.length - 1]?.week || 'Current'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Consistency % */}
        <div className="glass-card p-4 sm:p-5 rounded-3xl border border-[#7FA894]/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#7FA894] font-['IBM_Plex_Mono',monospace] uppercase font-semibold">
              Consistency Index
            </span>
            <span className="text-[10px] text-[#E8B04B] font-['IBM_Plex_Mono',monospace] bg-[#E8B04B]/15 px-2 py-0.5 rounded-full font-bold">
              Cap 90%
            </span>
          </div>

          <div className="my-2">
            <div className="text-3xl sm:text-4xl font-bold text-[#7FA894] font-['Fraunces',serif]">
              {consistencyPercent}%
            </div>
            <p className="text-[11px] text-[#7FA894] mt-1 leading-snug">
              {daysWithLog} active check-in days recorded across {daysSinceIntake} days intake window.
            </p>
          </div>

          <div className="w-full h-1.5 bg-[#0B1613] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#7FA894] rounded-full"
              style={{ width: `${consistencyPercent}%` }}
            />
          </div>
        </div>

        {/* Card 3: Form Technique Average */}
        <div className="glass-card p-4 sm:p-5 rounded-3xl border border-[#7FA894]/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#7FA894] font-['IBM_Plex_Mono',monospace] uppercase font-semibold">
              Movement Technique
            </span>
            <button
              onClick={onOpenFormCheck}
              className="text-[10px] text-[#E8B04B] hover:underline font-['IBM_Plex_Mono',monospace] font-bold cursor-pointer"
            >
              Test Form →
            </button>
          </div>

          <div className="my-2">
            <div className="text-3xl sm:text-4xl font-bold text-[#E8B04B] font-['Fraunces',serif]">
              {formTechniqueAvg}%
            </div>
            <p className="text-[11px] text-[#7FA894] mt-1 leading-snug">
              {formSessions.length} computer-vision verified sets logged. Objective depth compliance.
            </p>
          </div>

          <div className="w-full h-1.5 bg-[#0B1613] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#E8B04B] rounded-full"
              style={{ width: `${formTechniqueAvg}%` }}
            />
          </div>
        </div>

        {/* Card 4: Level, XP & Non-Resetting Streak */}
        <div className="glass-card p-4 sm:p-5 rounded-3xl border border-[#7FA894]/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#7FA894] font-['IBM_Plex_Mono',monospace] uppercase font-semibold">
              Active Streak & Level
            </span>
            <span className="text-[10px] text-[#7FA894] font-['IBM_Plex_Mono',monospace]">
              Paused on Misses
            </span>
          </div>

          <div className="my-2 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-2xl sm:text-3xl font-bold text-[#E8B04B] font-['Fraunces',serif]">
                <Flame className="w-6 h-6 fill-[#E8B04B]/20 text-[#E8B04B]" />
                <span>{streakDays} Days</span>
              </div>
              <span className="text-[11px] text-[#7FA894] block mt-0.5">Level {levelInfo.level} • {xp} XP</span>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-[#F5F1E8] font-['IBM_Plex_Mono',monospace] block">
                {levelInfo.progress}%
              </span>
              <span className="text-[9px] text-[#7FA894] font-['IBM_Plex_Mono',monospace]">to Level {levelInfo.level + 1}</span>
            </div>
          </div>

          <div className="w-full h-1.5 bg-[#0B1613] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#E8B04B] to-[#7FA894] rounded-full"
              style={{ width: `${levelInfo.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Badges Shelf Section */}
      <div className="glass-card p-5 sm:p-6 rounded-3xl border border-[#7FA894]/20 space-y-4">
        <div className="flex items-center justify-between border-b border-[#7FA894]/20 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#E8B04B]" />
              <span className="text-xs font-bold text-[#E8B04B] font-['IBM_Plex_Mono',monospace] uppercase tracking-wider">
                Proof-of-Practice
              </span>
            </div>
            <h2 className="text-lg font-bold text-[#F5F1E8] font-['Fraunces',serif]">
              Badges & Milestones Shelf
            </h2>
          </div>
          <span className="text-xs text-[#7FA894] font-['IBM_Plex_Mono',monospace]">
            {badges.filter((b) => b.unlocked).length} / {badges.length} Unlocked
          </span>
        </div>

        {/* Grid of 6 Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {badges.map((badge) => {
            return (
              <div
                key={badge.id}
                id={`badge-${badge.id}`}
                className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                  badge.unlocked
                    ? 'bg-[#0B1613]/80 border-[#E8B04B]/35 shadow-sm'
                    : 'bg-[#0B1613]/40 border-[#7FA894]/15 opacity-60'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                    badge.unlocked
                      ? 'bg-[#E8B04B]/15 border-[#E8B04B]/40 shadow-inner'
                      : 'bg-[#16241F] border-[#7FA894]/20 text-[#7FA894]/30'
                  }`}
                >
                  {renderBadgeIcon(badge.iconName, badge.unlocked)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="text-sm font-bold text-[#F5F1E8] font-['Fraunces',serif] truncate">
                      {badge.name}
                    </h3>
                    {badge.unlocked ? (
                      <span className="text-[10px] text-[#7FA894] font-['IBM_Plex_Mono',monospace] bg-[#7FA894]/15 px-2 py-0.5 rounded-md shrink-0">
                        {badge.unlockedAt || 'Unlocked'}
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#7FA894]/60 font-['IBM_Plex_Mono',monospace] flex items-center gap-1 shrink-0">
                        <Lock className="w-3 h-3" /> Locked
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#7FA894] mt-1 leading-relaxed">
                    {badge.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-Node Biometric Breakdown Section */}
      <div className="glass-card p-5 sm:p-6 rounded-3xl border border-[#7FA894]/20 space-y-4">
        <div className="flex items-center justify-between border-b border-[#7FA894]/20 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#7FA894]" />
              <span className="text-xs font-bold text-[#7FA894] font-['IBM_Plex_Mono',monospace] uppercase tracking-wider">
                Hexagonal Mesh Breakdown
              </span>
            </div>
            <h2 className="text-lg font-bold text-[#F5F1E8] font-['Fraunces',serif]">
              Per-Node Capacity & Progression
            </h2>
          </div>
          <span className="text-xs text-[#7FA894] font-['IBM_Plex_Mono',monospace]">
            6 Living Dimensions
          </span>
        </div>

        {/* Node Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nodeStats.map((node) => {
            const isStrained = node.score < 50;
            return (
              <div
                key={node.id}
                id={`node-stat-${node.id}`}
                className="p-4 bg-[#0B1613]/75 rounded-2xl border border-[#7FA894]/20 space-y-3"
              >
                {/* Node Title & Trend */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] text-[#7FA894] font-['IBM_Plex_Mono',monospace] uppercase font-semibold">
                      {node.category}
                    </span>
                    <h4 className="text-base font-bold text-[#F5F1E8] font-['Fraunces',serif]">
                      {node.name}
                    </h4>
                  </div>
                  {/* Trend Arrow Chip */}
                  <div
                    className={`px-2 py-0.5 rounded-lg text-xs font-bold font-['IBM_Plex_Mono',monospace] flex items-center gap-1 ${
                      node.trend === 'up'
                        ? 'bg-[#7FA894]/20 text-[#7FA894]'
                        : node.trend === 'down'
                        ? 'bg-[#C1553B]/20 text-[#C1553B]'
                        : 'bg-[#16241F] text-[#7FA894]'
                    }`}
                  >
                    {node.trend === 'up' && <TrendingUp className="w-3 h-3" />}
                    {node.trend === 'down' && <TrendingDown className="w-3 h-3" />}
                    {node.trend === 'stable' && <Minus className="w-3 h-3" />}
                    <span>{node.trendDelta > 0 ? `+${node.trendDelta}` : node.trendDelta}</span>
                  </div>
                </div>

                {/* Score & Capacity Bar */}
                <div>
                  <div className="flex justify-between text-xs font-['IBM_Plex_Mono',monospace] mb-1">
                    <span className="text-[#7FA894]">Capacity Score</span>
                    <span className={`font-bold ${isStrained ? 'text-[#C1553B]' : 'text-[#E8B04B]'}`}>
                      {node.score}/100 {isStrained && '(Strained)'}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#16241F] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isStrained ? 'bg-[#C1553B]' : 'bg-[#E8B04B]'
                      }`}
                      style={{ width: `${node.score}%` }}
                    />
                  </div>
                </div>

                {/* Node Telemetry Grid */}
                <div className="grid grid-cols-4 gap-1.5 pt-1 text-center font-['IBM_Plex_Mono',monospace] border-t border-[#7FA894]/15">
                  <div className="p-1.5 bg-[#16241F]/60 rounded-xl">
                    <div className="text-[9px] text-[#7FA894]">LVL</div>
                    <div className="text-xs font-bold text-[#F5F1E8]">{node.level}</div>
                  </div>
                  <div className="p-1.5 bg-[#16241F]/60 rounded-xl">
                    <div className="text-[9px] text-[#7FA894]">XP</div>
                    <div className="text-xs font-bold text-[#E8B04B]">{node.xp}</div>
                  </div>
                  <div className="p-1.5 bg-[#16241F]/60 rounded-xl">
                    <div className="text-[9px] text-[#7FA894]">STRK</div>
                    <div className="text-xs font-bold text-[#F5F1E8]">{node.streak}d</div>
                  </div>
                  <div className="p-1.5 bg-[#16241F]/60 rounded-xl">
                    <div className="text-[9px] text-[#7FA894]">LOGS</div>
                    <div className="text-xs font-bold text-[#7FA894]">{node.checkIns}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Biometric Passkey & Role-Based Access Control (RBAC) Card */}
      <div
        id="auth-rbac-row"
        className="glass-card p-4 sm:p-5 rounded-3xl border border-[#5B9BD5]/30 bg-[#13171F]/90 flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0B1613] border border-[#5B9BD5]/40 flex items-center justify-center text-[#5B9BD5]">
            <Fingerprint className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-[#F5F1E8] font-['Fraunces',serif]">
                Role-Based Access Control (RBAC)
              </h4>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-['IBM_Plex_Mono',monospace] border ${permissions.badgeBg} ${permissions.badgeColor}`}>
                {authUser.role} ACTIVE
              </span>
            </div>
            <p className="text-xs text-[#7FA894]">
              Switch clinical perspectives for Physicians, Trainers, Specialists, and Members.
            </p>
          </div>
        </div>

        <button
          id="btn-manage-auth"
          onClick={onOpenAuth}
          className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 bg-[#5B9BD5]/20 hover:bg-[#5B9BD5]/30 border border-[#5B9BD5]/40 text-[#F5F1E8] text-xs font-semibold rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <UserCheck className="w-4 h-4 text-[#5B9BD5]" />
          <span>Switch Active Role</span>
        </button>
      </div>

      {/* Longevity Habits & Web Push Notifications Scheduler */}
      <div className="glass-card p-5 sm:p-6 rounded-3xl border border-[#E8B04B]/25 bg-[#16241F]/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#7FA894]/20 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-[#E8B04B]" />
              <span className="text-xs font-bold text-[#E8B04B] font-['IBM_Plex_Mono',monospace] uppercase tracking-wider">
                Circadian & Habit Push Reminders
              </span>
            </div>
            <h3 className="text-base font-bold text-[#F5F1E8] font-['Fraunces',serif]">
              Automated Longevity Protocol Schedulers
            </h3>
          </div>

          <button
            onClick={handleEnablePush}
            className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-[#E8B04B]/15 hover:bg-[#E8B04B]/25 border border-[#E8B04B]/30 text-xs font-semibold text-[#E8B04B] flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>Enable Web Push Alerts</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {habits.map((h) => (
            <div
              key={h.id}
              className="p-3.5 rounded-2xl bg-[#0B1613]/70 border border-[#7FA894]/15 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#16241F] border border-[#7FA894]/20 flex items-center justify-center text-[#E8B04B]">
                  {h.id === 'sunlight' && <Sun className="w-4 h-4" />}
                  {h.id === 'breathwork' && <Wind className="w-4 h-4" />}
                  {h.id === 'hydration' && <Droplets className="w-4 h-4" />}
                  {h.id === 'zone2' && <Activity className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-[#F5F1E8]">{h.name}</div>
                  <div className="text-[10px] text-[#7FA894] leading-snug">{h.description}</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleTriggerHabitNow(h.id)}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] text-[#E8B04B] border border-[#E8B04B]/30 transition-colors"
                  title="Test notification"
                >
                  Trigger
                </button>
                <button
                  onClick={() => handleToggleHabit(h.id)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    h.enabled ? 'bg-[#7FA894] text-black' : 'bg-white/10 text-white/40'
                  }`}
                >
                  {h.enabled ? '✓' : '×'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* IndexedDB Heavy Data & Background Sync Card */}
      <div className="glass-card p-4 sm:p-5 rounded-3xl border border-[#7FA894]/25 bg-[#0B1613]/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#16241F] border border-[#7FA894]/30 flex items-center justify-center text-[#7FA894]">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-[#F5F1E8] font-['Fraunces',serif]">
                IndexedDB Heavy Storage & Background Sync
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-['IBM_Plex_Mono',monospace] bg-[#7FA894]/20 text-[#7FA894]">
                IDB v1
              </span>
            </div>
            <p className="text-xs text-[#7FA894]">
              High-density blood lab panels, video kinematics, and posture keypoints cached locally for airplane mode.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-['IBM_Plex_Mono',monospace] text-[#7FA894]">
          <span>Sync Queue:</span>
          <span className="px-2 py-1 rounded-lg bg-[#16241F] text-white font-bold">
            {pendingSyncs === 0 ? 'Synced (0 queued)' : `${pendingSyncs} pending`}
          </span>
        </div>
      </div>

      {/* Local Vault WebCrypto AES-GCM-256 Card in #/you */}
      <div
        id="local-vault-row"
        className="glass-card p-4 sm:p-5 rounded-3xl border border-[#7FA894]/30 bg-[#16241F]/90 flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0B1613] border border-[#7FA894]/40 flex items-center justify-center text-[#7FA894]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-[#F5F1E8] font-['Fraunces',serif]">Local Vault Encryption</h4>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-['IBM_Plex_Mono',monospace] bg-[#7FA894]/20 text-[#7FA894] border border-[#7FA894]/30">
                AES-GCM-256 ACTIVE
              </span>
            </div>
            <p className="text-xs text-[#7FA894]">
              Web Crypto API isolates and encrypts all biometrics and appointments in browser storage.
            </p>
          </div>
        </div>

        <button
          id="btn-inspect-local-vault"
          onClick={onOpenVault}
          className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 bg-[#16241F] hover:bg-[#7FA894]/20 border border-[#7FA894]/40 text-[#F5F1E8] text-xs font-semibold rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <Lock className="w-4 h-4 text-[#7FA894]" />
          <span>Inspect Local Vault</span>
        </button>
      </div>

      {/* PWA Install App Row in #/you */}
      <div
        id="pwa-install-row"
        className="glass-card p-4 sm:p-5 rounded-3xl border border-[#E8B04B]/30 bg-[#16241F]/80 flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0d241c] border border-[#E8B04B]/40 flex items-center justify-center text-[#E8B04B]">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#F5F1E8] font-['Fraunces',serif]">Install Nexus App</h4>
            <p className="text-xs text-[#7FA894]">Standalone biometric web with instant offline caching.</p>
          </div>
        </div>

        <button
          id="btn-install-app-you"
          onClick={onInstallApp}
          className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-[#E8B04B] hover:bg-[#E8B04B]/90 text-[#0B1613] text-xs font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-[#E8B04B]/20"
        >
          <Smartphone className="w-4 h-4" />
          <span>Install App</span>
        </button>
      </div>

      {/* Privacy, Export & Dissolve Bottom Bar in #/you */}
      <div id="privacy-compliance-card" className="glass-card p-5 sm:p-6 rounded-3xl border border-[#7FA894]/30 bg-[#16241F]/90 flex flex-col gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#0B1613] border border-[#7FA894]/40 flex items-center justify-center text-[#7FA894] shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-[#F5F1E8] font-['Fraunces',serif]">
                On-Device Privacy & Data Sovereignty
              </h4>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-['IBM_Plex_Mono',monospace] bg-[#7FA894]/20 text-[#7FA894] border border-[#7FA894]/30">
                ZERO TELEMETRY UPLOAD
              </span>
            </div>
            <p className="text-sm text-[#F5F1E8] mt-1 font-medium leading-relaxed">
              All data stays on this device. Camera frames are processed on-device and never uploaded. Export gives you a copy. Dissolve deletes everything.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#7FA894]/20">
          <button
            id="btn-privacy-clinical-export"
            onClick={onOpenClinicalExport}
            className="flex-1 sm:flex-none min-h-[44px] px-4 py-2.5 bg-[#5B9BD5]/20 hover:bg-[#5B9BD5]/30 border border-[#5B9BD5]/40 text-[#F5F1E8] text-xs font-semibold rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <FileCode2 className="w-4 h-4 text-[#5B9BD5]" />
            <span>Health Export (JSON / CSV)</span>
          </button>

          <button
            id="btn-privacy-export-json"
            onClick={onExportData}
            className="flex-1 sm:flex-none min-h-[44px] px-4 py-2.5 bg-[#16241F] hover:bg-[#16241F]/80 border border-[#7FA894]/30 text-[#F5F1E8] text-xs font-semibold rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4 text-[#E8B04B]" />
            <span>Export JSON</span>
          </button>

          <button
            id="btn-privacy-dissolve"
            onClick={onDissolveData}
            className="flex-1 sm:flex-none min-h-[44px] px-4 py-2.5 bg-[#C1553B]/20 hover:bg-[#C1553B]/30 border border-[#C1553B]/40 text-[#F5F1E8] text-xs font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-colors text-[#C1553B]"
          >
            <Trash2 className="w-4 h-4 text-[#C1553B]" />
            <span>Dissolve All Data</span>
          </button>

          <button
            id="btn-privacy-edit-profile"
            onClick={onOpenProfile}
            className="flex-1 sm:flex-none min-h-[44px] px-4 py-2.5 bg-[#E8B04B] hover:bg-[#E8B04B]/90 text-[#0B1613] text-xs font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md shadow-[#E8B04B]/20 ml-auto"
          >
            <Sliders className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};
