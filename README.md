# KProjects

Music projects catalogue, preserving the supplied design, images, fonts and interactive project pages.

## Preview

Run `python3 -m http.server 8765 --directory dist` and open http://localhost:8765.

## Source

`dist/index.html` contains the page templates and application logic. `dist/assets/` contains locally hosted images, fonts, React and the template runtime. No build step is required. YouTube embeds require an internet connection.

## Hosting

The Sites deployment is configured in `.openai/hosting.json`. GitHub stores the source; pushing to GitHub alone does not publish a new Sites version.

### Prepared translations

The public site supports English, Spanish, Portuguese and French. Copy lives in
`dist/assets/translations.js`, keyed by normalized English text; proper names and
scientific publication titles retain their original spelling. New visible copy must
receive all three translations. `localization.js` updates text nodes and accessible
labels without replacing React-managed elements or restarting media playback.

The header selector remembers explicit language choices. Automatic mode looks up
the visitor's country through `https://api.country.is/` (country-level IP lookup,
no GPS, cookies or stored IP address), caches only the country for the session,
and falls back to a supported browser language, then English. The lookup times out
after 2.2 seconds; the site remains usable without it or without browser storage.
A manual choice always takes priority over an outstanding country lookup.

Run `node tests/localization.cjs` from this folder to verify selection, fallbacks,
async races, translated copy and restoration to English. Responsive overrides are
in `dist/assets/localization.css`. Amstel Quartet remains hidden and recoverable.
