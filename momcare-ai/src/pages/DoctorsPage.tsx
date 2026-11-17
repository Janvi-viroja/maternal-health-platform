import React, { useEffect, useState } from 'react';
import { CalendarPlus, Clock, Search, Star, X } from 'lucide-react';
import { SafeImage } from '../components/SafeImage';
import { parseJsonResponse } from '../lib/http';
import type { Doctor, PageId } from '../types';

interface DoctorsPageProps {
  onNavigate: (page: PageId) => void;
  onSelectDoctorForBooking: (doctorId: number, slot?: string) => void;
}

export const DoctorsPage: React.FC<DoctorsPageProps> = ({
  onNavigate,
  onSelectDoctorForBooking,
}) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/doctors')
      .then(async (res) => {
        const data = await parseJsonResponse<{ doctors?: Doctor[] }>(res);
        if (active) setDoctors(data.doctors || []);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load doctors.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const parseSlots = (raw: string): string[] => {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const filtered = doctors.filter((d) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      d.name.toLowerCase().includes(q) ||
      d.specialization.toLowerCase().includes(q) ||
      d.hospital.toLowerCase().includes(q)
    );
  });

  const handleBook = (doctorId: number, slot?: string) => {
    onSelectDoctorForBooking(doctorId, slot);
    onNavigate('appointments');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-[#8E2F4C]">
            Trusted Pregnancy & Baby Doctors
          </p>
          <h1 className="text-3xl font-semibold text-[#231B24]">
            Find a Doctor
          </h1>
          <p className="text-sm text-[#5E4E5E]">
            See doctor profiles, years of care, and open times to book a visit.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#7A6879] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search doctor or hospital..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DFCED4] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#B84A6A]/30"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#991B1B]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="h-56 rounded-3xl bg-[#FDF8F6] border border-[#EDE1E5] animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-10 rounded-3xl bg-[#FDF8F6] border border-[#EDE1E5] text-center space-y-2">
          <p className="text-base font-semibold text-[#231B24]">
            No doctors found for "{search}"
          </p>
          <button
            type="button"
            onClick={() => setSearch('')}
            className="text-sm font-semibold text-[#8E2F4C] hover:underline cursor-pointer"
          >
            Show all doctors
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((doc) => {
            const slots = parseSlots(doc.availableSlots);
            return (
              <div
                key={doc.id}
                className="rounded-3xl bg-white border border-[#EDE1E5] p-6 flex flex-col justify-between gap-5"
              >
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border border-[#EDE1E5] shrink-0">
                    <SafeImage
                      src={doc.imageUrl}
                      alt={doc.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-lg font-semibold text-[#231B24] truncate">
                        {doc.name}
                      </h2>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#8C5B3C] tabular-nums shrink-0">
                        <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                        {doc.rating}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-[#8E2F4C]">
                      {doc.specialization}
                    </p>
                    <p className="text-xs text-[#6E5C6B]">
                      {doc.qualification} · {doc.experienceYears} yrs exp · {doc.hospital}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-[#5E4E5E] leading-relaxed">{doc.bio}</p>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#6E5C6B]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Next Open Times:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => handleBook(doc.id, slot)}
                        className="px-3 py-1.5 rounded-lg bg-[#FDF8F6] border border-[#EDE1E5] text-xs font-medium text-[#231B24] hover:border-[#B84A6A] hover:bg-[#FFF4F5] tabular-nums transition-colors cursor-pointer"
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#EDE1E5] flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-[#6E5C6B]">Visit Fee</p>
                    <p className="text-base font-bold text-[#231B24] tabular-nums">
                      ₹{doc.consultationFee}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDoctor(doc)}
                      className="px-3.5 py-2 rounded-xl border border-[#DFCED4] text-xs font-semibold text-[#231B24] hover:bg-[#FDF8F6] cursor-pointer"
                    >
                      About Doctor
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBook(doc.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B84A6A] text-white text-xs font-semibold hover:bg-[#9F3A58] transition-colors cursor-pointer"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                      Book Visit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Doctor Profile Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-w-lg w-full rounded-3xl bg-white border border-[#EDE1E5] p-6 sm:p-8 space-y-5 relative">
            <button
              type="button"
              onClick={() => setSelectedDoctor(null)}
              className="absolute top-5 right-5 p-2 rounded-lg text-[#5E4E5E] hover:bg-[#FDF8F6] cursor-pointer"
              aria-label="Close doctor profile"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border border-[#EDE1E5] shrink-0">
                <SafeImage
                  src={selectedDoctor.imageUrl}
                  alt={selectedDoctor.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[#231B24]">
                  {selectedDoctor.name}
                </h3>
                <p className="text-sm font-medium text-[#8E2F4C]">
                  {selectedDoctor.specialization}
                </p>
                <p className="text-xs text-[#6E5C6B] mt-0.5">
                  {selectedDoctor.qualification}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#FDF8F6] border border-[#EDE1E5]">
                <p className="text-[#6E5C6B]">Experience</p>
                <p className="font-semibold text-[#231B24] tabular-nums mt-0.5">
                  {selectedDoctor.experienceYears} Years
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#FDF8F6] border border-[#EDE1E5]">
                <p className="text-[#6E5C6B]">Languages</p>
                <p className="font-semibold text-[#231B24] mt-0.5">
                  {selectedDoctor.languages}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#FDF8F6] border border-[#EDE1E5] col-span-2">
                <p className="text-[#6E5C6B]">Hospital / Clinic</p>
                <p className="font-semibold text-[#231B24] mt-0.5">
                  {selectedDoctor.hospital}
                </p>
              </div>
            </div>

            <p className="text-sm text-[#4A3B4B] leading-relaxed">{selectedDoctor.bio}</p>

            <button
              type="button"
              onClick={() => handleBook(selectedDoctor.id)}
              className="w-full py-3 px-4 rounded-xl bg-[#B84A6A] text-white text-sm font-semibold hover:bg-[#9F3A58] transition-colors cursor-pointer"
            >
              Book Visit with {selectedDoctor.name}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
