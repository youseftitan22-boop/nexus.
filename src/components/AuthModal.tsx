import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Stethoscope,
  Dumbbell,
  Microscope,
  CheckCircle2,
  X,
  User,
} from 'lucide-react';
import { authService, AuthUser, UserRole, ROLE_PERMISSIONS } from '../utils/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoleChanged?: (newRole: UserRole) => void;
  onToast: (msg: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onRoleChanged,
  onToast,
}) => {
  const [user, setUser] = useState<AuthUser>(authService.getCurrentUser());
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);

  useEffect(() => {
    const unsub = authService.subscribe((updated) => {
      if (updated) {
        setUser(updated);
        setSelectedRole(updated.role);
      }
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleApplyRole = (role: UserRole) => {
    setSelectedRole(role);
    authService.switchRole(role);
    if (onRoleChanged) onRoleChanged(role);
    onToast(`Switched active view to ${ROLE_PERMISSIONS[role].title}`);
    onClose();
  };

  const ROLES: Array<{
    id: UserRole;
    title: string;
    description: string;
    icon: any;
    color: string;
    bg: string;
  }> = [
    {
      id: 'MEMBER',
      title: 'Longevity Member',
      description: 'Standard bio-web view, Form Check kinematics, personal playbook & habits.',
      icon: User,
      color: 'text-[#7FA894]',
      bg: 'bg-[#7FA894]/20 border-[#7FA894]/30',
    },
    {
      id: 'PHYSICIAN',
      title: 'Attending Physician',
      description: 'Physician portal view with vital telemetry, EHR records, and clinical protocols.',
      icon: Stethoscope,
      color: 'text-[#5B9BD5]',
      bg: 'bg-[#5B9BD5]/20 border-[#5B9BD5]/30',
    },
    {
      id: 'TRAINER',
      title: 'Performance Coach',
      description: 'Biomechanics inspection, rep analysis, and movement coaching standards.',
      icon: Dumbbell,
      color: 'text-[#E8B04B]',
      bg: 'bg-[#E8B04B]/20 border-[#E8B04B]/30',
    },
    {
      id: 'CLINIC_SPECIALIST',
      title: 'Biomarker Specialist',
      description: 'Metabolic & HRV autonomic coherence analytics with full export capabilities.',
      icon: Microscope,
      color: 'text-[#A084DC]',
      bg: 'bg-[#A084DC]/20 border-[#A084DC]/30',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1613]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#16241F] border border-[#7FA894]/30 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-6 font-['IBM_Plex_Sans',sans-serif]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#7FA894]/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8B04B]/20 border border-[#E8B04B]/30 flex items-center justify-center text-[#E8B04B]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F5F1E8] font-['Fraunces',serif]">
                Role & Access Switcher
              </h3>
              <p className="text-xs text-[#7FA894]">
                Select active profile permissions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#0B1613] text-[#7FA894] hover:text-[#F5F1E8] flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active User Chip */}
        <div className="p-3.5 bg-[#0B1613] rounded-2xl border border-[#7FA894]/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#E8B04B]/20 text-[#E8B04B] font-bold text-xs flex items-center justify-center font-['Fraunces',serif]">
              YT
            </div>
            <div>
              <div className="text-xs font-bold text-[#F5F1E8]">{user.name}</div>
              <div className="text-[10px] text-[#7FA894] font-['IBM_Plex_Mono',monospace]">{user.email}</div>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-['IBM_Plex_Mono',monospace] ${ROLE_PERMISSIONS[user.role].badgeBg} ${ROLE_PERMISSIONS[user.role].badgeColor}`}>
            {ROLE_PERMISSIONS[user.role].title}
          </span>
        </div>

        {/* Role Cards List */}
        <div className="space-y-2.5">
          <div className="text-xs font-bold text-[#F5F1E8] font-['IBM_Plex_Mono',monospace] uppercase tracking-wider">
            Switch Active Role
          </div>
          {ROLES.map((r) => {
            const Icon = r.icon;
            const isSelected = selectedRole === r.id;
            return (
              <button
                key={r.id}
                onClick={() => handleApplyRole(r.id)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? `${r.bg} shadow-md`
                    : 'bg-[#0B1613]/50 border-[#7FA894]/20 hover:border-[#7FA894]/40 text-[#7FA894]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${r.bg} ${r.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className={`text-xs font-bold ${isSelected ? 'text-[#F5F1E8]' : 'text-[#F5F1E8]/90'}`}>
                      {r.title}
                    </div>
                    <div className="text-[11px] text-[#7FA894] leading-snug line-clamp-1">
                      {r.description}
                    </div>
                  </div>
                </div>
                {isSelected && (
                  <CheckCircle2 className={`w-4 h-4 ${r.color} shrink-0`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full min-h-[44px] py-2.5 bg-[#0B1613] hover:bg-[#0B1613]/80 border border-[#7FA894]/30 text-xs font-bold text-[#F5F1E8] rounded-xl cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
