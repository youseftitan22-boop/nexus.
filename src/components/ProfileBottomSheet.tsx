import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  User,
  Sparkles,
  Shield,
  Download,
  Trash2,
  Check,
  Moon,
  Zap,
  Activity,
  Heart,
  Flame,
  AlertTriangle
} from 'lucide-react';
import { UserProfile, BiologicalSex } from '../types';

interface ProfileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSaveProfile: (updated: UserProfile) => void;
  onExportData: () => void;
  onDissolveData: () => void;
}

const ALL_FOCUS_NODES = [
  { id: 'sleep', name: 'Sleep', icon: Moon, desc: 'Rest & Circadian' },
  { id: 'nutrition', name: 'Nutrition', icon: Sparkles, desc: 'Metabolic & Fuel' },
  { id: 'readiness', name: 'Readiness', icon: Activity, desc: 'Autonomic CNS' },
  { id: 'stress', name: 'Stress', icon: Zap, desc: 'Cortisol & Tone' },
  { id: 'hrv', name: 'HRV', icon: Heart, desc: 'Cardiovascular' },
  { id: 'movement', name: 'Movement', icon: Flame, desc: 'Kinematic & Force' }
];

export const ProfileBottomSheet: React.FC<ProfileBottomSheetProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  onExportData,
  onDissolveData
}) => {
  const [name, setName] = useState(profile.name || 'Robert Smith');
  const [age, setAge] = useState(profile.age || 28);
  const [sex, setSex] = useState<BiologicalSex>(profile.sex || 'Male');
  const [pronouns, setPronouns] = useState(profile.pronouns || 'He/Him');
  const [avatarUrl, setAvatarUrl] = useState<string>(profile.avatarUrl || '');
  const [focusNodes, setFocusNodes] = useState<string[]>(profile.focusNodes || ['sleep', 'movement']);
  const [heightCm, setHeightCm] = useState(profile.heightCm || 170);
  const [weightKg, setWeightKg] = useState(profile.weightKg || 72);

  const [isConfirmingDissolve, setIsConfirmingDissolve] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state with incoming profile props when sheet opens or profile changes
  React.useEffect(() => {
    if (isOpen) {
      setName(profile.name || 'Robert Smith');
      setAge(profile.age || 28);
      setSex(profile.sex || 'Male');
      setPronouns(profile.pronouns || 'He/Him');
      setAvatarUrl(profile.avatarUrl || '');
      setFocusNodes(profile.focusNodes || ['sleep', 'movement']);
      setHeightCm(profile.heightCm || 170);
      setWeightKg(profile.weightKg || 72);
      setIsConfirmingDissolve(false);
    }
  }, [isOpen, profile]);

  // Close on Escape key
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Initials generator
  const getInitials = (text: string) => {
    const parts = (text || 'Your Web').trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Canvas downscaling handler (max 256x256, rejects >2MB)
  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Avatar image exceeds 2MB limit. Please select a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setAvatarUrl(dataUrl);
        }
      };
      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleFocusNode = (nodeId: string) => {
    if (focusNodes.includes(nodeId)) {
      setFocusNodes(focusNodes.filter((id) => id !== nodeId));
    } else {
      if (focusNodes.length >= 2) {
        // Replace first
        setFocusNodes([focusNodes[1], nodeId]);
      } else {
        setFocusNodes([...focusNodes, nodeId]);
      }
    }
  };

  const handleSave = () => {
    const finalName = name.trim() ? name.trim() : 'Your Web';
    onSaveProfile({
      name: finalName,
      age: Math.max(16, Math.min(100, age)),
      sex,
      pronouns: pronouns.trim() || undefined,
      avatarUrl: avatarUrl.trim() || undefined,
      focusNodes,
      heightCm,
      weightKg
    });
    onClose();
  };

  return (
    <div
      id="profile-sheet-scrim"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-[#0B1613]/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        id="profile-bottom-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-sheet-title"
        className="w-full max-w-xl max-h-[92vh] bg-[#16241F] border border-[#7FA894]/30 rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-300"
      >
        {/* Header Strip */}
        <div className="flex items-center justify-between p-5 border-b border-[#7FA894]/20 bg-[#0B1613]/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#E8B04B] uppercase tracking-wider font-['IBM_Plex_Mono',monospace]">
                Identity & Goals
              </span>
            </div>
            <h2 id="profile-sheet-title" className="text-xl font-bold text-[#F5F1E8] font-['Fraunces',serif]">
              Your Profile
            </h2>
          </div>
          <button
            id="btn-close-profile"
            onClick={onClose}
            aria-label="Close"
            className="w-10 h-10 rounded-2xl bg-[#0B1613] hover:bg-[#0B1613]/80 border border-[#7FA894]/30 flex items-center justify-center text-[#7FA894] hover:text-[#F5F1E8] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs text-[#F5F1E8]">
          {/* Avatar & Photo Upload Section */}
          <div className="flex items-center gap-4 p-4 bg-[#0B1613]/60 rounded-2xl border border-[#7FA894]/20">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden ring-2 ring-[#E8B04B]/40 bg-[#0B1613] shrink-0 flex items-center justify-center">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-[#E8B04B]/30 to-[#7FA894]/30 flex items-center justify-center font-bold text-xl text-[#F5F1E8] font-['Fraunces',serif]">
                  {getInitials(name)}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                title="Change Photo"
              >
                <Camera className="w-6 h-6 text-[#E8B04B]" />
              </button>
            </div>

            <div className="flex-1 space-y-2">
              <div>
                <span className="text-xs font-bold text-[#F5F1E8]">Avatar & Portrait</span>
                <p className="text-[11px] text-[#7FA894] leading-tight">
                  Auto-downscaled to 256px. Saved locally in browser storage — never uploaded to external servers.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFile}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[36px] px-3 py-1.5 bg-[#E8B04B]/20 hover:bg-[#E8B04B]/30 border border-[#E8B04B]/40 text-[#E8B04B] rounded-xl font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Choose Photo</span>
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    className="min-h-[36px] px-2.5 py-1.5 text-[#7FA894] hover:text-[#C1553B] rounded-xl cursor-pointer transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Name & Pronouns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#7FA894] uppercase font-['IBM_Plex_Mono',monospace]">
                Display Name <span className="text-[#E8B04B]">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Web"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#0B1613] border border-[#7FA894]/30 text-[#F5F1E8] focus:outline-none focus:ring-2 focus:ring-[#E8B04B]/40 focus:border-[#E8B04B] text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#7FA894] uppercase font-['IBM_Plex_Mono',monospace]">
                Pronouns (Optional)
              </label>
              <input
                type="text"
                value={pronouns}
                onChange={(e) => setPronouns(e.target.value)}
                placeholder="e.g. He/Him, She/Her, They/Them"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#0B1613] border border-[#7FA894]/30 text-[#F5F1E8] focus:outline-none focus:ring-2 focus:ring-[#E8B04B]/40 focus:border-[#E8B04B] text-sm"
              />
            </div>
          </div>

          {/* Age & Biological Sex */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-[#7FA894] uppercase font-['IBM_Plex_Mono',monospace]">
                  Age (16–100)
                </label>
                <span className="text-sm font-bold text-[#E8B04B] font-['IBM_Plex_Mono',monospace]">
                  {age} yrs
                </span>
              </div>
              <input
                type="range"
                min="16"
                max="100"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full h-2 bg-[#0B1613] rounded-lg appearance-none cursor-pointer accent-[#E8B04B]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#7FA894] uppercase font-['IBM_Plex_Mono',monospace] flex items-center justify-between">
                <span>Biological Sex</span>
                <span className="text-[9px] text-[#7FA894]/70 font-normal">Framing only</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5 font-['IBM_Plex_Mono',monospace]">
                {(['Male', 'Female', 'Intersex', 'Prefer not'] as BiologicalSex[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSex(s)}
                    className={`min-h-[36px] px-2 py-1 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer truncate ${
                      sex === s
                        ? 'bg-[#E8B04B] text-[#0B1613] border-[#E8B04B] font-bold shadow-xs'
                        : 'bg-[#0B1613] text-[#7FA894] border-[#7FA894]/25 hover:text-[#F5F1E8]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Body Measurements (Synced with BMI sliders) */}
          <div className="p-4 bg-[#0B1613]/60 rounded-2xl border border-[#7FA894]/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#7FA894] uppercase font-['IBM_Plex_Mono',monospace]">
                Body Biometrics (Synced with BMI Engine)
              </span>
              <span className="text-[10px] text-[#E8B04B] font-['IBM_Plex_Mono',monospace]">
                BMI: {(weightKg / ((heightCm / 100) * (heightCm / 100))).toFixed(1)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-['IBM_Plex_Mono',monospace]">
                  <span className="text-[#7FA894]">Height</span>
                  <span className="font-bold text-[#F5F1E8]">{heightCm} cm</span>
                </div>
                <input
                  type="range"
                  min="120"
                  max="220"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full h-2 bg-[#0B1613] rounded-lg appearance-none cursor-pointer accent-[#E8B04B]"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-['IBM_Plex_Mono',monospace]">
                  <span className="text-[#7FA894]">Weight</span>
                  <span className="font-bold text-[#F5F1E8]">{weightKg} kg</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="160"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-full h-2 bg-[#0B1613] rounded-lg appearance-none cursor-pointer accent-[#E8B04B]"
                />
              </div>
            </div>
          </div>

          {/* Focus Nodes (Pick ≤ 2 domains - Cosmetic) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#E8B04B] uppercase font-['IBM_Plex_Mono',monospace] tracking-wider block">
                  Focus Priorities (Select ≤ 2)
                </span>
                <p className="text-[10px] text-[#7FA894] leading-tight mt-0.5">
                  Cosmetic: Highlights focus chips and breaks Top-Fixes recommendation ties. Biophysical NIS formulas remain objective.
                </p>
              </div>
              <span className="text-xs font-bold text-[#7FA894] font-['IBM_Plex_Mono',monospace]">
                {focusNodes.length}/2
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ALL_FOCUS_NODES.map((node) => {
                const isSelected = focusNodes.includes(node.id);
                const Icon = node.icon;
                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => toggleFocusNode(node.id)}
                    className={`min-h-[44px] p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#E8B04B]/20 border-[#E8B04B] text-[#F5F1E8] shadow-sm'
                        : 'bg-[#0B1613] border-[#7FA894]/20 text-[#7FA894] hover:text-[#F5F1E8]'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-[#E8B04B] text-[#0B1613]' : 'bg-[#16241F] text-[#7FA894]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate">{node.name}</div>
                      <div className="text-[9px] opacity-75 truncate">{node.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Privacy, Export & Dissolve Strip */}
          <div className="pt-3 border-t border-[#7FA894]/20 space-y-3">
            <div className="flex items-center gap-2 text-[#7FA894]">
              <Shield className="w-4 h-4 text-[#7FA894]" />
              <span className="text-[11px] font-['IBM_Plex_Mono',monospace]">
                100% Client-Side Privacy · No Cloud Telemetry
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <button
                type="button"
                onClick={onExportData}
                className="w-full sm:flex-1 min-h-[44px] px-3 py-2 bg-[#0B1613] hover:bg-[#0B1613]/80 border border-[#7FA894]/30 text-[#F5F1E8] rounded-xl font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Download className="w-4 h-4 text-[#E8B04B]" />
                <span>Export My Data (JSON)</span>
              </button>

              {!isConfirmingDissolve ? (
                <button
                  type="button"
                  onClick={() => setIsConfirmingDissolve(true)}
                  className="w-full sm:w-auto min-h-[44px] px-3 py-2 bg-[#C1553B]/15 hover:bg-[#C1553B]/25 border border-[#C1553B]/30 text-[#C1553B] rounded-xl font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Dissolve</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      onDissolveData();
                      setIsConfirmingDissolve(false);
                      onClose();
                    }}
                    className="min-h-[44px] px-3 py-2 bg-[#C1553B] text-[#0B1613] font-bold rounded-xl flex items-center gap-1 cursor-pointer shadow-md"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Confirm Purge</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDissolve(false)}
                    className="min-h-[44px] px-2.5 py-2 bg-[#0B1613] text-[#7FA894] hover:text-[#F5F1E8] rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#7FA894]/20 bg-[#0B1613]/80 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 rounded-xl text-[#7FA894] hover:text-[#F5F1E8] font-semibold cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            id="btn-save-profile"
            type="button"
            onClick={handleSave}
            className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#E8B04B] hover:bg-[#E8B04B]/90 text-[#0B1613] font-bold shadow-lg shadow-[#E8B04B]/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Save Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};
