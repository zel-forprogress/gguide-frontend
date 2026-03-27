import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getGameDetailApi, type Game } from '../services/api';

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

const GameDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
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
        const res = await getGameDetailApi(id);
        if (!cancelled) {
          if (res.code === 200 && res.data) {
            setGame(res.data);
            return;
          }

          setError(res.message || '获取游戏详情失败');
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

    fetchGameDetail();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="game-detail-page">
        <div className="detail-shell">
          <button className="detail-back-btn" onClick={handleBackToDashboard}>
            返回广场
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
            返回广场
          </button>
          <div className="detail-feedback-card detail-feedback-error">
            <h2>没有找到这款游戏</h2>
            <p>{error || '当前游戏详情不存在或暂时不可用。'}</p>
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
            : undefined
        }}
      />
      <div className="detail-shell">
        <div className="detail-toolbar">
          <button className="detail-back-btn" onClick={handleBackToDashboard}>
            返回广场
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
            <span className="detail-kicker">{game.category || '未分类'}</span>
            <h1 className="detail-title">{game.title}</h1>
            <p className="detail-summary">{game.description || '这款游戏暂时还没有详细介绍。'}</p>

            <div className="detail-badges">
              <span className="detail-badge detail-badge-accent">{formatRating(game.rating)}</span>
              <span className="detail-badge">{formatReleaseDate(game.releaseDate)}</span>
              <span className="detail-badge">ID: {game.id}</span>
            </div>

            <div className="detail-meta-grid">
              <article className="detail-meta-card">
                <span>分类</span>
                <strong>{game.category || '未分类'}</strong>
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
          </div>
        </section>

        <section className="detail-content-grid">
          <article className="detail-panel">
            <h2>游戏简介</h2>
            <p>{game.description || '这款游戏暂时还没有详细介绍。'}</p>
          </article>

          <aside className="detail-panel detail-panel-side">
            <h2>快速信息</h2>
            <ul className="detail-facts">
              <li>分类：{game.category || '未分类'}</li>
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
