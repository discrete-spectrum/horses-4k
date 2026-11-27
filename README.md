# horses4k.rodeo

Static site for [Horses 4K](https://horses4k.rodeo) — ambient country from Cleveland, OH.

## Run locally

From the project root:

```bash
node scripts/serve.mjs
```

Then open **http://localhost:8080** in a browser. Stop it with `Ctrl+C`. Edits
show up when you reload the page.

This serves the site the way GitHub Pages does, so the short menu links
(`/shows`, `/about`, `/music`) work. `python3 -m http.server` does **not**
understand those, and clicking the menu there gives "not found".

The show list on your computer comes straight from `shows.json` in the browser.
The live site also has the shows built into the page for search engines,
which happens only during the deploy.

## Deploy

Push to `main` on GitHub. A GitHub Action builds and deploys it in about a minute (Actions tab shows progress). If `shows.json` has a date that isn't `YYYY-MM-DD` (e.g. `2027-1-23` instead of `2027-01-23`), the deploy stops with a message naming the show and the live site keeps its previous version.

## Project structure

```
index.html          Home
music.html          Discography + embeds
about.html          Bio + member links
shows.html          Upcoming + past shows (rendered from shows.json)
shows.json          Show data — edit this to add/update shows
css/style.css       All styles
js/main.js          Nav scroll + mobile drawer
js/shows.js         Renders shows.json into shows.html, in the browser
js/shows-data.mjs   Shared show formatting logic (browser + CI build)
scripts/build-shows.mjs  CI step: pre-renders shows.html + sitemap.xml before deploy
fonts/              Gontserrat-Light (hero title)
images/             Originals
images/web/         Web-optimized versions (use these in HTML)
CNAME               Custom domain for GitHub Pages
sitemap.xml
robots.txt
```

## Updating shows

Edit `shows.json` — no HTML editing needed. Add a show object with a `date` (`YYYY-MM-DD`); it's automatically sorted into Upcoming or Archive by comparing it to today's date. Each show can also have a `time`, a `venueUrl` (only linked while upcoming), and per-band `url`s in `bands[]` (linked forever). See the "Updating shows" section in `CLAUDE.md` for the full field reference.

`shows.html` ships with empty show lists in git; `js/shows.js` fills them in client-side, and a CI step (`scripts/build-shows.mjs`) additionally pre-renders them into static HTML right before each deploy, so search engines and crawlers that don't run JS still see real show data. Both use the same logic in `js/shows-data.mjs`, so they can't drift out of sync — you never edit HTML by hand either way.

## Adding a release

In `music.html`, copy an existing `<div class="section">` block and update the Bandcamp embed code, links, and description.
