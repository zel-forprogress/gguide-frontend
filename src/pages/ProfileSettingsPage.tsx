import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '../i18n/LocaleProvider';
import {
  createGameApi,
  getCurrentUserApi,
  getGamesApi,
  updateGameApi,
  updateAvatarApi,
  type CreateGamePayload,
  type CurrentUser,
  type Game,
} from '../services/api';
import { clearStoredToken, subscribeAuthExpired } from '../utils/auth';

type ProfileSection = 'general' | 'account' | 'language' | 'library' | 'session' | 'admin';
type AdminGameMode = 'create' | 'edit';

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

const toDateInputValue = (value?: string) => (value ? value.slice(0, 10) : '');

const gameToAdminForm = (game: Game): AdminGameForm => ({
  titleZh: game.titleI18n?.['zh-CN'] || game.title || '',
  titleEn: game.titleI18n?.['en-US'] || game.title || '',
  descriptionZh: game.descriptionI18n?.['zh-CN'] || game.description || '',
  descriptionEn: game.descriptionI18n?.['en-US'] || game.description || '',
  coverImage: game.coverImage || '',
  rating: game.rating === null || game.rating === undefined ? '' : String(game.rating),
  categories: (game.categories || []).join(', ') || 'ACTION',
  regionCode: game.regionCode || 'UNKNOWN',
  releaseDate: toDateInputValue(game.releaseDate),
  cinematicTrailer: game.cinematicTrailer || '',
  downloadLink: game.downloadLink || '',
});

const normalizeTitle = (value: string) => value.trim().toLocaleLowerCase();

