import axios from 'axios';
import type { AppLocale } from '../i18n/locale';
import { getStoredLocale } from '../i18n/locale';

const api = axios.create({
  baseURL: 'http://localhost:8080',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
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
      localStorage.removeItem('token');
      window.location.href = '/auth';
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

const getErrorMessage = (error: any, fallback: string) =>
  error.response?.data?.message || error.response?.data?.error || fallback;

export const loginApi = async (data: { username: string; password: string }) => {
  try {
    const response = await api.post<ResultVO<{ token: string }>>('/api/auth/login', data);
    if (response.data.code === 200 && response.data.data?.token) {
      return response.data;
    }
    throw new Error(response.data.message || 'Login failed');
  } catch (error: any) {
    throw new Error(getErrorMessage(error, 'Login failed'));
  }
};

export const registerApi = async (data: { username: string; password: string }) => {
  try {
    const response = await api.post<ResultVO<string>>('/api/auth/register', data);
    return response.data;
  } catch (error: any) {
    throw new Error(getErrorMessage(error, 'Register failed'));
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
  } catch (error: any) {
    throw new Error(getErrorMessage(error, 'Failed to load games'));
  }
};

export const getGameDetailApi = async (id: string, locale?: AppLocale) => {
  try {
    const response = await api.get<ResultVO<Game>>(`/api/games/${id}`, {
      params: { lang: locale ?? getStoredLocale() },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(getErrorMessage(error, 'Failed to load game detail'));
  }
};

export const getFavoritesApi = async (locale?: AppLocale) => {
  try {
    const response = await api.get<ResultVO<Game[]>>('/api/favorites', {
      params: { lang: locale ?? getStoredLocale() },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(getErrorMessage(error, 'Failed to load favorites'));
  }
};

export const getFavoriteStatusApi = async (gameId: string) => {
  try {
    const response = await api.get<ResultVO<boolean>>(`/api/favorites/${gameId}/status`);
    return response.data;
  } catch (error: any) {
    throw new Error(getErrorMessage(error, 'Failed to load favorite status'));
  }
};

export const addFavoriteApi = async (gameId: string) => {
  try {
    const response = await api.post<ResultVO<boolean>>(`/api/favorites/${gameId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(getErrorMessage(error, 'Failed to add favorite'));
  }
};

export const removeFavoriteApi = async (gameId: string) => {
  try {
    const response = await api.delete<ResultVO<boolean>>(`/api/favorites/${gameId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(getErrorMessage(error, 'Failed to remove favorite'));
  }
};

export const getRecentlyViewedApi = async (locale?: AppLocale) => {
  try {
    const response = await api.get<ResultVO<Game[]>>('/api/recently-viewed', {
      params: { lang: locale ?? getStoredLocale() },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(getErrorMessage(error, 'Failed to load recently viewed games'));
  }
};

export const recordRecentViewApi = async (gameId: string) => {
  try {
    const response = await api.post<ResultVO<boolean>>(`/api/recently-viewed/${gameId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(getErrorMessage(error, 'Failed to record recent view'));
  }
};

export default api;
