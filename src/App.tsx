import React, { useEffect, useState, useMemo } from 'react';
import { Header } from './components/Header';
import { WebOnBodyHero } from './components/WebOnBodyHero';
import { BmiCard } from './components/BmiCard';
import { QuickAppointmentsCard, initialAppointments } from './components/QuickAppointmentsCard';
import { StepCountCard } from './components/StepCountCard';
import { MovementCard } from './components/MovementCard';
import { HealthOverviewPanel } from './components/HealthOverviewPanel';
import { FormCheckScreen } from './components/FormCheckScreen';
import { YouScreen } from './components/YouScreen';
import { CalendarModal } from './components/CalendarModal';
import { MetricDetailModal } from './components/MetricDetailModal';
import { AppointmentDetailModal } from './components/AppointmentDetailModal';
import { ProfileBottomSheet } from './components/ProfileBottomSheet';
import { NodePlaybookModal } from './components/NodePlaybookModal';
import { CorrelationEngineModal } from './components/CorrelationEngineModal';
import { HealthDataImportModal } from './components/HealthDataImportModal';
import { LocalVaultModal } from './components/LocalVaultModal';
import { AuthModal } from './components/AuthModal';
import { ClinicalExportModal } from './components/ClinicalExportModal';
import { ClinicianPortalView } from './components/ClinicianPortalView';
import { localVault } from './utils/localVault';
import { authService, AuthUser } from './utils/authService';
import { indexedDbService } from './utils/indexedDbService';
import {
  Appointment,
  VitalMetrics,
  FormSessionSummary,
  Badge,
  HistoryEntry,
  UserProfile,
  ImportedHealthPayload
} from './types';
import {
  LayoutDashboard,
  Sparkles,
  Calendar,
  CheckCircle2,
  X,
  Award,
  Flame,
  Activity,
  WifiOff,
  Download,
  Network,
  Smartphone,
  Share
} from 'lucide-react';
import { computeNIS, computeRank, pointsFor, RankInfo, TIER_GLYPHS } from './utils/nexusEngine';
import { INITIAL_BADGES, evaluateBadges } from './utils/badgeSystem';

const DEFAULT_PROFILE: UserProfile = {
  name: 'Robert Smith',
  age: 28,
  sex: 'Male',
  pronouns: 'He/Him',
  avatarUrl: '',
  focusNodes: ['sleep', 'movement'],
  heightCm: 170,
  weightKg: 72
};

