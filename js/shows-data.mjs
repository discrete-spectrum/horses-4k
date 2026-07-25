// Shared, dependency-free show formatting/bucketing logic.
// Used both in the browser (js/shows.js) and at build time in CI
// (scripts/build-shows.mjs) so the two never drift apart.

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

export function formatTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export function bucketShows(shows, todayISO) {
  const upcoming = shows.filter(s => s.date >= todayISO).sort((a, b) => a.date.localeCompare(b.date));
  const past = shows.filter(s => s.date < todayISO).sort((a, b) => b.date.localeCompare(a.date));
  return { upcoming, past };
}

// Ordered pieces making up the bill line, or null if there's nothing to show.
// Glue text (e.g. " with ") has no `url`; band/event names carry `url` (possibly null).
export function billSegments(show) {
  if (!show.event && !show.bands.length) return null;

  const segments = [];
  if (show.event) segments.push({ text: show.event });

  if (show.bands.length) {
    segments.push({ text: show.event ? ' — with ' : 'with ' });
    show.bands.forEach((band, i) => {
      if (i > 0) segments.push({ text: i === show.bands.length - 1 ? ' and ' : ', ' });
      segments.push({ text: band.name, url: band.url || null });
    });
  }

  if (show.note) segments.push({ text: `, ${show.note}` });

  return segments;
}

export function eventJsonLd(show) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicEvent',
    name: `Horses 4k at ${show.venue}`,
    startDate: show.time ? `${show.date}T${show.time}:00` : show.date,
    performer: {
      '@type': 'MusicGroup',
      name: 'Horses 4k',
      url: 'https://horses4k.rodeo'
    },
    location: {
      '@type': 'MusicVenue',
      name: show.venue,
      address: {
        '@type': 'PostalAddress',
        addressLocality: show.city,
        addressRegion: show.state,
        addressCountry: 'US'
      }
    },
    eventStatus: 'https://schema.org/EventScheduled'
  };
}
