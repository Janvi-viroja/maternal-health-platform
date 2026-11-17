import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { AdminOverview, PageId } from '../types';

interface AdminPageProps {
  onNavigate: (page: PageId) => void;
}

type AdminTab = 'users' | 'doctors' | 'appointments' | 'community';

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
  const { user, apiFetch, signInAsDemo } = useAuth();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [tab, setTab] = useState<AdminTab>('users');
  const [userSearch, setUserSearch] = useState('');

  // New doctor form
  const [docName, setDocName] = useState('');
  const [docSpec, setDocSpec] = useState('');
  const [docQual, setDocQual] = useState('');
  const [docExp, setDocExp] = useState('8');
  const [docHospital, setDocHospital] = useState('');
  const [docFee, setDocFee] = useState('900');
  const [addingDoc, setAddingDoc] = useState(false);

  const loadOverview = useCallback(async () => {
    if (!user || user.role !== 'admin') {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await apiFetch<AdminOverview>('/api/admin/overview');
      setOverview(data);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Failed to load admin overview.'
      );
    } finally {
      setLoading(false);
    }
  }, [user, apiFetch]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="rounded-3xl bg-[#F6F2FB] border border-[#E7DFF2] p-10 text-center space-y-4">
        <ShieldCheck className="w-8 h-8 text-[#5B4490] mx-auto" />
        <h1 className="text-2xl font-semibold text-[#231B24]">
          Admin Sign-In Needed
        </h1>
        <p className="text-sm text-[#5E4E5E] max-w-md mx-auto">
          Sign in with an admin account to manage users, doctors, visits, and group posts.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => void signInAsDemo('admin')}
            className="px-5 py-2.5 rounded-xl bg-[#6E56A3] text-white text-sm font-semibold hover:bg-[#59438B] cursor-pointer"
          >
            Open Demo Admin Panel
          </button>
          <button
            type="button"
            onClick={() => onNavigate('auth')}
            className="px-5 py-2.5 rounded-xl bg-white border border-[#DFCED4] text-sm font-medium text-[#231B24] cursor-pointer"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  const handleToggleUserActive = async (userId: number, current: boolean) => {
    try {
      await apiFetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !current }),
      });
      await loadOverview();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to update user.');
    }
  };

  const handleToggleDoctor = async (docId: number, current: boolean) => {
    try {
      await apiFetch(`/api/admin/doctors/${docId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isAvailable: !current }),
      });
      await loadOverview();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to update doctor.');
    }
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim() || !docSpec.trim() || !docQual.trim() || !docHospital.trim()) {
      setErrorMsg('Please fill in all required doctor details.');
      return;
    }
    setAddingDoc(true);
    setErrorMsg(null);
    try {
      await apiFetch('/api/admin/doctors', {
        method: 'POST',
        body: JSON.stringify({
          name: docName.trim(),
          specialization: docSpec.trim(),
          qualification: docQual.trim(),
          experienceYears: Number(docExp),
          hospital: docHospital.trim(),
          consultationFee: Number(docFee),
        }),
      });
      setDocName('');
      setDocSpec('');
      setDocQual('');
      setDocHospital('');
      await loadOverview();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to add doctor.');
    } finally {
      setAddingDoc(false);
    }
  };

  const handleAppointmentStatus = async (apptId: number, status: string) => {
    try {
      await apiFetch(`/api/admin/appointments/${apptId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await loadOverview();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update status.');
    }
  };

  const handleDeletePost = async (postId: number) => {
    try {
      await apiFetch(`/api/admin/posts/${postId}`, { method: 'DELETE' });
      await loadOverview();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to remove post.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-[#5B4490]">
          Site Management
        </p>
        <h1 className="text-3xl font-semibold text-[#231B24]">Admin Panel</h1>
        <p className="text-sm text-[#5E4E5E]">
          See members, manage doctors, update booked visits, and keep the moms group safe.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B]">
          {errorMsg}
        </div>
      )}

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#EDE1E5]">
          <p className="text-xs text-[#6E5C6B]">Total Users</p>
          <p className="mt-1 text-3xl font-bold text-[#231B24] tabular-nums">
            {overview?.stats.totalUsers ?? '—'}
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-[#FFF7F5] border border-[#EFE1E5]">
          <p className="text-xs text-[#6E5C6B]">Active Users</p>
          <p className="mt-1 text-3xl font-bold text-[#8E2F4C] tabular-nums">
            {overview?.stats.activeUsers ?? '—'}
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-[#F6F2FB] border border-[#E7DFF2]">
          <p className="text-xs text-[#6E5C6B]">Total Doctors</p>
          <p className="mt-1 text-3xl font-bold text-[#5B4490] tabular-nums">
            {overview?.stats.totalDoctors ?? '—'}
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-[#FFF5EE] border border-[#F2E2D7]">
          <p className="text-xs text-[#6E5C6B]">Total Visits</p>
          <p className="mt-1 text-3xl font-bold text-[#8C5B3C] tabular-nums">
            {overview?.stats.totalAppointments ?? '—'}
          </p>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1.5 rounded-2xl bg-[#FDF8F6] border border-[#EDE1E5]">
        {(
          [
            { id: 'users', label: 'Users' },
            { id: 'doctors', label: 'Doctors' },
            { id: 'appointments', label: 'Visits' },
            { id: 'community', label: 'Group Posts' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
              tab === t.id
                ? 'bg-white text-[#231B24] shadow-xs'
                : 'text-[#6E5C6B] hover:text-[#231B24]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-56 rounded-3xl bg-[#FDF8F6] animate-pulse" />
      ) : (
        overview && (
          <div className="rounded-3xl bg-white border border-[#EDE1E5] p-6 overflow-x-auto">
            {tab === 'users' && (
              <div className="space-y-4">
                <div className="relative max-w-sm">
                  <Search className="w-4 h-4 text-[#7A6879] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search member by name or email..."
                    aria-label="Search members"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#DFCED4] text-xs"
                  />
                </div>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#EDE1E5] text-xs text-[#6E5C6B]">
                      <th className="py-3 pr-4">Full Name</th>
                      <th className="py-3 pr-4">Email</th>
                      <th className="py-3 pr-4">Role</th>
                      <th className="py-3 pr-4">Week</th>
                      <th className="py-3 pr-4">Status</th>
                      <th className="py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE1E5]">
                    {overview.users
                      .filter((u) => {
                        const q = userSearch.trim().toLowerCase();
                        if (!q) return true;
                        return (
                          u.fullName.toLowerCase().includes(q) ||
                          u.email.toLowerCase().includes(q)
                        );
                      })
                      .map((u) => (
                        <tr key={u.id}>
                          <td className="py-3 pr-4 font-medium text-[#231B24]">
                            {u.fullName}
                          </td>
                          <td className="py-3 pr-4 text-xs text-[#5E4E5E]">{u.email}</td>
                          <td className="py-3 pr-4 text-xs capitalize text-[#5E4E5E]">
                            {u.role}
                          </td>
                          <td className="py-3 pr-4 text-xs tabular-nums text-[#5E4E5E]">
                            {u.pregnancyWeek ? `Wk ${u.pregnancyWeek}` : '—'}
                          </td>
                          <td className="py-3 pr-4 text-xs font-semibold">
                            <span
                              className={
                                u.isActive ? 'text-[#15803D]' : 'text-[#B91C1C]'
                              }
                            >
                              {u.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              type="button"
                              onClick={() => void handleToggleUserActive(u.id, u.isActive)}
                              className="px-3 py-1.5 rounded-lg border border-[#DFCED4] text-xs font-medium hover:bg-[#FDF8F6] cursor-pointer"
                            >
                              {u.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'doctors' && (
              <div className="space-y-8">
                <form
                  onSubmit={handleAddDoctor}
                  className="p-5 rounded-2xl bg-[#FDF8F6] border border-[#EDE1E5] space-y-4"
                >
                  <p className="text-sm font-semibold text-[#231B24]">
                    Add a New Doctor
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <input
                      type="text"
                      required
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                      placeholder="Doctor Name (e.g., Dr. Priya Nair)"
                      className="px-3 py-2 rounded-xl border border-[#DFCED4] bg-white text-xs"
                    />
                    <input
                      type="text"
                      required
                      value={docSpec}
                      onChange={(e) => setDocSpec(e.target.value)}
                      placeholder="Specialty (e.g., Women’s Care)"
                      className="px-3 py-2 rounded-xl border border-[#DFCED4] bg-white text-xs"
                    />
                    <input
                      type="text"
                      required
                      value={docQual}
                      onChange={(e) => setDocQual(e.target.value)}
                      placeholder="Degree (e.g., MBBS, MD)"
                      className="px-3 py-2 rounded-xl border border-[#DFCED4] bg-white text-xs"
                    />
                    <input
                      type="text"
                      required
                      value={docHospital}
                      onChange={(e) => setDocHospital(e.target.value)}
                      placeholder="Hospital or Clinic"
                      className="px-3 py-2 rounded-xl border border-[#DFCED4] bg-white text-xs"
                    />
                    <input
                      type="number"
                      value={docExp}
                      onChange={(e) => setDocExp(e.target.value)}
                      placeholder="Years of Experience"
                      className="px-3 py-2 rounded-xl border border-[#DFCED4] bg-white text-xs tabular-nums"
                    />
                    <input
                      type="number"
                      value={docFee}
                      onChange={(e) => setDocFee(e.target.value)}
                      placeholder="Visit Fee (INR)"
                      className="px-3 py-2 rounded-xl border border-[#DFCED4] bg-white text-xs tabular-nums"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={addingDoc}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B84A6A] text-white text-xs font-semibold hover:bg-[#9F3A58] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {addingDoc ? 'Adding...' : 'Add Doctor'}
                  </button>
                </form>

                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#EDE1E5] text-xs text-[#6E5C6B]">
                      <th className="py-3 pr-4">Doctor</th>
                      <th className="py-3 pr-4">Specialty</th>
                      <th className="py-3 pr-4">Hospital</th>
                      <th className="py-3 pr-4">Fee</th>
                      <th className="py-3 pr-4">Status</th>
                      <th className="py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE1E5]">
                    {overview.doctors.map((d) => (
                      <tr key={d.id}>
                        <td className="py-3 pr-4 font-medium text-[#231B24]">{d.name}</td>
                        <td className="py-3 pr-4 text-xs text-[#5E4E5E]">
                          {d.specialization}
                        </td>
                        <td className="py-3 pr-4 text-xs text-[#5E4E5E]">{d.hospital}</td>
                        <td className="py-3 pr-4 text-xs tabular-nums text-[#231B24]">
                          ₹{d.consultationFee}
                        </td>
                        <td className="py-3 pr-4 text-xs font-semibold">
                          <span
                            className={
                              d.isAvailable ? 'text-[#15803D]' : 'text-[#B91C1C]'
                            }
                          >
                            {d.isAvailable ? 'Available' : 'Paused'}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => void handleToggleDoctor(d.id, d.isAvailable)}
                            className="px-3 py-1.5 rounded-lg border border-[#DFCED4] text-xs font-medium hover:bg-[#FDF8F6] cursor-pointer"
                          >
                            {d.isAvailable ? 'Pause' : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'appointments' && (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#EDE1E5] text-xs text-[#6E5C6B]">
                    <th className="py-3 pr-4">Mother</th>
                    <th className="py-3 pr-4">Doctor</th>
                    <th className="py-3 pr-4">Date & Time</th>
                    <th className="py-3 pr-4">Reason</th>
                    <th className="py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDE1E5]">
                  {overview.appointments.map((a) => (
                    <tr key={a.id}>
                      <td className="py-3 pr-4 font-medium text-[#231B24]">
                        {a.patientName}
                      </td>
                      <td className="py-3 pr-4 text-xs text-[#5E4E5E]">
                        {a.doctorName}
                      </td>
                      <td className="py-3 pr-4 text-xs tabular-nums text-[#5E4E5E]">
                        {a.appointmentDate} · {a.timeSlot}
                      </td>
                      <td className="py-3 pr-4 text-xs text-[#5E4E5E]">{a.reason}</td>
                      <td className="py-3 text-right">
                        <select
                          value={a.status}
                          onChange={(e) =>
                            void handleAppointmentStatus(a.id, e.target.value)
                          }
                          className="px-2.5 py-1.5 rounded-lg border border-[#DFCED4] bg-white text-xs font-semibold"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === 'community' && (
              <div className="space-y-3">
                {overview.posts.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-[#FDF8F6] border border-[#EDE1E5] flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <p className="text-xs text-[#6E5C6B]">
                        {p.category} · {p.authorName} · {p.likesCount} helpful votes
                      </p>
                      <h3 className="text-sm font-semibold text-[#231B24]">{p.title}</h3>
                      <p className="text-xs text-[#5E4E5E]">{p.content}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDeletePost(p.id)}
                      className="p-2 rounded-lg border border-[#FECACA] bg-white text-[#B91C1C] hover:bg-[#FEF2F2] shrink-0 cursor-pointer"
                      aria-label={`Remove post ${p.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
};
