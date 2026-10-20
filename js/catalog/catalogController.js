import { MODE, MAIN } from "../config.js";
import { state, setState, defaultState } from "./catalogState.js";
import {
  buildURL,
  loadGenres,
  searchMovies,
  fetchCatalog,
  cancelCatalogRequest,
  buildDetailsURL,
  fetchDetails
} from "./catalogApi.js";
import { renderMovieCard, renderGenres, renderDetails } from "./catalogView.js";
import { initSlider } from "./rangeSlider.js";

const content = document.querySelector(".content");
const collectionTemplate = document.querySelector("#collection");
const sentinel = document.querySelector("#sentinel");
const main = document.querySelector(".main");


let navId = 0;
let isLoading = false;
let totalPages = 1;
let rowsController = null;
let observer = null;
let activeScreen = null;

const isMainShown = () => content.classList.contains("content--main");

export async function initCatalogue() {
  applyGenres();
  initSlider();
  showMain();
  initInfiniteScroll();
}

export async function refreshCatalog(changes = {}, search = false) {
  const id = ++navId;
  isLoading = true;
  totalPages = 1;

  leaveMain();
  content.replaceChildren();
  setState(changes);

  try {
    if (!search) {
      await loadGenres();
      if (id !== navId) return; 
      renderGenres();
    }

    const result = await searchMovies(buildURL(state));
    if (id !== navId || !result) return;

    totalPages = result.totalPages;
    renderMovieCard(result);
    recheck();
  } catch (err) {
    if (id === navId) console.error(err);
  } finally {
    if (id === navId) isLoading = false;
  }
}

const categoryGroup = document.querySelector(".category");
categoryGroup.addEventListener("click", applyCategory);

let genresLoaded = false;
async function applyCategory(e) {
  if (!genresLoaded) {
    await renderGenres(loadGenres());
    genresLoaded = true;
  }
  const category = e.target.closest(".category__name");
  if (!category) return;

  const mode = category.dataset.mode;
  if (activeScreen === mode) return;
  activeScreen = mode;

  if (mode === "main") return showMain();

  refreshCatalog({
    ...MODE[category.dataset.mode],
    genres: [],
    yearFrom: null,
    yearTo: null,
    ratingFrom: null,
    ratingTo: null,
  });
}

// ─── Главная: подборки ───
async function showMain() {
  navId++;
  isLoading = false;
  cancelCatalogRequest();
  rowsController?.abort();
  rowsController = new AbortController();
  const { signal } = rowsController;

  content.classList.add("content--main");
  content.replaceChildren();

  MAIN.forEach((row) => {
    const fragment = collectionTemplate.content.cloneNode(true);
    const target = fragment.querySelector(".collection__content");
    fragment.querySelector(".collection__title").textContent = row.title;
    initCollectionScroll(target);
    content.append(fragment);
    loadRow(row, target, signal);
  });
}

function leaveMain() {
  rowsController?.abort();
  content.classList.remove("content--main");
}

async function loadRow(row, target, signal) {
  let result;
  try {
    result = await fetchCatalog(buildURL({ ...defaultState, ...row }), signal);
  } catch (err) {
    if (err.name === "AbortError") return;
    console.error(row.title, err);
    target.textContent = "Не удалось загрузить подборку";
    return;
  }

  if (signal.aborted) return; // ушли с главной, пока шёл запрос
  renderMovieCard(result, { target, type: row.version });
}


const input = document.querySelector(".search__input");
const button = document.querySelector(".search__button");
button.addEventListener("click", applySearch);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") applySearch();
});

function applySearch() {
  activeScreen = "search";
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




function initInfiniteScroll() {
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) loadMore();
    },
    { rootMargin: "100px" },
  );
  observer.observe(sentinel);
}

function recheck() {
  if (!observer) return;
  observer.unobserve(sentinel);
  observer.observe(sentinel);
}

async function loadMore() {
  if (isMainShown() || isLoading || state.page >= totalPages) return;
  isLoading = true;

  const id = navId;
  const nextPage = state.page + 1;

  try {
    const result = await searchMovies(buildURL({ ...state, page: nextPage }));
    if (!result || id !== navId) return; 

    state.page = nextPage;
    totalPages = result.totalPages;
    renderMovieCard(result, { append: true });
    recheck();
  } catch (err) {
    if (id === navId) console.error(err);
  } finally {
    if (id === navId) isLoading = false;
  }
}



function initCollectionScroll(collection) {
  collection.addEventListener("wheel", (e) => {
    if (collection.scrollWidth <= collection.clientWidth) return;
    if (e.deltaY === 0) return;

    const atStart = collection.scrollLeft <= 0;
    const atEnd =
      collection.scrollLeft + collection.clientWidth >=
      collection.scrollWidth - 1;
    if ((e.deltaY < 0 && atStart) || (e.deltaY > 0 && atEnd)) return;

    e.preventDefault();
    collection.scrollLeft += e.deltaY;
  }, { passive: false });
}

content.addEventListener("pointerdown", async (e) => {
  activeScreen = "details";
  const card = e.target.closest(".movie-card");
  if (!card) return;
  const id = card.dataset.id;
  const type = card.dataset.type;
  if (!id || !type) return;
  console.log(`Clicked on card: id=${id}, type=${type}`);

  const url = buildDetailsURL(id, type);
  console.log(`Fetching details from URL: ${url}`);
  const details = await fetchDetails(url);
  console.log("Fetched details:", details);
  const src = card.querySelector(".movie-card__poster").src;
  renderDetails(details, src)
})

const categoryShift = document.querySelector(".category .shift__button");
const filtersShift = document.querySelector(".filters .shift__button");
categoryShift.addEventListener('pointerdown', (e) => {
  main.classList.toggle('is-category-hidden')
})
filtersShift.addEventListener('pointerdown', (e) => {
  main.classList.toggle('is-filters-hidden')
})