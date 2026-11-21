"""Shared header/footer for every 3R page (one source, applied by `python3 tools/site_chrome.py`).

The home page (index.html) and the inner pages carry the same <header class="hd"> and
<footer class="ft" id="contato">; this script rewrites those blocks in place, so a nav change
is made here once. 404.html uses root-absolute links because it answers at any path.
"""
from pathlib import Path
import re
import sys

from i18n_pages import langs_nav

ROOT = Path(__file__).resolve().parent.parent
WA = 'https://wa.me/5532988767327?text=Oi%20Rafael%2C%20vim%20pelo%20site%20da%203R%20Studios!'
WAI = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/></svg>'
GEAR = ('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h11M19 7h2M3 17h2M10 17h11"/>'
        '<circle cx="16.5" cy="7" r="2.3"/><circle cx="7.5" cy="17" r="2.3"/></svg>')
# One line on purpose: the CSP carries its sha256 (tools/test_build_pages.py checks it).
PREFS = ('<script>(function(){var d=document.documentElement,s={};try{s=JSON.parse(localStorage.getItem("3r-prefs")||"{}")}catch(e){}'
         'var t=s.theme||"light";try{if(t==="auto"&&!localStorage.getItem("3r-theme-v2"))t="light"}catch(e){}'
         'd.dataset.theme=t;d.dataset.motion=s.motion||"auto";if(s.contrast)d.dataset.contrast="high";'
         'if(s.underline)d.dataset.underline="on";if(s.text){d.style.setProperty("--scale",s.text);d.dataset.text=s.text}})();</script>')
PAGES_NAV = [('sites.html', 'Sites'), ('whatsapp.html', 'Atendimento automático'), ('agentes-ia.html', 'Agentes de IA'),
             ('aplicativos.html', 'Aplicativos'), ('apps.html', 'Apps e jogos'), ('resenhopolis.html', 'Resenhópolis'),
             ('sobre.html', 'Sobre'), ('sobre.html#contato', 'Contato'), ('privacidade.html', 'Privacidade')]


def header(p, home=False, page='index.html'):
    h = '#' if home else f'{p or "./"}#'
    end = '#contato' if home else '#rodape'
    return (f'<header class="hd"><div class="in"><a class="logo" href="{p or "./"}">3R Studios</a>\n'
            f'<nav aria-label="Principal"><a href="{h}sobre">Sobre mim</a><a href="{h}produtos">Produtos</a>'
            f'<a href="{h}trabalhos">Trabalhos</a><a class="x" href="{p}apps.html">Apps e jogos</a><a href="{end}">Contato</a></nav>\n'
            f'{langs_nav("pt", page, p == "/")}\n'
            f'<button class="gear" id="gear" type="button" aria-haspopup="dialog" aria-controls="prefs">{GEAR}<span>Ajustes</span>'
            f'<b class="lc" aria-hidden="true">PT</b></button>\n'
            f'<a class="pill" href="{WA}">{WAI}<span>WhatsApp</span><span class="sr"> (falar com o Rafael)</span></a></div></header>')


def footer(p, current=''):
    home = p or './'
    items = [(home, 'Início', ''), (f'{home}#trabalhos', 'Trabalhos', '')] + [(p + h, l, h) for h, l in PAGES_NAV]
    nav = ''.join(f'<a href="{href}"{" aria-current=" + chr(34) + "page" + chr(34) if key and key == current else ""}>{label}</a>'
                  for href, label, key in items)
    return (f'<footer class="ft" id="rodape"><div class="in">\n'
            f'<div><span class="me">Rafael Rocha</span><small>3R Studios · Juiz de Fora (MG), Brasil</small></div>\n'
            f'<div><b>WhatsApp</b><a href="{WA}">(32) 98876-7327</a></div>\n'
            f'<div><b>E-mail</b><a href="mailto:faelrribeiro3@gmail.com">faelrribeiro3@gmail.com</a></div>\n'
            f'<div><b>LinkedIn</b><a href="https://www.linkedin.com/in/rafael-rocha-ribeiro-581bb2202/" rel="me">Rafael Rocha Ribeiro</a></div>\n'
            f'<div><b>GitHub</b><a href="https://github.com/Rafaelrr5" rel="me">Rafaelrr5</a></div>\n'
            f'</div>\n<nav aria-label="Rodapé">{nav}</nav>\n</footer>')


JUMP = ('<nav class="jump" aria-label="Atalhos"><a class="up" href="#topo" aria-label="Voltar ao topo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg></a>\n'
        '<a class="down" href="#rodape" aria-label="Ir para o final"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"/></svg></a></nav>')

INNER = ('sites.html', 'whatsapp.html', 'agentes-ia.html', 'aplicativos.html', 'apps.html', 'resenhopolis.html',
         'sobre.html', 'privacidade.html', 'usar.html', '404.html')


def apply_inner(name):
    path = ROOT / name
    html = path.read_text(encoding='utf-8')
    p = '/' if name == '404.html' else ''
    html = re.sub(r'<header class="(?:top m|hd)">.*?</header>', lambda m: header(p, page=name), html, count=1, flags=re.S)
    html = re.sub(r'<footer class="(?:foot|ft)"[^>]*>.*?</footer>', lambda m: footer(p, name), html, count=1, flags=re.S)
    html = re.sub(r'<a class="fab"[^>]*>.*?</a>\s*', '', html, flags=re.S)
    html = re.sub(r'<script>\(function\(\)\{var d=document\.documentElement.*?</script>', lambda m: PREFS, html, count=1, flags=re.S)
    html = re.sub(r'<link rel="stylesheet" href="/?style\.css">\s*', '', html)
    html = re.sub(r'<link rel="preload" href="/?fonts/bricolage[^>]*>\s*', '', html)
    if 'site.css' not in html:
        html = html.replace(f'<link rel="stylesheet" href="{p}page.css">',
                            f'<link rel="preload" href="{p}fonts/fraunces-latin.woff2" as="font" type="font/woff2" crossorigin>\n'
                            f'<link rel="stylesheet" href="{p}site.css">\n<link rel="stylesheet" href="{p}page.css">\n'
                            f'<script src="{p}site.js" defer></script>', 1)
    if 'id="topo"' not in html:
        html = re.sub(r'<body([^>]*)>', r'<body\1 id="topo">', html, count=1)
    if 'class="jump"' not in html:
        html = html.replace('</body>', JUMP + '\n</body>', 1)
    html = html.replace('href="portfolio.html"', 'href="./#trabalhos"').replace('href="/portfolio.html"', 'href="/#trabalhos"')
    path.write_text(html, encoding='utf-8')


if __name__ == '__main__':
    for n in (sys.argv[1:] or INNER):
        apply_inner(n)
    print('chrome applied')
