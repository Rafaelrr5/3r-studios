"""Regression checks for the public-only Pages upload."""
import importlib.util
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

    def test_missing_asset_fails_before_copying(self):
        with tempfile.TemporaryDirectory() as tmp:
            source, output = Path(tmp) / 'source', Path(tmp) / 'upload'
            source.mkdir()
            with self.assertRaises(ValueError):
                MODULE.build(source, output)
            self.assertFalse(output.exists())


if __name__ == '__main__':
    unittest.main()
