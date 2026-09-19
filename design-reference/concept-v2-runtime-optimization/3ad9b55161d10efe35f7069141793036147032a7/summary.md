# Concept V2 runtime optimization evidence

- Tested runtime SHA: `3ad9b55161d10efe35f7069141793036147032a7`.
- Baseline: `5955fde01e408a21e936e86af0805f45bc807313`.
- Mode: Vite production build of `tools/concept-v2/app`.
- Automated result: `npm run check` passed with lint, 86 tests and production build; `npm run check:browser` passed as an HTTP built-runtime smoke; `git diff --check` passed.
- Behavioral coverage includes finite frame/activity tasks, Hero offscreen/re-entry cadence, Experience gate/layout/static transitions, About hover/deck lifecycle and rendered-media preparation.
- Not a Zen performance profile: the required manual Zen feel/performance pass remains open. Chromium-oriented automated checks do not close it.
