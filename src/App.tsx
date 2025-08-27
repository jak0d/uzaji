import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import { TransactionForm } from './components/TransactionForm';
import { ProductsServices } from './components/ProductsServices';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { AuthPage } from './components/AuthPage';
import { LandingPage } from './components/LandingPage';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { Sitemap } from './components/Sitemap';
import { useAuth } from './hooks/useAuth';
import { useAnalytics } from './hooks/useAnalytics';
import { initDB } from './utils/database';
import { trackAuth, trackNavigation } from './utils/analytics';

function AppContent() {
  const { isAuthenticated, user, login, signup, googleAuth, logout } = useAuth();
  const [isLoading, setIsLoading] = React.useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Initialize analytics
  useAnalytics();

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    // Handle navigation based on authentication state
    if (isAuthenticated) {
      // If user is authenticated and on landing/auth page, redirect to dashboard
      if (location.pathname === '/' || location.pathname === '/auth') {
        navigate('/dashboard', { replace: true });
      }
    } else {
      // If user is not authenticated and trying to access protected routes
      const protectedRoutes = ['/dashboard', '/transactions', '/products', '/reports', '/settings'];
      if (protectedRoutes.includes(location.pathname)) {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, location.pathname, navigate]);

  const initializeApp = async () => {
    try {
      await initDB();
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setIsLoading(false);
    }
  };

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
      // Force navigation to landing page after logout
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
    }
    return result;
  };

  const handleSignup = async (email: string, password: string, name: string) => {
    const result = await signup(email, password, name);
    if (result.success) {
      trackAuth('signup', 'email');
    }
    return result;
  };

  const handleGoogleAuth = async () => {
    const result = await googleAuth();
    if (result.success) {
      trackAuth('login', 'google');
    }
    return result;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Initializing Secure Bookkeeping</h2>
          <p className="text-gray-600">Setting up your encrypted workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/" 
        element={
          isAuthenticated ? 
            <Navigate to="/dashboard" replace /> : 
            <LandingPage onGetStarted={handleGetStarted} />
        } 
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

      {/* Protected Routes */}
      <Route 
        path="/dashboard" 
        element={
          isAuthenticated ? 
            <Dashboard 
              onNavigate={(view) => {
                trackNavigation('dashboard_navigation', view);
                navigate(`/${view}`);
              }} 
              user={user} 
              onLogout={handleLogout} 
            /> : 
            <Navigate to="/" replace />
        } 
      />
      <Route 
        path="/transactions" 
        element={
          isAuthenticated ? 
            <TransactionForm onBack={() => navigate('/dashboard')} /> : 
            <Navigate to="/" replace />
        } 
      />
      <Route 
        path="/products" 
        element={
          isAuthenticated ? 
            <ProductsServices onBack={() => navigate('/dashboard')} /> : 
            <Navigate to="/" replace />
        } 
      />
      <Route 
        path="/reports" 
        element={
          isAuthenticated ? 
            <Reports onBack={() => navigate('/dashboard')} /> : 
            <Navigate to="/" replace />
        } 
      />
      <Route 
        path="/settings" 
        element={
          isAuthenticated ? 
            <Settings 
              onBack={() => navigate('/dashboard')} 
              user={user} 
              onLogout={handleLogout} 
            /> : 
            <Navigate to="/" replace />
        } 
      />

      {/* Catch all route - redirect to appropriate page */}
      <Route 
        path="*" 
        element={
          <Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />
        } 
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;