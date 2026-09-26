"""Render + check the 3R Studios site.

Usage: python tools/check.py [URL]   (defaults to the local index.html)
Reports: script errors, overflowing text, sideways overflow on mobile, keyboard navigation,
frame timing, all 4 languages, light/dark, settings dialog, and an axe-core accessibility audit.
"""
import asyncio, sys
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
LIVE = len(sys.argv) > 1
URL = sys.argv[1] if LIVE else (ROOT / "index.html").as_uri()
OUT = ROOT / ("shots/live" if LIVE else "shots"); OUT.mkdir(parents=True, exist_ok=True)
AXE = "https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js"
print("checking", URL)

CLIP = """(() => [...document.querySelectorAll('h1,h3,.ln,.bd,.go,.more,.say,.li,.seg span,.tg span')]
  .filter(e => e.offsetParent && e.scrollWidth > e.clientWidth + 1).map(e => (e.className||e.tagName)+':'+e.textContent.slice(0,30)))()"""
LEAK = """(() => { const t = I18N.en; if (document.documentElement.lang === 'en') return [];
  return [...document.querySelectorAll('[data-i18n]')].filter(e => e.textContent === t[e.dataset.i18n]
    && !['tag','auto','vert'].includes(e.dataset.i18n)).map(e => e.dataset.i18n) })()"""

async def axe(pg, label):
    await pg.add_script_tag(url=AXE)
    r = await pg.evaluate("""axe.run(document, {runOnly: {type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice']}})
      .then(r => r.violations.map(v => ({id: v.id, impact: v.impact, n: v.nodes.length, t: v.nodes.slice(0,2).map(n => n.target.join(' '))})))""")
    print(f"axe[{label}]:", "clean" if not r else r)
    return r

