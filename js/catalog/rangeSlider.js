import { refreshCatalog } from "./catalogController.js";
import { state } from "./catalogState.js";

// ─── Слайдеры ───
const filters = document.querySelector(".filters");

// всё, чем год отличается от рейтинга
const SLIDERS = {
  year: {
    min: 1900,
    max: new Date().getFullYear(),
    decimals: 0,
    from: "yearFrom",
    to: "yearTo",
  },
  rating: { min: 0, max: 10, decimals: 1, from: "ratingFrom", to: "ratingTo" },
};

let thumbLeft;
let thumbRight;
let sliderRange;
let sliderTrack;
let activeSlider;
let activeType;

let startMouseX = 0;
let startThumbX = 0;
let isDragging = false;
let activeThumb;
let passiveThumb;
let fromValue;
let toValue;

export function initSlider() {
  filters.addEventListener("pointerdown", handlePointerDown);
  document.addEventListener("pointermove", handleThumbMove);
  document.addEventListener("pointerup", handlePointerUp);
  document.addEventListener("pointercancel", handlePointerUp);


  filters.addEventListener("toggle", (e) => {
    if (e.target.open) restoreSliderState();
    },
    true,
  );
}

function restoreSliderState() {
  for (const type of Object.keys(SLIDERS)) {
    const cfg = SLIDERS[type];
    const from = state[cfg.from];
    const to = state[cfg.to];
    if (from == null || to == null) continue;

    selectSlider(document.querySelector(`[data-type="${type}"]`));
    if (!sliderTrack.offsetWidth) continue;

    setSliderValues(Number(from), Number(to));
  }
}

function selectSlider(container) {
  activeType = container.dataset.type;
  activeSlider = container.querySelector(".slider");
  sliderTrack = activeSlider.querySelector(".slider__track");
  thumbLeft = activeSlider.querySelector(".slider__thumb--left");
  thumbRight = activeSlider.querySelector(".slider__thumb--right");
  sliderRange = activeSlider.querySelector(".slider__active");
}

function handlePointerDown(e) {
  const container = e.target.closest(".filters__dropdown");
  if (!container?.querySelector(".slider")) return; 

  e.preventDefault();
  selectSlider(container);

  const thumb = e.target.closest(".slider__thumb");

  if (thumb) {
    isDragging = true;
    startMouseX = e.clientX;
    startThumbX = thumb.offsetLeft;
    activeThumb = thumb;
    passiveThumb = thumb === thumbLeft ? thumbRight : thumbLeft;
  } else if (e.target.closest(".slider__track")) {
    handleSliderClick(e);
  } else if (e.target.closest(".filters__quick")) {
    handleYearSelection(e);
  }
}

function handleThumbMove(e) {
  if (!isDragging) return;

  const differX = e.clientX - startMouseX;
  const THUMB_WIDTH = thumbLeft.offsetWidth;

  const newThumbX =
    activeThumb === thumbLeft
      ? Math.max(
          -THUMB_WIDTH,
          Math.min(
            startThumbX + differX,
            passiveThumb.offsetLeft - activeThumb.offsetWidth,
          ),
        )
      : Math.max(
          passiveThumb.offsetLeft + activeThumb.offsetWidth,
          Math.min(startThumbX + differX, sliderTrack.offsetWidth),
        );

  activeThumb.style.left = newThumbX + "px";

  updateSlider(thumbLeft.offsetLeft, thumbRight.offsetLeft);
  updateValues();
  updateThumbValue();
}

function handlePointerUp() {
  if (!isDragging) return;
  isDragging = false;
  saveSliderValue();
}

function saveSliderValue() {
  const cfg = getRange();
  refreshCatalog({ [cfg.from]: fromValue, [cfg.to]: toValue, page: 1 });
}

function updateSlider(leftX, rightX) {
  sliderRange.style.left = leftX + thumbLeft.offsetWidth + "px";
  sliderRange.style.width = rightX - leftX - thumbLeft.offsetWidth + "px";
}

function posToValues(x) {
  const { min, max, decimals } = getRange();
  const value = min + (x / sliderTrack.offsetWidth) * (max - min);
  return Number(value.toFixed(decimals));
}

function handleSliderClick(e) {
  const rect = sliderTrack.getBoundingClientRect();
  let clickX = e.clientX - rect.left;

  clickX = Math.max(0, Math.min(clickX, sliderTrack.offsetWidth));

  const centerLeft = thumbLeft.offsetLeft + thumbLeft.offsetWidth / 2;
  const centerRight = thumbRight.offsetLeft + thumbRight.offsetWidth / 2;

  const distanceLeft = Math.abs(centerLeft - clickX);
  const distanceRight = Math.abs(centerRight - clickX);

  if (distanceLeft < distanceRight) {
    const newLeftX = clickX - thumbLeft.offsetWidth;

    thumbLeft.style.left = `${newLeftX}px`;
    updateSlider(newLeftX, thumbRight.offsetLeft);
  } else {
    thumbRight.style.left = clickX + "px";
    updateSlider(thumbLeft.offsetLeft, clickX);
  }

  updateValues();
  updateThumbValue();
  saveSliderValue();
}

function updateThumbValue() {
  const { decimals } = getRange();
  thumbLeft.querySelector("span").textContent = fromValue.toFixed(decimals);
  thumbRight.querySelector("span").textContent = toValue.toFixed(decimals);
}

function updateValues() {
  fromValue = posToValues(thumbLeft.offsetLeft + thumbLeft.offsetWidth);
  toValue = posToValues(thumbRight.offsetLeft);
}

function getRange() {
  return SLIDERS[activeType];
}

function setSliderValues(from, to) {
  fromValue = from;
  toValue = to;

  const { min, max } = getRange();
  const width = sliderTrack.offsetWidth;

  const leftX = ((from - min) / (max - min)) * width - thumbLeft.offsetWidth;
  const rightX = ((to - min) / (max - min)) * width;

  thumbLeft.style.left = leftX + "px";
  thumbRight.style.left = rightX + "px";

  updateThumbValue();
  updateSlider(leftX, rightX);
}

function handleYearSelection(e) {
  const item = e.target.closest("[data-year]");
  if (!item) return;

  const from = Number(item.dataset.year);
  const to = Math.min(from + 9, getRange().max);

  setSliderValues(from, to);
  saveSliderValue();
}

