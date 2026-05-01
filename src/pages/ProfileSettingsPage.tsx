import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '../i18n/LocaleProvider';
import {
  createGameApi,
  getCurrentUserApi,
  getFavoritesApi,
  getRecentlyViewedApi,
  type CreateGamePayload,
  type CurrentUser,
  type Game,
} from '../services/api';
import { clearStoredToken, subscribeAuthExpired } from '../utils/auth';

type ProfileSection = 'general' | 'account' | 'language' | 'library' | 'session' | 'admin';

type AdminGameForm = {
  titleZh: string;
  titleEn: string;
  descriptionZh: string;
  descriptionEn: string;
  coverImage: string;
  rating: string;
  categories: string;
  regionCode: string;
  releaseDate: string;
  cinematicTrailer: string;
  downloadLink: string;
};

const emptyAdminGameForm: AdminGameForm = {
  titleZh: '',
  titleEn: '',
  descriptionZh: '',
  descriptionEn: '',
  coverImage: '',
  rating: '',
  categories: 'ACTION',
  regionCode: 'UNKNOWN',
  releaseDate: '',
  cinematicTrailer: '',
  downloadLink: '',
};

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

const toList = (value: string) =>
  value
    .split(/[,，、\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);

const toIsoDate = (value: string) => {
  if (!value) {
    return undefined;
  }

  return new Date(`${value}T00:00:00.000Z`).toISOString();
};

const ProfileSettingsPage = () => {
  const navigate = useNavigate();
  const { locale, setLocale, t } = useLocale();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [favoriteGames, setFavoriteGames] = useState<Game[]>([]);
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState<ProfileSection>('general');
  const [adminGameForm, setAdminGameForm] = useState<AdminGameForm>(emptyAdminGameForm);
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');
  const [adminError, setAdminError] = useState('');

  const token = localStorage.getItem('token');
  const tokenUsername = useMemo(() => decodeUsernameFromToken(token), [token]);
  const username = currentUser?.username || tokenUsername || 'User';
  const isAdmin = Boolean(currentUser?.admin);

  const copy = useMemo(
    () =>
      locale === 'zh-CN'
        ? {
            signedInAs: '已登录用户',
            adminBadge: '管理员',
            noPreference: '暂无偏好',
            sections: {
              general: { title: '常规', description: '查看常用设置和当前账号概况。' },
              account: { title: '账号', description: '管理你的账号基础信息和登录状态。' },
              language: { title: '语言', description: '调整界面语言与显示方式。' },
              library: { title: '游戏资料', description: '查看收藏、最近查看和兴趣偏好。' },
              session: { title: '会话', description: '回到应用首页，或退出当前账号。' },
              admin: { title: '游戏管理', description: '管理员可以在这里向游戏库添加新的游戏。' },
            },
            rows: {
              username: { label: '用户名', desc: '当前登录账号名称' },
              role: { label: '账号角色', desc: '用于区分普通用户和管理员' },
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
            regularUser: '普通用户',
            open: '打开',
            logout: '退出登录',
            adminForm: {
              titleZh: '中文标题',
              titleEn: '英文标题',
              descriptionZh: '中文简介',
              descriptionEn: '英文简介',
              coverImage: '封面图片 URL',
              rating: '评分',
              categories: '分类代码',
              regionCode: '地区代码',
              releaseDate: '发售日期',
              releaseDatePlaceholder: '例如：2026-08-03',
              cinematicTrailer: '预告片 URL',
              downloadLink: '下载链接',
              helper: '分类可输入 ACTION、RPG、OPEN_WORLD 等，多个分类用逗号或空格分隔。',
              submit: '添加游戏',
              saving: '正在添加...',
              success: '游戏已添加到游戏库。',
            },
          }
        : {
            signedInAs: 'Signed in as',
            adminBadge: 'Admin',
            noPreference: 'No preference yet',
            sections: {
              general: { title: 'General', description: 'Review the most common settings and your current account summary.' },
              account: { title: 'Account', description: 'Manage your basic account information and sign-in state.' },
              language: { title: 'Language', description: 'Adjust interface language and display behavior.' },
              library: { title: 'Game Data', description: 'Review favorites, recent activity, and interest signals.' },
              session: { title: 'Session', description: 'Return to the app home or sign out of the current account.' },
              admin: { title: 'Game Admin', description: 'Admins can add new games to the library here.' },
            },
            rows: {
              username: { label: 'Username', desc: 'The name of the account currently signed in' },
              role: { label: 'Account role', desc: 'Used to distinguish regular users from admins' },
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
            regularUser: 'Regular user',
            open: 'Open',
            logout: 'Log Out',
            adminForm: {
              titleZh: 'Chinese title',
              titleEn: 'English title',
              descriptionZh: 'Chinese description',
              descriptionEn: 'English description',
              coverImage: 'Cover image URL',
              rating: 'Rating',
              categories: 'Category codes',
              regionCode: 'Region code',
              releaseDate: 'Release date',
              releaseDatePlaceholder: 'Example: 2026-08-03',
              cinematicTrailer: 'Trailer URL',
              downloadLink: 'Download link',
              helper: 'Use codes like ACTION, RPG, OPEN_WORLD. Separate multiple categories with commas or spaces.',
              submit: 'Add game',
              saving: 'Adding...',
              success: 'Game added to the library.',
            },
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

        const [userResponse, favoritesResponse, recentResponse] = await Promise.all([
          getCurrentUserApi(),
          getFavoritesApi(locale),
          getRecentlyViewedApi(locale),
        ]);

        if (cancelled) {
          return;
        }

        if (userResponse.code === 200) {
          setCurrentUser(userResponse.data);
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

  useEffect(() => {
    if (activeSection === 'admin' && currentUser && !currentUser.admin) {
      setActiveSection('general');
    }
  }, [activeSection, currentUser]);

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

  const handleAdminFieldChange = (field: keyof AdminGameForm, value: string) => {
    setAdminGameForm((current) => ({ ...current, [field]: value }));
    setAdminMessage('');
    setAdminError('');
  };

  const handleCreateGame = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAdminSaving(true);
    setAdminMessage('');
    setAdminError('');

    try {
      const titleZh = adminGameForm.titleZh.trim();
      const titleEn = adminGameForm.titleEn.trim();
      const descriptionZh = adminGameForm.descriptionZh.trim();
      const descriptionEn = adminGameForm.descriptionEn.trim();

      const payload: CreateGamePayload = {
        title: titleZh || titleEn,
        description: descriptionZh || descriptionEn,
        titleI18n: {
          'zh-CN': titleZh || titleEn,
          'en-US': titleEn || titleZh,
        },
        descriptionI18n: {
          'zh-CN': descriptionZh || descriptionEn,
          'en-US': descriptionEn || descriptionZh,
        },
        coverImage: adminGameForm.coverImage.trim(),
        rating: Number(adminGameForm.rating),
        categories: toList(adminGameForm.categories),
        regionCode: adminGameForm.regionCode.trim() || 'UNKNOWN',
        releaseDate: toIsoDate(adminGameForm.releaseDate),
        cinematicTrailer: adminGameForm.cinematicTrailer.trim() || undefined,
        downloadLink: adminGameForm.downloadLink.trim() || undefined,
      };

      const response = await createGameApi(payload, locale);
      if (response.code !== 200) {
        throw new Error(response.message);
      }

      setAdminGameForm(emptyAdminGameForm);
      setAdminMessage(copy.adminForm.success);
    } catch (err: any) {
      setAdminError(err.message || 'Failed to create game');
    } finally {
      setAdminSaving(false);
    }
  };

  const sectionEntries: Array<{ key: ProfileSection; title: string }> = [
    { key: 'general', title: copy.sections.general.title },
    { key: 'account', title: copy.sections.account.title },
    { key: 'language', title: copy.sections.language.title },
    { key: 'library', title: copy.sections.library.title },
    ...(isAdmin ? [{ key: 'admin' as ProfileSection, title: copy.sections.admin.title }] : []),
    { key: 'session', title: copy.sections.session.title },
  ];

  const renderSettingRow = (
    label: string,
    description: string,
    value: ReactNode,
    action?: ReactNode
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
      {renderSettingRow(copy.rows.username.label, copy.rows.username.desc, username)}
      {renderSettingRow(copy.rows.role.label, copy.rows.role.desc, isAdmin ? copy.adminBadge : copy.regularUser)}
      {renderSettingRow(copy.rows.language.label, copy.rows.language.desc, locale === 'zh-CN' ? '中文' : 'English')}
      {renderSettingRow(copy.rows.favorites.label, copy.rows.favorites.desc, loading ? '...' : favoriteGames.length)}
      {renderSettingRow(copy.rows.recent.label, copy.rows.recent.desc, loading ? '...' : recentGames.length)}
      {renderSettingRow(
        copy.rows.preference.label,
        copy.rows.preference.desc,
        favoriteCategories.length > 0 ? favoriteCategories.join(' / ') : copy.noPreference
      )}
    </div>
  );

  const renderAccountSection = () => (
    <div className="settings-card">
      {renderSettingRow(copy.rows.username.label, copy.rows.username.desc, username)}
      {renderSettingRow(copy.rows.role.label, copy.rows.role.desc, isAdmin ? copy.adminBadge : copy.regularUser)}
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

  const renderAdminField = (
    field: keyof AdminGameForm,
    label: string,
    options?: { required?: boolean; type?: string; multiline?: boolean; placeholder?: string }
  ) => (
    <label className={`admin-game-field${options?.multiline ? ' is-wide' : ''}`}>
      <span>{label}</span>
      {options?.multiline ? (
        <textarea
          value={adminGameForm[field]}
          required={options.required}
          placeholder={options.placeholder}
          onChange={(event) => handleAdminFieldChange(field, event.target.value)}
        />
      ) : (
        <input
          type={options?.type || 'text'}
          value={adminGameForm[field]}
          required={options?.required}
          placeholder={options?.placeholder}
          step={options?.type === 'number' ? '0.1' : undefined}
          min={options?.type === 'number' ? '0' : undefined}
          max={options?.type === 'number' ? '10' : undefined}
          onChange={(event) => handleAdminFieldChange(field, event.target.value)}
        />
      )}
    </label>
  );

  const renderAdminSection = () => (
    <form className="settings-card admin-game-card" onSubmit={handleCreateGame}>
      <div className="admin-game-form-grid">
        {renderAdminField('titleZh', copy.adminForm.titleZh, { required: true, placeholder: '塞尔达传说' })}
        {renderAdminField('titleEn', copy.adminForm.titleEn, { placeholder: 'The Legend of Zelda' })}
        {renderAdminField('descriptionZh', copy.adminForm.descriptionZh, { required: true, multiline: true })}
        {renderAdminField('descriptionEn', copy.adminForm.descriptionEn, { multiline: true })}
        {renderAdminField('coverImage', copy.adminForm.coverImage, { required: true, placeholder: 'https://...' })}
        {renderAdminField('rating', copy.adminForm.rating, { required: true, type: 'number', placeholder: '9.5' })}
        {renderAdminField('categories', copy.adminForm.categories, { required: true, placeholder: 'ACTION, RPG' })}
        {renderAdminField('regionCode', copy.adminForm.regionCode, { placeholder: 'JP' })}
        {renderAdminField('releaseDate', copy.adminForm.releaseDate, {
          placeholder: copy.adminForm.releaseDatePlaceholder,
        })}
        {renderAdminField('cinematicTrailer', copy.adminForm.cinematicTrailer, { placeholder: 'https://...' })}
        {renderAdminField('downloadLink', copy.adminForm.downloadLink, { placeholder: 'https://...' })}
      </div>

      <p className="admin-game-helper">{copy.adminForm.helper}</p>
      {adminMessage ? <p className="admin-game-message">{adminMessage}</p> : null}
      {adminError ? <p className="admin-game-error">{adminError}</p> : null}

      <div className="admin-game-actions">
        <button type="submit" className="settings-link-btn admin-game-submit" disabled={adminSaving}>
          {adminSaving ? copy.adminForm.saving : copy.adminForm.submit}
        </button>
      </div>
    </form>
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
      case 'admin':
        return renderAdminSection();
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
          <div className={`profile-status-chip${isAdmin ? ' is-admin' : ''}`}>
            <span className="profile-status-chip-dot" />
            {copy.signedInAs} · {username}
            {isAdmin ? <strong>{copy.adminBadge}</strong> : null}
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
