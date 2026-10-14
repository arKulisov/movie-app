import { posterUrl, genres } from "./catalogApi.js";
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


export function renderFilters() {
  const genreContainer = document.querySelector('.filters__dropdown');
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