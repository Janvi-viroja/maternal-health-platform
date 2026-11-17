import React, { useEffect, useState } from 'react';
import {
  Activity,
  Baby,
  Bell,
  Bot,
  CalendarCheck,
  HeartHandshake,
  Home,
  Info,
  LayoutGrid,
  LogIn,
  LogOut,
  Menu,
  MessageSquareHeart,
  ShieldCheck,
  Stethoscope,
  UserCircle,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { Appointment, PageId, Reminder } from '../types';

interface AppShellProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  children: React.ReactNode;
}

interface NavItem {
  id: PageId;
  label: string;
  section: 'Start Here' | 'Pregnancy & Baby' | 'Doctors & Reminders' | 'Moms & After Birth';
  icon: React.FC<{ className?: string }>;
}

const ALL_NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', section: 'Start Here', icon: Home },
  { id: 'profile', label: 'My Dashboard', section: 'Start Here', icon: UserCircle },
  { id: 'services', label: 'All Help & Tools', section: 'Start Here', icon: LayoutGrid },
  { id: 'about', label: 'About Us', section: 'Start Here', icon: Info },
  { id: 'pregnancy-tracker', label: 'Week Tracker', section: 'Pregnancy & Baby', icon: Activity },
  { id: 'baby-development', label: 'Baby Growth', section: 'Pregnancy & Baby', icon: Baby },
  { id: 'ai-assistant', label: 'Ask AI Helper', section: 'Pregnancy & Baby', icon: Bot },
  { id: 'nutrition', label: 'Food & Water Plan', section: 'Pregnancy & Baby', icon: UtensilsCrossed },
  { id: 'doctors', label: 'Find a Doctor', section: 'Doctors & Reminders', icon: Stethoscope },
  { id: 'appointments', label: 'Book a Visit', section: 'Doctors & Reminders', icon: CalendarCheck },
  { id: 'reminders', label: 'Pills & Checkups', section: 'Doctors & Reminders', icon: Bell },
  { id: 'community', label: 'Moms Group', section: 'Moms & After Birth', icon: MessageSquareHeart },
  { id: 'postpartum', label: 'After Birth Care', section: 'Moms & After Birth', icon: HeartHandshake },
  { id: 'admin', label: 'Admin Panel', section: 'Moms & After Birth', icon: ShieldCheck },
];

const PUBLIC_PAGES: PageId[] = ['home', 'about', 'services', 'auth'];

const PAGE_TITLES: Record<PageId, string> = {
  home: 'Home',
  about: 'About Us',
  services: 'All Help & Tools',
  'pregnancy-tracker': 'Pregnancy Week Tracker',
  'baby-development': 'How Your Baby Grows',
  'ai-assistant': 'Ask AI Helper',
  nutrition: 'Food & Water Plan',
  doctors: 'Find a Doctor',
  appointments: 'Book a Doctor Visit',
  reminders: 'Medicine & Checkup Reminders',
  community: 'Moms Support Group',
  postpartum: 'After Birth & Baby Care',
  auth: 'Sign In or Join Free',
  profile: 'My Dashboard & Profile',
  admin: 'Admin Panel',
};

