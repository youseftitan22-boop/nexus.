import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Appointment } from '../types';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: Appointment[];
  onAddAppointment: (appointment: Appointment) => void;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  onClose,
  appointments,
  onAddAppointment,
}) => {
  const [selectedDay, setSelectedDay] = useState(19);
  const [isBookingNew, setIsBookingNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDoctor, setNewDoctor] = useState('Dr. Katrin Edwards');
  const [newTime, setNewTime] = useState('02:00 PM');
  const [newType, setNewType] = useState('Clinic Visit Appointment');

  if (!isOpen) return null;

  const daysInFeb = Array.from({ length: 28 }, (_, i) => i + 1);

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      date: `Feb ${selectedDay}, 2025`,
      time: newTime,
      title: newTitle,
      type: newType,
      doctorName: newDoctor.replace('Dr. ', ''),
      doctorSpecialty: newDoctor.includes('Katrin') ? 'Orthopedic Surgeon' : newDoctor.includes('Jerry') ? 'MS Physiotherapist' : 'ENT Specialist',
      doctorAvatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&auto=format&fit=crop&q=80',
      statusColor: 'green',
      locationOrLink: 'Suite 401, Healthlog Medical Center',
      notes: 'Scheduled by patient via calendar selector.',
    };

    onAddAppointment(newApt);
    setNewTitle('');
    setIsBookingNew(false);
  };

  return (
    <div
      id="calendar-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1613]/85 backdrop-blur-md animate-in fade-in"
    >
      <div
        id="calendar-modal-content"
        className="bg-[#16241F] rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-[#7FA894]/30 relative max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#7FA894]/20">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#0B1613] text-[#E8B04B] border border-[#7FA894]/20 flex items-center justify-center font-bold">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#F5F1E8] font-['Fraunces',serif]">Health Schedule & Appointments</h3>
              <p className="text-xs text-[#7FA894] font-['IBM_Plex_Mono',monospace]">February 2025 - Robert Smith</p>
            </div>
          </div>
          <button
            id="btn-close-calendar"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#0B1613] hover:bg-[#0B1613]/80 flex items-center justify-center text-[#7FA894] hover:text-[#F5F1E8] border border-[#7FA894]/20 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="my-5 font-['IBM_Plex_Sans',sans-serif]">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-sm font-bold text-[#F5F1E8] font-['Fraunces',serif]">February 2025</span>
            <div className="flex items-center gap-1">
              <button className="p-1 hover:bg-[#0B1613] rounded-lg text-[#7FA894] cursor-pointer">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-1 hover:bg-[#0B1613] rounded-lg text-[#7FA894] cursor-pointer">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[#7FA894] font-['IBM_Plex_Mono',monospace] mb-2">
            <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 font-['IBM_Plex_Mono',monospace]">
            {/* Empty offset days */}
            <div className="h-10" /><div className="h-10" /><div className="h-10" /><div className="h-10" /><div className="h-10" /><div className="h-10" />
            {daysInFeb.map((day) => {
              const hasAppointment = [18, 19, 20].includes(day);
              const isSelected = selectedDay === day;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`h-10 rounded-xl text-xs font-bold transition-all relative flex flex-col items-center justify-center cursor-pointer ${
                    isSelected
                      ? 'bg-[#E8B04B] text-[#0B1613] shadow-md shadow-[#E8B04B]/30 font-bold'
                      : 'hover:bg-[#0B1613] text-[#F5F1E8]'
                  }`}
                >
                  <span>{day}</span>
                  {hasAppointment && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                        isSelected ? 'bg-[#0B1613]' : 'bg-[#C1553B]'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Agenda & Booking */}
        <div className="pt-4 border-t border-[#7FA894]/20 font-['IBM_Plex_Sans',sans-serif]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#F5F1E8] uppercase tracking-wider font-['IBM_Plex_Mono',monospace]">
              Appointments for Feb {selectedDay}, 2025
            </span>
            <button
              onClick={() => setIsBookingNew(!isBookingNew)}
              className="text-xs font-bold text-[#0B1613] hover:bg-[#E8B04B]/90 flex items-center gap-1 bg-[#E8B04B] px-2.5 py-1 rounded-full cursor-pointer font-['IBM_Plex_Mono',monospace]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Book Appointment</span>
            </button>
          </div>

          {isBookingNew && (
            <form onSubmit={handleCreateAppointment} className="bg-[#0B1613]/90 p-4 rounded-2xl mb-4 border border-[#7FA894]/30">
              <div className="text-xs font-bold text-[#F5F1E8] mb-2 font-['IBM_Plex_Mono',monospace]">New Medical Appointment</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Appointment Title (e.g. ECG Checkup)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="px-3 py-2 text-xs bg-[#16241F] text-[#F5F1E8] rounded-xl border border-[#7FA894]/30 focus:outline-none focus:ring-1 focus:ring-[#E8B04B]"
                  required
                />
                <select
                  value={newDoctor}
                  onChange={(e) => setNewDoctor(e.target.value)}
                  className="px-3 py-2 text-xs bg-[#16241F] text-[#F5F1E8] rounded-xl border border-[#7FA894]/30 focus:outline-none focus:ring-1 focus:ring-[#E8B04B]"
                >
                  <option>Dr. Katrin Edwards (Orthopedic)</option>
                  <option>Dr. Ivan Jerry (Physiotherapy)</option>
                  <option>Dr. Surjeet Singh (ENT)</option>
                </select>
                <input
                  type="text"
                  placeholder="Time (e.g. 02:00 PM)"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="px-3 py-2 text-xs bg-[#16241F] text-[#F5F1E8] rounded-xl border border-[#7FA894]/30 focus:outline-none focus:ring-1 focus:ring-[#E8B04B]"
                />
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="px-3 py-2 text-xs bg-[#16241F] text-[#F5F1E8] rounded-xl border border-[#7FA894]/30 focus:outline-none focus:ring-1 focus:ring-[#E8B04B]"
                >
                  <option>Clinic Visit Appointment</option>
                  <option>Video Consultation Appointment</option>
                  <option>Complete Blood Count (CBC)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 font-['IBM_Plex_Mono',monospace]">
                <button
                  type="button"
                  onClick={() => setIsBookingNew(false)}
                  className="px-3 py-1.5 text-xs text-[#7FA894] hover:text-[#F5F1E8] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs bg-[#E8B04B] hover:bg-[#E8B04B]/90 text-[#0B1613] font-bold rounded-xl cursor-pointer shadow-sm"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          )}

          {/* List of appointments */}
          <div className="space-y-2">
            {appointments.map((apt) => (
              <div key={apt.id} className="p-3 bg-[#0B1613]/70 rounded-xl border border-[#7FA894]/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={apt.doctorAvatar} alt={apt.doctorName} className="w-9 h-9 rounded-full object-cover ring-1 ring-[#7FA894]/30" />
                  <div>
                    <div className="text-xs font-bold text-[#F5F1E8]">{apt.title}</div>
                    <div className="text-[11px] text-[#7FA894] font-['IBM_Plex_Mono',monospace]">{apt.date} at {apt.time} • Dr. {apt.doctorName} ({apt.doctorSpecialty})</div>
                  </div>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#7FA894]/20 text-[#7FA894] border border-[#7FA894]/30 font-['IBM_Plex_Mono',monospace]">
                  Confirmed
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
