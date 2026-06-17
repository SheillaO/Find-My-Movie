const watchlistContainer = document.getElementById("watchlist-container");

const OMDB_API_KEY = "325e717d";

let watchlist = JSON.parse(localStorage.getItem("movieWatchlist"));

if (!watchlist || watchlist.length === 0) {
  // IDs for: Saturday Night Live, Desperate Housewives, FROM, Seinfeld, Parks and Rec
  watchlist = ["tt0072562", "tt0410975", "tt9813792", "tt0098904", "tt1266020"];
  localStorage.setItem("movieWatchlist", JSON.stringify(watchlist));
}


// ─── Time-based theme (same as index.js) ─────────────────────────────────────
function updateToggleBtn() {
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;
    btn.textContent = document.body.classList.contains("dark-mode") ? "☀️" : "🌙";
}
 
function applyTimeBasedTheme() {
    const hour = new Date().getHours();
    const isDaytime = hour >= 6 && hour < 19;
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
 
 
// ─── Render watchlist (identical to original, API URL fixed) ──────────────────
async function renderWatchlist() {
  if (watchlist.length === 0) {
    watchlistContainer.innerHTML = `
            <div class="empty-watchlist">
                <p>Your watchlist is looking a little empty...</p>
                <a href="index.html" class="add-movies-btn">+ Let's add some movies</a>
            </div>
        `;
    return;
  }
  watchlistContainer.innerHTML = `<p class="loading-text">Loading your watchlist...</p>`;
  let htmlContent = "";

  for (let movieId of watchlist) {
    const response = await fetch(
      `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${movieId}`,
    );
    const movieData = await response.json();

    if (movieData.Response === "False") continue;

    // NEW: same match score logic
    const matchScore =
      movieData.imdbRating && movieData.imdbRating !== "N/A"
        ? `${Math.round(movieData.imdbRating * 10)}% Match`
        : "";

    htmlContent += `
            <div class="movie-card">
                <img src="${movieData.Poster}" class="movie-poster" alt="${movieData.Title} poster" />
                <div class="movie-info">
                    <h3>${movieData.Title}</h3>
                    <p class="match-badge">${matchScore}</p> 
                    <p class="movie-runtime">Runtime: ${movieData.Runtime} | Rating: ⭐ ${movieData.imdbRating}</p>
                    <p class="movie-plot">${movieData.Plot}</p>
                    <button class="remove-btn" data-id="${movieData.imdbID}">🗑️ Remove</button>
                </div>
            </div>
        `;
  }
  watchlistContainer.innerHTML = htmlContent;
}

// ─── Remove from watchlist (identical to original) ────────────────────────────
watchlistContainer.addEventListener("click", function (e) {
  if (e.target.classList.contains("remove-btn")) {
    const idToRemove = e.target.dataset.id;
    watchlist = watchlist.filter((id) => id !== idToRemove);
    localStorage.setItem("movieWatchlist", JSON.stringify(watchlist));
    renderWatchlist();
  }
});

renderWatchlist();  

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