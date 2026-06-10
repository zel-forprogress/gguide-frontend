import axios from 'axios';
import type { AppLocale } from '../i18n/locale';
import { getStoredLocale } from '../i18n/locale';
import { clearStoredToken, getActiveStoredToken } from '../utils/auth';

type ApiErrorBody = {
  message?: string;
  error?: string;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.message || error.response?.data?.error || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
};

export class UnauthorizedError extends Error {
  status: number;

  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
    this.status = 401;
  }
}

const throwAppError = (error: unknown, fallback: string): never => {
  if (error instanceof UnauthorizedError) {
    throw error;
  }

  throw new Error(getErrorMessage(error, fallback));
};

export const getAppErrorMessage = (error: unknown, fallback: string) =>
  getErrorMessage(error, fallback);

export const isUnauthorizedError = (error: unknown) => error instanceof UnauthorizedError;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 60000, // Keep enough time for AI responses.
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getActiveStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearStoredToken({ reason: 'expired' });
      return Promise.reject(
        new UnauthorizedError(getErrorMessage(error, 'Session expired. Please log in again.'))
      );
    }
    return Promise.reject(error);
  }
);

export interface ResultVO<T> {
  code: number;
  message: string;
  data: T;
}

export interface Game {
  id: string;
  title: string;
  description: string;
  titleI18n?: Record<string, string>;
  descriptionI18n?: Record<string, string>;
  coverImage: string;
  rating: number;
  categories: string[];
  categoryLabels: string[];
  regionCode?: string;
  regionLabel?: string;
  releaseDate: string;
  cinematicTrailer?: string;
  downloadLink?: string;
}

export interface CurrentUser {
  username: string;
  admin: boolean;
  avatarUrl: string;
}

export interface CreateGamePayload {
  title: string;
  description: string;
  titleI18n?: Record<string, string>;
  descriptionI18n?: Record<string, string>;
  coverImage: string;
  rating: number;
  categories: string[];
  regionCode?: string;
  releaseDate?: string;
  cinematicTrailer?: string;
  downloadLink?: string;
}

export interface GameComment {
  id: string;
  gameId: string;
  username: string;
  avatarUrl?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateGameCommentPayload {
  content: string;
}

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
  preview?: string;
}

export interface AiConversation extends AiConversationSummary {
  messages: AiMessage[];
  createdAt: string;
}

export interface AiChatResponse {
  conversationId: string;
  title: string;
  response: string;
  messages: AiMessage[];
  updatedAt: string;
}

export interface AiChatOptions {
  conversationId?: string | null;
  contextGameId?: string | null;
}

export type AiStreamEvent =
  | { type: 'delta'; content: string }
  | {
      type: 'done';
      conversationId: string;
      title: string;
      updatedAt: string;
      messages: AiMessage[];
      messageCount: number;
    }
  | { type: 'error'; message: string };

export interface AiSettings {
  configured: boolean;
  apiKeyPreview: string;
  baseUrl: string;
  model: string;
  usingDefaultBaseUrl: boolean;
  usingDefaultModel: boolean;
}

export interface AiSettingsPayload {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  clearApiKey?: boolean;
}

export const loginApi = async (data: { username: string; password: string }) => {
  try {
    const response = await api.post<ResultVO<{ token: string }>>('/api/auth/login', data);
    if (response.data.code === 200 && response.data.data?.token) {
      return response.data;
    }
    throw new Error(response.data.message || 'Login failed');
  } catch (error: unknown) {
    return throwAppError(error, 'Login failed');
  }
};

export const registerApi = async (data: { username: string; password: string }) => {
  try {
    const response = await api.post<ResultVO<string>>('/api/auth/register', data);
    return response.data;
  } catch (error: unknown) {
    return throwAppError(error, 'Register failed');
  }
};

export const getCurrentUserApi = async () => {
  try {
    const response = await api.get<ResultVO<CurrentUser>>('/api/auth/me');
    return response.data;
  } catch (error: unknown) {
    return throwAppError(error, 'Failed to load current user');
  }
};

export const updateAvatarApi = async (avatarUrl: string) => {
  try {
    const response = await api.put<ResultVO<CurrentUser>>('/api/auth/avatar', { avatarUrl });
    return response.data;
  } catch (error: unknown) {
    return throwAppError(error, 'Failed to update avatar');
  }
};

