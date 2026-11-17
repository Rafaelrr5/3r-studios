"""Regression checks for the public-only Pages upload."""
import base64
import hashlib
import importlib.util
import json
import re
from pathlib import Path
import tempfile
import unittest

SPEC = importlib.util.spec_from_file_location('build_pages', Path(__file__).with_name('build-pages.py'))
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class PagesBuildTests(unittest.TestCase):
    def test_runtime_allowlist_excludes_sources_secrets_and_binaries(self):
        with tempfile.TemporaryDirectory() as tmp:
            source, output = Path(tmp) / 'source', Path(tmp) / 'upload'
            for name in (*MODULE.STATIC, 'jogar/arrumadinho/index.html',
                         'jogar/arrumadinho/assets/player.png', 'jogar/arrumadinho/src/game.js',
                         '.env', 'README.md', 'painel/dados.json', 'downloads/private.zip',
                         'jogar/arrumadinho/assets/secret.json', 'jogar/arrumadinho/src/secret.py',
                         'jogar/varal-veloz/index.html', 'jogar/varal-veloz/assets/index-x.js',
                         'jogar/varal-veloz/assets/index-x.css', 'jogar/varal-veloz/assets/index-x.js.map',
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
                'jogar/arrumadinho/src/game.js', 'jogar/varal-veloz/index.html',
                'jogar/varal-veloz/assets/index-x.js', 'jogar/varal-veloz/assets/index-x.css',
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
        shipped |= {p.relative_to(root).as_posix() for folder, exts in MODULE.FOLDERS.items()
                    for p in (root / folder).rglob('*') if p.suffix in exts}
        for name in (*MODULE.PAGES, '404.html'):
            html = (root / name).read_text(encoding='utf-8')
            self.assertEqual(len(re.findall(r'<title>[^<]{10,}</title>', html)), 1, name)
            self.assertRegex(html, r'<meta name="description" content="[^"]{40,}">', name)
            if name != '404.html':
                slug = '' if name == 'index.html' else name[:-5]
                self.assertIn(f'<link rel="canonical" href="{MODULE.SITE}{slug}">', html, name)
            for nav in ('sobre.html', 'sobre.html#contato', 'privacidade.html', 'resenhopolis.html', 'portfolio.html'):
                self.assertIn(f'href="{"/" if name == "404.html" else ""}{nav}"', html, (name, nav))
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
        for name in ('sites.html', 'whatsapp.html', 'aplicativos.html'):
            html = (root / name).read_text(encoding='utf-8')
            self.assertIn('"@type":"FAQPage"', html, name)
            self.assertIn('<details><summary>', html, name)

    def test_csp_allows_exactly_the_shipped_inline_scripts(self):
        root = Path(__file__).resolve().parent.parent
        headers = (root / '_headers').read_text(encoding='utf-8')
        csp = re.search(r'^/\*\n  Content-Security-Policy: (.+)$', headers, re.M).group(1)
        self.assertNotIn("'unsafe-inline'", csp)
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

    def test_missing_asset_fails_before_copying(self):
        with tempfile.TemporaryDirectory() as tmp:
            source, output = Path(tmp) / 'source', Path(tmp) / 'upload'
            source.mkdir()
            with self.assertRaises(ValueError):
                MODULE.build(source, output)
            self.assertFalse(output.exists())


if __name__ == '__main__':
    unittest.main()
