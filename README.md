# 3R Studios

Rafael Rocha's studio site. It shows the open-source projects from [github.com/Rafaelrr5](https://github.com/Rafaelrr5).

Live: https://3r-studios.pages.dev/

GitHub Pages mirror: https://rafaelrr5.github.io/3r-studios/

The site is one static page with no build step and no framework: `index.html`, `style.css`, `main.js`, `i18n.js`, `projects.js` and `projetos.json`. You can host it on anything that serves files (not `file://`: the project list is fetched).

## Motion
- On desktop, scrolling down moves the projects sideways. The ← and → keys jump from one project to the next.
- The shapes on each card tilt with how fast you scroll, and shift slightly with the cursor.
- Phones and touch screens get a normal vertical page, where each card's artwork builds in as it comes into view.

## Languages
Português (Brasil), English, Español and Français. The first visit follows the browser's language, and a choice made in Settings is remembered on that device. All copy lives in `i18n.js`, and every visible string has an entry in all four languages.

## Settings panel
Everything here is remembered on the device and applied before the first paint, so there is no flash of the wrong theme or language.
- **Theme:** auto (follows the system), light or dark.
- **Motion:** auto (follows the system's reduced-motion setting), full or reduced.
- **Browsing:** sideways, vertical, or auto (sideways on desktop with a mouse).
- **Text size:** 100%, 115% or 130%.
- **High contrast** and **Underline links**.

## Accessibility
- Skip link, landmarks, and a proper heading order (h1 → h2 → h3 per project).
- In sideways mode, the page follows keyboard focus so a focused link is always on screen.
- Links that open a new tab say so to screen readers, in the current language.
- The settings panel is a native `<dialog>`: it keeps focus inside, closes with Esc, and returns focus to the button that opened it.
- On mobile, every button and link is at least 44px.
- Works with Windows high-contrast mode (`forced-colors`).

## Performance
- Only `transform` is animated.
- One `requestAnimationFrame` loop runs only while something is moving, then stops. Nothing runs while the page is idle.

## Check
```
python -m http.server 8765        # axe needs http, not file://
python tools/check.py http://127.0.0.1:8765/
python tools/check.py https://rafaelrr5.github.io/3r-studios/
```
Needs playwright and Chrome. It saves screenshots to `shots/` and reports:
- script errors and text that overflows its box
- keyboard, skip-link and focus behaviour
- the settings dialog, and whether settings persist after a reload
- missing translations in each language
- the system dark and reduced-motion settings
- mobile tap target sizes
- how long frames take during a fast scroll
- an axe-core accessibility audit (WCAG 2.2 AA plus best practices) in light, dark, high contrast and on mobile

## Projects
The cards come from `projetos.json`, the public project catalog. `projects.js` builds them and `main.js` waits for it before measuring the track, so the counter, hints, keys and progress bar follow however many projects there are (zero included).

Each project has an `id`, `name`, `kind` (`product` or `lab`), `status` (`live`, `dev` or empty), `platform`, `year`, `topics`, and two independent switches: `showCode` + `codeUrl` and `useProject` + `projectUrl`. A link only appears when its switch is on and the address is a safe `http(s)` URL or site-relative path beginning with `./` (without parent-directory traversal).

The seven original cards keep their artwork and four-language copy through `template` (`rp`, `dj`, `p1`…`p5`). Leave `tagline`/`description` empty to use that translated copy; text typed there replaces it in every language. New projects get generic artwork.

Only public information goes in this file. The private dashboard (`3r-studios-interno`, `python3 servir.py`) edits it locally; publishing still means committing and pushing this repo.

Tests: `node tools/test-projects.cjs`.

## Downloads and browser projects

`usar.html` provides download buttons and extraction/opening instructions in Portuguese, English, Spanish and French. Both Windows x64 ZIPs are hosted as public GitHub Release assets in their own repositories, tagged `v0.1.0-windows-preview`; `downloads/releases.json` records their URLs, byte sizes and SHA-256 hashes. Local ZIP copies are ignored by Git and excluded from the Pages upload. The page does not install software, disable antivirus or grant Claude permissions.

- Extrato Claro: renamed display/app title for `financas-br`. The Windows executable includes Python and PDF parsing; users do not install Python. Data stays in `%LOCALAPPDATA%\\3R Studios\\Extrato Claro`.
- Claude Autosend: includes Node and production dependencies. Users extract the ZIP and open `Abrir-Claude-Autosend.vbs`. Claude Code and the user's own account are separate prerequisites; the guide links to official installation instructions. If VBScript is unavailable, use `app/abrir-com-janela.cmd`.
- Qual Mon Movie and BlinkNinja: browser links only. Their catalog entries have `showCode: false` and no code URL; their repositories are not copied into this site.
- Arrumadinho: additional browser-playable prototype under `jogar/arrumadinho/`, copied from its existing static build. Its source repository stays in place. Game progress is local to the browser.

The Windows packages are unsigned previews, not stable releases. Cloudflare Pages limits individual assets to 25 MiB (official documentation: https://developers.cloudflare.com/pages/platform/limits/); the ZIPs are therefore served from GitHub Releases rather than uploaded to Pages.

## Cloudflare Pages deployment

Stage only public runtime assets, never the repository root or private dashboard:

```
python3 -m unittest discover -s tools -p test_build_pages.py
python3 tools/build-pages.py <new-empty-directory>
npx wrangler pages deploy <new-empty-directory> --project-name 3r-studios --branch main
```

`tools/build-pages.py` refuses non-empty output directories and excludes repository metadata, documentation, test tools, private data and ZIPs. The production branch is `main`. Publishing from this directory is a separate step from pushing Git; the existing GitHub Pages mirror builds from `main` automatically. Management remains in the private repository and on localhost, not in either public deployment.
