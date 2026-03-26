import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // 检查本地存储中是否有 token
  const token = localStorage.getItem('token');

  if (!token) {
    // 如果没有 token，重定向到登录页
    // 使用 replace 确保用户不能通过后退回到受保护的页面
    return <Navigate to="/auth" replace />;
  }

  // 如果有 token，允许访问子组件
  return <>{children}</>;
};

export default ProtectedRoute;
