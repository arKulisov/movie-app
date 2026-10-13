const defaultState = {
  mode: "discover/movie",
  query: "",
  page: 1,

  genres: [],
  yearFrom: null,
  yearTo: null,
  ratingFrom: null,
  ratingTo: null,

  sortBy: "popularity.desc",
};


const BASE = "https://api.themoviedb.org/3/";

const PROXY = "https://proxy-worker.arkulisov.workers.dev/";

const MODE = {
  DISCOVER: "discover/movie",
  SEARCH: "search/movie",
};

const state = buildState();
const input = document.querySelector(".search__input");
const searchButton = document.querySelector(".search__button");
const content = document.querySelector(".content");
const filters = document.querySelector(".filters");

const loader = document.querySelector("#loader");

let genres = {};
loadGenres().then(() => {
  createFilterGenre();
});

function buildState() {
  const savedState = localStorage.getItem("state");

  if (!savedState) {
    return { ...defaultState };
  }

  try {
    return {
      ...defaultState,
      ...JSON.parse(savedState),
    };
  } catch {
    localStorage.removeItem("state");
    return { ...defaultState };
  }
}

function updateState(changes) {
  Object.assign(state, changes);
  localStorage.setItem("state", JSON.stringify(state));
}

updateAll({});

function buildURL(state) {
  let url = new URL(state.mode, BASE);
  const p = url.searchParams;

  p.set("language", "ru-RU");
  p.set("page", state.page);

  if (state.mode === MODE.SEARCH) {
    p.set("query", state.query);
  } else {
    p.set("sort_by", state.sortBy);
  if (state.genres.length) p.set("with_genres", state.genres.join(","));
  if (state.yearFrom != null)
    p.set("primary_release_date.gte", `${state.yearFrom}-01-01`);
  if (state.yearTo != null)
    p.set("primary_release_date.lte", `${state.yearTo}-12-31`);
  if (state.ratingFrom != null) p.set("vote_average.gte", state.ratingFrom);
  if (state.ratingTo != null) p.set("vote_average.lte", state.ratingTo);
  }

  return `${PROXY}?url=${encodeURIComponent(url.toString())}`;
}

function updateAll(value) {
  updateState(value);

  const url = buildURL(state);
  searchMovies(url);
}

searchButton.addEventListener("click", handleSearch);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleSearch();
});


function handleSearch() {
  const query = input.value.trim();
  if (!query) return;
  updateAll({ mode: MODE.SEARCH, query, page: 1 });
}

let activeRequestController = null;

async function searchMovies(url) {
  loader.classList.remove("loader--hidden");

  activeRequestController?.abort();

  const controller = new AbortController();
  activeRequestController = controller;

  
  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json"
      },
    });
    if (!response.ok) throw new Error("Ошибка");

    const data = await response.json();

     if (controller !== activeRequestController) {
      return;
    }


    const items = data.results
      .filter((r) => r.media_type !== "person")
      .map(normalize);

    renderMovieCard(items);
  } catch (err) {
    console.log(err.message);
  } finally {
    if (controller === activeRequestController) {
      loader.classList.add("loader--hidden");
      activeRequestController = null;
    }
  }
}

function normalize(r) {
  return {
    type: r.media_type, // 'movie' или 'tv'
    title: r.title ?? r.name,
    date: r.release_date ?? r.first_air_date,
    poster: r.poster_path,
    rating: r.vote_average,
    genreIds: r.genre_ids ?? [],
  };
}

const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const NO_POSTER = "img/no-poster.svg";

const posterUrl = (path) =>
  path
    ? `${PROXY}?url=${encodeURIComponent(TMDB_IMG + path)}`
    : NO_POSTER;

const movieCardTemplate = document.querySelector("#movie-card");

function renderMovieCard(items) {
  content.innerHTML = "";

  items.forEach((item) => {
    const card = movieCardTemplate.content.cloneNode(true);

    const img = card.querySelector(".movie-card__poster");
    img.src = posterUrl(item.poster);
    img.alt = item.title;

    card.querySelector(".movie-card__name").textContent = item.title;
    card.querySelector(".movie-card__genres").textContent = item.genreIds
      .map((id) => genres[id])
      .filter(Boolean)
      .join(", ");
    card.querySelector(".movie-card__rating").textContent = item.rating
      ? item.rating.toFixed(1)
      : "—";
    card.querySelector(".movie-card__year").textContent = item.date
      ? item.date.slice(0, 4)
      : "—";

    content.append(card);
  });
}

async function loadGenres() {
  try {
    const target = "https://api.themoviedb.org/3/genre/movie/list?language=ru-RU";
    let response = await fetch(`${PROXY}?url=${encodeURIComponent(target)}`);
    if (!response.ok) throw new Error("Не удалось загрузить Жанры");
    const data = await response.json();

    console.log("Сырые жанры", data);
    genres = Object.fromEntries(data.genres.map((g) => [g.id, g.name]));
  } catch (err) {
    console.log(err.message);
  }
}

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
  updateAll({ genres: newGenres });
}

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
    updateAll({
      yearFrom: fromValue,
      yearTo: toValue,
    });
  } else if (sliderRatingContainer.contains(activeSlider)) {
    updateAll({
      ratingFrom: fromValue,
      ratingTo: toValue,
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
    const newLeftX =
    clickX - thumbLeft.offsetWidth;

  thumbLeft.style.left = `${newLeftX}px`

    updateSlider(newLeft, thumbRight.offsetLeft);
  } else {
    thumbRight.style.left = clickX + "px";

    updateSlider(thumbLeft.offsetLeft, clickX);
  }
  updateValues();
  updateThumbValue(fromValue, toValue);

  if (sliderYearContainer.contains(activeSlider)) {
    updateAll({
      yearFrom: fromValue,
      yearTo: toValue,
    });
  } else if (sliderRatingContainer.contains(activeSlider)) {
    updateAll({
      ratingFrom: fromValue,
      ratingTo: toValue,
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

  updateAll({
    yearFrom: fromValue,
    yearTo: toValue,
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
  updateAll({ sortBy: selected.dataset.sort });
}
