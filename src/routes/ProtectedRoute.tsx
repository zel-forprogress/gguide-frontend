import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { hasStoredToken, subscribeAuthExpired } from '../utils/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [hasToken, setHasToken] = useState(() => hasStoredToken());
  const [redirectReason, setRedirectReason] = useState<'session-expired' | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeAuthExpired(() => {
      setHasToken(false);
      setRedirectReason('session-expired');
    });

    return unsubscribe;
  }, []);

  if (!hasToken) {
    return <Navigate to="/auth" replace state={redirectReason ? { reason: redirectReason } : undefined} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
