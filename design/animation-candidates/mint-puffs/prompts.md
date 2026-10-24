# Built-in image generation provenance

One call, rejected after actual neck/collar review. No fallback CLI, bitmap rewrite, crop export, recolour or background-removal script.

Edit target/reference: `design/appearances/assets/mint-puffs/default.png`, viewed with the other three canonical states before generation.
Original output: `/Users/nighca/.codex/generated_images/01a17031-826c-78d1-a22f-c81d29bfa21a/exec-412e1ed7-9eaf-456a-b60d-1f5efc8018ae.png`.
Originally copied unchanged during exploration, then removed from final candidate; SHA256 `4084b4e210690f00c5537646539df0c7fa6901cd471c6a99bd642a62c34978d8`. Actual PNG is 1254×1254 RGBA, alpha extrema 0–255. `transparent_background: true`.

Exact prompt:

> Use case: precise-object-edit. Edit target: provided mint-puffs canonical portrait. Create one animation head-and-neck sprite only on genuinely transparent background. Preserve precisely this young woman's dark brown skin, freckles, face proportions, large eyes and gaze, dark navy-purple curly twin puff buns, face-framing curls, linework, colors and original head tilt. Remove the body, sweater and arms entirely. Retain entire hair silhouette, face, ears and neck down to the original collar boundary. Remove only the mouth line and lips, replacing that tiny mouth region with continuous matching cheek skin, no other face changes. Do not draw a new expression. Keep head at original size/location on the same 1254x1254 transparent canvas if possible. No text, no shadows, no new clothing, no extra shapes. This mouthless head will receive canonical mouth sprites in Canvas.

The output enlarged/repositioned the isolated head and changed its neck contour. Actual review found duplicate collar/jaw contours when composited with canonical bodies. It was rejected; final package uses only four byte-for-byte canonical source PNGs and runtime Canvas masks/crops. No generated PNG is referenced or committed. The original generated output remains at its original path and this prompt/hash preserves the rejected trial evidence. Final head, face, neck and body therefore retain canonical pixels, without generated identity drift. Python/Pillow is used only for reading dimensions/alpha and geometry; it never writes images.
