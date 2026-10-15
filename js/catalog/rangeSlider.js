import { refreshCatalog } from "./catalogController.js";

// ─── Слайдеры ───
let thumbLeft;
let thumbRight;
const filters = document.querySelector('.filters');;
let sliderRange;

let startMouseX = 0;
let startThumbX = 0;
let isDragging = false;
let activeThumb;
let passiveThumb;
let fromValue;
let toValue;
let sliderTrack;
let activeSlider;

export function initSlider() {
  filters.addEventListener("pointerdown", handlePointerDown);
}

/// продолжить тут
function restoreSliderState() {
  updateSlider()
} 

function selectSlider(container) {
  activeSlider = container.querySelector(".slider");
  sliderTrack = activeSlider.querySelector(".slider__track");
  thumbLeft = activeSlider.querySelector(".slider__thumb--left");
  thumbRight = activeSlider.querySelector(".slider__thumb--right");
  sliderRange = activeSlider.querySelector(".slider__active");
}


document.addEventListener("pointermove", handleThumbMove);

document.addEventListener("pointerup", handlePointerUp);

function handlePointerDown(e) {
  const slider = e.target.closest('.slider);
  if (!slider) return;
  
  e.preventDefault();

  selectSlider(slider)

  if (e.target.tagName === "SPAN") console.log("click");

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
  const THUMB_WIDTH = thumbLeft.offsetWidth;

  let newThumbX = activeThumb === thumbLeft //сократил
    ? Math.max(
      -THUMB_WIDTH,
      Math.min(
        startThumbX + differX,
        passiveThumb.offsetLeft - activeThumb.offsetWidth,
      )
    : Math.max(
      passiveThumb.offsetLeft + activeThumb.offsetWidth,
      Math.min(startThumbX + differX, sliderTrack.offsetWidth);
      
  

  activeThumb.style.left = newThumbX + "px";

  updateSlider(thumbLeft.offsetLeft, thumbRight.offsetLeft);
  updateValues();
  updateThumbValue();
}

function handlePointerUp(e) {
  if (!isDragging) return;
  isDragging = false;
  saveSliderValue()
}

function saveSliderValue() {
    let value = activeSLider.classList.contains('.slider-year') 
    ? { yearFrom: fromValue, yearTo: toValue, page: 1 } 
    : { ratingFrom: fromValue, ratingTo: toValue, page: 1 }
  refreshCatalog(value);
}

function updateSlider(leftX, rightX) {
  sliderRange.style.left = leftX + thumbLeft.offsetWidth + "px";
  sliderRange.style.width = rightX - leftX - thumbLeft.offsetWidth + "px";
}

function posToValues(x) {
  const percent = x / sliderTrack.offsetWidth;

  const { min, max } = getRange();
  const value = min + percent * (max - min);

  return sliderYearContainer.contains(sliderTrack)
    ? Math.round(value)
    : value.toFixed(1);
}

function handleSliderClick(e) {
  const rect = sliderTrack.getBoundingClientRect();
  let clickX = e.clientX - rect.left;

  clickX = Math.max(0, Math.min(clickX, sliderTrack.offsetWidth));

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
  updateThumbValue();
  saveSliderValue();
}

function updateThumbValue() {
  thumbLeft.querySelector("span").textContent = fromValue;
  thumbRight.querySelector("span").textContent = toValue;
}

function updateValues() {
  fromValue = posToValues(thumbLeft.offsetLeft + thumbLeft.offsetWidth);

  toValue = posToValues(thumbRight.offsetLeft);
}

const yearSelection = document.querySelector(".filters__quick");

function getRange() {
  return sliderYearContainer.contains(sliderTrack)
    ? { min: 1900, max: new Date().getFullYear() }
    : { min: 0, max: 10 };
}

function setSliderValues(from, to) {
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
  if (e.target.tagName !== "SPAN") return;

  fromValue = Number(e.target.dataset.year);
  toValue = Math.min(fromValue + 10, new Date().getFullYear());

  setSliderValues(fromValue, toValue);
  refreshCatalog({ yearFrom: fromValue, yearTo: toValue, page: 1 });
}

const sortContainer = document.querySelector(
  ".filters__group--sort .filters__dropdown",
);

sortContainer.addEventListener("click", handleSortingClick);

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
