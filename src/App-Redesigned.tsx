import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { MainLayout } from './components/MainLayout';
import { TestDashboard } from './components/TestDashboard';
import { TransactionsTable } from './components/TransactionsTable';
import { ProductsServicesManager } from './components/ProductsServicesManager';
import { EnhancedSettings } from './components/EnhancedSettings';
import { ComingSoonPage } from './components/ComingSoonPage';
import { ClientFileTracker } from './components/ClientFileTracker';
import { SystemTest } from './components/SystemTest';
import { InvoiceManager } from './components/InvoiceManager';
import { BillManager } from './components/BillManager';
import { FinancialReports } from './components/FinancialReports';
import { AdvancedReports } from './components/AdvancedReports';
import { AIInsightsDashboard } from './components/AIInsightsDashboard';
import { BankingModule } from './components/BankingModule';
import { LegalReports } from './components/LegalReports';
import { ComprehensiveTest } from './components/ComprehensiveTest';
import { OfflineFirstVerification } from './components/OfflineFirstVerification';
import { DeploymentReadiness } from './components/DeploymentReadiness';
import { SupabaseVerification } from './components/SupabaseVerification';
import { AuthPage } from './components/AuthPage';
import { LandingPage } from './components/LandingPage';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { Sitemap } from './components/Sitemap';
import { OnboardingFlow } from './components/OnboardingFlow';
import { useAuth } from './hooks/useAuth';
import { useAnalytics } from './hooks/useAnalytics';
import { initDB, needsOnboarding } from './utils/database';
import { trackAuth, trackNavigation } from './utils/analytics';
import { getBusinessType } from './utils/businessConfig';

