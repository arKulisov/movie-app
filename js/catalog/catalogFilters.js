import { MODE } from "../config.js";
import { loadGenres, genres } from "./catalogApi.js";
import { refreshCatalog } from "./catalogController.js";
import { state } from "./catalogState.js";

export function initFilters() {
  initDropdowns();
  initGenres();
}

const genreContainer = document.querySelector(".filters__dropdown");

function initDropdowns() {
  let activeFilter = null;

  const filters = document.querySelector(".filters");
  filters.addEventListener("click", (e) => {
    if (e.target.dataset.name !== "filter") return;

    e.stopPropagation();

    const container = e.target.nextElementSibling;

    if (activeFilter === container) {
      activeFilter.classList.add("filters__dropdown--hidden");
      activeFilter = null;
      return;
    }

    activeFilter = container;
    activeFilter.classList.remove("filters__dropdown--hidden");
  });

  document.addEventListener("click", (e) => {
    if (!activeFilter) return;

    const clickedInside = activeFilter.contains(e.target);
    //   const clickedButton = e.target.dataset.name === "filter";

    if (clickedInside) return;

    activeFilter.classList.add("filters__dropdown--hidden");
    activeFilter = null;
  });
}

// ─── Фильтры ───

function initGenres() {
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
