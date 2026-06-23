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

No framework, no build tool, no dependencies. Four standalone HTML pages share one stylesheet and one script:

- `css/style.css` — all styles for the entire site
- `js/main.js` — nav scroll behaviour and mobile drawer toggle only
- `fonts/Gontserrat-Light` — hero title font (self-hosted); body uses Google Fonts (Cormorant Garamond + DM Sans)
- `images/web/` — web-optimised images used in HTML; `images/full/` are originals, not referenced by the site

CSS uses custom properties defined on `:root` for the entire colour palette and layout constants. All type is set in three families: Gontserrat (hero title only), Cormorant Garamond (display/serif), DM Sans (body/UI).

Each page is self-contained with its own `<head>` — title, meta description, Open Graph, Twitter card, canonical URL, and a `MusicGroup` (or `MusicAlbum`) JSON-LD block must be kept consistent when content changes.

## Updating shows

Edit `shows.html`. Upcoming shows go in the first `<section>` as `<li class="show">`. Once a show has passed, move it to the Archive section and change the class to `class="show past"`.

## Adding a release

In `music.html`, duplicate an existing `<div class="section">` block and update the Bandcamp embed, stream links, description, credits, and press quote. The Bandcamp embed iframe `src` and `title` attributes must match the new release.

## Images

Always use files from `images/web/` in HTML, not `images/full/`. Both directories contain the same four photos; the `web/` versions are optimised for browser delivery.
