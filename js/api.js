const geocodingUrl = "https://geocoding-api.open-meteo.com/v1/search";
const forecastUrl = "https://api.open-meteo.com/v1/forecast";

export async function fetchJson(url, { signal } = {}) {
  try {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error(
        `Open-Meteo request failed: ${response.status} ${response.statusText || "HTTP error"}.`,
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    if (error instanceof Error && error.message.startsWith("Open-Meteo request failed:")) {
      throw error;
    }

    const detail = error instanceof Error ? error.message : "Unknown network or response error.";
    throw new Error(`Could not load data from Open-Meteo: ${detail}`);
  }
}

export async function searchCity(name, { signal } = {}) {
  const cityName = name.trim();
  if (!cityName) {
    return [];
  }

  const url = `${geocodingUrl}?name=${encodeURIComponent(cityName)}&count=5`;
  try {
    const data = await fetchJson(url, { signal });
    return (data.results ?? [])
      .filter((result) => Number.isFinite(result.latitude) && Number.isFinite(result.longitude))
      .map((result) => ({
        name: result.name,
        country: result.country ?? "Unknown country",
        latitude: result.latitude,
        longitude: result.longitude,
        timezone: result.timezone ?? "UTC",
        admin1: result.admin1 ?? "",
      }));
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    const detail = error instanceof Error ? error.message : "Unknown error.";
    throw new Error(`City search failed. ${detail}`);
  }
}

export async function getForecast(latitude, longitude, { signal } = {}) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    temperature_unit: "celsius",
    current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    timezone: "auto",
  });

  try {
    return await fetchJson(`${forecastUrl}?${params}`, { signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    const detail = error instanceof Error ? error.message : "Unknown error.";
    throw new Error(`Weather forecast failed. ${detail}`);
  }
}
