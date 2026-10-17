import { MODE, MAIN } from "../config.js";
import { state, setState, defaultState } from "./catalogState.js";
import {
  buildURL,
  loadGenres,
  searchMovies,
  genres,
} from "./catalogApi.js";
import { renderMovieCard, renderGenres } from "./catalogView.js";
import { initSlider } from "./rangeSlider.js";

export async function initCatalogue() {
  applyGenres();
  initSlider();

  // await refreshCatalog(MODE.movie);
  showMain();
  initInfiniteScroll();
}
export async function refreshCatalog(changes = {}, search = false) {
  setState(changes);

  if (!search) {
    await loadGenres();
    renderGenres();
  }
  const result = await searchMovies(buildURL(state));
  // console.log(state.page);
  if (result) renderMovieCard(result);
}

const categoryGroup = document.querySelector(".category");
categoryGroup.addEventListener("pointerdown", applyCategory);
function applyCategory(e) {
  const category = e.target.closest(".category__name");
  if (!category || !categoryGroup.contains(category)) return;

  if (category.dataset.mode === "main") return showMain();

  refreshCatalog({
    ...MODE[category.dataset.mode],
    genres: [],
    yearFrom: null,
    yearTo: null,
    ratingFrom: null,
    ratingTo: null,
  });
}
const content = document.querySelector(".content");

const collectionTemplate = document.querySelector("#collection");
let rowsController = null;

function showMain() {
  rowsController?.abort();
  rowsController = new AbortController();
  const { signal } = rowsController;

  content.classList.add("content--main");
  content.replaceChildren();

  MAIN.forEach((row) => {
    const fragment = collectionTemplate.content.cloneNode(true);
    const target = fragment.querySelector(".collection__content");
    fragment.querySelector(".collection__title").textContent = row.title;
    content.append(fragment);

    loadRow(row, target, signal);
  });
}

async function loadRow(row, target, signal) {
  try {
    const { items } = await fetchCatalog(
      buildURL({ ...defaultState, ...row }),
      signal,
    );
    renderMovieCard(items, { target });
  } catch (err) {
    if (err.name === "AbortError") return;
    target.textContent = "Не удалось загрузить подборку";
  }
}



const input = document.querySelector(".search__input");
const button = document.querySelector(".search__button");
button.addEventListener("click", applySearch);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") applySearch();
});

function applySearch() {
  const query = input.value.trim();
  if (!query) return;
  refreshCatalog({ mode: MODE.SEARCH_MULTI, query, page: 1 }, true);
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

function initInfiniteScroll() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) loadMore();
      });
    },
    { rootMargin: "100px" },
  );
  observer.observe(sentinel);
}

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
