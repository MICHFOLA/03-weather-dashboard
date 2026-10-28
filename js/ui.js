const forecastDays = Array.from({ length: 7 }, (_, index) => {
  if (index === 0) {
    return "Today";
  }

  const date = new Date();
  date.setDate(date.getDate() + index);
  return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date);
});

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

export function renderWeather(weather) {
  document.querySelector("#city-name").textContent = weather.city;
  document.querySelector("#city-country").textContent = weather.country;
  document.querySelector("#current-temperature").textContent = `${weather.temperature}°`;
  document.querySelector("#current-condition").textContent = weather.condition;
  document.querySelector("#current-icon").textContent = weather.icon;
  document.querySelector("#current-wind").textContent = `${weather.wind} km/h`;
  renderLocalTime(weather.timeZone);

  const forecastGrid = document.querySelector("#forecast-grid");
  forecastGrid.replaceChildren(
    ...weather.forecast.map(([high, low, icon], index) => {
      const card = createElement("article", "forecast-day");
      const day = createElement("span", "forecast-name", forecastDays[index]);
      const weatherIcon = createElement("span", "forecast-icon", icon);
      weatherIcon.setAttribute("aria-hidden", "true");
      const temperatures = createElement("div", "forecast-temperatures");
      temperatures.append(
        createElement("span", "", `${high}°`),
        createElement("span", "forecast-low", `${low}°`),
      );
      card.append(day, weatherIcon, temperatures);
      return card;
    }),
  );
}

function renderLocalTime(timeZone) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  });
  document.querySelector("#local-time").textContent = formatter.format(new Date());
}

export function renderFavourites(favourites, selectedCity, onSelect) {
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
    button.addEventListener("click", () => onSelect(favourite.city));

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
      createElement("span", "favourite-temperature", `${favourite.temperature}°`),
    );
    item.append(button);
    list.append(item);
  });
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
