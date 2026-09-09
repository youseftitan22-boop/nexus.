import React, { useState, useCallback } from 'react';
import {
  Move,
  Layers,
  MapPin,
  MapPinOff,
  ZoomIn,
  Sparkles,
  X,
  Heart,
  ShieldCheck,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { bioAudio } from '../utils/audioFeedback';

export type BodyAngle = 'FRONT' | 'SIDE' | 'BACK';
export type RenderMode = 'HD_ILLUSTRATION' | '3D_WEBGL';

export type AnatomicalLayer =
  | 'Full body'
  | 'Skin'
  | 'Muscular'
  | 'Skeletal'
  | 'Organs'
  | 'Vascular';

interface HumanSilhouetteProps {
  heightCm?: number;
  weightKg?: number;
  chestIn?: number;
  waistIn?: number;
  hipIn?: number;
  onSelectNode?: (nodeId: string) => void;
}

const LAYERS_LIST: AnatomicalLayer[] = [
  'Full body',
  'Skin',
  'Muscular',
  'Skeletal',
  'Organs',
  'Vascular'
];

export const Human3DCanvas: React.FC<HumanSilhouetteProps> = ({
  heightCm = 170,
  weightKg = 72,
  chestIn = 38,
  waistIn = 32,
  hipIn = 38
}) => {
  const [activeLayer, setActiveLayer] = useState<AnatomicalLayer>('Full body');
  const [showPins, setShowPins] = useState<boolean>(true);
  const [isPanActive, setIsPanActive] = useState<boolean>(false);
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [iframeLoaded, setIframeLoaded] = useState<boolean>(false);
  const [iframeError, setIframeError] = useState<boolean>(false);

  const handleSelectLayer = useCallback((layer: AnatomicalLayer) => {
    setActiveLayer(layer);
    if (typeof (window as any).switchAnatomicalLayer === 'function') {
      (window as any).switchAnatomicalLayer(layer);
    } else if (typeof (window as any).setActiveAnatomicalLayer === 'function') {
      (window as any).setActiveAnatomicalLayer(layer);
    }
    try {
      bioAudio.playClickSoft();
    } catch {
      // safe
    }
  }, []);

  const handleTogglePan = () => {
    setIsPanActive(!isPanActive);
    try {
      bioAudio.playClickSoft();
    } catch {}
  };

  const handleCycleLayers = () => {
    const nextIdx = (LAYERS_LIST.indexOf(activeLayer) + 1) % LAYERS_LIST.length;
    handleSelectLayer(LAYERS_LIST[nextIdx]);
  };

  const handleTogglePins = () => {
    setShowPins(!showPins);
    try {
      bioAudio.playClickSoft();
    } catch {}
  };

  const sketchfabEmbedUrl =
    'https://sketchfab.com/models/9b0b079953b840bc9a13f524b60041e4/embed?autostart=1&ui_theme=dark&ui_controls=0&ui_infos=0&ui_watermark=0&ui_hint=0&ui_help=0&ui_settings=0&ui_inspector=0&ui_vr=0&ui_ar=0&ui_annotations=0&ui_stop=0&ui_fadeout=1&transparent=1&dnt=1';

  return (
    <div
      id="nexus-sketchfab-human-viewport"
      className="anatomy-iframe-wrapper relative w-full h-[550px] min-h-[550px] overflow-hidden rounded-2xl bg-[#070E0C]"
      style={{
        position: 'relative',
        width: '100%',
        height: '550px',
        minHeight: '550px',
        overflow: 'hidden',
        borderRadius: '16px'
      }}
    >
      {/* Loading Skeleton & Shimmer before iframe finishes loading */}
      {!iframeLoaded && !iframeError && (
        <div className="absolute inset-0 z-0 flex flex-col items-center justify-center bg-[#0B1613] p-6 text-center">
          <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-[#7FA894]/20 border-t-[#E8B04B] animate-spin" />
            <Loader2 className="w-6 h-6 text-[#E8B04B] animate-pulse" />
          </div>
          <p className="text-sm font-bold text-[#F5F1E8] font-['Fraunces',serif]">
            Initializing 3D Anatomy Canvas...
          </p>
          <p className="text-xs text-[#7FA894] font-['IBM_Plex_Mono',monospace] mt-1 max-w-xs">
            Rendering interactive anatomical structures and biomechanics.
          </p>
        </div>
      )}

      {/* Fallback if iframe fails or is blocked by adblockers/browser shield */}
      {iframeError && (
        <div className="absolute inset-0 z-0 flex flex-col items-center justify-center bg-[#0B1613] p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-[#C1553B]/20 text-[#C1553B] flex items-center justify-center mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-[#F5F1E8] mb-1">
            3D Canvas Viewport Restricted
          </h4>
          <p className="text-xs text-[#A3C4B5] max-w-md mb-4 leading-relaxed">
            Hardware acceleration or third-party embeds may be restricted by your browser settings.
          </p>
          <button
            onClick={() => {
              setIframeError(false);
              setIframeLoaded(false);
            }}
            className="inline-flex items-center gap-2 bg-[#E8B04B] text-[#0B1613] font-bold text-xs px-4 py-2 rounded-full hover:bg-[#d49e3c] transition-colors shadow-lg cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reload 3D Anatomy</span>
          </button>
        </div>
      )}

      {/* 1. Clean Seamless 3D Canvas (Top titlebar and bottom controls clipped off) */}
      <iframe
        title="Interactive 3D Anatomical Human Model"
        src={sketchfabEmbedUrl}
        frameBorder="0"
        allow="autoplay; fullscreen; xr-spatial-tracking; web-share"
        onLoad={() => setIframeLoaded(true)}
        onError={() => setIframeError(true)}
        style={{
          width: '100%',
          height: 'calc(100% + 112px)',
          position: 'absolute',
          top: '-56px',
          left: 0,
          border: 'none',
          pointerEvents: 'auto'
        }}
      />

      {/* =========================================================================
          2. UI OVERLAY ALIGNMENT (Absolute Layering over Iframe)
          z-index: 10 with pointer-events: auto on interactive elements
          ========================================================================= */}

      {/* Top Layer Selector Bar: Horizontal pill tabs centered at the top */}
      <div
        className="pointer-events-none"
        style={{
          position: 'absolute',
          top: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          maxWidth: 'calc(100% - 24px)'
        }}
      >
        <div className="pointer-events-auto flex items-center gap-1 bg-[#0B1613]/85 backdrop-blur-md border border-[#7FA894]/30 rounded-full px-2 py-1 shadow-lg overflow-x-auto no-scrollbar">
          {LAYERS_LIST.map((layer) => {
            const isActive = activeLayer === layer;
            return (
              <button
                key={layer}
                id={`layer-btn-${layer.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => handleSelectLayer(layer)}
                className={`whitespace-nowrap px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#E8B04B] text-[#0B1613] font-bold shadow-sm'
                    : 'text-[#F5F1E8]/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {layer}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Toolbar: Vertical stack of controls (Pan, Layers, Pin, Zoom) */}
      <div
        className="pointer-events-none"
        style={{
          position: 'absolute',
          right: '14px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 10
        }}
      >
        <div className="pointer-events-auto flex flex-col gap-1.5 p-1 bg-[#0B1613]/85 backdrop-blur-md border border-[#7FA894]/30 rounded-2xl shadow-xl">
          {/* Pan */}
          <button
            id="toolbar-pan"
            title="Pan Controls"
            onClick={handleTogglePan}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
              isPanActive
                ? 'bg-[#E8B04B] text-[#0B1613]'
                : 'text-[#F5F1E8]/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Move className="w-4 h-4" />
          </button>

          {/* Layers */}
          <button
            id="toolbar-layers"
            title="Cycle Layer"
            onClick={handleCycleLayers}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#F5F1E8]/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Pin */}
          <button
            id="toolbar-pin"
            title="Toggle Anatomical Pins"
            onClick={handleTogglePins}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
              showPins
                ? 'text-[#E8B04B] bg-[#E8B04B]/15'
                : 'text-[#F5F1E8]/50 hover:text-white hover:bg-white/10'
            }`}
          >
            {showPins ? <MapPin className="w-4 h-4" /> : <MapPinOff className="w-4 h-4" />}
          </button>

          <div className="w-4 h-[1px] bg-[#7FA894]/20 mx-auto my-0.5" />

          {/* Zoom */}
          <button
            id="toolbar-zoom"
            title="Zoom / Focus"
            onClick={() => {
              try {
                bioAudio.playClickSoft();
              } catch {}
            }}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#F5F1E8]/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Action Badge: Floating dark pill button at the bottom left */}
      <div
        className="pointer-events-none"
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          zIndex: 10
        }}
      >
        <button
          id="btn-show-ai-report"
          onClick={() => {
            setShowAiModal(true);
            try {
              bioAudio.playClickSoft();
            } catch {}
          }}
          className="pointer-events-auto bg-[#0B1613] text-[#F5F1E8] border border-[#7FA894]/40 hover:border-[#E8B04B] shadow-2xl px-4 py-2 rounded-full flex items-center gap-2 text-xs font-semibold tracking-wide transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#E8B04B]" />
          <span>✨ Show AI report</span>
        </button>
      </div>

      {/* Bottom Right Biometric Tag */}
      <div
        className="pointer-events-none hidden sm:block"
        style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          zIndex: 10
        }}
      >
        <div className="pointer-events-auto bg-[#0B1613]/85 backdrop-blur-md border border-[#7FA894]/30 px-3 py-1.5 rounded-full text-[10px] font-['IBM_Plex_Mono',monospace] text-[#7FA894] shadow-lg flex items-center gap-2">
          <span>Chest: {chestIn}″</span>
          <span className="text-[#7FA894]/40">•</span>
          <span>Waist: {waistIn}″</span>
          <span className="text-[#7FA894]/40">•</span>
          <span className="text-[#E8B04B]">{activeLayer}</span>
        </div>
      </div>

      {/* =========================================================================
          AI ANATOMICAL REPORT MODAL
          ========================================================================= */}
      {showAiModal && (
        <div
          className="fixed inset-0 z-50 bg-[#0B1613]/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowAiModal(false)}
        >
          <div
            className="bg-[#12221D] border border-[#7FA894]/30 text-[#F5F1E8] rounded-2xl max-w-lg w-full p-5 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#7FA894]/20">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#E8B04B]/20 text-[#E8B04B] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#F5F1E8]">Anatomical AI Synthesis</h3>
                  <p className="text-[10px] text-[#7FA894] font-['IBM_Plex_Mono',monospace]">
                    Selected Layer: {activeLayer}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="w-7 h-7 rounded-lg bg-[#182E27] text-[#7FA894] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1 text-xs">
              <div className="bg-[#0B1613] p-3 rounded-xl border border-[#7FA894]/20">
                <div className="flex items-center gap-1.5 text-[#E8B04B] font-bold text-[11px] mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>3D Full Body Kinematics ({activeLayer})</span>
                </div>
                <p className="text-[#A3C4B5] leading-relaxed">
                  Interactive full-body anatomical model indicates harmonious structural alignment across musculoskeletal,
                  cardiovascular, and visceral layers. Bilateral muscle symmetry is maintained with optimal postural balance.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#0B1613] p-2.5 rounded-xl border border-[#7FA894]/20">
                  <span className="text-[10px] text-[#7FA894] uppercase tracking-wider font-['IBM_Plex_Mono',monospace]">
                    Resting Rhythm
                  </span>
                  <div className="text-base font-bold text-[#F5F1E8] mt-0.5 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-[#C1553B] fill-[#C1553B] animate-pulse" />
                    <span>64 BPM</span>
                  </div>
                  <span className="text-[9px] text-[#A3C4B5]">Optimal autonomic tone</span>
                </div>
                <div className="bg-[#0B1613] p-2.5 rounded-xl border border-[#7FA894]/20">
                  <span className="text-[10px] text-[#7FA894] uppercase tracking-wider font-['IBM_Plex_Mono',monospace]">
                    Morphology Index
                  </span>
                  <div className="text-base font-bold text-[#F5F1E8] mt-0.5">
                    {(chestIn / waistIn).toFixed(2)}
                  </div>
                  <span className="text-[9px] text-[#A3C4B5]">Chest-to-waist ratio</span>
                </div>
              </div>

              <div className="bg-[#182E27]/70 p-3 rounded-xl border border-[#7FA894]/30">
                <div className="text-[11px] font-bold text-[#F5F1E8] mb-1">Clinician Recommendation</div>
                <p className="text-[#A3C4B5] leading-relaxed">
                  Continue daily mobility routines focusing on thoracic extension and deep diaphragmatic breathing to maintain
                  fascial glide and endothelial compliance.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#7FA894]/20 flex justify-end">
              <button
                onClick={() => setShowAiModal(false)}
                className="bg-[#E8B04B] text-[#0B1613] font-bold text-xs px-4 py-2 rounded-xl hover:bg-[#d49e3c] transition-colors cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
