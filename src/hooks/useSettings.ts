import { useState, useEffect } from 'react';
import { getSetting, setSetting } from '../utils/database';
import { formatCurrencyAmount } from '../utils/currencies';
import { isRTLLanguage } from '../utils/languages';

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  currency: string;
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  notifications: boolean;
  autoSync: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly' | 'manual';
  language: string;
  compactView: boolean;
}

const defaultSettings: AppSettings = {
  theme: 'light',
  currency: 'USD',
  dateFormat: 'MM/DD/YYYY',
  notifications: true,
  autoSync: false,
  backupFrequency: 'weekly',
  language: 'en',
  compactView: false,
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    // Apply theme changes to document
    applyTheme(settings.theme);
    // Apply language direction changes
    applyLanguageDirection(settings.language);
    // Update document title based on language
    updateDocumentTitle(settings.language);
  }, [settings.theme, settings.language]);

  const loadSettings = async () => {
    try {
      const savedSettings = await getSetting('app-settings');
      if (savedSettings) {
        setSettings({ ...defaultSettings, ...savedSettings });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      await setSetting('app-settings', updatedSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const applyTheme = (theme: 'light' | 'dark' | 'system') => {
    const root = document.documentElement;
    
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  };

  const applyLanguageDirection = (language: string) => {
    const root = document.documentElement;
    const isRTL = isRTLLanguage(language);
    
    root.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    root.setAttribute('lang', language);
  };

  const updateDocumentTitle = (language: string) => {
    // Import translations dynamically to avoid circular dependency
    import('../utils/translations').then(({ getTranslation }) => {
      const title = getTranslation('app.title', language);
      document.title = title;
    });
  };

  const formatCurrency = (amount: number): string => {
    return formatCurrencyAmount(amount, settings.currency);
  };

  const formatDate = (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Use the browser's locale based on the selected language
    const locale = settings.language === 'en' ? 'en-US' : 
                   settings.language === 'es' ? 'es-ES' :
                   settings.language === 'fr' ? 'fr-FR' :
                   settings.language === 'de' ? 'de-DE' :
                   settings.language === 'zh' ? 'zh-CN' :
                   settings.language === 'ja' ? 'ja-JP' :
                   settings.language === 'ko' ? 'ko-KR' :
                   settings.language === 'pt' ? 'pt-BR' :
                   settings.language === 'ru' ? 'ru-RU' :
                   settings.language === 'ar' ? 'ar-SA' :
                   settings.language === 'hi' ? 'hi-IN' :
                   settings.language === 'it' ? 'it-IT' :
                   settings.language === 'nl' ? 'nl-NL' :
                   settings.language === 'tr' ? 'tr-TR' :
                   settings.language === 'pl' ? 'pl-PL' :
                   'en-US';
    
    switch (settings.dateFormat) {
      case 'DD/MM/YYYY':
        return dateObj.toLocaleDateString(locale, { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        });
      case 'YYYY-MM-DD':
        return dateObj.toISOString().split('T')[0];
      case 'MM/DD/YYYY':
      default:
        return dateObj.toLocaleDateString(locale, { 
          month: '2-digit', 
          day: '2-digit', 
          year: 'numeric' 
        });
    }
  };

  const getThemeClasses = () => {
    const isRTL = isRTLLanguage(settings.language);
    
    // Define a more modern and professional color palette
    const themeConfig = {
      light: {
        background: 'bg-slate-50', // Lighter, cleaner background
        cardBackground: 'bg-white',
        text: 'text-slate-800', // Softer black for text
        textSecondary: 'text-slate-500',
        border: 'border-slate-200',
        hover: 'hover:bg-slate-100',
        accent: 'bg-blue-500',
        accentText: 'text-white',
      },
      dark: {
        background: 'bg-slate-900', // Deep, modern dark background
        cardBackground: 'bg-slate-800',
        text: 'text-slate-200', // Softer white for text
        textSecondary: 'text-slate-400',
        border: 'border-slate-700',
        hover: 'hover:bg-slate-700',
        accent: 'bg-blue-500',
        accentText: 'text-white',
      },
    };

    const currentTheme = settings.theme === 'dark' ? themeConfig.dark : themeConfig.light;

    return {
      ...currentTheme,
      direction: isRTL ? 'rtl' : 'ltr',
      textAlign: isRTL ? 'text-right' : 'text-left',
      marginStart: isRTL ? 'ml-4' : 'mr-4',
      marginEnd: isRTL ? 'mr-4' : 'ml-4',
      paddingStart: isRTL ? 'pl-4' : 'pr-4',
      paddingEnd: isRTL ? 'pr-4' : 'pl-4',
    };
  };

  return {
    settings,
    updateSettings,
    formatCurrency,
    formatDate,
    getThemeClasses,
    isLoading,
  };
}