# Mint result candidate — pending browser QA

2026-10-25. Owner `result_lane_two`. Base: `365269b6185be586b69c0fac2b7ba15defeb7a6f`.

User approved strengthened Coral reference and delegated remaining-character self acceptance and local integration. This candidate is not a browser-accepted result yet.

- Two original imagegen edits saved byte-for-byte with complete prompts, source IDs, SHA-256, dimensions and alpha in `generation-records.json` / `prompts.json`.
- Original four clips, original nodes and all four original native PNGs retained. New full-canvas expression images are referenced only through the original head mask; old mouth overlays hidden for result clips.
- Result-only torso/left arm/right arm/question arm masks reuse original default/speaking pixels. Rigid 1.2-second head nod/tilt and independent arms; no scale tracks or whole-person sway.
- Reader v2 parse and 242 rigid pose samples passed. Full `check.mjs` intentionally still requires both native terminal PNGs, which do not exist until parent exports them.
- Parent now owns actual renderer endpoint export, t=.35/.75 motion inspection, seam correction, replay/terminal hold review, and final `check.mjs`. In particular review the newly separated shoulder/underarm joins and the questioning palm boundary. No UI/runtime/preset files modified.

## Source history and stopped service

Ordered prior lane commits from the same base:
1. `174d98c43c83e5f0dcb0660edc42d22b68e7d5f3`: Silver Bun result candidate.
2. `6f83ce9cf661c13610d052c919a783eab4e724d4`: Silver review screenshot renamed JPEG without changing bytes; metadata corrected to JPEG 1280×781.
3. `4fa81cacf2a78bf3dc7f77087ffee4b9d3f4f14f`: Plum Crop result candidate.
4. See Git history: `docs(design): record completed lane preview service shutdown` updates only Silver/Plum provenance.

Silver and Plum native terminal exports, t=.30/.35 and .75 actual Canvas inspection, original source invariants and 242 rigid samples each passed. Their new expressions preserve silhouette and static mouth registration; no original asset or old-state transforms were replaced.

Temporary Vite service consumer was only this lane's Silver/Plum QA. Worktree: `/Users/nighca/.codex/worktrees/result-reactions-lane-two/lie`; base above plus candidate changes. Port 5357, exact PID 53348, original PTY 99017, own IAB tab 1. Stopped using Ctrl-C in original PTY (exit 130), lsof confirmed no listener; tab closed. No service or tab retained. Early private preview missed required AbortSignal; it was corrected before either terminal export. No new port will be started; parent owns same-origin 5355 QA. Parent 5355 and launchd 8787/8788 were untouched.

No main mutation, push, PR, shared contract, generator, preset activation or App/style changes. Imagegen skill followed; no Python raster editing (PIL only read dimensions/alpha/mime).
