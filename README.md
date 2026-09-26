# 3R Studios

Rafael Rocha's studio site. It shows the open-source projects from [github.com/Rafaelrr5](https://github.com/Rafaelrr5).

The site is one static page with no build step and no framework: `index.html`, `style.css` and `main.js`. You can host it on anything that serves files.

## Motion
- On desktop, scrolling down moves the projects sideways. The ← and → keys jump from one project to the next.
- The shapes on each card tilt with how fast you scroll, and shift slightly with the cursor.
- Phones and touch screens get a normal vertical page, where each card's artwork builds in as it comes into view.
- If `prefers-reduced-motion` is on, every animation is turned off.

## Performance
- Only `transform` is animated.
- One `requestAnimationFrame` loop runs only while something is moving, then stops.
- Nothing runs while the page is idle.

## Check
```
python tools/check.py   # needs playwright + Chrome
```
Takes desktop and mobile screenshots into `shots/`. Reports script errors, text that overflows its box, sideways overflow on mobile, whether keyboard navigation works, and how long frames take during a fast scroll.

## Adding a project
Copy one `<article class="plate">` block in `index.html` and edit its text. The counter and progress bar read the number of plates automatically.
