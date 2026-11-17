import React, { useEffect, useState } from 'react';
import { AlertTriangle, Droplets, Minus, Plus, Utensils } from 'lucide-react';
import { SafeImage } from '../components/SafeImage';
import { useAuth } from '../context/AuthContext';
import { FOODS_TO_AVOID, NUTRITION_GUIDES } from '../data/pregnancyData';

export const NutritionPage: React.FC = () => {
  const { user, apiFetch } = useAuth();
  const initialTrimester: 1 | 2 | 3 = user?.pregnancyWeek
    ? user.pregnancyWeek <= 13
      ? 1
      : user.pregnancyWeek <= 27
      ? 2
      : 3
    : 2;

  const [trimester, setTrimester] = useState<1 | 2 | 3>(initialTrimester);
  const [dietType, setDietType] = useState<'vegetarian' | 'non-vegetarian'>(
    user?.dietPreference === 'non-vegetarian' ? 'non-vegetarian' : 'vegetarian'
  );
  const [manualOverride, setManualOverride] = useState(false);
  const [glasses, setGlasses] = useState<number>(5);
  const [hydrationNote, setHydrationNote] = useState<string | null>(null);

  useEffect(() => {
    if (!user || manualOverride) return;
    if (user.pregnancyWeek) {
      setTrimester(user.pregnancyWeek <= 13 ? 1 : user.pregnancyWeek <= 27 ? 2 : 3);
    }
    setDietType(user.dietPreference === 'non-vegetarian' ? 'non-vegetarian' : 'vegetarian');
  }, [user, manualOverride]);

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;

  useEffect(() => {
    if (!user) return;
    let active = true;
    apiFetch<{ hydration: { glassesCount: number } }>(
      `/api/hydration?date=${todayStr}`
    )
      .then((res) => {
        if (active && typeof res.hydration?.glassesCount === 'number') {
          setGlasses(res.hydration.glassesCount);
        }
      })
      .catch(() => {
        // Keep local default if fetch fails
      });
    return () => {
      active = false;
    };
  }, [user, apiFetch, todayStr]);

  const updateHydration = async (nextCount: number) => {
    const clamped = Math.max(0, Math.min(14, nextCount));
    setGlasses(clamped);
    setHydrationNote(null);
    if (!user) {
      setHydrationNote('Sign in to save your daily water count automatically.');
      return;
    }
    try {
      await apiFetch('/api/hydration', {
        method: 'POST',
        body: JSON.stringify({ date: todayStr, glassesCount: clamped }),
      });
      setHydrationNote('Water count saved.');
    } catch {
      setHydrationNote('Could not save your water count right now.');
    }
  };

  const guide = NUTRITION_GUIDES[trimester];
  const stageLabels: Record<1 | 2 | 3, string> = {
    1: 'Months 1–3',
    2: 'Months 4–6',
    3: 'Months 7–9',
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-[#8E2F4C]">
            Healthy Eating & Indian Home Meals
          </p>
          <h1 className="text-3xl font-semibold text-[#231B24]">
            Food & Water Plan
          </h1>
          <p className="text-sm text-[#5E4E5E]">
            Simple veg, non-veg, and home-cooked Indian food ideas for every month of pregnancy.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#FDF8F6] border border-[#EDE1E5]">
            {([1, 2, 3] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setManualOverride(true);
                  setTrimester(t);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${
                  trimester === t
                    ? 'bg-white text-[#231B24] shadow-xs'
                    : 'text-[#6E5C6B]'
                }`}
              >
                {stageLabels[t]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#FDF8F6] border border-[#EDE1E5]">
            {(
              [
                { value: 'vegetarian', label: 'Veg' },
                { value: 'non-vegetarian', label: 'Non-Veg' },
              ] as const
            ).map((pref) => (
              <button
                key={pref.value}
                type="button"
                onClick={() => {
                  setManualOverride(true);
                  setDietType(pref.value);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${
                  dietType === pref.value
                    ? 'bg-[#B84A6A] text-white'
                    : 'text-[#6E5C6B]'
                }`}
              >
                {pref.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Overview Banner + Hydration Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 rounded-3xl bg-white border border-[#EDE1E5] p-6 grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
          <div className="sm:col-span-5 aspect-[4/3] rounded-2xl overflow-hidden border border-[#EDE1E5]">
            <SafeImage
              src="/src/assets/images/nutrition_maternity_bowl_1794900598084.jpg"
              alt="Nutritious maternity meal bowl with millet, greens, pomegranate, avocado, and dal"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="sm:col-span-7 space-y-3">
            <h2 className="text-xl font-semibold text-[#231B24]">{guide.title}</h2>
            <p className="text-sm text-[#5E4E5E] leading-relaxed">
              {guide.calorieGuidance}
            </p>
            <p className="text-xs text-[#6E5C6B]">
              <strong className="text-[#231B24]">Important Foods Now:</strong>{' '}
              {guide.focusNutrients.join(' · ')}
            </p>
            <p className="text-xs text-[#8E2F4C] bg-[#FFF7F5] p-3 rounded-xl border border-[#EFE1E5]">
              <strong>Everyday Indian Foods:</strong> {guide.indianHighlight}
            </p>
          </div>
        </div>

        <div className="lg:col-span-5 rounded-3xl bg-[#F6F2FB] border border-[#E7DFF2] p-6 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-[#5B4490]">Daily Water Goal</p>
              <h3 className="text-2xl font-bold text-[#231B24] tabular-nums mt-1">
                {glasses} / 10 Glasses
              </h3>
              <p className="text-xs text-[#5E4E5E] mt-1">
                Try to drink 8–10 glasses of water, coconut water, or plain buttermilk (chaas) each day.
              </p>
            </div>
            <Droplets className="w-6 h-6 text-[#5B4490] shrink-0" />
          </div>

          <div className="grid grid-cols-10 gap-1.5 py-1">
            {Array.from({ length: 10 }, (_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => void updateHydration(idx + 1)}
                aria-label={`Set hydration to ${idx + 1} glasses`}
                className={`h-8 rounded-lg border transition-colors cursor-pointer ${
                  idx < glasses
                    ? 'bg-[#6E56A3] border-[#6E56A3]'
                    : 'bg-white border-[#DFD5EE]'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void updateHydration(glasses - 1)}
                className="p-2 rounded-xl bg-white border border-[#DFD5EE] hover:bg-[#EDE5F8] cursor-pointer"
                aria-label="Decrease water glass"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => void updateHydration(glasses + 1)}
                className="p-2 rounded-xl bg-[#6E56A3] text-white hover:bg-[#59438B] cursor-pointer"
                aria-label="Add water glass"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {hydrationNote && (
              <span className="text-xs text-[#5B4490]">{hydrationNote}</span>
            )}
          </div>
        </div>
      </div>

      {/* Daily Meal Plan Table */}
      <div className="rounded-3xl bg-white border border-[#EDE1E5] p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-2">
          <Utensils className="w-5 h-5 text-[#8E2F4C]" />
          <h2 className="text-xl font-semibold text-[#231B24]">
            {dietType === 'vegetarian' ? 'Veg' : 'Non-Veg'} Daily Food Plan · {stageLabels[trimester]}
          </h2>
        </div>

        <div className="divide-y divide-[#EDE1E5]">
          {guide.meals.map((meal) => (
            <div
              key={meal.slot}
              className="py-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-start"
            >
              <div className="md:col-span-3">
                <p className="text-sm font-semibold text-[#231B24]">{meal.slot}</p>
                <p className="text-xs text-[#7A6879] mt-0.5">{meal.keyNutrients}</p>
              </div>
              <div className="md:col-span-9 text-sm text-[#4A3B4B] leading-relaxed">
                {dietType === 'vegetarian' ? meal.vegetarian : meal.nonVegetarian}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Foods to Avoid */}
      <div className="rounded-3xl bg-[#FFF7F5] border border-[#EFE1E5] p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2 text-[#B45309]">
          <AlertTriangle className="w-5 h-5" />
          <h2 className="text-xl font-semibold text-[#231B24]">
            Foods & Habits to Skip During Pregnancy
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FOODS_TO_AVOID.map((entry) => (
            <div
              key={entry.item}
              className="p-4 rounded-2xl bg-white border border-[#EDE1E5] space-y-1.5"
            >
              <p className="text-sm font-semibold text-[#231B24]">{entry.item}</p>
              <p className="text-xs text-[#5E4E5E] leading-relaxed">{entry.reason}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
