import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  FileCode2,
  Database,
  RefreshCw,
  Trash2,
  Download,
  X,
  CheckCircle2,
  Eye,
  EyeOff,
  Cpu
} from 'lucide-react';
import { localVault, VaultStats } from '../utils/localVault';

interface LocalVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
  onDissolve: () => void;
}

export const LocalVaultModal: React.FC<LocalVaultModalProps> = ({
  isOpen,
  onClose,
  onExport,
  onDissolve
}) => {
  const [stats, setStats] = useState<VaultStats>(() => localVault.getVaultStats());
  const [selectedKey, setSelectedKey] = useState<string>('healthlog_user_profile');
  const [rawCiphertext, setRawCiphertext] = useState<string | null>(null);
  const [decryptedValue, setDecryptedValue] = useState<any>(null);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'inspector' | 'details'>('inspector');

  const VAULT_KEYS = [
    { key: 'healthlog_user_profile', label: 'User Profile & Biometrics', category: 'Profile' },
    { key: 'healthlog_biometrics', label: 'NIS & Capacity Nodes (6D)', category: 'Telemetry' },
    { key: 'healthlog_vitals', label: 'Blood Glucose & Vitals', category: 'Biometrics' },
    { key: 'healthlog_appointments', label: 'Clinical Intake & Doctor Notes', category: 'Appointments' },
    { key: 'healthlog_form_sessions', label: 'Movement Sessions & Kinematics', category: 'Movement' },
    { key: 'healthlog_xp', label: 'XP & Longevity Rank Tier', category: 'Economy' },
    { key: 'healthlog_custom_positions', label: '3D Anatomical Spatial Markers', category: '3D Spatial' }
  ];

  const refreshInspection = async (key: string) => {
    setSelectedKey(key);
    const raw = localVault.getRawCiphertext(key);
    setRawCiphertext(raw);
    const decrypted = await localVault.getItem(key, null);
    setDecryptedValue(decrypted);
    setStats(localVault.getVaultStats());
  };

  useEffect(() => {
    if (isOpen) {
      refreshInspection(selectedKey);
    }
  }, [isOpen, selectedKey]);

  if (!isOpen) return null;

  const handleCopyCiphertext = () => {
    if (!rawCiphertext) return;
    navigator.clipboard.writeText(rawCiphertext);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1613]/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0e211a] border border-[#7FA894]/30 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-[#0B1613]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#7FA894]/15 flex items-center justify-between bg-[#16241F]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#7FA894]/20 border border-[#7FA894]/40 flex items-center justify-center text-[#7FA894]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[#F5F1E8] font-['Fraunces',serif]">
                  Local Vault Encryption
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-['IBM_Plex_Mono',monospace] bg-[#7FA894]/20 text-[#7FA894] border border-[#7FA894]/30 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  AES-GCM-256
                </span>
              </div>
              <p className="text-xs text-[#7FA894]">
                Web Crypto API Zero-Knowledge on-device telemetry protection
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#16241F] hover:bg-[#7FA894]/20 text-[#7FA894] hover:text-[#F5F1E8] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs & Metrics Summary */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {/* Key Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-['IBM_Plex_Mono',monospace]">
            <div className="p-3 rounded-2xl bg-[#16241F]/80 border border-[#7FA894]/20">
              <div className="text-[10px] text-[#7FA894] uppercase flex items-center gap-1">
                <Cpu className="w-3 h-3" /> Cipher
              </div>
              <div className="text-xs font-bold text-[#F5F1E8] mt-0.5">AES-GCM 256</div>
            </div>

            <div className="p-3 rounded-2xl bg-[#16241F]/80 border border-[#7FA894]/20">
              <div className="text-[10px] text-[#7FA894] uppercase flex items-center gap-1">
                <KeyRound className="w-3 h-3" /> Derivation
              </div>
              <div className="text-xs font-bold text-[#E8B04B] mt-0.5">PBKDF2 100k</div>
            </div>

            <div className="p-3 rounded-2xl bg-[#16241F]/80 border border-[#7FA894]/20">
              <div className="text-[10px] text-[#7FA894] uppercase flex items-center gap-1">
                <Database className="w-3 h-3" /> Encrypted Keys
              </div>
              <div className="text-xs font-bold text-[#7FA894] mt-0.5">
                {stats.encryptedKeysCount} Records
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#16241F]/80 border border-[#7FA894]/20">
              <div className="text-[10px] text-[#7FA894] uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Device State
              </div>
              <div className="text-xs font-bold text-[#7FA894] mt-0.5">Hardware Isolated</div>
            </div>
          </div>

          {/* Key Selector Pills */}
          <div>
            <label className="text-xs font-semibold text-[#F5F1E8] font-['Fraunces',serif] block mb-2">
              Inspect Encrypted Telemetry Record:
            </label>
            <div className="flex flex-wrap gap-2">
              {VAULT_KEYS.map((item) => {
                const isSelected = selectedKey === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => refreshInspection(item.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium font-['IBM_Plex_Mono',monospace] transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#E8B04B] text-[#0B1613] font-bold shadow-md shadow-[#E8B04B]/20'
                        : 'bg-[#16241F] hover:bg-[#16241F]/80 text-[#7FA894] border border-[#7FA894]/20'
                    }`}
                  >
                    <Lock className="w-3 h-3" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ciphertext vs Decrypted Memory Inspector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#7FA894] uppercase font-['IBM_Plex_Mono',monospace]">
                  On-Disk Storage (localStorage)
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-[#C1553B]/20 text-[#C1553B] rounded-md font-['IBM_Plex_Mono',monospace]">
                  Unreadable Ciphertext
                </span>
              </div>
              <button
                onClick={handleCopyCiphertext}
                disabled={!rawCiphertext}
                className="text-[11px] text-[#E8B04B] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <FileCode2 className="w-3 h-3" />
                <span>{copied ? 'Copied to Clipboard' : 'Copy Ciphertext'}</span>
              </button>
            </div>

            {/* Raw Ciphertext Box */}
            <div className="p-3.5 bg-[#0B1613] border border-[#7FA894]/20 rounded-2xl font-['IBM_Plex_Mono',monospace] text-[11px] text-[#7FA894] break-all leading-relaxed max-h-28 overflow-y-auto custom-scrollbar">
              {rawCiphertext ? (
                rawCiphertext
              ) : (
                <span className="text-[#7FA894]/50 italic">
                  Key will encrypt automatically upon next telemetry write.
                </span>
              )}
            </div>

            {/* Decrypted in-memory payload verification */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#F5F1E8] uppercase font-['IBM_Plex_Mono',monospace]">
                    Decrypted Memory View
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-[#7FA894]/20 text-[#7FA894] rounded-md font-['IBM_Plex_Mono',monospace]">
                    Active Session Only
                  </span>
                </div>
                <button
                  onClick={() => setIsRevealed(!isRevealed)}
                  className="text-[11px] text-[#7FA894] hover:text-[#F5F1E8] flex items-center gap-1 cursor-pointer"
                >
                  {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{isRevealed ? 'Hide Payload' : 'Reveal Decrypted'}</span>
                </button>
              </div>

              {isRevealed ? (
                <pre className="p-3.5 bg-[#16241F]/90 border border-[#7FA894]/30 rounded-2xl font-['IBM_Plex_Mono',monospace] text-[11px] text-[#F5F1E8] max-h-36 overflow-y-auto custom-scrollbar">
                  {decryptedValue ? JSON.stringify(decryptedValue, null, 2) : 'No data'}
                </pre>
              ) : (
                <div
                  onClick={() => setIsRevealed(true)}
                  className="p-3.5 bg-[#16241F]/40 border border-[#7FA894]/15 rounded-2xl text-center text-xs text-[#7FA894] hover:text-[#F5F1E8] cursor-pointer transition-colors"
                >
                  Click to verify in-memory decrypted representation
                </div>
              )}
            </div>
          </div>

          {/* Security Guarantees Callout */}
          <div className="p-4 rounded-2xl bg-[#7FA894]/10 border border-[#7FA894]/25 space-y-1.5 text-xs text-[#F5F1E8]/90">
            <h4 className="font-bold text-[#7FA894] flex items-center gap-1.5 font-['Fraunces',serif]">
              <ShieldCheck className="w-4 h-4" /> Zero-Knowledge Threat Model
            </h4>
            <p className="leading-relaxed text-[#7FA894]">
              Each record is encrypted using a unique random 96-bit initialization vector (IV) and authenticated with an authentication tag (AEAD). Physical device extraction, browser inspection, or unauthorized storage reads cannot decipher biometrics, clinical appointments, or NIS scores without the WebCrypto key derivation material.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#7FA894]/15 bg-[#16241F]/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={() => {
              onClose();
              onDissolve();
            }}
            className="w-full sm:w-auto px-4 py-2.5 bg-[#C1553B]/20 hover:bg-[#C1553B]/30 border border-[#C1553B]/40 text-[#C1553B] hover:text-[#F5F1E8] text-xs font-semibold rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Cryptographic Wipe (Dissolve)</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                onExport();
              }}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-[#16241F] hover:bg-[#16241F]/80 border border-[#7FA894]/30 text-[#F5F1E8] text-xs font-semibold rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4 text-[#E8B04B]" />
              <span>Export Decrypted JSON</span>
            </button>

            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-[#E8B04B] hover:bg-[#E8B04B]/90 text-[#0B1613] text-xs font-bold rounded-2xl flex items-center justify-center cursor-pointer transition-all shadow-md shadow-[#E8B04B]/20"
            >
              Close Vault
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