export const getHotGamesApi = async () => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return {
    code: 200,
    message: 'success',
    data: [
      {
        id: '1',
        title: 'Elden Ring',
        desc: 'Step into a fractured realm and shape your legend.',
        image:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop',
      },
      {
        id: '2',
        title: 'Cyberpunk 2077',
        desc: 'Chase your future through a neon-soaked city.',
        image:
          'https://images.unsplash.com/photo-1605898960710-99435860e653?q=80&w=2070&auto=format&fit=crop',
      },
      {
        id: '3',
        title: 'God of War Ragnarok',
        desc: 'Travel across the realms with Kratos and Atreus.',
        image:
          'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop',
      },
    ],
  };
};

export const getGamesApi = async (locale?: AppLocale) => {
  try {
    const response = await api.get<ResultVO<Game[]>>('/api/games', {
      params: { lang: locale ?? getStoredLocale() },
    });
    return response.data;
  } catch (error: unknown) {
    return throwAppError(error, 'Failed to load games');
  }
};

export const getGameDetailApi = async (id: string, locale?: AppLocale) => {
  try {
    const response = await api.get<ResultVO<Game>>(`/api/games/${id}`, {
      params: { lang: locale ?? getStoredLocale() },
    });
    return response.data;
  } catch (error: unknown) {
    return throwAppError(error, 'Failed to load game detail');
  }
};

export const getGameCommentsApi = async (gameId: string) => {
  try {
    const response = await api.get<ResultVO<GameComment[]>>(`/api/games/${gameId}/comments`);
    return response.data;
  } catch (error: unknown) {
    return throwAppError(error, 'Failed to load game comments');
  }
};

export const createGameCommentApi = async (gameId: string, data: CreateGameCommentPayload) => {
  try {
    const response = await api.post<ResultVO<GameComment>>(`/api/games/${gameId}/comments`, data);
    return response.data;
  } catch (error: unknown) {
    return throwAppError(error, 'Failed to post game comment');
  }
};

export const updateGameCommentApi = async (
  gameId: string,
  commentId: string,
  data: CreateGameCommentPayload
) => {
  try {
    const response = await api.put<ResultVO<GameComment>>(`/api/games/${gameId}/comments/${commentId}`, data);
    return response.data;
  } catch (error: unknown) {
    return throwAppError(error, 'Failed to update game comment');
  }
};

export const deleteGameCommentApi = async (gameId: string, commentId: string) => {
  try {
    const response = await api.delete<ResultVO<string>>(`/api/games/${gameId}/comments/${commentId}`);
    return response.data;
  } catch (error: unknown) {
    return throwAppError(error, 'Failed to delete game comment');
  }
};

export const createGameApi = async (data: CreateGamePayload, locale?: AppLocale) => {
  try {
    const response = await api.post<ResultVO<Game>>('/api/games', data, {
      params: { lang: locale ?? getStoredLocale() },
    });
    return response.data;
  } catch (error: unknown) {
    return throwAppError(error, 'Failed to create game');
  }
};

export const updateGameApi = async (id: string, data: CreateGamePayload, locale?: AppLocale) => {
  try {
    const response = await api.put<ResultVO<Game>>(`/api/games/${id}`, data, {
      params: { lang: locale ?? getStoredLocale() },
    });
    return response.data;
  } catch (error: unknown) {
    return throwAppError(error, 'Failed to update game');
  }
};

export const getFavoritesApi = async (locale?: AppLocale) => {
  try {
    const response = await api.get<ResultVO<Game[]>>('/api/favorites', {
      params: { lang: locale ?? getStoredLocale() },
    });
    return response.data;
  } catch (error: unknown) {
    return throwAppError(error, 'Failed to load favorites');
  }
};

export const getFavoriteStatusApi = async (gameId: string) => {
  try {
    const response = await api.get<ResultVO<boolean>>(`/api/favorites/${gameId}/status`);
    return response.data;
  } catch (error: unknown) {
    return throwAppError(error, 'Failed to load favorite status');
  }
};

export const addFavoriteApi = async (gameId: string) => {
  try {
    const response = await api.post<ResultVO<boolean>>(`/api/favorites/${gameId}`);
    return response.data;
  } catch (error: unknown) {
    return throwAppError(error, 'Failed to add favorite');
  }
};

export const removeFavoriteApi = async (gameId: string) => {
  try {
    const response = await api.delete<ResultVO<boolean>>(`/api/favorites/${gameId}`);
    return response.data;
  } catch (error: unknown) {
    return throwAppError(error, 'Failed to remove favorite');
  }
};

