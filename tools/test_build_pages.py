"""Regression checks for the public-only Pages upload."""
import base64
import hashlib
import importlib.util
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
                         'jogar/arrumadinho/assets/secret.json', 'jogar/arrumadinho/src/secret.py'):
                p = source / name
                p.parent.mkdir(parents=True, exist_ok=True)
                p.write_text('fixture', encoding='utf-8')
            count = MODULE.build(source, output)
            actual = {p.relative_to(output).as_posix() for p in output.rglob('*') if p.is_file()}
            self.assertEqual(count, len(actual))
            self.assertEqual(actual, set(MODULE.STATIC) | {
                'jogar/arrumadinho/index.html', 'jogar/arrumadinho/assets/player.png',
                'jogar/arrumadinho/src/game.js'})
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
        shipped = set(MODULE.STATIC) | {'jogar/arrumadinho/index.html'}
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
                target = href.split('#')[0].lstrip('/').removeprefix('./')
                if target == '' or target.endswith('/'):
                    target += 'index.html'
                self.assertIn(target, shipped, (name, href))

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

    def test_missing_asset_fails_before_copying(self):
        with tempfile.TemporaryDirectory() as tmp:
            source, output = Path(tmp) / 'source', Path(tmp) / 'upload'
            source.mkdir()
            with self.assertRaises(ValueError):
                MODULE.build(source, output)
            self.assertFalse(output.exists())


if __name__ == '__main__':
    unittest.main()
