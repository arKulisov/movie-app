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
  console.log(url)
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
    poster: r.media_type === "person" ? r.profile_path : r.poster_path,
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
    items: data.results.map(normalize),
    totalPages: Math.min(data.total_pages, 500),
  };
}

// ─── Постеры ───
const TMDB_IMAGE_BASE  = "https://image.tmdb.org/t/p/";
const NO_POSTER = "img/no-poster.svg";

const imageUrl = (path, size) =>
  path
    ? `${PROXY}?url=${encodeURIComponent(`${TMDB_IMAGE_BASE}${size}${path}`)}`
    : NO_POSTER;

export const posterUrl = (path) => imageUrl(path, "w500");
export const backdropUrl = (path) => imageUrl(path, "w1280");

export function cancelCatalogRequest() {
  activeRequestController?.abort();
  activeRequestController = null;
}

function normalizeDetails(d) {
  return {
    title: d.title ?? d.name,
    originalTitle: d.original_title ?? d.original_name,
    tagline: d.tagline ?? null,
    overview: d.overview ?? "Описание отсутствует",
    originalCountry: d.origin_country ?? null,
    backdrop: d.backdrop_path ?? null,
    trailer: d.videos?.results?.find((v) => v.type === "Trailer" && v.site === "YouTube")?.key ?? null,
    releaseDate: d.release_date ?? d.first_air_date,
    runtime: d.runtime ?? d.episode_run_time?.[0] ?? null,
    creators:
      [d.creators, d.created_by].find(
        (creators) => Array.isArray(creators) && creators.length > 0,
      ) ??
      d.credits?.crew?.filter(
        (c) => c.job === "Director" || c.job === "Creator",
      ) ??
      [],
    cast: d.credits?.cast?.slice(0, 12) ?? [],
    rating: d.vote_average ?? null,
    genres: d.genres?.map((g) => g.name) ?? [],
    recommendations: d.recommendations?.results?.map(normalize) ?? [],
    budget: d.budget ?? null,
    revenue: d.revenue ?? null,
  }}

export async function fetchDetails(url) {
  if (!url) throw new Error("Не указан URL для запроса деталей");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Ошибка ${res.status}`);
  const data = await res.json();
  return normalizeDetails(data);
}
