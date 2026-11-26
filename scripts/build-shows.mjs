// Runs in CI (see .github/workflows/static.yml) right before deploy — never
// as part of local dev, and its output is never committed. It bakes the
// current shows.json into static HTML in shows.html and refreshes
// sitemap.xml's <lastmod> dates from git history, so search engines and any
// crawler that doesn't execute JS still see real content. js/shows.js then
// re-renders the same thing client-side using the visitor's actual local
// date, so this is purely a progressive-enhancement base layer — editing
// stays exactly as simple as "edit shows.json".
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { bucketShows, formatDate, formatTime, billSegments, eventJsonLd } from '../js/shows-data.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const path = (...parts) => join(root, ...parts);

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function linkOrText(text, url) {
  return url
    ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(text)}</a>`
    : escapeHtml(text);
}

function billHtml(show) {
  const segments = billSegments(show);
  if (!segments) return null;
  return segments.map(seg => linkOrText(seg.text, seg.url)).join('');
}

function showLi(show, isUpcoming) {
  const cls = isUpcoming ? 'show' : 'show past';
  const dateTimeAttr = show.time ? `${show.date}T${show.time}` : show.date;

  let when = `<time class="show-date" datetime="${escapeHtml(dateTimeAttr)}">${escapeHtml(formatDate(show.date))}</time>`;
  if (show.time) {
    when += `<div class="show-time">${escapeHtml(formatTime(show.time))}</div>`;
  }

  const venueHtml = linkOrText(show.venue, isUpcoming ? show.venueUrl : null);
  const bill = billHtml(show);

  return (
    `<li class="${cls}">` +
      `<div class="show-when">${when}</div>` +
      '<div>' +
        `<div class="show-venue">${venueHtml}</div>` +
        `<div class="show-city">${escapeHtml(`${show.city}, ${show.state}`)}</div>` +
        (bill ? `<div class="show-bill">${bill}</div>` : '') +
      '</div>' +
    '</li>'
  );
}

function replaceBetween(html, openTagPattern, content) {
  const re = new RegExp(`(${openTagPattern})[\\s\\S]*?(</${openTagPattern.match(/^<(\w+)/)[1]}>)`);
  if (!re.test(html)) throw new Error(`Could not find markup matching: ${openTagPattern}`);
  return html.replace(re, `$1${content}$2`);
}

function buildShowsHtml(shows, today) {
  const { upcoming, past } = bucketShows(shows, today);

  let html = readFileSync(path('shows.html'), 'utf8');

  html = replaceBetween(
    html,
    '<ul id="upcoming-shows" class="show-list">',
    upcoming.map(s => showLi(s, true)).join('')
  );
  html = replaceBetween(
    html,
    '<ul id="past-shows" class="show-list">',
    past.map(s => showLi(s, false)).join('')
  );

  html = html.replace(
    /<p id="upcoming-empty" class="shows-empty"( hidden)?>/,
    upcoming.length > 0 ? '<p id="upcoming-empty" class="shows-empty" hidden>' : '<p id="upcoming-empty" class="shows-empty">'
  );

  const nextShow = upcoming[0] || null;
  const jsonLd = nextShow ? JSON.stringify(eventJsonLd(nextShow), null, 2) : '';
  html = html.replace(
    /(<script type="application\/ld\+json" id="show-jsonld">)[\s\S]*?(<\/script>)/,
    `$1${jsonLd}$2`
  );

  writeFileSync(path('shows.html'), html);
}

function gitDate(...relPaths) {
  let latest = null;
  for (const p of relPaths) {
    try {
      const out = execFileSync('git', ['log', '-1', '--format=%cd', '--date=short', '--', p], {
        cwd: root,
        encoding: 'utf8'
      }).trim();
      if (out && (!latest || out > latest)) latest = out;
    } catch {
      // not a git checkout or no history for this path — leave it out
    }
  }
  return latest;
}

function buildSitemap(today) {
  const pages = [
    { loc: '/', files: ['index.html'] },
    { loc: '/music.html', files: ['music.html'] },
    { loc: '/about.html', files: ['about.html'] },
    { loc: '/shows.html', files: ['shows.html', 'shows.json'] }
  ];

  let sitemap = readFileSync(path('sitemap.xml'), 'utf8');

  for (const { loc, files } of pages) {
    const date = gitDate(...files) || today;
    const fullLoc = `https://horses4k.rodeo${loc}`;
    const re = new RegExp(`(<loc>${fullLoc.replace(/\//g, '\\/')}</loc>\\s*<lastmod>)[^<]*(</lastmod>)`);
    if (!re.test(sitemap)) throw new Error(`sitemap.xml has no entry for ${fullLoc}`);
    sitemap = sitemap.replace(re, `$1${date}$2`);
  }

  writeFileSync(path('sitemap.xml'), sitemap);
}

const shows = JSON.parse(readFileSync(path('shows.json'), 'utf8'));

// Shows are sorted and split into upcoming/past by comparing date text, so
// dates must be zero-padded (2027-01-23, not 2027-1-23) and times 24-hour
// HH:MM. Fail the deploy rather than publish a list in the wrong order.
const bad = shows.filter(s => !/^\d{4}-\d{2}-\d{2}$/.test(s.date) || (s.time && !/^\d{2}:\d{2}$/.test(s.time)));
if (bad.length) {
  for (const s of bad) console.error(`shows.json: ${s.venue}: date must be YYYY-MM-DD and time HH:MM (got "${s.date}" "${s.time}")`);
  process.exit(1);
}
const today = new Date().toISOString().slice(0, 10);

buildShowsHtml(shows, today);
buildSitemap(today);

console.log(`build-shows: rendered shows.html and sitemap.xml as of ${today}`);
