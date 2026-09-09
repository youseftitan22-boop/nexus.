/* form-check.js — on-device squat form coach. No server, no upload. */
(function () {
'use strict';
var CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.js';
var WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
var MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
var BONES = [[11,12],[23,24],[11,23],[12,24],[23,25],[25,27],[24,26],[26,28]];
var CUES = { depth_short: 'Sit deeper — thighs to parallel', trunk_collapse: 'Chest up, eyes forward', knee_valgus: 'Drive knees over toes' };
var landmarker = null, running = false, raf = 0, stream = null;
var phase, reps, cur, session;

function loadLib() {
  return new Promise(function (res, rej) {
    if (window.FilesetResolver) return res();
    var s = document.createElement('script'); s.src = CDN;
    s.onload = res; s.onerror = function () { rej(new Error('vision lib failed to load')); };
    document.head.appendChild(s);
  });
}
function ang(a, b, c) {
  var v1 = [a.x - b.x, a.y - b.y], v2 = [c.x - b.x, c.y - b.y];
  var d = v1[0] * v2[0] + v1[1] * v2[1];
  var m = Math.hypot(v1[0], v1[1]) * Math.hypot(v2[0], v2[1]);
  return m ? Math.acos(Math.max(-1, Math.min(1, d / m))) * 180 / Math.PI : 180;
}
function resetRep() { return { minKnee: 180, maxTrunk: 0, upGap: null, devs: {} }; }
function avg(lm, a, b) { return { x: (lm[a].x + lm[b].x) / 2, y: (lm[a].y + lm[b].y) / 2, z: (lm[a].z + lm[b].z) / 2 }; }

async function start(video, canvas, onLive) {
  await loadLib();
  if (!landmarker) {
    var vision = await FilesetResolver.forVisionTasks(WASM);
    landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: MODEL, delegate: 'GPU' },
      runningMode: 'VIDEO', numPoses: 1
    });
  }
  stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
  video.srcObject = stream; await video.play();
  phase = 'up'; reps = 0; cur = resetRep();
  session = { reps: 0, techSum: 0, deviations: {} };
  running = true;
  (function loop() {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    if (video.readyState < 2) return;
    var res = landmarker.detectForVideo(video, performance.now());
    draw(canvas, video, res);
    if (!res.landmarks || !res.landmarks[0]) return;
    var lm = res.landmarks[0];
    if ([11,12,23,24,25,26,27,28].some(function (i) { return (lm[i].visibility || 0) < .5; })) return;
    var hip = avg(lm, 23, 24), knee = avg(lm, 25, 26), ank = avg(lm, 27, 28), sho = avg(lm, 11, 12);
    var kA = ang(hip, knee, ank);
    var tA = Math.acos(Math.max(-1, Math.min(1, (sho.y - hip.y) / (Math.hypot(sho.x - hip.x, sho.y - hip.y) || 1)))) * 180 / Math.PI;
    var gap = Math.abs(knee.x - ank.x);
    if (phase === 'up' && kA < 115) { phase = 'down'; cur.upGap = gap; }
    if (phase === 'down') {
      cur.minKnee = Math.min(cur.minKnee, kA);
      cur.maxTrunk = Math.max(cur.maxTrunk, tA);
      if (cur.upGap && gap < cur.upGap * .5) cur.devs.knee_valgus = 1;
      if (kA > 165) {
        phase = 'up'; reps++;
        if (cur.minKnee > 100) cur.devs.depth_short = 1;
        if (cur.maxTrunk > 55) cur.devs.trunk_collapse = 1;
        var n = Object.keys(cur.devs).length;
        var tech = Math.max(40, 100 - 30 * n);
        session.reps++; session.techSum += tech;
        Object.keys(cur.devs).forEach(function (d) { session.deviations[d] = (session.deviations[d] || 0) + 1; });
        cur = resetRep();
      }
    }
    var live = Object.keys(cur.devs)[0] || (phase === 'down' && kA > 100 ? 'depth_short' : null);
    onLive({ reps: reps, cue: live ? CUES[live] : null, knee: Math.round(kA) });
  })();
}
function draw(canvas, video, res) {
  var c = canvas.getContext('2d');
  canvas.width = video.videoWidth; canvas.height = video.videoHeight;
  c.clearRect(0, 0, canvas.width, canvas.height);
  if (!res.landmarks || !res.landmarks[0]) return;
  var lm = res.landmarks[0];
  c.strokeStyle = '#2F7CD6'; c.lineWidth = 3;
  BONES.forEach(function (b) {
    c.beginPath();
    c.moveTo(lm[b[0]].x * canvas.width, lm[b[0]].y * canvas.height);
    c.lineTo(lm[b[1]].x * canvas.width, lm[b[1]].y * canvas.height);
    c.stroke();
  });
}
function stop() { running = false; cancelAnimationFrame(raf); if (stream) stream.getTracks().forEach(function (t) { t.stop(); }); }
function summary() {
  return { ts: Date.now(), exercise: 'squat', reps: session.reps,
    technique: session.reps ? Math.round(session.techSum / session.reps) : 0,
    deviations: session.deviations };
}
function feed(s) {
  return Math.max(0, Math.min(100, Math.round(30 + Math.min(s.reps, 12) * 3 + s.technique * .4)));
}
window.FormCheck = { start: start, stop: stop, summary: summary, feed: feed, CUES: CUES };
})();
