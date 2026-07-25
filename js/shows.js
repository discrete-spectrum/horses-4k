const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

function todayISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function appendLinkOrText(parent, text, url) {
  if (url) {
    const a = document.createElement('a');
    a.href = url;
    a.textContent = text;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    parent.appendChild(a);
  } else {
    parent.append(text);
  }
}

function billFragment(show) {
  if (!show.event && !show.bands.length) return null;

  const frag = document.createDocumentFragment();
  if (show.event) frag.append(show.event);

  if (show.bands.length) {
    frag.append(show.event ? ' — with ' : 'with ');
    show.bands.forEach((band, i) => {
      if (i > 0) frag.append(i === show.bands.length - 1 ? ' and ' : ', ');
      appendLinkOrText(frag, band.name, band.url);
    });
  }

  if (show.note) frag.append(`, ${show.note}`);

  return frag;
}

function renderShow(show, isUpcoming) {
  const li = document.createElement('li');
  li.className = isUpcoming ? 'show' : 'show past';

  const time = document.createElement('time');
  time.className = 'show-date';
  time.dateTime = show.date;
  time.textContent = formatDate(show.date);
  li.appendChild(time);

  const info = document.createElement('div');

  const venueDiv = document.createElement('div');
  venueDiv.className = 'show-venue';
  // Venue links only stay live for upcoming shows — ticket/event pages tend to
  // go stale once a show has passed, so past shows keep the venue name as plain text.
  appendLinkOrText(venueDiv, show.venue, isUpcoming ? show.venueUrl : null);
  info.appendChild(venueDiv);

  const cityDiv = document.createElement('div');
  cityDiv.className = 'show-city';
  cityDiv.textContent = `${show.city}, ${show.state}`;
  info.appendChild(cityDiv);

  const bill = billFragment(show);
  if (bill) {
    const billDiv = document.createElement('div');
    billDiv.className = 'show-bill';
    billDiv.appendChild(bill);
    info.appendChild(billDiv);
  }

  li.appendChild(info);
  return li;
}

function updateJsonLd(nextShow) {
  const script = document.getElementById('show-jsonld');
  if (!script) return;

  if (!nextShow) {
    script.remove();
    return;
  }

  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'MusicEvent',
    name: `Horses 4k at ${nextShow.venue}`,
    startDate: nextShow.date,
    performer: {
      '@type': 'MusicGroup',
      name: 'Horses 4k',
      url: 'https://horses4k.rodeo'
    },
    location: {
      '@type': 'MusicVenue',
      name: nextShow.venue,
      address: {
        '@type': 'PostalAddress',
        addressLocality: nextShow.city,
        addressRegion: nextShow.state,
        addressCountry: 'US'
      }
    },
    eventStatus: 'https://schema.org/EventScheduled'
  }, null, 2);
}

async function loadShows() {
  const upcomingList = document.getElementById('upcoming-shows');
  const pastList = document.getElementById('past-shows');
  if (!upcomingList || !pastList) return;

  const res = await fetch('/shows.json');
  const shows = await res.json();

  const today = todayISO();
  const upcoming = shows.filter(s => s.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const past = shows.filter(s => s.date < today).sort((a, b) => b.date.localeCompare(a.date));

  upcoming.forEach(show => upcomingList.appendChild(renderShow(show, true)));
  past.forEach(show => pastList.appendChild(renderShow(show, false)));

  const upcomingEmpty = document.getElementById('upcoming-empty');
  if (upcomingEmpty) upcomingEmpty.hidden = upcoming.length > 0;

  updateJsonLd(upcoming[0] || null);
}

loadShows();
