"""Package generated frontend assets, never runtime secrets or source workspaces."""
import hashlib, zipfile
from pathlib import Path
root = Path(__file__).resolve().parents[2]
dist = root / 'dist'
assert (dist / 'index.html').is_file()
target = root / 'output' / 'download-safety-20261016'
target.mkdir(parents=True, exist_ok=True)
archive = target / 'frontend-download-safety.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as package:
    for file in sorted(dist.rglob('*')):
        if file.is_file(): package.write(file, file.relative_to(dist).as_posix())
digest = hashlib.sha256(archive.read_bytes()).hexdigest()
(target / 'frontend-download-safety.sha256').write_text(digest, encoding='ascii')
print(f'bytes={archive.stat().st_size} sha256={digest}')
