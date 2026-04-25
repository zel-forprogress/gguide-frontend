import { useEffect, useState } from 'react';
import { useNavigate, useRoutes } from 'react-router-dom';
import routes from './routes';
import './App.css';
import { useLocale } from './i18n/LocaleProvider';
import {
  checkStoredTokenExpiration,
  subscribeAuthExpired,
  type AuthExpiredDetail,
} from './utils/auth';

interface AppProps {
  initialAuthExpired?: AuthExpiredDetail | null;
}

function App({ initialAuthExpired = null }: AppProps) {
  const navigate = useNavigate();
  const { t } = useLocale();
  const element = useRoutes(routes);
  const [authExpiredNotice, setAuthExpiredNotice] = useState<AuthExpiredDetail | null>(
    initialAuthExpired
  );

  useEffect(() => {
    const unsubscribe = subscribeAuthExpired((detail) => {
      setAuthExpiredNotice(detail);
    });
    const detail = checkStoredTokenExpiration();

    if (detail) {
      setAuthExpiredNotice(detail);
    }

    return unsubscribe;
  }, []);

  const handleDismissAuthNotice = () => {
    setAuthExpiredNotice(null);
  };

  const handleLoginFromNotice = () => {
    setAuthExpiredNotice(null);
    navigate('/auth');
  };

  return (
    <>
      {authExpiredNotice ? (
        <div className="session-expired-toast" role="alert" aria-live="assertive">
          <div className="session-expired-toast__mark">!</div>
          <div className="session-expired-toast__content">
            <strong>{t('sessionExpiredTitle')}</strong>
            <p>{t('sessionExpiredMessage')}</p>
          </div>
          <div className="session-expired-toast__actions">
            <button
              type="button"
              className="session-expired-toast__login"
              onClick={handleLoginFromNotice}
            >
              {t('goLogin')}
            </button>
            <button
              type="button"
              className="session-expired-toast__dismiss"
              onClick={handleDismissAuthNotice}
            >
              {t('sessionExpiredDismiss')}
            </button>
          </div>
        </div>
      ) : null}
      {element}
    </>
  );
}

export default App;
