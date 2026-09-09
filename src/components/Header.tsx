import React, { useState, useEffect } from 'react';
import {
  Search,
  Bell,
  Grid,
  Calendar,
  Activity,
  HeartPulse,
  Sparkles,
  LayoutDashboard,
  Flame,
  Target,
  CheckCircle2,
  Circle,
  ArrowRight,
  Fingerprint,
  ShieldCheck
} from 'lucide-react';
import { RankInfo, computeLevel, TIER_GLYPHS } from '../utils/nexusEngine';
import { UserProfile } from '../types';
import { authService, AuthUser, ROLE_PERMISSIONS } from '../utils/authService';

interface HeaderProps {
  currentRoute?: string;
  onNavigate?: (route: string) => void;
  onSearchChange?: (query: string) => void;
  onOpenCalendar?: () => void;
  onOpenProfile?: () => void;
  onOpenAuth?: () => void;
  profile?: UserProfile;
  xp?: number;
  nis?: number;
  streakDays?: number;
  rank?: RankInfo;
  completedDailyTasks?: number;
  totalDailyTasks?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentRoute = '#/',
  onNavigate,
  onSearchChange,
  onOpenCalendar,
  onOpenProfile,
  onOpenAuth,
  profile = {
    name: 'Robert Smith',
    age: 28,
    sex: 'Male',
    pronouns: 'He/Him',
    avatarUrl: '',
    focusNodes: ['sleep', 'movement'],
    heightCm: 170,
    weightKg: 72
  },
  xp = 240,
  nis = 61,
  streakDays = 7,
  rank = { tier: 1, name: 'Woven', next: null },
  completedDailyTasks = 2,
  totalDailyTasks = 3
}) => {
  const [authUser, setAuthUser] = useState<AuthUser>(authService.getCurrentUser());
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [, setShowAppGrid] = useState(false);
  const [showXpPopover, setShowXpPopover] = useState(false);
  const [showDailyGoalPopover, setShowDailyGoalPopover] = useState(false);

  useEffect(() => {
    const unsub = authService.subscribe((u) => {
      if (u) setAuthUser(u);
    });
    return unsub;
  }, []);

  const permissions = authService.getPermissions();

  const isFormActive = currentRoute === '#/form';
  const isYouActive = currentRoute === '#/you';
  const isWebActive = !isFormActive && !isYouActive;

  const levelInfo = computeLevel(xp);
  const tierGlyph = TIER_GLYPHS[rank.tier] || '◈';

  const getInitials = (text: string) => {
    const parts = (text || 'Your Web').trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const notifications = [
    { id: 1, text: 'Movement Form Check ready: Calibrate your squat depth', time: '5m ago', unread: true },
    { id: 2, text: 'Appointment with Dr. Katrin Edwards tomorrow at 9:00 AM', time: '10m ago', unread: true },
    { id: 3, text: 'Daily step goal (7,166 / 10,000) reached 71%', time: '1h ago', unread: false },
  ];

  // SVG Circle parameters for XP level ring
  const ringRadius = 14;
  const circumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset = circumference - (levelInfo.progress / 100) * circumference;

  // Daily Streak Goal calculations & ring
  const dailyGoalPercent = Math.min(100, Math.round((completedDailyTasks / Math.max(totalDailyTasks, 1)) * 100));
  const goalStrokeDashoffset = circumference - (dailyGoalPercent / 100) * circumference;
  const remainingTasks = Math.max(0, totalDailyTasks - completedDailyTasks);

  const dailyTasksList = [
    { id: 'vitals', label: 'Morning Vitals Telemetry', completed: true, detail: 'Heart rate & blood metrics synced' },
    { id: 'movement', label: 'Movement / Form Check', completed: true, detail: 'Squat kinematics verified' },
    { id: 'circadian', label: 'Circadian Light or Wind-down', completed: false, detail: '15m sunlight or evening wind-down' }
  ];

  return (
    <header
      id="main-header"
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-2 flex flex-col md:flex-row items-center justify-between gap-3.5"
    >
      {/* Left: Brand Logo & Navigation Pills */}
      <div className="flex items-center justify-between w-full md:w-auto gap-4">
        <a
          href="#/"
          onClick={(e) => {
            e.preventDefault();
            onNavigate?.('#/');
          }}
          id="brand-logo"
          className="flex items-center gap-2.5 shrink-0 cursor-pointer"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#E8B04B] to-[#7FA894] flex items-center justify-center shadow-md shadow-[#E8B04B]/20 ring-1 ring-[#7FA894]/40">
            <div className="w-4 h-4 rounded-full border-2 border-[#0B1613] flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#0B1613] animate-pulse" />
            </div>
          </div>
          <span className="text-xl font-bold tracking-tight text-[#F5F1E8] font-['Fraunces',serif]">
            Health<span className="text-[#E8B04B] italic">log</span>
          </span>
        </a>

        {/* Center/Left Nav Pills */}
        <nav className="flex items-center gap-1.5 bg-[#16241F]/90 backdrop-blur-md p-1 rounded-full border border-[#7FA894]/25 shadow-xs font-['IBM_Plex_Mono',monospace] text-xs">
          <button
            id="nav-pill-overview"
            onClick={() => onNavigate?.('#/')}
            className={`px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
              isWebActive
                ? 'bg-[#E8B04B] text-[#0B1613] font-bold shadow-xs'
                : 'text-[#7FA894] hover:text-[#F5F1E8]'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Web</span>
          </button>

          <button
            id="nav-pill-form"
            onClick={() => onNavigate?.('#/form')}
            className={`px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
              isFormActive
                ? 'bg-[#E8B04B] text-[#0B1613] font-bold shadow-xs'
                : 'text-[#7FA894] hover:text-[#F5F1E8]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Form</span>
          </button>

          <button
            id="nav-pill-you"
            onClick={() => onNavigate?.('#/you')}
            className={`px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
              isYouActive
                ? 'bg-[#E8B04B] text-[#0B1613] font-bold shadow-xs'
                : 'text-[#7FA894] hover:text-[#F5F1E8]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>You</span>
          </button>
        </nav>
      </div>

      {/* Center: Search Pill Input */}
      <div id="header-search-bar" className="w-full md:flex-1 md:max-w-xs lg:max-w-sm md:mx-2">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-[#7FA894] pointer-events-none" />
          <input
            id="search-input"
            type="text"
            placeholder="Search vitals, symptoms..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onSearchChange?.(e.target.value);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#16241F]/80 backdrop-blur-md rounded-full border border-[#7FA894]/30 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#E8B04B]/40 focus:border-[#E8B04B] transition-all placeholder:text-[#7FA894]/60 text-[#F5F1E8]"
          />
        </div>
      </div>

      {/* Right: Telemetry Chips (NIS, Streak, Daily Goal Ring, XP Level Ring) & Profile */}
      <div id="header-actions" className="flex items-center gap-2 sm:gap-2.5 shrink-0 self-end md:self-auto">
        {/* NIS Mono Chip */}
        <div
          id="chip-nis"
          title={`Nexus Integration Score: ${nis}`}
          className="px-2.5 py-1.5 rounded-2xl bg-[#16241F]/80 backdrop-blur-md border border-[#7FA894]/30 flex items-center gap-1.5 font-['IBM_Plex_Mono',monospace] text-xs shadow-xs"
        >
          <span className="text-[10px] text-[#7FA894] font-semibold">NIS</span>
          <span className="text-xs font-bold text-[#F5F1E8]">{nis}</span>
        </div>

        {/* Streak Mono Chip (Missed days pause, never reset) */}
        <div
          id="chip-streak"
          title={`Active Streak: ${streakDays} days (Paused if inactive)`}
          className="px-2.5 py-1.5 rounded-2xl bg-[#16241F]/80 backdrop-blur-md border border-[#7FA894]/30 flex items-center gap-1.5 font-['IBM_Plex_Mono',monospace] text-xs shadow-xs"
        >
          <Flame className="w-3.5 h-3.5 text-[#E8B04B] fill-[#E8B04B]/20" />
          <span className="text-xs font-bold text-[#E8B04B]">{streakDays}d</span>
        </div>

        {/* Daily Goal Progress Ring */}
        <div className="relative">
          <button
            id="chip-daily-goal-ring"
            onClick={() => {
              setShowDailyGoalPopover(!showDailyGoalPopover);
              setShowXpPopover(false);
              setShowNotifications(false);
            }}
            title={`Daily Streak Goal: ${completedDailyTasks}/${totalDailyTasks} tasks completed (${remainingTasks === 0 ? 'Streak Secured' : `${remainingTasks} task remaining`})`}
            className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 bg-[#16241F]/80 backdrop-blur-md rounded-2xl border border-[#7FA894]/30 shadow-xs cursor-pointer hover:border-[#7FA894]/60 transition-all font-['IBM_Plex_Mono',monospace]"
          >
            {/* Circular Progress Ring */}
            <div className="relative w-8 h-8 flex items-center justify-center">
              <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r={ringRadius}
                  className="stroke-[#0B1613]"
                  strokeWidth="3"
                  fill="none"
                />
                <circle
                  cx="18"
                  cy="18"
                  r={ringRadius}
                  className="stroke-[#7FA894] transition-all duration-500 ease-out"
                  strokeWidth="3"
                  strokeDasharray={circumference}
                  strokeDashoffset={goalStrokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              <span className="absolute text-[10px] font-bold text-[#7FA894]">
                {completedDailyTasks}/{totalDailyTasks}
              </span>
            </div>
            <div className="text-left leading-none hidden lg:block">
              <span className="text-[9px] text-[#7FA894] block uppercase">Daily Goal</span>
              <span className="text-[11px] font-bold text-[#F5F1E8]">
                {remainingTasks === 0 ? '100% Done' : `${remainingTasks} Left`}
              </span>
            </div>
          </button>

          {/* Daily Goal Tasks Popover */}
          {showDailyGoalPopover && (
            <div
              id="daily-goal-popover"
              className="absolute right-0 mt-2 w-72 bg-[#16241F] rounded-2xl border border-[#7FA894]/30 shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 font-['IBM_Plex_Mono',monospace]"
            >
              <div className="flex items-center justify-between pb-2.5 border-b border-[#7FA894]/20">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#7FA894]" />
                  <span className="text-xs font-bold text-[#F5F1E8]">Daily Streak Goal</span>
                </div>
                <span className="text-[10px] text-[#7FA894] font-bold">
                  {completedDailyTasks}/{totalDailyTasks} Tasks
                </span>
              </div>

              {/* Progress visual bar */}
              <div className="my-3">
                <div className="flex justify-between text-[10px] text-[#7FA894] mb-1">
                  <span>Streak Protection</span>
                  <span className="font-bold text-[#7FA894]">{dailyGoalPercent}%</span>
                </div>
                <div className="w-full h-2 bg-[#0B1613] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#7FA894] to-[#E8B04B] transition-all duration-300 rounded-full"
                    style={{ width: `${dailyGoalPercent}%` }}
                  />
                </div>
              </div>

              {/* Checklist items */}
              <div className="space-y-2 text-xs">
                {dailyTasksList.map((task) => (
                  <div
                    key={task.id}
                    className={`p-2 rounded-xl border flex items-start gap-2.5 transition-colors ${
                      task.completed
                        ? 'bg-[#0B1613]/60 border-[#7FA894]/30 text-[#F5F1E8]'
                        : 'bg-[#0B1613]/30 border-[#7FA894]/15 text-[#7FA894]'
                    }`}
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-[#7FA894] shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-4 h-4 text-[#7FA894]/40 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs leading-tight flex items-center justify-between">
                        <span>{task.label}</span>
                        {task.completed && (
                          <span className="text-[9px] text-[#7FA894] font-bold">Done</span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#7FA894]/80 mt-0.5 leading-snug">
                        {task.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action trigger footer */}
              {remainingTasks > 0 ? (
                <div className="mt-3 pt-2 border-t border-[#7FA894]/15">
                  <button
                    onClick={() => {
                      setShowDailyGoalPopover(false);
                      onNavigate?.('#/form');
                    }}
                    className="w-full py-2 bg-[#E8B04B] hover:bg-[#E8B04B]/90 text-[#0B1613] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                  >
                    <span>Complete Remaining Task</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="mt-3 p-2 bg-[#7FA894]/20 border border-[#7FA894]/40 rounded-xl text-center text-xs font-bold text-[#7FA894]">
                  ✓ Streak Secured for Today!
                </div>
              )}
            </div>
          )}
        </div>

        {/* XP Level Ring Badge */}
        <div className="relative">
          <button
            id="chip-xp-level-ring"
            onClick={() => {
              setShowXpPopover(!showXpPopover);
              setShowDailyGoalPopover(false);
              setShowNotifications(false);
            }}
            title={`Level ${levelInfo.level} • ${xp} XP (${levelInfo.progress}% to next)`}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1 bg-[#16241F]/80 backdrop-blur-md rounded-2xl border border-[#7FA894]/30 shadow-xs cursor-pointer hover:border-[#E8B04B]/50 transition-all font-['IBM_Plex_Mono',monospace]"
          >
            {/* Circular Progress Ring */}
            <div className="relative w-8 h-8 flex items-center justify-center">
              <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r={ringRadius}
                  className="stroke-[#0B1613]"
                  strokeWidth="3"
                  fill="none"
                />
                <circle
                  cx="18"
                  cy="18"
                  r={ringRadius}
                  className="stroke-[#E8B04B] transition-all duration-500 ease-out"
                  strokeWidth="3"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              <span className="absolute text-[11px] font-bold text-[#F5F1E8]">
                {levelInfo.level}
              </span>
            </div>
            <div className="text-left leading-none hidden sm:block">
              <span className="text-[10px] text-[#7FA894] block">LVL</span>
              <span className="text-xs font-bold text-[#E8B04B]">{xp} XP</span>
            </div>
          </button>

          {/* Level Progress Popover */}
          {showXpPopover && (
            <div
              id="xp-level-popover"
              className="absolute right-0 mt-2 w-64 bg-[#16241F] rounded-2xl border border-[#7FA894]/30 shadow-2xl p-3.5 z-50 animate-in fade-in slide-in-from-top-2 font-['IBM_Plex_Mono',monospace]"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#7FA894]/20">
                <span className="text-xs font-bold text-[#F5F1E8]">Level {levelInfo.level}</span>
                <span className="text-[10px] text-[#E8B04B]">{xp} XP Total</span>
              </div>
              <div className="my-2.5">
                <div className="flex justify-between text-[10px] text-[#7FA894] mb-1">
                  <span>Level Progress</span>
                  <span>{levelInfo.progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#0B1613] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#E8B04B] transition-all duration-300 rounded-full"
                    style={{ width: `${levelInfo.progress}%` }}
                  />
                </div>
              </div>
              <p className="text-[10px] text-[#7FA894] leading-relaxed">
                Formula: level = floor(sqrt(XP/50)). Earn XP via Form Check reps and daily biometric logs.
              </p>
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            id="btn-notifications"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowAppGrid(false);
              setShowXpPopover(false);
              setShowDailyGoalPopover(false);
            }}
            aria-label="Notifications"
            className="w-9 h-9 rounded-full bg-[#16241F]/80 backdrop-blur-md border border-[#7FA894]/30 flex items-center justify-center text-[#7FA894] hover:text-[#E8B04B] hover:border-[#E8B04B]/40 transition-all shadow-xs cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#C1553B] ring-2 ring-[#0B1613]" />
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div
              id="notifications-popover"
              className="absolute right-0 mt-2 w-80 bg-[#16241F] rounded-2xl border border-[#7FA894]/30 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#7FA894]/20">
                <span className="text-xs font-bold text-[#F5F1E8] font-['IBM_Plex_Mono',monospace] uppercase tracking-wider">
                  Notifications
                </span>
                <span className="text-[10px] text-[#E8B04B] font-medium cursor-pointer hover:underline">
                  Mark all as read
                </span>
              </div>
              <div className="divide-y divide-[#7FA894]/10 mt-1">
                {notifications.map((n) => (
                  <div key={n.id} className="py-2 px-1 text-xs hover:bg-[#0B1613]/50 rounded-lg transition-colors">
                    <p className="text-[#F5F1E8] font-medium leading-snug">{n.text}</p>
                    <span className="text-[10px] text-[#7FA894] font-['IBM_Plex_Mono',monospace] mt-0.5 block">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RBAC Portal Role Pill */}
        <button
          id="btn-header-passkey-auth"
          onClick={onOpenAuth}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-xs font-['IBM_Plex_Mono',monospace] transition-all cursor-pointer ${
            authUser.role !== 'MEMBER'
              ? `${permissions.badgeBg} ${permissions.badgeColor} shadow-md`
              : 'bg-[#16241F]/80 border-[#7FA894]/30 text-[#7FA894] hover:text-[#F5F1E8]'
          }`}
          title="RBAC Role Switcher"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="font-semibold text-[11px] hidden sm:inline">{authUser.role}</span>
        </button>

        {/* User Profile Pill with Rank Chip Under Name */}
        <div
          id="user-profile-pill"
          onClick={() => {
            if (onOpenProfile) {
              onOpenProfile();
            } else {
              onNavigate?.('#/you');
            }
          }}
          className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 bg-[#16241F]/80 backdrop-blur-md rounded-2xl border border-[#7FA894]/30 shadow-xs cursor-pointer hover:border-[#E8B04B]/50 transition-colors"
          title="Click to edit profile"
        >
          <div className="relative w-8 h-8 rounded-full overflow-hidden ring-1 ring-[#7FA894]/40 shrink-0 bg-[#0B1613] flex items-center justify-center">
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
          <div className="flex flex-col text-left leading-none max-w-[110px]">
            <span className="text-xs font-bold text-[#F5F1E8] truncate">{profile.name}</span>
            {/* Rank chip under name: Fraunces italic title + tier glyph */}
            <div
              id="user-rank-chip"
              className="flex items-center gap-1 text-[11px] text-[#E8B04B] font-['Fraunces',serif] italic mt-0.5"
            >
              <span className="not-italic text-[10px] text-[#7FA894]">{tierGlyph}</span>
              <span className="truncate">{rank.name}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
