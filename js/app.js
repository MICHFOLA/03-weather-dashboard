import { getForecast, searchCity } from "./api.js";
import {
  clearCityResults,
  renderCityResults,
  renderDate,
  renderFavourites,
  renderWeather,
  setStatus,
  updateUnitToggle,
} from "./ui.js";
import { getWeatherDescription } from "./weatherCodes.js";

const favouritesKey = "solstice-weather-favourites";
const temperatureUnitKey = "solstice-weather-temperature-unit";
const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#city-search");
const favouriteButton = document.querySelector("#favourite-button");
const celsiusButton = document.querySelector("#celsius-button");
const fahrenheitButton = document.querySelector("#fahrenheit-button");

let currentWeather;
let favourites = loadFavourites();
let activeRequest = 0;
let activeController;
let statusTimeout;
let temperatureUnit = loadTemperatureUnit();

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

function loadTemperatureUnit() {
  try {
    const savedUnit = localStorage.getItem(temperatureUnitKey);
    return savedUnit === "F" ? "F" : "C";
  } catch (error) {
    console.error("Could not load the preferred temperature unit.", error);
    return "C";
  }
}

function saveTemperatureUnit() {
  try {
    localStorage.setItem(temperatureUnitKey, temperatureUnit);
  } catch (error) {
    console.error("Could not save the preferred temperature unit.", error);
    setStatus("Your browser could not save the temperature preference.", true);
  }
}

function updateFavourites() {
  renderFavourites(
    favourites,
    currentWeather?.city,
    (cityName, favourite) => showCity(cityName, favourite),
    temperatureUnit,
  );
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

async function showCity(query, selectedCity = null) {
  activeController?.abort();
  const requestId = ++activeRequest;
  const controller = new AbortController();
  activeController = controller;
  window.clearTimeout(statusTimeout);
  clearCityResults();
  setStatus("Loading…");
  searchForm.setAttribute("aria-busy", "true");
  try {
    let city = selectedCity &&
      Number.isFinite(selectedCity.latitude) &&
      Number.isFinite(selectedCity.longitude)
      ? {
          ...selectedCity,
          name: selectedCity.name ?? selectedCity.city,
          timezone: selectedCity.timezone ?? selectedCity.timeZone,
        }
      : null;
    if (!city) {
      let cities;
      try {
        cities = await searchCity(query, { signal: controller.signal });
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "City search failed. Please try again.");
      }

      if (requestId !== activeRequest) {
        return;
      }

      if (!cities.length) {
        setStatus(`We couldn't find "${query}". Check the spelling or try another city.`);
        return;
      }

      if (cities.length > 1) {
        renderCityResults(cities, (match) => showCity(match.name, match));
        setStatus(`Choose a location for "${query}".`);
        return;
      }

      city = cities[0];
    }

    let forecast;
    try {
      forecast = await getForecast(city.latitude, city.longitude, { signal: controller.signal });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Weather forecast failed. Please try again.");
    }

    if (requestId !== activeRequest) {
      return;
    }

    const current = forecast.current;
    const currentConditions = getWeatherDescription(current.weather_code);
    const weather = {
      city: city.name,
      country: city.country,
      admin1: city.admin1,
      latitude: city.latitude,
      longitude: city.longitude,
      timeZone: forecast.timezone ?? city.timezone,
      temperature: current.temperature_2m,
      humidity: current.relative_humidity_2m,
      wind: current.wind_speed_10m,
      windUnit: forecast.current_units.wind_speed_10m,
      condition: currentConditions.label,
      icon: currentConditions.emoji,
      forecast: forecast.daily.time.map((date, index) => {
        const conditions = getWeatherDescription(forecast.daily.weather_code[index]);
        return {
          date,
          high: forecast.daily.temperature_2m_max[index],
          low: forecast.daily.temperature_2m_min[index],
          icon: conditions.emoji,
          condition: conditions.label,
        };
      }),
    };

    currentWeather = weather;
    renderWeather(weather, temperatureUnit);
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
      activeController = undefined;
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

searchInput.addEventListener("input", clearCityResults);

function selectTemperatureUnit(unit) {
  temperatureUnit = unit;
  saveTemperatureUnit();
  updateUnitToggle(temperatureUnit);
  if (currentWeather) {
    renderWeather(currentWeather, temperatureUnit);
    updateFavourites();
  }
}

celsiusButton.addEventListener("click", () => selectTemperatureUnit("C"));
fahrenheitButton.addEventListener("click", () => selectTemperatureUnit("F"));

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
updateUnitToggle(temperatureUnit);
updateFavourites();
showCity("Lisbon", {
  name: "Lisbon",
  country: "Portugal",
  admin1: "Lisbon District",
  latitude: 38.7223,
  longitude: -9.1393,
  timezone: "Europe/Lisbon",
});
