import { BASE, PROXY, MODE } from "../config.js";
import { state } from "./catalogState.js";

// ─── URL ───
const MIN_VOTES = 50;

export function buildURL(s) {
  const url = new URL(s.mode, BASE);
  const p = url.searchParams;

  p.set("language", "ru-RU");
  p.set("page", s.page);

  if (s.mode === MODE.SEARCH_MULTI) {
    p.set("query", s.query);
  } else if (s.mode.startsWith("discover/")) {
    const isTv = s.version === "tv";
    const dateKey = isTv ? "first_air_date" : "primary_release_date";

    p.set(
      "sort_by",
      isTv ? s.sortBy.replace("primary_release_date", "first_air_date") : s.sortBy,
    );
    p.set("vote_count.gte", MIN_VOTES);
    p.set("vote_count.gte", s.minVotes ?? MIN_VOTES);

    const withGenres = [...new Set([...s.categoryGenres, ...s.genres])];
    if (withGenres.length) p.set("with_genres", withGenres.join(","));
    if (s.excludeGenres.length) p.set("without_genres", s.excludeGenres.join(","));
    if (s.originalLanguage) p.set("with_original_language", s.originalLanguage);

    if (s.yearFrom != null) p.set(`${dateKey}.gte`, `${s.yearFrom}-01-01`);
    if (s.yearTo != null) p.set(`${dateKey}.lte`, `${s.yearTo}-12-31`);
    if (s.ratingFrom != null) p.set("vote_average.gte", s.ratingFrom);
    if (s.ratingTo != null) p.set("vote_average.lte", s.ratingTo);
  }
  return `${PROXY}?url=${encodeURIComponent(url.toString())}`;
}

export function buildDetailsURL(id, type) {
  if (type !== "movie" && type !== "tv") {
    throw new Error(`Неизвестный тип медиа: ${type}`);
  }

  const url = new URL(`${type}/${encodeURIComponent(id)}`, BASE);
  const p = url.searchParams;
  p.set("language", "ru-RU");
  p.set(
    "append_to_response",
    type === "movie"
      ? "credits,videos,recommendations,release_dates"
      : "credits,videos,recommendations,content_ratings",
  );

  return `${PROXY}?url=${encodeURIComponent(url.toString())}`;
}


// ─── Жанры ───
export let genres = {};

export async function loadGenres() {
  try {
    const target = `https://api.themoviedb.org/3/genre/${state.version}/list?language=ru-RU`;
    const response = await fetch(`${PROXY}?url=${encodeURIComponent(target)}`);
    if (!response.ok) throw new Error("Не удалось загрузить жанры");
    const data = await response.json();
    genres = {};
    Object.assign(
      genres,
      Object.fromEntries(data.genres.map((g) => [g.id, g.name])),
    );
  } catch (err) {
    console.log(err.message);
  }
}

// ─── Нормализация ───
function normalize(r) {
  return {
    id: r.id,
    type: r.media_type,
    title: r.title ?? r.name,
    date: r.release_date ?? r.first_air_date,
    poster: r.poster_path,
    rating: r.vote_average,
    genreIds: r.genre_ids ?? [],
  };
}

// ─── Сеть ───

let activeRequestController = null;

export async function searchMovies(url) {
  activeRequestController?.abort();
  const controller = new AbortController();
  activeRequestController = controller;

  try {
    return await fetchCatalog(url, controller.signal);
  } catch (err) {
    if (err.name === "AbortError") return;
    throw err;                             
  } finally {
    if (controller === activeRequestController) activeRequestController = null;
  }
}

export async function fetchCatalog(url, signal) {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Ошибка ${res.status}`);
  const data = await res.json();

  return {
    items: data.results.filter((r) => r.media_type !== "person").map(normalize),
    totalPages: Math.min(data.total_pages, 500),
  };
}

// ─── Постеры ───
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const NO_POSTER = "img/no-poster.svg";

export const posterUrl = (path) =>
  path ? `${PROXY}?url=${encodeURIComponent(TMDB_IMG + path)}` : NO_POSTER;

export function cancelCatalogRequest() {
  activeRequestController?.abort();
  activeRequestController = null;
}

export async function fetchDetails(url) {
  if (!url) throw new Error("Не указан URL для запроса деталей");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Ошибка ${res.status}`);
  const data = await res.json();
  return data;
}

function normalizeDetails(details, type) {
  return {
    title: details.title ?? details.name,
    originalTitle: details.original_title ?? details.original_name,
    releaseDate: details.release_date ?? details.first_air_date,
    runtime: details.runtime ?? details.episode_run_time?.[0] ?? null,
    overview: details.overview ?? "Описание отсутствует",
    poster: details.poster_path ?? details.backdrop_path ?? null,
    creators: details.credits?.crew?.filter((c) => c.job === "Director" || c.job === "Creator") ?? details.created_by ?? [],
    creditCast: details.cast?.slice(0, 12) ?? [],



  }}