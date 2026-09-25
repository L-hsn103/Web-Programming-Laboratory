# DexSearch — Pokémon Search Application

A small vanilla HTML/CSS/JS app that searches [PokeAPI](https://pokeapi.co/) for a Pokémon
by name and displays the result as a trading-card-style profile, themed by the
Pokémon's primary type.

## Features

- Search form (text input + button) — press **Enter** or click **Search**
- Three quick-search buttons: Pikachu, Charizard, Bulbasaur
- Loading indicator while the request is in flight
- Distinct error messages for: empty input, Pokémon not found (404), other
  API errors, and network/connection failures
- Card displays: name, Pokédex ID, official artwork, type(s), height, weight,
  abilities (including hidden abilities), and all six base stats as bars
- Card's color theme changes based on the Pokémon's primary type
- Responsive layout (mobile → desktop)

## API endpoint and data fields used

**Endpoint:** `GET https://pokeapi.co/api/v2/pokemon/{name}`

The Pokémon's name is lowercased and trimmed before being inserted into the
URL, since the API expects lowercase names/IDs. Everything the card needs
comes from this one endpoint — no additional API calls are made.

| Displayed as     | JSON path                                                        | Notes                                   |
|-------------------|-------------------------------------------------------------------|------------------------------------------|
| Name              | `name`                                                            | Title-cased for display                  |
| Pokédex ID        | `id`                                                              | Zero-padded to 3 digits, e.g. `#025`      |
| Artwork           | `sprites.other["official-artwork"].front_default`                | Falls back to `sprites.front_default`     |
| Type(s)           | `types[].type.name`                                               | Renders one badge per type                |
| Height            | `height`                                                          | API gives decimetres → divided by 10 for metres |
| Weight            | `weight`                                                          | API gives hectograms → divided by 10 for kilograms |
| Abilities         | `abilities[].ability.name`, `abilities[].is_hidden`               | Hidden abilities are visually marked      |
| Base stats (×6)   | `stats[].stat.name`, `stats[].base_stat`                          | HP, Attack, Defense, Sp. Atk, Sp. Def, Speed; bar width is `base_stat / 255` |

## Error handling

| Situation                          | What the user sees |
|-------------------------------------|---------------------|
| Empty search submitted              | "Please enter a Pokémon name." |
| Name doesn't match any Pokémon (404)| "No Pokémon found named "…". Check the spelling and try again." |
| API responds with another error code| "The Pokédex returned an error (status …). Please try again." |
| `fetch()` itself fails (offline/CORS)| "Couldn't reach the Pokédex. Check your internet connection and try again." |

## File structure

```
pokemon-search-app/
├── index.html   # markup only
├── style.css    # layout, theming, responsive rules, type color map
├── script.js    # fetch logic, state handling, DOM rendering
├── README.md    # this file
└── screenshots/
    ├── success.png   # add: a successful search result
    └── error.png     # add: an error state (e.g. an invalid name)
```

## How to run in VS Code

1. Unzip/copy the `pokemon-search-app` folder into your project directory and
   open it in VS Code (`File → Open Folder…`).
2. Install the **Live Server** extension (by Ritwick Dey) from the
   Extensions panel, if you don't already have it.
3. Right-click `index.html` in the file explorer and choose
   **"Open with Live Server"**. This serves the app at something like
   `http://127.0.0.1:5500` and auto-reloads on save.
   - Alternative without the extension: open a terminal in the project
     folder and run `python -m http.server 5500`, then visit
     `http://localhost:5500` in your browser.
4. Try a quick-search chip, or type a name (e.g. `eevee`, `snorlax`) and
   press **Search**. Type a misspelled or made-up name to see the error
   state.

No build step, dependencies, or API key are required — the app calls
PokeAPI's public, unauthenticated REST endpoint directly from the browser.

## Submission checklist

- [ ] `screenshots/success.png` — a successful search showing the card
- [ ] `screenshots/error.png` — an error state (e.g. searching "asdf")
- [ ] This README
- [ ] `index.html`, `style.css`, `script.js`
