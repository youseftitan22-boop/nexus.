import React, { useState } from 'react';
import { ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Video, CheckCircle2, UserCheck, Plus } from 'lucide-react';
import { Appointment } from '../types';

interface QuickAppointmentsCardProps {
  onOpenCalendar?: () => void;
  onSelectAppointment?: (appointment: Appointment) => void;
}

export const initialAppointments: Appointment[] = [
  {
    id: 'apt-1',
    date: 'Feb 18, 2025',
    time: '9:00 AM',
    title: 'Complete Blood Count (CBC)',
    type: 'Laboratory Test',
    doctorName: 'Katrin Edwards',
    doctorSpecialty: 'Orthopedic Surgeon',
    doctorAvatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120&auto=format&fit=crop&q=80',
    statusColor: 'red',
    locationOrLink: 'Lab Room 302, Central Diagnostic Wing',
    notes: 'Fasting for 8 hours required prior to the blood draw.',
  },
  {
    id: 'apt-2',
    date: 'Feb 19, 2025',
    time: '10:00 AM',
    title: 'Clinic Visit Appointment',
    type: 'In-Person Consultation',
    doctorName: 'Ivan Jerry',
    doctorSpecialty: 'MS Physiotherapist',
    doctorAvatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&auto=format&fit=crop&q=80',
    statusColor: 'green',
    locationOrLink: 'Suite 4B, Physical Therapy Center',
    notes: 'Wear comfortable athletic attire for lumbar mobility assessment.',
  },
  {
    id: 'apt-3',
    date: 'Feb 20, 2025',
    time: '11:30 AM',
    title: 'Video Consultation Appointment',
    type: 'Telehealth Call',
    doctorName: 'Surjeet Singh',
    doctorSpecialty: 'ENT Specialist',
    doctorAvatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=120&auto=format&fit=crop&q=80',
    statusColor: 'blue',
    locationOrLink: 'https://telehealth.healthlog.internal/room/9821',
    notes: 'Follow-up on seasonal rhinitis and sinus recovery.',
  },
];

export const QuickAppointmentsCard: React.FC<QuickAppointmentsCardProps> = ({
  onOpenCalendar,
  onSelectAppointment,
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const getStatusDot = (color: string) => {
    switch (color) {
      case 'red':
        return 'bg-[#C1553B] ring-[#C1553B]/30'; // Rust
      case 'green':
        return 'bg-[#7FA894] ring-[#7FA894]/30'; // Lichen
      case 'blue':
        return 'bg-[#E8B04B] ring-[#E8B04B]/30'; // Marrow
      default:
        return 'bg-[#7FA894] ring-[#7FA894]/30';
    }
  };

  return (
    <div
      id="quick-appointments-card"
      className="glass-card rounded-[22px] p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl w-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-bold text-[#F5F1E8] tracking-tight font-['Fraunces',serif]">
            Quick Appointments
          </h2>
          <span className="text-xs font-semibold text-[#E8B04B] bg-[#E8B04B]/15 border border-[#E8B04B]/30 px-2.5 py-0.5 rounded-full font-['IBM_Plex_Mono',monospace]">
            {appointments.length} Upcoming
          </span>
        </div>
        <button
          id="btn-calendar-view"
          onClick={onOpenCalendar}
          className="flex items-center gap-1 text-xs font-bold text-[#F5F1E8] hover:text-[#E8B04B] bg-[#0B1613]/70 hover:bg-[#0B1613] border border-[#7FA894]/30 px-3 py-1.5 rounded-full transition-all cursor-pointer shadow-2xs group font-['IBM_Plex_Mono',monospace]"
        >
          <span>Calendar</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#E8B04B] group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Appointment Cards Carousel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {appointments.map((apt) => (
          <div
            key={apt.id}
            id={`appointment-${apt.id}`}
            onClick={() => {
              setSelectedId(apt.id);
              onSelectAppointment?.(apt);
            }}
            className={`group bg-[#0B1613]/60 hover:bg-[#0B1613]/90 rounded-2xl p-4 border transition-all duration-200 cursor-pointer flex flex-col justify-between relative shadow-2xs hover:shadow-md hover:-translate-y-0.5 ${
              selectedId === apt.id ? 'border-[#E8B04B] ring-2 ring-[#E8B04B]/30' : 'border-[#7FA894]/20'
            }`}
          >
            {/* Top row: Date/Time + Status dot */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-medium text-[#7FA894] flex items-center gap-1 font-['IBM_Plex_Mono',monospace]">
                  <Clock className="w-3 h-3 text-[#7FA894]" />
                  {apt.date} - {apt.time}
                </span>
                <span className={`w-2.5 h-2.5 rounded-full ring-4 ${getStatusDot(apt.statusColor)}`} />
              </div>

              {/* Title */}
              <h3 className="text-sm font-bold text-[#F5F1E8] leading-snug group-hover:text-[#E8B04B] transition-colors line-clamp-2 min-h-[2.5rem] font-['IBM_Plex_Sans',sans-serif]">
                {apt.title}
              </h3>
            </div>

            {/* Doctor Profile Footer */}
            <div className="flex items-center gap-2.5 pt-3 mt-3 border-t border-[#7FA894]/15">
              <img
                src={apt.doctorAvatar}
                alt={apt.doctorName}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover ring-1 ring-[#7FA894]/30 shrink-0"
              />
              <div className="flex flex-col text-left leading-tight min-w-0">
                <span className="text-xs font-bold text-[#F5F1E8] truncate">{apt.doctorName}</span>
                <span className="text-[10px] text-[#7FA894] truncate font-['IBM_Plex_Mono',monospace]">{apt.doctorSpecialty}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
