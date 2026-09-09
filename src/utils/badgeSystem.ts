import { Badge } from '../types';

export const INITIAL_BADGES: Badge[] = [
  {
    id: 'first_light',
    name: 'First Light',
    description: 'Complete your first biometric intake & baseline log.',
    iconName: 'SunMedium',
    unlocked: true,
    unlockedAt: 'Day 1',
    category: 'core'
  },
  {
    id: 'circadian',
    name: 'Circadian',
    description: 'Maintain a consistent 7-day Sleep recovery streak.',
    iconName: 'Moon',
    unlocked: true,
    unlockedAt: 'Day 7',
    category: 'biometric'
  },
  {
    id: 'verified_body',
    name: 'Verified Body',
    description: 'Complete your first on-device computer vision Form Check session.',
    iconName: 'ShieldCheck',
    unlocked: true,
    unlockedAt: 'Verified',
    category: 'core'
  },
  {
    id: 'keystone_node',
    name: 'Keystone Node',
    description: 'Elevate any biometric node to a high-capacity score of ≥ 80.',
    iconName: 'Sparkles',
    unlocked: false,
    category: 'mastery'
  },
  {
    id: 'full_web',
    name: 'Full Web',
    description: 'Harmonize all 6 biometric dimensions to ≥ 60 capacity.',
    iconName: 'Network',
    unlocked: false,
    category: 'mastery'
  },
  {
    id: 'honest_week',
    name: 'Honest Week',
    description: 'Log telemetry and activities across 7 consecutive straight days.',
    iconName: 'Flame',
    unlocked: true,
    unlockedAt: 'Day 7',
    category: 'streak'
  }
];

export interface BadgeEvaluationContext {
  totalLogs: number;
  formSessionsCount: number;
  streakDays: number;
  sleepStreak: number;
  profile: Record<string, number>;
}

export function evaluateBadges(
  currentBadges: Badge[],
  ctx: BadgeEvaluationContext
): { updatedBadges: Badge[]; newlyUnlocked: Badge[] } {
  const newlyUnlocked: Badge[] = [];

  const updatedBadges = currentBadges.map((badge) => {
    if (badge.unlocked) return badge;

    let isUnlocked = false;
    switch (badge.id) {
      case 'first_light':
        isUnlocked = ctx.totalLogs >= 1;
        break;
      case 'circadian':
        isUnlocked = ctx.sleepStreak >= 7;
        break;
      case 'verified_body':
        isUnlocked = ctx.formSessionsCount >= 1;
        break;
      case 'keystone_node':
        isUnlocked = Object.values(ctx.profile).some((v) => v >= 80);
        break;
      case 'full_web':
        isUnlocked = Object.values(ctx.profile).every((v) => v >= 60);
        break;
      case 'honest_week':
        isUnlocked = ctx.streakDays >= 7;
        break;
      default:
        break;
    }

    if (isUnlocked) {
      const unlockedBadge = {
        ...badge,
        unlocked: true,
        unlockedAt: 'Just now'
      };
      newlyUnlocked.push(unlockedBadge);
      return unlockedBadge;
    }

    return badge;
  });

  return { updatedBadges, newlyUnlocked };
}