async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(channel="chrome")
        errs = []
        def watch(p, tag=""):
            p.on("pageerror", lambda e: errs.append(tag + str(e)))
            p.on("console", lambda m: m.type == "error" and errs.append(tag + m.text))

        # ---------- desktop, English, light ----------
        ctx = await b.new_context(viewport={"width": 1440, "height": 900}, locale="en-US", color_scheme="light")
        pg = await ctx.new_page(); watch(pg)
        await pg.goto(URL); await pg.wait_for_timeout(1500)
        print("mode:", await pg.evaluate("document.documentElement.className"), "lang:", await pg.evaluate("document.documentElement.lang"))
        await pg.screenshot(path=OUT / "d1-intro.png")
        await pg.keyboard.press("ArrowRight"); await pg.wait_for_timeout(1400)
        print("after → count:", await pg.inner_text("#count"))
        await pg.screenshot(path=OUT / "d2-plate1.png")
        await pg.evaluate("""window.__f=[];let t=performance.now();(function f(n){const now=performance.now();__f.push(now-t);t=now;if(n)requestAnimationFrame(()=>f(n-1))})(120)""")
        for _ in range(12):
            await pg.mouse.wheel(0, 320); await pg.wait_for_timeout(40)
        await pg.wait_for_timeout(1500)
        f = sorted(await pg.evaluate("__f.slice(1)"))
        print(f"frames n={len(f)} median={f[len(f)//2]:.1f}ms p95={f[int(len(f)*.95)]:.1f}ms max={f[-1]:.1f}ms")
        for _ in range(5): await pg.keyboard.press("ArrowRight"); await pg.wait_for_timeout(900)
        await pg.screenshot(path=OUT / "d3-end.png")
        print("clipped(en):", await pg.evaluate(CLIP))
        await axe(pg, "desktop light en")

        # keyboard: Tab from the top, skip link, then tabbing keeps the focused link on screen
        await pg.goto(URL); await pg.wait_for_timeout(1200)
        await pg.keyboard.press("Tab")
        print("first tab:", await pg.evaluate("document.activeElement.className + ' | ' + document.activeElement.textContent.trim()"))
        await pg.keyboard.press("Enter"); await pg.wait_for_timeout(600)
        print("skip → focus:", await pg.evaluate("document.activeElement.id"), "count:", await pg.inner_text("#count"))
        for _ in range(3): await pg.keyboard.press("Tab")
        await pg.wait_for_timeout(700)
        vis = await pg.evaluate("(()=>{const r=document.activeElement.getBoundingClientRect();return [document.activeElement.textContent.trim().slice(0,40), r.left>=0 && r.right<=innerWidth]})()")
        print("tabbed to:", vis[0], "| on screen:", vis[1])
        await pg.screenshot(path=OUT / "d4-focus.png")

        # settings dialog
        await pg.click("#gear"); await pg.wait_for_timeout(500)
        print("dialog open:", await pg.evaluate("document.getElementById('prefs').open"),
              "focus in dialog:", await pg.evaluate("document.getElementById('prefs').contains(document.activeElement)"))
        await pg.screenshot(path=OUT / "d5-settings.png")
        await axe(pg, "settings dialog")
        await pg.check('input[name="lang"][value="pt-BR"]', force=True)
        await pg.check('input[name="theme"][value="dark"]', force=True); await pg.wait_for_timeout(400)
        await pg.screenshot(path=OUT / "d6-settings-dark-pt.png")
        await pg.keyboard.press("Escape"); await pg.wait_for_timeout(300)
        print("esc → focus back on gear:", await pg.evaluate("document.activeElement.id === 'gear'"))
        await pg.reload(); await pg.wait_for_timeout(1300)
        print("persisted:", await pg.evaluate("[document.documentElement.lang, document.documentElement.dataset.theme]"), "title:", await pg.title())
        await pg.screenshot(path=OUT / "d7-dark-pt-intro.png")
        await pg.keyboard.press("ArrowRight"); await pg.wait_for_timeout(1400)
        await pg.screenshot(path=OUT / "d8-dark-pt-plate.png")
        await axe(pg, "desktop dark pt-BR")

        for lang in ["pt-BR", "fr", "es", "en"]:
            await pg.evaluate(f"localStorage.setItem('3r-prefs', JSON.stringify({{lang:'{lang}', theme:'dark'}}))")
            await pg.reload(); await pg.wait_for_timeout(900)
            await pg.keyboard.press("ArrowRight"); await pg.wait_for_timeout(1200)
            print(f"[{lang}] html lang={await pg.evaluate('document.documentElement.lang')} leaks={await pg.evaluate(LEAK)} clipped={await pg.evaluate(CLIP)}")
            if lang in ("fr", "es"): await pg.screenshot(path=OUT / f"d9-{lang}.png")

        await pg.evaluate("localStorage.setItem('3r-prefs', JSON.stringify({lang:'pt-BR', theme:'light', contrast:true, text:'1.3', underline:true}))")
        await pg.reload(); await pg.wait_for_timeout(900)
        await pg.keyboard.press("ArrowRight"); await pg.wait_for_timeout(1300)
        print("a11y opts clipped:", await pg.evaluate(CLIP))
        await pg.screenshot(path=OUT / "d10-contrast-big.png")
        await axe(pg, "high contrast + 130%")

        await pg.evaluate("localStorage.setItem('3r-prefs', JSON.stringify({motion:'reduce', layout:'vert'}))")
        await pg.reload(); await pg.wait_for_timeout(900)
        print("layout=vert on desktop:", repr(await pg.evaluate("document.documentElement.className")),
              "spin anim:", await pg.evaluate("getComputedStyle(document.querySelector('.r')).animationName"))
        await pg.screenshot(path=OUT / "d11-vertical-desktop.png")
        await pg.evaluate("localStorage.clear()")

        # ---------- system settings, nothing saved ----------
        ctx2 = await b.new_context(viewport={"width": 1440, "height": 900}, locale="fr-FR", color_scheme="dark", reduced_motion="reduce")
        p2 = await ctx2.new_page(); watch(p2, "sys:")
        await p2.goto(URL); await p2.wait_for_timeout(1000)
        print("system fr+dark+reduced →", await p2.evaluate("[document.documentElement.lang, getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(), getComputedStyle(document.querySelector('.r')).animationName]"))

        # ---------- mobile ----------
        mctx = await b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True, locale="pt-BR", color_scheme="dark")
        m = await mctx.new_page(); watch(m, "m:")
        await m.goto(URL); await m.wait_for_timeout(1500)
        print("mobile mode:", repr(await m.evaluate("document.documentElement.className")), "lang:", await m.evaluate("document.documentElement.lang"),
              "hscroll:", await m.evaluate("document.documentElement.scrollWidth > innerWidth"), "clipped:", await m.evaluate(CLIP))
        await m.screenshot(path=OUT / "m1.png")
        await m.evaluate("document.querySelector('.plate').scrollIntoView()"); await m.wait_for_timeout(1300)
        await m.screenshot(path=OUT / "m2.png")
        await axe(m, "mobile dark pt-BR")
        await m.click("#gear"); await m.wait_for_timeout(600)
        await m.screenshot(path=OUT / "m3-settings.png")
        small = await m.evaluate("""[...document.querySelectorAll('a:not(.skip):not(.sr),button,.seg span,.tg span')].filter(e=>e.offsetParent)
          .map(e=>{const r=e.getBoundingClientRect();return [e.textContent.trim().slice(0,20), Math.round(r.width), Math.round(r.height)]}).filter(([,w,h])=>w&&h&&(w<24||h<24))""")
        print("mobile targets <24px:", small)
        print("ALL ERRORS:", errs)
        await b.close()

asyncio.run(main())
