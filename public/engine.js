/* engine.js — Healthlog Nexus Engine & Biometric Economy */
(function () {
'use strict';

function computeNIS(p) {
  if (typeof p === 'number') return Math.round(p);
  if (Array.isArray(p)) {
    if (!p.length) return 0;
    var sum = p.reduce(function (acc, v) { return acc + (typeof v === 'number' ? v : 0); }, 0);
    return Math.round(sum / p.length);
  }
  if (typeof p === 'object' && p !== null) {
    var vals = Object.values(p).filter(function (v) { return typeof v === 'number'; });
    if (!vals.length) return 0;
    var total = vals.reduce(function (acc, v) { return acc + v; }, 0);
    return Math.round(total / vals.length);
  }
  return 61;
}

var RANKS=[{n:'Loose Thread',nis:0,logs:0},{n:'Woven',nis:45,logs:3},{n:'Load-Bearing',nis:55,logs:10},{n:'Keystone',nis:65,logs:25},{n:'Apex Web',nis:75,logs:60}];
function computeRank(p,m){var nis=computeNIS(p),i=0;for(var k=1;k<RANKS.length;k++){if(nis>=RANKS[k].nis&&(m.totalLogs||0)>=RANKS[k].logs&&(!RANKS[k].form||(m.formSessions||0)>=1))i=k;}return{tier:i,name:RANKS[i].n,next:RANKS[i+1]||null};}
function pointsFor(a,s){var b={log:10,firstOfDay:5,weekly:50,intake:20}[a]||0;return Math.round(b*(1+Math.min(s,20)*.05));}

window.NexusEngine = {
  RANKS: RANKS,
  computeRank: computeRank,
  pointsFor: pointsFor,
  computeNIS: computeNIS
};
})();
