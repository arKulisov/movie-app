export const BASE = "https://api.themoviedb.org/3/";
export const PROXY = "https://proxy-worker.arkulisov.workers.dev/";
export const MODE = {
  DISCOVER_MOVIE: "discover/movie",
  DISCOVER_TV: "discover/tv",
  SEARCH_MOVIE: "search/movie",
  SEARCH_TV: "search/tv",
  SEARCH_MULTI: "search/multi",
  SEARCH_PERSON: "search/person",
};

export const CATEGORY = {
  MOVIE: { mode: "discover/movie", pages: 1, without_keywords: "animation" },
  TOON: { mode: "discover/movie", pages: 1, with_keywords: "animation" },
  TV: { mode: "discover/tv", pages: 1, without_keywords: "anime" },
  ANIME: { mode: "discover/tv", pages: 1, with_keywords: "anime" }
}  
