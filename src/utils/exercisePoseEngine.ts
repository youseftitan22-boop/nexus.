import { ExerciseType, LiveFormFeedback, FormSessionSummary } from '../types';

export interface Point {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

// Calculate angle between three 2D/3D points in degrees
export function calculateAngle(a: Point, b: Point, c: Point): number {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  return Math.round(angle);
}

export class ExerciseTracker {
  private exercise: ExerciseType = 'squat';
  private repCount: number = 0;
  private currentPhase: string = 'start';
  private deviations: Record<string, number> = {};
  private validReps: number = 0;
  private totalRepsAttempted: number = 0;
  private minAngleReached: number = 180;
  private maxAngleReached: number = 0;
  private startTime: number = Date.now();
  private lastRepTime: number = 0;

  constructor(exercise: ExerciseType = 'squat') {
    this.exercise = exercise;
    this.reset();
  }

  public setExercise(exercise: ExerciseType) {
    this.exercise = exercise;
    this.reset();
  }

  public reset() {
    this.repCount = 0;
    this.validReps = 0;
    this.totalRepsAttempted = 0;
    this.currentPhase = 'start';
    this.deviations = {};
    this.minAngleReached = 180;
    this.maxAngleReached = 0;
    this.startTime = Date.now();
    this.lastRepTime = Date.now();
  }

  // Process MediaPipe Pose landmarks (33 landmarks)
  public processLandmarks(landmarks: Point[]): LiveFormFeedback {
    if (!landmarks || landmarks.length < 33) {
      return { reps: this.repCount, cue: 'Position body in frame' };
    }

    if (this.exercise === 'squat') {
      return this.processSquat(landmarks);
    } else if (this.exercise === 'pushup') {
      return this.processPushup(landmarks);
    } else {
      return this.processPlank(landmarks);
    }
  }

  // SQUAT KINEMATICS
  // Landmark indices: Left Hip (23), Left Knee (25), Left Ankle (27), Left Shoulder (11)
  private processSquat(landmarks: Point[]): LiveFormFeedback {
    const hip = landmarks[23] || landmarks[24];
    const knee = landmarks[25] || landmarks[26];
    const ankle = landmarks[27] || landmarks[28];
    const shoulder = landmarks[11] || landmarks[12];

    const kneeAngle = calculateAngle(hip, knee, ankle);
    const torsoAngle = calculateAngle(shoulder, hip, knee);

    let cue: string | null = null;

    if (kneeAngle < this.minAngleReached) {
      this.minAngleReached = kneeAngle;
    }

    // State machine: standing (>150°) -> descending -> bottom (<100°) -> ascending -> rep count
    if (this.currentPhase === 'start' || this.currentPhase === 'standing') {
      if (kneeAngle < 140) {
        this.currentPhase = 'descending';
      }
    } else if (this.currentPhase === 'descending') {
      if (kneeAngle <= 95) {
        this.currentPhase = 'bottom';
        cue = 'Parallel depth reached — drive through heels';
      } else if (torsoAngle < 65) {
        cue = 'Keep chest upright';
        this.recordDeviation('torso_forward');
      }
    } else if (this.currentPhase === 'bottom') {
      if (kneeAngle > 105) {
        this.currentPhase = 'ascending';
      }
    } else if (this.currentPhase === 'ascending') {
      if (kneeAngle >= 155) {
        const now = Date.now();
        if (now - this.lastRepTime > 800) {
          this.repCount += 1;
          this.totalRepsAttempted += 1;
          this.lastRepTime = now;
          if (this.minAngleReached <= 100) {
            this.validReps += 1;
          } else {
            this.recordDeviation('depth_short');
            cue = 'Short depth — break parallel next rep';
          }
          this.minAngleReached = 180;
        }
        this.currentPhase = 'standing';
      }
    }

    return {
      reps: this.repCount,
      cue,
      knee: kneeAngle,
      torsoAngle,
      phase: this.currentPhase as any
    };
  }

  // PUSH-UP KINEMATICS
  // Landmark indices: Shoulder (11), Elbow (13), Wrist (15), Hip (23), Ankle (27)
  private processPushup(landmarks: Point[]): LiveFormFeedback {
    const shoulder = landmarks[11] || landmarks[12];
    const elbow = landmarks[13] || landmarks[14];
    const wrist = landmarks[15] || landmarks[16];
    const hip = landmarks[23] || landmarks[24];
    const ankle = landmarks[27] || landmarks[28];

    const elbowAngle = calculateAngle(shoulder, elbow, wrist);
    const bodyAlignment = calculateAngle(shoulder, hip, ankle);

    let cue: string | null = null;

    // Check spinal alignment during push-up
    if (bodyAlignment < 155) {
      cue = 'Engage core — avoid hip sagging';
      this.recordDeviation('hip_sag');
    }

    if (this.currentPhase === 'start' || this.currentPhase === 'standing') {
      if (elbowAngle < 150) {
        this.currentPhase = 'descending';
      }
    } else if (this.currentPhase === 'descending') {
      if (elbowAngle <= 90) {
        this.currentPhase = 'bottom';
        cue = 'Full chest depth locked — press up';
      }
    } else if (this.currentPhase === 'bottom') {
      if (elbowAngle > 105) {
        this.currentPhase = 'ascending';
      }
    } else if (this.currentPhase === 'ascending') {
      if (elbowAngle >= 155) {
        const now = Date.now();
        if (now - this.lastRepTime > 700) {
          this.repCount += 1;
          this.totalRepsAttempted += 1;
          this.lastRepTime = now;
          this.validReps += 1;
        }
        this.currentPhase = 'standing';
      }
    }

    return {
      reps: this.repCount,
      cue,
      elbow: elbowAngle,
      phase: this.currentPhase as any
    };
  }

  // PLANK ALIGNMENT TRACKER
  // Tracks shoulder-hip-ankle line (straightness ~170-180°) and hold duration
  private processPlank(landmarks: Point[]): LiveFormFeedback {
    const shoulder = landmarks[11] || landmarks[12];
    const hip = landmarks[23] || landmarks[24];
    const ankle = landmarks[27] || landmarks[28];

    const spineAngle = calculateAngle(shoulder, hip, ankle);
    let cue: string | null = null;

    const isProperAlignment = spineAngle >= 160 && spineAngle <= 195;
    const elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);

    if (isProperAlignment) {
      cue = `Solid plank alignment: ${elapsedSeconds}s hold`;
      this.repCount = elapsedSeconds; // repCount holds seconds for plank
    } else if (spineAngle < 160) {
      cue = 'Lift hips — core is sagging';
      this.recordDeviation('plank_sag');
    } else {
      cue = 'Lower hips into neutral spine line';
      this.recordDeviation('plank_pike');
    }

    return {
      reps: this.repCount,
      cue,
      torsoAngle: spineAngle,
      phase: isProperAlignment ? 'planking' : 'plank_sag'
    };
  }

  private recordDeviation(type: string) {
    this.deviations[type] = (this.deviations[type] || 0) + 1;
  }

  public getSummary(): FormSessionSummary {
    const total = Math.max(this.totalRepsAttempted, this.repCount, 1);
    const deviationSum = Object.values(this.deviations).reduce((a, b) => a + b, 0);
    const rawTechnique = Math.max(50, Math.min(100, Math.round(100 - (deviationSum / total) * 20)));

    return {
      ts: Date.now(),
      exercise: this.exercise,
      reps: this.repCount,
      technique: rawTechnique,
      deviations: this.deviations,
      objectiveScore: Math.round(rawTechnique * 0.95),
      durationSeconds: Math.floor((Date.now() - this.startTime) / 1000)
    };
  }
}