const normalizeSearchTitle = (value: string) =>
  normalizeTitle(value).replace(/[\s·.。,:：;；'"“”‘’!?！？()[\]{}（）《》<>【】\-_/\\|]+/g, '');

const hasCjkText = (value: string) => /[\u3400-\u9fff]/.test(value);

const canUseAliasMatch = (value: string) => {
  const compactValue = normalizeSearchTitle(value);
  return hasCjkText(compactValue) ? compactValue.length >= 2 : compactValue.length >= 4;
};

const getGameTitleCandidates = (game: Game) => {
  const candidates = [game.title];

  if (game.titleI18n) {
    candidates.push(...Object.values(game.titleI18n));
  }

  return candidates.map(normalizeTitle).filter(Boolean);
};

const findExistingGameByTitle = (games: Game[], titleZh: string, titleEn: string) => {
  const queries = [titleZh, titleEn].map(normalizeTitle).filter(Boolean);
  const searchQueries = [titleZh, titleEn].map(normalizeSearchTitle).filter(canUseAliasMatch);
  if (queries.length === 0) {
    return null;
  }

  return games.find((game) => {
    const titles = getGameTitleCandidates(game);
    const searchTitles = titles.map(normalizeSearchTitle).filter(Boolean);

    return queries.some((query) => titles.includes(query))
      || searchQueries.some((query) => searchTitles.some((title) => title.includes(query) || query.includes(title)));
  }) || null;
};

const ProfileSettingsPage = () => {
  const navigate = useNavigate();
  const { locale, setLocale, t } = useLocale();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState<ProfileSection>('account');
  const [adminGameForm, setAdminGameForm] = useState<AdminGameForm>(emptyAdminGameForm);
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');
  const [adminError, setAdminError] = useState('');
  const [gameLibrary, setGameLibrary] = useState<Game[] | null>(null);
  const [duplicateGame, setDuplicateGame] = useState<Game | null>(null);
  const [adminGameMode, setAdminGameMode] = useState<AdminGameMode>('create');
  const [editingGameId, setEditingGameId] = useState('');
  const [editingGameQuery, setEditingGameQuery] = useState('');
  const [gameLibraryLoading, setGameLibraryLoading] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState('');
  const [avatarError, setAvatarError] = useState('');

  const token = localStorage.getItem('token');
  const tokenUsername = useMemo(() => decodeUsernameFromToken(token), [token]);
  const username = currentUser?.username || tokenUsername || 'User';
  const isAdmin = Boolean(currentUser?.admin);
  const avatarUrl = currentUser?.avatarUrl || '';

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
              avatar: { label: '头像', desc: '上传一张图片作为你的个人头像' },
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
            uploadAvatar: '上传头像',
            uploadingAvatar: '上传中...',
            avatarUpdated: '头像已更新。',
            avatarInvalid: '请选择图片文件。',
            avatarTooLarge: '图片不能超过 1MB。',
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
              modeCreate: '添加游戏',
              modeEdit: '编辑已有',
              selectGame: '选择要编辑的游戏',
              selectGamePlaceholder: '请选择游戏',
              submit: '添加游戏',
              update: '保存修改',
              saving: '正在添加...',
              updating: '正在保存...',
              success: '游戏已添加到游戏库。',
              updateSuccess: '游戏信息已更新。',
              duplicateExists: '“{title}” 已存在于游戏库中，建议直接使用已有条目，无需继续填写新增表单。',
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
              avatar: { label: 'Avatar', desc: 'Upload an image as your profile avatar' },
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
            uploadAvatar: 'Upload avatar',
            uploadingAvatar: 'Uploading...',
            avatarUpdated: 'Avatar updated.',
            avatarInvalid: 'Choose an image file.',
            avatarTooLarge: 'Image must be under 1 MB.',
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
              modeCreate: 'Add game',
              modeEdit: 'Edit existing',
              selectGame: 'Select a game to edit',
              selectGamePlaceholder: 'Select a game',
              submit: 'Add game',
              update: 'Save changes',
              saving: 'Adding...',
              updating: 'Saving...',
              success: 'Game added to the library.',
              updateSuccess: 'Game details updated.',
              duplicateExists: '"{title}" already exists in the game library. Use the existing entry instead of filling out a new one.',
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
        setError('');

        const userResponse = await getCurrentUserApi();

        if (cancelled) {
          return;
        }

        if (userResponse.code === 200) {
          setCurrentUser(userResponse.data);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || t('loadingContent'));
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
      setActiveSection('account');
    }
  }, [activeSection, currentUser]);

  const sortedGameLibrary = useMemo(
    () => [...(gameLibrary || [])].sort((left, right) => left.title.localeCompare(right.title, locale)),
    [gameLibrary, locale]
  );

  const handleLogout = () => {
    clearStoredToken();
    navigate('/auth', { replace: true });
  };

  const handleAvatarUpload = async (file: File | undefined) => {
    setAvatarMessage('');
    setAvatarError('');

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setAvatarError(copy.avatarInvalid);
      return;
    }

    if (file.size > 1024 * 1024) {
      setAvatarError(copy.avatarTooLarge);
      return;
    }

    try {
      setAvatarSaving(true);
      const avatarDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      const response = await updateAvatarApi(avatarDataUrl);
      if (response.code !== 200) {
        throw new Error(response.message);
      }
      setCurrentUser(response.data);
      setAvatarMessage(copy.avatarUpdated);
    } catch (err: any) {
      setAvatarError(err.message || copy.avatarInvalid);
    } finally {
      setAvatarSaving(false);
    }
  };

  const ensureGameLibrary = async () => {
    if (gameLibrary) {
      return gameLibrary;
    }

    setGameLibraryLoading(true);
    try {
      const response = await getGamesApi(locale);
      const games = response.code === 200 ? response.data || [] : [];
      setGameLibrary(games);
      return games;
    } finally {
      setGameLibraryLoading(false);
    }
  };

  const handleAdminModeChange = async (mode: AdminGameMode) => {
    setAdminGameMode(mode);
    setAdminMessage('');
    setAdminError('');
    setDuplicateGame(null);

    if (mode === 'create') {
      setEditingGameId('');
      setEditingGameQuery('');
      setAdminGameForm(emptyAdminGameForm);
      return;
    }

    const games = await ensureGameLibrary();
    const firstGame = games[0];
    if (firstGame) {
      setEditingGameId(firstGame.id);
      setEditingGameQuery(firstGame.title);
      setAdminGameForm(gameToAdminForm(firstGame));
    }
  };

  const handleEditingGameQueryChange = (value: string) => {
    setEditingGameQuery(value);
    setAdminMessage('');
    setAdminError('');
    setDuplicateGame(null);

    const query = normalizeTitle(value);
    const selectedGame = gameLibrary?.find((game) => getGameTitleCandidates(game).includes(query));

    if (selectedGame) {
      setEditingGameId(selectedGame.id);
      setAdminGameForm(gameToAdminForm(selectedGame));
      return;
    }

    setEditingGameId('');
  };

  const handleAdminFieldChange = (field: keyof AdminGameForm, value: string) => {
    setAdminGameForm((current) => ({ ...current, [field]: value }));
    setAdminMessage('');
    setAdminError('');

    if (adminGameMode === 'create' && (field === 'titleZh' || field === 'titleEn')) {
      setDuplicateGame(null);
    }
  };

  const handleAdminTitleBlur = async () => {
    if (adminGameMode !== 'create') {
      return;
    }

    const titleZh = adminGameForm.titleZh.trim();
    const titleEn = adminGameForm.titleEn.trim();

    if (!titleZh && !titleEn) {
      setDuplicateGame(null);
      return;
    }

    try {
      const games = await ensureGameLibrary();
      setDuplicateGame(findExistingGameByTitle(games, titleZh, titleEn));
    } catch {
      setDuplicateGame(null);
    }
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

      const response = adminGameMode === 'edit' && editingGameId
        ? await updateGameApi(editingGameId, payload, locale)
        : await createGameApi(payload, locale);
      if (response.code !== 200) {
        throw new Error(response.message);
      }

      if (adminGameMode === 'edit') {
        setGameLibrary((current) => current
          ? current.map((game) => (game.id === response.data.id ? response.data : game))
          : current);
        setAdminGameForm(gameToAdminForm(response.data));
      } else {
        setAdminGameForm(emptyAdminGameForm);
        setGameLibrary((current) => (current ? [...current, response.data] : current));
      }

      setDuplicateGame(null);
      setAdminMessage(adminGameMode === 'edit' ? copy.adminForm.updateSuccess : copy.adminForm.success);
    } catch (err: any) {
      setAdminError(err.message || (adminGameMode === 'edit' ? 'Failed to update game' : 'Failed to create game'));
    } finally {
      setAdminSaving(false);
    }
  };

  const sectionEntries: Array<{ key: ProfileSection; title: string }> = [
    { key: 'account', title: copy.sections.account.title },
    ...(isAdmin ? [{ key: 'admin' as ProfileSection, title: copy.sections.admin.title }] : []),
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
        {value !== null && value !== undefined && value !== '' ? (
          <div className="settings-row-value">{value}</div>
        ) : null}
        {action ? <div className="settings-row-action">{action}</div> : null}
      </div>
    </div>
  );

  const renderAvatarPreview = (sizeClass = '') => (
    avatarUrl ? (
      <img className={`profile-avatar-image ${sizeClass}`} src={avatarUrl} alt={username} />
    ) : (
      <span className={`profile-avatar-fallback ${sizeClass}`}>{username.slice(0, 1).toUpperCase()}</span>
    )
  );

  const renderAvatarControl = () => (
    <div className="profile-avatar-control">
      {renderAvatarPreview('is-large')}
      <div className="profile-avatar-actions">
        <label className={`settings-link-btn profile-avatar-upload${avatarSaving ? ' is-disabled' : ''}`}>
          {avatarSaving ? copy.uploadingAvatar : copy.uploadAvatar}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            disabled={avatarSaving}
            onChange={(event) => {
              void handleAvatarUpload(event.target.files?.[0]);
              event.currentTarget.value = '';
            }}
          />
        </label>
        {avatarMessage ? <span className="profile-avatar-message">{avatarMessage}</span> : null}
        {avatarError ? <span className="profile-avatar-error">{avatarError}</span> : null}
      </div>
    </div>
  );

  const renderAccountSection = () => (
    <div className="settings-card">
      {renderSettingRow(copy.rows.avatar.label, copy.rows.avatar.desc, null, renderAvatarControl())}
      {renderSettingRow(copy.rows.username.label, copy.rows.username.desc, username)}
      {renderSettingRow(copy.rows.role.label, copy.rows.role.desc, isAdmin ? copy.adminBadge : copy.regularUser)}
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

  const renderAdminField = (
    field: keyof AdminGameForm,
    label: string,
    options?: { required?: boolean; type?: string; multiline?: boolean; placeholder?: string; className?: string; onBlur?: () => void }
  ) => (
    <label className={`admin-game-field${options?.multiline ? ' is-wide' : ''}${options?.className ? ` ${options.className}` : ''}`}>
      <span>{label}</span>
      {options?.multiline ? (
        <textarea
          value={adminGameForm[field]}
          required={options.required}
          placeholder={options.placeholder}
          onBlur={options.onBlur}
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
          onBlur={options?.onBlur}
          onChange={(event) => handleAdminFieldChange(field, event.target.value)}
        />
      )}
    </label>
  );

  const renderAdminSection = () => (
    <form className="settings-card admin-game-card" onSubmit={handleCreateGame}>
      <div className="admin-game-card-head">
        <div>
          <span className="admin-game-kicker">{copy.adminBadge}</span>
          <h2>{copy.sections.admin.title}</h2>
          <p>{copy.sections.admin.description}</p>
        </div>
        <div className="admin-game-head-actions">
          <div className="admin-game-mode-switch">
            <button
              type="button"
              className={`admin-game-mode-btn${adminGameMode === 'create' ? ' is-active' : ''}`}
              onClick={() => void handleAdminModeChange('create')}
            >
              {copy.adminForm.modeCreate}
            </button>
            <button
              type="button"
              className={`admin-game-mode-btn${adminGameMode === 'edit' ? ' is-active' : ''}`}
              onClick={() => void handleAdminModeChange('edit')}
            >
              {copy.adminForm.modeEdit}
            </button>
          </div>
          <button type="submit" className="settings-link-btn admin-game-submit" disabled={adminSaving || (adminGameMode === 'edit' && !editingGameId)}>
            {adminSaving
              ? (adminGameMode === 'edit' ? copy.adminForm.updating : copy.adminForm.saving)
              : (adminGameMode === 'edit' ? copy.adminForm.update : copy.adminForm.submit)}
          </button>
        </div>
      </div>

      <div className="admin-game-workspace">
        <aside className="admin-game-preview-pane">
          <div className="admin-game-cover-preview">
            {adminGameForm.coverImage.trim() ? (
              <img src={adminGameForm.coverImage.trim()} alt={adminGameForm.titleZh || adminGameForm.titleEn || copy.adminForm.coverImage} />
            ) : (
              <span>{copy.adminForm.coverImage}</span>
            )}
          </div>
          <div className="admin-game-preview-copy">
            <strong>{adminGameForm.titleZh.trim() || adminGameForm.titleEn.trim() || copy.adminForm.titleZh}</strong>
            <span>{adminGameForm.categories.trim() || copy.adminForm.categories}</span>
          </div>
          <div className="admin-game-preview-meta">
            <span>{adminGameForm.rating.trim() || copy.adminForm.rating}</span>
            <span>{adminGameForm.regionCode.trim() || copy.adminForm.regionCode}</span>
          </div>
        </aside>

        <div className="admin-game-fields">
          {adminGameMode === 'edit' ? (
            <label className="admin-game-edit-picker">
              <span>{copy.adminForm.selectGame}</span>
              <input
                list="admin-game-edit-options"
                value={editingGameQuery}
                disabled={gameLibraryLoading}
                placeholder={gameLibraryLoading ? '...' : copy.adminForm.selectGamePlaceholder}
                onChange={(event) => handleEditingGameQueryChange(event.target.value)}
              />
              <datalist id="admin-game-edit-options">
                {sortedGameLibrary.map((game) => (
                  <option key={game.id} value={game.title} />
                ))}
              </datalist>
            </label>
          ) : null}

          <div className="admin-game-form-grid">
            {renderAdminField('titleZh', copy.adminForm.titleZh, {
              required: true,
              placeholder: '塞尔达传说',
              onBlur: handleAdminTitleBlur,
            })}
            {renderAdminField('titleEn', copy.adminForm.titleEn, {
              placeholder: 'The Legend of Zelda',
              onBlur: handleAdminTitleBlur,
            })}
            {duplicateGame ? (
              <div className="admin-game-duplicate-note">
                {copy.adminForm.duplicateExists.replace('{title}', duplicateGame.title)}
              </div>
            ) : null}
            {renderAdminField('descriptionZh', copy.adminForm.descriptionZh, { required: true, multiline: true })}
            {renderAdminField('descriptionEn', copy.adminForm.descriptionEn, { multiline: true })}
          </div>

          <div className="admin-game-form-grid is-compact">
            {renderAdminField('coverImage', copy.adminForm.coverImage, { required: true, placeholder: 'https://...', className: 'is-wide' })}
            {renderAdminField('rating', copy.adminForm.rating, { required: true, type: 'number', placeholder: '9.5' })}
            {renderAdminField('categories', copy.adminForm.categories, { required: true, placeholder: 'ACTION, RPG' })}
            {renderAdminField('regionCode', copy.adminForm.regionCode, { placeholder: 'JP' })}
            {renderAdminField('releaseDate', copy.adminForm.releaseDate, {
              placeholder: copy.adminForm.releaseDatePlaceholder,
            })}
            {renderAdminField('cinematicTrailer', copy.adminForm.cinematicTrailer, { placeholder: 'https://...' })}
            {renderAdminField('downloadLink', copy.adminForm.downloadLink, { placeholder: 'https://...' })}
          </div>
        </div>
      </div>

      <p className="admin-game-helper">{copy.adminForm.helper}</p>
      {adminMessage ? <p className="admin-game-message">{adminMessage}</p> : null}
      {adminError ? <p className="admin-game-error">{adminError}</p> : null}
    </form>
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
      case 'admin':
        return renderAdminSection();
      default:
        return renderAccountSection();
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
            {renderAvatarPreview('is-chip')}
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
