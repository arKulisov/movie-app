const defaultState = {
  version: "movie",
  mode: "discover/movie",
  query: "",
  page: 1,

  genres: [],
  with_keywords: [],
  without_keywords: [],
  yearFrom: null,
  yearTo: null,
  ratingFrom: null,
  ratingTo: null,

  sortBy: "popularity.desc",
};

function buildState() {
  try {
    const saved = localStorage.getItem("state");
    if (saved)
      return {
        ...defaultState,
        ...JSON.parse(saved),
      };
  } catch {
    localStorage.removeItem("state");
  }
  return { ...defaultState };
}

export function setState(changes) {
  Object.assign(state, changes);
  localStorage.setItem("state", JSON.stringify(state));
}

export const state = buildState();
