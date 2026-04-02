import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useLocale } from '../i18n/LocaleProvider';
import { loginApi, registerApi } from '../services/api';

const LandingPage = () => {
  const navigate = useNavigate();
  const { t } = useLocale();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBackHome = () => {
    navigate('/');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!username || !password) {
      setError(t('missingUsernameOrPassword'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isLoginMode) {
        const response = await loginApi({ username, password });
        if (response.data && response.data.token) {
          localStorage.setItem('token', response.data.token);
          navigate('/');
        } else {
          setError(t('missingToken'));
        }
      } else {
        await registerApi({ username, password });
        window.alert(t('registerSuccess'));
        setIsLoginMode(true);
        setPassword('');
      }
    } catch (err: any) {
      setError(err.message || t('actionFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-page">
      <div className="landing-content">
        <div className="landing-toolbar">
          <button type="button" className="landing-back-btn" onClick={handleBackHome}>
            {t('backHome')}
          </button>
          <LanguageSwitcher />
        </div>

        <div className="landing-logo">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
          </svg>
          {t('appName')}
        </div>
        <h1 className="landing-title">{t('discoverYourWorld')}</h1>
        <p className="landing-desc">{t('landingDescription')}</p>

        <div className="login-card">
          <h2 style={{ marginBottom: '24px', fontSize: '20px' }}>
            {isLoginMode ? t('loginTitle') : t('registerTitle')}
          </h2>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder={t('usernamePlaceholder')}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
            <input
              type="password"
              placeholder={t('passwordPlaceholder')}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <div className="error-msg">{error}</div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? <div className="loader"></div> : isLoginMode ? t('login') : t('register')}
            </button>
          </form>
          <div
            className="toggle-form"
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setError('');
            }}
          >
            {isLoginMode ? t('noAccount') : t('hasAccount')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
