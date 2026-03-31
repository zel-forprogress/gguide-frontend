import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import FavoriteButton from '../components/FavoriteButton';
import {
  addFavoriteApi,
  getFavoritesApi,
  getGamesApi,
  getRecentlyViewedApi,
  removeFavoriteApi,
  type Game,
} from '../services/api';
import { getRecentViewIdsLocally } from '../utils/recentViews';

import 'swiper/css';
import 'swiper/css/pagination';

type DashboardView = 'home' | 'recent' | 'favorites';

const formatReleaseDate = (releaseDate?: string) => {
  if (!releaseDate) {
    return '待公布';
  }

  const date = new Date(releaseDate);
  if (Number.isNaN(date.getTime())) {
    return '待公布';
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
  }).format(date);
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [favoriteGames, setFavoriteGames] = useState<Game[]>([]);
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [recentLoading, setRecentLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [activeView, setActiveView] = useState<DashboardView>('home');
  const [pendingFavoriteIds, setPendingFavoriteIds] = useState<string[]>([]);
  const isLoggedIn = Boolean(localStorage.getItem('token'));

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getGamesApi();
        if (res.code === 200) {
          setGames(res.data || []);
          return;
        }
        setError(res.message || '加载游戏列表失败');
      } catch (err: any) {
        setError(err.message || '加载游戏列表失败');
      } finally {
        setLoading(false);
      }
    };

    void fetchGames();
  }, []);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!isLoggedIn) {
        setFavoriteGames([]);
        return;
      }

      try {
        setFavoritesLoading(true);
        const res = await getFavoritesApi();
        if (res.code === 200) {
          setFavoriteGames(res.data || []);
        }
      } catch (err) {
        console.error('Failed to load favorites', err);
      } finally {
        setFavoritesLoading(false);
      }
    };

    void fetchFavorites();
  }, [isLoggedIn]);

  useEffect(() => {
    const fetchRecentlyViewed = async () => {
      if (isLoggedIn) {
        try {
          setRecentLoading(true);
          const res = await getRecentlyViewedApi();
          if (res.code === 200) {
            setRecentGames(res.data || []);
          }
        } catch (err) {
          console.error('Failed to load recently viewed games', err);
        } finally {
          setRecentLoading(false);
        }
        return;
      }

      if (games.length === 0) {
        setRecentGames([]);
        setRecentLoading(false);
        return;
      }

      const recentIds = getRecentViewIdsLocally();
      const gameMap = new Map(games.map((game) => [game.id, game]));
      const nextRecentGames = recentIds
        .map((gameId) => gameMap.get(gameId))
        .filter((game): game is Game => Boolean(game));

      setRecentGames(nextRecentGames);
      setRecentLoading(false);
    };

    void fetchRecentlyViewed();
  }, [games, isLoggedIn]);

  const favoriteIds = useMemo(
    () => favoriteGames.map((game) => game.id),
    [favoriteGames]
  );

  const todayRecommendations = useMemo(
    () =>
      [...games]
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        .slice(0, 5),
    [games]
  );

  const categories = useMemo(() => {
    const dynamicCategories = Array.from(
      new Set(games.map((game) => game.category).filter(Boolean))
    );
    return ['全部', ...dynamicCategories];
  }, [games]);

  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      const matchesCategory =
        selectedCategory === '全部' || game.category === selectedCategory;

      const keyword = searchTerm.trim().toLowerCase();
      if (!keyword) {
        return matchesCategory;
      }

      const searchableText = [game.title, game.description, game.category]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchesCategory && searchableText.includes(keyword);
    });
  }, [games, searchTerm, selectedCategory]);

  const filteredFavoriteGames = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) {
      return favoriteGames;
    }

    return favoriteGames.filter((game) =>
      [game.title, game.description, game.category]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(keyword)
    );
  }, [favoriteGames, searchTerm]);

  const filteredRecentGames = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) {
      return recentGames;
    }

    return recentGames.filter((game) =>
      [game.title, game.description, game.category]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(keyword)
    );
  }, [recentGames, searchTerm]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setFavoriteGames([]);
    setRecentGames([]);
    setActiveView('home');
    navigate('/', { replace: true });
  };

  const handleOpenGameDetail = (gameId: string) => {
    navigate(`/games/${gameId}`);
  };

  const handleOpenAuthPage = () => {
    navigate('/auth');
  };

  const handleFavoriteClick = async (
    game: Game,
    event?: MouseEvent<HTMLButtonElement>
  ) => {
    event?.stopPropagation();

    if (!isLoggedIn) {
      navigate('/auth');
      return;
    }

    if (pendingFavoriteIds.includes(game.id)) {
      return;
    }

    setPendingFavoriteIds((current) => [...current, game.id]);

    try {
      const alreadyFavorite = favoriteIds.includes(game.id);

      if (alreadyFavorite) {
        await removeFavoriteApi(game.id);
        setFavoriteGames((current) => current.filter((item) => item.id !== game.id));
      } else {
        await addFavoriteApi(game.id);
        setFavoriteGames((current) => {
          if (current.some((item) => item.id === game.id)) {
            return current;
          }
          return [game, ...current];
        });
      }
    } catch (err: any) {
      window.alert(err.message || '收藏操作失败');
    } finally {
      setPendingFavoriteIds((current) => current.filter((id) => id !== game.id));
    }
  };

  const renderGameGrid = (list: Game[]) => (
    <div className="game-grid">
      {list.map((game) => (
        <article
          key={game.id}
          className="game-card"
          onClick={() => handleOpenGameDetail(game.id)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              handleOpenGameDetail(game.id);
            }
          }}
          role="button"
          tabIndex={0}
        >
          <div className="game-image">
            {game.coverImage ? (
              <img src={game.coverImage} alt={game.title} className="game-cover-image" />
            ) : (
              <div className="game-cover-fallback">G-Guide</div>
            )}

            <div className="game-card-actions">
              <FavoriteButton
                compact
                active={favoriteIds.includes(game.id)}
                loading={pendingFavoriteIds.includes(game.id)}
                onClick={(event) => handleFavoriteClick(game, event)}
              />
            </div>
          </div>

          <div className="game-info">
            <div className="game-card-meta">
              <span className="game-category-tag">{game.category || '未分类'}</span>
              <span className="game-rating-tag">
                {typeof game.rating === 'number' ? game.rating.toFixed(1) : 'N/A'}
              </span>
            </div>
            <div className="game-name">{game.title}</div>
            <div className="game-desc">
              {game.description || '这款游戏暂时还没有补充简介。'}
            </div>
          </div>
        </article>
      ))}
    </div>
  );

  const renderLibrarySection = (
    title: string,
    subtitle: string,
    list: Game[],
    options?: {
      loading?: boolean;
      emptyTitle?: string;
      emptyDescription?: string;
      guestTitle?: string;
      guestDescription?: string;
      showGuestLogin?: boolean;
    }
  ) => {
    if (options?.loading) {
      return (
        <div className="state-panel">
          <div className="loader" style={{ margin: '0 auto', borderTopColor: '#1890ff' }}></div>
          <p style={{ marginTop: '16px', color: '#666' }}>正在加载内容...</p>
        </div>
      );
    }

    if (!isLoggedIn && options?.showGuestLogin) {
      return (
        <div className="favorites-empty">
          <h3>{options.guestTitle || '登录后可同步数据'}</h3>
          <p>{options.guestDescription || '登录后你可以在不同设备之间同步这些内容。'}</p>
          <button className="guest-banner-btn" onClick={handleOpenAuthPage}>
            去登录 / 注册
          </button>
        </div>
      );
    }

    if (list.length === 0) {
      return (
        <div className="favorites-empty">
          <h3>{options?.emptyTitle || '这里还是空的'}</h3>
          <p>{options?.emptyDescription || '回到首页继续逛一逛，很快这里就会有内容。'}</p>
          <button className="guest-banner-btn" onClick={() => setActiveView('home')}>
            返回首页继续逛
          </button>
        </div>
      );
    }

    return (
      <section className="favorites-section">
        <div className="favorites-head">
          <div>
            <span className="recommendation-kicker">MY LIBRARY</span>
            <h2 className="recommendation-title">{title}</h2>
          </div>
          <p className="recommendation-subtitle">{subtitle}</p>
        </div>
        {renderGameGrid(list)}
      </section>
    );
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
          </svg>
          G-Guide
        </div>

        <nav className="nav-menu">
          <div
            className={`nav-item${activeView === 'home' ? ' active' : ''}`}
            onClick={() => setActiveView('home')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            首页
          </div>

          <div
            className={`nav-item${activeView === 'recent' ? ' active' : ''}`}
            onClick={() => setActiveView('recent')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            最近查看
          </div>

          <div
            className={`nav-item${activeView === 'favorites' ? ' active' : ''}`}
            onClick={() => setActiveView('favorites')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            我的收藏
          </div>

          <div className="nav-item nav-item-muted">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            游戏广场
          </div>

          <div className="nav-item nav-item-muted">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
            AI 助手（敬请期待）
          </div>
        </nav>
      </aside>

      <main className="main-content">
        <header className="top-header">
          <div className="search-bar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder={
                activeView === 'favorites'
                  ? '搜索收藏的游戏'
                  : activeView === 'recent'
                    ? '搜索最近查看的游戏'
                    : '搜索游戏、分类或亮点'
              }
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          {isLoggedIn ? (
            <div className="user-profile">
              <div className="avatar-wrapper">
                <div className="avatar"></div>
                <div className="user-dropdown">
                  <div className="dropdown-item">个人设置</div>
                  <div className="dropdown-item" onClick={handleLogout}>
                    退出登录
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="guest-actions">
              <span className="guest-tip">游客模式</span>
              <button className="guest-login-btn" onClick={handleOpenAuthPage}>
                登录 / 注册
              </button>
            </div>
          )}
        </header>

        <section className="content-grid-section" style={{ marginTop: '40px' }}>
          {activeView === 'home' ? (
            <>
              <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '28px', marginBottom: '8px', textAlign: 'left' }}>
                  {isLoggedIn ? '欢迎回来，继续挑今晚要玩的游戏' : '先逛首页，想登录时再登录'}
                </h1>
                <p style={{ color: '#666', textAlign: 'left' }}>
                  {isLoggedIn
                    ? '今天的推荐、收藏和最近查看都已经准备好了，继续往下看看有没有新的心动选择。'
                    : '你现在可以直接以游客身份浏览游戏内容，想同步收藏或最近查看时再登录。'}
                </p>
              </div>

              {!isLoggedIn ? (
                <div className="guest-banner">
                  <div>
                    <strong>当前为游客浏览模式</strong>
                    <p>你可以先看列表和详情，登录后再同步收藏、最近查看等个人能力。</p>
                  </div>
                  <button className="guest-banner-btn" onClick={handleOpenAuthPage}>
                    去登录
                  </button>
                </div>
              ) : null}

              <div className="quick-start" style={{ justifyContent: 'flex-start', marginBottom: '32px' }}>
                <button className="quick-btn" onClick={isLoggedIn ? undefined : handleOpenAuthPage}>
                  <span style={{ color: '#1890ff' }}>{isLoggedIn ? '+' : '>'}</span>
                  {isLoggedIn ? '同步最近查看' : '登录后同步记录'}
                </button>
                <button className="quick-btn">今日推荐</button>
                <button className="quick-btn">高分优先</button>
                <button className="quick-btn">热门分类</button>
                <button className="quick-btn">游戏标签库</button>
              </div>

              {!loading && todayRecommendations.length > 0 ? (
                <section className="recommendation-section">
                  <div className="recommendation-head">
                    <div>
                      <span className="recommendation-kicker">TODAY PICKS</span>
                      <h2 className="recommendation-title">今日推荐</h2>
                    </div>
                    <p className="recommendation-subtitle">
                      先快速看一眼今天最值得点开的几款游戏，再决定要不要深入详情页。
                    </p>
                  </div>

                  <Swiper
                    modules={[Autoplay, Pagination]}
                    autoplay={{ delay: 4500, disableOnInteraction: false }}
                    pagination={{ clickable: true }}
                    spaceBetween={18}
                    slidesPerView={1}
                    className="recommendation-swiper"
                  >
                    {todayRecommendations.map((game) => (
                      <SwiperSlide key={game.id}>
                        <article
                          className="recommendation-slide"
                          onClick={() => handleOpenGameDetail(game.id)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              handleOpenGameDetail(game.id);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="recommendation-media">
                            {game.coverImage ? (
                              <img src={game.coverImage} alt={game.title} className="recommendation-image" />
                            ) : (
                              <div className="recommendation-image recommendation-image-fallback">G-Guide</div>
                            )}
                            <div className="recommendation-overlay"></div>
                          </div>

                          <div className="recommendation-content">
                            <div className="recommendation-badges">
                              <span className="recommendation-badge recommendation-badge-accent">
                                {game.rating ? `${game.rating.toFixed(1)} 分` : '精选推荐'}
                              </span>
                              <span className="recommendation-badge">{game.category || '未分类'}</span>
                              <span className="recommendation-badge">
                                {formatReleaseDate(game.releaseDate)}
                              </span>
                            </div>

                            <h3 className="recommendation-game-title">{game.title}</h3>
                            <p className="recommendation-desc">
                              {game.description || '这款游戏暂时还没有补充简介，但已经进入今日推荐名单。'}
                            </p>

                            <div className="recommendation-footer">
                              <span className="recommendation-hint">点击卡片查看完整详情</span>
                              <div className="recommendation-footer-actions">
                                <FavoriteButton
                                  compact
                                  active={favoriteIds.includes(game.id)}
                                  loading={pendingFavoriteIds.includes(game.id)}
                                  onClick={(event) => handleFavoriteClick(game, event)}
                                />
                                <span className="recommendation-link">查看详情</span>
                              </div>
                            </div>
                          </div>
                        </article>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </section>
              ) : null}

              <div className="tabs-container">
                {categories.map((category) => (
                  <div
                    key={category}
                    className={`tab${selectedCategory === category ? ' active' : ''}`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </div>
                ))}
              </div>

              {loading ? (
                <div className="state-panel">
                  <div className="loader" style={{ margin: '0 auto', borderTopColor: '#1890ff' }}></div>
                  <p style={{ marginTop: '16px', color: '#666' }}>正在加载游戏列表...</p>
                </div>
              ) : error ? (
                <div className="state-panel state-panel-error">
                  <p>{error}</p>
                  <button className="guest-banner-btn" onClick={() => window.location.reload()}>
                    重试
                  </button>
                </div>
              ) : filteredGames.length === 0 ? (
                <div className="state-panel">
                  <h3>没有找到匹配的游戏</h3>
                  <p>可以换个关键词，或者切回其他分类继续浏览。</p>
                </div>
              ) : (
                renderGameGrid(filteredGames)
              )}
            </>
          ) : null}

          {activeView === 'recent'
            ? renderLibrarySection(
                '最近查看',
                '你最近点进详情页的游戏都会记录在这里，方便随时接着看。',
                filteredRecentGames,
                {
                  loading: recentLoading,
                  emptyTitle: '你最近还没有查看过游戏',
                  emptyDescription: '点开任意游戏详情页，这里就会开始记录你的浏览轨迹。',
                }
              )
            : null}

          {activeView === 'favorites'
            ? renderLibrarySection(
                '我的收藏',
                '把想继续了解的游戏先收进这里，之后从详情页或首页都可以继续管理。',
                filteredFavoriteGames,
                {
                  loading: favoritesLoading,
                  emptyTitle:
                    favoriteGames.length === 0 ? '你还没有收藏游戏' : '没有找到匹配的收藏',
                  emptyDescription:
                    favoriteGames.length === 0
                      ? '回到首页点一下“收藏”，这里就会慢慢变成你的游戏清单。'
                      : '试试换个搜索词，或者回到首页继续挑选想保存的游戏。',
                  guestTitle: '登录后才能同步收藏',
                  guestDescription: '你现在已经可以浏览游戏，登录后再把喜欢的内容保存到个人收藏夹里。',
                  showGuestLogin: true,
                }
              )
            : null}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
