import './App.css'

function App() {
  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
          G-Guide
        </div>
        <nav className="nav-menu">
          <div className="nav-item active">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            首页
          </div>
          <div className="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            最近查看
          </div>
          <div className="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            我的收藏
          </div>
          <div className="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            游戏广场
          </div>
          <div className="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            G-Guide AI
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-header">
          <div className="search-bar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" placeholder="搜索游戏、类别或素材" />
          </div>
          <div className="user-profile">
            {/* User Avatar Placeholder */}
            <div style={{width: 32, height: 32, borderRadius: '50%', background: '#eee'}}></div>
          </div>
        </header>

        {/* AI Section */}
        <section className="ai-section">
          <h1 className="ai-title">游戏导航 想法即刻成型</h1>
          <p className="ai-subtitle">输入您的需求，AI 助手将为您精准匹配最适合的游戏类别</p>
          
          <div className="ai-input-wrapper">
            <textarea placeholder="请描述您想要找的游戏类型，或上传参考图作为参考..."></textarea>
            <div className="ai-input-footer">
              <div style={{display: 'flex', gap: 12}}>
                <button className="quick-btn" style={{border: 'none', background: '#f5f5f5'}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
                  极速
                </button>
                <button className="quick-btn" style={{border: 'none', background: '#f5f5f5'}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                  图片匹配
                </button>
              </div>
              <button className="ai-send-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            </div>
          </div>

          <div className="quick-start">
            <button className="quick-btn">
              <span style={{color: '#1890ff'}}>+</span> 新建游戏档案
            </button>
            <button className="quick-btn">热门分类</button>
            <button className="quick-btn">评分最高</button>
            <button className="quick-btn">最近更新</button>
            <button className="quick-btn">游戏标签库</button>
          </div>
        </section>

        {/* Content Tabs & Grid */}
        <section className="content-grid-section">
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
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="game-card">
                <div className="game-image">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="2" y="6" width="20" height="12" rx="2"></rect><path d="M6 12h.01"></path><path d="M9 12h.01"></path><path d="M15 12h.01"></path><path d="M18 12h.01"></path></svg>
                </div>
                <div className="game-info">
                  <div className="game-name">游戏名称 {i}</div>
                  <div className="game-desc">这是一个关于游戏的简短描述，帮助用户快速了解。</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
