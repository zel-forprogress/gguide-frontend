import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginApi, registerApi } from '../services/api';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isLoginMode) {
        const res = await loginApi({ username, password });
        // 假设登录成功返回 { token: '...' } 在 data 字段中
        if (res.data && res.data.token) {
          localStorage.setItem('token', res.data.token);
          navigate('/dashboard');
        } else {
          setError('服务器未返回 Token');
        }
      } else {
        await registerApi({ username, password });
        // 注册成功后，切换到登录模式并提示用户
        alert('注册成功，请登录！');
        setIsLoginMode(true);
        setPassword('');
      }
    } catch (err: any) {
      setError(err.message || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-page">
      <div className="landing-content">
        <div className="landing-logo">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
          </svg>
          G-Guide
        </div>
        <h1 className="landing-title">探索属于你的游戏世界</h1>
        <p className="landing-desc">
          G-Guide 是一个专为游戏爱好者设计的导航平台。在这里，你可以按照分类轻松找到心仪的游戏，管理你的游戏库，发现更多精彩内容。
        </p>
        <div className="login-card">
          <h2 style={{ marginBottom: '24px', fontSize: '20px' }}>
            {isLoginMode ? '欢迎回来' : '创建新账号'}
          </h2>
          <form onSubmit={handleSubmit}>
            <input 
              type="text" 
              placeholder="用户名 (测试账号: admin)" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input 
              type="password" 
              placeholder="密码 (测试密码: admin123)" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="error-msg">{error}</div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? <div className="loader"></div> : (isLoginMode ? '登录' : '注册')}
            </button>
          </form>
          <div 
            className="toggle-form" 
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setError('');
            }}
          >
            {isLoginMode ? '没有账号？点击注册' : '已有账号？点击登录'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
