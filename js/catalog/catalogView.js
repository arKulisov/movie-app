import { posterUrl } from "./catalogApi.js";
import { state } from "./catalogState.js";
import { genres } from "./catalogApi.js";
const content = document.querySelector(".content");
const movieCardTemplate = document.querySelector("#movie-card");

export function renderMovieCard(result, { append = false } = {}) {
  let items = result.items;
  if (!append) content.replaceChildren();
  items.forEach((item) => {
    const card = movieCardTemplate.content.cloneNode(true);

    const img = card.querySelector(".movie-card__poster");
    img.src = posterUrl(item.poster);
    img.alt = item.title;
    card.querySelector(".movie-card__rating").textContent = item.rating
      ? item.rating.toFixed(1)
      : "—";

    content.append(card);
  });
}

export function renderGenres() {
  const genreContainer = document.querySelector('[data-type="genres"]');
  genreContainer.replaceChildren();
  let count = 0;
  Object.entries(genres).forEach(([id, value]) => {
    let genre = document.createElement("span");
    let genreValue = value[0].toUpperCase() + value.slice(1, value.length);
    genre.dataset.id = id;
    genre.textContent = genreValue;

    if (state.genres.includes(Number(id))) genre.classList.add("selected");
    if (++count % 3 === 0) genre.style.marginBottom = 10 + "px";
    genreContainer.append(genre);
  });
}
