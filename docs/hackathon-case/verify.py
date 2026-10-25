"""Read-only proof; run from the repository root after npm run build."""
import hashlib, json, pathlib, subprocess
root = pathlib.Path.cwd()
base = '2268f84f02576d4384f0d30f9f117a70164f135a'
case_path = pathlib.Path('content/games/04-hackathon-old-project.json')
sha = lambda data: hashlib.sha256(data).hexdigest()
old = lambda name: subprocess.check_output(['git', 'show', f'{base}:{name}'])
protected = subprocess.check_output(['git', 'ls-tree', '-r', '--name-only', base, '--', 'apps', 'packages', 'scripts', 'design', 'content', 'package.json', 'package-lock.json'], text=True).splitlines()
for name in protected:
    assert pathlib.Path(name).read_bytes() == old(name), name
cases = sorted(pathlib.Path('content/games').glob('*.json'))
assert len(cases) == 4
case = json.loads(case_path.read_text())
assert case['id'] == 'hackathon-old-project'
assert not pathlib.Path('content/case-catalog.json').exists()
assert not pathlib.Path('apps/web/public/games').exists()
web = pathlib.Path('apps/web/dist')
assets = pathlib.Path('apps/gateway/.cloudflare/output/v0/workers/default/assets')
outputs = [p for p in web.rglob('*') if p.is_file()]
for path in outputs:
    assert (assets / path.relative_to(web)).read_bytes() == path.read_bytes(), str(path)
js_files = list((web / 'assets').glob('*.js'))
js = '\n'.join(p.read_text() for p in js_files)
for value in [case['id'], case['title'], case['summary']]:
    assert value in js, value
assert not any(p.suffix == '.json' for p in (web / 'games').glob('*'))
print(json.dumps({'base': base, 'caseFile': str(case_path), 'caseSha256': sha(case_path.read_bytes()), 'officialCases': [str(p) for p in cases], 'unchangedExistingProductFiles': len(protected), 'productChange': 'one added canonical JSON only', 'newCaseIdTitleSummaryInProductionJavaScript': True, 'webFilesEqualWorkerAssets': len(outputs), 'productionJavaScript': [{'path': str(p.relative_to(web)), 'sha256': sha(p.read_bytes())} for p in js_files]}, ensure_ascii=False, indent=2))
