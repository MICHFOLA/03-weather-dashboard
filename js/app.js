import { searchCity } from "./api.js";
import { renderDate, renderFavourites, renderWeather, setStatus } from "./ui.js";

const favouritesKey = "solstice-weather-favourites";
const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#city-search");
const favouriteButton = document.querySelector("#favourite-button");

let currentWeather;
let favourites = loadFavourites();
let activeRequest = 0;
let statusTimeout;

function loadFavourites() {
  try {
    const saved = JSON.parse(localStorage.getItem(favouritesKey) ?? "[]");
    return Array.isArray(saved)
      ? saved.filter((item) =>
          item &&
          typeof item.city === "string" &&
          typeof item.country === "string" &&
          typeof item.icon === "string" &&
          Number.isFinite(item.temperature),
        )
      : [];
  } catch (error) {
    console.error("Could not load saved favourite cities.", error);
    setStatus("Saved places could not be loaded from this browser.", true);
    return [];
  }
}

function saveFavourites() {
  try {
    localStorage.setItem(favouritesKey, JSON.stringify(favourites));
    return true;
  } catch (error) {
    console.error("Could not save favourite cities.", error);
    setStatus("Your browser could not save this favourite.", true);
    return false;
  }
}

function updateFavourites() {
  renderFavourites(favourites, currentWeather?.city, showCity);
  const isFavourite = favourites.some((item) => item.city === currentWeather?.city);
  favouriteButton.disabled = isFavourite;
  const icon = document.createElement("span");
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = isFavourite ? "✓" : "＋";
  favouriteButton.replaceChildren(
    icon,
    document.createTextNode(isFavourite ? " Added to favourites" : " Add current city"),
  );
}

async function showCity(query) {
  const requestId = ++activeRequest;
  window.clearTimeout(statusTimeout);
  setStatus("Finding your forecast...");
  searchForm.setAttribute("aria-busy", "true");
  try {
    const weather = await searchCity(query);
    if (requestId !== activeRequest) {
      return;
    }
    currentWeather = weather;
    renderWeather(weather);
    updateFavourites();
    setStatus(`Showing the forecast for ${weather.city}.`);
    statusTimeout = window.setTimeout(() => setStatus(), 2600);
  } catch (error) {
    if (requestId !== activeRequest) {
      return;
    }
    console.error("Could not load the city forecast.", error);
    setStatus(error instanceof Error ? error.message : "Something went wrong. Please try again.", true);
  } finally {
    if (requestId === activeRequest) {
      searchForm.removeAttribute("aria-busy");
    }
  }
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const city = searchInput.value.trim();
  if (city) {
    showCity(city);
  }
});

favouriteButton.addEventListener("click", () => {
  if (!currentWeather || favourites.some((item) => item.city === currentWeather.city)) {
    return;
  }

  favourites = [...favourites, currentWeather];
  updateFavourites();
  if (!saveFavourites()) {
    return;
  }
  setStatus(`${currentWeather.city} added to your favourites.`);
  window.clearTimeout(statusTimeout);
  statusTimeout = window.setTimeout(() => setStatus(), 2600);
});

renderDate();
showCity("Lisbon");
