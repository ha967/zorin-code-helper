# Assets

All visuals are original code drawings or locally bundled packages. Nothing is fetched from a
remote image service at runtime.

## Fonts (self-hosted via @fontsource)

| Package | Weights used | License | Source |
| --- | --- | --- | --- |
| `@fontsource/space-grotesk` | 500 / 600 / 700 | SIL OFL 1.1 | https://fonts.google.com/specimen/Space+Grotesk |
| `@fontsource/dm-sans` | 400 / 500 / 600 / 700 | SIL OFL 1.1 | https://fonts.google.com/specimen/DM+Sans |
| `@fontsource/ibm-plex-mono` | 400 / 500 | SIL OFL 1.1 | https://fonts.google.com/specimen/IBM+Plex+Mono |

Imported in `src/main.jsx`; the woff2 files ship inside `node_modules` and are bundled by Vite.
Chinese text falls back to the system CJK font (PingFang SC / Microsoft YaHei).

## Icons

| Package | License | Source |
| --- | --- | --- |
| `lucide-react` | ISC | https://lucide.dev |

Used for controls only (menu, plus, send, stop, copy, check, theme toggle, arrows).

## Original drawings (inline SVG in `src/components/Marks.jsx`)

- **Brand mark** — two coral/ivory strokes; also used, unchanged, in `public/favicon.svg`.
- **Member avatar** — abstract circle + triangle composition on a blush plate.

No photos, raster art, real logos or third-party thumbnails are used.

## Design reference

Design system and template: [VibeFather — AI Chat App Interface](https://vibefather.ai/t/ai-chat-app-interface)
(CC BY-NC 4.0, credit line kept in the composer footer).
