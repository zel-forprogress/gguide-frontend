import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import FavoriteButton from '../components/FavoriteButton';
import {
  addFavoriteApi,
  getFavoriteStatusApi,
  getGameDetailApi,
  recordRecentViewApi,
  removeFavoriteApi,
  type Game,
} from '../services/api';
import { saveRecentViewLocally } from '../utils/recentViews';

const formatReleaseDate = (releaseDate?: string) => {
  if (!releaseDate) {
    return '待公布';
  }

  const date = new Date(releaseDate);
  if (Number.isNaN(date.getTime())) {
    return '待公布';
  }

  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'long' }).format(date);
};

const formatRating = (rating?: number) => {
  if (typeof rating !== 'number' || Number.isNaN(rating)) {
    return '暂无评分';
  }

  return `${rating.toFixed(1)} / 10`;
};

const getCategoryText = (game?: Game | null) =>
  game?.categories && game.categories.length > 0 ? game.categories.join(' / ') : '未分类';

const GameDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isLoggedIn = Boolean(localStorage.getItem('token'));
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const fetchGameDetail = async () => {
      if (!id) {
        setError('无效的游戏 ID');
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
          setError(gameResponse.message || '获取游戏详情失败');
        }

        if (favoriteResponse?.code === 200) {
          setIsFavorite(Boolean(favoriteResponse.data));
        } else if (!isLoggedIn) {
          setIsFavorite(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || '获取游戏详情失败');
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
  }, [id, isLoggedIn]);

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
      window.alert(err.message || '收藏操作失败');
    } finally {
      setFavoriteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="game-detail-page">
        <div className="detail-shell">
          <button className="detail-back-btn" onClick={handleBackToDashboard}>
            返回首页
          </button>
          <div className="detail-feedback-card">
            <div className="detail-loader"></div>
            <p>正在加载游戏详情...</p>
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
            返回首页
          </button>
          <div className="detail-feedback-card detail-feedback-error">
            <h2>没有找到这款游戏</h2>
            <p>{error || '当前游戏详情不可用。'}</p>
            <div className="detail-actions">
              <button className="detail-primary-btn" onClick={handleBackToDashboard}>
                返回游戏列表
              </button>
              <button className="detail-secondary-btn" onClick={() => window.location.reload()}>
                重新加载
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
            返回首页
          </button>
          <div className="detail-toolbar-caption">G-Guide / 游戏详情</div>
        </div>

        <section className="detail-hero">
          <div className="detail-cover-frame">
            {game.coverImage ? (
              <img className="detail-cover-image" src={game.coverImage} alt={game.title} />
            ) : (
              <div className="detail-cover-placeholder">G-Guide</div>
            )}
          </div>

          <div className="detail-copy">
            <span className="detail-kicker">{getCategoryText(game)}</span>
            <h1 className="detail-title">{game.title}</h1>
            <p className="detail-summary">
              {game.description || '这款游戏暂时还没有补充详细介绍。'}
            </p>

            <div className="detail-badges">
              <span className="detail-badge detail-badge-accent">{formatRating(game.rating)}</span>
              <span className="detail-badge">{formatReleaseDate(game.releaseDate)}</span>
              <span className="detail-badge">ID: {game.id}</span>
            </div>

            <div className="detail-meta-grid">
              <article className="detail-meta-card">
                <span>分类</span>
                <strong>{getCategoryText(game)}</strong>
              </article>
              <article className="detail-meta-card">
                <span>发布日期</span>
                <strong>{formatReleaseDate(game.releaseDate)}</strong>
              </article>
              <article className="detail-meta-card">
                <span>综合评分</span>
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
                  前往下载
                </a>
              ) : null}
              {game.cinematicTrailer ? (
                <a
                  className="detail-secondary-btn"
                  href={game.cinematicTrailer}
                  target="_blank"
                  rel="noreferrer"
                >
                  观看预告
                </a>
              ) : null}
              <button className="detail-secondary-btn" onClick={handleBackToDashboard}>
                返回列表
              </button>
            </div>

            {!isLoggedIn ? (
              <p className="detail-login-tip">
                游客模式下也会记录最近查看；登录后还可以同步收藏和浏览记录。
              </p>
            ) : null}
          </div>
        </section>

        <section className="detail-content-grid">
          <article className="detail-panel">
            <h2>游戏简介</h2>
            <p>{game.description || '这款游戏暂时还没有补充详细介绍。'}</p>
          </article>

          <aside className="detail-panel detail-panel-side">
            <h2>快速信息</h2>
            <ul className="detail-facts">
              <li>分类：{getCategoryText(game)}</li>
              <li>评分：{formatRating(game.rating)}</li>
              <li>发布日期：{formatReleaseDate(game.releaseDate)}</li>
              <li>预告片：{game.cinematicTrailer ? '已提供链接' : '暂未提供'}</li>
              <li>下载方式：{game.downloadLink ? '已提供链接' : '暂未提供'}</li>
            </ul>
          </aside>
        </section>
      </div>
    </div>
  );
};

export default GameDetailPage;
