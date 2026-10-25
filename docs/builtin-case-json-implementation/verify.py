"""Read-only canonical migration / build closure audit. Run from repository root."""
import hashlib, json, pathlib, subprocess
root = pathlib.Path.cwd()
base = '4b3aa05562c9356cfac5293de60960c25df0400b'
def old(name): return subprocess.check_output(['git', 'show', f'{base}:{name}'])
def sha(data): return hashlib.sha256(data).hexdigest()
catalog = {item['id']: item for item in json.loads(old('content/case-catalog.json'))}
cases = []
for path in sorted(pathlib.Path('content/games').glob('*.json')):
    game = json.loads(path.read_text()); summary = game.pop('summary')
    assert game == json.loads(old(f"content/games/{game['id']}.json"))
    assert summary == catalog[game['id']]['summary']
    cases.append({'file': str(path), 'id': game['id'], 'sha256': sha(path.read_bytes()), 'storyUnchangedExceptSummary': True})
assert {case['id'] for case in cases} == set(catalog)
protected = subprocess.check_output(['git', 'ls-tree', '-r', '--name-only', base, '--', 'apps/web/public/appearances', 'design/character-presets', 'packages/character-animation', 'packages/voice', 'package-lock.json'], text=True).splitlines()
for name in protected: assert pathlib.Path(name).read_bytes() == old(name), name
assert not list(pathlib.Path('apps/web/dist/games').rglob('*.json'))
assert not list(pathlib.Path('apps/web/public/games').glob('*.json'))
assets = pathlib.Path('apps/gateway/.cloudflare/output/v0/workers/default/assets')
files = [p for p in pathlib.Path('apps/web/dist').rglob('*') if p.is_file()]
for p in files:
    rel = p.relative_to('apps/web/dist')
    assert (assets / rel).read_bytes() == p.read_bytes(), str(rel)
    assert not any(word in str(rel).lower() for word in ['fixture', 'single-json-proof', 'qa-'])
static = list(pathlib.Path('apps/web/dist/static').rglob('*'))
static_files = [p for p in static if p.is_file()]
for p in static_files:
    data = p.read_bytes()
    if p.suffix in ['.js', '.css', '.json']:
        import re
        for url in re.findall(r'/static/[^\s"\'<>)}]+', data.decode()):
            assert pathlib.Path('apps/web/dist', url.lstrip('/')).is_file(), url
print(json.dumps({'base': base, 'cases': cases, 'protectedFilesIdentical': len(protected), 'webFilesEqualWorkerAssets': len(files), 'staticFiles': len(static_files), 'publicGamesRemoved': True, 'qaExcluded': True}, indent=2, ensure_ascii=False))
