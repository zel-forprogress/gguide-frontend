export type AppLocale = 'zh-CN' | 'en-US';

export const LOCALE_STORAGE_KEY = 'gguide.locale';
export const DEFAULT_LOCALE: AppLocale = 'zh-CN';

export const normalizeLocale = (value?: string | null): AppLocale => {
  if (!value) {
    return DEFAULT_LOCALE;
  }

  const normalized = value.toLowerCase();
  return normalized.startsWith('en') ? 'en-US' : 'zh-CN';
};

export const getStoredLocale = (): AppLocale => {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE;
  }

  return normalizeLocale(localStorage.getItem(LOCALE_STORAGE_KEY) || navigator.language);
};

export const persistLocale = (locale: AppLocale) => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
};
