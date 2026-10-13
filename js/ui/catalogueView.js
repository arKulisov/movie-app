import { posterUrl, genres } from "../api/catalogue.js";
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