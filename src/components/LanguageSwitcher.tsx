import { useLocale } from '../i18n/LocaleProvider';
import type { AppLocale } from '../i18n/locale';

const locales: AppLocale[] = ['zh-CN', 'en-US'];

const LanguageSwitcher = () => {
  const { locale, setLocale } = useLocale();

  return (
    <div className="language-switcher" role="group" aria-label="Language switcher">
      {locales.map((item) => (
        <button
          key={item}
          type="button"
          className={`language-switcher-btn${locale === item ? ' is-active' : ''}`}
          onClick={() => setLocale(item)}
          aria-pressed={locale === item}
        >
          {item === 'zh-CN' ? '中文' : 'English'}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
