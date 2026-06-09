import { createContext } from 'react';
import type { AppLocale } from './locale';
import type { MessageKey } from './messages';

export type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: (key: MessageKey) => string;
};

export const LocaleContext = createContext<LocaleContextValue | null>(null);
