import React, { useEffect, useState } from 'react';
import { Activity, Bell, CalendarCheck, CheckCircle2, Droplets, KeyRound, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { calculatePregnancyDates, getWeekDetails } from '../data/pregnancyData';
import type { Appointment, PageId, Reminder } from '../types';

interface ProfilePageProps {
  onNavigate: (page: PageId) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { user, apiFetch, setUserProfileState, loading } = useAuth();

  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [pregnancyWeek, setPregnancyWeek] = useState('');
  const [lmpDate, setLmpDate] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [dietPreference, setDietPreference] = useState('vegetarian');
  const [medicalHistory, setMedicalHistory] = useState('');

  const [appointmentsCount, setAppointmentsCount] = useState(0);
  const [pendingRemindersCount, setPendingRemindersCount] = useState(0);
  const [hydrationGlasses, setHydrationGlasses] = useState(0);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName || '');
    setAge(user.age ? String(user.age) : '');
    setPregnancyWeek(user.pregnancyWeek ? String(user.pregnancyWeek) : '');
    setLmpDate(user.lmpDate || '');
    setExpectedDeliveryDate(user.expectedDeliveryDate || '');
    setBloodGroup(user.bloodGroup || '');
    setDietPreference(user.dietPreference || 'vegetarian');
    setMedicalHistory(user.medicalHistory || '');

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(now.getDate()).padStart(2, '0')}`;
    Promise.all([
      apiFetch<{ appointments: Appointment[] }>('/api/appointments'),
      apiFetch<{ reminders: Reminder[] }>('/api/reminders'),
      apiFetch<{ hydration: { glassesCount: number } }>(`/api/hydration?date=${todayStr}`),
    ])
      .then(([apptRes, remRes, hydRes]) => {
        setAppointmentsCount(
          (apptRes.appointments || []).filter((a) => a.status === 'Confirmed').length
        );
        setPendingRemindersCount(
          (remRes.reminders || []).filter((r) => !r.completed).length
        );
        setHydrationGlasses(hydRes.hydration?.glassesCount || 0);
      })
      .catch(() => {
        // Ignore partial summary failure
      });
  }, [user, apiFetch]);

  if (loading) {
    return <div className="h-64 rounded-3xl bg-[#FDF8F6] animate-pulse" />;
  }

  if (!user) {
    return (
      <div className="rounded-3xl bg-[#FDF8F6] border border-[#EDE1E5] p-10 text-center space-y-4">
        <h1 className="text-2xl font-semibold text-[#231B24]">
          Sign in to see your Dashboard
        </h1>
        <p className="text-sm text-[#5E4E5E] max-w-md mx-auto">
          View your pregnancy week, upcoming doctor visits, pill reminders, and personal details in one place.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('auth')}
          className="px-6 py-2.5 rounded-xl bg-[#B84A6A] text-white text-sm font-semibold hover:bg-[#9F3A58] cursor-pointer"
        >
          Sign In or Join Free
        </button>
      </div>
    );
  }

  const weekInfo = getWeekDetails(user.pregnancyWeek || 20);

  const handleLmpChange = (val: string) => {
    setLmpDate(val);
    const calc = calculatePregnancyDates({ lmpDate: val });
    if (calc) {
      setExpectedDeliveryDate(calc.expectedDeliveryDate);
      setPregnancyWeek(String(calc.week));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(null);
    if (fullName.trim().length < 2) {
      setSaveError('Please enter your full name.');
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch<{ user: typeof user }>('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          fullName: fullName.trim(),
          age: age ? Number(age) : null,
          pregnancyWeek: pregnancyWeek ? Number(pregnancyWeek) : null,
          lmpDate: lmpDate || null,
          expectedDeliveryDate: expectedDeliveryDate || null,
          bloodGroup: bloodGroup || null,
          dietPreference,
          medicalHistory: medicalHistory.trim() || null,
        }),
      });
      setUserProfileState(res.user);
      setSaveSuccess('Your maternal profile and pregnancy timeline have been saved.');
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(null);
    if (!currentPassword) {
      setPwdError('Please enter your current password.');
      return;
    }
    if (
      newPassword.length < 8 ||
      !/[A-Za-z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword)
    ) {
      setPwdError('New password must be at least 8 characters and include letters and numbers.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPwdError('New passwords do not match.');
      return;
    }
    setPwdSaving(true);
    try {
      const res = await apiFetch<{ message?: string }>('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPwdSuccess(res.message || 'Password updated successfully.');
    } catch (err: unknown) {
      setPwdError(err instanceof Error ? err.message : 'Unable to update password.');
    } finally {
      setPwdSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[#8E2F4C]">
            Your Daily Care Home
          </p>
          <h1 className="text-3xl font-semibold text-[#231B24]">
            Welcome back, {user.fullName}
          </h1>
          <p className="text-sm text-[#5E4E5E]">
            {user.email} · Blood Group {user.bloodGroup || 'Not set'} ·{' '}
            <span className="capitalize">{user.dietPreference}</span>
          </p>
        </div>

        {user.role === 'admin' && (
          <button
            type="button"
            onClick={() => onNavigate('admin')}
            className="px-4 py-2 rounded-xl bg-[#6E56A3] text-white text-xs font-semibold hover:bg-[#59438B] cursor-pointer"
          >
            Open Admin Panel
          </button>
        )}
      </div>

      {/* User Dashboard KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onNavigate('pregnancy-tracker')}
          className="text-left p-5 rounded-2xl bg-[#FFF7F5] border border-[#EFE1E5] hover:border-[#D9A7B7] transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-[#8E2F4C]">
            <span className="text-xs font-semibold">Current Week</span>
            <Activity className="w-4 h-4" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[#231B24] tabular-nums">
            {user.pregnancyWeek ? `Week ${user.pregnancyWeek}` : 'Set Week'}
          </p>
          <p className="text-xs text-[#6E5C6B] mt-1">
            Month group {weekInfo.trimester} · Size of a {weekInfo.sizeComparison}
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('appointments')}
          className="text-left p-5 rounded-2xl bg-white border border-[#EDE1E5] hover:border-[#D9A7B7] transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-[#5B4490]">
            <span className="text-xs font-semibold">Doctor Visits</span>
            <CalendarCheck className="w-4 h-4" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[#231B24] tabular-nums">
            {appointmentsCount}
          </p>
          <p className="text-xs text-[#6E5C6B] mt-1">Upcoming booked visits</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('reminders')}
          className="text-left p-5 rounded-2xl bg-[#F6F2FB] border border-[#E7DFF2] hover:border-[#BEB0DA] transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-[#5B4490]">
            <span className="text-xs font-semibold">Pending Tasks</span>
            <Bell className="w-4 h-4" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[#231B24] tabular-nums">
            {pendingRemindersCount}
          </p>
          <p className="text-xs text-[#6E5C6B] mt-1">Pills, tests & vaccines</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('nutrition')}
          className="text-left p-5 rounded-2xl bg-[#FFF5EE] border border-[#F2E2D7] hover:border-[#DFB89E] transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-[#8C5B3C]">
            <span className="text-xs font-semibold">Water Today</span>
            <Droplets className="w-4 h-4" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[#231B24] tabular-nums">
            {hydrationGlasses} / 10
          </p>
          <p className="text-xs text-[#6E5C6B] mt-1">Glasses drunk today</p>
        </button>
      </div>

      {/* Patient Profile & Pregnancy Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl bg-white border border-[#EDE1E5] p-6 sm:p-8 space-y-6"
      >
        <div className="border-b border-[#EDE1E5] pb-4">
          <h2 className="text-xl font-semibold text-[#231B24]">
            Your Personal & Pregnancy Details
          </h2>
          <p className="text-xs text-[#6E5C6B] mt-1">
            Keep your week, due date, blood group, and health notes up to date so the app matches your stage.
          </p>
        </div>

        {saveError && (
          <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B]">
            {saveError}
          </div>
        )}
        {saveSuccess && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#166534]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saveSuccess}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCED4] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
              Age
            </label>
            <input
              type="number"
              min={18}
              max={55}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCED4] text-sm tabular-nums"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
              Blood Group (optional)
            </label>
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCED4] bg-white text-sm"
            >
              <option value="">Select blood group</option>
              {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
              First Day of Last Period
            </label>
            <input
              type="date"
              value={lmpDate}
              onChange={(e) => handleLmpChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCED4] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
              Expected Due Date
            </label>
            <input
              type="date"
              value={expectedDeliveryDate}
              onChange={(e) => setExpectedDeliveryDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCED4] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
              Current Pregnancy Week (1–42)
            </label>
            <input
              type="number"
              min={1}
              max={42}
              value={pregnancyWeek}
              onChange={(e) => setPregnancyWeek(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCED4] text-sm tabular-nums"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
            Food Preference
          </label>
          <div className="flex gap-2 max-w-sm">
            {(['vegetarian', 'non-vegetarian'] as const).map((pref) => (
              <button
                key={pref}
                type="button"
                onClick={() => setDietPreference(pref)}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold capitalize cursor-pointer ${
                  dietPreference === pref
                    ? 'bg-[#FCE7EE] border-[#D9A7B7] text-[#8E2F4C]'
                    : 'bg-white border-[#DFCED4] text-[#5E4E5E]'
                }`}
              >
                {pref}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
            Health Notes & Allergies (optional)
          </label>
          <textarea
            rows={3}
            value={medicalHistory}
            onChange={(e) => setMedicalHistory(e.target.value)}
            placeholder="Share allergies, thyroid or low-iron notes, or past birth details..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCED4] text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#B84A6A] text-white text-sm font-semibold hover:bg-[#9F3A58] transition-colors cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save My Details'}
        </button>
      </form>

      {/* Change Password Form (for local email/password accounts) */}
      {!user.uid.startsWith('demo-') && (
        <form
          onSubmit={handlePasswordChange}
          className="rounded-3xl bg-[#FDF8F6] border border-[#EDE1E5] p-6 sm:p-8 space-y-5"
        >
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-[#5B4490]" />
            <div>
              <h2 className="text-lg font-semibold text-[#231B24]">
                Change Password
              </h2>
              <p className="text-xs text-[#6E5C6B]">
                For accounts registered with email & password (Google Sign-In uses your Google password).
              </p>
            </div>
          </div>

          {pwdError && (
            <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B]">
              {pwdError}
            </div>
          )}
          {pwdSuccess && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#166534]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{pwdSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCED4] bg-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="8+ chars, letters & numbers"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCED4] bg-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCED4] bg-white text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={pwdSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6E56A3] text-white text-xs font-semibold hover:bg-[#59438B] transition-colors cursor-pointer disabled:opacity-50"
          >
            <KeyRound className="w-4 h-4" />
            {pwdSaving ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      )}
    </div>
  );
};
