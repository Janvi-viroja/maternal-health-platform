import React from 'react';
import { ArrowRight, HeartHandshake, ShieldCheck, Stethoscope } from 'lucide-react';
import { SafeImage } from '../components/SafeImage';
import type { PageId } from '../types';

interface AboutPageProps {
  onNavigate: (page: PageId) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-14">
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-6 space-y-5">
          <p className="text-xs font-semibold text-[#8E2F4C]">About MomCare AI</p>
          <h1 className="text-4xl font-semibold text-[#231B24] [text-wrap:balance]">
            Warm, simple support for every mother and family
          </h1>
          <p className="text-base text-[#5E4E5E] leading-relaxed">
            Pregnancy and caring for a newborn bring up dozens of everyday questions between doctor visits. MomCare AI helps you track your week, eat healthy home food, book doctor visits, and get clear answers anytime.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('services')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#B84A6A] text-white text-sm font-semibold hover:bg-[#9F3A58] transition-colors cursor-pointer"
            >
              See All Tools
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('doctors')}
              className="px-5 py-2.5 rounded-xl border border-[#DFCED4] bg-white text-sm font-medium text-[#231B24] hover:bg-[#FFF4F5] transition-colors cursor-pointer"
            >
              See Our Doctors
            </button>
          </div>
        </div>
        <div className="lg:col-span-6">
          <div className="aspect-[4/3] rounded-3xl overflow-hidden border border-[#EDE1E5]">
            <SafeImage
              src="/src/assets/images/postpartum_mother_baby_1794900598814.jpg"
              alt="Mother gently cradling her newborn by natural daylight"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[#FFF7F5] border border-[#EDE1E5] space-y-3">
          <ShieldCheck className="w-6 h-6 text-[#8E2F4C]" />
          <h2 className="text-lg font-semibold text-[#231B24]">Safety Always Comes First</h2>
          <p className="text-sm text-[#5E4E5E] leading-relaxed">
            Our AI helper never guesses diseases or prescribes pills. If you mention a danger sign, it tells you right away to call your doctor or go to a hospital.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#F6F2FB] border border-[#E7DFF2] space-y-3">
          <Stethoscope className="w-6 h-6 text-[#5B4490]" />
          <h2 className="text-lg font-semibold text-[#231B24]">Real Doctors Support You</h2>
          <p className="text-sm text-[#5E4E5E] leading-relaxed">
            This app helps you stay organized—it never replaces a real doctor. You can easily book a video call or clinic visit whenever you need one.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#FFF5EE] border border-[#F2E2D7] space-y-3">
          <HeartHandshake className="w-6 h-6 text-[#A25B34]" />
          <h2 className="text-lg font-semibold text-[#231B24]">Care After Baby Arrives</h2>
          <p className="text-sm text-[#5E4E5E] leading-relaxed">
            Support does not stop after birth. We include easy tips for healing, feeding your baby, newborn safety, and taking care of your mood.
          </p>
        </div>
      </section>
    </div>
  );
};
