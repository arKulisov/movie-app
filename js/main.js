import { MODE, state } from "./config.js";
import { refreshCatalog, loadGenres, genres } from "./api/catalogue.js";

// ─── Инициализация ───
loadGenres().then(() => {
  createFilterGenre();
  refreshCatalog({ mode: MODE.DISCOVER, query: "", page: 1 }); // первичная загрузка фильмов
});

const genreContainer = document.querySelector('[data-type="genres"]');

function createFilterGenre() {
  let count = 0;
  Object.entries(genres).forEach(([id, value]) => {
    let filter = document.createElement("span");
    let genreValue = value[0].toUpperCase() + value.slice(1, value.length);
    filter.dataset.id = id;
    filter.textContent = genreValue;
    if (++count % 3 === 0) filter.style.marginBottom = 10 + "px";
    genreContainer.append(filter);
  });
}

// ─── Поиск ───
const input = document.querySelector(".search__input");
const button = document.querySelector(".search__button");

function handleSearch() {
  const query = input.value.trim();
  if (!query) return;
  refreshCatalog({ mode: MODE.SEARCH, query, page: 1 });
}

button.addEventListener("click", handleSearch);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleSearch();
});

// ─── Фильтры ───
const filters = document.querySelector(".filters");
filters.addEventListener("click", createFilterContainer);

let activeFilter = null;

function createFilterContainer(e) {
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
}

document.addEventListener("click", (e) => {
  if (!activeFilter) return;

  const clickedInside = activeFilter.contains(e.target);
  const clickedButton = e.target.dataset.name === "filter";

  if (clickedInside) return;

  activeFilter.classList.add("filters__dropdown--hidden");
  activeFilter = null;
});

genreContainer.addEventListener("click", onFilterClick);

function onFilterClick(e) {
  const el = e.target;
  if (!el.dataset.id) return;

  const container = el.closest(".filters__dropdown");

  if (container.dataset.type === "genres") {
    const id = Number(e.target.dataset.id);
    e.target.classList.toggle("selected");
    addGenre(id);
  }
}

function addGenre(id) {
  const newGenres = state.genres.includes(id)
    ? state.genres.filter((g) => g !== id)
    : [...state.genres, id];
  refreshCatalog({ genres: newGenres, page: 1 });
}

// ─── Слайдеры ───
let thumbLeft;
let thumbRight;
const sliderYearContainer = document.querySelector('[data-type="year"]');
const sliderRatingContainer = document.querySelector('[data-type="rating"]');
let sliderRange;

let startMouseX = 0;
let startThumbX = 0;
let isDragging = false;
let activeThumb;
let passiveThumb;
let fromValue;
let toValue;
let activeSlider;

sliderYearContainer.addEventListener("pointerdown", handlePointerDown);
sliderRatingContainer.addEventListener("pointerdown", handlePointerDown);

document.addEventListener("pointermove", handleThumbMove);

document.addEventListener("pointerup", handlePointerUp);

function handlePointerDown(e) {
  e.preventDefault();

  if (e.target.tagName === "SPAN") console.log("click");
  activeSlider = e.target
    .closest(".filters__dropdown")
    .querySelector(".slider__track");
  thumbLeft = activeSlider.querySelector(".slider__thumb--left");
  thumbRight = activeSlider.querySelector(".slider__thumb--right");
  sliderRange = activeSlider.querySelector(".slider__active");

  if (e.target.classList.contains("slider__thumb")) {
    isDragging = true;
    startMouseX = e.clientX;

    startThumbX = e.target.offsetLeft;
    activeThumb = e.target;
    passiveThumb =
      e.target.nextElementSibling || e.target.previousElementSibling;
  } else if (
    e.target.classList.contains("slider__active") ||
    e.target.classList.contains("slider__track")
  ) {
    handleSliderClick(e);
  } else if (e.target.closest(".filters__quick")) {
    handleYearSelection(e);
  }
}

function handleThumbMove(e) {
  if (!isDragging) return;

  const currentMouseX = e.clientX;
  const differX = currentMouseX - startMouseX;
  let newThumbX;
  const THUMB_WIDTH = thumbLeft.offsetWidth;

  if (activeThumb === thumbLeft) {
    newThumbX = Math.max(
      -THUMB_WIDTH,
      Math.min(
        startThumbX + differX,
        passiveThumb.offsetLeft - activeThumb.offsetWidth,
      ),
    );
  } else {
    newThumbX = Math.max(
      passiveThumb.offsetLeft + activeThumb.offsetWidth,
      Math.min(startThumbX + differX, activeSlider.offsetWidth),
    );
  }
  activeThumb.style.left = newThumbX + "px";

  updateSlider(thumbLeft.offsetLeft, thumbRight.offsetLeft);

  updateValues();

  updateThumbValue(fromValue, toValue);
}

