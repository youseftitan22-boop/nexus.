import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Activity,
  FileText,
  ChevronRight,
  ShieldCheck,
  Award
} from 'lucide-react';
import { AuthUser, authService, ROLE_PERMISSIONS } from '../utils/authService';
import { UserProfile, VitalMetrics, BiometricProfileState } from '../types';

interface ClinicianPortalViewProps {
  userProfile: UserProfile;
  vitals: VitalMetrics;
  biometricProfile: BiometricProfileState;
  onOpenExport: () => void;
  onOpenAuth: () => void;
  onToast: (msg: string) => void;
}

export const ClinicianPortalView: React.FC<ClinicianPortalViewProps> = ({
  userProfile,
  vitals,
  biometricProfile,
  onOpenExport,
  onOpenAuth,
  onToast,
}) => {
  const [user, setUser] = useState<AuthUser>(authService.getCurrentUser());

  useEffect(() => {
    const unsub = authService.subscribe((u) => {
      if (u) setUser(u);
    });
    return unsub;
  }, []);

  const permissions = authService.getPermissions();

  if (user.role === 'MEMBER') {
    return null;
  }

  const nisScore = Math.round(
    ((biometricProfile.sleep || 75) +
      (biometricProfile.nutrition || 70) +
      (biometricProfile.readiness || 78) +
      (biometricProfile.stress || 65) +
      (biometricProfile.hrv || 72) +
      (biometricProfile.movement || 80)) /
      6
  );

  return (
    <div
      id="clinician-portal-bar"
      className="p-4 rounded-3xl bg-[#16241F]/90 border border-[#5B9BD5]/40 shadow-xl space-y-3 animate-in fade-in duration-300 font-['IBM_Plex_Sans',sans-serif]"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#7FA894]/20 pb-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${permissions.badgeBg} ${permissions.badgeColor}`}>
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-[#F5F1E8] font-['Fraunces',serif]">
                {permissions.title} Mode
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-['IBM_Plex_Mono',monospace] ${permissions.badgeBg} ${permissions.badgeColor}`}>
                Active Role
              </span>
            </div>
            <p className="text-[11px] text-[#7FA894]">
              Inspecting patient telemetry for <span className="text-[#F5F1E8] font-medium">{userProfile.name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenExport}
            className="px-3 py-1.5 bg-[#0B1613] hover:bg-[#0B1613]/80 border border-[#7FA894]/30 text-xs font-bold text-[#5B9BD5] rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export Telemetry</span>
          </button>
          <button
            onClick={onOpenAuth}
            className="px-3 py-1.5 bg-[#0B1613] hover:bg-[#0B1613]/80 border border-[#7FA894]/30 text-xs font-bold text-[#7FA894] hover:text-[#F5F1E8] rounded-xl cursor-pointer transition-colors"
          >
            Switch Role
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-['IBM_Plex_Mono',monospace]">
        <div className="p-2 bg-[#0B1613] rounded-xl border border-[#7FA894]/15">
          <div className="text-[10px] text-[#7FA894]">Computed NIS</div>
          <div className="font-bold text-[#E8B04B]">{nisScore}/100</div>
        </div>
        <div className="p-2 bg-[#0B1613] rounded-xl border border-[#7FA894]/15">
          <div className="text-[10px] text-[#7FA894]">Glucose Index</div>
          <div className="font-bold text-[#F5F1E8]">{vitals.bloodSugar} mg/dL</div>
        </div>
        <div className="p-2 bg-[#0B1613] rounded-xl border border-[#7FA894]/15">
          <div className="text-[10px] text-[#7FA894]">Blood Pressure</div>
          <div className="font-bold text-[#F5F1E8]">{vitals.bloodPressureSys}/{vitals.bloodPressureDia}</div>
        </div>
        <div className="p-2 bg-[#0B1613] rounded-xl border border-[#7FA894]/15">
          <div className="text-[10px] text-[#7FA894]">Resting HR</div>
          <div className="font-bold text-[#F5F1E8]">{vitals.heartRate} bpm</div>
        </div>
      </div>
    </div>
  );
};
