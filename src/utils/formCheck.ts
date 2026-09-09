import { FormSessionSummary, LiveFormFeedback } from '../types';

const CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.js';
const WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const BONES = [[11, 12], [23, 24], [11, 23], [12, 24], [23, 25], [25, 27], [24, 26], [26, 28]];
export const CUES: Record<string, string> = {
  depth_short: 'Sit deeper — thighs to parallel',
  trunk_collapse: 'Chest up, eyes forward',
  knee_valgus: 'Drive knees over toes'
};

let landmarker: any = null;
let running = false;
let raf = 0;
let stream: MediaStream | null = null;
let phase = 'up';
let reps = 0;
let cur: any = { minKnee: 180, maxTrunk: 0, upGap: null, devs: {} };
let session: { reps: number; techSum: number; deviations: Record<string, number> } = { reps: 0, techSum: 0, deviations: {} };

function loadLib(): Promise<void> {
  return new Promise((res, rej) => {
    if (window.FilesetResolver) return res();
    const existing = document.querySelector(`script[src="${CDN}"]`);
    if (existing) {
      if ((existing as any).loaded) return res();
      existing.addEventListener('load', () => res());
      existing.addEventListener('error', () => rej(new Error('vision lib failed to load')));
      return;
    }
    const s = document.createElement('script');
    s.src = CDN;
    s.onload = () => {
      (s as any).loaded = true;
      res();
    };
    s.onerror = () => rej(new Error('vision lib failed to load'));
    document.head.appendChild(s);
  });
}

function ang(a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }) {
  const v1 = [a.x - b.x, a.y - b.y];
  const v2 = [c.x - b.x, c.y - b.y];
  const d = v1[0] * v2[0] + v1[1] * v2[1];
  const m = Math.hypot(v1[0], v1[1]) * Math.hypot(v2[0], v2[1]);
  return m ? (Math.acos(Math.max(-1, Math.min(1, d / m))) * 180) / Math.PI : 180;
}

function resetRep() {
  return { minKnee: 180, maxTrunk: 0, upGap: null as number | null, devs: {} as Record<string, number> };
}

function avg(lm: any[], a: number, b: number) {
  return {
    x: (lm[a].x + lm[b].x) / 2,
    y: (lm[a].y + lm[b].y) / 2,
    z: (lm[a].z + lm[b].z) / 2
  };
}

export function drawPose(canvas: HTMLCanvasElement, video: HTMLVideoElement, res: any) {
  const c = canvas.getContext('2d');
  if (!c) return;
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  c.clearRect(0, 0, canvas.width, canvas.height);

  if (!res || !res.landmarks || !res.landmarks[0]) return;
  const lm = res.landmarks[0];

  // Draw joints glow
  c.fillStyle = '#E8B04B';
  [11, 12, 23, 24, 25, 26, 27, 28].forEach((idx) => {
    if (lm[idx]) {
      c.beginPath();
      c.arc(lm[idx].x * canvas.width, lm[idx].y * canvas.height, 5, 0, Math.PI * 2);
      c.fill();
    }
  });

  // Draw skeleton lines
  c.strokeStyle = '#2F7CD6';
  c.lineWidth = 3;
  c.lineCap = 'round';
  BONES.forEach((b) => {
    if (lm[b[0]] && lm[b[1]]) {
      c.beginPath();
      c.moveTo(lm[b[0]].x * canvas.width, lm[b[0]].y * canvas.height);
      c.lineTo(lm[b[1]].x * canvas.width, lm[b[1]].y * canvas.height);
      c.stroke();
    }
  });
}

export async function startFormCheck(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  onLive: (feedback: LiveFormFeedback) => void
): Promise<void> {
  // If window.FormCheck already loaded from script and has implementation, we can execute
  await loadLib();

  if (!landmarker) {
    const vision = await (window as any).FilesetResolver.forVisionTasks(WASM);
    landmarker = await (window as any).PoseLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: MODEL, delegate: 'GPU' },
      runningMode: 'VIDEO',
      numPoses: 1
    });
  }

  stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: 'user',
      width: { ideal: 640 },
      height: { ideal: 480 }
    }
  });

  video.srcObject = stream;
  await video.play();

  phase = 'up';
  reps = 0;
  cur = resetRep();
  session = { reps: 0, techSum: 0, deviations: {} };
  running = true;

  const loop = () => {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    if (video.readyState < 2) return;

    const res = landmarker.detectForVideo(video, performance.now());
    drawPose(canvas, video, res);

    if (!res.landmarks || !res.landmarks[0]) return;
    const lm = res.landmarks[0];
    if ([11, 12, 23, 24, 25, 26, 27, 28].some((i) => (lm[i].visibility || 0) < 0.5)) return;

    const hip = avg(lm, 23, 24);
    const knee = avg(lm, 25, 26);
    const ank = avg(lm, 27, 28);
    const sho = avg(lm, 11, 12);

    const kA = ang(hip, knee, ank);
    const tA = (Math.acos(Math.max(-1, Math.min(1, (sho.y - hip.y) / (Math.hypot(sho.x - hip.x, sho.y - hip.y) || 1)))) * 180) / Math.PI;
    const gap = Math.abs(knee.x - ank.x);

    if (phase === 'up' && kA < 115) {
      phase = 'down';
      cur.upGap = gap;
    }

    if (phase === 'down') {
      cur.minKnee = Math.min(cur.minKnee, kA);
      cur.maxTrunk = Math.max(cur.maxTrunk, tA);
      if (cur.upGap && gap < cur.upGap * 0.5) cur.devs.knee_valgus = 1;

      if (kA > 165) {
        phase = 'up';
        reps++;
        if (cur.minKnee > 100) cur.devs.depth_short = 1;
        if (cur.maxTrunk > 55) cur.devs.trunk_collapse = 1;
        const n = Object.keys(cur.devs).length;
        const tech = Math.max(40, 100 - 30 * n);
        session.reps++;
        session.techSum += tech;
        Object.keys(cur.devs).forEach((d) => {
          session.deviations[d] = (session.deviations[d] || 0) + 1;
        });
        cur = resetRep();
      }
    }

    const live = Object.keys(cur.devs)[0] || (phase === 'down' && kA > 100 ? 'depth_short' : null);
    onLive({ reps, cue: live ? CUES[live] : null, knee: Math.round(kA) });
  };

  loop();
}

export function stopFormCheck(): void {
  running = false;
  if (raf) cancelAnimationFrame(raf);
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
}

export function getFormSummary(): FormSessionSummary {
  return {
    ts: Date.now(),
    exercise: 'squat',
    reps: session.reps,
    technique: session.reps ? Math.round(session.techSum / session.reps) : 0,
    deviations: { ...session.deviations }
  };
}

export function feedFormToObjective(s: FormSessionSummary): number {
  return Math.max(0, Math.min(100, Math.round(30 + Math.min(s.reps, 12) * 3 + s.technique * 0.4)));
}

// Expose on window.FormCheck to guarantee compatibility
if (typeof window !== 'undefined') {
  window.FormCheck = {
    start: startFormCheck,
    stop: stopFormCheck,
    summary: getFormSummary,
    feed: feedFormToObjective,
    CUES
  };
}
