import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGamesApi, type Game } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isLoggedIn = Boolean(localStorage.getItem('token'));

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        const res = await getGamesApi();
        if (res.code === 200) {
          setGames(res.data);
        } else {
          setError(res.message || `后端错误（代码: ${res.code}）`);
        }
      } catch (err: any) {
        console.error('Full fetch error:', err);
        setError(err.message || '网络连接失败，请检查后端是否启动');
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/', { replace: true });
  };

  const handleOpenGameDetail = (gameId: string) => {
    navigate(`/games/${gameId}`);
  };

  const handleOpenAuthPage = () => {
    navigate('/auth');
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
          </svg>
          G-Guide
        </div>
        <nav className="nav-menu">
          <div className="nav-item active">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            首页
          </div>
          <div className="nav-item" style={!isLoggedIn ? { opacity: 0.65 } : undefined}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            最近查看
          </div>
          <div className="nav-item" style={!isLoggedIn ? { opacity: 0.65 } : undefined}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            我的收藏
          </div>
          <div className="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            游戏广场
          </div>
          <div className="nav-item" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
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
            <input type="text" placeholder="搜索游戏、类别或素材" />
          </div>

          {isLoggedIn ? (
            <div className="user-profile">
              <div className="avatar-wrapper">
                <div className="avatar"></div>
                <div className="user-dropdown">
                  <div className="dropdown-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    个人设置
                  </div>
                  <div className="dropdown-item" onClick={handleLogout}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
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
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', marginBottom: '8px', textAlign: 'left' }}>
              {isLoggedIn ? '欢迎回来，继续挑今晚要玩的游戏' : '先逛首页，想登录时再登录'}
            </h1>
            <p style={{ color: '#666', textAlign: 'left' }}>
              {isLoggedIn
                ? '热门游戏和最新内容都已经准备好了，点进详情就能继续探索。'
                : '现在可以直接以游客身份浏览游戏内容，等你想收藏、管理账号或解锁更多能力时再登录。'}
            </p>
          </div>

          {!isLoggedIn ? (
            <div className="guest-banner">
              <div>
                <strong>当前为游客浏览模式</strong>
                <p>你可以先看列表和详情，登录后再使用收藏、历史记录等个人能力。</p>
              </div>
              <button className="guest-banner-btn" onClick={handleOpenAuthPage}>
                去登录
              </button>
            </div>
          ) : null}

          <div className="quick-start" style={{ justifyContent: 'flex-start', marginBottom: '40px' }}>
            <button className="quick-btn" onClick={isLoggedIn ? undefined : handleOpenAuthPage}>
              <span style={{ color: '#1890ff' }}>{isLoggedIn ? '+' : '>'}</span>
              {isLoggedIn ? '新建游戏档案' : '登录后同步收藏'}
            </button>
            <button className="quick-btn">热门分类</button>
            <button className="quick-btn">评分最高</button>
            <button className="quick-btn">最近更新</button>
            <button className="quick-btn">游戏标签库</button>
          </div>

          <div className="tabs-container">
            <div className="tab active">推荐</div>
            <div className="tab">动作</div>
            <div className="tab">冒险</div>
            <div className="tab">角色扮演</div>
            <div className="tab">策略</div>
            <div className="tab">独立游戏</div>
            <div className="tab">多人在线</div>
          </div>

          <div className="game-grid">
            {loading ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>
                <div className="loader" style={{ margin: '0 auto', borderTopColor: '#1890ff' }}></div>
                <p style={{ marginTop: '16px', color: '#666' }}>加载中...</p>
              </div>
            ) : error ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#ff4d4f' }}>
                <p>{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  style={{ marginTop: '10px', padding: '6px 16px', borderRadius: '4px', border: '1px solid #ff4d4f', background: 'transparent', color: '#ff4d4f', cursor: 'pointer' }}
                >
                  重试
                </button>
              </div>
            ) : games.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#666' }}>
                暂无游戏数据
              </div>
            ) : (
              games.map((game) => (
                <div
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
                  <div className="game-image" style={{ overflow: 'hidden' }}>
                    {game.coverImage ? (
                      <img
                        src={game.coverImage}
                        alt={game.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                        <path d="M6 12h.01"></path>
                        <path d="M9 12h.01"></path>
                        <path d="M15 12h.01"></path>
                        <path d="M18 12h.01"></path>
                      </svg>
                    )}
                  </div>
                  <div className="game-info">
                    <div className="game-name">{game.title}</div>
                    <div className="game-desc">{game.description}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
