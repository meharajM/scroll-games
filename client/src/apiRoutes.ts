const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

export const formatUrl = (url: string) => {
  if (!url || /^https?:\/\//i.test(url)) return url;
  return `${apiBaseUrl}${url.startsWith('/') ? url : `/${url}`}`;
};

export const getGamesMetaUrl = () => formatUrl('/api/gamesMeta');
export const getSignedUrls = (gameId: string) => formatUrl(`/api/getSignedUrls/${gameId}`);
export const getReportsUrl = () => formatUrl('/api/reports');
