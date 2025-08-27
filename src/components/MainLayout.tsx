import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { DashboardHeader } from './DashboardHeader';
import { BusinessTypeSelector } from './BusinessTypeSelector';
import { OnboardingWizard } from './OnboardingWizard';
import { useSettings } from '../hooks/useSettings';
import { needsOnboarding, completeOnboarding } from '../utils/businessConfig';
import type { User } from '../hooks/useAuth';
import type { BusinessConfig } from '../utils/database';

interface MainLayoutProps {
  user: User;
  onLogout: () => void;
}

export function MainLayout({ user, onLogout }: MainLayoutProps) {
  const { getThemeClasses } = useSettings();
  const themeClasses = getThemeClasses();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showBusinessTypeSelector, setShowBusinessTypeSelector] = useState(false);
  const [selectedBusinessType, setSelectedBusinessType] = useState<'general' | 'legal' | null>(null);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const needsSetup = await needsOnboarding();
      if (needsSetup) {
        setShowBusinessTypeSelector(true);
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
    } finally {
      setIsCheckingOnboarding(false);
    }
  };

  const handleBusinessTypeSelect = (type: 'general' | 'legal') => {
    setSelectedBusinessType(type);
    setShowBusinessTypeSelector(false);
    setShowOnboarding(true);
  };

  const handleOnboardingComplete = async (config: BusinessConfig) => {
    setShowOnboarding(false);
    setSelectedBusinessType(null);
    
    // Navigate to dashboard after onboarding
    if (location.pathname !== '/dashboard') {
      navigate('/dashboard', { replace: true });
    }
  };

  const handleOnboardingBack = () => {
    setShowOnboarding(false);
    setShowBusinessTypeSelector(true);
  };

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleNavigate = (route: string) => {
    navigate(route);
    setIsSidebarOpen(false); // Close mobile sidebar after navigation
  };

  // Show loading state while checking onboarding
  if (isCheckingOnboarding) {
    return (
      <div className={`min-h-screen ${themeClasses.background} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className={`text-xl font-semibold ${themeClasses.text} mb-2`}>
            Loading your workspace...
          </h2>
          <p className={themeClasses.textSecondary}>
            Setting up your personalized experience
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClasses.background}`}>
      {/* Onboarding Modals */}
      <BusinessTypeSelector
        isOpen={showBusinessTypeSelector}
        onBusinessTypeSelect={handleBusinessTypeSelect}
        onCancel={() => {
          // For now, we'll require onboarding
          // In the future, this could allow skipping
        }}
      />

      <OnboardingWizard
        isOpen={showOnboarding}
        businessType={selectedBusinessType!}
        onComplete={handleOnboardingComplete}
        onBack={handleOnboardingBack}
      />

      {/* Main Layout */}
      {!showBusinessTypeSelector && !showOnboarding && (
        <div className="flex h-screen">
          {/* Sidebar */}
          <Sidebar
            isOpen={isSidebarOpen}
            onToggle={handleSidebarToggle}
            onNavigate={handleNavigate}
          />

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <DashboardHeader
              user={user}
              onLogout={onLogout}
              onMenuToggle={handleSidebarToggle}
              isMobileMenuOpen={isSidebarOpen}
            />

            {/* Page Content */}
            <main className="flex-1 overflow-y-auto">
              <Outlet />
            </main>
          </div>
        </div>
      )}
    </div>
  );
}