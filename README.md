# Solstice Weather

A responsive weather dashboard built with plain HTML, CSS, and JavaScript ES modules.

## Features

- Current conditions and a seven-day forecast for searched cities.
- City search with a list of region and country matches when results are ambiguous.
- °C/°F display toggle, with the preference saved in the browser.
- Favourite locations that can be added or removed from the current weather card and loaded from the favourites list.
- “Use my location” weather lookup with clear permission and availability messages.
- Remembers the last viewed city or location for the next visit.
- Responsive glass-style layout and animated loading states.

## API

Weather and city data come from [Open-Meteo](https://open-meteo.com/), which does not require an API key:

- Geocoding: `https://geocoding-api.open-meteo.com/v1/search`
- Forecast: `https://api.open-meteo.com/v1/forecast`

The browser's Geolocation API is available from **Use my location**. If the browser has already granted location permission and there is no saved last-viewed place, the dashboard can reuse that permission at startup. It does not prompt for new permission automatically. Coordinates are sent to Open-Meteo to retrieve a forecast.

## Screenshots

<!-- Add screenshots of the dashboard here. -->

_Screenshot placeholder: desktop dashboard_

_Screenshot placeholder: mobile dashboard_

## What I learned

- How to sequence geocoding and forecast requests with `async`/`await`.
- How to render API data safely with DOM elements and `textContent` instead of HTML injection.
- How to cancel obsolete network requests with `AbortController`.
- How to convert temperatures on the client and persist preferences with `localStorage`.
- How to handle geolocation permission and error states accessibly.