function handlePointerUp(e) {
  if (!isDragging) return;
  isDragging = false;

  if (sliderYearContainer.contains(activeSlider)) {
    refreshCatalog({
      yearFrom: fromValue,
      yearTo: toValue,
      page: 1,
    });
  } else if (sliderRatingContainer.contains(activeSlider)) {
    refreshCatalog({
      ratingFrom: fromValue,
      ratingTo: toValue,
      page: 1,
    });
  }
}

function updateSlider(leftX, rightX) {
  sliderRange.style.left = leftX + thumbLeft.offsetWidth + "px";
  sliderRange.style.width = rightX - leftX - thumbLeft.offsetWidth + "px";
}

function posToValues(x) {
  const percent = x / activeSlider.offsetWidth;

  if (sliderYearContainer.contains(activeSlider)) {
    const minYear = 1900;
    const maxYear = new Date().getFullYear();

    return Math.round(minYear + percent * (maxYear - minYear));
  } else if (sliderRatingContainer.contains(activeSlider)) {
    const minRating = 0;
    const maxRating = 10;

    return (minRating + percent * (maxRating - minRating)).toFixed(1);
  }
}

function handleSliderClick(e) {
  const rect = activeSlider.getBoundingClientRect();
  let clickX = e.clientX - rect.left;

  clickX = Math.max(0, Math.min(clickX, activeSlider.offsetWidth));

  let centerLeft = thumbLeft.offsetLeft + thumbLeft.offsetWidth / 2;
  let centerRight = thumbRight.offsetLeft + thumbRight.offsetWidth / 2;

  let distanceLeft = Math.abs(centerLeft - clickX);
  let distanceRight = Math.abs(centerRight - clickX);

  if (distanceLeft < distanceRight) {
    const newLeftX = clickX - thumbLeft.offsetWidth;

    thumbLeft.style.left = `${newLeftX}px`;

    updateSlider(newLeftX, thumbRight.offsetLeft);
  } else {
    thumbRight.style.left = clickX + "px";

    updateSlider(thumbLeft.offsetLeft, clickX);
  }
  updateValues();
  updateThumbValue(fromValue, toValue);

  if (sliderYearContainer.contains(activeSlider)) {
    refreshCatalog({
      yearFrom: fromValue,
      yearTo: toValue,
      page: 1,
    });
  } else if (sliderRatingContainer.contains(activeSlider)) {
    refreshCatalog({
      ratingFrom: fromValue,
      ratingTo: toValue,
      page: 1,
    });
  }
}

function updateThumbValue(valueOne, valuTwo) {
  thumbLeft.querySelector("span").textContent = valueOne;
  thumbRight.querySelector("span").textContent = valuTwo;
}

function updateValues() {
  fromValue = posToValues(thumbLeft.offsetLeft + thumbLeft.offsetWidth);

  toValue = posToValues(thumbRight.offsetLeft);
}

const yearSelection = document.querySelector(".filters__quick");

function handleYearSelection(e) {
  if (e.target.tagName !== "SPAN") return;

  const minYear = 1900;
  const maxYear = new Date().getFullYear();

  fromValue = Number(e.target.dataset.year);
  toValue = Math.min(fromValue + 10, maxYear);

  const percentLeft = (fromValue - minYear) / (maxYear - minYear);
  const percentRight = (toValue - minYear) / (maxYear - minYear);

  const leftX = percentLeft * activeSlider.offsetWidth - thumbLeft.offsetWidth;
  const rightX = percentRight * activeSlider.offsetWidth;

  thumbLeft.classList.add("thumb-move");
  thumbRight.classList.add("thumb-move");

  thumbLeft.style.left = leftX + "px";
  thumbRight.style.left = rightX + "px";

  thumbLeft.classList.remove("thumb-move");
  thumbRight.classList.remove("thumb-move");

  updateThumbValue(fromValue, toValue);

  updateSlider(leftX, rightX);

  refreshCatalog({
    yearFrom: fromValue,
    yearTo: toValue,
    page: 1,
  });
}

const SortContainer = document.querySelector(
  ".filters__group--sort .filters__dropdown",
);

SortContainer.addEventListener("click", handleSortingClick);

function handleSortingClick(e) {
  if (e.target.tagName !== "SPAN") return;
  let selected = e.target;

  let container = e.target.closest(".filters__dropdown");

  let activeSpan = container.querySelector(".selected");

  if (activeSpan) activeSpan.classList.remove("selected");

  selected.classList.add("selected");

  console.log(selected.dataset.sort);
  refreshCatalog({ sortBy: selected.dataset.sort, page: 1 });
}