import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle2, Heart, Minus, Plus, Sparkles } from 'lucide-react';
import { BabySizeIllustration } from '../components/BabySizeIllustration';
import { useAuth } from '../context/AuthContext';
import { calculatePregnancyDates, getWeekDetails } from '../data/pregnancyData';

export const PregnancyTrackerPage: React.FC = () => {
  const { user, apiFetch, setUserProfileState } = useAuth();

  const [mode, setMode] = useState<'lmp' | 'edd'>('lmp');
  const [lmpInput, setLmpInput] = useState(user?.lmpDate || '2026-06-01');
  const [eddInput, setEddInput] = useState(user?.expectedDeliveryDate || '2027-03-08');
  const [activeWeek, setActiveWeek] = useState<number>(user?.pregnancyWeek || 24);
  const [calculatedEdd, setCalculatedEdd] = useState<string>(
    user?.expectedDeliveryDate || '2027-03-08'
  );
  const [daysRemaining, setDaysRemaining] = useState<number>(
    () =>
      calculatePregnancyDates({
        lmpDate: user?.lmpDate || undefined,
        eddDate: !user?.lmpDate ? user?.expectedDeliveryDate || '2027-03-08' : undefined,
      })?.daysRemaining ?? 112
  );
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user?.pregnancyWeek) {
      setActiveWeek(user.pregnancyWeek);
    }
    if (user?.lmpDate) {
      setLmpInput(user.lmpDate);
      const calc = calculatePregnancyDates({ lmpDate: user.lmpDate });
      if (calc) {
        setCalculatedEdd(calc.expectedDeliveryDate);
        setEddInput(calc.expectedDeliveryDate);
        setDaysRemaining(calc.daysRemaining);
      }
    } else if (user?.expectedDeliveryDate) {
      setEddInput(user.expectedDeliveryDate);
      setCalculatedEdd(user.expectedDeliveryDate);
      const calc = calculatePregnancyDates({ eddDate: user.expectedDeliveryDate });
      if (calc) {
        setLmpInput(calc.lmpDate);
        setDaysRemaining(calc.daysRemaining);
      }
    } else {
      const calc = calculatePregnancyDates({ lmpDate: '2026-06-01' });
      if (calc) {
        setDaysRemaining(calc.daysRemaining);
      }
    }
  }, [user]);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSaveMessage(null);
    const calc =
      mode === 'lmp'
        ? calculatePregnancyDates({ lmpDate: lmpInput })
        : calculatePregnancyDates({ eddDate: eddInput });

    if (!calc) {
      setErrorMsg('Please enter a valid calendar date.');
      return;
    }

    setActiveWeek(Math.min(40, Math.max(4, calc.week)));
    setLmpInput(calc.lmpDate);
    setEddInput(calc.expectedDeliveryDate);
    setCalculatedEdd(calc.expectedDeliveryDate);
    setDaysRemaining(calc.daysRemaining);
  };

  const handleSaveToProfile = async () => {
    if (!user) return;
    setSaving(true);
    setSaveMessage(null);
    setErrorMsg(null);
    try {
      const data = await apiFetch<{ user: typeof user }>('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          pregnancyWeek: activeWeek,
          lmpDate: lmpInput,
          expectedDeliveryDate: calculatedEdd,
        }),
      });
      setUserProfileState(data.user);
      setSaveMessage(`Saved Week ${activeWeek} and EDD (${calculatedEdd}) to your profile.`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save dates.');
    } finally {
      setSaving(false);
    }
  };

  const weekDetails = getWeekDetails(activeWeek);
  const progressPercent = Math.min(100, Math.round((activeWeek / 40) * 100));

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-[#8E2F4C]">
            Week Calculator & Weekly Tips
          </p>
          <h1 className="text-3xl font-semibold text-[#231B24]">
            Pregnancy Week Tracker
          </h1>
          <p className="text-sm text-[#5E4E5E]">
            Enter the first day of your last period OR your baby’s due date to check your week.
          </p>
        </div>

        {user && (
          <button
            type="button"
            onClick={handleSaveToProfile}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl bg-[#B84A6A] text-white text-xs font-semibold hover:bg-[#9F3A58] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Week to My Profile'}
          </button>
        )}
      </div>

      {saveMessage && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#166534]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B]">
          {errorMsg}
        </div>
      )}

      {/* Calculator + Weekly Progress Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleCalculate}
          className="lg:col-span-5 rounded-3xl bg-white border border-[#EDE1E5] p-6 space-y-5"
        >
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#FDF8F6] border border-[#EDE1E5]">
            <button
              type="button"
              onClick={() => setMode('lmp')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold cursor-pointer ${
                mode === 'lmp'
                  ? 'bg-white text-[#231B24] shadow-xs'
                  : 'text-[#6E5C6B]'
              }`}
            >
              By Last Period Date
            </button>
            <button
              type="button"
              onClick={() => setMode('edd')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold cursor-pointer ${
                mode === 'edd'
                  ? 'bg-white text-[#231B24] shadow-xs'
                  : 'text-[#6E5C6B]'
              }`}
            >
              By Baby’s Due Date
            </button>
          </div>

          {mode === 'lmp' ? (
            <div>
              <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
                First Day of Your Last Period
              </label>
              <input
                type="date"
                value={lmpInput}
                onChange={(e) => setLmpInput(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCED4] text-sm focus:outline-none focus:ring-2 focus:ring-[#B84A6A]/30"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
                Expected Due Date
              </label>
              <input
                type="date"
                value={eddInput}
                onChange={(e) => setEddInput(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCED4] text-sm focus:outline-none focus:ring-2 focus:ring-[#B84A6A]/30"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-[#6E56A3] text-white text-sm font-semibold hover:bg-[#59438B] transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            Check My Week & Due Date
          </button>

          <div className="pt-4 border-t border-[#EDE1E5] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#231B24]">Slide to Any Week</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveWeek((w) => Math.max(4, w - 1))}
                  aria-label="Decrease pregnancy week"
                  className="p-1 rounded-lg border border-[#EDE1E5] hover:bg-[#FFF4F5] cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[#8E2F4C] tabular-nums">
                  Week {activeWeek} / 40
                </span>
                <button
                  type="button"
                  onClick={() => setActiveWeek((w) => Math.min(40, w + 1))}
                  aria-label="Increase pregnancy week"
                  className="p-1 rounded-lg border border-[#EDE1E5] hover:bg-[#FFF4F5] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <input
              type="range"
              min={4}
              max={40}
              value={activeWeek}
              onChange={(e) => setActiveWeek(Number(e.target.value))}
              className="w-full accent-[#B84A6A] cursor-pointer"
              aria-label="Select pregnancy week"
            />
          </div>
        </form>

        {/* Progress Overview */}
        <div className="lg:col-span-7 rounded-3xl bg-[#FFF7F5] border border-[#EDE1E5] p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-[#EDE1E5]">
              <p className="text-xs text-[#6E5C6B]">You Are In</p>
              <p className="mt-1 text-2xl font-bold text-[#8E2F4C] tabular-nums">
                Week {activeWeek}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#EDE1E5]">
              <p className="text-xs text-[#6E5C6B]">Stage</p>
              <p className="mt-1 text-2xl font-bold text-[#231B24] tabular-nums">
                {weekDetails.trimester === 1
                  ? '1st 3 Mo'
                  : weekDetails.trimester === 2
                  ? 'Middle'
                  : 'Last 3 Mo'}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#EDE1E5]">
              <p className="text-xs text-[#6E5C6B]">Due Date</p>
              <p className="mt-1 text-base font-bold text-[#231B24] tabular-nums">
                {calculatedEdd}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#EDE1E5]">
              <p className="text-xs text-[#6E5C6B]">Days Left</p>
              <p className="mt-1 text-2xl font-bold text-[#5B4490] tabular-nums">
                {daysRemaining}d
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-medium text-[#5E4E5E]">
              <span>How Far Along You Are</span>
              <span className="tabular-nums font-semibold text-[#231B24]">
                {progressPercent}% ({activeWeek} of 40 weeks)
              </span>
            </div>
            <div className="h-3 rounded-full bg-white border border-[#EDE1E5] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#D87590] via-[#B84A6A] to-[#6E56A3] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-[#7A6879] pt-1">
              <span>Months 1–3 (Wk 1–13)</span>
              <span>Months 4–6 (Wk 14–27)</span>
              <span>Months 7–9 (Wk 28–40)</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#EDE1E5]">
            <p className="text-xs font-semibold text-[#6E56A3]">
              Next Checkup or Test Around This Week
            </p>
            <p className="mt-1 text-sm text-[#231B24]">{weekDetails.upcomingCheckup}</p>
          </div>
        </div>
      </div>

      {/* Weekly Baby Development + Mother Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <BabySizeIllustration
            motif={weekDetails.motif}
            sizeLabel={weekDetails.sizeComparison}
            week={activeWeek}
          />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-[#EDE1E5]">
              <p className="text-xs text-[#6E5C6B]">Baby Length</p>
              <p className="text-lg font-bold text-[#231B24] tabular-nums mt-0.5">
                {weekDetails.lengthCm}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#EDE1E5]">
              <p className="text-xs text-[#6E5C6B]">Baby Weight</p>
              <p className="text-lg font-bold text-[#231B24] tabular-nums mt-0.5">
                {weekDetails.weightGrams}
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-3xl bg-white border border-[#EDE1E5] p-6 space-y-4">
            <div className="flex items-center gap-2 text-[#8E2F4C]">
              <Sparkles className="w-5 h-5" />
              <h2 className="text-lg font-semibold text-[#231B24]">
                Baby Development · Week {activeWeek}
              </h2>
            </div>
            <p className="text-sm text-[#5E4E5E] leading-relaxed">
              {weekDetails.babyDevelopment}
            </p>
            <div className="space-y-2 pt-2 border-t border-[#EDE1E5]">
              <p className="text-xs font-semibold text-[#231B24]">Key Milestones</p>
              <ul className="space-y-2">
                {weekDetails.keyMilestones.map((m) => (
                  <li key={m} className="text-sm text-[#4A3B4B] flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#B84A6A] shrink-0" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-3xl bg-[#F6F2FB] border border-[#E7DFF2] p-6 space-y-4">
            <div className="flex items-center gap-2 text-[#5B4490]">
              <Heart className="w-5 h-5" />
              <h2 className="text-lg font-semibold text-[#231B24]">
                Mother Health Tips
              </h2>
            </div>
            <ul className="space-y-3">
              {weekDetails.motherTips.map((tip) => (
                <li
                  key={tip}
                  className="p-3.5 rounded-2xl bg-white border border-[#E7DFF2] text-sm text-[#3F3142] leading-relaxed"
                >
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
