export const BASE = "https://api.themoviedb.org/3/";
export const PROXY = "https://proxy-worker.arkulisov.workers.dev/";
export const MODE = {
  main: { mode: "discover/multi", page: 1 },
  movie: {version: "movie", mode: "discover/movie", page: 1, with_keywords: [], without_keywords: ["297442"] },
  toon: { version: "movie", mode: "discover/movie", page: 1, with_keywords: ["297442"], without_keywords: [] },
  tv: { version: "tv", mode: "discover/tv", page: 1, with_keywords: [], without_keywords: ["210024"] },
  anime: { version: "tv", mode: "discover/tv", page: 1, with_keywords: ["210024"], without_keywords: [] },

  SEARCH_MOVIE: "search/movie",
  SEARCH_TV: "search/tv",
  SEARCH_MULTI: "search/multi",
  SEARCH_PERSON: "search/person",
};

export const altGenreNames = new Map([
  ["Телевизионный фильм", "ТВ фильм"],
  ["Боевик и Приключения", "Боевик"],
]);