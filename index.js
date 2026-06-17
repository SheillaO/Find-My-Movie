const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const moviesContainer = document.getElementById("movies-container");

const OMDB_API_KEY = "325e717d";

let watchlist = JSON.parse(localStorage.getItem("movieWatchlist")) || [];

// ─── Time-based theme ─────────────────────────────────────────────────────────
// Automatically applies dark mode at night (7pm–6am) and light mode during the day.
// The toggle button lets the user override it manually at any time.

function updateToggleBtn() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  btn.textContent = document.body.classList.contains("dark-mode") ? "☀️" : "🌙";
}

function applyTimeBasedTheme() {
  const hour = new Date().getHours();
  const isDaytime = hour >= 6 && hour < 19; // 6am to 7pm = light mode
  if (isDaytime) {
    document.body.classList.remove("dark-mode");
  } else {
    document.body.classList.add("dark-mode");
  }
  updateToggleBtn();
}

document.getElementById("theme-toggle").addEventListener("click", function () {
  document.body.classList.toggle("dark-mode");
  updateToggleBtn();
});

applyTimeBasedTheme();
 
 
// ─── Recommendations (identical to original, API URL fixed) ──────────────────
async function loadRecommendations() {
  moviesContainer.innerHTML = `
        <h2 class="recommendations-heading">Recommended for You</h2>
        <div id="recommendations-grid" class="movies-container"></div>
    `;
  const grid = document.getElementById("recommendations-grid");

  // IDs for: South Park, The Boys, Tacoma FD, The Prince, Crash Landing on You
  const favShowIds = [
    "tt0121955",
    "tt1190634",
    "tt8026448",
    "tt11650736",
    "tt10975034",
  ];

  for (let id of favShowIds) {
    const response = await fetch(
      `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${id}`,
    );
    const movie = await response.json();

    if (movie.Response === "False") continue;

    const isAdded = watchlist.includes(movie.imdbID);
    const btnText = isAdded ? "✓ Added" : "+ Add to Watchlist";
    const btnStyle = isAdded
      ? 'style="background-color: #4caf50; color: white;"'
      : "";
    const btnDisabled = isAdded ? "disabled" : "";

    const matchScore =
      movie.imdbRating && movie.imdbRating !== "N/A"
        ? `${Math.round(movie.imdbRating * 10)}% Match`
        : "";

    grid.innerHTML += `
            <div class="movie-card">
                <img src="${movie.Poster}" class="movie-poster" alt="${movie.Title} poster" />
                <div class="movie-info">
                    <h3>${movie.Title}</h3>
                    <p class="movie-year">Released: ${movie.Year}</p>
                    <p class="match-badge">${matchScore}</p>
                    <button class="add-to-watchlist-btn" data-id="${movie.imdbID}" ${btnDisabled} ${btnStyle}>
                        ${btnText}
                    </button>
                </div>
            </div>
        `;
  }
}

// ─── Search (identical to original, API URL fixed) ────────────────────────────
searchForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const userQuery = searchInput.value.trim();
    if (!userQuery) return;
 
    moviesContainer.innerHTML = `<p class="loading-text">Searching database...</p>`;
 
    const response = await fetch(
        `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${userQuery}`
    );
    const data = await response.json();
 
    if (data.Response === "True") {
        moviesContainer.innerHTML = "";
 
        for (let movie of data.Search) {
            const isAdded = watchlist.includes(movie.imdbID);

            const btnText = isAdded ? "✓ Added" : "+ Add to Watchlist";
            const btnStyle = isAdded ? 'style="background-color: #4caf50; color: white;"' : "";
            const btnDisabled = isAdded ? "disabled" : "";
 
            moviesContainer.innerHTML += `
                <div class="movie-card">
                    <img src="${movie.Poster}" class="movie-poster" alt="${movie.Title} poster" />
                    <div class="movie-info">
                        <h3>${movie.Title}</h3>
                        <p class="movie-year">Released: ${movie.Year}</p>
                        <button class="add-to-watchlist-btn" data-id="${movie.imdbID}" ${btnDisabled} ${btnStyle}>
                            ${btnText}
                        </button>
                    </div>
                </div>
            `;
        }
    } else {
        moviesContainer.innerHTML = `<p class="error-text">No results found for "${userQuery}". Try another search!</p>`;
    }
});
 
 
// ─── Add to watchlist (identical to original) ─────────────────────────────────
moviesContainer.addEventListener("click", function (e) {
    if (e.target.classList.contains("add-to-watchlist-btn")) {
        const targetMovieId = e.target.dataset.id;
 
        if (!watchlist.includes(targetMovieId)) {
            watchlist.push(targetMovieId);
            localStorage.setItem("movieWatchlist", JSON.stringify(watchlist));
 
            e.target.textContent = "✓ Added";
            e.target.disabled = true;
            e.target.style.backgroundColor = "#4caf50";
            e.target.style.color = "white";
        }
    }
});  

loadRecommendations();

// NEW: greeting message based on time of day
function showGreeting() {
  const hour = new Date().getHours();
  const greetingEl = document.getElementById("greeting");
  if (!greetingEl) return;

  if (hour >= 6 && hour < 12) {
    greetingEl.textContent = "☀️ Good morning — something light to start the day?";
  } else if (hour >= 12 && hour < 19) {
    greetingEl.textContent = "🎬 Good afternoon — here's what's worth your time.";
  } else {
    greetingEl.textContent = "🌙 Good evening — perfect time to settle in.";
  }
}

showGreeting(); // NEW: call it
