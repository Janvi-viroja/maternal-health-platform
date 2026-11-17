import React, { useEffect, useState } from 'react';
import { Baby, ChevronLeft, ChevronRight, Ruler, Scale } from 'lucide-react';
import { BabySizeIllustration } from '../components/BabySizeIllustration';
import { useAuth } from '../context/AuthContext';
import { getWeekDetails } from '../data/pregnancyData';

const TIMELINE_ANCHORS = [4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 36, 40];

export const BabyDevelopmentPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedWeek, setSelectedWeek] = useState<number>(
    user?.pregnancyWeek && user.pregnancyWeek >= 4 ? Math.min(40, user.pregnancyWeek) : 20
  );
  const [userChangedWeek, setUserChangedWeek] = useState(false);

  useEffect(() => {
    if (!userChangedWeek && user?.pregnancyWeek && user.pregnancyWeek >= 4) {
      setSelectedWeek(Math.min(40, user.pregnancyWeek));
    }
  }, [user?.pregnancyWeek, userChangedWeek]);

  const selectWeekManually = (updater: number | ((prev: number) => number)) => {
    setUserChangedWeek(true);
    setSelectedWeek(updater);
  };

  const info = getWeekDetails(selectedWeek);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-[#6E56A3]">
            Week-by-Week Baby Growth
          </p>
          <h1 className="text-3xl font-semibold text-[#231B24]">
            How Your Baby Grows
          </h1>
          <p className="text-sm text-[#5E4E5E]">
            See your baby’s size compared to everyday fruits and learn what grows each week from Week 4 to 40.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => selectWeekManually((w) => Math.max(4, w - 1))}
            className="p-2.5 rounded-xl border border-[#EDE1E5] bg-white hover:bg-[#FFF4F5] cursor-pointer"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-4 py-2 rounded-xl bg-[#FCE7EE] text-[#8E2F4C] text-sm font-semibold tabular-nums">
            Week {selectedWeek}
          </span>
          <button
            type="button"
            onClick={() => selectWeekManually((w) => Math.min(40, w + 1))}
            className="p-2.5 rounded-xl border border-[#EDE1E5] bg-white hover:bg-[#FFF4F5] cursor-pointer"
            aria-label="Next week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Week Selector Ribbon */}
      <div className="rounded-2xl bg-[#FDF8F6] border border-[#EDE1E5] p-3 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {TIMELINE_ANCHORS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => selectWeekManually(w)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold tabular-nums transition-colors cursor-pointer ${
                selectedWeek === w
                  ? 'bg-[#B84A6A] text-white'
                  : 'bg-white text-[#5E4E5E] border border-[#EDE1E5] hover:bg-[#FFF4F5]'
              }`}
            >
              Wk {w}
            </button>
          ))}
        </div>
      </div>

      {/* Main Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5 flex flex-col gap-4">
          <BabySizeIllustration
            motif={info.motif}
            sizeLabel={info.sizeComparison}
            week={selectedWeek}
          />
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-[#EDE1E5] flex items-center gap-3">
              <Ruler className="w-5 h-5 text-[#8E2F4C] shrink-0" />
              <div>
                <p className="text-xs text-[#6E5C6B]">Baby Length</p>
                <p className="text-lg font-bold text-[#231B24] tabular-nums">
                  {info.lengthCm}
                </p>
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-[#EDE1E5] flex items-center gap-3">
              <Scale className="w-5 h-5 text-[#6E56A3] shrink-0" />
              <div>
                <p className="text-xs text-[#6E5C6B]">Baby Weight</p>
                <p className="text-lg font-bold text-[#231B24] tabular-nums">
                  {info.weightGrams}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 rounded-3xl bg-white border border-[#EDE1E5] p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between gap-4 border-b border-[#EDE1E5] pb-4">
            <div>
              <p className="text-xs font-medium text-[#6E5C6B]">
                Stage {info.trimester} of 3 · Baby Summary
              </p>
              <h2 className="text-2xl font-semibold text-[#231B24] mt-1">
                Baby is about the size of a {info.sizeComparison}
              </h2>
            </div>
            <Baby className="w-7 h-7 text-[#B84A6A] shrink-0" />
          </div>

          <p className="text-base text-[#4A3B4B] leading-relaxed">
            {info.babyDevelopment}
          </p>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#231B24]">
              What Your Baby Is Growing This Week
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {info.keyMilestones.map((milestone, index) => (
                <div
                  key={milestone}
                  className="p-4 rounded-2xl bg-[#FDF8F6] border border-[#EDE1E5] flex items-start gap-3"
                >
                  <span className="text-xs font-mono font-semibold text-[#8E2F4C] tabular-nums mt-0.5">
                    0{index + 1}
                  </span>
                  <span className="text-sm text-[#231B24]">{milestone}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FFF5EE] border border-[#F2E2D7]">
            <p className="text-xs font-semibold text-[#8C5B3C]">
              Doctor Checkup Around Week {selectedWeek}
            </p>
            <p className="text-sm text-[#4A3B4B] mt-1">{info.upcomingCheckup}</p>
          </div>
        </div>
      </div>

      {/* Full Trimester Timeline Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[#FFF7F5] border border-[#EDE1E5] space-y-2">
          <p className="text-xs font-semibold text-[#8E2F4C]">Months 1–3 (Weeks 1–13)</p>
          <h3 className="text-lg font-semibold text-[#231B24]">Baby Starts Growing</h3>
          <p className="text-sm text-[#5E4E5E] leading-relaxed">
            Your baby’s tiny heart starts beating, arms and legs appear, and all main body parts begin taking shape.
          </p>
        </div>
        <div className="p-6 rounded-2xl bg-[#F6F2FB] border border-[#E7DFF2] space-y-2">
          <p className="text-xs font-semibold text-[#5B4490]">Months 4–6 (Weeks 14–27)</p>
          <h3 className="text-lg font-semibold text-[#231B24]">First Kicks & Hearing</h3>
          <p className="text-sm text-[#5E4E5E] leading-relaxed">
            Bones get stronger, you feel baby’s first gentle kicks, and your baby begins hearing your voice.
          </p>
        </div>
        <div className="p-6 rounded-2xl bg-[#FFF5EE] border border-[#F2E2D7] space-y-2">
          <p className="text-xs font-semibold text-[#8C5B3C]">Months 7–9 (Weeks 28–40)</p>
          <h3 className="text-lg font-semibold text-[#231B24]">Getting Ready for Birth</h3>
          <p className="text-sm text-[#5E4E5E] leading-relaxed">
            Baby’s brain grows fast, healthy baby fat builds to keep warm, and baby turns head-down for delivery.
          </p>
        </div>
      </div>
    </div>
  );
};
