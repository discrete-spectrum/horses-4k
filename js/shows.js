import { formatDate, formatTime, bucketShows, billSegments, eventJsonLd } from './shows-data.mjs';

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
  const segments = billSegments(show);
  if (!segments) return null;

  const frag = document.createDocumentFragment();
  segments.forEach(seg => appendLinkOrText(frag, seg.text, seg.url));
  return frag;
}

function renderShow(show, isUpcoming) {
  const li = document.createElement('li');
  li.className = isUpcoming ? 'show' : 'show past';

  const when = document.createElement('div');
  when.className = 'show-when';

  const time = document.createElement('time');
  time.className = 'show-date';
  time.dateTime = show.time ? `${show.date}T${show.time}` : show.date;
  time.textContent = formatDate(show.date);
  when.appendChild(time);

  if (show.time) {
    const timeDiv = document.createElement('div');
    timeDiv.className = 'show-time';
    timeDiv.textContent = formatTime(show.time);
    when.appendChild(timeDiv);
  }

  li.appendChild(when);

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

  script.textContent = JSON.stringify(eventJsonLd(nextShow), null, 2);
}

function todayISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

async function loadShows() {
  const upcomingList = document.getElementById('upcoming-shows');
  const pastList = document.getElementById('past-shows');
  if (!upcomingList || !pastList) return;

  const res = await fetch('/shows.json');
  const shows = await res.json();

  const { upcoming, past } = bucketShows(shows, todayISO());

  // shows.html may already contain build-time-rendered <li>s (see
  // scripts/build-shows.mjs) — replaceChildren() re-renders on top instead
  // of appending duplicates, using the visitor's actual local date.
  upcomingList.replaceChildren(...upcoming.map(show => renderShow(show, true)));
  pastList.replaceChildren(...past.map(show => renderShow(show, false)));

  const upcomingEmpty = document.getElementById('upcoming-empty');
  if (upcomingEmpty) upcomingEmpty.hidden = upcoming.length > 0;

  updateJsonLd(upcoming[0] || null);
}

loadShows();