export default function App() {
  // Routing State
  const [currentRoute, setCurrentRoute] = useState<string>(() => window.location.hash || '#/');

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentRoute(window.location.hash || '#/');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (route: string) => {
    window.location.hash = route;
    setCurrentRoute(route);
  };

  // Offline status & PWA support
  const [isOffline, setIsOffline] = useState<boolean>(() => !navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIosSheet, setShowIosSheet] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setToast({
        title: 'Installed — see you on your home screen',
        subtitle: 'Nexus Standalone Ready',
        quiet: false
      });
      setTimeout(() => setToast(null), 4500);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    // iOS Safari check for non-standalone
    const isIos = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone =
      (typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)')?.matches) ||
      (typeof navigator !== 'undefined' && (navigator as any).standalone === true);
    const isIosDismissed = typeof localStorage !== 'undefined' ? localStorage.getItem('nexus_ios_sheet_dismissed') === 'true' : false;

    if (isIos && !isStandalone && !isIosDismissed) {
      setShowIosSheet(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleTriggerInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice && choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIos) {
        setShowIosSheet(true);
      } else {
        setToast({
          title: 'Nexus PWA Ready',
          subtitle: 'Use browser menu (⋮) → "Install app" or "Add to Home screen"',
          quiet: true
        });
        setTimeout(() => setToast(null), 4500);
      }
    }
  };

  // Local Vault & Modal State
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isClinicalExportOpen, setIsClinicalExportOpen] = useState(false);
  const [selectedPlaybookNode, setSelectedPlaybookNode] = useState<string | null>(null);
  const [isCorrelationOpen, setIsCorrelationOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [activeAuthUser, setActiveAuthUser] = useState<AuthUser>(authService.getCurrentUser());

  useEffect(() => {
    const unsub = authService.subscribe((u) => {
      if (u) setActiveAuthUser(u);
    });
    return unsub;
  }, []);

  // User Profile State (Encrypted & Persisted via Local Vault AES-GCM-256)
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  // Economy & Gamification State (XP, Streak, Logs)
  const [xp, setXp] = useState<number>(240);
  const [streakDays, setStreakDays] = useState<number>(7);
  const [totalLogs, setTotalLogs] = useState<number>(12);

  // Badges State & Shelf
  const [badges, setBadges] = useState<Badge[]>(INITIAL_BADGES);

  // Global NIS Weekly History State
  const [history, setHistory] = useState<HistoryEntry[]>([
    { week: 'W1', nis: 52, timestamp: Date.now() - 86400000 * 21 },
    { week: 'W2', nis: 56, timestamp: Date.now() - 86400000 * 14 },
    { week: 'W3', nis: 58, timestamp: Date.now() - 86400000 * 7 },
    { week: 'Current', nis: 61, timestamp: Date.now() }
  ]);

  // Movement Score & Form Check Sessions State
  const [movementScore, setMovementScore] = useState<number>(78);
  const [hasMovementRipple, setHasMovementRipple] = useState<boolean>(false);
  const [hasMarrowRankRipple, setHasMarrowRankRipple] = useState<boolean>(false);
  const [rankUpBanner, setRankUpBanner] = useState<string | null>(null);

  const [formSessions, setFormSessions] = useState<FormSessionSummary[]>([
    {
      ts: Date.now() - 3600000 * 2,
      exercise: 'squat',
      reps: 8,
      technique: 85,
      deviations: { depth_short: 1 },
      objectiveScore: 78
    }
  ]);

  // Profile Biometrics (Default 42/47/61/68/70/78)
  const [biometricProfile, setBiometricProfile] = useState({
    sleep: 42,
    nutrition: 47,
    readiness: 61,
    stress: 68,
    hrv: 70,
    movement: 78
  });

  // Vitals State
  const [vitals, setVitals] = useState<VitalMetrics>({
    bloodSugar: 80,
    bloodStatusMin: 80,
    bloodStatusMax: 90,
    heartRate: 120,
    bloodPressureSys: 80,
    bloodPressureDia: 120,
  });

  // Appointments State
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Modals
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedMetricForModal, setSelectedMetricForModal] = useState<string | null>(null);

  // Initial Asynchronous Hydration from Local Vault (Zero-Knowledge Decryption)
  useEffect(() => {
    let isMounted = true;
    const hydrateFromVault = async () => {
      const params = new URLSearchParams(window.location.search);
      const isSeed = params.get('seed') === '1';

      if (!isSeed) {
        const savedProfile = await localVault.getItem<UserProfile>('healthlog_user_profile', DEFAULT_PROFILE);
        const savedXp = await localVault.getItem<number>('healthlog_xp', 240);
        const savedStreak = await localVault.getItem<number>('healthlog_streak_days', 7);
        const savedLogs = await localVault.getItem<number>('healthlog_total_logs', 12);
        const savedBiometrics = await localVault.getItem<typeof biometricProfile>('healthlog_biometrics', biometricProfile);
        const savedVitals = await localVault.getItem<VitalMetrics>('healthlog_vitals', vitals);
        const savedAppointments = await localVault.getItem<Appointment[]>('healthlog_appointments', initialAppointments);
        const savedSessions = await localVault.getItem<FormSessionSummary[]>('healthlog_form_sessions', formSessions);
        const savedBadges = await localVault.getItem<Badge[]>('healthlog_badges', INITIAL_BADGES);
        const savedHistory = await localVault.getItem<HistoryEntry[]>('healthlog_history', history);

        if (isMounted) {
          if (savedProfile) setUserProfile(savedProfile);
          if (typeof savedXp === 'number') setXp(savedXp);
          if (typeof savedStreak === 'number') setStreakDays(savedStreak);
          if (typeof savedLogs === 'number') setTotalLogs(savedLogs);
          if (savedBiometrics) {
            setBiometricProfile(savedBiometrics);
            if (savedBiometrics.movement) setMovementScore(savedBiometrics.movement);
          }
          if (savedVitals) setVitals(savedVitals);
          if (savedAppointments && savedAppointments.length > 0) setAppointments(savedAppointments);
          if (savedSessions && savedSessions.length > 0) setFormSessions(savedSessions);
          if (savedBadges && savedBadges.length > 0) setBadges(savedBadges);
          if (savedHistory && savedHistory.length > 0) setHistory(savedHistory);
        }
      }
    };

    hydrateFromVault();

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync encrypted profile to Local Vault
  useEffect(() => {
    localVault.setItem('healthlog_user_profile', userProfile);
  }, [userProfile]);

  // Sync encrypted XP, Streak, Logs
  useEffect(() => {
    localVault.setItem('healthlog_xp', xp);
    localVault.setItem('healthlog_streak_days', streakDays);
    localVault.setItem('healthlog_total_logs', totalLogs);
  }, [xp, streakDays, totalLogs]);

  // Sync encrypted Biometrics & History
  useEffect(() => {
    localVault.setItem('healthlog_biometrics', biometricProfile);
  }, [biometricProfile]);

  useEffect(() => {
    localVault.setItem('healthlog_history', history);
  }, [history]);

  // Sync encrypted Vitals
  useEffect(() => {
    localVault.setItem('healthlog_vitals', vitals);
  }, [vitals]);

  // Sync encrypted Appointments
  useEffect(() => {
    localVault.setItem('healthlog_appointments', appointments);
  }, [appointments]);

  // Sync encrypted Form Sessions
  useEffect(() => {
    localVault.setItem('healthlog_form_sessions', formSessions);
  }, [formSessions]);

  // Sync encrypted Badges
  useEffect(() => {
    localVault.setItem('healthlog_badges', badges);
  }, [badges]);

  // BMI & Body Measurements State (single source synced with userProfile)
  const heightCm = userProfile.heightCm || 170;
  const weightKg = userProfile.weightKg || 72;

  const handleHeightChange = (newHeight: number) => {
    setUserProfile((prev) => ({ ...prev, heightCm: newHeight }));
  };

  const handleWeightChange = (newWeight: number) => {
    setUserProfile((prev) => ({ ...prev, weightKg: newWeight }));
  };

  useEffect(() => {
    setBiometricProfile((prev) => ({ ...prev, movement: movementScore }));
  }, [movementScore]);

  const nis = useMemo(() => computeNIS(biometricProfile), [biometricProfile]);

  // Push latest NIS to history when it updates
  useEffect(() => {
    setHistory((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.nis === nis) return prev;
      return [...prev.slice(0, -1), { ...last, nis }];
    });
  }, [nis]);

  const rank = useMemo<RankInfo>(() => {
    return computeRank(biometricProfile, {
      totalLogs,
      formSessions: formSessions.length,
      streakDays
    });
  }, [biometricProfile, totalLogs, formSessions.length, streakDays]);

  // Track previous rank tier to trigger rank-up marrow ripple and banner
  const [prevTier, setPrevTier] = useState<number>(rank.tier);

  useEffect(() => {
    if (rank.tier > prevTier) {
      setHasMarrowRankRipple(true);
      setRankUpBanner(`You are now ${rank.name}`);
      setTimeout(() => {
        setHasMarrowRankRipple(false);
      }, 3500);
      setPrevTier(rank.tier);
    } else if (rank.tier < prevTier) {
      setPrevTier(rank.tier);
    }
  }, [rank.tier, rank.name, prevTier]);

  // Quiet Toast Notification State
  const [toast, setToast] = useState<{ title: string; subtitle: string; quiet?: boolean } | null>(null);

  const showTwoLineToast = (title: string, earnedXp: number) => {
    setToast({
      title,
      subtitle: `+${earnedXp} XP · ${rank.name}`
    });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const showQuietBadgeToast = (badgeName: string) => {
    setToast({
      title: `✦ Badge Unlocked: ${badgeName}`,
      subtitle: `View on #/you shelf`,
      quiet: true
    });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Evaluate badge unlocks whenever relevant metrics change
  useEffect(() => {
    const { updatedBadges, newlyUnlocked } = evaluateBadges(badges, {
      totalLogs,
      formSessionsCount: formSessions.length,
      streakDays,
      sleepStreak: 7,
      profile: biometricProfile
    });

    if (newlyUnlocked.length > 0) {
      setBadges(updatedBadges);
      newlyUnlocked.forEach((b) => {
        showQuietBadgeToast(b.name);
      });
    }
  }, [totalLogs, formSessions.length, streakDays, biometricProfile]);

  const handleHeartRateChange = (bpm: number) => {
    setVitals((prev) => ({ ...prev, heartRate: bpm }));
    const earnedXp = pointsFor('log', streakDays);
    setXp((prev) => prev + earnedXp);
    setTotalLogs((prev) => prev + 1);
    showTwoLineToast('Heart rate telemetry updated', earnedXp);
  };

  const handleUpdateVitals = (partial: Partial<VitalMetrics>) => {
    setVitals((prev) => ({ ...prev, ...partial }));
    const earnedXp = pointsFor('log', streakDays);
    setXp((prev) => prev + earnedXp);
    setTotalLogs((prev) => prev + 1);
    showTwoLineToast('Vitals biometrics updated', earnedXp);
  };

  const handleAddAppointment = (newApt: Appointment) => {
    setAppointments((prev) => [newApt, ...prev]);
    const earnedXp = pointsFor('intake', streakDays);
    setXp((prev) => prev + earnedXp);
    setTotalLogs((prev) => prev + 1);
    showTwoLineToast('Appointment scheduled', earnedXp);
  };

  // Economy: Form session = technique / 4 points
  const handleFeedWeb = (summary: FormSessionSummary, newMovementScore: number) => {
    const earnedXp = Math.round(summary.technique / 4);
    setMovementScore(newMovementScore);
    setFormSessions((prev) => [summary, ...prev]);
    setTotalLogs((prev) => prev + 1);
    setXp((prev) => prev + earnedXp);
    setHasMovementRipple(true);

    // Also persist detailed kinematics to IndexedDB heavy storage
    indexedDbService.saveKinematicSession({
      id: `kin_${Date.now()}`,
      exercise: summary.exercise,
      reps: summary.reps,
      technique: summary.technique,
      objectiveScore: summary.objectiveScore,
      deviations: summary.deviations,
      timestamp: Date.now(),
      keypointsSample: [
        { time: 0, hipAngle: 175, kneeAngle: 178, depthRatio: 0.1 },
        { time: 1200, hipAngle: 88, kneeAngle: 85, depthRatio: 1.05 },
        { time: 2400, hipAngle: 172, kneeAngle: 176, depthRatio: 0.12 }
      ]
    }).catch(console.error);

    showTwoLineToast('Movement verified — web updated', earnedXp);

    setTimeout(() => {
      setHasMovementRipple(false);
    }, 2800);
  };

  // Apply Imported Health Data from Wearable File
  const handleApplyImportedData = (payload: ImportedHealthPayload) => {
    if (payload.extracted.restingHeartRate) {
      setVitals((prev) => ({ ...prev, heartRate: payload.extracted.restingHeartRate! }));
    }
    if (payload.extracted.hrvAvg) {
      setBiometricProfile((prev) => ({ ...prev, hrv: payload.extracted.hrvAvg! }));
    }
    if (payload.extracted.avgSleepHours) {
      const sleepScore = Math.min(100, Math.round(payload.extracted.avgSleepHours * 11));
      setBiometricProfile((prev) => ({ ...prev, sleep: sleepScore }));
    }

    const earnedXp = 50;
    setXp((prev) => prev + earnedXp);
    setTotalLogs((prev) => prev + payload.totalRecords);
    showTwoLineToast(`Ingested ${payload.totalRecords} points from ${payload.source}`, earnedXp);
  };

  // Data Export & Dissolve Handlers
  const handleExportData = () => {
    const exportBundle = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      profile: userProfile,
      nis,
      rank,
      xp,
      streakDays,
      totalLogs,
      biometrics: biometricProfile,
      vitals,
      history,
      formSessions,
      badges
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportBundle, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `healthlog_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showTwoLineToast('Profile & Telemetry JSON Exported', 10);
  };

  const handleDissolveData = () => {
    localVault.clearVault();
    localStorage.clear();
    setUserProfile(DEFAULT_PROFILE);
    setXp(240);
    setStreakDays(7);
    setTotalLogs(12);
    setMovementScore(78);
    setFormSessions([]);
    setBadges(INITIAL_BADGES);
    showTwoLineToast('All local telemetry dissolved & wiped', 0);
  };

  const isFormRoute = currentRoute === '#/form';
  const isYouRoute = currentRoute === '#/you';

  return (
    <div className="min-h-screen bg-[#0B1613] text-[#F5F1E8] pb-24 md:pb-16 font-['IBM_Plex_Sans',sans-serif] relative overflow-x-hidden">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#7FA894]/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-[#E8B04B]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-[#C1553B]/10 rounded-full blur-3xl" />

        {/* Marrow ripple wave across the web upon Rank-up */}
        {hasMarrowRankRipple && (
          <div
            id="marrow-rank-ripple"
            className="absolute inset-0 flex items-center justify-center pointer-events-none animate-ping duration-1000"
          >
            <div className="w-[800px] h-[800px] rounded-full border-4 border-[#E8B04B]/60 bg-[#E8B04B]/10 blur-xl" />
          </div>
        )}
      </div>

      {/* Offline fixed top pill banner */}
      {isOffline && (
        <div
          id="offline-banner"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[#16241F]/95 backdrop-blur-md border border-[#E8B04B]/60 text-[#F5F1E8] text-xs font-['IBM_Plex_Mono',monospace] rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <WifiOff className="w-3.5 h-3.5 text-[#E8B04B]" />
          <span>Offline — your web and playbook are cached.</span>
        </div>
      )}

      {/* Rank Up Top Banner ("You are now <title>") */}
      {rankUpBanner && (
        <div
          id="rank-up-banner"
          className="sticky top-0 z-50 w-full bg-gradient-to-r from-[#E8B04B] via-[#E8B04B]/95 to-[#7FA894] text-[#0B1613] px-4 py-2.5 shadow-xl flex items-center justify-between animate-in slide-in-from-top-4 duration-300"
        >
          <div className="max-w-7xl mx-auto flex items-center gap-3 w-full">
            <div className="w-7 h-7 rounded-full bg-[#0B1613] text-[#E8B04B] flex items-center justify-center font-bold text-sm shadow-md">
              <Award className="w-4 h-4" />
            </div>
            <div className="flex-1 flex items-center gap-2 font-['Fraunces',serif]">
              <span className="font-bold text-base sm:text-lg tracking-tight">{rankUpBanner}</span>
              <span className="text-xs font-['IBM_Plex_Mono',monospace] px-2 py-0.5 bg-[#0B1613]/20 rounded-full font-bold">
                Tier {rank.tier + 1}
              </span>
            </div>
            <button
              onClick={() => setRankUpBanner(null)}
              className="text-[#0B1613] hover:bg-[#0B1613]/10 p-1.5 rounded-full cursor-pointer transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="relative z-10">
        {/* 1. Top Navigation Header */}
        <Header
          currentRoute={currentRoute}
          onNavigate={navigateTo}
          onOpenCalendar={() => setIsCalendarOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
          onSearchChange={(q) => console.log('Searching:', q)}
          profile={userProfile}
          xp={xp}
          nis={nis}
          streakDays={streakDays}
          rank={rank}
        />

        {/* Main View Switcher */}
        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-2">
          {isFormRoute ? (
            <FormCheckScreen
              movementScore={movementScore}
              recentSessions={formSessions}
              onFeedWeb={handleFeedWeb}
              onNavigateHome={() => navigateTo('#/')}
            />
          ) : isYouRoute ? (
            <YouScreen
              rank={rank}
              nis={nis}
              xp={xp}
              streakDays={streakDays}
              totalLogs={totalLogs}
              badges={badges}
              history={history}
              formSessions={formSessions}
              movementScore={movementScore}
              profile={userProfile}
              onOpenProfile={() => setIsProfileOpen(true)}
              onExportData={handleExportData}
              onDissolveData={handleDissolveData}
              onNavigateHome={() => navigateTo('#/')}
              onOpenFormCheck={() => navigateTo('#/form')}
              onOpenCorrelations={() => setIsCorrelationOpen(true)}
              onOpenDataImport={() => setIsImportOpen(true)}
              onInstallApp={handleTriggerInstall}
              onOpenVault={() => setIsVaultOpen(true)}
              onOpenAuth={() => setIsAuthOpen(true)}
              onOpenClinicalExport={() => setIsClinicalExportOpen(true)}
              onToast={(msg) => showTwoLineToast(msg, 10)}
            />
          ) : (
            <div className="space-y-8 pb-8">
              {/* Clinician / Specialist Portal Bar (visible if Physician, Trainer, or Specialist) */}
              <ClinicianPortalView
                userProfile={userProfile}
                vitals={vitals}
                biometricProfile={biometricProfile}
                onOpenExport={() => setIsClinicalExportOpen(true)}
                onOpenAuth={() => setIsAuthOpen(true)}
                onToast={(msg) => showTwoLineToast(msg, 20)}
              />

              {/* Landing PWA Install CTA Banner if install prompt captured */}
              {deferredPrompt && (
                <div
                  id="pwa-landing-cta"
                  className="p-4 rounded-3xl bg-[#16241F]/90 border border-[#E8B04B]/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-300 font-['IBM_Plex_Sans',sans-serif]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#0d241c] border border-[#E8B04B]/50 flex items-center justify-center text-[#E8B04B] shrink-0">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#F5F1E8] font-['Fraunces',serif]">
                        Install Nexus — The Longevity Web
                      </h4>
                      <p className="text-xs text-[#7FA894]">
                        Standalone bio-web with offline cached playbook & real-time telemetry.
                      </p>
                    </div>
                  </div>
                  <button
                    id="btn-landing-install"
                    onClick={handleTriggerInstall}
                    className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-[#E8B04B] hover:bg-[#E8B04B]/90 text-[#0B1613] text-xs font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-[#E8B04B]/20 shrink-0"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Install App</span>
                  </button>
                </div>
              )}

              {/* PRIMARY HERO: Web-On-Body Master Composition */}
              <WebOnBodyHero
                nis={nis}
                biometricProfile={biometricProfile}
                profile={userProfile}
                heartRate={vitals.heartRate}
                vitals={vitals}
                rank={rank}
                streakDays={streakDays}
                onOpenProfile={() => setIsProfileOpen(true)}
                onOpenNodePlaybook={(nodeId) => {
                  setSelectedPlaybookNode(nodeId);
                }}
                onOpenFormCheck={() => navigateTo('#/form')}
                onOpenCalendar={() => setIsCalendarOpen(true)}
              />

              {/* SECONDARY SECTION: Detailed Metrics Dashboard */}
              <div className="pt-2 border-t border-[#7FA894]/20 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#E8B04B]" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-[#7FA894] font-['IBM_Plex_Mono',monospace]">
                      Biometric Modules & Telemetry
                    </h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsCorrelationOpen(true)}
                      className="text-xs text-[#E8B04B] hover:underline font-['IBM_Plex_Mono',monospace] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Network className="w-3.5 h-3.5" />
                      <span>Causal Correlations</span>
                    </button>
                    <span className="text-xs text-[#7FA894] font-['IBM_Plex_Mono',monospace]">
                      Live Synced
                    </span>
                  </div>
                </div>

                {/* Top Section: BMI Card (Left) + Stack of Cards (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  {/* Left: BMI Calculator Card (4 Cols on lg) */}
                  <div className="lg:col-span-4 flex">
                    <BmiCard
                      heightCm={heightCm}
                      weightKg={weightKg}
                      onHeightChange={handleHeightChange}
                      onWeightChange={handleWeightChange}
                    />
                  </div>

                  {/* Right: Stack of Movement, Appointments & Step Count (8 Cols on lg) */}
                  <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Movement Playbook Card with Ripple Effect */}
                    <MovementCard
                      movementScore={movementScore}
                      hasRipple={hasMovementRipple}
                      recentSessions={formSessions}
                      onOpenFormCheck={() => navigateTo('#/form')}
                    />

                    {/* Step Count Card */}
                    <StepCountCard initialSteps={7166} />

                    {/* Quick Appointments Card (Full span on md) */}
                    <div className="md:col-span-2">
                      <QuickAppointmentsCard
                        onOpenCalendar={() => setIsCalendarOpen(true)}
                        onSelectAppointment={setSelectedAppointment}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Section: Health Overview Panel (Full Width) */}
                <div>
                  <HealthOverviewPanel
                    vitals={vitals}
                    onHeartRateChange={handleHeartRateChange}
                    onOpenMetricModal={(name) => setSelectedMetricForModal(name)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Verbatim Persistent Clinical & Wellness Disclaimer */}
          <footer
            id="persistent-nexus-disclaimer"
            role="contentinfo"
            className="w-full mt-10 mb-16 p-4 rounded-2xl bg-[#0B1613]/90 border border-[#7FA894]/25 text-center text-xs text-[#7FA894] font-['IBM_Plex_Sans',sans-serif] leading-relaxed shadow-lg"
          >
            <p className="max-w-3xl mx-auto">
              Nexus Longevity is an informational biological telemetry visualization and optimization tool. It does not provide medical advice, diagnosis, treatment, or cures. Always consult a qualified healthcare professional before beginning any new protocol or exercise program.
            </p>
          </footer>
        </main>
      </div>

      {/* Floating Bottom Navigation Bar (Mobile & Quick Access) */}
      <div
        id="bottom-nav-bar"
        className="fixed bottom-4 inset-x-0 z-40 flex justify-center px-4 pointer-events-none"
      >
        <div className="pointer-events-auto bg-[#16241F]/90 backdrop-blur-lg border border-[#7FA894]/30 rounded-full px-3 py-2 shadow-2xl flex items-center gap-2 font-['IBM_Plex_Mono',monospace] text-xs">
          <button
            id="bottom-nav-web"
            onClick={() => navigateTo('#/')}
            className={`min-h-[44px] px-4 py-2 rounded-full transition-all cursor-pointer flex items-center gap-2 ${
              !isFormRoute && !isYouRoute
                ? 'bg-[#E8B04B] text-[#0B1613] font-bold shadow-md shadow-[#E8B04B]/20'
                : 'text-[#7FA894] hover:text-[#F5F1E8] hover:bg-[#0B1613]/50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            id="bottom-nav-form"
            onClick={() => navigateTo('#/form')}
            className={`min-h-[44px] px-4 py-2 rounded-full transition-all cursor-pointer flex items-center gap-2 ${
              isFormRoute
                ? 'bg-[#E8B04B] text-[#0B1613] font-bold shadow-md shadow-[#E8B04B]/20'
                : 'text-[#7FA894] hover:text-[#F5F1E8] hover:bg-[#0B1613]/50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Form</span>
          </button>

          <button
            id="bottom-nav-you"
            onClick={() => navigateTo('#/you')}
            className={`min-h-[44px] px-4 py-2 rounded-full transition-all cursor-pointer flex items-center gap-2 ${
              isYouRoute
                ? 'bg-[#E8B04B] text-[#0B1613] font-bold shadow-md shadow-[#E8B04B]/20'
                : 'text-[#7FA894] hover:text-[#F5F1E8] hover:bg-[#0B1613]/50'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>You</span>
          </button>

          <button
            id="bottom-nav-calendar"
            onClick={() => setIsCalendarOpen(true)}
            className="min-h-[44px] px-3.5 py-2 rounded-full text-[#7FA894] hover:text-[#F5F1E8] hover:bg-[#0B1613]/50 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden xs:inline">Calendar</span>
          </button>
        </div>
      </div>

      {/* Two-Line Log & Quiet Unlock Toast ("+N XP · <rank>" or "✦ Badge Unlocked") */}
      {toast && (
        <div
          id="web-update-toast"
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 font-['IBM_Plex_Mono',monospace] ${
            toast.quiet
              ? 'bg-[#16241F]/95 text-[#F5F1E8] border border-[#7FA894]/40'
              : 'bg-[#16241F] text-[#F5F1E8] border border-[#E8B04B]/80'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              toast.quiet ? 'bg-[#7FA894]/20 text-[#7FA894]' : 'bg-[#E8B04B]/20 text-[#E8B04B]'
            }`}
          >
            {toast.quiet ? <Award className="w-5 h-5 text-[#E8B04B]" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-xs font-bold text-[#F5F1E8] leading-tight">{toast.title}</div>
            <div
              className={`text-xs font-semibold mt-0.5 leading-tight ${
                toast.quiet ? 'text-[#7FA894]' : 'text-[#E8B04B]'
              }`}
            >
              {toast.subtitle}
            </div>
          </div>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-[#7FA894] hover:text-[#F5F1E8] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Profile Bottom Sheet Modal */}
      <ProfileBottomSheet
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={userProfile}
        onSaveProfile={(updated) => {
          setUserProfile(updated);
          showTwoLineToast('Profile & Biometrics Saved', 15);
        }}
        onExportData={handleExportData}
        onDissolveData={handleDissolveData}
      />

      {/* Node Playbook Interactive Micro-Tools Modal */}
      <NodePlaybookModal
        nodeId={selectedPlaybookNode}
        score={selectedPlaybookNode ? (biometricProfile as any)[selectedPlaybookNode] || 60 : 60}
        onClose={() => setSelectedPlaybookNode(null)}
        onLaunchFormCheck={() => {
          setSelectedPlaybookNode(null);
          navigateTo('#/form');
        }}
      />

      {/* Biometric Correlation Engine Modal */}
      <CorrelationEngineModal
        isOpen={isCorrelationOpen}
        onClose={() => setIsCorrelationOpen(false)}
      />

      {/* Health Wearable Data Import Modal */}
      <HealthDataImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onApplyImportedData={handleApplyImportedData}
      />

      {/* Interactive Modals */}
      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        appointments={appointments}
        onAddAppointment={handleAddAppointment}
      />

      <MetricDetailModal
        metricName={selectedMetricForModal}
        vitals={vitals}
        onClose={() => setSelectedMetricForModal(null)}
        onUpdateVitals={handleUpdateVitals}
      />

      <AppointmentDetailModal
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
      />

      {/* Local Vault WebCrypto Encryption Modal & Live Inspector */}
      <LocalVaultModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        onExport={handleExportData}
        onDissolve={handleDissolveData}
      />

      {/* Biometric Passkey & RBAC Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onRoleChanged={(newRole) => {
          setActiveAuthUser(authService.getCurrentUser());
          showTwoLineToast(`Authenticated as ${newRole}`, 20);
        }}
        onToast={(msg) => showTwoLineToast(msg, 10)}
      />

      {/* Standardized Health Data Export Modal (HL7 FHIR / CSV / PDF) */}
      <ClinicalExportModal
        isOpen={isClinicalExportOpen}
        onClose={() => setIsClinicalExportOpen(false)}
        userProfile={userProfile}
        vitals={vitals}
        biometricProfile={biometricProfile}
        appointments={appointments}
        badges={badges}
        onToast={(msg) => showTwoLineToast(msg, 15)}
      />

      {/* iOS Safari Non-Standalone Instructions Sheet */}
      {showIosSheet && (
        <div
          id="ios-install-sheet"
          className="fixed inset-x-0 bottom-4 z-50 px-4 max-w-md mx-auto animate-in slide-in-from-bottom-6 duration-300 pointer-events-auto"
        >
          <div className="bg-[#16241F]/98 backdrop-blur-xl border border-[#7FA894]/40 rounded-3xl p-5 shadow-2xl space-y-4 font-['IBM_Plex_Sans',sans-serif]">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0d241c] border border-[#E8B04B]/50 flex items-center justify-center text-[#E8B04B]">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#F5F1E8] font-['Fraunces',serif]">Install Nexus on iOS</h3>
                  <p className="text-xs text-[#7FA894]">Add to Home Screen for offline standalone mode</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowIosSheet(false);
                  localStorage.setItem('nexus_ios_sheet_dismissed', 'true');
                }}
                className="text-[#7FA894] hover:text-[#F5F1E8] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-[#0d241c] rounded-2xl border border-[#7FA894]/20 flex items-center gap-3 text-xs text-[#F5F1E8]">
              <div className="w-8 h-8 rounded-xl bg-[#16241F] flex items-center justify-center shrink-0 text-[#E8B04B]">
                <Share className="w-4 h-4" />
              </div>
              <p className="leading-snug">
                Tap <strong className="text-[#E8B04B]">Share</strong> in Safari toolbar, then tap <strong className="text-[#E8B04B]">"Add to Home Screen"</strong>.
              </p>
            </div>

            <button
              onClick={() => {
                setShowIosSheet(false);
                localStorage.setItem('nexus_ios_sheet_dismissed', 'true');
              }}
              className="w-full min-h-[44px] py-2.5 bg-[#E8B04B] hover:bg-[#E8B04B]/90 text-[#0B1613] font-bold text-xs rounded-2xl cursor-pointer transition-colors shadow-md shadow-[#E8B04B]/20"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
