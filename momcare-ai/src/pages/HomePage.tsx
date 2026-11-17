import React from 'react';
import {
  Activity,
  ArrowRight,
  Baby,
  Bell,
  Bot,
  CalendarCheck,
  HeartHandshake,
  MessageSquareHeart,
  ShieldAlert,
  Stethoscope,
  UtensilsCrossed,
} from 'lucide-react';
import { SafeImage } from '../components/SafeImage';
import { useAuth } from '../context/AuthContext';
import type { PageId } from '../types';

interface HomePageProps {
  onNavigate: (page: PageId) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  return (
    <div className="bg-[#FFFDFB]">
      {/* Hero Split */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 lg:pt-14 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
            <p className="text-xs font-semibold tracking-wide text-[#8E2F4C]">
              Pregnancy & Baby Care · Every Step Made Simple
            </p>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-[#231B24] leading-[1.12] [text-wrap:balance]">
              Simple, friendly help for every week of pregnancy
            </h1>
            <p className="text-base sm:text-lg text-[#5E4E5E] leading-relaxed max-w-xl">
              Check what week you are in, see how big your baby is, plan healthy daily meals, book doctor visits, and ask simple health questions anytime.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => onNavigate(user ? 'pregnancy-tracker' : 'auth')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#B84A6A] text-white text-sm font-semibold hover:bg-[#9F3A58] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {user ? 'Check My Pregnancy Week' : 'Join Free / Sign In'}
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('ai-assistant')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-[#DFCED4] bg-white text-[#231B24] text-sm font-medium hover:bg-[#FFF4F5] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Ask AI Helper
              </button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="h-72 sm:h-96 lg:h-full min-h-[340px] rounded-3xl overflow-hidden border border-[#EDE1E5] bg-[#FDF2F5]">
              <SafeImage
                src="/src/assets/images/hero_maternity_care_1794900596594.jpg"
                alt="Expectant mother smiling warmly by a sunlit linen window"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* 4-column quick-entry strip below hero split */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => onNavigate('pregnancy-tracker')}
            className="text-left p-5 rounded-2xl bg-[#FFF7F5] border border-[#EFE1E5] hover:border-[#D9A7B7] transition-colors cursor-pointer"
          >
            <p className="text-xs font-medium text-[#7A6879]">Your Week</p>
            <p className="mt-1 text-base font-semibold text-[#231B24] tabular-nums">
              Week 1 to 40 Tracker
            </p>
            <p className="mt-1 text-xs text-[#5E4E5E]">
              Find your due date and see what changes each week.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('ai-assistant')}
            className="text-left p-5 rounded-2xl bg-[#F6F2FB] border border-[#E7DFF2] hover:border-[#BEB0DA] transition-colors cursor-pointer"
          >
            <p className="text-xs font-medium text-[#6B5A8E]">24/7 Smart Helper</p>
            <p className="mt-1 text-base font-semibold text-[#231B24]">
              Ask Any Question
            </p>
            <p className="mt-1 text-xs text-[#5E4E5E]">
              Get easy answers on symptoms, food, and when to call a doctor.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('doctors')}
            className="text-left p-5 rounded-2xl bg-[#FFF5EE] border border-[#F2E2D7] hover:border-[#DFB89E] transition-colors cursor-pointer"
          >
            <p className="text-xs font-medium text-[#8C5B3C]">Talk to a Doctor</p>
            <p className="mt-1 text-base font-semibold text-[#231B24] tabular-nums">
              Women’s & Baby Doctors
            </p>
            <p className="mt-1 text-xs text-[#5E4E5E]">
              Pick a trusted doctor and book a video call or clinic visit.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('postpartum')}
            className="text-left p-5 rounded-2xl bg-[#FFFFFF] border border-[#EDE1E5] hover:border-[#D9A7B7] transition-colors cursor-pointer"
          >
            <p className="text-xs font-medium text-[#7A6879]">After Delivery</p>
            <p className="mt-1 text-base font-semibold text-[#231B24]">
              Mom & Newborn Care
            </p>
            <p className="mt-1 text-xs text-[#5E4E5E]">
              Simple tips for healing, feeding your baby, and tracking sleep.
            </p>
          </button>
        </div>
      </section>

