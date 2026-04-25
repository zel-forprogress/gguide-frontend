import { useEffect, useMemo, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import FavoriteButton from '../components/FavoriteButton';
import LanguageSwitcher from '../components/LanguageSwitcher';
import AiChatBox from '../components/AiChatBox';
import { useLocale } from '../i18n/LocaleProvider';
import {
  addFavoriteApi,
  getAiConversationsApi,
  getFavoritesApi,
  getGamesApi,
  getRecentlyViewedApi,
  removeFavoriteApi,
  type AiConversationSummary,
  type Game,
} from '../services/api';
import { clearStoredToken, hasStoredToken, subscribeAuthExpired } from '../utils/auth';
import { getRecentViewIdsLocally } from '../utils/recentViews';

import 'swiper/css';
import 'swiper/css/pagination';

type DashboardView = 'home' | 'recent' | 'favorites' | 'hub' | 'ai';
type RecommendationMode = 'favorite' | 'recent' | 'top';
type SearchSuggestion =
  | { type: 'game'; game: Game }
  | { type: 'conversation'; conversation: AiConversationSummary };
const ALL_CATEGORY = 'ALL';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { locale, t } = useLocale();
  const [games, setGames] = useState<Game[]>([]);
  const [favoriteGames, setFavoriteGames] = useState<Game[]>([]);
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [recentLoading, setRecentLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeView, setActiveView] = useState<DashboardView>('home');
  const [activeHubCategory, setActiveHubCategory] = useState<string>(ALL_CATEGORY);
  const [pendingFavoriteIds, setPendingFavoriteIds] = useState<string[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(() => hasStoredToken());
  const [aiConversations, setAiConversations] = useState<AiConversationSummary[]>([]);
  const [activeAiConversationId, setActiveAiConversationId] = useState<string | null>(null);
  const [aiHistoryLoading, setAiHistoryLoading] = useState(false);

  const formatReleaseDate = (releaseDate?: string) => {
    if (!releaseDate) {
      return t('comingSoon');
    }

    const date = new Date(releaseDate);
    if (Number.isNaN(date.getTime())) {
      return t('comingSoon');
    }

    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const getPrimaryCategory = (game: Game) =>
    game.categoryLabels?.[0] || game.categories?.[0] || t('uncategorized');

  useEffect(() => {
    const unsubscribe = subscribeAuthExpired(() => {
      setIsLoggedIn(false);
      setFavoriteGames([]);
      setRecentGames([]);
      setPendingFavoriteIds([]);
      setAiConversations([]);
      setActiveAiConversationId(null);
    });

    return unsubscribe;
  }, []);

  const loadAiConversations = async () => {
    if (!isLoggedIn) {
      setAiConversations([]);
      setActiveAiConversationId(null);
      return;
    }

    try {
      setAiHistoryLoading(true);
      const response = await getAiConversationsApi();
      if (response.code === 200) {
        setAiConversations(response.data || []);
      }
    } catch (err) {
      console.error('Failed to load AI chat history', err);
    } finally {
      setAiHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeView !== 'ai') {
      return;
    }

    void loadAiConversations();
  }, [activeView, isLoggedIn]);

  useEffect(() => {
    const requestedView = location.state?.view as DashboardView | undefined;
    if (requestedView && ['home', 'recent', 'favorites', 'hub', 'ai'].includes(requestedView)) {
      setActiveView(requestedView);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await getGamesApi(locale);

        if (response.code === 200) {
          setGames(response.data || []);
          return;
        }

        setError(response.message || t('loadingContent'));
      } catch (err: any) {
        setError(err.message || t('loadingContent'));
      } finally {
        setLoading(false);
      }
    };

    void fetchGames();
  }, [locale, t]);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!isLoggedIn) {
        setFavoriteGames([]);
        return;
      }

      try {
        setFavoritesLoading(true);
        const response = await getFavoritesApi(locale);
        if (response.code === 200) {
          setFavoriteGames(response.data || []);
        }
      } catch (err) {
        console.error('Failed to load favorites', err);
      } finally {
        setFavoritesLoading(false);
      }
    };

    void fetchFavorites();
  }, [isLoggedIn, locale]);

  useEffect(() => {
    const fetchRecentlyViewed = async () => {
      if (isLoggedIn) {
        try {
          setRecentLoading(true);
          const response = await getRecentlyViewedApi(locale);
          if (response.code === 200) {
            setRecentGames(response.data || []);
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
  }, [games, isLoggedIn, locale]);

  const favoriteIds = useMemo(() => favoriteGames.map((game) => game.id), [favoriteGames]);

  const sortedByRating = useMemo(
    () => [...games].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)),
    [games]
  );

  const todayRecommendations = useMemo(() => sortedByRating.slice(0, 5), [sortedByRating]);

  const searchKeyword = searchTerm.trim().toLowerCase();
  const searchDraftKeyword = searchDraft.trim().toLowerCase();

  const getGameTitleSearchableText = (game: Game) =>
    [
      game.title,
      ...Object.values(game.titleI18n || {}),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

  const getConversationTitleSearchableText = (conversation: AiConversationSummary) =>
    conversation.title?.toLowerCase() || '';

  const matchesKeyword = (game: Game) => {
    if (!searchKeyword) {
      return true;
    }

    return getGameTitleSearchableText(game).includes(searchKeyword);
  };

  const matchesConversationKeyword = (conversation: AiConversationSummary) => {
    if (!searchKeyword) {
      return true;
    }

    return getConversationTitleSearchableText(conversation).includes(searchKeyword);
  };

  const gameSearchSource = useMemo(() => {
    if (activeView === 'favorites') {
      return favoriteGames;
    }

    if (activeView === 'recent') {
      return recentGames;
    }

    if (activeView === 'ai') {
      return [];
    }

    return games;
  }, [activeView, favoriteGames, games, recentGames]);

  const searchSuggestions = useMemo<SearchSuggestion[]>(() => {
    if (!searchDraftKeyword) {
      return [];
    }

    if (activeView === 'ai') {
      return aiConversations
        .filter((conversation) =>
          getConversationTitleSearchableText(conversation).includes(searchDraftKeyword)
        )
        .slice(0, 6)
        .map((conversation) => ({ type: 'conversation', conversation }));
    }

    return gameSearchSource
      .filter((game) => getGameTitleSearchableText(game).includes(searchDraftKeyword))
      .slice(0, 6)
      .map((game) => ({ type: 'game', game }));
  }, [activeView, aiConversations, gameSearchSource, searchDraftKeyword]);

  const showSearchSuggestions =
    isSearchFocused && searchDraftKeyword.length > 0 && searchSuggestions.length > 0;

  useEffect(() => {
    setSearchTerm('');
    setSearchDraft('');
    setIsSearchFocused(false);
  }, [activeView]);

  const homeRecommendationMeta = useMemo(() => {
    if (isLoggedIn && favoriteGames.length > 0) {
      return {
        mode: 'favorite' as RecommendationMode,
        subtitle: t('forYouFavoriteSubtitle'),
        seeds: favoriteGames,
      };
    }

    if (recentGames.length > 0) {
      return {
        mode: 'recent' as RecommendationMode,
        subtitle: t('forYouRecentSubtitle'),
        seeds: recentGames,
      };
    }

    return {
      mode: 'top' as RecommendationMode,
      subtitle: t('forYouTopSubtitle'),
      seeds: [] as Game[],
    };
  }, [favoriteGames, isLoggedIn, recentGames, t]);

  const homeRecommendedGames = useMemo(() => {
    if (homeRecommendationMeta.mode === 'top') {
      return sortedByRating.slice(0, 6);
    }

    const seedIds = new Set(homeRecommendationMeta.seeds.map((game) => game.id));
    const preferredCategories = Array.from(
      new Set(homeRecommendationMeta.seeds.flatMap((game) => game.categories || []).filter(Boolean))
    );

    const prioritizedGames = sortedByRating.filter(
      (game) =>
        !seedIds.has(game.id) &&
        (game.categories || []).some((category) => preferredCategories.includes(category))
    );
    const fallbackGames = sortedByRating.filter((game) => !seedIds.has(game.id));
    const nextGames: Game[] = [];
    const addedIds = new Set<string>();

    [...prioritizedGames, ...fallbackGames].forEach((game) => {
      if (addedIds.has(game.id)) {
        return;
      }
      addedIds.add(game.id);
      nextGames.push(game);
    });

    return nextGames.slice(0, 6);
  }, [homeRecommendationMeta, sortedByRating]);

  const filteredHomeRecommendedGames = useMemo(() => {
    const source = searchKeyword ? games : homeRecommendedGames;
    return source.filter(matchesKeyword);
  }, [games, homeRecommendedGames, searchKeyword]);

  const filteredFavoriteGames = useMemo(
    () => favoriteGames.filter(matchesKeyword),
    [favoriteGames, searchKeyword]
  );

  const filteredRecentGames = useMemo(
    () => recentGames.filter(matchesKeyword),
    [recentGames, searchKeyword]
  );

  const hubCategories = useMemo(() => {
    const categoryMap = new Map<string, string>();

    games.forEach((game) => {
      (game.categories || []).forEach((code, index) => {
        if (!categoryMap.has(code)) {
          categoryMap.set(code, game.categoryLabels?.[index] || code);
        }
      });
    });

    return [
      { code: ALL_CATEGORY, label: t('allCategories') },
      ...Array.from(categoryMap.entries()).map(([code, label]) => ({ code, label })),
    ];
  }, [games, t]);

  useEffect(() => {
    if (!hubCategories.some((item) => item.code === activeHubCategory)) {
      setActiveHubCategory(ALL_CATEGORY);
    }
  }, [activeHubCategory, hubCategories]);

  const hubSourceGames = useMemo(() => {
    if (activeHubCategory === ALL_CATEGORY) {
      return games;
    }

    return games.filter((game) => (game.categories || []).includes(activeHubCategory));
  }, [activeHubCategory, games]);

  const hubFeaturedGames = useMemo(
    () => [...hubSourceGames].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 5),
    [hubSourceGames]
  );

  const hubNewestGames = useMemo(
    () =>
      [...hubSourceGames]
        .sort(
          (a, b) =>
            new Date(b.releaseDate || 0).getTime() - new Date(a.releaseDate || 0).getTime()
        )
        .slice(0, 4),
    [hubSourceGames]
  );

  const hubFilteredGames = useMemo(() => {
    const source = searchKeyword ? games : hubSourceGames;
    return source.filter(matchesKeyword);
  }, [games, hubSourceGames, searchKeyword]);

  const filteredAiConversations = useMemo(
    () => aiConversations.filter(matchesConversationKeyword),
    [aiConversations, searchKeyword]
  );

  const handleLogout = () => {
    clearStoredToken();
    setIsLoggedIn(false);
    setFavoriteGames([]);
    setRecentGames([]);
    setAiConversations([]);
    setActiveAiConversationId(null);
    setActiveView('home');
    navigate('/', { replace: true });
  };

  const handleOpenGameDetail = (gameId: string) => {
    navigate(`/games/${gameId}`);
  };

  const handleOpenAuthPage = () => {
    navigate('/auth');
  };

  const commitSearch = (keyword = searchDraft) => {
    setSearchTerm(keyword);
    setSearchDraft(keyword);
    setIsSearchFocused(false);
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      commitSearch();
    }
  };

  const handleSelectSearchSuggestion = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'conversation') {
      commitSearch(suggestion.conversation.title || t('aiUntitledChat'));
      setActiveAiConversationId(suggestion.conversation.id);
      return;
    }

    commitSearch(suggestion.game.title);
    handleOpenGameDetail(suggestion.game.id);
  };

  const handleFavoriteClick = async (game: Game, event?: MouseEvent<HTMLButtonElement>) => {
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
      window.alert(err.message || t('actionFailed'));
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
              <div className="game-cover-fallback">{t('appName')}</div>
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
              <span className="game-category-tag">{getPrimaryCategory(game)}</span>
              <span className="game-rating-tag">
                {typeof game.rating === 'number' ? game.rating.toFixed(1) : 'N/A'}
              </span>
            </div>
            <div className="game-name">{game.title}</div>
            <div className="game-desc">{game.description || t('noDescription')}</div>
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
          <p style={{ marginTop: '16px', color: '#666' }}>{t('loadingContent')}</p>
        </div>
      );
    }

    if (!isLoggedIn && options?.showGuestLogin) {
      return (
        <div className="favorites-empty">
          <h3>{options.guestTitle || t('loginToSyncHistoryTitle')}</h3>
          <p>{options.guestDescription || t('loginToSyncHistoryDesc')}</p>
          <button className="guest-banner-btn" onClick={handleOpenAuthPage}>
            {t('loginOrRegister')}
          </button>
        </div>
      );
    }

    if (list.length === 0) {
      return (
        <div className="favorites-empty">
          <h3>{options?.emptyTitle || t('emptyStateTitle')}</h3>
          <p>{options?.emptyDescription || t('guestIntro')}</p>
          <button className="guest-banner-btn" onClick={() => setActiveView('home')}>
            {t('continueBrowsing')}
          </button>
        </div>
      );
    }

    return (
      <section className="favorites-section">
        <div className="favorites-head">
          <div>
            <span className="recommendation-kicker">{t('myLibrary')}</span>
            <h2 className="recommendation-title">{title}</h2>
          </div>
          <p className="recommendation-subtitle">{subtitle}</p>
        </div>
        {renderGameGrid(list)}
      </section>
    );
  };

  const renderHubCardList = (title: string, gamesList: Game[]) => (
    <article className="hub-side-panel">
      <div className="hub-side-head">
        <h3>{title}</h3>
      </div>
      <div className="hub-mini-list">
        {gamesList.map((game, index) => (
          <button
            key={game.id}
            type="button"
            className="hub-mini-card"
            onClick={() => handleOpenGameDetail(game.id)}
          >
            <span className="hub-mini-rank">{index + 1}</span>
            <div className="hub-mini-copy">
              <strong>{game.title}</strong>
              <span>
                {getPrimaryCategory(game)} · {typeof game.rating === 'number' ? game.rating.toFixed(1) : 'N/A'}
              </span>
            </div>
          </button>
        ))}
      </div>
    </article>
  );

  const renderGameHubSection = () => {
    const featuredHubGame = hubFeaturedGames[0];

    if (loading) {
      return (
        <div className="state-panel">
          <div className="loader" style={{ margin: '0 auto', borderTopColor: '#1890ff' }}></div>
          <p style={{ marginTop: '16px', color: '#666' }}>{t('loadingContent')}</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="state-panel state-panel-error">
          <p>{error}</p>
          <button className="guest-banner-btn" onClick={() => window.location.reload()}>
            {t('retry')}
          </button>
        </div>
      );
    }

    return (
      <section className="hub-section">
        <div className="hub-head">
          <div>
            <span className="recommendation-kicker">{t('gameHub')}</span>
            <h2 className="recommendation-title">{t('gameHubTitle')}</h2>
          </div>
          <p className="recommendation-subtitle">{t('gameHubSubtitle')}</p>
        </div>

        <div className="hub-stats">
          <article className="hub-stat-card">
            <span>{t('hubStatGames')}</span>
            <strong>{games.length}</strong>
          </article>
          <article className="hub-stat-card">
            <span>{t('hubStatCategories')}</span>
            <strong>{hubCategories.length - 1}</strong>
          </article>
          <article className="hub-stat-card">
            <span>{t('hubStatHighRated')}</span>
            <strong>{hubFeaturedGames.length}</strong>
          </article>
        </div>

        <div className="hub-layout">
          {featuredHubGame ? (
            <article
              className="hub-featured-card"
              onClick={() => handleOpenGameDetail(featuredHubGame.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleOpenGameDetail(featuredHubGame.id);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div
                className="hub-featured-media"
                style={
                  featuredHubGame.coverImage
                    ? {
                        backgroundImage: `linear-gradient(135deg, rgba(16, 18, 29, 0.5), rgba(16, 18, 29, 0.2)), url(${featuredHubGame.coverImage})`,
                      }
                    : undefined
                }
              >
                {featuredHubGame.coverImage ? (
                  <img
                    src={featuredHubGame.coverImage}
                    alt={featuredHubGame.title}
                    className="hub-featured-image"
                  />
                ) : (
                  <div className="hub-featured-image hub-featured-fallback">{t('appName')}</div>
                )}
              </div>
              <div className="hub-featured-content">
                <div className="recommendation-badges">
                  <span className="recommendation-badge recommendation-badge-accent">
                    {typeof featuredHubGame.rating === 'number'
                      ? `${featuredHubGame.rating.toFixed(1)} / 10`
                      : t('selectedPick')}
                  </span>
                  <span className="recommendation-badge">{getPrimaryCategory(featuredHubGame)}</span>
                  <span className="recommendation-badge">
                    {formatReleaseDate(featuredHubGame.releaseDate)}
                  </span>
                </div>
                <h3 className="hub-featured-title">{featuredHubGame.title}</h3>
                <p className="hub-featured-desc">
                  {featuredHubGame.description || t('noDescription')}
                </p>
                <div className="hub-featured-actions">
                  <FavoriteButton
                    compact
                    active={favoriteIds.includes(featuredHubGame.id)}
                    loading={pendingFavoriteIds.includes(featuredHubGame.id)}
                    onClick={(event) => handleFavoriteClick(featuredHubGame, event)}
                  />
                  <span className="recommendation-link">{t('viewDetails')}</span>
                </div>
              </div>
            </article>
          ) : null}

          <div className="hub-sidebars">
            {renderHubCardList(t('hubTopRatedTitle'), hubFeaturedGames)}
            {renderHubCardList(t('hubLatestTitle'), hubNewestGames)}
          </div>
        </div>

        <div className="hub-filter-bar">
          <div className="hub-filter-head">
            <h3>{t('hubBrowseTitle')}</h3>
            <p>{t('hubBrowseSubtitle')}</p>
          </div>
          <div className="hub-category-chips">
            {hubCategories.map((category) => (
              <button
                key={category.code}
                type="button"
                className={`hub-category-chip${
                  activeHubCategory === category.code ? ' is-active' : ''
                }`}
                onClick={() => setActiveHubCategory(category.code)}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {hubFilteredGames.length === 0 ? (
          <div className="state-panel">
            <h3>{t('hubNoMatchesTitle')}</h3>
            <p>{t('hubNoMatchesDesc')}</p>
          </div>
        ) : (
          renderGameGrid(hubFilteredGames)
        )}
      </section>
    );
  };

  const handleAiConversationSaved = (conversation: AiConversationSummary) => {
    setActiveAiConversationId(conversation.id);
    setAiConversations((current) => {
      const next = current.filter((item) => item.id !== conversation.id);
      return [conversation, ...next];
    });
  };

  const handleStartNewAiChat = () => {
    setActiveAiConversationId(null);
  };

  const renderAiHistory = () => {
    if (activeView !== 'ai') {
      return null;
    }

    return (
      <div className="ai-history-panel">
        <div className="ai-history-header">
          <span>{t('aiHistoryTitle')}</span>
          <button type="button" onClick={handleStartNewAiChat}>
            {t('aiNewChat')}
          </button>
        </div>

        {!isLoggedIn ? (
          <p className="ai-history-empty">{t('aiHistoryLoginHint')}</p>
        ) : aiHistoryLoading ? (
          <p className="ai-history-empty">{t('aiHistoryLoading')}</p>
        ) : aiConversations.length === 0 ? (
          <p className="ai-history-empty">{t('aiHistoryEmpty')}</p>
        ) : filteredAiConversations.length === 0 ? (
          <p className="ai-history-empty">{t('emptyStateTitle')}</p>
        ) : (
          <div className="ai-history-list">
            {filteredAiConversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                className={`ai-history-item${
                  activeAiConversationId === conversation.id ? ' is-active' : ''
                }`}
                onClick={() => setActiveAiConversationId(conversation.id)}
              >
                <span>{conversation.title || t('aiUntitledChat')}</span>
                <small>
                  {conversation.messageCount} {t('aiHistoryMessageCount')}
                </small>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderAiAssistantSection = () => (
    <section className="ai-assistant-page">
      <div className="ai-assistant-shell">
        <AiChatBox
          layout="panel"
          conversationId={activeAiConversationId}
          onClose={() => setActiveView('home')}
          onConversationSaved={handleAiConversationSaved}
        />
      </div>
    </section>
  );

  const searchPlaceholder =
    activeView === 'favorites'
      ? t('searchFavoriteGames')
      : activeView === 'recent'
        ? t('searchRecentGames')
        : activeView === 'hub'
        ? t('searchGameHub')
        : activeView === 'ai'
          ? '搜索你想聊的主题'
          : t('searchRecommendedGames');

  return (
    <div className="app-container">
      <aside className={`sidebar${activeView === 'ai' ? ' has-ai-history' : ''}`}>
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
          {t('appName')}
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
            {t('home')}
          </div>

          <div
            className={`nav-item${activeView === 'recent' ? ' active' : ''}`}
            onClick={() => setActiveView('recent')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            {t('recentlyViewed')}
          </div>

          <div
            className={`nav-item${activeView === 'favorites' ? ' active' : ''}`}
            onClick={() => setActiveView('favorites')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            {t('favorites')}
          </div>

          <div
            className={`nav-item${activeView === 'hub' ? ' active' : ''}`}
            onClick={() => setActiveView('hub')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            {t('gameHub')}
          </div>

          <div
            className={`nav-item${activeView === 'ai' ? ' active' : ''}`}
            onClick={() => setActiveView('ai')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
            {t('aiAssistant')}
          </div>
        </nav>
        {renderAiHistory()}
      </aside>

      <main className="main-content">
        <header className="top-header">
          <div className="search-shell">
            <div className="search-bar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                onKeyDown={handleSearchKeyDown}
              />
            </div>

            {showSearchSuggestions ? (
              <div className="search-suggestions" role="listbox">
                {searchSuggestions.map((suggestion) => {
                  if (suggestion.type === 'conversation') {
                    const conversation = suggestion.conversation;
                    return (
                      <button
                        key={conversation.id}
                        type="button"
                        className="search-suggestion-item"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          handleSelectSearchSuggestion(suggestion);
                        }}
                      >
                        <span className="search-suggestion-thumb search-suggestion-thumb-fallback">
                          AI
                        </span>
                        <span className="search-suggestion-copy">
                          <strong>{conversation.title || t('aiUntitledChat')}</strong>
                          <small>
                            {conversation.preview ||
                              `${conversation.messageCount} ${t('aiHistoryMessageCount')}`}
                          </small>
                        </span>
                      </button>
                    );
                  }

                  const game = suggestion.game;
                  return (
                  <button
                    key={game.id}
                    type="button"
                    className="search-suggestion-item"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      handleSelectSearchSuggestion(suggestion);
                    }}
                  >
                    {game.coverImage ? (
                      <span
                        className="search-suggestion-thumb"
                        style={{ backgroundImage: `url(${game.coverImage})` }}
                      />
                    ) : (
                      <span className="search-suggestion-thumb search-suggestion-thumb-fallback">
                        {game.title.slice(0, 1)}
                      </span>
                    )}
                    <span className="search-suggestion-copy">
                      <strong>{game.title}</strong>
                      <small>
                        {getPrimaryCategory(game)}
                        {' · '}
                        {typeof game.rating === 'number' ? `${game.rating.toFixed(1)} / 10` : t('noRating')}
                      </small>
                    </span>
                  </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="top-header-actions">
            <LanguageSwitcher />

            {isLoggedIn ? (
              <div className="user-profile">
                <div className="avatar-wrapper">
                  <div className="avatar"></div>
                  <div className="user-dropdown">
                    <div className="dropdown-item" onClick={() => navigate('/profile')}>
                      {t('profileSettings')}
                    </div>
                    <div className="dropdown-item" onClick={handleLogout}>
                      {t('logout')}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="guest-actions">
                <span className="guest-tip">{t('guestMode')}</span>
                <button className="guest-login-btn" onClick={handleOpenAuthPage}>
                  {t('loginOrRegister')}
                </button>
              </div>
            )}
          </div>
        </header>

        <section className="content-grid-section dashboard-primary-section" style={{ marginTop: '40px' }}>
            {activeView === 'home' ? (
              <>
              {!loading && todayRecommendations.length > 0 ? (
                <section className="recommendation-section">
                  <div className="recommendation-head">
                    <div>
                      <span className="recommendation-kicker">{t('todayPicks')}</span>
                      <h2 className="recommendation-title">{t('todayRecommendationTitle')}</h2>
                    </div>
                    <p className="recommendation-subtitle">{t('todayRecommendationSubtitle')}</p>
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
                              <div className="recommendation-image recommendation-image-fallback">
                                {t('appName')}
                              </div>
                            )}
                            <div className="recommendation-overlay"></div>
                          </div>

                          <div className="recommendation-content">
                            <div className="recommendation-badges">
                              <span className="recommendation-badge recommendation-badge-accent">
                                {typeof game.rating === 'number'
                                  ? `${game.rating.toFixed(1)} / 10`
                                  : t('selectedPick')}
                              </span>
                              <span className="recommendation-badge">{getPrimaryCategory(game)}</span>
                              <span className="recommendation-badge">
                                {formatReleaseDate(game.releaseDate)}
                              </span>
                            </div>

                            <h3 className="recommendation-game-title">{game.title}</h3>
                            <p className="recommendation-desc">{game.description || t('noDescription')}</p>

                            <div className="recommendation-footer">
                              <span className="recommendation-hint">{t('clickCardForDetails')}</span>
                              <div className="recommendation-footer-actions">
                                <FavoriteButton
                                  compact
                                  active={favoriteIds.includes(game.id)}
                                  loading={pendingFavoriteIds.includes(game.id)}
                                  onClick={(event) => handleFavoriteClick(game, event)}
                                />
                                <span className="recommendation-link">{t('viewDetails')}</span>
                              </div>
                            </div>
                          </div>
                        </article>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </section>
              ) : null}

              <section className="favorites-section">
                <div className="favorites-head">
                  <div>
                    <span className="recommendation-kicker">{t('forYou')}</span>
                    <h2 className="recommendation-title">{t('forYouTitle')}</h2>
                  </div>
                  <p className="recommendation-subtitle">{homeRecommendationMeta.subtitle}</p>
                </div>

                {loading ? (
                  <div className="state-panel">
                    <div className="loader" style={{ margin: '0 auto', borderTopColor: '#1890ff' }}></div>
                    <p style={{ marginTop: '16px', color: '#666' }}>{t('preparingRecommendations')}</p>
                  </div>
                ) : error ? (
                  <div className="state-panel state-panel-error">
                    <p>{error}</p>
                    <button className="guest-banner-btn" onClick={() => window.location.reload()}>
                      {t('retry')}
                    </button>
                  </div>
                ) : filteredHomeRecommendedGames.length === 0 ? (
                  <div className="state-panel">
                    <h3>{t('noRecommendationMatchesTitle')}</h3>
                    <p>{t('noRecommendationMatchesDesc')}</p>
                  </div>
                ) : (
                  renderGameGrid(filteredHomeRecommendedGames)
                )}
              </section>
              </>
            ) : null}

            {activeView === 'recent'
              ? renderLibrarySection(
                  t('recentlyViewed'),
                  t('recentlyViewedSubtitle'),
                  filteredRecentGames,
                  {
                    loading: recentLoading,
                    emptyTitle: t('recentlyViewedEmptyTitle'),
                    emptyDescription: t('recentlyViewedEmptyDesc'),
                  }
                )
              : null}

            {activeView === 'hub' ? renderGameHubSection() : null}

            {activeView === 'favorites'
              ? renderLibrarySection(
                  t('favorites'),
                  t('favoritesSubtitle'),
                  filteredFavoriteGames,
                  {
                    loading: favoritesLoading,
                    emptyTitle:
                      favoriteGames.length === 0 ? t('favoritesEmptyTitle') : t('favoritesNoMatchTitle'),
                    emptyDescription:
                      favoriteGames.length === 0 ? t('favoritesEmptyDesc') : t('favoritesNoMatchDesc'),
                    guestTitle: t('loginToSyncFavoritesTitle'),
                    guestDescription: t('loginToSyncFavoritesDesc'),
                    showGuestLogin: true,
                  }
                )
              : null}

            {activeView === 'ai' ? renderAiAssistantSection() : null}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
