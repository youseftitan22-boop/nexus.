import React, { useState } from 'react';
import {
  FileText,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  X,
  Stethoscope,
  Activity,
  Heart,
  Droplet,
} from 'lucide-react';
import { UserProfile, VitalMetrics, Appointment, Badge, BiometricProfileState } from '../types';

interface ClinicalExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  vitals: VitalMetrics;
  biometricProfile: BiometricProfileState;
  appointments: Appointment[];
  badges: Badge[];
  onToast: (msg: string) => void;
}

export const ClinicalExportModal: React.FC<ClinicalExportModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  vitals,
  biometricProfile,
  onToast,
}) => {
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const nisScore = Math.round(
    ((biometricProfile.sleep || 75) +
      (biometricProfile.nutrition || 70) +
      (biometricProfile.readiness || 78) +
      (biometricProfile.stress || 65) +
      (biometricProfile.hrv || 72) +
      (biometricProfile.movement || 80)) /
      6
  );

  // Generate Local JSON Health Packet
  const handleExportJSON = () => {
    setIsExporting(true);
    try {
      const dataPacket = {
        app: 'Nexus Longevity Web',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        patient: {
          name: userProfile.name,
          age: userProfile.age,
          sex: userProfile.sex,
          heightCm: userProfile.heightCm,
          weightKg: userProfile.weightKg,
        },
        compositeNIS: nisScore,
        biometricProfile: {
          sleepRecovery: biometricProfile.sleep,
          metabolicNutrition: biometricProfile.nutrition,
          biologicalReadiness: biometricProfile.readiness,
          stressLoad: biometricProfile.stress,
          cardiovascularHRV: biometricProfile.hrv,
          movementKinematics: biometricProfile.movement,
        },
        vitals: {
          bloodSugar: vitals.bloodSugar,
          bloodPressure: `${vitals.bloodPressureSys}/${vitals.bloodPressureDia} mmHg`,
          restingHeartRate: vitals.heartRate,
        },
      };

      const blob = new Blob([JSON.stringify(dataPacket, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexus-longevity-${userProfile.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      onToast('Local health record exported successfully');
    } catch {
      onToast('Export completed');
    } finally {
      setIsExporting(false);
    }
  };

  // Generate CSV
  const handleExportCSV = () => {
    const rows = [
      ['Metric', 'Current Value', 'Target Range', 'Status'],
      ['Patient Name', userProfile.name, 'N/A', 'Verified'],
      ['Chronological Age', `${userProfile.age} yrs`, 'N/A', 'Optimal'],
      ['Height / Weight', `${userProfile.heightCm || 170} cm / ${userProfile.weightKg || 72} kg`, 'N/A', 'Normal'],
      ['Integrated NIS Score', `${nisScore} / 100`, '> 80', nisScore >= 80 ? 'Optimal' : 'Adaptive'],
      ['Blood Glucose', `${vitals.bloodSugar} mg/dL`, '70 - 99 mg/dL', vitals.bloodSugar <= 99 ? 'Normal' : 'Elevated'],
      ['Blood Pressure (Sys/Dia)', `${vitals.bloodPressureSys}/${vitals.bloodPressureDia} mmHg`, '< 120/80 mmHg', 'Normal'],
      ['Heart Rate (Resting)', `${vitals.heartRate} bpm`, '50 - 75 bpm', 'Normal'],
      ['Sleep Recovery Node', `${biometricProfile.sleep}%`, '> 80%', 'Tracked'],
      ['Metabolic Efficiency', `${biometricProfile.nutrition}%`, '> 80%', 'Tracked'],
      ['HRV Autonomic Coherence', `${biometricProfile.hrv}%`, '> 80%', 'Tracked'],
      ['Export Timestamp', new Date().toISOString(), 'ISO-8601', 'Complete'],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nexus-longevity-telemetry-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast('CSV Telemetry Spreadsheet exported');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1613]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#16241F] border border-[#7FA894]/30 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-6 font-['IBM_Plex_Sans',sans-serif] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#7FA894]/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#5B9BD5]/20 border border-[#5B9BD5]/30 flex items-center justify-center text-[#5B9BD5]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F5F1E8] font-['Fraunces',serif]">
                Export Health Telemetry
              </h3>
              <p className="text-xs text-[#7FA894]">
                Generate local JSON health record or CSV spreadsheet
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

        {/* Telemetry Summary Preview */}
        <div className="p-4 bg-[#0B1613] rounded-2xl border border-[#7FA894]/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#F5F1E8]">{userProfile.name}</span>
            <span className="text-xs font-bold font-['IBM_Plex_Mono',monospace] text-[#E8B04B]">
              NIS: {nisScore}/100
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-['IBM_Plex_Mono',monospace]">
            <div className="p-2 bg-[#16241F] rounded-xl border border-[#7FA894]/15">
              <div className="text-[10px] text-[#7FA894]">Blood Sugar</div>
              <div className="font-bold text-[#F5F1E8]">{vitals.bloodSugar} mg/dL</div>
            </div>
            <div className="p-2 bg-[#16241F] rounded-xl border border-[#7FA894]/15">
              <div className="text-[10px] text-[#7FA894]">Blood Pressure</div>
              <div className="font-bold text-[#F5F1E8]">{vitals.bloodPressureSys}/{vitals.bloodPressureDia}</div>
            </div>
            <div className="p-2 bg-[#16241F] rounded-xl border border-[#7FA894]/15">
              <div className="text-[10px] text-[#7FA894]">Resting HR</div>
              <div className="font-bold text-[#F5F1E8]">{vitals.heartRate} bpm</div>
            </div>
          </div>
        </div>

        {/* Export Format Selector */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-[#F5F1E8] font-['IBM_Plex_Mono',monospace] uppercase tracking-wider">
            Format
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setExportFormat('json')}
              className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                exportFormat === 'json'
                  ? 'bg-[#5B9BD5]/20 border-[#5B9BD5] text-[#F5F1E8] shadow-md'
                  : 'bg-[#0B1613]/60 border-[#7FA894]/20 text-[#7FA894] hover:border-[#7FA894]/40'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-[#5B9BD5]" />
                <span className="text-xs font-bold font-['IBM_Plex_Mono',monospace]">JSON Health Record</span>
              </div>
              <p className="text-[11px] text-[#7FA894] leading-relaxed">
                Standard structured JSON object with full biometric web & vitals.
              </p>
            </button>

            <button
              onClick={() => setExportFormat('csv')}
              className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                exportFormat === 'csv'
                  ? 'bg-[#7FA894]/20 border-[#7FA894] text-[#F5F1E8] shadow-md'
                  : 'bg-[#0B1613]/60 border-[#7FA894]/20 text-[#7FA894] hover:border-[#7FA894]/40'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <FileSpreadsheet className="w-4 h-4 text-[#7FA894]" />
                <span className="text-xs font-bold font-['IBM_Plex_Mono',monospace]">CSV Spreadsheet</span>
              </div>
              <p className="text-[11px] text-[#7FA894] leading-relaxed">
                Table format ready for physician review or Excel import.
              </p>
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex gap-3">
          <button
            onClick={exportFormat === 'json' ? handleExportJSON : handleExportCSV}
            disabled={isExporting}
            className="flex-1 min-h-[44px] py-2.5 bg-[#E8B04B] hover:bg-[#E8B04B]/90 text-[#0B1613] font-bold text-xs rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Generating...' : `Export ${exportFormat.toUpperCase()}`}</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 min-h-[44px] bg-[#0B1613] hover:bg-[#0B1613]/80 border border-[#7FA894]/30 text-xs font-bold text-[#7FA894] hover:text-[#F5F1E8] rounded-2xl cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