function AppContent() {
  const { isAuthenticated, user, login, signup, googleAuth, logout } = useAuth();
  const [isLoading, setIsLoading] = React.useState(true);
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const [businessType, setBusinessType] = React.useState<'general' | 'legal'>('general');
  const navigate = useNavigate();
  const location = useLocation();
  
  // Initialize analytics
  useAnalytics();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initDB();
        
        if (isAuthenticated) {
          // Only check onboarding if user is authenticated
          const needsOnboardingFlow = await needsOnboarding();
          setShowOnboarding(needsOnboardingFlow);
          
          if (!needsOnboardingFlow) {
            const type = await getBusinessType();
            if (type) {
              setBusinessType(type);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [isAuthenticated]);

  // Handle automatic redirects based on authentication state
  useEffect(() => {
    if (isLoading) return; // Don't redirect while loading

    if (isAuthenticated) {
      // User is authenticated
      if (showOnboarding && location.pathname !== '/onboarding') {
        navigate('/onboarding', { replace: true });
      } else if (!showOnboarding && (location.pathname === '/' || location.pathname === '/auth')) {
        navigate('/dashboard', { replace: true });
      }
    } else {
      // User is not authenticated
      const protectedRoutes = [
        '/dashboard', '/transactions', '/products', '/sales', 
        '/purchases', '/reports', '/banking', '/settings', 
        '/test', '/clients', '/onboarding'
      ];
      
      if (protectedRoutes.some(route => location.pathname.startsWith(route))) {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, showOnboarding, location.pathname, navigate, isLoading]);

  const handleGetStarted = () => {
    trackNavigation('get_started_click', '/auth');
    navigate('/auth');
  };

  const handleBackToLanding = () => {
    trackNavigation('back_to_landing', '/');
    navigate('/');
  };

  const handleLogout = async () => {
    try {
      await logout();
      trackAuth('logout');
      setShowOnboarding(false); // Reset onboarding state
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
      // Still navigate to landing page even if logout fails
      navigate('/', { replace: true });
    }
  };

  const handleLogin = async (email: string, password: string) => {
    const result = await login(email, password);
    if (result.success) {
      trackAuth('login', 'email');
      // Check onboarding and business type after successful login
      try {
        const needsOnboardingFlow = await needsOnboarding();
        setShowOnboarding(needsOnboardingFlow);
        
        if (!needsOnboardingFlow) {
          const type = await getBusinessType();
          if (type) {
            setBusinessType(type);
          }
        }
      } catch (error) {
        console.error('Error checking post-login setup:', error);
      }
    }
    return result;
  };

  const handleSignup = async (email: string, password: string, name: string) => {
    const result = await signup(email, password, name);
    if (result.success) {
      trackAuth('signup', 'email');
      setShowOnboarding(true); // New users need onboarding
    }
    return result;
  };

  const handleGoogleAuth = async () => {
    const result = await googleAuth();
    if (result.success) {
      trackAuth('login', 'google');
      // Check onboarding and business type after successful Google auth
      try {
        const needsOnboardingFlow = await needsOnboarding();
        setShowOnboarding(needsOnboardingFlow);
        
        if (!needsOnboardingFlow) {
          const type = await getBusinessType();
          if (type) {
            setBusinessType(type);
          }
        }
      } catch (error) {
        console.error('Error checking post-auth setup:', error);
      }
    }
    return result;
  };

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    // Reload business type after onboarding
    try {
      const type = await getBusinessType();
      if (type) {
        setBusinessType(type);
      }
    } catch (error) {
      console.error('Error loading business type after onboarding:', error);
    }
    navigate('/dashboard', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/" 
        element={<LandingPage onGetStarted={handleGetStarted} />} 
      />
      <Route 
        path="/auth" 
        element={
          isAuthenticated ? 
            <Navigate to="/dashboard" replace /> : 
            <AuthPage
              isOpen={true}
              onLogin={handleLogin}
              onSignup={handleSignup}
              onGoogleAuth={handleGoogleAuth}
              onBack={handleBackToLanding}
            />
        } 
      />
      <Route 
        path="/privacy" 
        element={<PrivacyPolicy />} 
      />
      <Route 
        path="/sitemap" 
        element={<Sitemap />} 
      />

      {/* Onboarding Route - Special case */}
      <Route 
        path="/onboarding" 
        element={
          isAuthenticated ? 
            <OnboardingFlow onComplete={handleOnboardingComplete} /> :
            <Navigate to="/" replace />
        } 
      />

      {/* Protected Routes with MainLayout */}
      <Route 
        element={
          isAuthenticated && !showOnboarding ? (
            <MainLayout user={user!} onLogout={handleLogout} />
          ) : (
            <Navigate to={isAuthenticated ? "/onboarding" : "/"} replace />
          )
        }
      >
        <Route path="dashboard" element={<TestDashboard />} />
        <Route 
          path="transactions" 
          element={
            <TransactionsTable 
              onAddTransaction={() => navigate('/dashboard')} 
            />
          } 
        />
        <Route path="products" element={<ProductsServicesManager />} />
        <Route path="clients" element={<ClientFileTracker />} />
        <Route path="sales" element={<InvoiceManager />} />
        <Route path="purchases" element={<BillManager />} />
        <Route path="reports" element={<FinancialReports />}>
          <Route path="advanced" element={<AdvancedReports />} />
          <Route path="ai-insights" element={<AIInsightsDashboard />} />
          <Route path="legal" element={<LegalReports />} />
        </Route>
        <Route path="banking" element={<BankingModule />} />
        <Route 
          path="settings" 
          element={
            <EnhancedSettings 
              onBack={() => navigate('/dashboard')}
            />
          } 
        />
        <Route path="test">
          <Route index element={<SystemTest />} />
          <Route path="offline" element={<OfflineFirstVerification />} />
          <Route path="deployment" element={<DeploymentReadiness />} />
          <Route path="supabase" element={<SupabaseVerification />} />
        </Route>
        
        {/* Catch all for authenticated users - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* Catch all for unauthenticated users - redirect to landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function RedesignedApp() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default RedesignedApp;