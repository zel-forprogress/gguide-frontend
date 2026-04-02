import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import FavoriteButton from '../components/FavoriteButton';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useLocale } from '../i18n/LocaleProvider';
import {
  addFavoriteApi,
  getFavoriteStatusApi,
  getGameDetailApi,
  recordRecentViewApi,
  removeFavoriteApi,
  type Game,
} from '../services/api';
import { saveRecentViewLocally } from '../utils/recentViews';

const GameDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { locale, t } = useLocale();
  const isLoggedIn = Boolean(localStorage.getItem('token'));
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState('');

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

        const [gameResponse, favoriteResponse] = await Promise.all([
          getGameDetailApi(id),
          isLoggedIn ? getFavoriteStatusApi(id) : Promise.resolve(null),
        ]);

        if (cancelled) {
          return;
        }

        if (gameResponse.code === 200 && gameResponse.data) {
          setGame(gameResponse.data);
        } else {
          setError(gameResponse.message || t('gameUnavailable'));
        }

        if (favoriteResponse?.code === 200) {
          setIsFavorite(Boolean(favoriteResponse.data));
        } else if (!isLoggedIn) {
          setIsFavorite(false);
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
            <LanguageSwitcher />
          </div>
        </div>

        <section className="detail-hero">
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
              <span className="detail-badge">ID: {game.id}</span>
            </div>

            <div className="detail-meta-grid">
              <article className="detail-meta-card">
                <span>{t('category')}</span>
                <strong>{getCategoryText(game)}</strong>
              </article>
              <article className="detail-meta-card">
                <span>{t('releaseDate')}</span>
                <strong>{formatReleaseDate(game.releaseDate)}</strong>
              </article>
              <article className="detail-meta-card">
                <span>{t('overallRating')}</span>
                <strong>{formatRating(game.rating)}</strong>
              </article>
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

            {!isLoggedIn ? <p className="detail-login-tip">{t('guestDetailTip')}</p> : null}
          </div>
        </section>

        <section className="detail-content-grid">
          <article className="detail-panel">
            <h2>{t('gameIntroduction')}</h2>
            <p>{game.description || t('noDescription')}</p>
          </article>

          <aside className="detail-panel detail-panel-side">
            <h2>{t('quickFacts')}</h2>
            <ul className="detail-facts">
              <li>
                {t('category')}: {getCategoryText(game)}
              </li>
              <li>
                {t('overallRating')}: {formatRating(game.rating)}
              </li>
              <li>
                {t('releaseDate')}: {formatReleaseDate(game.releaseDate)}
              </li>
              <li>
                {t('watchTrailer')}: {game.cinematicTrailer ? t('trailerAvailable') : t('trailerUnavailable')}
              </li>
              <li>
                {t('downloadNow')}: {game.downloadLink ? t('downloadAvailable') : t('downloadUnavailable')}
              </li>
            </ul>
          </aside>
        </section>
      </div>
    </div>
  );
};

export default GameDetailPage;
