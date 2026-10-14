import { MODE } from "../config.js";
import { state, setState } from "./catalogState.js";
import { buildURL, loadGenres, searchMovies, genres } from "./catalogApi.js";
import { renderMovieCard, renderFilters } from "./catalogView.js";
import { initSlider } from "./rangeSlider.js";

export async function initCatalogue() {
  const genres = await loadGenres();

  renderFilters();
  applyGenres();
  applySearch();
  initSlider();

  await refreshCatalog({ mode: MODE.DISCOVER, page: 1 });
}

export async function refreshCatalog(changes = {}) {
  setState(changes);
  const items = await searchMovies(buildURL(state));
  if (items) renderMovieCard(items);
}

function applySearch() {
    const input = document.querySelector(".search__input");
  const button = document.querySelector(".search__button");

  const query = input.value.trim();
  if (!query) return;
  refreshCatalog({ mode: MODE.SEARCH, query, page: 1 });

  button.addEventListener("click", applySearch);
  input.addEventListener("keydown", (e) => {
    console.log('enter')
    if (e.key === "Enter") applySearch();
  });
}

const genreContainer = document.querySelector(".filters__group--genres");

function applyGenres() {
  genreContainer.addEventListener("click", (e) => {
    const el = e.target;
    if (!el.dataset.id) return;

    const id = Number(el.dataset.id);
    e.target.classList.toggle("selected");

    const newGenres = state.genres.includes(id)
      ? state.genres.filter((g) => g !== id)
      : [...state.genres, id];
    refreshCatalog({ genres: newGenres, page: 1 });
  });
}

document.addEventListener("pointerdown", (e) => {
    document.querySelectorAll(".filters details[open]").forEach((d) => {
      if (!d.contains(e.target)) d.open = false;
    });
  });