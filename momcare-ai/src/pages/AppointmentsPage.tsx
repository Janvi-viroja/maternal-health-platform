import React, { useCallback, useEffect, useState } from 'react';
import { CalendarCheck, CheckCircle2, Clock, Video, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { parseJsonResponse } from '../lib/http';
import type { Appointment, Doctor, PageId } from '../types';

function getTomorrowLocalYyyyMmDd(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

interface AppointmentsPageProps {
  preselectedDoctorId?: number | null;
  preselectedSlot?: string | null;
  onNavigate: (page: PageId) => void;
}

export const AppointmentsPage: React.FC<AppointmentsPageProps> = ({
  preselectedDoctorId,
  preselectedSlot,
  onNavigate,
}) => {
  const { user, apiFetch } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const [doctorId, setDoctorId] = useState<string>('');
  const [appointmentDate, setAppointmentDate] = useState<string>(getTomorrowLocalYyyyMmDd);
  const [timeSlot, setTimeSlot] = useState<string>(preselectedSlot || '11:00 AM');
  const [consultationType, setConsultationType] = useState<string>('Video Consultation');
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const rawDocRes = await fetch('/api/doctors');
      const docRes = await parseJsonResponse<{ doctors?: Doctor[] }>(rawDocRes);
      const docList: Doctor[] = docRes.doctors || [];
      setDoctors(docList);

      setDoctorId((prev) => {
        if (prev) return prev;
        if (preselectedDoctorId) return String(preselectedDoctorId);
        return docList.length > 0 ? String(docList[0].id) : '';
      });

      if (user) {
        const apptRes = await apiFetch<{ appointments: Appointment[] }>('/api/appointments');
        setAppointments(apptRes.appointments || []);
      } else {
        setAppointments([]);
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Unable to load appointments.'
      );
    } finally {
      setLoading(false);
    }
  }, [user, apiFetch, preselectedDoctorId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (preselectedDoctorId) setDoctorId(String(preselectedDoctorId));
    if (preselectedSlot) setTimeSlot(preselectedSlot);
  }, [preselectedDoctorId, preselectedSlot]);

  const parseDoctorSlots = (doc?: Doctor): string[] => {
    const fallback = ['09:30 AM', '11:00 AM', '02:30 PM', '05:00 PM'];
    if (!doc) return fallback;
    try {
      const parsed = JSON.parse(doc.availableSlots);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
    } catch {
      return fallback;
    }
  };

  const activeDoctor = doctors.find((d) => String(d.id) === doctorId);
  const activeSlots = parseDoctorSlots(activeDoctor);

  const handleDoctorChange = (nextDoctorId: string) => {
    setDoctorId(nextDoctorId);
    const nextDoc = doctors.find((d) => String(d.id) === nextDoctorId);
    const nextSlots = parseDoctorSlots(nextDoc);
    if (!nextSlots.includes(timeSlot)) {
      setTimeSlot(nextSlots[0]);
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!user) {
      setErrorMsg('Please sign in first to book a doctor visit.');
      return;
    }
    if (!doctorId || !appointmentDate || !timeSlot || reason.trim().length < 4) {
      setErrorMsg('Please pick a doctor, date, time, and write why you are visiting.');
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch('/api/appointments', {
        method: 'POST',
        body: JSON.stringify({
          doctorId: Number(doctorId),
          appointmentDate,
          timeSlot,
          consultationType,
          reason: reason.trim(),
          notes: notes.trim() || undefined,
        }),
      });
      setReason('');
      setNotes('');
      setSuccessMsg('Your visit is booked and saved to your schedule.');
      await loadData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not book visit.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: number) => {
    setErrorMsg(null);
    try {
      await apiFetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'Cancelled' }),
      });
      await loadData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to cancel appointment.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-[#8E2F4C]">
          Easy Visit Booking & History
        </p>
        <h1 className="text-3xl font-semibold text-[#231B24]">
          Book a Doctor Visit
        </h1>
        <p className="text-sm text-[#5E4E5E]">
          Book a video call or hospital visit, and see all your upcoming and past visits.
        </p>
      </div>

      {!user && (
        <div className="p-5 rounded-2xl bg-[#F6F2FB] border border-[#E7DFF2] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm text-[#3F3142]">
            Sign in to book visits and see your saved doctor schedule.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('auth')}
            className="px-4 py-2 rounded-xl bg-[#6E56A3] text-white text-xs font-semibold hover:bg-[#59438B] whitespace-nowrap cursor-pointer"
          >
            Sign In / Try Demo
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Booking Form */}
        <form
          onSubmit={handleBook}
          className="lg:col-span-5 rounded-3xl bg-white border border-[#EDE1E5] p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-[#8E2F4C]" />
            <h2 className="text-lg font-semibold text-[#231B24]">
              Book a Visit
            </h2>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B]">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#166534]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
              Choose Doctor
            </label>
            <select
              value={doctorId}
              onChange={(e) => handleDoctorChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCED4] bg-white text-sm"
            >
              {doctors.map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.name} — {d.specialization}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
                Visit Date
              </label>
              <input
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCED4] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
                Pick a Time
              </label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCED4] bg-white text-sm"
              >
                {activeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
              How Would You Like to Meet?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'Video Consultation', label: 'Video Call', icon: Video },
                { value: 'In-Clinic Visit', label: 'Clinic Visit', icon: Building2 },
              ].map((mode) => {
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => setConsultationType(mode.value)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                      consultationType === mode.value
                        ? 'bg-[#FCE7EE] border-[#D9A7B7] text-[#8E2F4C]'
                        : 'bg-white border-[#DFCED4] text-[#5E4E5E]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
              What is this visit for? *
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Week 24 checkup or sugar test review"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCED4] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
              Extra Notes for Doctor (optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Share any symptoms, pills you take, or test reports..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCED4] text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !user}
            className="w-full py-3 px-4 rounded-xl bg-[#B84A6A] text-white text-sm font-semibold hover:bg-[#9F3A58] transition-colors cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Booking...' : 'Confirm Booking'}
          </button>
        </form>

        {/* Appointment History */}
        <div className="lg:col-span-7 rounded-3xl bg-white border border-[#EDE1E5] p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#231B24]">
              Your Booked Visits
            </h2>
            <span className="text-xs font-medium text-[#6E5C6B] tabular-nums">
              {appointments.length} total
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-24 rounded-2xl bg-[#FDF8F6] border border-[#EDE1E5] animate-pulse"
                />
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#FDF8F6] border border-[#EDE1E5] text-center space-y-2">
              <p className="text-sm font-semibold text-[#231B24]">
                No visits booked yet
              </p>
              <p className="text-xs text-[#6E5C6B]">
                Pick a doctor and time on the left to book your visit.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((appt) => (
                <div
                  key={appt.id}
                  className="p-4 rounded-2xl bg-[#FDF8F6] border border-[#EDE1E5] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#6E5C6B] tabular-nums">
                      <span>{appt.appointmentDate}</span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {appt.timeSlot}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{appt.consultationType}</span>
                    </div>
                    <h3 className="text-base font-semibold text-[#231B24]">
                      {appt.doctorName || `Specialist #${appt.doctorId}`}
                    </h3>
                    <p className="text-xs text-[#5E4E5E]">{appt.reason}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs font-semibold ${
                        appt.status === 'Confirmed'
                          ? 'text-[#15803D]'
                          : appt.status === 'Completed'
                          ? 'text-[#5B4490]'
                          : appt.status === 'Cancelled'
                          ? 'text-[#B91C1C]'
                          : 'text-[#B45309]'
                      }`}
                    >
                      {appt.status}
                    </span>
                    {appt.status === 'Confirmed' && (
                      <button
                        type="button"
                        onClick={() => void handleCancel(appt.id)}
                        className="px-3 py-1.5 rounded-lg border border-[#DFCED4] bg-white text-xs font-medium text-[#5E4E5E] hover:text-[#B91C1C] hover:border-[#FECACA] cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
