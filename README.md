# horses4k.rodeo

Static site for [Horses 4K](https://horses4k.rodeo) — ambient country from Cleveland, OH.

## Run locally

From the project root:

```bash
python3 -m http.server 8080
```

Then open **http://localhost:8080** in a browser. Stop it with `Ctrl+C`.

Any other static server works too (e.g. `npx serve .` if you have Node).

## Deploy

Push to `main` on GitHub. Pages builds automatically via the `CNAME` file (`horses4k.rodeo`).

## Project structure

```
index.html          Home
music.html          Discography + embeds
about.html          Bio + member links
shows.html          Upcoming + past shows
css/style.css       All styles
js/main.js          Nav scroll + mobile drawer
fonts/              Gontserrat-Light (hero title)
images/             Originals
images/web/         Web-optimized versions (use these in HTML)
CNAME               Custom domain for GitHub Pages
sitemap.xml
robots.txt
```

## Updating shows

Edit `shows.html`. Upcoming shows go in the first `<section>` (no `past` class on the `<li>`). Move them to the Archive section and add `class="show past"` once they've passed.

## Adding a release

In `music.html`, copy an existing `<div class="section">` block and update the Bandcamp embed code, links, and description.
