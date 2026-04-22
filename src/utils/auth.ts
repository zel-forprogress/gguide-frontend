export const TOKEN_STORAGE_KEY = 'token';
export const AUTH_EXPIRED_EVENT = 'gguide:auth-expired';

type AuthExpiredReason = 'expired' | 'unauthorized';

export type AuthExpiredDetail = {
  reason: AuthExpiredReason;
};

export const getStoredToken = () => localStorage.getItem(TOKEN_STORAGE_KEY);

export const hasStoredToken = () => Boolean(getStoredToken());

export const setStoredToken = (token: string) => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
};

export const clearStoredToken = (detail?: AuthExpiredDetail) => {
  const hadToken = hasStoredToken();
  localStorage.removeItem(TOKEN_STORAGE_KEY);

  if (!hadToken || !detail) {
    return;
  }

  window.dispatchEvent(new CustomEvent<AuthExpiredDetail>(AUTH_EXPIRED_EVENT, { detail }));
};

export const subscribeAuthExpired = (listener: (detail: AuthExpiredDetail) => void) => {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<AuthExpiredDetail>;
    listener(customEvent.detail);
  };

  window.addEventListener(AUTH_EXPIRED_EVENT, handler);
  return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handler);
};
