from pathlib import Path
import hashlib
import json
import math

root = Path(__file__).resolve().parent
manifest = json.loads((root / 'source-manifest.json').read_text())
verification = json.loads((root / 'verification.json').read_text())
for name, source in manifest['versions'].items():
    assert source['rawModuleSha256'] == verification['nativeServedModuleSha256'][name]
    for path, expected in [(f'sources/{name}.ts', source['playerSha256']), ('sources/pcm.ts', source['pcmSha256']), (f'sources/{name}.mjs', source['moduleSha256'])]:
        assert hashlib.sha256((root / path).read_bytes()).hexdigest() == expected, path
assert hashlib.sha256((root / 'native-results.json').read_bytes()).hexdigest() == verification['resultSha256']
r = json.loads((root / 'native-results.json').read_text())
assert len(r['cases']) == 72
assert len({(c['rate'], c['signal'], c['mode'], c['version']) for c in r['cases']}) == 72
for c in r['cases']:
    assert c['closed']
    assert len(c['schedule']) == 10
    assert sum(s['sampleCount'] for s in c['schedule']) == 3200
    for s in c['schedule']:
        assert math.isclose(s['end'] - s['start'], s['sampleCount'] / 16000, abs_tol=1e-9)
    if c['rate'] == 16000:
        assert c['runReference']['differentSamples'] == 0
    if c['mode'] == 'matched-onset':
        assert math.isclose(c['onset'], .1, abs_tol=1e-9)
        assert c['matchedOnsetVsBaseline']['differentSamples'] == 0
    if c['mode'] == 'second-at-30ms':
        assert math.isclose(c['totalGapMs'], 10 if c['version'] == 'baseline' else 0, abs_tol=1e-6)
    if c['mode'] == 'exhaustion':
        assert math.isclose(c['totalGapMs'], 50, abs_tol=1e-6)
print(json.dumps({'cases': 72, 'sourceHashes': 'matched', 'schedules': 'consistent', 'matchedOnsetThreeVersionsEqual': True, 'nativeResultSha256': hashlib.sha256((root / 'native-results.json').read_bytes()).hexdigest()}, indent=2))
