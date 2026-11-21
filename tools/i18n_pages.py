"""English, Spanish and French copies of the public pages, built from the pt-BR source.

The pt-BR HTML stays the single source. Each language has a catalog `i18n/<lang>.json` that maps a
pt-BR segment (a sentence with its inline tags, an attribute value, or a JSON-LD string) to its
translation. `build()` writes `<out>/<lang>/<page>.html`; a missing segment or a translation whose
inline tags differ from the source stops the build, so no Portuguese leaks into another language.

  python3 tools/i18n_pages.py missing <lang>   # JSON of pt-BR segments the catalog still lacks
"""
from pathlib import Path
from urllib.parse import quote, unquote
import html as htmllib
import json
import re
import sys

ROOT = Path(__file__).resolve().parent.parent
SITE = 'https://3rstudios.com.br/'
LANGS = {'en': ('en', 'English', 'en_US'), 'es': ('es', 'Español', 'es_ES'), 'fr': ('fr', 'Français', 'fr_FR')}
ALL = [('pt', 'pt-BR', 'Português')] + [(k, v[0], v[1]) for k, v in LANGS.items()]
PAGES = ('index.html', 'sites.html', 'whatsapp.html', 'agentes-ia.html', 'aplicativos.html', 'apps.html',
         'resenhopolis.html', 'sobre.html', 'privacidade.html', 'usar.html', '404.html')

TOKEN = re.compile(r'<!--.*?-->|<(script|style|svg)\b.*?</\1\s*>|<[^>]+>|[^<]+', re.S | re.I)
INLINE = {'a', 'b', 'strong', 'em', 'i', 'span', 'small', 's', 'u', 'code', 'abbr', 'mark', 'q', 'time', 'sup', 'sub', 'kbd'}
OPAQUE = {'br', 'img', 'wbr'}
ATTRS = ('alt', 'title', 'aria-label', 'placeholder', 'aria-roledescription')
META = {'description', 'og:title', 'og:description', 'og:image:alt', 'twitter:title', 'twitter:description'}
LETTER = re.compile(r'[^\W\d_]', re.U)


def tag_name(tok):
    m = re.match(r'<\s*(/?)\s*([a-zA-Z0-9-]+)', tok)
    return (m.group(2).lower(), m.group(1) == '/') if m else (None, False)


def kind(tok):
    """'text', 'opaque' (kept verbatim inside a sentence), 'inline' (open/close) or 'block'."""
    if not tok.startswith('<'):
        return 'text'
    if tok.startswith('<!--') or re.match(r'<svg\b', tok, re.I):
        return 'opaque'
    name, _ = tag_name(tok)
    if name in OPAQUE:
        return 'opaque'
    if name in INLINE:
        return 'inline'
    return 'block'


def norm(s):
    return re.sub(r'\s+', ' ', s).strip()


def tags_of(snippet):
    return sorted(t for t in (m.group(0) for m in TOKEN.finditer(snippet)) if t.startswith('<'))


