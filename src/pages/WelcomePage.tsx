import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade } from 'swiper/modules';
import { getHotGamesApi } from '../services/api';

// 引入 Swiper 样式
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/autoplay';

const WelcomePage = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await getHotGamesApi();
        if (res.code === 200) {
          setGames(res.data);
        }
      } catch (err) {
        console.error('获取热门游戏失败:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  if (loading) {
    return (
      <div className="welcome-page" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="welcome-page">
      {/* 顶部导航 */}
      <nav className="welcome-nav">
        <div className="welcome-logo">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
          </svg>
          G-Guide
        </div>
        <div className="nav-auth-btns">
          <button className="btn-login-entry" onClick={() => navigate('/auth')}>
            登录 / 注册
          </button>
        </div>
      </nav>

      {/* 轮播图 */}
      <Swiper
        modules={[Autoplay, EffectFade]}
        effect="fade"
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        loop={true}
        className="swiper-container"
      >
        {games.map(game => (
          <SwiperSlide key={game.id}>
            <img src={game.image} alt={game.title} className="slide-img" />
            <div className="slide-content">
              <h1 className="slide-title">{game.title}</h1>
              <p className="slide-desc">{game.desc}</p>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default WelcomePage;
