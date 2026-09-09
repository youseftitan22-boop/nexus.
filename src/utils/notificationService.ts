/**
 * Web Push & Habit Reminder Scheduler Service
 * Handles Web Push API permissions, background notifications, and active longevity habit reminders.
 */

export interface LongevityHabit {
  id: string;
  name: string;
  category: 'Circadian' | 'Recovery' | 'Hydration' | 'Cardio';
  description: string;
  intervalHours: number;
  icon: string;
  enabled: boolean;
  lastTriggered?: number;
}

export const DEFAULT_HABITS: LongevityHabit[] = [
  {
    id: 'sunlight',
    name: 'Morning Circadian Lux Window',
    category: 'Circadian',
    description: '10-15 mins direct outdoor sunlight to synchronize retinal ganglion cells and cortisol peak.',
    intervalHours: 24,
    icon: 'Sun',
    enabled: true,
  },
  {
    id: 'breathwork',
    name: '4-7-8 Autonomic Reset',
    category: 'Recovery',
    description: '4 cycles of 4s inhale, 7s hold, 8s exhale to activate vagal tone and lower HR.',
    intervalHours: 4,
    icon: 'Wind',
    enabled: true,
  },
  {
    id: 'hydration',
    name: 'Cellular Hydration & Mineral Balance',
    category: 'Hydration',
    description: 'Drink 400ml water with sodium/potassium electrolytes.',
    intervalHours: 2,
    icon: 'Droplets',
    enabled: true,
  },
  {
    id: 'zone2',
    name: 'Zone 2 Mitochondrial Base Check',
    category: 'Cardio',
    description: '30-45 mins conversational low-lactate aerobic movement.',
    intervalHours: 24,
    icon: 'Activity',
    enabled: false,
  },
];

class NotificationService {
  private habits: LongevityHabit[] = DEFAULT_HABITS;

  constructor() {
    this.loadHabits();
  }

  private loadHabits() {
    try {
      const saved = localStorage.getItem('nexus_longevity_habits');
      if (saved) {
        this.habits = JSON.parse(saved);
      }
    } catch {
      // fallback
    }
  }

  public getHabits(): LongevityHabit[] {
    return this.habits;
  }

  public toggleHabit(habitId: string): void {
    this.habits = this.habits.map((h) =>
      h.id === habitId ? { ...h, enabled: !h.enabled } : h
    );
    localStorage.setItem('nexus_longevity_habits', JSON.stringify(this.habits));
  }

  /**
   * Request native browser notification permissions & subscribe to push notifications
   */
  public async requestPushPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      try {
        // Register mock/VAPID subscription with Express backend
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: { endpoint: 'nexus_local_push_endpoint', keys: { auth: 'aes_demo', p256dh: 'curve_demo' } },
          }),
        });
      } catch {
        // offline safe
      }
    }
    return permission;
  }

  /**
   * Fire or simulate a habit notification
   */
  public async triggerHabitReminder(habitId: string): Promise<{ title: string; body: string }> {
    const habit = this.habits.find((h) => h.id === habitId);
    let title = '🧬 Longevity Habit Checkpoint';
    let body = 'Time for your scheduled biological optimization habit.';

    try {
      const res = await fetch('/api/push/trigger-habit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitType: habitId }),
      });
      const data = await res.json();
      if (data.notification) {
        title = data.notification.title;
        body = data.notification.body;
      }
    } catch {
      if (habit) {
        title = `☀️ ${habit.name}`;
        body = habit.description;
      }
    }

    // Display browser notification if permission granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
        });
      } catch {
        // Service worker fallback
      }
    }

    return { title, body };
  }
}

export const notificationService = new NotificationService();
