"""Copy only public runtime assets into a new Pages upload directory.

Usage: python3 tools/build-pages.py <empty-output-directory>
ZIPs live on GitHub Releases, not in this deployment or Git history.
"""
from pathlib import Path
import shutil
import sys

ROOT = Path(__file__).resolve().parent.parent
STATIC = (
    'index.html', 'style.css', 'main.js', 'i18n.js', 'projects.js',
    'projetos.json', 'usar.html', 'use.css', 'use.js', 'downloads/releases.json',
)


def build(source, output):
    source, output = Path(source).resolve(), Path(output).resolve()
    if output == source or source.is_relative_to(output):
        raise ValueError('The output directory must not contain the source repository.')
    if output.exists() and (not output.is_dir() or any(output.iterdir())):
        raise ValueError('Choose a new or empty output directory; existing files are never removed.')
    files = [source / name for name in STATIC]
    game = source / 'jogar' / 'arrumadinho'
    files += [game / 'index.html']
    for folder, extensions in [('assets', {'.png'}), ('src', {'.js'})]:
        files += [p for p in (game / folder).rglob('*') if p.is_file() and p.suffix in extensions]
    for p in files:
        if not p.is_file() or not p.resolve().is_relative_to(source) or p.is_symlink():
            raise ValueError(f'Missing or unsafe public asset: {p}')
        if p.stat().st_size > 25 * 1024 * 1024:
            raise ValueError(f'Public asset exceeds the Pages size limit: {p}')
    for p in files:
        dest = output / p.relative_to(source)
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(p, dest)
    return len(files)


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    print(f'{build(ROOT, sys.argv[1])} public assets staged in {Path(sys.argv[1]).resolve()}')
