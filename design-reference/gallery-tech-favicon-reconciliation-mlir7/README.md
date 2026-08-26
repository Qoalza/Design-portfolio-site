# MLIR7 verification evidence

Final runtime: `a322cf7341ee351d50f1a98cdb9d857fe46dd956`.

- Focused Node tests: `142/142` passed.
- `npm run lint`: passed.
- Production build with `NEXT_PUBLIC_BUILD_SHA`: passed.
- Served `data-build-sha`: exact full runtime SHA.
- Chromium final route/viewport matrix: `22/22` passed.
- Zen `1.21.15b` final route/viewport matrix: `22/22` passed.
- Gallery uses the accepted G1 canonical controller; final Zen wheel regression confirms rapid discrete steps in both directions and subsequent vertical scroll.
- All 15 Gallery lightbox mappings were accepted in G2; final-runtime Zen screenshots and the final route matrix recheck the unchanged Gallery runtime.
- No unexplained horizontal overflow was found.

The MLIR6 directory remains historical evidence and is not used as proof for this runtime. Screenshots in `chromium/` and `zen/` were captured from the full SHA above.

