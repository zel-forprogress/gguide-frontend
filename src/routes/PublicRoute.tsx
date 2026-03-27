import React from 'react';
import { Navigate } from 'react-router-dom';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  // 检查本地存储中是否有 token
  const token = localStorage.getItem('token');

  if (token) {
    // 如果有 token，重定向到 dashboard
    // 这可以防止已登录用户再次访问登录/注册页面
    return <Navigate to="/" replace />;
  }

  // 如果没有 token，允许访问子组件（例如登录页）
  return <>{children}</>;
};

export default PublicRoute;
