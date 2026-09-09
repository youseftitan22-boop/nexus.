/**
 * IndexedDB (idb) Storage & Background Sync Service
 * Designed for heavy datasets (video rep sessions, posture keypoints, raw blood panels)
 * and offline sync queue when operating in airplane mode.
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface KinematicSessionRecord {
  id: string;
  exercise: string;
  repCount?: number;
  reps?: number;
  avgScore?: number;
  technique?: number;
  objectiveScore?: number;
  timestamp: number;
  deviations?: string[] | Record<string, number>;
  keypointsSample?: any;
  keypointsPayload?: any;
}

interface LabPanelRecord {
  id: string;
  panelName: string;
  category: 'Metabolic' | 'Lipid' | 'Inflammation' | 'Hormonal' | 'Genetic';
  biomarkers: Array<{ name: string; value: number; unit: string; range: string; status: 'optimal' | 'borderline' | 'action_needed' }>;
  collectedAt: string;
}

interface OfflineSyncQueueItem {
  id: string;
  action: 'LOG_VITALS' | 'COMPLETE_PLAYBOOK' | 'KINEMATIC_REP' | 'UPDATE_PROFILE';
  payload: any;
  queuedAt: number;
  synced: boolean;
}

interface NexusDBSchema extends DBSchema {
  kinematic_sessions: {
    key: string;
    value: KinematicSessionRecord;
    indexes: { 'by-timestamp': number };
  };
  lab_panels: {
    key: string;
    value: LabPanelRecord;
    indexes: { 'by-category': string };
  };
  offline_sync_queue: {
    key: string;
    value: OfflineSyncQueueItem;
    indexes: { 'by-synced': number };
  };
}

const DB_NAME = 'nexus_longevity_idb';
const DB_VERSION = 1;

class IndexedDbService {
  private dbPromise: Promise<IDBPDatabase<NexusDBSchema>> | null = null;
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.flushOfflineQueue();
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
  }

  private async getDB(): Promise<IDBPDatabase<NexusDBSchema>> {
    if (!this.dbPromise) {
      this.dbPromise = openDB<NexusDBSchema>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('kinematic_sessions')) {
            const kinematicStore = db.createObjectStore('kinematic_sessions', { keyPath: 'id' });
            kinematicStore.createIndex('by-timestamp', 'timestamp');
          }

          if (!db.objectStoreNames.contains('lab_panels')) {
            const labStore = db.createObjectStore('lab_panels', { keyPath: 'id' });
            labStore.createIndex('by-category', 'category');
          }

          if (!db.objectStoreNames.contains('offline_sync_queue')) {
            const queueStore = db.createObjectStore('offline_sync_queue', { keyPath: 'id' });
            queueStore.createIndex('by-synced', 'queuedAt');
          }
        },
      });
    }
    return this.dbPromise;
  }

  /**
   * Store a heavy kinematic video session
   */
  public async saveKinematicSession(session: Omit<KinematicSessionRecord, 'id' | 'timestamp'> & { id?: string; timestamp?: number }): Promise<string> {
    const db = await this.getDB();
    const id = session.id || `kin_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const record: KinematicSessionRecord = {
      ...session,
      id,
      timestamp: session.timestamp || Date.now(),
    };
    await db.put('kinematic_sessions', record);

    // Queue for sync if offline
    if (!this.isOnline) {
      await this.queueOfflineAction('KINEMATIC_REP', record);
    }
    return id;
  }

  public async getAllKinematicSessions(): Promise<KinematicSessionRecord[]> {
    const db = await this.getDB();
    return db.getAllFromIndex('kinematic_sessions', 'by-timestamp');
  }

  /**
   * Store high-density blood lab panels
   */
  public async saveLabPanel(panel: LabPanelRecord): Promise<void> {
    const db = await this.getDB();
    await db.put('lab_panels', panel);
  }

  public async getAllLabPanels(): Promise<LabPanelRecord[]> {
    const db = await this.getDB();
    const panels = await db.getAll('lab_panels');
    if (panels.length === 0) {
      // Seed initial high-density biomarker panels
      const initialPanels: LabPanelRecord[] = [
        {
          id: 'lab_meta_01',
          panelName: 'Comprehensive Metabolic & Glycemic Profile',
          category: 'Metabolic',
          collectedAt: '2026-08-14',
          biomarkers: [
            { name: 'Fasting Insulin', value: 4.2, unit: 'uIU/mL', range: '2.0 - 6.0', status: 'optimal' },
            { name: 'HbA1c', value: 5.1, unit: '%', range: '4.5 - 5.4', status: 'optimal' },
            { name: 'HOMA-IR', value: 0.82, unit: 'index', range: '< 1.2', status: 'optimal' },
            { name: 'Fasting Glucose', value: 84, unit: 'mg/dL', range: '70 - 95', status: 'optimal' },
          ],
        },
        {
          id: 'lab_lipid_01',
          panelName: 'ApoB & Advanced Lipid Subfractions',
          category: 'Lipid',
          collectedAt: '2026-08-14',
          biomarkers: [
            { name: 'Apolipoprotein B (ApoB)', value: 68, unit: 'mg/dL', range: '< 70', status: 'optimal' },
            { name: 'Lp(a)', value: 18, unit: 'nmol/L', range: '< 75', status: 'optimal' },
            { name: 'Triglycerides', value: 72, unit: 'mg/dL', range: '< 100', status: 'optimal' },
            { name: 'HDL-C', value: 64, unit: 'mg/dL', range: '> 50', status: 'optimal' },
          ],
        },
        {
          id: 'lab_inflam_01',
          panelName: 'Systemic Longevity & Inflammation',
          category: 'Inflammation',
          collectedAt: '2026-08-14',
          biomarkers: [
            { name: 'hs-CRP', value: 0.35, unit: 'mg/L', range: '< 0.5', status: 'optimal' },
            { name: 'Homocysteine', value: 7.8, unit: 'umol/L', range: '< 9.0', status: 'optimal' },
            { name: 'Ferritin', value: 92, unit: 'ng/mL', range: '50 - 150', status: 'optimal' },
          ],
        },
      ];
      for (const p of initialPanels) {
        await db.put('lab_panels', p);
      }
      return initialPanels;
    }
    return panels;
  }

  /**
   * Offline Sync Queue Management
   */
  public async queueOfflineAction(action: OfflineSyncQueueItem['action'], payload: any): Promise<void> {
    const db = await this.getDB();
    const item: OfflineSyncQueueItem = {
      id: `queue_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      action,
      payload,
      queuedAt: Date.now(),
      synced: false,
    };
    await db.put('offline_sync_queue', item);

    // Register Background Sync if supported by Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration: any = await navigator.serviceWorker.ready;
        if (registration && registration.sync) {
          await registration.sync.register('nexus-health-sync');
        }
      } catch {
        // fallback
      }
    }
  }

  public async getPendingQueueCount(): Promise<number> {
    const db = await this.getDB();
    const items = await db.getAll('offline_sync_queue');
    return items.filter((i) => !i.synced).length;
  }

  public async flushOfflineQueue(): Promise<{ syncedCount: number }> {
    const db = await this.getDB();
    const items = await db.getAll('offline_sync_queue');
    const pending = items.filter((i) => !i.synced);

    if (pending.length === 0) return { syncedCount: 0 };

    try {
      const res = await fetch('/api/sync/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queue: pending }),
      });

      if (res.ok) {
        // Clear synced items
        const tx = db.transaction('offline_sync_queue', 'readwrite');
        for (const item of pending) {
          await tx.store.delete(item.id);
        }
        await tx.done;
        return { syncedCount: pending.length };
      }
    } catch {
      // still offline
    }
    return { syncedCount: 0 };
  }
}

export const indexedDbService = new IndexedDbService();
