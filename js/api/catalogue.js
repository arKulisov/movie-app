import { BASE, PROXY, MODE } from "../config.js";
import { renderMovieCard } from "../ui/catalogueView.js";
import { state, setState } from "../state.js"

// ─── URL ───
export function buildURL(s) {
  const url = new URL(s.mode, BASE);
  const p = url.searchParams;

  p.set("language", "ru-RU");
  p.set("page", s.page);

  if (s.mode === MODE.SEARCH) {
    p.set("query", s.query);
  } else {
    p.set("sort_by", s.sortBy);
    if (s.genres.length) p.set("with_genres", s.genres.join(","));
    if (s.yearFrom != null)
      p.set("primary_release_date.gte", `${s.yearFrom}-01-01`);
    if (s.yearTo != null)
      p.set("primary_release_date.lte", `${s.yearTo}-12-31`);
    if (s.ratingFrom != null) p.set("vote_average.gte", s.ratingFrom);
    if (s.ratingTo != null) p.set("vote_average.lte", s.ratingTo);
  }

  return `${PROXY}?url=${encodeURIComponent(url.toString())}`;
}

// ─── Жанры ───
export const genres = {};

export async function loadGenres() {
  try {
    const target =
      "https://api.themoviedb.org/3/genre/movie/list?language=ru-RU";
    const response = await fetch(`${PROXY}?url=${encodeURIComponent(target)}`);
    if (!response.ok) throw new Error("Не удалось загрузить жанры");
    const data = await response.json();
    Object.assign(genres, Object.fromEntries(data.genres.map((g) => [g.id, g.name])));
  } catch (err) {
    console.log(err.message);
  }
}

// ─── Нормализация ───
function normalize(r) {
  return {
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
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error(`Ошибка ${response.status}`);

    const data = await response.json();

    if (controller !== activeRequestController) return;

    return data.results
      .filter((r) => r.media_type !== "person")
      .map(normalize);
  } catch (err) {
    if (err.name === "AbortError") return;
    console.log(err.message);
  } finally {
    if (controller === activeRequestController) {
      activeRequestController = null;
    }
  }
}

// ─── Постеры ───
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const NO_POSTER = "img/no-poster.svg";

export const posterUrl = (path) =>
  path ? `${PROXY}?url=${encodeURIComponent(TMDB_IMG + path)}` : NO_POSTER;