      {/* Core Care Capabilities - Asymmetric Bento */}
      <section className="border-t border-[#EFE4E8] bg-[#FDF8F6] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div className="max-w-2xl space-y-2">
              <p className="text-xs font-semibold text-[#8E2F4C]">
                All Your Care in One Place
              </p>
              <h2 className="text-3xl font-semibold text-[#231B24] [text-wrap:balance]">
                Everything you need for pregnancy and after birth, made easy
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('services')}
              className="text-sm font-semibold text-[#8E2F4C] hover:text-[#6B2138] inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              See all tools & help
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 rounded-3xl bg-white border border-[#EDE1E5] p-6 sm:p-8 flex flex-col justify-between gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FCE7EE] text-[#9F3A58] flex items-center justify-center">
                    <UtensilsCrossed className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#231B24]">
                    Healthy Daily Meal Plans
                  </h3>
                  <p className="text-sm text-[#5E4E5E] leading-relaxed">
                    Easy veg and non-veg Indian meal ideas for breakfast, lunch, snacks, and dinner—plus a one-tap daily water tracker.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('nutrition')}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#8E2F4C] hover:underline cursor-pointer"
                  >
                    See Food & Water Plan
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-[#EDE1E5]">
                  <SafeImage
                    src="/src/assets/images/nutrition_maternity_bowl_1794900598084.jpg"
                    alt="Wholesome maternity nutrition bowl with grains, spinach, pomegranate, avocado, and dal"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-[#F6F2FB] border border-[#E7DFF2] p-6 sm:p-8 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-white text-[#5B4490] flex items-center justify-center border border-[#E7DFF2]">
                  <Bot className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-semibold text-[#231B24]">
                  Ask MomCare AI Helper
                </h3>
                <p className="text-sm text-[#5E4E5E] leading-relaxed">
                  Ask about morning sickness, back pain, healthy foods, or what to ask your doctor. It alerts you right away if a symptom needs urgent hospital care.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('ai-assistant')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#6E56A3] text-white text-sm font-medium hover:bg-[#59438B] transition-colors cursor-pointer"
              >
                Chat with AI Helper
              </button>
            </div>

            <div className="rounded-3xl bg-white border border-[#EDE1E5] p-6 sm:p-8 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFF5EE] text-[#A25B34] flex items-center justify-center">
                  <Baby className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-semibold text-[#231B24]">
                  How Big Is My Baby?
                </h3>
                <p className="text-sm text-[#5E4E5E] leading-relaxed">
                  See your baby’s size compared to everyday fruits, plus how long and heavy your baby is from Week 4 to Week 40.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('baby-development')}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#8E2F4C] hover:underline cursor-pointer"
              >
                See Baby Growth
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="md:col-span-2 rounded-3xl bg-white border border-[#EDE1E5] p-6 sm:p-8 flex flex-col justify-between gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-[#EDE1E5]">
                  <SafeImage
                    src="/src/assets/images/postpartum_mother_baby_1794900598814.jpg"
                    alt="New mother holding her newborn wrapped in pastel muslin swaddle"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF5EE] text-[#A25B34] flex items-center justify-center">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#231B24]">
                    After-Birth Healing & Baby Care
                  </h3>
                  <p className="text-sm text-[#5E4E5E] leading-relaxed">
                    Simple breastfeeding tips, newborn sleep safety, mood support, and an easy daily log for sleep, feeds, and how your body feels.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('postpartum')}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#8E2F4C] hover:underline cursor-pointer"
                  >
                    Open After Birth Care
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Specialist Doctors + Proof */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 space-y-4">
            <p className="text-xs font-semibold text-[#6E56A3]">
              Doctors & Reminders
            </p>
            <h2 className="text-3xl font-semibold text-[#231B24] [text-wrap:balance]">
              Book doctor visits and never forget pills or checkups
            </h2>
            <p className="text-sm sm:text-base text-[#5E4E5E] leading-relaxed">
              Book a video call or clinic visit with women’s and baby doctors in seconds, and keep simple daily reminders for iron pills, scans, and vaccines.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-[#FDF8F6] border border-[#EDE1E5]">
                <p className="text-2xl font-bold text-[#231B24] tabular-nums">40 Weeks</p>
                <p className="text-xs text-[#6E5C6B] mt-1">Easy week-by-week guide</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#FDF8F6] border border-[#EDE1E5]">
                <p className="text-2xl font-bold text-[#231B24] tabular-nums">24/7</p>
                <p className="text-xs text-[#6E5C6B] mt-1">Instant warning-sign alerts</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('appointments')}
                className="px-5 py-2.5 rounded-xl bg-[#B84A6A] text-white text-sm font-semibold hover:bg-[#9F3A58] transition-colors cursor-pointer"
              >
                Book a Doctor Visit
              </button>
              <button
                type="button"
                onClick={() => onNavigate('reminders')}
                className="px-5 py-2.5 rounded-xl border border-[#DFCED4] text-sm font-medium text-[#231B24] hover:bg-[#FFF4F5] transition-colors cursor-pointer"
              >
                My Pill & Checkup Alerts
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="rounded-3xl bg-white border border-[#EDE1E5] p-5 space-y-4">
              <div className="aspect-square rounded-2xl overflow-hidden bg-[#FDF2F5]">
                <SafeImage
                  src="/src/assets/images/doctor_female_obgyn_1794900597156.jpg"
                  alt="Dr. Ananya Sharma, Senior Women's & Pregnancy Doctor"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="text-xs text-[#6E5C6B]">
                  Pregnancy Doctor · 14 yrs exp · 4.9 ★
                </p>
                <h3 className="text-lg font-semibold text-[#231B24] mt-1">
                  Dr. Ananya Sharma
                </h3>
                <p className="text-xs text-[#5E4E5E] mt-1">
                  Safe birth planning, sugar care, and full pregnancy support.
                </p>
              </div>
            </div>

            <div className="rounded-3xl bg-white border border-[#EDE1E5] p-5 space-y-4">
              <div className="aspect-square rounded-2xl overflow-hidden bg-[#F6F2FB]">
                <SafeImage
                  src="/src/assets/images/doctor_male_pediatrician_1794900597643.jpg"
                  alt="Dr. Daniel Brooks, Baby & Pregnancy Scan Doctor"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="text-xs text-[#6E5C6B]">
                  Baby & Scan Doctor · 12 yrs exp · 4.9 ★
                </p>
                <h3 className="text-lg font-semibold text-[#231B24] mt-1">
                  Dr. Daniel Brooks
                </h3>
                <p className="text-xs text-[#5E4E5E] mt-1">
                  Baby growth scans, twin care, and newborn checkups.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Safety & Community Strip */}
      <section className="border-t border-[#EFE4E8] bg-[#FFF7F5] py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-[#EDE1E5] space-y-2">
            <ShieldAlert className="w-5 h-5 text-[#B91C1C]" />
            <h3 className="text-base font-semibold text-[#231B24]">
              Safe Advice You Can Trust
            </h3>
            <p className="text-sm text-[#5E4E5E] leading-relaxed">
              Our AI never guesses diseases or prescribes pills, and it tells you right away to call a hospital if you mention a danger sign.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#EDE1E5] space-y-2">
            <Bell className="w-5 h-5 text-[#6E56A3]" />
            <h3 className="text-base font-semibold text-[#231B24]">
              Easy Pill & Checkup Alerts
            </h3>
            <p className="text-sm text-[#5E4E5E] leading-relaxed">
              Keep your daily iron pills, sugar tests, scans, vaccine dates, and water goals in one simple checklist.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#EDE1E5] space-y-2">
            <MessageSquareHeart className="w-5 h-5 text-[#B84A6A]" />
            <h3 className="text-base font-semibold text-[#231B24]">
              Friendly Moms Group
            </h3>
            <p className="text-sm text-[#5E4E5E] leading-relaxed">
              Swap everyday pregnancy tips, home food recipes, and kind encouragement with other moms at your stage.
            </p>
          </div>
        </div>
      </section>

      {/* Quiet Quick-Links Hub */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="rounded-3xl bg-[#F6F2FB] border border-[#E7DFF2] p-8 sm:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#231B24] [text-wrap:balance]">
              Ready to start your own pregnancy tracker?
            </h2>
            <p className="text-sm sm:text-base text-[#5E4E5E]">
              Sign in with Google, make a free account in 1 minute, or try our ready-made sample account right away.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate(user ? 'profile' : 'auth')}
              className="px-6 py-3 rounded-xl bg-[#B84A6A] text-white text-sm font-semibold hover:bg-[#9F3A58] transition-colors cursor-pointer"
            >
              {user ? 'Open My Dashboard' : 'Start Free Now'}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('about')}
              className="px-5 py-3 rounded-xl bg-white border border-[#DFCED4] text-sm font-medium text-[#231B24] hover:bg-[#FFF4F5] transition-colors cursor-pointer"
            >
              About Us
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
