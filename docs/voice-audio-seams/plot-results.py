from pathlib import Path
import json
import os
os.environ.setdefault('MPLCONFIGDIR', str(Path(__file__).resolve().parents[2] / 'tmp/voice-audio-seams/matplotlib'))
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

root = Path(__file__).resolve().parent
result = json.loads((root / 'native-results.json').read_text())
fig, axes = plt.subplots(2, 2, figsize=(10, 6), constrained_layout=True)
for row, signal in enumerate(['dc', 'sine']):
    selected = [case for case in result['cases'] if case['rate'] == 48000 and case['signal'] == signal and case['mode'] == 'matched-onset']
    first = selected[0]['representativeWindow']
    axes[row, 0].plot(first['offsets'], first['runReference'], color='black', linewidth=2, label='single-source run reference')
    for case, style in zip(selected, ['-', '--', ':']):
        window = case['representativeWindow']
        axes[row, 0].plot(window['offsets'], window['actual'], style, marker='.', label=case['version'])
    axes[row, 0].set(title=f'{signal}: 48 kHz, seam after packet {first["afterPacket"]}', xlabel='output samples relative to worst seam', ylabel='amplitude')
    axes[row, 0].grid(alpha=.2)
    axes[row, 0].legend(fontsize=8)
    for version, style in zip(['baseline', 'gap', 'current'], ['-', '--', ':']):
        case = next(case for case in result['cases'] if case['rate'] == 16000 and case['signal'] == signal and case['mode'] == 'matched-onset' and case['version'] == version)
        window = case['representativeWindow']
        axes[row, 1].plot(window['offsets'], window['actual'], style, marker='.', label=version)
    axes[row, 1].set(title=f'{signal}: 16 kHz, seam after packet {window["afterPacket"]}', xlabel='output samples relative to seam', ylabel='amplitude')
    axes[row, 1].grid(alpha=.2)
    axes[row, 1].legend(fontsize=8)
fig.suptitle('Actual historical player modules; synthetic PCM only\nEach panel shows the rate-specific maximum-error seam; packet positions may differ', fontsize=11)
fig.savefig(root / 'seam-comparison.png', dpi=170)
