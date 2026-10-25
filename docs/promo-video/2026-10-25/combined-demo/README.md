# Combined product demo — 2026-10-25

Status: completed media, authorized by the user for repository submission on 2026-10-25.

[Watch the complete demo](../../../../media/promo-video/lie-demo.mp4).

The 1280 × 800, 30 fps MP4 runs 187.433 seconds (3:07), with gameplay first and case creation, preview, and sharing second. Gameplay retains the recorded player microphone and character voices. The creation source was silent; that section has a continuous silent audio track. No narration or music was added. This is the interface and case naming shown at recording time.

## Sources and construction

- Accepted gameplay preview: `lie-gameplay-complete-preview.mp4`, SHA-256 `4e9d9badf30c66bfe89e199d9cacfdcdb67bcf4d404b4c88f12137601cb29afc`. Its source stays in the local capture archive.
- Previously committed creation/share capture: `media/promo-video/lie-create-preview-share.mp4`, SHA-256 `d61398d0140d7027d53ac83d81cf4bc8dde4b64c65724c3be30bb0dff6e1345c`.
- Output: `media/promo-video/lie-demo.mp4`, 11,646,788 bytes, SHA-256 `5d662845a39ad08db9a7936651bd85eabecee406d800bbd7113f48f1c5b69c2a`.

Run `python3 build.py <accepted-gameplay-preview.mp4> <creation-share.mp4> <output.mp4>` with FFmpeg 8.0. The script is specific to these approved clips. It pads the gameplay ending by two held frames and aligns its audio to 114.033333 seconds before joining the 73.4-second creation section. H.264/AAC encoding and fast-start metadata support ordinary browser playback. `build-verification.json` preserves the actual build command and probe results; paths in that evidence refer to the producing workstation.

The user accepted the gameplay preview with its existing short capture holds. Combining does not remove those holds or reconstruct the original click instant. The authorization covers this combined video, including the actual player voice; failed takes and separate microphone recordings remain local.

## Verification

The independent reviewer produced `independent-check.py` and `independent-qa.json`; the check script records the original workstation paths. Its audio comparison decodes both sources and output, while frame comparisons check the start, seam, and ending. The producing agent also inspected the seam and final frames.

- Complete FFmpeg decode with `-xerror`: passed.
- Video: 5,623 frames, 1280 × 800, 30 fps; timestamps strictly increase at 1/30-second intervals. Video/audio packet DTS values strictly increase.
- Output audio: AAC, 48 kHz, mono. All 62 voiced one-second windows remain, with minimum waveform correlation 0.9892 and RMS ratios 0.9961–1.0013 versus the gameplay input. The final voiced sample remains at 105.1870625 seconds. AAC is lossy; these checks establish preservation of the recorded dialogue, not bit-identical audio.
- Creation audio and a half-second on either side of the join are silent, without a join transient.
- Source-to-output frame comparisons confirm gameplay precedes creation, with no black join or truncated creation ending.
- Both root README links resolve to the committed MP4. No application or provider configuration changed.