export const getRecentlyViewedApi = async (locale?: AppLocale) => {
  try {
    const response = await api.get<ResultVO<Game[]>>('/api/recently-viewed', {
      params: { lang: locale ?? getStoredLocale() },
    });
    return response.data;
  } catch (error: unknown) {
    return throwAppError(error, 'Failed to load recently viewed games');
  }
};

export const recordRecentViewApi = async (gameId: string) => {
  try {
    const response = await api.post<ResultVO<boolean>>(`/api/recently-viewed/${gameId}`);
    return response.data;
  } catch (error: unknown) {
    return throwAppError(error, 'Failed to record recent view');
  }
};

/**
 * AI assistant chat API.
 */
export const chatWithAiApi = async (messages: AiMessage[], options: AiChatOptions = {}) => {
  try {
    const response = await api.post<ResultVO<AiChatResponse>>('/api/ai/chat', {
      conversationId: options.conversationId,
      contextGameId: options.contextGameId,
      messages,
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'AI assistant unavailable'));
  }
};

const parseAiStreamEvent = (block: string): AiStreamEvent | null => {
  const lines = block.split(/\r?\n/);
  const eventType = lines
    .find((line) => line.startsWith('event:'))
    ?.slice('event:'.length)
    .trim();
  const data = lines
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice('data:'.length).trim())
    .join('\n');

  if (!eventType || !data) {
    return null;
  }

  const payload = JSON.parse(data) as Record<string, unknown>;

  if (eventType === 'delta') {
    return { type: 'delta', content: String(payload.content || '') };
  }

  if (eventType === 'done') {
    const messages = Array.isArray(payload.messages) ? (payload.messages as AiMessage[]) : [];

    return {
      type: 'done',
      conversationId: String(payload.conversationId || ''),
      title: String(payload.title || ''),
      updatedAt: String(payload.updatedAt || ''),
      messages,
      messageCount: Number(payload.messageCount || 0),
    };
  }

  if (eventType === 'error') {
    return { type: 'error', message: String(payload.message || 'AI assistant unavailable') };
  }

  return null;
};

export const streamChatWithAiApi = async (
  messages: AiMessage[],
  options: AiChatOptions = {},
  onEvent: (event: AiStreamEvent) => void
) => {
  const token = getActiveStoredToken();
  if (!token) {
    throw new UnauthorizedError('Please log in first');
  }

  const response = await fetch('/api/ai/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      conversationId: options.conversationId,
      contextGameId: options.contextGameId,
      messages,
    }),
  });

  if (response.status === 401) {
    clearStoredToken({ reason: 'expired' });
    throw new UnauthorizedError('Session expired. Please log in again.');
  }

  if (!response.ok) {
    throw new Error((await response.text()) || 'AI assistant unavailable');
  }

  if (!response.body) {
    throw new Error('AI streaming response unavailable');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const flushEvents = (text: string) => {
    const event = parseAiStreamEvent(text);
    if (!event) {
      return;
    }

    if (event.type === 'error') {
      throw new Error(event.message);
    }

    onEvent(event);
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() || '';
    blocks.filter((block) => block.trim()).forEach(flushEvents);
  }

  buffer += decoder.decode();
  if (buffer.trim()) {
    flushEvents(buffer);
  }
};

export const getAiConversationsApi = async () => {
  try {
    const response = await api.get<ResultVO<AiConversationSummary[]>>('/api/ai/conversations');
    return response.data;
  } catch (error: unknown) {
    return throwAppError(error, 'Failed to load AI chat history');
  }
};

export const getAiConversationApi = async (conversationId: string) => {
  try {
    const response = await api.get<ResultVO<AiConversation>>(
      `/api/ai/conversations/${conversationId}`
    );
    return response.data;
  } catch (error: unknown) {
    return throwAppError(error, 'Failed to load AI chat conversation');
  }
};

export const getAiSettingsApi = async () => {
  try {
    const response = await api.get<ResultVO<AiSettings>>('/api/ai/settings');
    return response.data;
  } catch (error: unknown) {
    return throwAppError(error, 'Failed to load AI settings');
  }
};

export const updateAiSettingsApi = async (data: AiSettingsPayload) => {
  try {
    const response = await api.put<ResultVO<AiSettings>>('/api/ai/settings', data);
    return response.data;
  } catch (error: unknown) {
    return throwAppError(error, 'Failed to update AI settings');
  }
};

export default api;
