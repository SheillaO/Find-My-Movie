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
