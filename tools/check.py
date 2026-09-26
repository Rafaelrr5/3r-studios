"""Render + check the 3R Studios site: screenshots, overflow, errors, keyboard, frame timing."""
import asyncio, json
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(r"C:\Users\faelr\Downloads\reps\3r-studios")
OUT = ROOT / "shots"; OUT.mkdir(exist_ok=True)
URL = (ROOT / "index.html").as_uri()

CLIP = """(() => [...document.querySelectorAll('h1,h2,.ln,.bd,.go,.more,.say,.chips')]
  .filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.className || e.tagName))()"""

async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(channel="chrome")
        # desktop
        pg = await b.new_page(viewport={"width": 1440, "height": 900})
        errs = []; pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: m.type == "error" and errs.append(m.text))
        await pg.goto(URL); await pg.wait_for_timeout(1500)
        print("mode:", await pg.evaluate("document.documentElement.className"))
        await pg.screenshot(path=OUT / "d1-intro.png")
        await pg.keyboard.press("ArrowRight"); await pg.wait_for_timeout(1400)
        print("after → count:", await pg.inner_text("#count"))
        await pg.screenshot(path=OUT / "d2-plate1.png")
        # hover the artwork for parallax
        box = await pg.locator(".plate").nth(0).locator(".art").bounding_box()
        await pg.mouse.move(box["x"] + box["width"] * .8, box["y"] + box["height"] * .8, steps=8); await pg.wait_for_timeout(900)
        await pg.screenshot(path=OUT / "d3-parallax.png")
        # frame timing over a fast scripted scroll
        await pg.evaluate("""window.__f=[];let t=performance.now();(function f(n){const now=performance.now();__f.push(now-t);t=now;if(n)requestAnimationFrame(()=>f(n-1))})(120)""")
        for _ in range(12):
            await pg.mouse.wheel(0, 320); await pg.wait_for_timeout(40)
        await pg.screenshot(path=OUT / "d4-motion.png")
        await pg.wait_for_timeout(1500)
        f = await pg.evaluate("__f.slice(1)"); f.sort()
        print(f"frames n={len(f)} median={f[len(f)//2]:.1f}ms p95={f[int(len(f)*.95)]:.1f}ms max={f[-1]:.1f}ms")
        for i in range(3): await pg.keyboard.press("ArrowRight"); await pg.wait_for_timeout(900)
        print("after 3× → count:", await pg.inner_text("#count"), "clipped:", await pg.evaluate(CLIP))
        await pg.screenshot(path=OUT / "d5-plate4.png")
        await pg.keyboard.press("End"); await pg.wait_for_timeout(1500)
        await pg.screenshot(path=OUT / "d6-end.png")
        print("desktop errors:", errs)
        # mobile
        ctx = await b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        m = await ctx.new_page(); m.on("pageerror", lambda e: errs.append("m:" + str(e)))
        await m.goto(URL); await m.wait_for_timeout(1500)
        print("mobile mode:", repr(await m.evaluate("document.documentElement.className")),
              "hscroll:", await m.evaluate("document.documentElement.scrollWidth > innerWidth"), "clipped:", await m.evaluate(CLIP))
        await m.screenshot(path=OUT / "m1.png")
        await m.evaluate("document.querySelector('.plate').scrollIntoView()"); await m.wait_for_timeout(1300)
        await m.screenshot(path=OUT / "m2.png")
        print("all errors:", errs)
        await b.close()

asyncio.run(main())