export const AppShell: React.FC<AppShellProps> = ({ activePage, onNavigate, children }) => {
  const { user, logout, apiFetch } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [pendingAlerts, setPendingAlerts] = useState<
    Array<{ id: string; title: string; subtitle: string; page: PageId }>
  >([]);

  useEffect(() => {
    if (!user) {
      setPendingAlerts([]);
      setNotificationsOpen(false);
      return;
    }
    let active = true;
    Promise.all([
      apiFetch<{ reminders: Reminder[] }>('/api/reminders'),
      apiFetch<{ appointments: Appointment[] }>('/api/appointments'),
    ])
      .then(([remRes, apptRes]) => {
        if (!active) return;
        const items: Array<{ id: string; title: string; subtitle: string; page: PageId }> = [];
        for (const r of (remRes.reminders || []).filter((x) => !x.completed).slice(0, 4)) {
          items.push({
            id: `rem-${r.id}`,
            title: r.title,
            subtitle: `${r.dueDate} · ${r.dueTime}`,
            page: 'reminders',
          });
        }
        for (const a of (apptRes.appointments || [])
          .filter((x) => x.status === 'Confirmed')
          .slice(0, 3)) {
          items.push({
            id: `appt-${a.id}`,
            title: `Visit with ${a.doctorName || 'Doctor'}`,
            subtitle: `${a.appointmentDate} · ${a.timeSlot}`,
            page: 'appointments',
          });
        }
        setPendingAlerts(items);
      })
      .catch(() => {
        // Ignore transient notification fetch error
      });
    return () => {
      active = false;
    };
  }, [user, apiFetch, activePage]);

  const isPublicLayout = PUBLIC_PAGES.includes(activePage);
  const sections: NavItem['section'][] = [
    'Start Here',
    'Pregnancy & Baby',
    'Doctors & Reminders',
    'Moms & After Birth',
  ];

  const handleNav = (page: PageId) => {
    onNavigate(page);
    setMobileMenuOpen(false);
    setNotificationsOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDFB] text-[#231B24]">
      {isPublicLayout ? (
        <header className="sticky top-0 z-40 bg-[#FFFDFB]/95 backdrop-blur-md border-b border-[#EFE4E8]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
            <button
              type="button"
              onClick={() => handleNav('home')}
              className="text-xl font-bold tracking-tight text-[#231B24] font-editorial whitespace-nowrap shrink-0 cursor-pointer"
            >
              MomCare AI
            </button>

            <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#5E4E5E]">
              <button
                type="button"
                onClick={() => handleNav('pregnancy-tracker')}
                className="hover:text-[#9F3A58] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Week Tracker
              </button>
              <button
                type="button"
                onClick={() => handleNav('ai-assistant')}
                className="hover:text-[#9F3A58] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Ask AI
              </button>
              <button
                type="button"
                onClick={() => handleNav('doctors')}
                className="hover:text-[#9F3A58] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Doctors
              </button>
              <button
                type="button"
                onClick={() => handleNav('services')}
                className="hover:text-[#9F3A58] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                All Tools
              </button>
              <button
                type="button"
                onClick={() => handleNav('community')}
                className="hover:text-[#9F3A58] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Moms Group
              </button>
            </nav>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => handleNav(user ? 'profile' : 'auth')}
                className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#B84A6A] text-white text-sm font-medium hover:bg-[#9F3A58] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {user ? 'My Dashboard' : 'Sign In'}
              </button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="md:hidden p-2 rounded-lg border border-[#EDE1E5] text-[#231B24] hover:bg-[#FFF4F5] min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden border-t border-[#EDE1E5] bg-[#FFFDFB] px-4 py-4 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {ALL_NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNav(item.id)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium text-left transition-colors min-h-[44px] ${
                        active
                          ? 'bg-[#FCE7EE] text-[#8E2F4C]'
                          : 'text-[#4A3B4B] hover:bg-[#FFF5EE]'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="pt-2 border-t border-[#EDE1E5] flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleNav(user ? 'profile' : 'auth')}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#B84A6A] text-white text-sm font-medium"
                >
                  {user ? `Signed in as ${user.fullName}` : 'Sign In / Register'}
                </button>
                {user && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      void logout();
                    }}
                    className="w-full py-2.5 px-4 rounded-lg border border-[#EDE1E5] text-xs font-medium text-[#5E4E5E] flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                )}
              </div>
            </div>
          )}
        </header>
      ) : (
        <div className="flex flex-1 min-h-screen">
          {/* Desktop Sidebar (260px) */}
          <aside className="hidden lg:flex lg:w-[264px] lg:flex-col lg:fixed lg:inset-y-0 bg-[#FDF8F6] border-r border-[#EDE1E5] z-30">
            <div className="h-16 px-6 flex items-center justify-between border-b border-[#EDE1E5]">
              <button
                type="button"
                onClick={() => handleNav('home')}
                className="text-xl font-bold tracking-tight text-[#231B24] font-editorial whitespace-nowrap cursor-pointer"
              >
                MomCare AI
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
              {sections.map((section) => {
                const items = ALL_NAV_ITEMS.filter((i) => i.section === section);
                return (
                  <div key={section}>
                    <p className="px-3 mb-2 text-xs font-semibold text-[#7A6879]">
                      {section}
                    </p>
                    <div className="space-y-1">
                      {items.map((item) => {
                        const Icon = item.icon;
                        const active = activePage === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleNav(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left cursor-pointer ${
                              active
                                ? 'bg-[#FCE7EE] text-[#8E2F4C]'
                                : 'text-[#4A3B4B] hover:bg-[#FFF5EE] hover:text-[#231B24]'
                            }`}
                          >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-[#EDE1E5] bg-[#FFFDFB]">
              {user ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => handleNav('profile')}
                    className="w-full text-left flex items-center gap-3 hover:opacity-85 transition-opacity cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#F5F1FB] text-[#5B4490] flex items-center justify-center font-semibold text-sm shrink-0">
                      {user.fullName
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#231B24] truncate">
                        {user.fullName}
                      </p>
                      <p className="text-xs text-[#6E5C6B] truncate">
                        {user.pregnancyWeek ? `Week ${user.pregnancyWeek}` : user.role}
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => void logout()}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-[#EDE1E5] text-xs font-medium text-[#5E4E5E] hover:bg-[#FFF4F5] transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleNav('auth')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#B84A6A] text-white text-sm font-medium hover:bg-[#9F3A58] transition-colors cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In / Register
                </button>
              )}
            </div>
          </aside>

          {/* Mobile Drawer for Workspace Pages */}
          {mobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex">
              <div
                className="fixed inset-0 bg-black/30"
                onClick={() => setMobileMenuOpen(false)}
              />
              <div className="relative w-72 max-w-[85vw] bg-[#FDF8F6] h-full flex flex-col z-10 border-r border-[#EDE1E5]">
                <div className="flex items-center justify-between p-4 pb-3 border-b border-[#EDE1E5]">
                  <span className="text-lg font-bold font-editorial text-[#231B24]">
                    MomCare AI
                  </span>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-lg text-[#5E4E5E] min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                  {sections.map((section) => (
                    <div key={section}>
                      <p className="px-2 mb-1.5 text-xs font-semibold text-[#7A6879]">
                        {section}
                      </p>
                      <div className="space-y-1">
                        {ALL_NAV_ITEMS.filter((i) => i.section === section).map((item) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleNav(item.id)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left min-h-[44px] ${
                                activePage === item.id
                                  ? 'bg-[#FCE7EE] text-[#8E2F4C]'
                                  : 'text-[#4A3B4B] hover:bg-[#FFF5EE]'
                              }`}
                            >
                              <Icon className="w-4 h-4 shrink-0" />
                              <span className="truncate">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-[#EDE1E5] bg-[#FFFDFB]">
                  {user ? (
                    <div className="space-y-2.5">
                      <button
                        type="button"
                        onClick={() => handleNav('profile')}
                        className="w-full text-left flex items-center gap-3"
                      >
                        <div className="w-9 h-9 rounded-full bg-[#F5F1FB] text-[#5B4490] flex items-center justify-center font-semibold text-sm shrink-0">
                          {user.fullName
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#231B24] truncate">
                            {user.fullName}
                          </p>
                          <p className="text-xs text-[#6E5C6B] truncate">
                            {user.pregnancyWeek ? `Week ${user.pregnancyWeek}` : user.role}
                          </p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          void logout();
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border border-[#EDE1E5] text-xs font-medium text-[#5E4E5E] hover:bg-[#FFF4F5]"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleNav('auth')}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#B84A6A] text-white text-sm font-medium"
                    >
                      <LogIn className="w-4 h-4" />
                      Sign In / Register
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Workspace Main Column */}
          <div className="flex-1 lg:pl-[264px] flex flex-col min-w-0">
            <header className="sticky top-0 z-20 h-16 bg-[#FFFDFB]/95 backdrop-blur-md border-b border-[#EDE1E5] px-4 sm:px-8 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden p-2 rounded-lg border border-[#EDE1E5] text-[#231B24] min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Open workspace navigation"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2 text-sm text-[#6E5C6B] truncate">
                  <button
                    type="button"
                    onClick={() => handleNav('home')}
                    className="hover:text-[#9F3A58] transition-colors cursor-pointer"
                  >
                    MomCare AI
                  </button>
                  <span aria-hidden="true">/</span>
                  <span className="font-semibold text-[#231B24] truncate">
                    {PAGE_TITLES[activePage]}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 relative">
                {user && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setNotificationsOpen((v) => !v)}
                      className="relative p-2 rounded-lg border border-[#EDE1E5] bg-white text-[#5E4E5E] hover:bg-[#FFF4F5] min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
                      aria-label="Care reminders and notifications"
                    >
                      <Bell className="w-4 h-4" />
                      {pendingAlerts.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#B84A6A] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                          {pendingAlerts.length}
                        </span>
                      )}
                    </button>

                    {notificationsOpen && (
                      <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white border border-[#EDE1E5] shadow-lg p-4 space-y-3 z-50">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-[#231B24]">
                            Upcoming Alerts ({pendingAlerts.length})
                          </p>
                          <button
                            type="button"
                            onClick={() => setNotificationsOpen(false)}
                            className="text-xs text-[#6E5C6B] hover:text-[#231B24] cursor-pointer"
                          >
                            Close
                          </button>
                        </div>
                        {pendingAlerts.length === 0 ? (
                          <p className="text-xs text-[#6E5C6B]">
                            You are all caught up on pills and upcoming doctor visits.
                          </p>
                        ) : (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {pendingAlerts.map((alert) => (
                              <button
                                key={alert.id}
                                type="button"
                                onClick={() => handleNav(alert.page)}
                                className="w-full text-left p-2.5 rounded-xl bg-[#FDF8F6] border border-[#EDE1E5] hover:border-[#D9A7B7] cursor-pointer"
                              >
                                <p className="text-xs font-semibold text-[#231B24] truncate">
                                  {alert.title}
                                </p>
                                <p className="text-[11px] text-[#6E5C6B] mt-0.5 tabular-nums">
                                  {alert.subtitle}
                                </p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {user ? (
                  <button
                    type="button"
                    onClick={() => handleNav('profile')}
                    className="px-4 py-2 rounded-lg bg-[#F5F1FB] text-[#5B4490] text-xs font-semibold hover:bg-[#ECE5F8] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {user.pregnancyWeek ? `Week ${user.pregnancyWeek} Profile` : 'My Profile'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleNav('auth')}
                    className="px-4 py-2 rounded-lg bg-[#B84A6A] text-white text-xs font-semibold hover:bg-[#9F3A58] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </header>

            <main className="flex-1 px-4 sm:px-8 py-8 max-w-6xl w-full mx-auto">
              {children}
            </main>
          </div>
        </div>
      )}

      {isPublicLayout && <main className="flex-1">{children}</main>}

      <footer
        className={`border-t border-[#EDE1E5] bg-[#FDF8F6] text-[#5E4E5E] ${
          !isPublicLayout ? 'lg:pl-[264px]' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1 space-y-3">
              <p className="text-lg font-bold font-editorial text-[#231B24]">
                MomCare AI
              </p>
              <p className="text-xs leading-relaxed text-[#6E5C6B]">
                Easy pregnancy tracking, simple daily meal plans, doctor visits, and friendly AI help from week one through baby’s early weeks.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#231B24]">Pregnancy & Baby</p>
              <div className="flex flex-col items-start gap-1.5 text-xs">
                <button type="button" onClick={() => handleNav('pregnancy-tracker')} className="hover:text-[#9F3A58] cursor-pointer">Week Tracker</button>
                <button type="button" onClick={() => handleNav('baby-development')} className="hover:text-[#9F3A58] cursor-pointer">Baby Growth</button>
                <button type="button" onClick={() => handleNav('ai-assistant')} className="hover:text-[#9F3A58] cursor-pointer">Ask AI Helper</button>
                <button type="button" onClick={() => handleNav('nutrition')} className="hover:text-[#9F3A58] cursor-pointer">Food & Water Plan</button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#231B24]">Doctors & Community</p>
              <div className="flex flex-col items-start gap-1.5 text-xs">
                <button type="button" onClick={() => handleNav('doctors')} className="hover:text-[#9F3A58] cursor-pointer">Find a Doctor</button>
                <button type="button" onClick={() => handleNav('appointments')} className="hover:text-[#9F3A58] cursor-pointer">Book a Visit</button>
                <button type="button" onClick={() => handleNav('reminders')} className="hover:text-[#9F3A58] cursor-pointer">Pill & Checkup Alerts</button>
                <button type="button" onClick={() => handleNav('community')} className="hover:text-[#9F3A58] cursor-pointer">Moms Support Group</button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#231B24]">More Help</p>
              <div className="flex flex-col items-start gap-1.5 text-xs">
                <button type="button" onClick={() => handleNav('postpartum')} className="hover:text-[#9F3A58] cursor-pointer">After Birth Care</button>
                <button type="button" onClick={() => handleNav('about')} className="hover:text-[#9F3A58] cursor-pointer">About Us</button>
                <button type="button" onClick={() => handleNav('services')} className="hover:text-[#9F3A58] cursor-pointer">All Help & Tools</button>
                <button type="button" onClick={() => handleNav('admin')} className="hover:text-[#9F3A58] cursor-pointer">Admin Panel</button>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-[#EDE1E5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#7A6879]">
            <p>
              Note: MomCare AI shares helpful everyday tips only — it does not replace a real doctor, diagnosis, or hospital care.
            </p>
            <p className="whitespace-nowrap">© 2026 MomCare AI</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
