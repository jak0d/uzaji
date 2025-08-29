import { getTranslation } from '../utils/translations';

export function useTranslation(language: string) {
  const t = (key: string): string => {
    return getTranslation(key, language);
  };

  return { t };
}