class Translator:
    def __init__(self, catalog):
        self.catalog = catalog
        self.missing = {}   # pt-BR segment -> kind, kept in source order
        self.bad = []

    def t(self, s, what='text'):
        key = norm(s)
        if not LETTER.search(htmllib.unescape(re.sub(r'<[^>]+>', '', key))):
            return s
        if key not in self.catalog:
            self.missing.setdefault(key, what)
            return s
        out = self.catalog[key]
        if what == 'text' and tags_of(out) != tags_of(key):
            self.bad.append(key)
            return s
        return out

    # -- sentences (text runs with their inline tags) --------------------------------------------
    def run(self, toks):
        lead, trail = [], []
        while toks and (kind(toks[0]) == 'opaque' or (kind(toks[0]) == 'text' and not toks[0].strip())):
            lead.append(toks.pop(0))
        while toks and (kind(toks[-1]) == 'opaque' or (kind(toks[-1]) == 'text' and not toks[-1].strip())):
            trail.insert(0, toks.pop())
        if not toks:
            return ''.join(lead + trail)
        # Pair inline tags; an unpaired one (its partner sits across a block tag) splits the run.
        stack, pair = [], {}
        for i, tok in enumerate(toks):
            if kind(tok) == 'inline':
                name, closing = tag_name(tok)
                if not closing:
                    stack.append((name, i))
                elif stack and stack[-1][0] == name:
                    pair[stack.pop()[1]] = i
        closed = set(pair.values())
        loose = [i for i, tok in enumerate(toks) if kind(tok) == 'inline' and i not in pair and i not in closed]
        if loose:
            out, start = [], 0
            for i in loose:
                out += [self.run(toks[start:i]), toks[i]]
                start = i + 1
            out.append(self.run(toks[start:]))
            return ''.join(lead + out + trail)
        # Text at the top level: this is one sentence. Otherwise translate each top-level element.
        depth, top_text = 0, False
        for i, tok in enumerate(toks):
            k = kind(tok)
            if depth == 0 and tok.startswith('<span class="wd"'):
                top_text = True  # a heading split into word spans (for its animation) is still one sentence
            if k == 'inline':
                depth += -1 if i in closed else 1
            elif k == 'text' and depth == 0 and LETTER.search(tok):
                top_text = True
        if top_text:
            return ''.join(lead) + self.t(''.join(toks)) + ''.join(trail)
        out, i = [], 0
        while i < len(toks):
            if i in pair:
                j = pair[i]
                out += [toks[i], self.run(toks[i + 1:j]), toks[j]]
                i = j + 1
            else:
                out.append(toks[i])
                i += 1
        return ''.join(lead + out + trail)

    def text(self, page):
        out, run = [], []
        for m in TOKEN.finditer(page):
            tok = m.group(0)
            if kind(tok) == 'block' or tok.lower().startswith(('<script', '<style')):
                out += [self.run(run), tok]
                run = []
            else:
                run.append(tok)
        out.append(self.run(run))
        return ''.join(out)

    # -- attributes, links, metadata, JSON-LD ----------------------------------------------------
    def attrs(self, tag):
        name, closing = tag_name(tag)
        if closing or name is None:
            return tag

        meta = re.search(r'(?:name|property)="([^"]+)"', tag) if name == 'meta' else None

        def attr(m):
            a, v = m.group(1).lower(), m.group(3)
            if a in ATTRS or (a == 'content' and meta and meta.group(1) in META):
                return f'{m.group(1)}={m.group(2)}{htmllib.escape(self.t(htmllib.unescape(v), "attr"), quote=True)}{m.group(2)}'
            if a == 'href':
                return f'{m.group(1)}={m.group(2)}{self.query_text(v)}{m.group(2)}'
            return m.group(0)
        return re.sub(r'([a-zA-Z:-]+)=(["\'])(.*?)\2', attr, tag, flags=re.S)

    def query_text(self, href):
        """Prefilled WhatsApp messages and e-mail subjects go out in the visitor's language."""
        def one(m):
            raw = htmllib.unescape(m.group(2))
            return m.group(1) + quote(self.t(unquote(raw), 'attr'), safe='')
        if href.startswith(('https://wa.me/', 'mailto:')):
            return re.sub(r'([?&](?:text|subject)=)([^&"]*)', one, href)
        return href

    def jsonld(self, block, lang, page):
        def walk(node, key=''):
            if isinstance(node, dict):
                return {k: walk(v, k) for k, v in node.items()}
            if isinstance(node, list):
                return [walk(v, key) for v in node]
            if isinstance(node, str):
                if key in ('url', 'item', '@id') and node.startswith(SITE) and '#org' not in node:
                    return page_url(lang, node[len(SITE):])
                if key == 'inLanguage':
                    return LANGS[lang][0]
                if key.startswith('@') or key in ('url', 'logo', 'email', 'image', 'telephone', 'sameAs', 'item') \
                        or re.match(r'^(https?:|mailto:)', node):
                    return node
                return self.t(node, 'json')
            return node
        data = walk(json.loads(block))
        return json.dumps(data, ensure_ascii=False, separators=(',', ':'))


