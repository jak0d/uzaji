import { useSettings } from './useSettings';
import { getTranslation } from '../utils/translations';

export function useTranslation() {
  const { settings } = useSettings();

  const t = (key: string): string => {
    return getTranslation(key, settings.language);
  };

  return { t };
}