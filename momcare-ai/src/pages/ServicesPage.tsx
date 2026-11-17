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
  ShieldCheck,
  Stethoscope,
  UserCircle,
  UtensilsCrossed,
} from 'lucide-react';
import type { PageId } from '../types';

interface ServicesPageProps {
  onNavigate: (page: PageId) => void;
}

const SERVICE_MODULES: Array<{
  id: PageId;
  title: string;
  category: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  tone: string;
}> = [
  {
    id: 'pregnancy-tracker',
    title: 'Pregnancy Week Tracker',
    category: '01 · Week Counter',
    description:
      'Find out what week you are in, see your due date, and read simple tips for mom and baby every week.',
    icon: Activity,
    tone: 'bg-[#FFF7F5] border-[#EFE1E5]',
  },
  {
    id: 'baby-development',
    title: 'How Your Baby Grows',
    category: '02 · Baby Size',
    description:
      'See your baby’s size compared to fruits, along with height, weight, and growth milestones from Week 4 to 40.',
    icon: Baby,
    tone: 'bg-[#F6F2FB] border-[#E7DFF2]',
  },
  {
    id: 'ai-assistant',
    title: 'Ask AI Helper',
    category: '03 · 24/7 Answers',
    description:
      'Ask simple questions about symptoms, food, baby growth, or doctor visits—with instant alerts for warning signs.',
    icon: Bot,
    tone: 'bg-[#FFF5EE] border-[#F2E2D7]',
  },
  {
    id: 'nutrition',
    title: 'Food & Water Plan',
    category: '04 · Daily Meals',
    description:
      'Simple veg and non-veg Indian meal ideas for every stage of pregnancy, plus a water counter and foods to skip.',
    icon: UtensilsCrossed,
    tone: 'bg-white border-[#EDE1E5]',
  },
  {
    id: 'doctors',
    title: 'Find a Doctor',
    category: '05 · Doctors',
    description:
      'See trusted pregnancy, baby, food, and feeding doctors with their experience, hospital, fees, and open times.',
    icon: Stethoscope,
    tone: 'bg-white border-[#EDE1E5]',
  },
  {
    id: 'appointments',
    title: 'Book a Doctor Visit',
    category: '06 · Visits',
    description:
      'Pick a date and time for a video call or hospital visit, and see all your upcoming and past bookings.',
    icon: CalendarCheck,
    tone: 'bg-[#FFF7F5] border-[#EFE1E5]',
  },
  {
    id: 'reminders',
    title: 'Pill & Checkup Reminders',
    category: '07 · Alerts',
    description:
      'Keep track of daily iron pills, folic acid, blood tests, vaccines, and drinking water.',
    icon: Bell,
    tone: 'bg-[#F6F2FB] border-[#E7DFF2]',
  },
  {
    id: 'community',
    title: 'Moms Support Group',
    category: '08 · Community',
    description:
      'Share your story, ask questions, post food or comfort tips, and chat kindly with other moms.',
    icon: MessageSquareHeart,
    tone: 'bg-[#FFF5EE] border-[#F2E2D7]',
  },
  {
    id: 'postpartum',
    title: 'After Birth & Baby Care',
    category: '09 · After Delivery',
    description:
      'Easy tips for healing after delivery, breastfeeding, newborn sleep safety, mood care, and daily check-ins.',
    icon: HeartHandshake,
    tone: 'bg-white border-[#EDE1E5]',
  },
  {
    id: 'profile',
    title: 'My Dashboard & Profile',
    category: '10 · Your Info',
    description:
      'See your week, upcoming visits, reminders, and water count in one place, and update your personal details.',
    icon: UserCircle,
    tone: 'bg-[#FFF7F5] border-[#EFE1E5]',
  },
  {
    id: 'admin',
    title: 'Admin Panel',
    category: '11 · Management',
    description:
      'For staff to manage user accounts, add doctors, update visit statuses, and keep the community safe.',
    icon: ShieldCheck,
    tone: 'bg-[#F6F2FB] border-[#E7DFF2]',
  },
];

export const ServicesPage: React.FC<ServicesPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="max-w-2xl space-y-3">
        <p className="text-xs font-semibold text-[#8E2F4C]">All Help & Tools</p>
        <h1 className="text-4xl font-semibold text-[#231B24] [text-wrap:balance]">
          Simple tools made for mothers and families
        </h1>
        <p className="text-base text-[#5E4E5E]">
          Tap any card below to open what you need.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SERVICE_MODULES.map((svc) => {
          const Icon = svc.icon;
          return (
            <div
              key={svc.id}
              className={`rounded-3xl border p-6 flex flex-col justify-between gap-5 ${svc.tone}`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#6E5C6B]">
                    {svc.category}
                  </span>
                  <Icon className="w-5 h-5 text-[#8E2F4C]" />
                </div>
                <h2 className="text-xl font-semibold text-[#231B24]">{svc.title}</h2>
                <p className="text-sm text-[#5E4E5E] leading-relaxed">
                  {svc.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate(svc.id)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#8E2F4C] hover:text-[#6B2138] cursor-pointer"
              >
                Open {svc.title}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
