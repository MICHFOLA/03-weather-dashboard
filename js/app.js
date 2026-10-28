import { getForecast, searchCity } from "./api.js";
import {
  clearCityResults,
  renderCityResults,
  renderDate,
  renderFavourites,
  renderWeather,
  setLoading,
  setStatus,
  updateUnitToggle,
  updateWeatherFavourite,
} from "./ui.js";
import { getWeatherDescription } from "./weatherCodes.js";

const favouritesKey = "solstice-weather-favourites";
const lastViewedKey = "solstice-weather-last-viewed";
const temperatureUnitKey = "solstice-weather-temperature-unit";
const defaultCity = {
  name: "Lisbon",
  country: "Portugal",
  admin1: "Lisbon District",
  latitude: 38.7223,
  longitude: -9.1393,
  timezone: "Europe/Lisbon",
};

const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#city-search");
const favouriteButton = document.querySelector("#favourite-button");
const weatherFavouriteButton = document.querySelector("#weather-favourite");
const locationButton = document.querySelector("#location-button");
const celsiusButton = document.querySelector("#celsius-button");
const fahrenheitButton = document.querySelector("#fahrenheit-button");

let currentWeather;
let favourites = loadFavourites();
let activeRequest = 0;
let activeController;
let statusTimeout;
let temperatureUnit = loadTemperatureUnit();

function isValidLocation(location) {
  return location &&
    Number.isFinite(location.latitude) &&
    Number.isFinite(location.longitude) &&
    typeof (location.name ?? location.city) === "string";
}

function loadFavourites() {
  try {
    const saved = JSON.parse(localStorage.getItem(favouritesKey) ?? "[]");
    if (!Array.isArray(saved)) {
      return [];
    }

    return saved.filter(isValidLocation).map((item) => ({
      ...item,
      name: item.name ?? item.city,
      city: item.city ?? item.name,
    }));
  } catch (error) {
    console.error("Could not load saved favourite cities.", error);
    setStatus("Saved places could not be loaded from this browser.", true);
    return [];
  }
}

function saveFavourites(nextFavourites) {
  try {
    localStorage.setItem(favouritesKey, JSON.stringify(nextFavourites));
    return true;
  } catch (error) {
    console.error("Could not save favourite cities.", error);
    setStatus("Your browser could not save this favourite.", true);
    return false;
  }
}

function loadLastViewed() {
  try {
    const saved = JSON.parse(localStorage.getItem(lastViewedKey) ?? "null");
    if (!isValidLocation(saved)) {
      return null;
    }

    return {
      ...saved,
      name: saved.name ?? saved.city,
      timezone: saved.timezone ?? saved.timeZone,
    };
  } catch (error) {
    console.error("Could not load the last viewed city.", error);
    setStatus("Your last viewed city could not be loaded.", true);
    return null;
  }
}

function saveLastViewed(weather) {
  try {
    localStorage.setItem(lastViewedKey, JSON.stringify({
      name: weather.city,
      city: weather.city,
      country: weather.country,
      admin1: weather.admin1 ?? "",
      latitude: weather.latitude,
      longitude: weather.longitude,
      timezone: weather.timeZone,
    }));
    return true;
  } catch (error) {
    console.error("Could not save the last viewed city.", error);
    setStatus("Your browser could not remember this city.", true);
    return false;
  }
}

function loadTemperatureUnit() {
  try {
    return localStorage.getItem(temperatureUnitKey) === "F" ? "F" : "C";
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

function isFavourite(weather) {
  return Boolean(weather) && favourites.some((item) =>
    item.latitude === weather.latitude && item.longitude === weather.longitude,
  );
}

function renderFavouriteControls() {
  renderFavourites(
    favourites,
    currentWeather,
    (cityName, favourite) => showCity(cityName, favourite),
    temperatureUnit,
  );

  const saved = isFavourite(currentWeather);
  const pending = document.querySelector("#current-card").classList.contains("is-loading");
  updateWeatherFavourite(saved, pending);

  favouriteButton.disabled = saved || !currentWeather;
  const icon = document.createElement("span");
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = saved ? "✓" : "＋";
  favouriteButton.replaceChildren(
    icon,
    document.createTextNode(saved ? " Added to favourites" : " Add current city"),
  );
}

function makeFavourite(weather) {
  return {
    name: weather.city,
    city: weather.city,
    country: weather.country,
    admin1: weather.admin1 ?? "",
    latitude: weather.latitude,
    longitude: weather.longitude,
    timezone: weather.timeZone,
    temperature: weather.temperature,
    icon: weather.icon,
  };
}

function toWeather(forecast, city) {
  const current = forecast.current;
  const currentConditions = getWeatherDescription(current.weather_code);
  return {
    city: city.name ?? city.city,
    country: city.country ?? "Current location",
    admin1: city.admin1 ?? "",
    latitude: city.latitude,
    longitude: city.longitude,
    timeZone: forecast.timezone ?? city.timezone ?? city.timeZone,
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
}

async function showCity(query, selectedCity = null) {
  activeController?.abort();
  const requestId = ++activeRequest;
  const controller = new AbortController();
  activeController = controller;
  window.clearTimeout(statusTimeout);
  clearCityResults();
  setStatus("Loading weather…");
  setLoading(true);
  searchForm.setAttribute("aria-busy", "true");
  locationButton.disabled = true;

  try {
    let city = isValidLocation(selectedCity)
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
        setLoading(false);
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

    currentWeather = toWeather(forecast, city);
    renderWeather(currentWeather, temperatureUnit);
    const remembered = saveLastViewed(currentWeather);
    setLoading(false);
    renderFavouriteControls();
    if (remembered) {
      setStatus(`Showing the forecast for ${currentWeather.city}.`);
      statusTimeout = window.setTimeout(() => setStatus(), 2600);
    }
  } catch (error) {
    if (requestId !== activeRequest) {
      return;
    }
    console.error("Could not load the city forecast.", error);
    setStatus(error instanceof Error ? error.message : "Something went wrong. Please try again.", true);
  } finally {
    if (requestId === activeRequest) {
      setLoading(false);
      locationButton.disabled = false;
      searchForm.removeAttribute("aria-busy");
      activeController = undefined;
      renderFavouriteControls();
    }
  }
}

function getUserPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location services are not available in this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 12000,
      maximumAge: 300000,
    });
  });
}

