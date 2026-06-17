# Find Your Movie 🎬

**A two-page movie discovery and watchlist app that adapts its interface to the time of day — because the way you browse at 2pm is different from how you browse at 10pm.**

---

## Why This Exists

Streaming platforms solve discovery badly. Recommendation algorithms optimise for engagement over preference, and the result is a homepage that reflects what you watched last week, not what you actually want to watch tonight. Most people still ask a friend or open Google.

This app puts the user back in control: search anything, curate your own list, and return to it on your terms. The interface shifts to dark mode automatically in the evening — when most people actually sit down to watch — without requiring a settings menu.

---

## What It Does

**Search page (`index.html`)**
- Loads five personally curated show recommendations on page open, fetched live from the OMDb database
- Full-text search across the OMDb library of 500,000+ titles
- One-click add to watchlist, with instant visual confirmation and disabled state to prevent duplicates
- State persists across sessions via `localStorage`

**Watchlist page (`WatchList.html`)**
- Renders each saved title with full detail: runtime, IMDb rating, and plot summary
- Remove any title with a single click — list re-renders immediately without a page reload
- Falls back to five default titles if the watchlist is empty, so the page is never blank on first visit

**Both pages**
- Automatically switch between light and dark mode based on the hour: light from 6am–7pm, dark from 7pm–6am
- Manual override toggle in the header persists for the current session

---

## Architecture

Two pages, three files, one shared data layer.

```
movies/
├── index.html          — search and discovery page
├── WatchList.html      — saved titles page
├── index.js            — search logic, recommendations, add-to-watchlist
├── watchlist.js        — watchlist render, remove logic
└── index.css           — shared styles for both pages, light and dark mode
```

Both pages share a single `index.css` and communicate exclusively through `localStorage`. There is no server, no database, no build step, and no shared JS file — the state layer is the browser itself.

```
index.js  ──writes──▶  localStorage["movieWatchlist"]  ◀──reads──  watchlist.js
```

This is the same pattern used in multi-tab web applications: isolated scripts, shared persistent storage, no coupling between modules.

---

## Data Layer

The app consumes the [OMDb API](https://www.omdbapi.com) — a REST interface over the IMDb dataset. Two distinct endpoint modes are in use:

**Keyword search** (`?s=`) — returns a lightweight results array, one object per title:
```js
fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${userQuery}`)
```
Response shape: `{ Search: [{ imdbID, Title, Year, Poster }], totalResults, Response }`

**ID lookup** (`?i=`) — returns full detail for a single known title:
```js
fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${movieId}`)
```
Response shape: `{ Title, Year, Runtime, imdbRating, Plot, Poster, imdbID, Response }`

The watchlist stores only `imdbID` strings — the minimum viable identifier. Full title data is fetched fresh on every watchlist render. This keeps `localStorage` lightweight and ensures details are always current from the source.

---

## Async Patterns

Both JS files use `async/await` with `for...of` loops for sequential fetching. This is a deliberate choice over `Promise.all()`:

```js
// Sequential — each card renders as it arrives
for (let id of favShowIds) {
    const response = await fetch(`...&i=${id}`)
    const movie = await response.json()
    if (movie.Response === "False") continue  // guard clause
    grid.innerHTML += `...`
}
```

**Why sequential over parallel:** `Promise.all()` would render all cards simultaneously once every request resolves, meaning a slow response blocks the entire grid. Sequential fetching lets each card appear as soon as its data arrives — progressive rendering without any additional complexity.

**Guard clause on every fetch:** `if (movie.Response === "False") continue` — the OMDb API returns HTTP 200 even for failed lookups, encoding the error in the JSON body. A status check alone would miss this. The guard prevents broken cards from rendering silently.

---

## State Management

All watchlist state is a JSON-serialised array of IMDb ID strings in `localStorage`:

```js
// Write
localStorage.setItem("movieWatchlist", JSON.stringify(watchlist))

// Read
let watchlist = JSON.parse(localStorage.getItem("movieWatchlist")) || []
```

**Why store IDs rather than full objects:** storing only the identifier decouples the persistence layer from the API response shape. If OMDb adds or changes fields, the stored data requires no migration — only the render template needs updating.

**Duplicate prevention:** before any push, `watchlist.includes(targetMovieId)` is checked. The button is also immediately disabled and restyled on click, so the UI confirms the action before the storage write completes.

---

## Event Delegation

Neither page attaches listeners directly to individual movie cards. Instead, a single listener sits on the container and checks the event target:

```js
moviesContainer.addEventListener("click", function (e) {
    if (e.target.classList.contains("add-to-watchlist-btn")) {
        const targetMovieId = e.target.dataset.id
        // ...
    }
})
```

This handles cards that don't exist in the DOM at bind time — search results and fetched recommendations are injected via `innerHTML` after the listener is attached. Direct listeners on dynamically rendered elements would silently fail.

---

## Time-Based Theming

The theme engine reads the system clock on page load and applies a class to `<body>`:

```js
function applyTimeBasedTheme() {
    const hour = new Date().getHours()
    const isDaytime = hour >= 6 && hour < 19
    document.body.classList.toggle("dark-mode", !isDaytime)
    updateToggleBtn()
}
```

Dark mode is implemented entirely in CSS under `body.dark-mode`. JavaScript only toggles the class — it never writes inline styles for theming. This keeps the theme system maintainable: any style change lives in one place, and the JS logic never needs to know what colours the theme uses.

The toggle button allows manual override for the current session without touching `localStorage` — intentionally ephemeral, because the time-based default will be correct again on the next visit.

---

## Built With

- **HTML5** — semantic structure across two pages, shared stylesheet
- **CSS3** — `body.dark-mode` cascade for theming, flexbox layout, CSS transitions on theme switch
- **Vanilla JavaScript** — Fetch API, `async/await`, `localStorage`, event delegation, `Date` API for time-based logic
- **[OMDb API](https://www.omdbapi.com)** — movie and TV data source
- **Zero dependencies** — no npm, no bundler, no framework

---

## Roadmap

| Feature | Technical requirement |
|---------|----------------------|
| **Genre filter on search** | OMDb doesn't support genre filtering via `?s=` — requires fetching full detail per result via `?i=` and filtering client-side |
| **Watchlist reordering** | Replace the flat array with an array of `{ id, order }` objects; implement drag-and-drop via the HTML Drag and Drop API |
| **Watched vs unwatched tags** | Extend the stored object from a plain ID string to `{ id, watched: false }`; add a toggle button that updates the stored state and re-renders the card |
| **Search result pagination** | OMDb returns 10 results per page with a `totalResults` count; implement a `page` parameter that increments on "Load more" |
| **Offline support** | Cache API responses in `localStorage` with a timestamp; serve cached data when the network is unavailable and flag stale results |

---

## Run Locally

No install required — but open via a local server, not directly from the filesystem. `file:///` paths treat each page as a separate security origin, which blocks `localStorage` from being shared between pages.

**Recommended: VS Code Live Server extension**
Right-click `index.html` → Open with Live Server.

**Or via Python:**
```bash
cd movies
python3 -m http.server 3000
# open http://localhost:3000
```
