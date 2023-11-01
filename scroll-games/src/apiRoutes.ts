export const formatUrl = (url: string) => url // ? `http://localhost:3000${url}`: ''
export const getGamesMetaUrl = () => formatUrl("/api/gamesMeta");