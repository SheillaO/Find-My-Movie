const OMDB_API_KEY = "325e717d";
let watchlist = JSON.parse(localStorage.getItem("movieWatchlist"));


if (!watchlist || watchlist.length === 0) {
  watchlist = [
    "tt0072562",
    "tt0410975",
    "tt9813792",
    "tt0098904",
    "tt1266020",
    "tt8962124",
    "tt10970762",
    "tt0903747",
    "tt0944947",
    "tt0386676",
    "tt0773262",
    "tt4934214",
    "tt2297757",
    "tt3530232",
    "tt0264235",
    "tt2707408",
  ];
  localStorage.setItem("movieWatchlist", JSON.stringify(watchlist));
}


let watchlistContainer, themeToggleBtn;

function init() {
  watchlistContainer = document.getElementById("watchlist-container");
  themeToggleBtn = document.getElementById("theme-toggle");

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", function () {
      document.body.classList.toggle("dark-mode");
      updateToggleBtn();
    });
  }

  applyTimeBasedTheme();
  showGreeting();
  renderWatchlist();
  setupWatchlistEvents();
}

function updateToggleBtn() {
  if (!themeToggleBtn) return;
  themeToggleBtn.textContent = document.body.classList.contains("dark-mode")
    ? "☀️"
    : "🌙";
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

async function renderWatchlist() {
  if (!watchlistContainer) return;

  if (watchlist.length === 0) {
    displayEmptyState();
    return;
  }

  watchlistContainer.innerHTML = `<p class="loading-text">Loading your watchlist...</p>`;

  try {
    
    const fetchPromises = watchlist.map((id) =>
      fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${id}`).then(
        (res) => res.json(),
      ),
    );
    const moviesData = await Promise.all(fetchPromises);

    let htmlContent = "";

    for (let movieData of moviesData) {
      if (!movieData || movieData.Response === "False") continue;

      const matchScore =
        movieData.imdbRating && movieData.imdbRating !== "N/A"
          ? `${Math.round(movieData.imdbRating * 10)}% Match`
          : "";

      htmlContent += `
        <div class="movie-card" data-card-id="${movieData.imdbID}">
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
  } catch (err) {
    console.error("Error loading watchlist details:", err);
    watchlistContainer.innerHTML = `<p class="error-text">Failed to load items. Please refresh.</p>`;
  }
}

function displayEmptyState() {
  watchlistContainer.innerHTML = `
    <div class="empty-watchlist">
        <p>Your watchlist is looking a little empty...</p>
        <a href="index.html" class="add-movies-btn">+ Let's add some movies</a>
    </div>
  `;
}

function setupWatchlistEvents() {
  if (!watchlistContainer) return;

  watchlistContainer.addEventListener("click", function (e) {
    if (e.target.classList.contains("remove-btn")) {
      const idToRemove = e.target.dataset.id;

      watchlist = watchlist.filter((id) => id !== idToRemove);
      localStorage.setItem("movieWatchlist", JSON.stringify(watchlist));

      
      const card = e.target.closest(".movie-card");
      if (card) {
        card.remove();
      }

     
      if (watchlist.length === 0) {
        displayEmptyState();
      }
    }
  });
}

function showGreeting() {
  const hour = new Date().getHours();
  const greetingEl = document.getElementById("greeting");
  if (!greetingEl) return;

  if (hour >= 6 && hour < 12) {
    greetingEl.textContent =
      "☀️ Good morning — something light to start the day?";
  } else if (hour >= 12 && hour < 19) {
    greetingEl.textContent =
      "🎬 Good afternoon — here's what's worth your time.";
  } else {
    greetingEl.textContent = "🌙 Good evening — perfect time to settle in.";
  }
}

document.addEventListener("DOMContentLoaded", init);
