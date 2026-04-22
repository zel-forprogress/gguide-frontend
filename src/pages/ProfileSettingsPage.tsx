import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '../i18n/LocaleProvider';
import { getFavoritesApi, getRecentlyViewedApi, type Game } from '../services/api';
import { clearStoredToken, subscribeAuthExpired } from '../utils/auth';

type ProfileSection = 'general' | 'account' | 'language' | 'library' | 'session';

const decodeUsernameFromToken = (token: string | null) => {
  if (!token) {
    return '';
  }

  try {
    const payload = token.split('.')[1];
    if (!payload) {
      return '';
    }

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(window.atob(normalized));
    return decoded?.sub || '';
  } catch {
    return '';
  }
};

const ProfileSettingsPage = () => {
  const navigate = useNavigate();
  const { locale, setLocale, t } = useLocale();
  const [favoriteGames, setFavoriteGames] = useState<Game[]>([]);
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState<ProfileSection>('general');

  const token = localStorage.getItem('token');
  const username = useMemo(() => decodeUsernameFromToken(token), [token]);

  const copy = useMemo(
    () =>
      locale === 'zh-CN'
        ? {
            signedInAs: '已登录用户',
            noPreference: '暂无偏好',
            sections: {
              general: { title: '常规', description: '查看常用设置和当前账号概况。' },
              account: { title: '账号', description: '管理你的账号基础信息和登录状态。' },
              language: { title: '语言', description: '调整界面语言与显示方式。' },
              library: { title: '游戏资料', description: '查看收藏、最近查看和兴趣偏好。' },
              session: { title: '会话', description: '回到应用首页，或退出当前账号。' },
            },
            rows: {
              username: { label: '用户名', desc: '当前登录账号名称' },
              status: { label: '登录状态', desc: '当前会话状态' },
              language: { label: '应用语言', desc: '切换后界面和游戏内容会一起更新' },
              favorites: { label: '收藏游戏', desc: '你已经收藏的游戏数量' },
              recent: { label: '最近查看', desc: '你最近打开过的游戏详情数量' },
              preference: { label: '偏好分类', desc: '根据收藏统计出的常见分类' },
              backHome: { label: '返回首页', desc: '回到首页继续浏览和发现游戏' },
              favoritesEntry: { label: '打开我的收藏', desc: '直接进入你的收藏列表' },
              recentEntry: { label: '打开最近查看', desc: '继续浏览你刚刚看过的内容' },
              logout: { label: '退出登录', desc: '清除当前会话并返回登录页面' },
            },
            statusActive: '已登录',
            statusHealthy: '会话有效',
            open: '打开',
            logout: '退出登录',
          }
        : {
            signedInAs: 'Signed in as',
            noPreference: 'No preference yet',
            sections: {
              general: { title: 'General', description: 'Review the most common settings and your current account summary.' },
              account: { title: 'Account', description: 'Manage your basic account information and sign-in state.' },
              language: { title: 'Language', description: 'Adjust interface language and display behavior.' },
              library: { title: 'Game Data', description: 'Review favorites, recent activity, and interest signals.' },
              session: { title: 'Session', description: 'Return to the app home or sign out of the current account.' },
            },
            rows: {
              username: { label: 'Username', desc: 'The name of the account currently signed in' },
              status: { label: 'Session state', desc: 'Current authentication status' },
              language: { label: 'App language', desc: 'Switching updates both interface copy and game content' },
              favorites: { label: 'Favorite games', desc: 'How many games you have saved' },
              recent: { label: 'Recently viewed', desc: 'How many game detail pages you opened lately' },
              preference: { label: 'Top categories', desc: 'Frequent categories inferred from favorites' },
              backHome: { label: 'Back to home', desc: 'Return to the home page and keep exploring' },
              favoritesEntry: { label: 'Open favorites', desc: 'Jump straight to your saved games' },
              recentEntry: { label: 'Open recently viewed', desc: 'Continue from what you opened most recently' },
              logout: { label: 'Log out', desc: 'Clear the current session and go back to auth' },
            },
            statusActive: 'Signed in',
            statusHealthy: 'Session active',
            open: 'Open',
            logout: 'Log Out',
          },
    [locale]
  );

  useEffect(() => {
    const unsubscribe = subscribeAuthExpired(() => {
      navigate('/auth', { replace: true, state: { reason: 'session-expired' } });
    });

    return unsubscribe;
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;

    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError('');

        const [favoritesResponse, recentResponse] = await Promise.all([
          getFavoritesApi(locale),
          getRecentlyViewedApi(locale),
        ]);

        if (cancelled) {
          return;
        }

        if (favoritesResponse.code === 200) {
          setFavoriteGames(favoritesResponse.data || []);
        }

        if (recentResponse.code === 200) {
          setRecentGames(recentResponse.data || []);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || t('loadingContent'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchProfileData();

    return () => {
      cancelled = true;
    };
  }, [locale, t]);

  const favoriteCategories = useMemo(() => {
    const counts = new Map<string, number>();

    favoriteGames.forEach((game) => {
      (game.categoryLabels || []).forEach((label) => {
        counts.set(label, (counts.get(label) || 0) + 1);
      });
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([label]) => label);
  }, [favoriteGames]);

  const handleLogout = () => {
    clearStoredToken();
    navigate('/auth', { replace: true });
  };

  const sectionEntries: Array<{ key: ProfileSection; title: string }> = [
    { key: 'general', title: copy.sections.general.title },
    { key: 'account', title: copy.sections.account.title },
    { key: 'language', title: copy.sections.language.title },
    { key: 'library', title: copy.sections.library.title },
    { key: 'session', title: copy.sections.session.title },
  ];

  const renderSettingRow = (
    label: string,
    description: string,
    value: React.ReactNode,
    action?: React.ReactNode
  ) => (
    <div className="settings-row">
      <div className="settings-row-copy">
        <strong>{label}</strong>
        <span>{description}</span>
      </div>
      <div className="settings-row-meta">
        <div className="settings-row-value">{value}</div>
        {action ? <div className="settings-row-action">{action}</div> : null}
      </div>
    </div>
  );

  const renderGeneralSection = () => (
    <div className="settings-card">
      {renderSettingRow(copy.rows.username.label, copy.rows.username.desc, username || 'User')}
      {renderSettingRow(copy.rows.language.label, copy.rows.language.desc, locale === 'zh-CN' ? '中文' : 'English')}
      {renderSettingRow(
        copy.rows.favorites.label,
        copy.rows.favorites.desc,
        loading ? '...' : favoriteGames.length
      )}
      {renderSettingRow(
        copy.rows.recent.label,
        copy.rows.recent.desc,
        loading ? '...' : recentGames.length
      )}
      {renderSettingRow(
        copy.rows.preference.label,
        copy.rows.preference.desc,
        favoriteCategories.length > 0 ? favoriteCategories.join(' / ') : copy.noPreference
      )}
    </div>
  );

  const renderAccountSection = () => (
    <div className="settings-card">
      {renderSettingRow(copy.rows.username.label, copy.rows.username.desc, username || 'User')}
      {renderSettingRow(copy.rows.status.label, copy.rows.status.desc, copy.statusHealthy)}
    </div>
  );

  const renderLanguageSection = () => (
    <div className="settings-card">
      {renderSettingRow(
        copy.rows.language.label,
        copy.rows.language.desc,
        locale === 'zh-CN' ? '中文' : 'English',
        <div className="settings-segmented">
          <button
            type="button"
            className={`settings-segmented-btn${locale === 'zh-CN' ? ' is-active' : ''}`}
            onClick={() => setLocale('zh-CN')}
          >
            中文
          </button>
          <button
            type="button"
            className={`settings-segmented-btn${locale === 'en-US' ? ' is-active' : ''}`}
            onClick={() => setLocale('en-US')}
          >
            English
          </button>
        </div>
      )}
    </div>
  );

  const renderLibrarySection = () => (
    <div className="settings-card">
      {renderSettingRow(
        copy.rows.favorites.label,
        copy.rows.favorites.desc,
        loading ? '...' : favoriteGames.length,
        <button type="button" className="settings-link-btn" onClick={() => navigate('/', { state: { view: 'favorites' } })}>
          {copy.open}
        </button>
      )}
      {renderSettingRow(
        copy.rows.recent.label,
        copy.rows.recent.desc,
        loading ? '...' : recentGames.length,
        <button type="button" className="settings-link-btn" onClick={() => navigate('/', { state: { view: 'recent' } })}>
          {copy.open}
        </button>
      )}
      {renderSettingRow(
        copy.rows.preference.label,
        copy.rows.preference.desc,
        favoriteCategories.length > 0 ? favoriteCategories.join(' / ') : copy.noPreference
      )}
    </div>
  );

  const renderSessionSection = () => (
    <div className="settings-card">
      {renderSettingRow(
        copy.rows.backHome.label,
        copy.rows.backHome.desc,
        '',
        <button type="button" className="settings-link-btn" onClick={() => navigate('/')}>
          {copy.open}
        </button>
      )}
      {renderSettingRow(
        copy.rows.favoritesEntry.label,
        copy.rows.favoritesEntry.desc,
        '',
        <button type="button" className="settings-link-btn" onClick={() => navigate('/', { state: { view: 'favorites' } })}>
          {copy.open}
        </button>
      )}
      {renderSettingRow(
        copy.rows.recentEntry.label,
        copy.rows.recentEntry.desc,
        '',
        <button type="button" className="settings-link-btn" onClick={() => navigate('/', { state: { view: 'recent' } })}>
          {copy.open}
        </button>
      )}
      {renderSettingRow(
        copy.rows.logout.label,
        copy.rows.logout.desc,
        copy.statusActive,
        <button type="button" className="settings-link-btn settings-link-btn-danger" onClick={handleLogout}>
          {copy.logout}
        </button>
      )}
    </div>
  );

  const renderSectionContent = () => {
    if (error) {
      return (
        <div className="settings-card">
          <div className="state-panel state-panel-error">
            <p>{error}</p>
          </div>
        </div>
      );
    }

    switch (activeSection) {
      case 'account':
        return renderAccountSection();
      case 'language':
        return renderLanguageSection();
      case 'library':
        return renderLibrarySection();
      case 'session':
        return renderSessionSection();
      case 'general':
      default:
        return renderGeneralSection();
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-shell">
        <div className="profile-toolbar">
          <button type="button" className="profile-back-btn" onClick={() => navigate('/')}>
            {t('backHome')}
          </button>
          <div className="profile-status-chip">
            <span className="profile-status-chip-dot" />
            {copy.signedInAs} · {username || 'User'}
          </div>
        </div>

        <div className="profile-settings-layout">
          <aside className="profile-settings-sidebar">
            <div className="profile-sidebar-title">{t('profileSettings')}</div>
            <div className="profile-sidebar-nav">
              {sectionEntries.map((section) => (
                <button
                  key={section.key}
                  type="button"
                  className={`profile-sidebar-item${activeSection === section.key ? ' is-active' : ''}`}
                  onClick={() => setActiveSection(section.key)}
                >
                  <span className="profile-sidebar-item-dot" />
                  {section.title}
                </button>
              ))}
            </div>
          </aside>

          <section className="profile-settings-content">
            <header className="profile-settings-header">
              <h1>{copy.sections[activeSection].title}</h1>
              <p>{copy.sections[activeSection].description}</p>
            </header>

            {renderSectionContent()}
          </section>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;
