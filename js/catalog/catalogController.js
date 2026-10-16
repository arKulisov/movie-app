import { MODE } from "../config.js";
import { state, setState } from "./catalogState.js";
import { buildURL, loadGenres, searchMovies, genres } from "./catalogApi.js";
import { renderMovieCard, renderGenres } from "./catalogView.js";
import { initSlider } from "./rangeSlider.js";

export async function initCatalogue() {
  const genres = await loadGenres();

  renderGenres();
  applyGenres();
  applySearch();
  initSlider();

  await refreshCatalog({ mode: MODE.DISCOVER_MOVIE, page: 1 });
}

export async function refreshCatalog(changes = {}) {
  setState(changes);
  const result = await searchMovies(buildURL(state));
  if (result) renderMovieCard(result);
}

function applySearch() {
  const input = document.querySelector(".search__input");
  const button = document.querySelector(".search__button");

  const query = input.value.trim();
  if (!query) return;
  refreshCatalog({ mode: MODE.SEARCH_MULTI, query, page: 1 });

  button.addEventListener("click", applySearch);
  input.addEventListener("keydown", (e) => {
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

const sortContainer = document.querySelector(
  ".filters__group--sort .filters__dropdown",
);
sortContainer.addEventListener("click", handleSortingClick);
restoreSortState();

function handleSortingClick(e) {
  const item = e.target.closest("[data-sort]");
  if (!item) return;

  selectSort(item);
  sortContainer.closest("details").open = false;
  refreshCatalog({ sortBy: item.dataset.sort, page: 1 });
}

function selectSort(item) {
  sortContainer.querySelector(".selected")?.classList.remove("selected");
  item.classList.add("selected");
  sortContainer.closest("details").querySelector("summary").textContent =
    item.textContent;
}

function restoreSortState() {
  const item = sortContainer.querySelector(`[data-sort="${state.sortBy}"]`);
  if (item) selectSort(item);
}


const sentinel = document.querySelector("#sentinel");
const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) loadMore();
    });
  },
  { rootMargin: "300px" }
);
observer.observe(sentinel)

let isLoading = false;
let totalPages = 500;

async function loadMore() {
  if (isLoading || state.page >= totalPages) return;
  isLoading = true;
  state.page += 1;   
  try {
    const result = await searchMovies(buildURL(state));
    if (!result) return; 
    renderMovieCard(result, { append: true });
  } finally {
    isLoading = false;
  }
}
