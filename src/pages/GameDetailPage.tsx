import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import FavoriteButton from '../components/FavoriteButton';
import { useLocale } from '../i18n/LocaleProvider';
import {
  addFavoriteApi,
  createGameCommentApi,
  deleteGameCommentApi,
  getCurrentUserApi,
  getGameCommentsApi,
  getFavoriteStatusApi,
  getGameDetailApi,
  recordRecentViewApi,
  removeFavoriteApi,
  updateGameCommentApi,
  type CurrentUser,
  type GameComment,
  type Game,
} from '../services/api';
import { hasStoredToken, subscribeAuthExpired } from '../utils/auth';
import { saveRecentViewLocally } from '../utils/recentViews';

const GameDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { locale, t } = useLocale();
  const [isLoggedIn, setIsLoggedIn] = useState(() => hasStoredToken());
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState('');
  const [sessionNotice, setSessionNotice] = useState('');
  const [comments, setComments] = useState<GameComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState('');
  const [commentValue, setCommentValue] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentActionError, setCommentActionError] = useState('');
  const [commentsRefreshToken, setCommentsRefreshToken] = useState(0);
  const [editingCommentId, setEditingCommentId] = useState('');
  const [editingCommentValue, setEditingCommentValue] = useState('');
  const [managingCommentId, setManagingCommentId] = useState('');
  const [commentManageError, setCommentManageError] = useState('');

  const formatReleaseDate = (releaseDate?: string) => {
    if (!releaseDate) {
      return t('comingSoon');
    }

    const date = new Date(releaseDate);
    if (Number.isNaN(date.getTime())) {
      return t('comingSoon');
    }

    return new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(date);
  };

  const formatRating = (rating?: number) => {
    if (typeof rating !== 'number' || Number.isNaN(rating)) {
      return t('noRating');
    }
    return `${rating.toFixed(1)} / 10`;
  };

  const getCategoryText = (item?: Game | null) =>
    item?.categoryLabels && item.categoryLabels.length > 0
      ? item.categoryLabels.join(' / ')
      : t('uncategorized');

  const getRegionText = (item?: Game | null) => item?.regionLabel || 'Unknown';

  const formatCommentTime = (value?: string) => {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  };

  const renderCommentAvatar = (comment: GameComment) => {
    if (comment.avatarUrl) {
      return <img className="detail-comment-avatar" src={comment.avatarUrl} alt={comment.username} />;
    }

    return (
      <span className="detail-comment-avatar detail-comment-avatar-fallback">
        {comment.username.slice(0, 1).toUpperCase()}
      </span>
    );
  };

  const canManageComment = (comment: GameComment) =>
    Boolean(currentUser && (currentUser.admin || currentUser.username === comment.username));

  useEffect(() => {
    const unsubscribe = subscribeAuthExpired(() => {
      setIsLoggedIn(false);
      setCurrentUser(null);
      setIsFavorite(false);
      setFavoriteLoading(false);
      setSessionNotice(t('sessionExpiredMessage'));
    });

    return unsubscribe;
  }, [t]);

  useEffect(() => {
    let cancelled = false;

    const loadCurrentUser = async () => {
      if (!isLoggedIn) {
        setCurrentUser(null);
        return;
      }

      try {
        const response = await getCurrentUserApi();
        if (!cancelled && response.code === 200 && response.data) {
          setCurrentUser(response.data);
        }
      } catch (err: any) {
        if (!cancelled) {
          setCurrentUser(null);
          if (err?.status === 401) {
            setIsLoggedIn(false);
            setSessionNotice(t('sessionExpiredMessage'));
          }
        }
      }
    };

    void loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, t]);

  useEffect(() => {
    let cancelled = false;

    const fetchGameDetail = async () => {
      if (!id) {
        setError(t('invalidGameId'));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const gameResponse = await getGameDetailApi(id, locale);

        if (cancelled) {
          return;
        }

        if (gameResponse.code === 200 && gameResponse.data) {
          setGame(gameResponse.data);
        } else {
          setError(gameResponse.message || t('gameUnavailable'));
        }

        if (!isLoggedIn) {
          setIsFavorite(false);
          return;
        }

        try {
          const favoriteResponse = await getFavoriteStatusApi(id);
          if (!cancelled && favoriteResponse.code === 200) {
            setIsFavorite(Boolean(favoriteResponse.data));
          }
        } catch (favoriteError: any) {
          if (!cancelled) {
            setIsFavorite(false);
            if (favoriteError?.status === 401) {
              setIsLoggedIn(false);
              setSessionNotice(t('sessionExpiredMessage'));
            } else {
              console.error('Failed to load favorite status', favoriteError);
            }
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || t('gameUnavailable'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchGameDetail();

    return () => {
      cancelled = true;
    };
  }, [id, isLoggedIn, locale, t]);

  useEffect(() => {
    if (!game?.id) {
      return;
    }

    if (isLoggedIn) {
      void recordRecentViewApi(game.id).catch((err) => {
        console.error('Failed to record recent view', err);
      });
      return;
    }

    saveRecentViewLocally(game.id);
  }, [game?.id, isLoggedIn]);

  useEffect(() => {
    if (!game?.id) {
      return;
    }

    let cancelled = false;

    const loadComments = async () => {
      try {
        setCommentsLoading(true);
        setCommentsError('');
        const response = await getGameCommentsApi(game.id);

        if (cancelled) {
          return;
        }

        if (response.code === 200) {
          setComments(response.data || []);
        } else {
          setCommentsError(response.message || t('commentLoadFailed'));
        }
      } catch (err: any) {
        if (!cancelled) {
          setCommentsError(err.message || t('commentLoadFailed'));
        }
      } finally {
        if (!cancelled) {
          setCommentsLoading(false);
        }
      }
    };

    void loadComments();

    return () => {
      cancelled = true;
    };
  }, [game?.id, commentsRefreshToken, t]);

  const handleBackToDashboard = () => {
    navigate('/');
  };

  const handleToggleFavorite = async () => {
    if (!game) {
      return;
    }

    if (!isLoggedIn) {
      navigate('/auth');
      return;
    }

    try {
      setFavoriteLoading(true);
      if (isFavorite) {
        await removeFavoriteApi(game.id);
        setIsFavorite(false);
      } else {
        await addFavoriteApi(game.id);
        setIsFavorite(true);
      }
    } catch (err: any) {
      window.alert(err.message || t('actionFailed'));
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!game) {
      return;
    }

    if (!isLoggedIn) {
      navigate('/auth');
      return;
    }

    const content = commentValue.trim();
    if (!content) {
      setCommentActionError(t('commentEmpty'));
      return;
    }

    try {
      setCommentSubmitting(true);
      setCommentActionError('');
      const response = await createGameCommentApi(game.id, { content });

      if (response.code !== 200) {
        throw new Error(response.message);
      }

      setComments((current) => [...current, response.data]);
      setCommentValue('');
    } catch (err: any) {
      if (err?.status === 401) {
        setIsLoggedIn(false);
        navigate('/auth');
        return;
      }

      setCommentActionError(err.message || t('commentSubmitFailed'));
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleStartEditComment = (comment: GameComment) => {
    setEditingCommentId(comment.id);
    setEditingCommentValue(comment.content);
    setCommentManageError('');
  };

  const handleCancelEditComment = () => {
    setEditingCommentId('');
    setEditingCommentValue('');
    setCommentManageError('');
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!game) {
      return;
    }

    const content = editingCommentValue.trim();
    if (!content) {
      setCommentManageError(t('commentEmpty'));
      return;
    }

    try {
      setManagingCommentId(commentId);
      setCommentManageError('');
      const response = await updateGameCommentApi(game.id, commentId, { content });
      if (response.code !== 200 || !response.data) {
        throw new Error(response.message);
      }

      setComments((current) => current.map((comment) => (
        comment.id === commentId ? response.data : comment
      )));
      setEditingCommentId('');
      setEditingCommentValue('');
    } catch (err: any) {
      if (err?.status === 401) {
        setIsLoggedIn(false);
        navigate('/auth');
        return;
      }

      setCommentManageError(err.message || t('commentUpdateFailed'));
    } finally {
      setManagingCommentId('');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!game || !window.confirm(t('commentDeleteConfirm'))) {
      return;
    }

    try {
      setManagingCommentId(commentId);
      setCommentManageError('');
      const response = await deleteGameCommentApi(game.id, commentId);
      if (response.code !== 200) {
        throw new Error(response.message);
      }

      setComments((current) => current.filter((comment) => comment.id !== commentId));
      if (editingCommentId === commentId) {
        setEditingCommentId('');
        setEditingCommentValue('');
      }
    } catch (err: any) {
      if (err?.status === 401) {
        setIsLoggedIn(false);
        navigate('/auth');
        return;
      }

      setCommentManageError(err.message || t('commentDeleteFailed'));
    } finally {
      setManagingCommentId('');
    }
  };

  if (loading) {
    return (
      <div className="game-detail-page">
        <div className="detail-shell">
          <button className="detail-back-btn" onClick={handleBackToDashboard}>
            {t('backHome')}
          </button>
          <div className="detail-feedback-card">
            <div className="detail-loader"></div>
            <p>{t('loadingGameDetail')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="game-detail-page">
        <div className="detail-shell">
          <button className="detail-back-btn" onClick={handleBackToDashboard}>
            {t('backHome')}
          </button>
          <div className="detail-feedback-card detail-feedback-error">
            <h2>{t('gameNotFound')}</h2>
            <p>{error || t('gameUnavailable')}</p>
            <div className="detail-actions">
              <button className="detail-primary-btn" onClick={handleBackToDashboard}>
                {t('backToList')}
              </button>
              <button className="detail-secondary-btn" onClick={() => window.location.reload()}>
                {t('retry')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-detail-page">
      <div
        className="detail-page-glow"
        style={{
          backgroundImage: game.coverImage
            ? `linear-gradient(135deg, rgba(8, 6, 13, 0.8), rgba(255, 77, 79, 0.18)), url(${game.coverImage})`
            : undefined,
        }}
      />
      <div className="detail-shell">
        <div className="detail-toolbar">
          <button className="detail-back-btn" onClick={handleBackToDashboard}>
            {t('backHome')}
          </button>
          <div className="detail-toolbar-actions">
            <div className="detail-toolbar-caption">
              {t('appName')} / {t('gameDetail')}
            </div>
          </div>
        </div>

        <section className="detail-hero">
          <div className="detail-hero-card">
            <div className="detail-cover-frame">
              {game.coverImage ? (
                <img className="detail-cover-image" src={game.coverImage} alt={game.title} />
              ) : (
                <div className="detail-cover-placeholder">{t('appName')}</div>
              )}
            </div>

            <div className="detail-copy">
              <span className="detail-kicker">{getCategoryText(game)}</span>
              <h1 className="detail-title">{game.title}</h1>
              <p className="detail-summary">{game.description || t('noDescription')}</p>

              <div className="detail-badges">
                <span className="detail-badge detail-badge-accent">{formatRating(game.rating)}</span>
                <span className="detail-badge">{formatReleaseDate(game.releaseDate)}</span>
                <span className="detail-badge">{getRegionText(game)}</span>
              </div>

              <div className="detail-actions">
                <FavoriteButton
                  active={isFavorite}
                  loading={favoriteLoading}
                  onClick={() => void handleToggleFavorite()}
                />
                {game.downloadLink ? (
                  <a
                    className="detail-primary-btn"
                    href={game.downloadLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('downloadNow')}
                  </a>
                ) : null}
                {game.cinematicTrailer ? (
                  <a
                    className="detail-secondary-btn"
                    href={game.cinematicTrailer}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('watchTrailer')}
                  </a>
                ) : null}
                <button className="detail-secondary-btn" onClick={handleBackToDashboard}>
                  {t('backToList')}
                </button>
              </div>

              {sessionNotice ? (
                <p className="detail-login-tip">{sessionNotice}</p>
              ) : !isLoggedIn ? (
                <p className="detail-login-tip">{t('guestDetailTip')}</p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="detail-panel detail-comments-panel">
          <div className="detail-comments-head">
            <div>
              <h2>{t('gameComments')}</h2>
            </div>
            <span className="detail-comments-count">{comments.length}</span>
          </div>

          <div className="detail-comments-list">
            {commentsLoading ? (
              <div className="detail-comment-loading">
                <div className="detail-loader" />
                <p>{t('commentLoading')}</p>
              </div>
            ) : commentsError ? (
              <div className="detail-comment-empty">
                <strong>{t('commentLoadFailed')}</strong>
                <p>{commentsError}</p>
                <button
                  type="button"
                  className="detail-secondary-btn"
                  onClick={() => setCommentsRefreshToken((value) => value + 1)}
                >
                  {t('retry')}
                </button>
              </div>
            ) : comments.length === 0 ? (
              <div className="detail-comment-empty">
                <strong>{t('gameCommentsEmptyTitle')}</strong>
                <p>{t('gameCommentsEmptyDesc')}</p>
              </div>
            ) : (
              comments.map((comment) => (
                <article key={comment.id} className="detail-comment-item">
                  {renderCommentAvatar(comment)}
                  <div className="detail-comment-body">
                    <div className="detail-comment-meta">
                      <strong>{comment.username}</strong>
                      <div className="detail-comment-meta-side">
                        <span>{formatCommentTime(comment.createdAt)}</span>
                        {canManageComment(comment) ? (
                          <div className="detail-comment-actions">
                            {editingCommentId === comment.id ? (
                              <button
                                type="button"
                                className="detail-comment-action"
                                onClick={handleCancelEditComment}
                                disabled={managingCommentId === comment.id}
                              >
                                {t('commentCancel')}
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="detail-comment-action"
                                onClick={() => handleStartEditComment(comment)}
                                disabled={Boolean(managingCommentId)}
                              >
                                {t('commentEdit')}
                              </button>
                            )}
                            <button
                              type="button"
                              className="detail-comment-action is-danger"
                              onClick={() => void handleDeleteComment(comment.id)}
                              disabled={managingCommentId === comment.id}
                            >
                              {t('commentDelete')}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    {editingCommentId === comment.id ? (
                      <div className="detail-comment-edit">
                        <textarea
                          value={editingCommentValue}
                          onChange={(event) => setEditingCommentValue(event.target.value)}
                          rows={3}
                          maxLength={500}
                        />
                        <div className="detail-comment-edit-actions">
                          <span className="detail-comment-limit">{editingCommentValue.length}/500</span>
                          <button
                            type="button"
                            className="detail-primary-btn"
                            onClick={() => void handleUpdateComment(comment.id)}
                            disabled={managingCommentId === comment.id || !editingCommentValue.trim()}
                          >
                            {managingCommentId === comment.id ? t('commentUpdating') : t('commentSave')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p>{comment.content}</p>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
          {commentManageError ? <p className="detail-comment-error">{commentManageError}</p> : null}

          {isLoggedIn ? (
            <div className="detail-comment-compose">
              <textarea
                value={commentValue}
                onChange={(event) => setCommentValue(event.target.value)}
                placeholder={t('commentPlaceholder')}
                rows={4}
                maxLength={500}
              />
              <div className="detail-comment-compose-actions">
                <span className="detail-comment-limit">{commentValue.length}/500</span>
                <button
                  type="button"
                  className="detail-primary-btn"
                  onClick={() => void handleCommentSubmit()}
                  disabled={commentSubmitting || !commentValue.trim()}
                >
                  {commentSubmitting ? t('commentSubmitting') : t('commentSubmit')}
                </button>
              </div>
              {commentActionError ? <p className="detail-comment-error">{commentActionError}</p> : null}
            </div>
          ) : (
            <div className="detail-comment-login-card">
              <strong>{t('commentLoginRequired')}</strong>
              <p>{t('commentLoginDesc')}</p>
              <button type="button" className="detail-secondary-btn" onClick={() => navigate('/auth')}>
                {t('commentLoginAction')}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default GameDetailPage;
