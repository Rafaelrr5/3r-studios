"""Regression checks for the public-only Pages upload."""
import base64
import hashlib
import importlib.util
import json
import os
import re
from pathlib import Path
import tempfile
import unittest

SPEC = importlib.util.spec_from_file_location('build_pages', Path(__file__).with_name('build-pages.py'))
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)
import i18n_pages as I18N  # noqa: E402  (tools/ is on sys.path: build-pages.py imports it too)


class PagesBuildTests(unittest.TestCase):
    def test_runtime_allowlist_excludes_sources_secrets_and_binaries(self):
        with tempfile.TemporaryDirectory() as tmp:
            source, output = Path(tmp) / 'source', Path(tmp) / 'upload'
            for name in (*MODULE.STATIC, 'jogar/arrumadinho/index.html',
                         'jogar/arrumadinho/assets/player.png', 'jogar/arrumadinho/src/game.js',
                         '.env', 'README.md', 'painel/dados.json', 'downloads/private.zip',
                         'jogar/arrumadinho/assets/secret.json', 'jogar/arrumadinho/src/secret.py',
                         'jogar/caca-varal/index.html', 'jogar/caca-varal/assets/index-x.js',
                         'jogar/caca-varal/assets/index-x.css', 'jogar/caca-varal/assets/index-x.js.map',
                         'jogar/blinkninja/index.html', 'jogar/blinkninja/index.js', 'jogar/blinkninja/index.pck',
                         'jogar/blinkninja/index.wasm.gz', 'jogar/blinkninja/web-shell.css', 'jogar/blinkninja/index.wasm',
                         'jogar/blinkninja/source/secret.gd', 'jogar/blinkninja/schema.sql',
                         'jogar/do-zero-ao-drop/index.html', 'jogar/do-zero-ao-drop/assets/game.js',
                         'jogar/do-zero-ao-drop/assets/game.js.map', 'jogar/do-zero-ao-drop/main.js',
                         'exemplos/ousado.css', 'exemplos/loja/ousado/index.html', 'exemplos/loja/rascunho.md',
                         'img/sites/loja-ousado.webp', 'img/sites/loja-ousado.png'):
                p = source / name
                p.parent.mkdir(parents=True, exist_ok=True)
                p.write_text('fixture', encoding='utf-8')
            count = MODULE.build(source, output)
            actual = {p.relative_to(output).as_posix() for p in output.rglob('*') if p.is_file()}
            self.assertEqual(count, len(actual))
            self.assertEqual(actual, set(MODULE.STATIC) | {
                'jogar/arrumadinho/index.html', 'jogar/arrumadinho/assets/player.png',
                'jogar/arrumadinho/src/game.js', 'jogar/caca-varal/index.html',
                'jogar/caca-varal/assets/index-x.js', 'jogar/caca-varal/assets/index-x.css',
                'jogar/blinkninja/index.html', 'jogar/blinkninja/index.js', 'jogar/blinkninja/index.pck',
                'jogar/blinkninja/index.wasm.gz', 'jogar/blinkninja/web-shell.css',
                'jogar/do-zero-ao-drop/index.html', 'jogar/do-zero-ao-drop/assets/game.js',
                'exemplos/ousado.css', 'exemplos/loja/ousado/index.html', 'img/sites/loja-ousado.webp'})
            with self.assertRaises(ValueError):
                MODULE.build(source, output)
            with self.assertRaises(ValueError):
                MODULE.build(source, source.parent)

    def test_ads_files_ship_with_the_publisher_line(self):
        root = Path(__file__).resolve().parent.parent
        self.assertIn('ads.txt', MODULE.STATIC)
        self.assertIn('app-ads.txt', MODULE.STATIC)
        for name in ('ads.txt', 'app-ads.txt'):
            self.assertEqual((root / name).read_text(encoding='utf-8').strip(),
                             'google.com, pub-5017691799936042, DIRECT, f08c47fec0942fa0')

    def test_sitemap_lists_only_shipped_pages(self):
        root = Path(__file__).resolve().parent.parent
        locs = re.findall(r'<loc>(.*?)</loc>', (root / 'sitemap.xml').read_text(encoding='utf-8'))
        self.assertEqual(len(locs), len(set(locs)))
        files = []
        for loc in locs:
            self.assertTrue(loc.startswith(MODULE.SITE), loc)
            path = loc[len(MODULE.SITE):]
            files.append('index.html' if path == '' else path + '.html')
        self.assertEqual(sorted(files), sorted(MODULE.PAGES))
        for name in files:
            self.assertIn(name, MODULE.STATIC)
            self.assertTrue((root / name).is_file(), name)
        self.assertIn('sitemap.xml', MODULE.STATIC)
        self.assertIn('Sitemap: https://3rstudios.com.br/sitemap.xml',
                      (root / 'robots.txt').read_text(encoding='utf-8').splitlines())

    def test_pages_have_metadata_and_no_dead_internal_links(self):
        root = Path(__file__).resolve().parent.parent
        shipped = set(MODULE.STATIC) | {f'jogar/{g}/index.html' for g in MODULE.GAMES}
        shipped |= {f'{lang}/{page}' for lang in I18N.LANGS for page in I18N.PAGES}  # written by the build
        shipped |= {p.relative_to(root).as_posix() for folder, exts in MODULE.FOLDERS.items()
                    for p in (root / folder).rglob('*') if p.suffix in exts}
        for name in (*MODULE.PAGES, '404.html'):
            html = (root / name).read_text(encoding='utf-8')
            self.assertEqual(len(re.findall(r'<title>[^<]{10,}</title>', html)), 1, name)
            self.assertRegex(html, r'<meta name="description" content="[^"]{40,}">', name)
            if name != '404.html':
                slug = '' if name == 'index.html' else name[:-5]
                self.assertIn(f'<link rel="canonical" href="{MODULE.SITE}{slug}">', html, name)
            for nav in ('sobre.html', 'sobre.html#contato', 'privacidade.html', 'resenhopolis.html', '#trabalhos'):
                self.assertIn(f'href="{"/" if name == "404.html" else ("./" if nav.startswith("#") else "")}{nav}"', html, (name, nav))
            for href in re.findall(r'(?:href|src)="([^"]+)"', html):
                if re.match(r'(https?:|mailto:|data:|#)', href):
                    continue
                target = href.split('#')[0].split('?')[0].lstrip('/').removeprefix('./')
                if target == '' or target.endswith('/'):
                    target += 'index.html'
                self.assertIn(target, shipped, (name, href))

    def test_structured_data_is_valid_json(self):
        root = Path(__file__).resolve().parent.parent
        for name in MODULE.PAGES:
            blocks = re.findall(r'<script type="application/ld\+json">(.*?)</script>', (root / name).read_text(encoding='utf-8'), re.S)
            for body in blocks:
                data = json.loads(body)
                self.assertEqual(data['@context'], 'https://schema.org', name)
        for name in ('sites.html', 'whatsapp.html', 'agentes-ia.html', 'aplicativos.html'):
            html = (root / name).read_text(encoding='utf-8')
            self.assertIn('"@type":"FAQPage"', html, name)
            self.assertIn('<details><summary>', html, name)

    def test_csp_allows_exactly_the_shipped_inline_scripts(self):
        root = Path(__file__).resolve().parent.parent
        headers = (root / '_headers').read_text(encoding='utf-8')
        csp = re.search(r'^/\*\n  Content-Security-Policy: (.+)$', headers, re.M).group(1)
        script_src = re.search(r"script-src ([^;]+)", csp).group(1)
        self.assertNotIn("'unsafe-inline'", script_src)
        self.assertNotIn("'unsafe-eval'", script_src)
        self.assertNotRegex(script_src, r'https://cdn\.jsdelivr\.net(?:\s|$)', 'jsdelivr only under the VLibras path')
        hashes = set()
        for name in (*MODULE.PAGES, '404.html'):
            html = (root / name).read_text(encoding='utf-8')
            # The browser blocks these under the CSP: inline styles and event handlers.
            self.assertNotRegex(html, r'\sstyle="|\son[a-z]+="', name)
            for body in re.findall(r'<script>(.*?)</script>', html, re.S):
                self.assertNotIn('\n', body, f'{name}: keep inline scripts on one line (CRLF changes the hash)')
                digest = base64.b64encode(hashlib.sha256(body.encode('utf-8')).digest()).decode()
                hashes.add(f"'sha256-{digest}'")
        self.assertEqual(hashes, set(re.findall(r"'sha256-[A-Za-z0-9+/=]+'", csp)))

    def test_style_samples_are_marked_fictional_and_csp_safe(self):
        root = Path(__file__).resolve().parent.parent
        pages = sorted((root / 'exemplos').glob('*/*/index.html'))
        self.assertEqual(len(pages), 12)
        sites = (root / 'sites.html').read_text(encoding='utf-8')
        for page in pages:
            rel = page.relative_to(root).as_posix()
            html = page.read_text(encoding='utf-8')
            self.assertIn('<meta name="robots" content="noindex">', html, rel)
            self.assertIn('Exemplo de estilo.', html, rel)
            self.assertIn('Negócio fictício.', html, rel)
            self.assertNotRegex(html, r'\sstyle="|\son[a-z]+="|<script|<iframe|wa\.me|tel:', rel)
            self.assertIn(f'href="{rel[:-len("index.html")]}"', sites, rel)
            for href in re.findall(r'(?:href|src)="([^"]+)"', html):
                if re.match(r'(https?:|data:|#)', href):
                    continue
                target = (page.parent / href.split('#')[0]).resolve()
                if href.endswith('/'):
                    target /= 'index.html'
                self.assertTrue(target.is_file(), (rel, href))
                folder = target.relative_to(root).parts[0]
                self.assertTrue(target.suffix in MODULE.FOLDERS.get(folder, set())
                                or target.relative_to(root).as_posix() in MODULE.STATIC, (rel, href))
        for src in re.findall(r'src="(img/sites/[^"]+)"', sites):
            self.assertTrue((root / src).is_file(), src)

    def test_real_work_section_never_ships_empty(self):
        html = (Path(__file__).resolve().parent.parent / 'sites.html').read_text(encoding='utf-8')
        html = re.sub(r'<!--.*?-->', '', html, flags=re.S)
        if 'id="feitos"' in html:
            section = html.split('id="feitos"', 1)[1].split('<h2', 1)[0]
            self.assertIn('<article', section)

    def test_local_css_and_js_get_a_content_hash_version(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / 'source'
            for name in (*MODULE.STATIC, *(f'jogar/{g}/index.html' for g in MODULE.GAMES)):
                p = source / name
                p.parent.mkdir(parents=True, exist_ok=True)
                p.write_text('fixture', encoding='utf-8')
            (source / 'style.css').write_text('body{color:red}', encoding='utf-8')
            (source / 'main.js').write_text('console.log(1)', encoding='utf-8')
            (source / 'index.html').write_text(
                '<link rel="stylesheet" href="style.css?v=stale"><script src="main.js" defer></script>'
                '<link href="/page.css"><script src="https://static.example/x.js"></script>'
                '<script src="//cdn.example/y.js"></script><script src="missing.js"></script>'
                '<a href="sobre.html">x</a>', encoding='utf-8')
            def built(n):
                out = Path(tmp) / f'out{n}'
                MODULE.build(source, out)
                return (out / 'index.html').read_text(encoding='utf-8')
            html = built(1)
            v = lambda name: hashlib.sha256((source / name).read_bytes()).hexdigest()[:10]
            self.assertIn(f'href="style.css?v={v("style.css")}"', html)
            self.assertIn(f'src="main.js?v={v("main.js")}"', html)
            self.assertIn(f'href="/page.css?v={v("page.css")}"', html)
            for kept in ('src="https://static.example/x.js"', 'src="//cdn.example/y.js"', 'src="missing.js"', 'href="sobre.html"'):
                self.assertIn(kept, html)
            self.assertNotIn('stale', html)
            (source / 'style.css').write_text('body{color:blue}', encoding='utf-8')
            self.assertNotEqual(re.search(r'style\.css\?v=(\w+)', html).group(1),
                                re.search(r'style\.css\?v=(\w+)', built(2)).group(1))

    def test_home_ships_in_portuguese_without_browser_language_detection(self):
        root = Path(__file__).resolve().parent.parent
        for name in MODULE.PAGES:
            html = (root / name).read_text(encoding='utf-8')
            self.assertIn('<html lang="pt-BR"', html, name)
            for body in re.findall(r'<script>(.*?)</script>', html, re.S):
                self.assertNotIn('navigator', body, name)
        self.assertNotIn('navigator.language', (root / 'main.js').read_text(encoding='utf-8'))

    def test_every_page_ships_translated_with_working_links(self):
        root = Path(__file__).resolve().parent.parent
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / 'site'
            MODULE.build(root, out)
            files = {p.relative_to(out).as_posix() for p in out.rglob('*') if p.is_file()}
            xml = (out / 'sitemap.xml').read_text(encoding='utf-8')
            for lang, tag in (('en', 'en'), ('es', 'es'), ('fr', 'fr')):
                for page in I18N.PAGES:
                    html = (out / lang / page).read_text(encoding='utf-8')
                    self.assertIn(f'<html lang="{tag}"', html, (lang, page))
                    self.assertIn(f'<nav class="langs"', html, (lang, page))
                    self.assertRegex(html, r'<a [^>]*aria-current="true"[^>]*lang="' + tag + '"|<a [^>]*lang="' + tag + '"[^>]*aria-current="true"')
                    if page != '404.html':
                        slug = '' if page == 'index.html' else page[:-5]
                        self.assertIn(f'<link rel="canonical" href="{MODULE.SITE}{lang}/{slug}">', html, (lang, page))
                        self.assertIn(f'hreflang="pt-BR" href="{MODULE.SITE}{slug}"', html, (lang, page))
                        self.assertIn(f'<loc>{MODULE.SITE}{lang}/{slug}</loc>', xml)
                    # Every local link resolves to a shipped file, from inside /<lang>/.
                    for href in re.findall(r'(?:href|src)="([^"]+)"', html):
                        if re.match(r'(https?:|mailto:|data:|#)', href):
                            continue
                        path = href.split('#')[0].split('?')[0]
                        rel = path.lstrip('/') if path.startswith('/') else f'{lang}/{path}'
                        target = os.path.normpath(rel or '.').replace(os.sep, '/')
                        if path.endswith('/') or path == '':
                            target = 'index.html' if target == '.' else target + '/index.html'
                        self.assertIn(target, files, (lang, page, href))
            pt = (out / 'index.html').read_text(encoding='utf-8')
            self.assertIn(f'<link rel="alternate" hreflang="fr" href="{MODULE.SITE}fr/">', pt)

    def test_translation_keeps_tags_and_fails_on_missing_text(self):
        tr = I18N.Translator({'Olá <b>mundo</b>.': 'Hello <b>world</b>.', 'Oi': 'Hi', 'Imagem': 'Picture'})
        out = tr.text('<p>Olá <b>mundo</b>.</p><h2>Oi</h2><p>Sem tradução</p>')
        self.assertEqual(out, '<p>Hello <b>world</b>.</p><h2>Hi</h2><p>Sem tradução</p>')
        self.assertEqual(list(tr.missing), ['Sem tradução'])
        self.assertIn('alt="Picture"', tr.attrs('<img src="a.png" alt="Imagem">'))
        bad = I18N.Translator({'Olá <b>mundo</b>.': 'Hello world.'})
        bad.text('<p>Olá <b>mundo</b>.</p>')
        self.assertEqual(bad.bad, ['Olá <b>mundo</b>.'])

    def test_missing_asset_fails_before_copying(self):
        with tempfile.TemporaryDirectory() as tmp:
            source, output = Path(tmp) / 'source', Path(tmp) / 'upload'
            source.mkdir()
            with self.assertRaises(ValueError):
                MODULE.build(source, output)
            self.assertFalse(output.exists())


if __name__ == '__main__':
    unittest.main()