def page_url(lang, path):
    """Absolute URL of a page in a language; path is relative to the site root ('', 'sites', 'x#y')."""
    path = re.sub(r'\.html(?=$|#)', '', path)
    if path.startswith('index'):
        path = path[len('index'):]
    return SITE + ('' if lang == 'pt' else lang + '/') + path


def langs_nav(lang, page, absolute=False):
    """The language switch shown in the header of every page (links to the same page)."""
    stem = '' if page == 'index.html' else page
    links = []
    for code, tag, label in ALL:
        path = ('' if code == 'pt' else code + '/') + stem
        href = '/' + path if absolute else (('' if lang == 'pt' else '../') + path or './')
        cur = ' aria-current="true"' if code == lang else ''
        short = 'PT' if code == 'pt' else code.upper()
        links.append(f'<a href="{href}" hreflang="{tag}" lang="{tag}"{cur}><span aria-hidden="true">{short}</span>'
                     f'<span class="sr">{label}</span></a>')
    name = {'pt': 'Idioma', 'en': 'Language', 'es': 'Idioma', 'fr': 'Langue'}[lang]
    return f'<nav class="langs" aria-label="{name}">{"".join(links)}</nav>'


def alternates(page):
    stem = '' if page in ('index.html', '404.html') else page
    if page == '404.html':
        return ''
    return ''.join(f'<link rel="alternate" hreflang="{tag}" href="{page_url(code, stem)}">\n' for code, tag, _ in ALL) + \
        f'<link rel="alternate" hreflang="x-default" href="{page_url("pt", stem)}">\n'


SKIP_REL = re.compile(r'^(?:[a-z][a-z0-9+.-]*:|#|/|\./|\.\./|$)', re.I)


def relink(html, lang, page):
    """Links from /<lang>/x.html: pages stay siblings; assets, games and samples go up one level."""
    absolute = page == '404.html'

    def rel(m):
        a, q, v = m.group(1), m.group(2), m.group(3)
        if absolute:
            if re.match(r'^/(?:[\w-]+\.html)?(?:#.*)?$', v) and (v[1:].split('#')[0] in PAGES or v[1:].split('#')[0] == ''):
                return f'{a}={q}/{lang}{v}{q}'
            return m.group(0)
        if SKIP_REL.match(v) or v.split('#')[0].split('?')[0] in PAGES:
            return m.group(0)
        return f'{a}={q}../{v}{q}'
    return re.sub(r'\b(href|src)=(["\'])(.*?)\2', rel, html)


