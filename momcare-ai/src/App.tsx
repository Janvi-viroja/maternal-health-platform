/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { AppShell } from './components/AppShell';
import { AuthProvider } from './context/AuthContext';
import { AboutPage } from './pages/AboutPage';
import { AdminPage } from './pages/AdminPage';
import { AiAssistantPage } from './pages/AiAssistantPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { AuthPage } from './pages/AuthPage';
import { BabyDevelopmentPage } from './pages/BabyDevelopmentPage';
import { CommunityPage } from './pages/CommunityPage';
import { DoctorsPage } from './pages/DoctorsPage';
import { HomePage } from './pages/HomePage';
import { NutritionPage } from './pages/NutritionPage';
import { PostpartumPage } from './pages/PostpartumPage';
import { PregnancyTrackerPage } from './pages/PregnancyTrackerPage';
import { ProfilePage } from './pages/ProfilePage';
import { RemindersPage } from './pages/RemindersPage';
import { ServicesPage } from './pages/ServicesPage';
import type { PageId } from './types';

const VALID_PAGES = new Set<PageId>([
  'home',
  'about',
  'services',
  'pregnancy-tracker',
  'baby-development',
  'ai-assistant',
  'nutrition',
  'doctors',
  'appointments',
  'reminders',
  'community',
  'postpartum',
  'auth',
  'profile',
  'admin',
]);

function getPageFromLocation(): PageId {
  if (typeof window === 'undefined') return 'home';
  const slug = window.location.pathname.replace(/^\/+|\/+$/g, '') as PageId;
  return VALID_PAGES.has(slug) ? slug : 'home';
}

function MomCareRouter() {
  const [activePage, setActivePage] = useState<PageId>(getPageFromLocation);
  const [preselectedDoctorId, setPreselectedDoctorId] = useState<number | null>(null);
  const [preselectedSlot, setPreselectedSlot] = useState<string | null>(null);

  React.useEffect(() => {
    const handlePopState = () => {
      setActivePage(getPageFromLocation());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = React.useCallback((page: PageId) => {
    setActivePage(page);
    if (typeof window !== 'undefined') {
      const targetPath = page === 'home' ? '/' : `/${page}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ page }, '', targetPath);
      }
    }
  }, []);

  const handleSelectDoctorForBooking = (doctorId: number, slot?: string) => {
    setPreselectedDoctorId(doctorId);
    setPreselectedSlot(slot || null);
  };

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <HomePage onNavigate={navigate} />;
      case 'about':
        return <AboutPage onNavigate={navigate} />;
      case 'services':
        return <ServicesPage onNavigate={navigate} />;
      case 'pregnancy-tracker':
        return <PregnancyTrackerPage />;
      case 'baby-development':
        return <BabyDevelopmentPage />;
      case 'ai-assistant':
        return <AiAssistantPage />;
      case 'nutrition':
        return <NutritionPage />;
      case 'doctors':
        return (
          <DoctorsPage
            onNavigate={navigate}
            onSelectDoctorForBooking={handleSelectDoctorForBooking}
          />
        );
      case 'appointments':
        return (
          <AppointmentsPage
            preselectedDoctorId={preselectedDoctorId}
            preselectedSlot={preselectedSlot}
            onNavigate={navigate}
          />
        );
      case 'reminders':
        return <RemindersPage onNavigate={navigate} />;
      case 'community':
        return <CommunityPage onNavigate={navigate} />;
      case 'postpartum':
        return <PostpartumPage onNavigate={navigate} />;
      case 'auth':
        return <AuthPage onNavigate={navigate} />;
      case 'profile':
        return <ProfilePage onNavigate={navigate} />;
      case 'admin':
        return <AdminPage onNavigate={navigate} />;
      default:
        return <HomePage onNavigate={navigate} />;
    }
  };

  return (
    <AppShell activePage={activePage} onNavigate={navigate}>
      {renderPage()}
    </AppShell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MomCareRouter />
    </AuthProvider>
  );
}
