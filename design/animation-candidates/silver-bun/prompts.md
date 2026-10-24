# Actual built-in imagegen prompts

All calls used `transparent_background:true`. No CLI, API key, new vendor, or pixel processing. Original outputs retained under `/Users/nighca/.codex/generated_images/01a16db7-5ef1-7342-b690-7847489750d7/`. Four initial calls and one targeted fix; below lists actual chronological invocation order.

## 1 · head · selected
Reference/edit target: canonical `silver-bun/default.png`. Output `exec-0d6778c7-bc4c-4ebd-8a3b-195b1c0ed108.png`.

> Use case: precise-object-edit. Asset type: reusable 2D game animation sprite. Edit target: attached silver haired older woman. Extract ONLY her complete head with hair, silver bun, both turquoise earrings, face, and a short neck extension down to collarbone. Remove ALL clothing, torso, arms, hands. Keep her exact face, cheerful eyes, silver hair silhouette, navy outlines, original 2D cel shading and skin tone. Erase the lips/mouth only by continuing surrounding natural cheek skin, so another mouth sprite can be overlaid. Keep nose and smile cheek creases. Head must not be redesigned. Place single head centered, enough transparent margin all sides, genuinely transparent background. No extra items, no text.

## 2 · torso · superseded by fix
Reference/edit target: canonical `silver-bun/default.png`. Output `exec-2ead87ea-cca0-410a-b7a0-ea2ad7b3f245.png`. Has unwanted halo.

> Use case: precise-object-edit. Reusable 2D animation torso sprite from attached silver-haired woman. Keep EXACT clothing and proportion: aqua cardigan with navy outlines, white scoop-neck shirt, navy high-waist trousers to image bottom. Remove head and ALL arms including sleeves, hands, shoulders outer sleeves. Leave the torso central cardigan panels and white shirt intact, neck stub skin extending upwards from collar for head overlap. The cardigan body must have clean side contours from inner shoulder to hips, no arm fragments. Full torso from neck to mid thighs, isolated centered on genuinely transparent background. Preserve original illustration style, colors, buttons, pleats, waist shape. Do not redesign. No text.

## 3 · waiting arms · rejected
Reference/edit target: canonical `silver-bun/waiting.png`. Output `exec-31606037-653d-4866-afe7-c1dce4dacce1.png`. Hand and shoulder proportions did not align without distortion; canonical runtime polygon cutouts used instead.

> Use case: precise-object-edit. Asset type: reusable 2D animation arm contact group. Edit target attached older woman waiting/thinking. Extract ONLY BOTH connected arms in EXACT same thoughtful pose: on image left the aqua sleeve elbow bent up, bare forearm rising to curled hand with fingers supporting chin; image right aqua sleeve bent inward with bare forearm held horizontally across waist supporting opposite elbow. Keep their relative placement as one contact group. Remove the entire head, neck, torso, white shirt, cardigan body panels and trousers. Preserve original sleeve folds, hand shapes, proportions, navy outlines, aqua and skin colors. Transparent negative space between limbs must be genuinely transparent. Original precise 2D style; no redesign; no text; isolated group centered with transparent margin.

## 4 · torso halo fix · selected with runtime mask
Reference/edit target: output 2 (viewed before edit). Output `exec-a15516eb-16f0-4660-a632-ee9d8ef38c35.png`. Halo still present in PNG; authored runtime silhouette mask excludes it. Original bytes retained.

> Use case: background-extraction. Correct this sprite: remove EVERY blue/skin glow, blurred halo, shadow or gradient outside the torso silhouette. Background must be completely transparent at all pixels outside the precise dark ink contour, including around the severed neck and cardigan shoulders. Keep exact torso/clothes unchanged. Crisp opaque cel artwork inside contour, genuine transparent alpha outside. No luminous backdrop, no shadow, no dark background, no new clothing.

## 5 · mouth atlas · selected
Reference/edit targets: canonical `silver-bun/default.png` and `silver-bun/speaking.png`. Output `exec-cc23c077-ca28-4f1b-8ba6-9896060af9a8.png`.

> Use case: precise-object-edit. Sprite asset: ONLY the mouth/lips of this exact silver-haired woman, not her head. Two mouth sprites side-by-side horizontally with wide transparent empty gap: LEFT her closed warm asymmetrical smile with terracotta lips; RIGHT her open speaking smile with upper teeth and darker mouth cavity. Keep original navy thin outline, terracotta color, original angled smile shape. Remove every cheek/skin pixel, nose, chin, face, eyes: only lips and inside mouth remain. Two isolated mouths on genuine transparent background. No skin patch, no labels, no text, no shadows or glow. Each mouth approximately 300px wide, on total wide canvas with transparent margins.