def translate(source_html, page, lang, catalog, tr=None):
    tr = tr or Translator(catalog)
    tag, _, locale = LANGS[lang]
    html = source_html
    # The language switch and the language code on the Ajustes button are rebuilt for this language
    # and kept out of the text pass (comment placeholders are opaque to it).
    keep = [langs_nav(lang, page, page == '404.html'), f'<b class="lc" aria-hidden="true">{lang.upper()}</b>']
    html = re.sub(r'<nav class="langs".*?</nav>', '<!--keep0-->', html, flags=re.S)
    html = re.sub(r'<b class="lc" aria-hidden="true">PT</b>', '<!--keep1-->', html)
    html = tr.text(html)
    html = html.replace('<!--keep0-->', keep[0]).replace('<!--keep1-->', keep[1])
    out = []
    for m in TOKEN.finditer(html):
        tok = m.group(0)
        if re.match(r'<script type="application/ld\+json">', tok):
            body = tok[tok.index('>') + 1:tok.rindex('</script')]
            out.append('<script type="application/ld+json">' + tr.jsonld(body, lang, page) + '</script>')
        elif re.match(r'<svg\b', tok, re.I):
            out.append(re.sub(r'<[^>]+>', lambda t: tr.attrs(t.group(0)), tok))
        elif tok.startswith('<') and not tok.startswith(('<!--', '<script', '<style')):
            out.append(tr.attrs(tok))
        else:
            out.append(tok)
    html = ''.join(out)
    html = relink(html, lang, page)
    html = html.replace('<html lang="pt-BR"', f'<html lang="{tag}"', 1)
    html = html.replace('content="pt_BR"', f'content="{locale}"')
    stem = '' if page == 'index.html' else page
    html = re.sub(r'(<link rel="canonical" href=")[^"]*', lambda m: m.group(1) + page_url(lang, stem), html)
    html = re.sub(r'(<meta property="og:url" content=")[^"]*', lambda m: m.group(1) + page_url(lang, stem), html)
    html = re.sub(r'<link rel="alternate" hreflang=[^>]*>\n?', '', html)
    html = html.replace('<link rel="canonical"', alternates(page) + '<link rel="canonical"', 1) if alternates(page) else html
    return html


def load(lang):
    path = ROOT / 'i18n' / f'{lang}.json'
    return json.loads(path.read_text(encoding='utf-8')) if path.exists() else {}


def add_alternates(html, page):
    """pt-BR pages get the same hreflang links as their translations."""
    html = re.sub(r'<link rel="alternate" hreflang=[^>]*>\n?', '', html)
    alt = alternates(page)
    return html.replace('<link rel="canonical"', alt + '<link rel="canonical"', 1) if alt else html


def sitemap(xml):
    """Every pt-BR <loc> also listed in en/es/fr, each with its hreflang alternates."""
    def entry(m):
        path, rest = m.group(1)[len(SITE):], m.group(2)
        alts = ''.join(f'<xhtml:link rel="alternate" hreflang="{tag}" href="{page_url(code, path)}"/>' for code, tag, _ in ALL)
        return ''.join(f'  <url><loc>{page_url(code, path)}</loc>{rest}{alts}</url>\n' for code, _, _ in ALL)
    xml = re.sub(r'  <url><loc>([^<]+)</loc>(.*?)</url>\n', entry, xml)
    return xml.replace('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
                       '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">')


def build(source, output):
    """Write pt-BR alternates into the staged pt pages, the three translated trees and the multilingual
    sitemap. Returns the translated files written (paths)."""
    source, output = Path(source), Path(output)
    written = []
    (output / 'sitemap.xml').write_text(sitemap((output / 'sitemap.xml').read_text(encoding='utf-8')), encoding='utf-8')
    for page in PAGES:
        staged = output / page
        staged.write_text(add_alternates(staged.read_text(encoding='utf-8'), page), encoding='utf-8')
    for lang in LANGS:
        catalog = load(lang)
        tr = Translator(catalog)
        for page in PAGES:
            html = translate((source / page).read_text(encoding='utf-8'), page, lang, catalog, tr)
            dest = output / lang / page
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(html, encoding='utf-8')
            written.append(dest)
        if tr.missing or tr.bad:
            raise ValueError(f'{lang}: {len(tr.missing)} untranslated segments, {len(tr.bad)} with changed inline tags '
                             f'(run: python3 tools/i18n_pages.py missing {lang}); first: '
                             f'{(list(tr.missing) + tr.bad)[:3]}')
    return written


def missing(lang):
    tr = Translator(load(lang))
    for page in PAGES:
        translate((ROOT / page).read_text(encoding='utf-8'), page, lang, tr.catalog, tr)
    return {'missing': tr.missing, 'bad_tags': tr.bad}


if __name__ == '__main__':
    if len(sys.argv) == 3 and sys.argv[1] == 'missing':
        print(json.dumps(missing(sys.argv[2]), ensure_ascii=False, indent=1))
    else:
        raise SystemExit(__doc__)
