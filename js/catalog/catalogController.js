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
import { renderMovieCard, renderGenres } from "./catalogView.js";
import { initSlider } from "./rangeSlider.js";

const content = document.querySelector(".content");
const collectionTemplate = document.querySelector("#collection");
const sentinel = document.querySelector("#sentinel");

// Растёт при каждой смене экрана (категория, поиск, главная).
// Каждый запрос запоминает своё значение и после await сверяется:
// если число изменилось, ответ устарел, и рисовать его нельзя.
let navId = 0;
let isLoading = false;
let totalPages = 1;
let rowsController = null;
let observer = null;

const isMainShown = () => content.classList.contains("content--main");

export async function initCatalogue() {
  applyGenres();
  initSlider();

  showMain();
  initCollectionScroll()
  initInfiniteScroll();
}

export async function refreshCatalog(changes = {}, search = false) {
  const id = ++navId;
  isLoading = true; // пока не пришла первая страница, подгрузка закрыта
  totalPages = 1;

  leaveMain();
  content.replaceChildren();
  setState(changes);

  try {
    if (!search) {
      await loadGenres();
      if (id !== navId) return; // пока грузились жанры, ушли на другой экран
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
categoryGroup.addEventListener("click", applyCategory); // click, а не pointerdown: лента категорий на телефоне прокручивается

function applyCategory(e) {
  const category = e.target.closest(".category__name");
  if (!category) return;

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

// ─── Главная: подборки ───
async function showMain() {
  navId++; // всё, что ещё грузится для прошлого экрана, теперь устарело
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

// ─── Поиск ───
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

// ─── Жанры ───
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



function initCollectionScroll() {
  content.addEventListener('wheel', (e) => {
    const el = e.target.closest('.collection__content');
    if (!el) return;

    if (el.scrollWidth <= el.clientWidth) return;
    if (e.deltaY === 0) return;

    const atStart = el.scrollLeft <= 0;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
    if ((e.deltaY < 0 && atStart) || (e.deltaY > 0 && atEnd)) return;

    e.preventDefault();
    el.scrollLeft += e.deltaY;
  }, { passive: false });
}



content.addEventListener("pointerdown", async (e) => {
  const card = e.target.closest(".movie-card");
  if (!card) return;
  const id = card.dataset.id;
  const type = card.dataset.type;
  if (!id || !type) return;
  console.log(`Clicked on card: id=${id}, type=${type}`);

  const url = buildDetailsURL(id, type);
  const details = await fetchDetails(url);
  console.log("Fetched details:", details);
  // renderDetails(details, type);
})