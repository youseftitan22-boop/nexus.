export type OrganType = 'heart' | 'brain' | 'lungs' | 'kidneys' | 'liver' | 'stomach';

export type ExerciseType = 'squat' | 'pushup' | 'plank';

export interface Appointment {
  id: string;
  date: string;
  time: string;
  title: string;
  type: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorAvatar: string;
  statusColor: string; // 'red' | 'green' | 'blue'
  locationOrLink?: string;
  notes?: string;
}

export interface VitalMetrics {
  bloodSugar: number; // mg/dL
  bloodStatusMin: number;
  bloodStatusMax: number;
  heartRate: number; // bpm
  bloodPressureSys: number; // e.g. 80
  bloodPressureDia: number; // e.g. 120
}

export interface BodyMeasurements {
  heightCm: number;
  weightKg: number;
  chestInches: number;
  waistInches: number;
  hipInches: number;
  bodyFatPercent: number;
}

export type BmiStatus = {
  category: 'Underweight' | 'Normal Weight' | 'Overweight' | 'Obese';
  color: string;
  bgLight: string;
  textDark: string;
};

export interface FormSessionSummary {
  ts: number;
  exercise: ExerciseType | string;
  reps: number;
  technique: number;
  deviations: Record<string, number>;
  objectiveScore?: number;
  durationSeconds?: number;
}

export interface LiveFormFeedback {
  reps: number;
  cue: string | null;
  knee?: number;
  elbow?: number;
  torsoAngle?: number;
  phase?: 'standing' | 'descending' | 'bottom' | 'ascending' | 'planking' | 'plank_sag';
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconName: string;
  unlocked: boolean;
  unlockedAt?: string;
  category: 'core' | 'biometric' | 'streak' | 'mastery';
}

export interface NodeStat {
  id: string;
  name: string;
  score: number;
  level: number;
  xp: number;
  streak: number;
  checkIns: number;
  trend: 'up' | 'down' | 'stable';
  trendDelta: number;
  category: string;
}

export interface HistoryEntry {
  week: string;
  nis: number;
  timestamp: number;
}

export type BiologicalSex = 'Female' | 'Male' | 'Intersex' | 'Prefer not';

export interface UserProfile {
  name: string;
  age: number;
  sex: BiologicalSex;
  pronouns?: string;
  avatarUrl?: string;
  focusNodes: string[]; // up to 2: 'sleep' | 'nutrition' | 'readiness' | 'stress' | 'hrv' | 'movement'
  heightCm: number;
  weightKg: number;
}

export interface BiometricProfileState {
  sleep: number;
  nutrition: number;
  readiness: number;
  stress: number;
  hrv: number;
  movement: number;
}

export interface BiometricCorrelation {
  nodeA: string;
  nodeB: string;
  coefficient: number; // -1 to 1
  sampleCount: number;
  description: string;
  insight: string;
  impactTier: 'high' | 'moderate' | 'emerging';
}

export interface ImportedHealthPayload {
  source: 'Apple Health' | 'Google Fit' | 'Oura' | 'Generic CSV/JSON';
  dateRange: string;
  totalRecords: number;
  extracted: {
    steps?: number[];
    avgSleepHours?: number;
    restingHeartRate?: number;
    hrvAvg?: number;
  };
}

declare global {
  interface Window {
    FilesetResolver?: any;
    PoseLandmarker?: any;
    FormCheck?: {
      start: (video: HTMLVideoElement, canvas: HTMLCanvasElement, onLive: (data: LiveFormFeedback) => void) => Promise<void>;
      stop: () => void;
      summary: () => FormSessionSummary;
      feed: (summary: FormSessionSummary) => number;
      CUES: Record<string, string>;
    };
  }
}
