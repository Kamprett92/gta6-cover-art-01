![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)
![rank](https://make.fun/badge/gta6-cover-art-01/Kamprett92/gta6-cover-art-01/rank.svg)
![reward](https://make.fun/badge/gta6-cover-art-01/Kamprett92/gta6-cover-art-01/reward.svg)

# Neon Sunset Cover Maker

A GTA 6-style cover art maker for the [gta6-cover-art-01 bounty](https://make.fun/bounty/gta6-cover-art-01) on make.fun. Load your own photos, arrange them into a multi-panel Vice City poster, grade them with a neon sunset, write a bold caption, and export a share-ready PNG.

## What it does

- **Your photos, your machine** — pick a photo for each of the three panels from a file picker; nothing is ever uploaded.
- **One photo or three** — fill every panel with a single photo, or give each panel its own.
- **Crop each panel** — click a panel in the live preview, then drag it to move, scroll to zoom, or use the zoom and pan sliders.
- **Three layouts** — Hero + 2, Split, and Triptych.
- **Three colour grades** — Vice Sunset (pink & orange), Neon Nights (magenta & teal), and Teal Dusk (cool blue & gold).
- **Bold caption lettering** — your own words, in three styles: a hot-pink banner, huge outline letters, or a small corner caption, plus a subtitle line.
- **Real post sizes** — export PNG at 1080 × 1080, 1080 × 1350, or 1920 × 1080.

Everything is original artwork in its own design: no Rockstar logo, wordmark, official artwork, character, or game font is used. The lettering is the browser's own bold system sans, and the app runs fully offline with zero network requests.

## How to run

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. Pick photos, choose a layout and size, write your caption, and hit **Export PNG**.

## How it is built

Plain static files under `app/`, no build step and no libraries:

- `app/index.html` — the studio page and its controls
- `app/style.css` — the neon editor styling
- `app/src/cover.js` — the poster painter: panel layouts, photo fit, colour grades, caption lettering
- `app/src/main.js` — the wiring: uploads, crop controls, layout/size/grade pickers, export
- `app/src/shots.js` — fixed `?shot=` scenes used for the screenshots
- `app/samples/` — two sample photos made with an image model for make.fun, free to use

`main.ts` (Node 22, standard library only) hands the entry in: it copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.

## License

MIT — see [LICENSE](LICENSE).
