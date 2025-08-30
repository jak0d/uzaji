import { useState, useEffect } from 'react';
import { Settings, Wifi, WifiOff, LogOut, Bell, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UzajiLogo } from './UzajiLogo';
import { useSettings } from '../hooks/useSettings';
import { getCurrentBusinessConfig } from '../utils/businessConfig';
import type { User } from '../hooks/useAuth';

interface DashboardHeaderProps {
  user: User;
  onLogout: () => void;
  onMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

export function DashboardHeader({ user, onLogout, onMenuToggle, isMobileMenuOpen }: DashboardHeaderProps) {
  const { settings, getThemeClasses } = useSettings();
  const themeClasses = getThemeClasses();
  const navigate = useNavigate();
  
  const [businessName, setBusinessName] = useState<string>('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    loadBusinessConfig();
    
    // Update online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Update current date every minute
    const dateInterval = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(dateInterval);
    };
  }, []);

  const loadBusinessConfig = async () => {
    try {
      const config = await getCurrentBusinessConfig();
      if (config) {
        setBusinessName(config.name);
      }
    } catch (error) {
      console.error('Failed to load business config:', error);
    }
  };

  const formatCurrentDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    const locale = settings.language === 'en' ? 'en-US' : 
                   settings.language === 'es' ? 'es-ES' :
                   settings.language === 'fr' ? 'fr-FR' :
                   'en-US';
    
    return currentDate.toLocaleDateString(locale, options);
  };

  const handleSettingsClick = () => {
    setShowUserMenu(false);
    navigate('/settings');
  };

  const handleLogoutClick = () => {
    setShowUserMenu(false);
    onLogout();
  };

  const getUserInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <header className={`${themeClasses.cardBackground} shadow-sm ${themeClasses.border} border-b sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left Section */}
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              <button
                onClick={onMenuToggle}
                className={`lg:hidden p-2 ${themeClasses.textSecondary} hover:${themeClasses.text} ${themeClasses.hover} rounded-lg transition-colors`}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>

              {/* Logo */}
              <UzajiLogo size="md" className="hidden sm:block" />
              <UzajiLogo size="sm" className="sm:hidden" />

              {/* Welcome Message */}
              <div className="hidden md:block">
                <h1 className={`text-xl font-bold ${themeClasses.text}`}>
                  Welcome back{businessName ? `, ${businessName}` : ''}! 👋
                </h1>
                <p className={`text-sm ${themeClasses.textSecondary}`}>
                  {formatCurrentDate()}
                </p>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-3">
              {/* Online Status */}
              <div className="hidden sm:flex items-center space-x-2">
                {isOnline ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm ${themeClasses.textSecondary}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              {/* Settings Button */}
              <button
                onClick={handleSettingsClick}
                className={`p-2 ${themeClasses.textSecondary} hover:${themeClasses.text} ${themeClasses.hover} rounded-lg transition-colors`}
                aria-label="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* Notifications Button (Future Feature) */}
              <button
                className={`p-2 ${themeClasses.textSecondary} hover:${themeClasses.text} ${themeClasses.hover} rounded-lg transition-colors opacity-50 cursor-not-allowed`}
                aria-label="Notifications (Coming Soon)"
                disabled
              >
                <Bell className="w-5 h-5" />
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`flex items-center space-x-2 p-2 ${themeClasses.text} ${themeClasses.hover} rounded-lg transition-colors`}
                  aria-label="User menu"
                >
                  <div className={`w-8 h-8 ${themeClasses.accent} rounded-full flex items-center justify-center shadow-sm`}>
                    <span className={`${themeClasses.accentText} text-sm font-medium`}>
                      {getUserInitials(user.name)}
                    </span>
                  </div>
                  <span className="hidden sm:block text-sm font-medium truncate max-w-32">
                    {user.name}
                  </span>
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className={`absolute ${themeClasses.direction === 'rtl' ? 'left-0' : 'right-0'} mt-2 w-64 ${themeClasses.cardBackground} rounded-lg shadow-lg ${themeClasses.border} border py-1 z-50`}>
                    {/* User Info */}
                    <div className={`px-4 py-3 border-b ${themeClasses.border}`}>
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 ${themeClasses.accent} rounded-full flex items-center justify-center`}>
                          <span className={`${themeClasses.accentText} font-medium`}>
                            {getUserInitials(user.name)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${themeClasses.text} truncate`}>
                            {user.name}
                          </p>
                          <p className={`text-xs ${themeClasses.textSecondary} truncate`}>
                            {user.email}
                          </p>
                          {businessName && (
                            <p className={`text-xs ${themeClasses.textSecondary} truncate mt-1`}>
                              {businessName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <button
                        onClick={handleSettingsClick}
                        className={`w-full text-left px-4 py-2 text-sm ${themeClasses.text} ${themeClasses.hover} flex items-center space-x-2 transition-colors`}
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </button>
                      
                      <div className={`border-t ${themeClasses.border} my-1`} />
                      
                      <button
                        onClick={handleLogoutClick}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Welcome Message */}
          <div className="md:hidden pb-4">
            <h1 className={`text-lg font-bold ${themeClasses.text}`}>
              Welcome back{businessName ? `, ${businessName}` : ''}! 👋
            </h1>
            <div className="flex items-center justify-between mt-1">
              <p className={`text-sm ${themeClasses.textSecondary}`}>
                {formatCurrentDate()}
              </p>
              <div className="flex items-center space-x-2">
                {isOnline ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm ${themeClasses.textSecondary}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </>
  );
}