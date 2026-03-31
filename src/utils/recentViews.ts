const RECENT_VIEW_STORAGE_KEY = 'recentlyViewedGameIds';
const MAX_RECENT_VIEWED = 12;

export const getRecentViewIdsLocally = () => {
  try {
    const rawValue = localStorage.getItem(RECENT_VIEW_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

export const saveRecentViewLocally = (gameId: string) => {
  const currentIds = getRecentViewIdsLocally().filter((id) => id !== gameId);
  const nextIds = [gameId, ...currentIds].slice(0, MAX_RECENT_VIEWED);
  localStorage.setItem(RECENT_VIEW_STORAGE_KEY, JSON.stringify(nextIds));
};
