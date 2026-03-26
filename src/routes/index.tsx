import type { RouteObject } from 'react-router-dom';
import WelcomePage from '../pages/WelcomePage';
import LandingPage from '../pages/LandingPage';
import Dashboard from '../pages/Dashboard';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';

/**
 * 声明式路由配置
 * 就像一张“地图”，定义了路径与组件的映射关系
 */
const routes: RouteObject[] = [
  {
    path: '/',
    element: <WelcomePage />,
  },
  {
    path: '/auth',
    element: (
      <PublicRoute>
        <LandingPage />
      </PublicRoute>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  // 如果需要处理 404，可以在这里添加
  {
    path: '*',
    element: <div style={{ padding: '20px', textAlign: 'center' }}>404 Not Found</div>,
  }
];

export default routes;
