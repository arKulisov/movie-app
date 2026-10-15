import { posterUrl, genres } from "./catalogApi.js";
import { state } from "./catalogState.js";
const content = document.querySelector(".content");
const movieCardTemplate = document.querySelector("#movie-card");

export function renderMovieCard(items) {
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


export function renderGenres() {
  const genreContainer = document.querySelector('[data-type="genres"]');
  let count = 0;
  Object.entries(genres).forEach(([id, value]) => {
    let genre = document.createElement("span");
    let genreValue = value[0].toUpperCase() + value.slice(1, value.length);
    genre.dataset.id = id;
    genre.textContent = genreValue;

    if (state.genres.includes(Number(id))) genre.classList.add('selected');
    if (++count % 3 === 0) genre.style.marginBottom = 10 + "px";
    genreContainer.append(genre);
  });
}
