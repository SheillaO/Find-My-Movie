# Find Your Movie 🎬

**A movie discovery app that fights decision fatigue instead of feeding it — built on the idea that recommendation engines should optimize for *your* taste, not for engagement metrics.**

---

## Why This Matters

The average household now juggles four or more streaming subscriptions, each with its own recommendation algorithm, its own watchlist, and its own definition of "for you." None of them talk to each other. None of them are designed to help you decide faster — they're designed to keep you scrolling, because time spent browsing counts as engagement, whether or not you ever press play.

The result is a problem researchers call **decision fatigue**: people report spending close to twenty minutes some nights just choosing what to watch, often across multiple apps, before giving up and rewatching something they've already seen.

Find Your Movie takes the opposite approach. One search bar. One watchlist. One ID — IMDb's — as the universal key, regardless of which platform eventually streams it. No algorithm trying to maximize your time on the page. Just a faster way to land on something you actually want to watch, with an interface that quietly adapts to *when* you're watching, not just *what*.

---

## What It Does

**Search page (`index.html`)**
- Opens with five personally curated recommendations, fetched live from OMDb — not generic "trending now" filler
- Full-text search across OMDb's 500,000+ title library
- One-click add to watchlist with instant visual confirmation
- A Netflix-style **match score**, calculated from each title's real IMDb rating — not a fabricated "98% for you" number with no basis
- State persists across sessions via `localStorage` — no account, no login, no data leaving the browser

**Watchlist page (`WatchList.html`)**
- Full detail per title: runtime, rating, plot — fetched fresh every time, so it's never stale
- One-click remove, with immediate re-render
- Falls back to five default titles on first visit, so the page is never an empty, off-putting void

**Both pages**
- Automatically switch between light and dark mode based on the hour — dark from 7pm to 6am, light otherwise
- A time-aware greeting reinforces the same logic visually ("Good evening — perfect time to settle in")
- Manual override toggle for anyone who disagrees with the clock
- Subtle poster hover interaction, borrowed from the platforms that perfected the "scroll and browse" pattern — but in service of a faster decision, not a longer one

---

## Architecture

Two pages, four files, one shared data layer — no server, no database, no build step.

movies/

├── index.html          — search and discovery page

├── WatchList.html       — saved titles page

├── index.js             — search logic, recommendations, match scoring

├── watchlist.js         — watchlist render, remove logic, match scoring

└── index.css            — shared styles, light and dark mode

Both pages communicate exclusively through `localStorage`. There is no shared JavaScript file and no framework holding state in memory — the **browser itself** is the state layer:
index.js  ──writes──▶  localStorage["movieWatchlist"]  ◀──reads──  watchlist.js

This is the same separation used in larger multi-tab applications: isolated scripts, a shared persistence boundary, zero coupling between modules. Replacing `localStorage` with a real backend later would mean changing two functions, not rearchitecting the app.

---

## Data Layer

The app consumes the [OMDb API](https://www.omdbapi.com), using two distinct endpoint modes deliberately:

**Keyword search** (`?s=`) — lightweight results, ideal for fast initial rendering:
```js
fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${userQuery}`)
```
Returns: `{ Search: [{ imdbID, Title, Year, Poster }], Response }` — no rating data included.

**ID lookup** (`?i=`) — full detail for a single known title:
```js
fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${movieId}`)
```
Returns: `{ Title, Year, Runtime, imdbRating, Plot, Poster, imdbID, Response }`

This distinction is why the **match score badge only appears on recommendations and the watchlist** — both use `?i=` — and not on raw search results, which use the lighter `?s=` endpoint. Rather than faking a percentage with no underlying number, the badge simply doesn't render where the data doesn't exist. `.match-badge:empty { display: none; }` handles this in one line of CSS, no conditional markup required.

The watchlist itself stores only `imdbID` strings — the minimum viable identifier. Full title data is fetched fresh on every render, which keeps `localStorage` lightweight and guarantees the details shown are never stale, even if OMDb's underlying data changes.

---

## Async Patterns

Both scripts use `async/await` inside `for...of` loops rather than `Promise.all()`:

```js
for (let id of favShowIds) {
    const response = await fetch(`...&i=${id}`)
    const movie = await response.json()
    if (movie.Response === "False") continue   // guard clause
    grid.innerHTML += `...`
}
```

