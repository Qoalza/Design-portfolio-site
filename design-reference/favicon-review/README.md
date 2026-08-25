# Des-art favicon review package

- compact: 24 px and under
- detailed: above 24 px
- dark mark: #2F3133 on #FFFFFF
- white mark: #FFFFFF on #161819
- `generated/favicon.svg` is the approved primary browser favicon: compact geometry, adaptive light/dark color.
- Do not use the generated 16/24 px PNG files as the primary browser favicon; they are review/fallback artifacts only.
- `favicon.ico` is compatibility fallback only and must not override the SVG in modern browsers.
- PNG is reserved for required fixed-size platform assets such as Apple Touch Icon and PWA icons.
- Detailed geometry with the central bar is reserved for genuinely large platform assets, not a magnified browser-tab favicon.
- Nothing in this review package is connected to application metadata until a separate approved implementation step.
