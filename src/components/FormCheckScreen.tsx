import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Play,
  Square,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  ArrowRight,
  ShieldAlert,
  ChevronLeft,
  Flame,
  Activity,
  Volume2,
  VolumeX,
  Target,
  Layers
} from 'lucide-react';
import { FormSessionSummary, LiveFormFeedback, ExerciseType } from '../types';
import { startFormCheck, stopFormCheck, getFormSummary, feedFormToObjective, CUES } from '../utils/formCheck';
import { bioAudio } from '../utils/audioFeedback';
import { ExerciseTracker } from '../utils/exercisePoseEngine';

interface FormCheckScreenProps {
  onFeedWeb: (summary: FormSessionSummary, newMovementScore: number) => void;
  onNavigateHome: () => void;
  movementScore: number;
  recentSessions: FormSessionSummary[];
}

export const FormCheckScreen: React.FC<FormCheckScreenProps> = ({
  onFeedWeb,
  onNavigateHome,
  movementScore,
  recentSessions
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [selectedExercise, setSelectedExercise] = useState<ExerciseType>('squat');
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [liveFeedback, setLiveFeedback] = useState<LiveFormFeedback>({
    reps: 0,
    cue: null,
    knee: 180
  });
  const [summary, setSummary] = useState<FormSessionSummary | null>(null);
  const [hasFedWeb, setHasFedWeb] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(bioAudio.getMuted());

  const prevRepsRef = useRef<number>(0);
  const prevCueRef = useRef<string | null>(null);

  // Trigger audio biofeedback whenever reps increase or critical cues emerge
  useEffect(() => {
    if (isActive) {
      if (liveFeedback.reps > prevRepsRef.current) {
        bioAudio.playRepSuccessChime();
        prevRepsRef.current = liveFeedback.reps;
      }
      if (liveFeedback.cue && liveFeedback.cue !== prevCueRef.current) {
        if (liveFeedback.cue.includes('reached') || liveFeedback.cue.includes('locked')) {
          bioAudio.playDepthChime();
        } else if (liveFeedback.cue.includes('Short') || liveFeedback.cue.includes('sagging') || liveFeedback.cue.includes('chest')) {
          bioAudio.playCueTone();
        }
        prevCueRef.current = liveFeedback.cue;
      }
    }
  }, [liveFeedback, isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopFormCheck();
    };
  }, []);

  const handleStartSession = async () => {
    setCameraError(null);
    setSummary(null);
    setHasFedWeb(false);
    setIsLoading(true);
    prevRepsRef.current = 0;
    prevCueRef.current = null;
    setLiveFeedback({ reps: 0, cue: null, knee: 180 });

    try {
      if (!videoRef.current || !canvasRef.current) {
        throw new Error('Video/Canvas elements not initialized');
      }

      await startFormCheck(videoRef.current, canvasRef.current, (feedback) => {
        setLiveFeedback(feedback);
      });

      setIsActive(true);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Camera/Vision initialization error:', err);
      setIsLoading(false);
      setIsActive(false);
      setCameraError('Form Check needs HTTPS + camera permission');
    }
  };

  const handleStopSession = () => {
    stopFormCheck();
    setIsActive(false);
    const sessionSummary = getFormSummary();
    setSummary({ ...sessionSummary, exercise: selectedExercise });
    bioAudio.playRepSuccessChime();
  };

  const handleFeedWebClick = () => {
    if (!summary) return;
    const objective = feedFormToObjective(summary);
    const updatedSummary = { ...summary, objectiveScore: objective };
    const selfScore = movementScore;
    const newMovement = Math.round(0.4 * selfScore + 0.6 * objective);

    onFeedWeb(updatedSummary, newMovement);
    setHasFedWeb(true);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-4 sm:p-5 rounded-3xl border border-[#7FA894]/20">
        <div className="flex items-center gap-3">
          <button
            id="btn-form-back"
            onClick={onNavigateHome}
            className="w-10 h-10 rounded-2xl bg-[#0B1613] hover:bg-[#0B1613]/80 border border-[#7FA894]/25 flex items-center justify-center text-[#7FA894] hover:text-[#F5F1E8] transition-colors cursor-pointer"
            title="Back to Dashboard"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E8B04B] animate-pulse" />
              <span className="text-[11px] font-bold text-[#E8B04B] uppercase tracking-wider font-['IBM_Plex_Mono',monospace]">
                On-Device Vision & Audio Coach
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#F5F1E8] font-['Fraunces',serif]">
              Kinematic Form Coach
            </h1>
          </div>
        </div>

        {/* Right Header Controls: Audio Toggle & Score */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Audio Chime Mute/Unmute */}
          <button
            id="btn-toggle-audio-coach"
            onClick={() => setIsAudioMuted(bioAudio.toggleMute())}
            className="min-h-[44px] px-3.5 py-2 rounded-2xl bg-[#0B1613] hover:bg-[#0B1613]/80 border border-[#7FA894]/30 flex items-center gap-2 text-xs text-[#7FA894] hover:text-[#E8B04B] transition-colors cursor-pointer font-['IBM_Plex_Mono',monospace]"
            title={isAudioMuted ? 'Unmute Form Audio Chimes' : 'Mute Form Audio Chimes'}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4 text-[#C1553B]" /> : <Volume2 className="w-4 h-4 text-[#E8B04B]" />}
            <span className="hidden xs:inline">{isAudioMuted ? 'Audio Off' : 'Bio-Audio On'}</span>
          </button>

          {/* Current Movement Score Pill */}
          <div className="px-3.5 py-2 rounded-2xl bg-[#0B1613] border border-[#7FA894]/30 flex items-center gap-2 text-xs font-['IBM_Plex_Mono',monospace]">
            <Activity className="w-4 h-4 text-[#7FA894]" />
            <span className="text-[#7FA894]">Movement:</span>
            <span className="text-[#E8B04B] font-bold text-sm">{movementScore}</span>
          </div>
        </div>
      </div>

      {/* Exercise Pattern Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 font-['IBM_Plex_Mono',monospace] text-xs">
        {[
          { id: 'squat', label: 'Barbell/Bodyweight Squat', target: 'Hip & Knee Flexion' },
          { id: 'pushup', label: 'Push-Up Pattern', target: 'Elbow & Spine Lock' },
          { id: 'plank', label: 'Prone Plank Alignment', target: 'Core Anti-Extension' }
        ].map((item) => (
          <button
            key={item.id}
            disabled={isActive}
            onClick={() => setSelectedExercise(item.id as ExerciseType)}
            className={`min-h-[44px] px-4 py-2 rounded-2xl border transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              selectedExercise === item.id
                ? 'bg-[#E8B04B] text-[#0B1613] font-bold border-[#E8B04B] shadow-md shadow-[#E8B04B]/20'
                : 'bg-[#16241F] text-[#7FA894] hover:text-[#F5F1E8] border-[#7FA894]/30'
            } ${isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Main Vision Stage & Feedback Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Main Stage (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative glass-card rounded-3xl overflow-hidden border border-[#7FA894]/25 aspect-[4/3] sm:aspect-[16/10] flex items-center justify-center bg-[#070E0C]">
            {/* Video & Canvas Overlay */}
            <video
              ref={videoRef}
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 ${
                isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            />
            <canvas
              ref={canvasRef}
              className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 pointer-events-none z-10 ${
                isActive ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Inactive Standby Screen */}
            {!isActive && !cameraError && (
              <div className="flex flex-col items-center text-center p-6 z-20 max-w-md space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-[#16241F] border border-[#E8B04B]/30 flex items-center justify-center text-[#E8B04B] shadow-xl">
                  <Camera className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#F5F1E8] font-['Fraunces',serif]">
                    Ready for {selectedExercise === 'squat' ? 'Squat' : selectedExercise === 'pushup' ? 'Push-Up' : 'Plank'} Kinematics
                  </h3>
                  <p className="text-xs text-[#7FA894] mt-1 leading-relaxed">
                    Position yourself in frame with full body visibility. Real-time neural pose tracking measures joint angles with live audio harmonic cues.
                  </p>
                </div>

                <button
                  id="btn-start-form-check"
                  onClick={handleStartSession}
                  disabled={isLoading}
                  className="min-h-[48px] px-8 py-3 bg-[#E8B04B] hover:bg-[#E8B04B]/90 text-[#0B1613] font-bold text-sm rounded-2xl cursor-pointer shadow-lg shadow-[#E8B04B]/20 transition-all flex items-center gap-2 active:scale-98 font-['IBM_Plex_Mono',monospace]"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#0B1613] border-t-transparent rounded-full animate-spin" />
                      <span>Loading Neural Engine...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Start Form Check</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Camera Failure Card */}
            {cameraError && (
              <div
                id="camera-error-card"
                className="flex flex-col items-center text-center p-6 z-20 max-w-md bg-[#16241F]/95 rounded-3xl border border-[#C1553B]/50 shadow-2xl space-y-4"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#C1553B]/20 border border-[#C1553B]/40 flex items-center justify-center text-[#C1553B]">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F5F1E8] font-['Fraunces',serif]">
                    Camera Access Required
                  </h3>
                  <p className="text-xs font-semibold text-[#C1553B] font-['IBM_Plex_Mono',monospace] mt-1">
                    Form Check needs HTTPS + camera permission
                  </p>
                  <p className="text-xs text-[#7FA894] mt-2 leading-relaxed">
                    Please allow camera permissions in your browser bar or verify that your browser has video capture capability enabled.
                  </p>
                </div>
                <button
                  id="btn-retry-camera"
                  onClick={handleStartSession}
                  className="min-h-[44px] px-6 py-2 bg-[#E8B04B] hover:bg-[#E8B04B]/90 text-[#0B1613] font-bold text-xs rounded-xl cursor-pointer shadow-sm transition-all"
                >
                  Retry Camera
                </button>
              </div>
            )}

            {/* Active Live HUD Overlay */}
            {isActive && (
              <>
                {/* Live Rep / Hold Counter Top-Left */}
                <div className="absolute top-4 left-4 z-20 bg-[#0B1613]/85 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-[#7FA894]/30 shadow-xl">
                  <div className="text-[10px] text-[#7FA894] font-semibold uppercase tracking-wider font-['IBM_Plex_Mono',monospace]">
                    {selectedExercise === 'plank' ? 'Hold Time (s)' : 'Verified Reps'}
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold text-[#E8B04B] font-['IBM_Plex_Mono',monospace] leading-none mt-0.5">
                    {liveFeedback.reps}
                  </div>
                </div>

                {/* Live Joint Angle Top-Right */}
                <div className="absolute top-4 right-4 z-20 bg-[#0B1613]/85 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-[#7FA894]/30 shadow-xl font-['IBM_Plex_Mono',monospace] text-right">
                  <div className="text-[10px] text-[#7FA894] font-medium uppercase">
                    {selectedExercise === 'pushup' ? 'Elbow Flexion' : selectedExercise === 'plank' ? 'Spine Angle' : 'Knee Flexion'}
                  </div>
                  <div className="text-xl font-bold text-[#F5F1E8]">
                    {selectedExercise === 'pushup' ? `${liveFeedback.elbow || 180}°` : `${liveFeedback.knee || 180}°`}
                  </div>
                </div>

                {/* Live Real-Time Cue Banner */}
                <div className="absolute bottom-20 inset-x-4 z-20 flex justify-center pointer-events-none">
                  {liveFeedback.cue ? (
                    <div className="bg-[#C1553B]/95 text-[#F5F1E8] backdrop-blur-md px-4 py-2 rounded-xl border border-[#C1553B] shadow-2xl flex items-center gap-2 animate-bounce">
                      <AlertTriangle className="w-4 h-4 text-[#F5F1E8] shrink-0" />
                      <span className="text-xs font-bold font-['IBM_Plex_Mono',monospace]">
                        {liveFeedback.cue}
                      </span>
                    </div>
                  ) : (
                    <div className="bg-[#16241F]/85 text-[#7FA894] backdrop-blur-md px-4 py-1.5 rounded-xl border border-[#7FA894]/25 shadow-md flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#7FA894]" />
                      <span className="text-xs font-medium font-['IBM_Plex_Mono',monospace]">
                        Tracking Active • Listen for 528Hz Depth Chime
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Control Bar (Stop button ≥44px) */}
                <div className="absolute bottom-4 inset-x-4 z-20 flex items-center justify-center">
                  <button
                    id="btn-stop-form-check"
                    onClick={handleStopSession}
                    className="min-h-[48px] px-8 py-3 bg-[#C1553B] hover:bg-[#C1553B]/90 text-[#F5F1E8] font-bold text-sm rounded-2xl cursor-pointer shadow-xl transition-all flex items-center gap-2 active:scale-98 font-['IBM_Plex_Mono',monospace]"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>Finish Set & View Summary</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Info & Post-Set Summary Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Post-Set Summary Card */}
          {summary ? (
            <div
              id="form-summary-card"
              className="glass-card p-5 rounded-3xl border border-[#E8B04B]/40 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200"
            >
              <div className="flex items-center justify-between border-b border-[#7FA894]/20 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-[#E8B04B] uppercase tracking-wider font-['IBM_Plex_Mono',monospace]">
                    Set Completed • {summary.exercise}
                  </span>
                  <h3 className="text-lg font-bold text-[#F5F1E8] font-['Fraunces',serif]">
                    Performance Summary
                  </h3>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#E8B04B]/20 text-[#E8B04B] flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>

              {/* Reps and Technique Metric Badges */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#0B1613] rounded-2xl border border-[#7FA894]/20 text-center">
                  <div className="text-[10px] font-semibold text-[#7FA894] font-['IBM_Plex_Mono',monospace]">
                    {summary.exercise === 'plank' ? 'Duration' : 'Total Reps'}
                  </div>
                  <div className="text-2xl font-bold text-[#F5F1E8] font-['IBM_Plex_Mono',monospace]">
                    {summary.exercise === 'plank' ? `${summary.reps}s` : summary.reps}
                  </div>
                </div>
                <div className="p-3 bg-[#0B1613] rounded-2xl border border-[#7FA894]/20 text-center">
                  <div className="text-[10px] font-semibold text-[#7FA894] font-['IBM_Plex_Mono',monospace]">Technique</div>
                  <div className={`text-2xl font-bold font-['IBM_Plex_Mono',monospace] ${
                    summary.technique >= 75 ? 'text-[#7FA894]' : 'text-[#E8B04B]'
                  }`}>
                    {summary.technique}%
                  </div>
                </div>
              </div>

              {/* Deviations & Cues Breakdown */}
              <div>
                <div className="text-xs font-bold text-[#F5F1E8] mb-2 font-['IBM_Plex_Mono',monospace]">
                  Form Deviations & Cues
                </div>
                {Object.keys(summary.deviations).length > 0 ? (
                  <div className="space-y-1.5">
                    {Object.entries(summary.deviations).map(([devKey, count]) => (
                      <div
                        key={devKey}
                        className="p-2.5 bg-[#0B1613]/70 rounded-xl border border-[#7FA894]/20 text-xs flex items-start justify-between gap-2"
                      >
                        <div>
                          <span className="font-semibold text-[#E8B04B] block font-['IBM_Plex_Mono',monospace]">
                            {CUES[devKey] || devKey}
                          </span>
                          <span className="text-[10px] text-[#7FA894] capitalize">{devKey.replace('_', ' ')}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-[#C1553B]/20 text-[#C1553B] font-bold text-[10px] font-['IBM_Plex_Mono',monospace] shrink-0">
                          {count}x
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-[#7FA894]/15 rounded-xl border border-[#7FA894]/30 text-xs text-[#7FA894] font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#7FA894] shrink-0" />
                    <span>Pristine kinematics! Zero deviations logged.</span>
                  </div>
                )}
              </div>

              {/* "Feed my web" Action Button */}
              <div className="pt-2">
                {!hasFedWeb ? (
                  <button
                    id="btn-feed-my-web"
                    onClick={handleFeedWebClick}
                    className="w-full min-h-[48px] py-3 bg-[#E8B04B] hover:bg-[#E8B04B]/90 text-[#0B1613] font-bold text-xs rounded-2xl cursor-pointer shadow-lg shadow-[#E8B04B]/20 transition-all flex items-center justify-center gap-2 active:scale-98 font-['IBM_Plex_Mono',monospace]"
                  >
                    <Sparkles className="w-4 h-4 fill-current" />
                    <span>Feed My Web</span>
                  </button>
                ) : (
                  <div className="p-3 bg-[#7FA894]/20 text-[#7FA894] border border-[#7FA894]/40 rounded-2xl text-center text-xs font-bold font-['IBM_Plex_Mono',monospace]">
                    ✓ Fed to Movement Biometrics
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Exercise Details & Target Criteria Card */
            <div className="glass-card p-5 rounded-3xl border border-[#7FA894]/20 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#E8B04B] font-['IBM_Plex_Mono',monospace]">
                <Flame className="w-4 h-4" />
                <span>Coach Target Standards ({selectedExercise.toUpperCase()})</span>
              </div>
              <h4 className="text-sm font-bold text-[#F5F1E8] font-['Fraunces',serif]">
                Kinematic Thresholds
              </h4>
              <ul className="text-xs text-[#7FA894] space-y-2.5 font-['IBM_Plex_Sans',sans-serif]">
                {selectedExercise === 'squat' && (
                  <>
                    <li className="flex items-start gap-2 bg-[#0B1613]/50 p-2 rounded-xl border border-[#7FA894]/15">
                      <span className="text-[#E8B04B] font-bold font-['IBM_Plex_Mono',monospace]">01</span>
                      <span><strong>Parallel Depth:</strong> Knee angle ≤ 100° flexion triggers 528Hz chime.</span>
                    </li>
                    <li className="flex items-start gap-2 bg-[#0B1613]/50 p-2 rounded-xl border border-[#7FA894]/15">
                      <span className="text-[#E8B04B] font-bold font-['IBM_Plex_Mono',monospace]">02</span>
                      <span><strong>Trunk Angle:</strong> Maintain upright spine to avoid lower-back shear.</span>
                    </li>
                  </>
                )}
                {selectedExercise === 'pushup' && (
                  <>
                    <li className="flex items-start gap-2 bg-[#0B1613]/50 p-2 rounded-xl border border-[#7FA894]/15">
                      <span className="text-[#E8B04B] font-bold font-['IBM_Plex_Mono',monospace]">01</span>
                      <span><strong>Chest Depth:</strong> Elbow angle ≤ 90° for full pectoral stretch.</span>
                    </li>
                    <li className="flex items-start gap-2 bg-[#0B1613]/50 p-2 rounded-xl border border-[#7FA894]/15">
                      <span className="text-[#E8B04B] font-bold font-['IBM_Plex_Mono',monospace]">02</span>
                      <span><strong>Core Rigidity:</strong> Hip-shoulder alignment &gt; 155° straightness.</span>
                    </li>
                  </>
                )}
                {selectedExercise === 'plank' && (
                  <>
                    <li className="flex items-start gap-2 bg-[#0B1613]/50 p-2 rounded-xl border border-[#7FA894]/15">
                      <span className="text-[#E8B04B] font-bold font-['IBM_Plex_Mono',monospace]">01</span>
                      <span><strong>Neutral Spine:</strong> Maintain 165°–180° straight line from shoulder to heels.</span>
                    </li>
                    <li className="flex items-start gap-2 bg-[#0B1613]/50 p-2 rounded-xl border border-[#7FA894]/15">
                      <span className="text-[#E8B04B] font-bold font-['IBM_Plex_Mono',monospace]">02</span>
                      <span><strong>Sag Detection:</strong> Warning audio fires if hips drop below threshold.</span>
                    </li>
                  </>
                )}
              </ul>
            </div>
          )}

          {/* Past Form Check Sessions Log */}
          {recentSessions && recentSessions.length > 0 && (
            <div className="glass-card p-4 rounded-3xl border border-[#7FA894]/20 space-y-3">
              <div className="text-xs font-bold text-[#F5F1E8] font-['IBM_Plex_Mono',monospace] flex items-center justify-between">
                <span>Recent Form Logs</span>
                <span className="text-[10px] text-[#7FA894]">{recentSessions.length} logged</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {recentSessions.slice(0, 4).map((s, i) => (
                  <div
                    key={s.ts || i}
                    className="p-2.5 bg-[#0B1613]/70 rounded-xl border border-[#7FA894]/20 flex items-center justify-between text-xs font-['IBM_Plex_Mono',monospace]"
                  >
                    <div>
                      <div className="font-bold text-[#F5F1E8]">{s.reps} Reps • {s.exercise}</div>
                      <div className="text-[10px] text-[#7FA894]">
                        {new Date(s.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-full bg-[#7FA894]/20 text-[#7FA894] font-bold text-[10px]">
                        {s.technique}% Tech
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
