import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, Chrome, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { UzajiLogo } from './UzajiLogo';
import { useTranslation } from '../hooks/useTranslation';
import { useSettings } from '../hooks/useSettings';
import { supabaseHelpers } from '../utils/supabase';

interface AuthPageProps {
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onSignup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  onGoogleAuth: () => Promise<{ success: boolean; error?: string }>;
  onBack: () => void;
  isOpen: boolean;
}

export function AuthPage({ onLogin, onSignup, onGoogleAuth, onBack, isOpen }: AuthPageProps) {
  const { t } = useTranslation();
  const { getThemeClasses } = useSettings();
  const themeClasses = getThemeClasses();
  
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.password.trim()) return;

    if (!isLoginMode) {
      if (!formData.name.trim()) {
        setError('Please enter your full name');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
    }

    setIsLoading(true);
    setError('');

    try {
      const result = isLoginMode 
        ? await onLogin(formData.email, formData.password)
        : await onSignup(formData.email, formData.password, formData.name);
      
      if (!result.success) {
        setError(result.error || (isLoginMode ? 'Login failed' : 'Signup failed'));
      } else if (!isLoginMode) {
        // Check if this is a Supabase signup that requires email confirmation
        if (supabaseHelpers.isConfigured()) {
          setSignupEmail(formData.email);
          setSignupSuccess(true);
          setFormData({
            email: '',
            password: '',
            name: '',
            confirmPassword: ''
          });
        }
      }
    } catch (err) {
      setError(isLoginMode ? 'Login failed. Please try again.' : 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const result = await onGoogleAuth();
      if (!result.success) {
        setError(result.error || 'Google authentication failed');
      }
      // If successful, the redirect will happen automatically
      // Don't set loading to false here as the page will redirect
    } catch (err) {
      setError('Google authentication failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setError('Please enter your email address');
      return;
    }

    // Check if Supabase is configured
    if (!supabaseHelpers.isConfigured()) {
      setError('Password reset is only available for cloud accounts. Please contact support if you need help with your local account.');
      return;
    }

    setIsResetting(true);
    setError('');

    try {
      const { error } = await supabaseHelpers.resetPassword(resetEmail);
      
      if (error) {
        if (error.message.includes('User not found')) {
          setError('No account found with this email address. Please check your email or sign up for a new account.');
        } else if (error.message.includes('Email rate limit exceeded')) {
          setError('Too many password reset requests. Please wait a few minutes before trying again.');
        } else {
          setError(`Password reset failed: ${error.message}`);
        }
      } else {
        setResetSuccess(true);
        setError('');
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setError('Failed to send password reset email. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError('');
    setShowForgotPassword(false);
    setResetSuccess(false);
    setSignupSuccess(false);
    setFormData({
      email: '',
      password: '',
      name: '',
      confirmPassword: ''
    });
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setResetSuccess(false);
    setSignupSuccess(false);
    setError('');
    setResetEmail('');
  };

  if (!isOpen) return null;

  return (
    <div className={`min-h-screen ${themeClasses.background} flex items-center justify-center p-4`} dir={themeClasses.direction}>
      <div className="w-full max-w-md">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={showForgotPassword || signupSuccess ? handleBackToLogin : onBack}
            className={`flex items-center space-x-2 ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors group`}
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>{showForgotPassword || signupSuccess ? 'Back to Sign In' : `${t('common.back')} to Home`}</span>
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <UzajiLogo size="xl" />
          </div>
          <h1 className={`text-3xl font-bold ${themeClasses.text} mb-2`}>
            {showForgotPassword 
              ? 'Reset Your Password'
              : signupSuccess
              ? 'Check Your Email'
              : isLoginMode 
              ? t('auth.welcomeBack') 
              : t('auth.createAccount')
            }
          </h1>
          <p className={`${themeClasses.textSecondary}`}>
            {showForgotPassword
              ? 'Enter your email address and we\'ll send you a link to reset your password'
              : signupSuccess
              ? 'We\'ve sent you a confirmation email to complete your registration'
              : isLoginMode 
              ? 'Sign in to access your secure bookkeeping data' 
              : 'Start managing your business finances securely'
            }
          </p>
        </div>

        {/* Auth Card */}
        <div className={`${themeClasses.cardBackground} rounded-2xl shadow-xl ${themeClasses.border} border p-8`}>
          {signupSuccess ? (
            /* Signup Success Message */
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className={`text-lg font-semibold ${themeClasses.text} mb-2`}>Account Created Successfully!</h3>
              <p className={`${themeClasses.textSecondary} mb-6`}>
                We've sent a confirmation email to <strong>{signupEmail}</strong>. 
                Please check your email and click the confirmation link to activate your account.
              </p>
              <div className={`p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-6`}>
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className={`text-sm font-medium ${themeClasses.text} mb-1`}>Next Steps:</p>
                    <ul className={`text-sm ${themeClasses.textSecondary} space-y-1`}>
                      <li>1. Check your email inbox</li>
                      <li>2. Click the confirmation link</li>
                      <li>3. Return here to sign in</li>
                    </ul>
                  </div>
                </div>
              </div>
              <p className={`text-sm ${themeClasses.textSecondary} mb-6`}>
                Didn't receive the email? Check your spam folder or contact support if you need assistance.
              </p>
              <button
                onClick={handleBackToLogin}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
              >
                Back to Sign In
              </button>
            </div>
          ) : showForgotPassword ? (
            /* Forgot Password Form */
            <>
              {resetSuccess ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className={`text-lg font-semibold ${themeClasses.text} mb-2`}>Check Your Email</h3>
                  <p className={`${themeClasses.textSecondary} mb-6`}>
                    We've sent a password reset link to <strong>{resetEmail}</strong>. 
                    Click the link in the email to reset your password.
                  </p>
                  <p className={`text-sm ${themeClasses.textSecondary} mb-6`}>
                    Didn't receive the email? Check your spam folder or try again with a different email address.
                  </p>
                  <button
                    onClick={handleBackToLogin}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div>
                    <label htmlFor="resetEmail" className={`block text-sm font-semibold ${themeClasses.text} mb-2`}>
                      {t('auth.email')}
                    </label>
                    <div className="relative">
                      <Mail className={`absolute ${themeClasses.direction === 'rtl' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-5 h-5 ${themeClasses.textSecondary}`} />
                      <input
                        type="email"
                        id="resetEmail"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className={`w-full ${themeClasses.direction === 'rtl' ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 ${themeClasses.border} border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${themeClasses.cardBackground} ${themeClasses.text}`}
                        placeholder="Enter your email address"
                        required
                      />
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-red-700 dark:text-red-300 text-sm font-medium">{error}</p>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isResetting}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center space-x-2 group shadow-lg hover:shadow-xl"
                  >
                    {isResetting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span>Send Reset Link</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          ) : (
            /* Regular Auth Form */
            <>
              {/* Google Auth Button */}
              <button
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className={`w-full flex items-center justify-center space-x-3 px-4 py-3 border-2 ${themeClasses.border} rounded-xl ${themeClasses.hover} transition-all duration-200 mb-6 disabled:opacity-50 disabled:cursor-not-allowed group`}
              >
                <Chrome className={`w-5 h-5 ${themeClasses.textSecondary} group-hover:${themeClasses.text}`} />
                <span className={`font-medium ${themeClasses.text}`}>
                  {isLoginMode ? t('auth.signInWithGoogle') : t('auth.signInWithGoogle')}
                </span>
              </button>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className={`w-full border-t ${themeClasses.border}`}></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className={`px-4 ${themeClasses.cardBackground} ${themeClasses.textSecondary}`}>or continue with email</span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name Field (Signup only) */}
                {!isLoginMode && (
                  <div>
                    <label htmlFor="name" className={`block text-sm font-semibold ${themeClasses.text} mb-2`}>
                      {t('auth.fullName')}
                    </label>
                    <div className="relative">
                      <User className={`absolute ${themeClasses.direction === 'rtl' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-5 h-5 ${themeClasses.textSecondary}`} />
                      <input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className={`w-full ${themeClasses.direction === 'rtl' ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 ${themeClasses.border} border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${themeClasses.cardBackground} ${themeClasses.text}`}
                        placeholder="Enter your full name"
                        required={!isLoginMode}
                      />
                    </div>
                  </div>
                )}

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className={`block text-sm font-semibold ${themeClasses.text} mb-2`}>
                    {t('auth.email')}
                  </label>
                  <div className="relative">
                    <Mail className={`absolute ${themeClasses.direction === 'rtl' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-5 h-5 ${themeClasses.textSecondary}`} />
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className={`w-full ${themeClasses.direction === 'rtl' ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 ${themeClasses.border} border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${themeClasses.cardBackground} ${themeClasses.text}`}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="password" className={`block text-sm font-semibold ${themeClasses.text}`}>
                      {t('auth.password')}
                    </label>
                    {isLoginMode && (
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
                      >
                        {t('auth.forgotPassword')}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className={`absolute ${themeClasses.direction === 'rtl' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-5 h-5 ${themeClasses.textSecondary}`} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className={`w-full ${themeClasses.direction === 'rtl' ? 'pr-11 pl-12' : 'pl-11 pr-12'} py-3 ${themeClasses.border} border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${themeClasses.cardBackground} ${themeClasses.text}`}
                      placeholder={isLoginMode ? "Enter your password" : "Create a strong password"}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute ${themeClasses.direction === 'rtl' ? 'left-3' : 'right-3'} top-1/2 transform -translate-y-1/2 ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {!isLoginMode && (
                    <p className={`text-xs ${themeClasses.textSecondary} mt-1`}>
                      Must be at least 6 characters long
                    </p>
                  )}
                </div>

                {/* Confirm Password Field (Signup only) */}
                {!isLoginMode && (
                  <div>
                    <label htmlFor="confirmPassword" className={`block text-sm font-semibold ${themeClasses.text} mb-2`}>
                      {t('auth.confirmPassword')}
                    </label>
                    <div className="relative">
                      <Lock className={`absolute ${themeClasses.direction === 'rtl' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-5 h-5 ${themeClasses.textSecondary}`} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className={`w-full ${themeClasses.direction === 'rtl' ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 ${themeClasses.border} border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${themeClasses.cardBackground} ${themeClasses.text}`}
                        placeholder="Confirm your password"
                        required={!isLoginMode}
                      />
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-red-700 dark:text-red-300 text-sm font-medium">{error}</p>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center space-x-2 group shadow-lg hover:shadow-xl"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>{isLoginMode ? t('auth.signIn') : t('auth.signUp')}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Toggle Mode */}
              <div className="mt-6 text-center">
                <p className={themeClasses.textSecondary}>
                  {isLoginMode ? "Don't have an account?" : "Already have an account?"}
                  <button
                    onClick={toggleMode}
                    className={`ml-2 text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors`}
                  >
                    {isLoginMode ? t('auth.signUp') : t('auth.signIn')}
                  </button>
                </p>
              </div>
            </>
          )}
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className={`text-xs ${themeClasses.textSecondary} leading-relaxed`}>
            Your data is encrypted with client-side encryption using your account credentials.<br />
            We never store your passwords or have access to your financial information.
          </p>
        </div>
      </div>
    </div>
  );
}