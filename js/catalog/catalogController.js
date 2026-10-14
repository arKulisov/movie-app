import { MODE } from "../config.js";
import { state, setState } from "./catalogState.js";
import { buildURL, loadGenres, searchMovies, genres } from "./catalogApi.js";
import { renderMovieCard, renderFilters } from "./catalogView.js";
import { initFilters } from "./catalogFilters.js";
import { initSlider } from "./rangeSlider.js";

export async function initCatalogue() {
  const genres = await loadGenres();

  renderFilters();
  applySearch();
  initFilters();
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
