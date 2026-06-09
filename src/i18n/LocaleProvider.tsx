import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { getStoredLocale, persistLocale, type AppLocale } from './locale';
import { messages, type MessageKey } from './messages';
import { messageExtras } from './messageExtras';
import { LocaleContext, type LocaleContextValue } from './localeContext';

export const LocaleProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<AppLocale>(() => getStoredLocale());

  useEffect(() => {
    persistLocale(locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale: setLocaleState,
      t: (key: MessageKey) => messageExtras[locale][key] ?? messages[locale][key] ?? key,
    }),
    [locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
};
