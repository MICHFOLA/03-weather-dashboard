const cityData = {
  lisbon: {
    city: "Lisbon",
    country: "Portugal",
    temperature: 22,
    condition: "Mostly sunny",
    icon: "☀️",
    wind: 12,
    timeZone: "Europe/Lisbon",
    forecast: [
      [22, 16, "☀️"],
      [23, 16, "🌤️"],
      [21, 15, "⛅"],
      [20, 14, "🌦️"],
      [22, 15, "☀️"],
      [24, 17, "☀️"],
      [23, 17, "🌤️"],
    ],
  },
  tokyo: {
    city: "Tokyo",
    country: "Japan",
    temperature: 19,
    condition: "Partly cloudy",
    icon: "⛅",
    wind: 9,
    timeZone: "Asia/Tokyo",
    forecast: [
      [20, 14, "⛅"],
      [21, 15, "🌤️"],
      [18, 13, "🌧️"],
      [19, 13, "🌦️"],
      [21, 15, "☀️"],
      [22, 16, "☀️"],
      [20, 15, "⛅"],
    ],
  },
  "new york": {
    city: "New York",
    country: "United States",
    temperature: 16,
    condition: "Breezy",
    icon: "🌬️",
    wind: 18,
    timeZone: "America/New_York",
    forecast: [
      [17, 10, "🌤️"],
      [18, 11, "☀️"],
      [15, 9, "🌦️"],
      [14, 8, "🌧️"],
      [16, 10, "⛅"],
      [19, 12, "☀️"],
      [18, 11, "🌤️"],
    ],
  },
  "cape town": {
    city: "Cape Town",
    country: "South Africa",
    temperature: 24,
    condition: "Clear skies",
    icon: "☀️",
    wind: 14,
    timeZone: "Africa/Johannesburg",
    forecast: [
      [24, 17, "☀️"],
      [23, 16, "🌤️"],
      [22, 15, "⛅"],
      [22, 16, "🌤️"],
      [25, 18, "☀️"],
      [26, 18, "☀️"],
      [24, 17, "⛅"],
    ],
  },
};

const genericForecast = [
  [21, 15, "🌤️"],
  [22, 16, "☀️"],
  [19, 14, "⛅"],
  [18, 13, "🌦️"],
  [20, 14, "🌤️"],
  [23, 16, "☀️"],
  [22, 16, "⛅"],
];

export async function searchCity(query) {
  const city = query.trim().replace(/\s+/g, " ");
  if (!city) {
    throw new Error("Please enter a city name.");
  }

  const knownCity = cityData[city.toLocaleLowerCase()];
  if (knownCity) {
    return { ...knownCity, forecast: [...knownCity.forecast] };
  }

  return {
    city: city.replace(/\b\w/g, (letter) => letter.toLocaleUpperCase()),
    country: "Sample data",
    temperature: 20,
    condition: "Partly sunny",
    icon: "🌤️",
    wind: 10,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    forecast: [...genericForecast],
  };
}
