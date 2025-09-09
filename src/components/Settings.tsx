import React, { useState, useEffect } from 'react';
import { ArrowLeft, User as UserIcon, Shield, Download, Upload, Trash2, Search, ChevronDown, Globe, Palette, DollarSign, Eye, Monitor, Sun, Moon, Check, Cloud, Database, Wifi, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UzajiLogo } from './UzajiLogo';
import { useSettings } from '../hooks/useSettings';
import { useTranslation } from '../hooks/useTranslation';
import { worldCurrencies, currencyRegions, formatCurrencyAmount } from '../utils/currencies';
import { worldLanguages, languageRegions, getLanguageByCode } from '../utils/languages';
import { getTransactions, getProducts, getServices, setSetting, getSetting } from '../utils/database';
import { encryption } from '../utils/encryption';
import { syncService } from '../utils/sync';
import { supabaseHelpers } from '../utils/supabase';
import type { User } from '../hooks/useAuth';
import { EnhancedSettings } from './EnhancedSettings';

interface SettingsProps {
  user: User | null;
  onLogout: () => void;
}

export function Settings({ user, onLogout }: SettingsProps) {
  return <EnhancedSettings user={user} onLogout={onLogout} />;
}