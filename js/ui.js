function createElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) {
    element.className = className;
  }
  if (text !== undefined) {
    element.textContent = text;
  }
  return element;
}

export function renderWeather(weather, temperatureUnit = "C") {
  document.querySelector("#city-name").textContent = weather.city;
  document.querySelector("#city-country").textContent = weather.country;
  document.querySelector("#city-coordinate").textContent = [
    formatCoordinate(weather.latitude, "N", "S"),
    formatCoordinate(weather.longitude, "E", "W"),
    formatTimeZone(weather.timeZone),
  ].join(" · ");
  document.querySelector("#current-temperature").textContent =
    `${Math.round(convertTemperature(weather.temperature, temperatureUnit))}°${temperatureUnit}`;
  document.querySelector("#current-condition").textContent = weather.condition;
  document.querySelector("#current-icon").textContent = weather.icon;
  document.querySelector("#current-wind").textContent = `${weather.wind} ${weather.windUnit}`;
  document.querySelector("#current-humidity").textContent = `${weather.humidity}%`;
  renderLocalTime(weather.timeZone);

  const forecastGrid = document.querySelector("#forecast-grid");
  forecastGrid.replaceChildren(
    ...weather.forecast.map((day, index) => {
      const card = createElement("article", "forecast-day");
      const forecastDate = new Date(`${day.date}T12:00:00`);
      const weekday = new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(forecastDate);
      const dayName = index === 0 ? `Today, ${weekday}` : weekday;
      const dayLabel = createElement("span", "forecast-name", dayName);
      const weatherIcon = createElement("span", "forecast-icon", day.icon);
      weatherIcon.setAttribute("aria-hidden", "true");
      weatherIcon.title = day.condition;
      const temperatures = createElement("div", "forecast-temperatures");
      const high = Math.round(convertTemperature(day.high, temperatureUnit));
      const low = Math.round(convertTemperature(day.low, temperatureUnit));
      temperatures.append(
        createElement("span", "", `${high}°${temperatureUnit}`),
        createElement("span", "forecast-low", `${low}°${temperatureUnit}`),
      );
      card.setAttribute(
        "aria-label",
        `${dayName}: ${day.condition}, high ${high}°${temperatureUnit}, low ${low}°${temperatureUnit}`,
      );
      card.append(dayLabel, weatherIcon, temperatures);
      return card;
    }),
  );
}

function convertTemperature(celsius, unit) {
  return unit === "F" ? (celsius * 9) / 5 + 32 : celsius;
}

function formatCoordinate(value, positiveDirection, negativeDirection) {
  const direction = value < 0 ? negativeDirection : positiveDirection;
  return `${Math.abs(value).toFixed(4)}° ${direction}`;
}

function formatTimeZone(timeZone) {
  const parts = new Intl.DateTimeFormat("en-NG", {
    timeZone,
    timeZoneName: "long",
  }).formatToParts(new Date());
  const longName = parts.find((part) => part.type === "timeZoneName")?.value;
  const shortName = new Intl.DateTimeFormat("en-NG", {
    timeZone,
    timeZoneName: "short",
  }).formatToParts(new Date()).find((part) => part.type === "timeZoneName")?.value;

  if (!longName) {
    return timeZone;
  }
  return shortName && shortName !== longName ? `${longName} (${shortName})` : longName;
}

function renderLocalTime(timeZone) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
    timeZoneName: "short",
  });
  document.querySelector("#local-time").textContent = formatter.format(new Date());
}

export function renderFavourites(favourites, selectedCity, onSelect, temperatureUnit = "C") {
  const list = document.querySelector("#favourites-list");
  list.replaceChildren();

  if (!favourites.length) {
    list.append(
      createElement("li", "empty-favourites", "No saved places yet. Add the city you're looking at to keep it close."),
    );
    return;
  }

  favourites.forEach((favourite) => {
    const item = createElement("li");
    const button = createElement("button", "favourite-button");
    button.type = "button";
    button.setAttribute("aria-current", String(favourite.city === selectedCity));
    button.addEventListener("click", () => onSelect(favourite.city, favourite));

    const icon = createElement("span", "favourite-icon", favourite.icon);
    icon.setAttribute("aria-hidden", "true");
    const copy = createElement("span", "favourite-copy");
    copy.append(
      createElement("span", "favourite-city", favourite.city),
      createElement("span", "favourite-country", favourite.country),
    );
    button.append(
      icon,
      copy,
      createElement(
        "span",
        "favourite-temperature",
        `${Math.round(convertTemperature(favourite.temperature, temperatureUnit))}°${temperatureUnit}`,
      ),
    );
    item.append(button);
    list.append(item);
  });
}

export function renderCityResults(cities, onSelect) {
  const list = document.querySelector("#city-results");
  list.replaceChildren();

  cities.forEach((city) => {
    const item = createElement("li");
    const button = createElement(
      "button",
      "city-result-option",
      [city.name, city.admin1, city.country].filter(Boolean).join(", "),
    );
    button.type = "button";
    button.addEventListener("click", () => onSelect(city));
    item.append(button);
    list.append(item);
  });

  list.hidden = cities.length === 0;
  document.querySelector("#city-search").setAttribute("aria-expanded", String(cities.length > 0));
}

export function clearCityResults() {
  const list = document.querySelector("#city-results");
  list.replaceChildren();
  list.hidden = true;
  document.querySelector("#city-search").setAttribute("aria-expanded", "false");
}

export function updateUnitToggle(unit) {
  document.querySelector("#celsius-button").setAttribute("aria-pressed", String(unit === "C"));
  document.querySelector("#fahrenheit-button").setAttribute("aria-pressed", String(unit === "F"));
}

export function setStatus(message = "", isError = false) {
  const status = document.querySelector("#status-message");
  const error = document.querySelector("#error-message");
  status.textContent = isError ? "" : message;
  error.textContent = isError ? message : "";
}

export function renderDate() {
  document.querySelector("#header-date").textContent = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date()).toUpperCase();
}
