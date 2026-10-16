# KProjects

Music projects catalogue, preserving the supplied design, images, fonts and interactive project pages.

## Preview

Run `python3 -m http.server 8765 --directory dist` and open http://localhost:8765.

## Source

`dist/index.html` contains the page templates and application logic. `dist/assets/` contains locally hosted images, fonts, React and the template runtime. No build step is required. YouTube embeds require an internet connection.

## Hosting

The Sites deployment is configured in `.openai/hosting.json`. GitHub stores the source; pushing to GitHub alone does not publish a new Sites version.
