# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Run locally

```bash
python3 -m http.server 8080
```

Open http://localhost:8080. No build step — changes are reflected on page reload.

## Deploy

Push to `main`. GitHub Actions (`.github/workflows/static.yml`) deploys automatically to https://horses4k.rodeo via the `CNAME` file.

## Architecture

No framework, no client-side dependencies. Four standalone HTML pages share one stylesheet and one script:

- `css/style.css` — all styles for the entire site
- `js/main.js` — nav scroll behaviour and mobile drawer toggle only
- `js/shows.js` — fetches `shows.json` and renders the show lists on `shows.html` at runtime (see "Updating shows" below)
- `js/shows-data.mjs` — pure formatting/bucketing logic shared by `js/shows.js` (browser) and `scripts/build-shows.mjs` (CI build step), so the two never drift apart
- `fonts/Gontserrat-Light` — hero title font (self-hosted); body uses Google Fonts (Cormorant Garamond + DM Sans)
- `images/web/` — web-optimised images used in HTML; `images/full/` are originals, not referenced by the site

CSS uses custom properties defined on `:root` for the entire colour palette and layout constants. All type is set in three families: Gontserrat (hero title only), Cormorant Garamond (display/serif), DM Sans (body/UI).

Each page is self-contained with its own `<head>` — title, meta description, Open Graph, Twitter card, canonical URL, and a `MusicGroup` (or `MusicAlbum`) JSON-LD block must be kept consistent when content changes. Every page also loads GoatCounter analytics (`<script data-goatcounter="https://horses4k.goatcounter.com/count" ...>` just before `</head>`); include it in any new page. The exception is `shows.html`'s `MusicEvent` JSON-LD block (`<script id="show-jsonld">`) and its `<ul id="upcoming-shows">` / `<ul id="past-shows">` lists — leave these empty/unfilled in the HTML source. They're populated two ways: at runtime by `js/shows.js` (what you see with local dev / view-source before a deploy), and pre-rendered into static markup by `scripts/build-shows.mjs`, which runs in CI (`.github/workflows/static.yml`) right before deploy so crawlers that don't execute JS still see real show data and JSON-LD. `js/shows.js` then re-renders on top using the visitor's real local date — this is purely progressive enhancement, so editing shows stays exactly as simple as "edit `shows.json`" (see below).

## Updating shows

Add, edit, or remove shows in `shows.json` — `shows.html` has no hardcoded show data. Each entry:

```json
{
  "date": "2026-08-15",
  "time": "20:00",
  "venue": "The Doghouse",
  "venueUrl": "https://example.com/tickets",
  "city": "Akron",
  "state": "OH",
  "event": null,
  "bands": [
    { "name": "Lilac Heart", "url": "https://lilacheart.bandcamp.com" },
    { "name": "Hazel Boy", "url": null }
  ],
  "note": null
}
```

- `js/shows.js` buckets each show into Upcoming or Archive by comparing `date` to today automatically — nothing to move by hand.
- `time` is optional 24-hour `"HH:MM"`. When set, it's shown under the date (e.g. "8:00 PM") and folded into the JSON-LD `startDate` as a full datetime. Leave it `null` if unknown (most past shows are, since it wasn't tracked before).
- `venueUrl` only renders as a link while the show is upcoming; once it moves to Archive the venue name reverts to plain text (avoids linking to stale ticket/event pages). `bands[].url` links stay live in both sections.
- `event` is an optional headline before the band list (e.g. a festival/series name, like `"Midwinter 2026, curated by CUSP"`). `note` is optional trailing text after the band list (e.g. `"and others"`). Omit fields that don't apply by setting them to `null` or `[]`.

## Adding a release

In `music.html`, duplicate an existing `<div class="section">` block and update the Bandcamp embed, stream links, description, credits, and press quote. The Bandcamp embed iframe `src` and `title` attributes must match the new release.

## Images

Always use files from `images/web/` in HTML, not `images/full/`. Both directories contain the same four photos; the `web/` versions are resized and JPEG-compressed (quality 80, chroma subsampled, metadata stripped — roughly half the file size of an uncompressed export with no visible quality loss) for browser delivery. When adding a new photo, export/resize it into `images/web/` at similar dimensions and compression, e.g.:

```bash
magick original.jpg -strip -sampling-factor 4:2:0 -interlace Plane -quality 80 images/web/name.jpg
```

## Keeping sitemap.xml in sync

`sitemap.xml`'s `<lastmod>` dates are refreshed automatically by `scripts/build-shows.mjs` during the CI deploy step, from each page's actual last-modified date in git history (`shows.html`'s date also considers `shows.json`, since that's where its content actually lives). Don't hand-edit `<lastmod>` — it's overwritten on every deploy.