**Why sequential, not parallel:** `Promise.all()` waits for every request to resolve before rendering anything — one slow response blocks the entire grid. Sequential fetching lets each card appear the moment its data arrives, which matters more for perceived speed than raw completion time.

**The guard clause matters more than it looks:** OMDb returns HTTP 200 even when a lookup fails, encoding the error inside the JSON body (`Response: "False"`). A status-code check alone would miss this and silently render broken cards. This is the same defensive pattern needed against any third-party API that doesn't use HTTP status codes consistently — worth knowing before it costs you a production bug.

---

## State Management

```js
// Write
localStorage.setItem("movieWatchlist", JSON.stringify(watchlist))

// Read
let watchlist = JSON.parse(localStorage.getItem("movieWatchlist")) || []
```

Storing IDs instead of full movie objects decouples persistence from the API's response shape — if OMDb adds, removes, or renames fields tomorrow, the stored data needs no migration. Only the render template changes.

Duplicate prevention happens before every write (`watchlist.includes(targetMovieId)`), and the button disables and restyles immediately on click — the UI confirms the action visually before the storage write even completes.

---

## Event Delegation

Neither page attaches listeners to individual movie cards directly:

```js
moviesContainer.addEventListener("click", function (e) {
    if (e.target.classList.contains("add-to-watchlist-btn")) {
        const targetMovieId = e.target.dataset.id
        // ...
    }
})
```

This single listener on the container catches clicks on cards that didn't exist in the DOM when the listener was first attached — search results and recommendations are injected via `innerHTML` afterward. Direct listeners on dynamically rendered elements would silently fail to fire, which is a common, hard-to-spot bug for anyone learning DOM manipulation for the first time.

---

## Time-Based Theming

```js
function applyTimeBasedTheme() {
    const hour = new Date().getHours()
    const isDaytime = hour >= 6 && hour < 19
    document.body.classList.toggle("dark-mode", !isDaytime)
    updateToggleBtn()
}
```

JavaScript only ever toggles a single class — it never writes inline styles for theming. Every visual rule for dark mode lives in `index.css` under `body.dark-mode`. This keeps the entire theme system in one place: changing a color means editing CSS, not hunting through JS for hardcoded hex values.

The manual toggle button overrides this for the current session only, without touching `localStorage` — intentional, because the time-based default should simply be correct again on the next visit, without the app "remembering" an override from three days ago.

---

## Built With

- **HTML5** — semantic structure across two pages, one shared stylesheet
- **CSS3** — `body.dark-mode` cascade theming, flexbox layout, hover micro-interactions
- **Vanilla JavaScript** — Fetch API, `async/await`, `localStorage`, event delegation, `Date` API
- **[OMDb API](https://www.omdbapi.com)** — movie and TV data source
- **Zero dependencies** — no npm, no bundler, no framework

---

## Roadmap

| Feature | Technical requirement |
|---------|----------------------|
| **Genre filter on search** | OMDb's `?s=` endpoint omits genre — would require an `?i=` fetch per result and client-side filtering |
| **Watchlist reordering** | Replace the flat ID array with `{ id, order }` objects; implement via the HTML Drag and Drop API |
| **Watched / unwatched tags** | Extend stored items from plain strings to `{ id, watched: false }`; add a toggle that updates state and re-renders |
| **Search result pagination** | OMDb returns 10 results per page with a `totalResults` count; add a `page` parameter and a "Load more" control |
| **Offline support** | Cache responses in `localStorage` with a timestamp; serve cached data when offline, flagged as potentially stale |

---

## Run Locally

Open via a local server, not directly from the filesystem — `file:///` paths treat each page as a separate origin, which silently breaks shared `localStorage` between pages.

**Recommended: VS Code Live Server extension**
Right-click `index.html` → Open with Live Server.

**Or via Python:**
```bash
cd movies
python3 -m http.server 3000
# open http://localhost:3000
```

---

**Sheilla O.**
Product-Minded Developer | Nairobi, Kenya 🇰🇪

Building tools that respect a person's time and attention more than the platforms they're competing with do.

💼 [LinkedIn](https://www.linkedin.com/in/sheillaolga/) • 🐙 [GitHub](https://github.com/SheillaO)