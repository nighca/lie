# Mobile product demo — 2026-10-25

[Watch the mobile demo (2:09)](../../../../media/promo-video/lie-mobile-demo.mp4).

The user explicitly requested repository inclusion of their local `mobile-lie.mov` recording and links in both README versions on 2026-10-25. The source remains untouched; only the derived MP4 is included. No public video-platform upload or account operation was performed.

The recording is 128.7215 seconds, portrait 1080 × 2376, H.264/yuv420p with AAC 48 kHz mono audio. It is remuxed without re-encoding, cropping, scaling, subtitles, pixel edits or audio changes. Descriptive global/stream metadata and chapters are excluded; ordinary technical MP4 muxer/handler tags remain. Source private tags, location data and full local paths were not read or stored in the evidence.

## Construction and verification

Set `MOBILE_DEMO_SOURCE` to the authorized local MOV path; run from the repository root.

```sh
ffmpeg -hide_banner -loglevel error -nostdin -i "$MOBILE_DEMO_SOURCE" \
  -map 0:v:0 -map 0:a:0 -c copy \
  -map_metadata -1 -map_metadata:s -1 -map_chapters -1 \
  -movflags +faststart media/promo-video/lie-mobile-demo.mp4
```

[verification.json](verification.json) records source/output SHA-256, limited codec/dimension/duration fields, stream hashes, packet comparisons, MP4 box positions and exact decode command.

- All **7,838 video packets and 6,015 audio packets** preserve compressed payload SHA-256 and size. PTS, DTS and packet durations match the source exactly. Stream-copy SHA-256 checks also match for both streams.
- Dimensions, codecs, pixel format, sample rate, channel count, time bases and orientation side data match. Neither source nor output has a rotation side-data entry. The source's nominal frame-rate field is not treated as a measured playback frame rate.
- Overall and video duration remain 128.7215 seconds. The MP4 audio stream header reports 128.539625 seconds versus 128.537854 in the MOV (+1.771 ms); the compressed packet data and packet timeline are unchanged.
- Fast-start layout is confirmed: `moov` precedes `mdat`.
- Complete audio/video decode with `-xerror`, `-fps_mode:v passthrough` and `-enc_time_base:v demux` exits 0 with empty error output. These decode-output options preserve the variable frame timing; an initial default null-output check produced duplicate-DTS muxer warnings from its output time-base rounding. No repair or re-encoding was applied to the committed MP4.
- Both root README links resolve to the committed file. Output metadata was checked for standard technical tag names and handler values; source descriptive tags were not inspected.

This is one user-recorded mobile demonstration, not a certification of all mobile browsers, devices, cases or model responses. No application tests, browser session, service or provider call was needed for this media-only change.
