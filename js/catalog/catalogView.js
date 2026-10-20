import { posterUrl, backdropUrl } from "./catalogApi.js";
import { state } from "./catalogState.js";
import { genres } from "./catalogApi.js";
import { altGenreNames, MAIN } from "../config.js";
const content = document.querySelector(".content");
const movieCardTemplate = document.querySelector("#movie-card");
const detailsTemplate = document.querySelector("#movie-screen");




export function renderMovieCard(
  result,
  { target = content, append = false, type = state.version } = {},
) {
  let items = result.items;
  if (!append) target.replaceChildren();
  items.forEach((item) => {
    const card = movieCardTemplate.content.cloneNode(true);
    const movieCard = card.querySelector(".movie-card");
    movieCard.dataset.id = item.id;
    movieCard.dataset.type = item.type ?? type;

    const img = card.querySelector(".movie-card__poster");
    img.src = posterUrl(item.poster);
    img.alt = item.title;
    card.querySelector(".movie-card__rating").textContent = item.rating
      ? item.rating.toFixed(1)
      : "—";

    target.append(card);
  });
}

export function renderGenres() {
  const genreContainer = document.querySelector('[data-type="genres"]');
  genreContainer.replaceChildren();
  let count = 0;
  Object.entries(genres).forEach(([id, value]) => {
    let genre = document.createElement("span");
    let genreValue = value[0].toUpperCase() + value.slice(1, value.length);
    // console.log(genreValue);
    if (altGenreNames.get(genreValue))
      genreValue = altGenreNames.get(genreValue);
    genre.dataset.id = id;
    genre.classList.add("filters__list-item");
    genre.textContent = genreValue;

    if (state.genres.includes(Number(id))) genre.classList.add("selected");
    if (++count % 3 === 0) genre.style.marginBottom = 10 + "px";
    genreContainer.append(genre);
  });
}

export function renderDetails(details, src) {
  content.replaceChildren();

  const screen = detailsTemplate.content.cloneNode(true);

  const backdrop = screen.querySelector(".movie-screen__backdrop");
  if (details.backdrop) {
    backdrop.src = backdropUrl(details.backdrop);
    backdrop.alt = details.title + " backdrop";
  } else {
    backdrop.style.backgroundColor = "#222";
  }
  const title = screen.querySelector(".movie-screen__title");
  title.textContent = details.title;

  const poster = screen.querySelector(".movie-screen__poster");
  poster.src = src;
  poster.alt = details.title;

  const overview = screen.querySelector(".movie-screen__overview");
  overview.textContent = details.overview;

  const tagline = screen.querySelector(".movie-screen__tagline");
  tagline.textContent = details.tagline || "";
  tagline.style.display = details.tagline ? "block" : "none";

  const rating = screen.querySelector(".movie-screen__rating");
  rating.textContent = details.rating.toFixed(1);

  const genres = screen.querySelector(".movie-screen__genres");
  genres.textContent = details.genres.join(", ");

  const runtime = screen.querySelector(".movie-screen__runtime");
  runtime.textContent = details.runtime ? `${details.runtime} мин.` : "—";

  const creators = screen.querySelector(".movie-screen__creators-list");
  const cast = screen.querySelector(".movie-screen__cast-list");
  creators.replaceChildren(createPeopleCards(details.creators));
  cast.replaceChildren(createPeopleCards(details.cast));
  content.append(screen);
}

function createPeopleCards(people = []) {
  const fragment = document.createDocumentFragment();

  people.forEach((person) => {
    const item = document.createElement("li");
    const link = document.createElement("a");
    const img = document.createElement("img");
    const name = document.createElement("span");
    const role = document.createElement("span");

    link.dataset.id = person.id;
    link.classList.add("movie-screen__cast-link");

    img.src = posterUrl(person.profile_path);
    img.alt = person.name;
    img.classList.add("movie-screen__cast-poster");

    name.textContent = person.name;
    name.classList.add("movie-screen__cast-name");

    role.textContent = person.character ?? person.job ?? "";
    role.classList.add("movie-screen__cast-character");

    link.append(img, name);
    if (role.textContent) link.append(role);

    item.append(link);
    fragment.append(item);
  });

  return fragment;
}