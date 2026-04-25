export const TOKEN_STORAGE_KEY = 'token';
export const AUTH_EXPIRED_EVENT = 'gguide:auth-expired';

type AuthExpiredReason = 'expired' | 'unauthorized';

export type AuthExpiredDetail = {
  reason: AuthExpiredReason;
};

type JwtPayload = {
  exp?: number;
};

const parseJwtPayload = (token: string): JwtPayload | null => {
  try {
    const [, payload] = token.split('.');
    if (!payload) {
      return null;
    }

    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      '='
    );
    const payloadText = new TextDecoder().decode(
      Uint8Array.from(atob(paddedPayload), (char) => char.charCodeAt(0))
    );

    return JSON.parse(payloadText) as JwtPayload;
  } catch {
    return null;
  }
};

export const isTokenExpired = (token: string, now = Date.now()) => {
  const expiresAt = parseJwtPayload(token)?.exp;

  if (!expiresAt) {
    return false;
  }

  return expiresAt * 1000 <= now;
};

export const getStoredToken = () => localStorage.getItem(TOKEN_STORAGE_KEY);

export const hasStoredToken = () => {
  const token = getStoredToken();
  return Boolean(token && !isTokenExpired(token));
};

export const setStoredToken = (token: string) => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
};

export const clearStoredToken = (detail?: AuthExpiredDetail) => {
  const hadToken = Boolean(getStoredToken());
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

export const checkStoredTokenExpiration = () => {
  const token = getStoredToken();

  if (!token || !isTokenExpired(token)) {
    return null;
  }

  const detail: AuthExpiredDetail = { reason: 'expired' };
  clearStoredToken(detail);
  return detail;
};

export const getActiveStoredToken = () => {
  const detail = checkStoredTokenExpiration();

  if (detail) {
    return null;
  }

  return getStoredToken();
};
