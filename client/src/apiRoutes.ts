export const formatUrl = (url: string) => url // ? `http://localhost:3000${url}`: ''
export const getGamesMetaUrl = () => formatUrl("/api/gamesMeta");
export const getSignedUrls = (gameId: string) => formatUrl(`/api/getSignedUrls/${gameId}`) 