function locationErrorMessage(error) {
  if (error instanceof Error && error.message === "Location services are not available in this browser.") {
    return error.message;
  }

  switch (error?.code) {
    case 1:
      return "Location permission was denied. Allow location access in your browser settings, then try again.";
    case 2:
      return "Your location couldn't be determined. Check your device's location services and try again.";
    case 3:
      return "Finding your location took too long. Please try again.";
    default:
      return "We couldn't access your location. Check your browser permissions and try again.";
  }
}

async function showMyLocation() {
  activeController?.abort();
  const requestId = ++activeRequest;
  const controller = new AbortController();
  activeController = controller;
  window.clearTimeout(statusTimeout);
  clearCityResults();
  setStatus("Getting your location…");
  setLoading(true);
  searchForm.setAttribute("aria-busy", "true");
  locationButton.disabled = true;

  try {
    let position;
    try {
      position = await getUserPosition();
    } catch (error) {
      throw new Error(locationErrorMessage(error));
    }

    if (requestId !== activeRequest) {
      return;
    }

    let forecast;
    try {
      forecast = await getForecast(position.coords.latitude, position.coords.longitude, {
        signal: controller.signal,
      });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Weather forecast failed. Please try again.");
    }

    if (requestId !== activeRequest) {
      return;
    }

    const city = {
      name: "Your location",
      country: "Current location",
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      timezone: forecast.timezone,
    };
    currentWeather = toWeather(forecast, city);
    renderWeather(currentWeather, temperatureUnit);
    const remembered = saveLastViewed(currentWeather);
    setLoading(false);
    renderFavouriteControls();
    if (remembered) {
      setStatus("Showing the weather near your location.");
      statusTimeout = window.setTimeout(() => setStatus(), 3200);
    }
  } catch (error) {
    if (requestId !== activeRequest) {
      return;
    }
    console.error("Could not load weather for your location.", error);
    setStatus(error instanceof Error ? error.message : "Could not access your location.", true);
  } finally {
    if (requestId === activeRequest) {
      setLoading(false);
      locationButton.disabled = false;
      searchForm.removeAttribute("aria-busy");
      activeController = undefined;
      renderFavouriteControls();
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
locationButton.addEventListener("click", showMyLocation);

function selectTemperatureUnit(unit) {
  temperatureUnit = unit;
  saveTemperatureUnit();
  updateUnitToggle(temperatureUnit);
  if (currentWeather) {
    renderWeather(currentWeather, temperatureUnit);
    renderFavouriteControls();
  }
}

celsiusButton.addEventListener("click", () => selectTemperatureUnit("C"));
fahrenheitButton.addEventListener("click", () => selectTemperatureUnit("F"));

function toggleCurrentFavourite() {
  if (!currentWeather) {
    return;
  }

  const existing = isFavourite(currentWeather);
  const nextFavourites = existing
    ? favourites.filter((item) =>
        item.latitude !== currentWeather.latitude || item.longitude !== currentWeather.longitude,
      )
    : [...favourites, makeFavourite(currentWeather)];

  if (saveFavourites(nextFavourites)) {
    favourites = nextFavourites;
    renderFavouriteControls();
    setStatus(
      existing
        ? `${currentWeather.city} removed from your favourites.`
        : `${currentWeather.city} added to your favourites.`,
    );
    window.clearTimeout(statusTimeout);
    statusTimeout = window.setTimeout(() => setStatus(), 2600);
  }
}

weatherFavouriteButton.addEventListener("click", toggleCurrentFavourite);
favouriteButton.addEventListener("click", toggleCurrentFavourite);

renderDate();
updateUnitToggle(temperatureUnit);
renderFavouriteControls();

async function initializeDashboard() {
  const lastViewed = loadLastViewed();
  if (lastViewed) {
    await showCity("", lastViewed);
    return;
  }

  if (navigator.permissions?.query) {
    try {
      const locationPermission = await navigator.permissions.query({ name: "geolocation" });
      if (locationPermission.state === "granted") {
        await showMyLocation();
        return;
      }
    } catch (error) {
      console.error("Could not check location permission.", error);
    }
  }

  await showCity("", defaultCity);
}

initializeDashboard();
