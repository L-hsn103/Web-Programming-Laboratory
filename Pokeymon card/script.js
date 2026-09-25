/* ============================================================
   DexSearch — app logic
   Fetches Pokémon data from PokeAPI and renders it into the
   trading-card markup in index.html.
   ============================================================ */

const API_BASE = "https://pokeapi.co/api/v2/pokemon/";

// Fixed display order + labels for the six base stats. PokeAPI's
// `stats` array is usually already in this order, but we map by
// name explicitly so the card is correct even if that ever changes.
const STAT_DISPLAY = [
  { key: "hp", label: "HP" },
  { key: "attack", label: "Attack" },
  { key: "defense", label: "Defense" },
  { key: "special-attack", label: "Sp. Atk" },
  { key: "special-defense", label: "Sp. Def" },
  { key: "speed", label: "Speed" },
];

const STAT_MAX = 255; // PokeAPI's practical ceiling for a single base stat

// Simple pokeball outline shown when no artwork is available, or the
// artwork URL fails to load, so a broken-image icon never appears.
const NO_ARTWORK_SRC =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
      '<circle cx="50" cy="50" r="40" fill="none" stroke="#9a978c" stroke-width="4"/>' +
      '<line x1="10" y1="50" x2="90" y2="50" stroke="#9a978c" stroke-width="4"/>' +
      '<circle cx="50" cy="50" r="9" fill="#eeece6" stroke="#9a978c" stroke-width="4"/>' +
      "</svg>"
  );

// ---------- DOM references ----------
const form = document.getElementById("search-form");
const input = document.getElementById("search-input");
const button = document.getElementById("search-button");
const quickSearch = document.getElementById("quick-search");

const stateIdle = document.getElementById("state-idle");
const stateLoading = document.getElementById("state-loading");
const stateError = document.getElementById("state-error");
const errorMessage = document.getElementById("error-message");
const card = document.getElementById("card");

const cardName = document.getElementById("card-name");
const cardId = document.getElementById("card-id");
const cardArt = document.getElementById("card-art");
const cardTypes = document.getElementById("card-types");
const cardHeight = document.getElementById("card-height");
const cardWeight = document.getElementById("card-weight");
const cardAbilities = document.getElementById("card-abilities");
const cardStatList = document.getElementById("card-stat-list");

// ---------- State machine ----------
// Exactly one of these sections is visible at a time.
function showState(next) {
  stateIdle.hidden = next !== "idle";
  stateLoading.hidden = next !== "loading";
  stateError.hidden = next !== "error";
  card.hidden = next !== "success";
}

function showLoading() {
  showState("loading");
  button.disabled = true;
  input.disabled = true;
}

function showError(message) {
  errorMessage.textContent = message;
  showState("error");
  button.disabled = false;
  input.disabled = false;
}

// ---------- Helpers ----------
function titleCase(rawName) {
  return rawName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatId(id) {
  return `#${String(id).padStart(3, "0")}`;
}

// PokeAPI gives height in decimetres and weight in hectograms.
function formatHeight(decimetres) {
  return `${(decimetres / 10).toFixed(1)} m`;
}

function formatWeight(hectograms) {
  return `${(hectograms / 10).toFixed(1)} kg`;
}

function getArtworkUrl(sprites) {
  return (
    sprites?.other?.["official-artwork"]?.front_default ||
    sprites?.front_default ||
    ""
  );
}

// ---------- Rendering ----------
function renderCard(pokemon) {
  card.dataset.type = pokemon.types[0].type.name;

  cardName.textContent = titleCase(pokemon.name);
  cardId.textContent = formatId(pokemon.id);

  const artUrl = getArtworkUrl(pokemon.sprites);

  // If the image URL itself 404s or otherwise fails to load, swap to the
  // placeholder instead of leaving a broken-image icon on the card.
  cardArt.onerror = () => {
    cardArt.onerror = null;
    cardArt.src = NO_ARTWORK_SRC;
    cardArt.alt = `No artwork available for ${titleCase(pokemon.name)}`;
  };

  if (artUrl) {
    cardArt.src = artUrl;
    cardArt.alt = `Official artwork of ${titleCase(pokemon.name)}`;
  } else {
    cardArt.src = NO_ARTWORK_SRC;
    cardArt.alt = `No artwork available for ${titleCase(pokemon.name)}`;
  }

  cardTypes.innerHTML = "";
  pokemon.types.forEach(({ type }) => {
    const li = document.createElement("li");
    li.className = `type-badge type-badge--${type.name}`;
    li.textContent = type.name;
    cardTypes.appendChild(li);
  });

  cardHeight.textContent = formatHeight(pokemon.height);
  cardWeight.textContent = formatWeight(pokemon.weight);

  cardAbilities.innerHTML = "";
  pokemon.abilities.forEach(({ ability, is_hidden }) => {
    const li = document.createElement("li");
    li.textContent = titleCase(ability.name);
    if (is_hidden) {
      li.dataset.hidden = "true";
      li.title = "Hidden ability";
    }
    cardAbilities.appendChild(li);
  });

  const statLookup = new Map(
    pokemon.stats.map((entry) => [entry.stat.name, entry.base_stat])
  );

  cardStatList.innerHTML = "";
  STAT_DISPLAY.forEach(({ key, label }) => {
    const value = statLookup.get(key) ?? 0;
    const percent = Math.min(100, Math.round((value / STAT_MAX) * 100));

    const li = document.createElement("li");
    li.className = "stat-row";
    li.innerHTML = `
      <span class="stat-row__label">${label}</span>
      <span class="stat-row__track">
        <span class="stat-row__fill" style="width: ${percent}%"></span>
      </span>
      <span class="stat-row__value">${value}</span>
    `;
    cardStatList.appendChild(li);
  });

  showState("success");
  button.disabled = false;
  input.disabled = false;
}

// ---------- Fetching ----------
let latestRequestId = 0;

async function searchPokemon(rawName) {
  const name = rawName.trim().toLowerCase();

  if (!name) {
    showError("Please enter a Pokémon name.");
    return;
  }

  // Tag this call so that if a newer search starts before this one
  // finishes, the older, slower response is ignored instead of
  // overwriting the card with stale data.
  const requestId = ++latestRequestId;

  showLoading();

  let response;
  try {
    response = await fetch(`${API_BASE}${encodeURIComponent(name)}`);
  } catch (networkError) {
    // fetch() itself rejects on network failure / no connection / CORS block
    if (requestId === latestRequestId) {
      showError(
        "Couldn't reach the Pokédex. Check your internet connection and try again."
      );
    }
    return;
  }

  if (requestId !== latestRequestId) return; // a newer search is already in flight

  if (!response.ok) {
    if (response.status === 404) {
      showError(`No Pokémon found named "${rawName.trim()}". Check the spelling and try again.`);
    } else {
      showError(`The Pokédex returned an error (status ${response.status}). Please try again.`);
    }
    return;
  }

  try {
    const data = await response.json();
    if (requestId === latestRequestId) {
      renderCard(data);
    }
  } catch (parseError) {
    if (requestId === latestRequestId) {
      showError("Received an unexpected response from the Pokédex. Please try again.");
    }
  }
}

// ---------- Event wiring ----------
form.addEventListener("submit", (event) => {
  event.preventDefault();
  searchPokemon(input.value);
});

quickSearch.addEventListener("click", (event) => {
  const chip = event.target.closest(".quick-search__chip");
  if (!chip) return;

  const name = chip.dataset.name;
  input.value = name;
  searchPokemon(name);
});

// ---------- Initial load ----------
// Show a card right away instead of the idle prompt.
input.value = "pikachu";
searchPokemon("pikachu");