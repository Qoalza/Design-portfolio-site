# Process icons — accepted animations

Three standalone Lottie assets for Concept V2, accepted2026-10-28. Website integration is not part of this checkpoint.

| Asset | FPS | Hover hold frame | Time to hold |
| --- | ---: | ---: | ---: |
| folder.json | 80 | 49 | 0.6125s |
| system.json | 60 | 30 | 0.5s |
| rocket.json | 75 | 30 | 0.4s |

128×128 canvas with original64×64 artwork offset32px on each axis. Render at128px to retain native64px artwork size.

Pointer enter: play forward from current frame to `hover-hold` marker and pause. Pointer leave: immediately reverse from current frame to0. Re-enter reverses direction without restarting. No loop or obligatory completion. Reduced motion: frame0. Full remaining timeline is for explicit demo playback, not hover exit.

Folder: single sheet emergence, matching outline weight. System: simultaneous separation and geometric morph to cube/sphere/pyramid; exposed seams lighten. Rocket: exact Figma endpoint paths; flame follows nozzle, grows outward, never contacts the rocket. Source stroke1.16245→1 is preserved.

## Source and regeneration

Figma file https://www.figma.com/design/sgKtUASp0aYzdkeH8kcXrL/Concept-V.2

- Folder4611:886146
- System4611:886154
- Rocket rest4631:886557, hover4627:886504, section4631:886556

Unmodified exports are in `originals/`. `rocket.svg` and `rocket-hover.svg` are convenient copies. Run `python3 build-icons.py` from this folder or call the script by path. Uses Python standard library only. No embedded raster assets or external dependencies.

## Verification

Browser comparison of SVG and Lottie endpoints: zero channel difference at rest for all three, and at rocket hover. Rocket flame checked at288 subframe positions and31 samples per curve segment: minimum separation including strokes2.505px. Immediate enter/leave reversal verified in preview. Rocket30/75=0.4s. Generator byte reproducibility checked before commit.

Only final assets and reproducible source are retained. No rejected sketches, old airplane, website integration, dependencies or production changes.
