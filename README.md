# 3R Studios

Rafael Rocha's studio site. It shows the open-source projects from [github.com/Rafaelrr5](https://github.com/Rafaelrr5).

Live: https://rafaelrr5.github.io/3r-studios/

The site is one static page with no build step and no framework: `index.html`, `style.css`, `main.js` and `i18n.js`. You can host it on anything that serves files.

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

## Adding a project
Copy one `<article class="plate">` block in `index.html` and add its `pNln` and `pNbd` strings to each language in `i18n.js`. The counter and progress bar read the number of plates automatically.
