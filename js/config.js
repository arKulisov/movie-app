export const BASE = "https://api.themoviedb.org/3/";
export const PROXY = "https://proxy-worker.arkulisov.workers.dev/";
const base = {
  page: 1,
  categoryGenres: [],      
  excludeGenres: [],       
  originalLanguage: null,
};

export const MODE = {
  movie: { ...base, version: "movie", mode: "discover/movie", excludeGenres: [16] },
  toon:  { ...base, version: "movie", mode: "discover/movie", categoryGenres: [16] },
  tv:    { ...base, version: "tv",    mode: "discover/tv",    excludeGenres: [16] },
  anime: { ...base, version: "tv",    mode: "discover/tv",    categoryGenres: [16], originalLanguage: "ja" },


  SEARCH_MOVIE: "search/movie",
  SEARCH_TV: "search/tv",
  SEARCH_MULTI: "search/multi",
  SEARCH_PERSON: "search/person",
}

export const SCREEN = {
  main: "main",
  movie: "movie",
  toon: "toon",
  tv: "tv",
  anime: "anime",
  search: "search",
  details: "details",
};

const YEAR = new Date().getFullYear();

export const MAIN = [
  { title: "В тренде за неделю",    ...base, version: "movie", mode: "trending/all/week" },
  { title: "Сейчас в кино",         ...base, version: "movie", mode: "movie/now_playing" },
  { title: "Популярные фильмы",     ...base, version: "movie", mode: "movie/popular" },
  { title: "Популярные сериалы",    ...base, version: "tv",    mode: "tv/popular" },
  {
    title: `Лучшие фильмы ${YEAR}`, ...base, version: "movie", mode: "discover/movie",
    sortBy: "vote_average.desc", yearFrom: YEAR, yearTo: YEAR, minVotes: 300,
  },
  {
    title: `Лучшие сериалы ${YEAR}`, ...base, version: "tv", mode: "discover/tv",
    sortBy: "vote_average.desc", yearFrom: YEAR, yearTo: YEAR, minVotes: 100,
  },
];



export const altGenreNames = new Map([
  ["Телевизионный фильм", "ТВ фильм"],
  ["Боевик и Приключения", "Боевик"],
]);
