import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, Video, CheckCircle2 } from 'lucide-react';
import { Appointment } from '../types';

interface AppointmentDetailModalProps {
  appointment: Appointment | null;
  onClose: () => void;
}

export const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
  appointment,
  onClose,
}) => {
  const [synced, setSynced] = useState(false);
  if (!appointment) return null;

  return (
    <div
      id="appointment-detail-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1613]/85 backdrop-blur-md animate-in fade-in"
    >
      <div
        id="appointment-detail-card"
        className="bg-[#16241F] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#7FA894]/30 relative animate-in zoom-in-95"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#7FA894]/20">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#E8B04B]" />
            <h3 className="text-base font-bold text-[#F5F1E8] font-['Fraunces',serif]">Appointment Details</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#0B1613] hover:bg-[#0B1613]/80 flex items-center justify-center text-[#7FA894] hover:text-[#F5F1E8] border border-[#7FA894]/20 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="my-4 space-y-4 font-['IBM_Plex_Sans',sans-serif]">
          {/* Title & Type */}
          <div className="p-4 bg-[#0B1613]/80 rounded-2xl border border-[#7FA894]/25">
            <span className="text-[11px] font-bold text-[#E8B04B] uppercase tracking-wider block mb-1 font-['IBM_Plex_Mono',monospace]">
              {appointment.type}
            </span>
            <h4 className="text-base font-bold text-[#F5F1E8]">{appointment.title}</h4>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#7FA894] mt-2 font-['IBM_Plex_Mono',monospace]">
              <Clock className="w-3.5 h-3.5 text-[#E8B04B]" />
              <span>{appointment.date} at {appointment.time}</span>
            </div>
          </div>

          {/* Doctor Info */}
          <div className="flex items-center gap-3 p-3 bg-[#0B1613]/60 rounded-2xl border border-[#7FA894]/20">
            <img
              src={appointment.doctorAvatar}
              alt={appointment.doctorName}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-[#7FA894]/40 shadow-xs"
            />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#7FA894] font-['IBM_Plex_Mono',monospace]">Attending Physician</span>
              <span className="text-sm font-bold text-[#F5F1E8]">{appointment.doctorName}</span>
              <span className="text-xs text-[#E8B04B] font-medium">{appointment.doctorSpecialty}</span>
            </div>
          </div>

          {/* Location or Telehealth Link */}
          {appointment.locationOrLink && (
            <div className="flex items-start gap-2.5 text-xs text-[#7FA894] p-3 bg-[#0B1613]/60 rounded-xl border border-[#7FA894]/20 font-['IBM_Plex_Mono',monospace]">
              {appointment.locationOrLink.startsWith('http') ? (
                <Video className="w-4 h-4 text-[#7FA894] shrink-0 mt-0.5" />
              ) : (
                <MapPin className="w-4 h-4 text-[#C1553B] shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-semibold text-[#F5F1E8] block">Location / Access:</span>
                <span className="break-all">{appointment.locationOrLink}</span>
              </div>
            </div>
          )}

          {/* Clinical notes */}
          {appointment.notes && (
            <div className="text-xs text-[#7FA894] p-3 bg-[#E8B04B]/10 rounded-xl border border-[#E8B04B]/20 leading-relaxed font-['IBM_Plex_Sans',sans-serif]">
              <span className="font-bold text-[#E8B04B] block mb-0.5 font-['IBM_Plex_Mono',monospace]">Preparation Notes:</span>
              {appointment.notes}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#7FA894]/20 font-['IBM_Plex_Mono',monospace]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-[#7FA894] hover:text-[#F5F1E8] hover:bg-[#0B1613] rounded-xl cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={() => setSynced(true)}
            className="px-4 py-2 text-xs font-bold bg-[#E8B04B] hover:bg-[#E8B04B]/90 text-[#0B1613] rounded-xl cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            {synced ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0B1613]" />
                <span>Synced</span>
              </>
            ) : (
              <span>Add to Calendar</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
