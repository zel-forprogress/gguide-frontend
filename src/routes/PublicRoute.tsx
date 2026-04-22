import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { hasStoredToken, subscribeAuthExpired } from '../utils/auth';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  const [hasToken, setHasToken] = useState(() => hasStoredToken());

  useEffect(() => {
    const unsubscribe = subscribeAuthExpired(() => {
      setHasToken(false);
    });

    return unsubscribe;
  }, []);

  if (hasToken) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;
