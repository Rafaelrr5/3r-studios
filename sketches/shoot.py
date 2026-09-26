import asyncio, sys
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(r"C:\Users\faelr\Downloads\reps\3r-studios\sketches")
OUT = ROOT / "shots"; OUT.mkdir(exist_ok=True)
U = lambda d, p=None: (ROOT / d / "index.html").as_uri() + (f"?p={p}" if p else "")

async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(channel="chrome")
        pg = await b.new_page(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        # A
        await pg.goto(U("a-index")); await pg.wait_for_timeout(1800)
        ov = await pg.evaluate("(()=>{const w=document.getElementById('word');return [w.scrollWidth,w.clientWidth]})()")
        print("wordmark scroll/client:", ov, "CLIPPED" if ov[0] > ov[1] else "fits")
        await pg.screenshot(path=OUT / "A1-hero.png")
        await pg.evaluate("scrollTo(0, document.getElementById('list').offsetTop-120)"); await pg.wait_for_timeout(300)
        rows = pg.locator(".row")
        await rows.nth(0).click(); await pg.wait_for_timeout(600)
        box = await rows.nth(2).bounding_box()
        await pg.mouse.move(box["x"] + 420, box["y"] + box["height"] / 2, steps=12); await pg.wait_for_timeout(900)
        await pg.screenshot(path=OUT / "A2-list.png")
        # B
        await pg.goto(U("b-console")); await pg.wait_for_timeout(1500)
        await pg.screenshot(path=OUT / "B1.png")
        await pg.keyboard.press("ArrowDown"); await pg.keyboard.press("ArrowDown"); await pg.wait_for_timeout(1200)
        await pg.screenshot(path=OUT / "B2.png")
        # C
        await pg.goto(U("c-track")); await pg.wait_for_timeout(1500)
        await pg.screenshot(path=OUT / "C1.png")
        await pg.evaluate("scrollTo(0, document.querySelector('.plate').offsetLeft-32)"); await pg.wait_for_timeout(1500)
        await pg.screenshot(path=OUT / "C2.png")
        # palettes on A hero and B
        for p in ["ink", "night", "cobalt", "oxblood"]:
            await pg.goto(U("a-index", p)); await pg.wait_for_timeout(1600)
            await pg.screenshot(path=OUT / f"P-{p}.png")
        print("errors:", errs)
        await b.close()

asyncio.run(main())
