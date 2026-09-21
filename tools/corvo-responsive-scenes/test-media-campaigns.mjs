import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('./site/media-campaigns/', import.meta.url);
const html = readFileSync(new URL('index.html', root), 'utf8');
const css = readFileSync(new URL('style.css', root), 'utf8');
const mobilePrev = readFileSync(new URL('../assets/media-campaigns/table-prev-light-color.svg', root), 'utf8');
const mobileNext = readFileSync(new URL('../assets/media-campaigns/table-next-light-color.svg', root), 'utf8');
const tabletCssStart = css.indexOf('@media (min-width: 600px) and (max-width: 1279px)');
const desktopCssStart = css.indexOf('@media (min-width: 1280px)');
const desktopCss = css.slice(desktopCssStart, tabletCssStart);
const mobileCssStart = css.indexOf('@media (max-width: 599px)');
const tabletCss = css.slice(tabletCssStart, mobileCssStart);
const mobileCss = css.slice(mobileCssStart);

const lineIconAssets = [
  ['header-chevron-color.svg', 20, '1.3'],
  ['header-calendar-color.svg', 20, '1.3'],
  ['create-color.svg', 20, '1.3'],
  ['search-color.svg', 20, '1.3'],
  ['filter-color.svg', 20, '1.3'],
  ['columns-color.svg', 20, '1.3'],
  ['metric-registration-color.svg', 20, '1.3'],
  ['metric-deposit-color.svg', 20, '1.3'],
  ['metric-ftd-color.svg', 20, '1.3'],
  ['mobile-registration-color.svg', 16, '1'],
  ['menu-tablet-color.svg', 20, '1.3'],
  ['menu-mobile-color.svg', 16, '1'],
  ['table-chevron-color.svg', 20, '1.3'],
  ['table-prev-color.svg', 20, '1.3'],
  ['table-next-color.svg', 20, '1.3'],
  ['table-lock-color.svg', 24, '1.3'],
  ['table-eye-color.svg', 24, '1.3'],
  ['table-copy-color.svg', 24, '1.3'],
  ['table-edit-color.svg', 20, '1.3'],
  ['rail-color-layout.svg', 20, '1.3'],
  ['rail-color-dashboard.svg', 20, '1.3'],
  ['rail-color-campaigns.svg', 20, '1.3'],
  ['rail-color-announcements.svg', 20, '1.3'],
  ['rail-color-charts.svg', 20, '1.3'],
  ['rail-color-referrals.svg', 20, '1.3'],
  ['rail-color-exchange.svg', 20, '1.3'],
  ['rail-color-workspaces.svg', 20, '1.3'],
  ['rail-user.svg', 24, '1.3'],
  ['rail-shield.svg', 24, '1.3'],
  ['table-lock-tablet-color.svg', 20, '1.3'],
  ['table-eye-tablet-color.svg', 20, '1.3'],
  ['table-copy-tablet-color.svg', 20, '1.3'],
  ['table-lock-mobile-color.svg', 16, '1'],
  ['table-eye-mobile-color.svg', 16, '1'],
  ['table-copy-mobile-color.svg', 16, '1'],
  ['table-edit-light-color.svg', 16, '1'],
  ['table-chevron-light-color.svg', 16, '1'],
];

for (const [file, size, stroke] of lineIconAssets) {
  const svg = readFileSync(new URL(`../assets/media-campaigns/${file}`, root), 'utf8');
  assert.match(svg, new RegExp(`<svg[^>]*width="${size}"[^>]*height="${size}"[^>]*viewBox="0 0 ${size} ${size}"`), `${file} keeps its complete ${size}px Figma frame`);
  assert.match(svg, /<(?:path|circle|rect)\b/, `${file} keeps vector geometry instead of a raster fallback`);
  assert.match(svg, new RegExp(`stroke-width="${stroke}"`), `${file} keeps the source ${stroke}px centerline stroke`);
  assert.doesNotMatch(svg, /vector-effect="non-scaling-stroke"/, `${file} lets Zen rasterize the intrinsic frame at device-pixel scale`);
  assert.match(svg, /<svg[^>]*shape-rendering="geometricPrecision"/, `${file} requests consistent subpixel stroke rasterization`);
  assert.doesNotMatch(svg, /transform="scale\(/, `${file} bakes its final frame coordinates instead of combining scale with non-scaling stroke`);
  for (const path of svg.match(/<path\b[^>]*\/>/g) ?? []) {
    if (/\bfill="#[0-9A-F]{6}"/i.test(path) && !/\bstroke="/.test(path)) {
      assert.match(path, /\bfill-opacity="0\.2"/, `${file} uses fill-only geometry solely for its source duotone layer`);
    }
  }
}

const semanticColors = new Map([
  ['header-chevron-color.svg', '#5E6260'],
  ['header-calendar-color.svg', '#545755'],
  ['create-color.svg', '#FFFFFF'],
  ['search-color.svg', '#777C79'],
  ['filter-color.svg', '#5E6260'],
  ['columns-color.svg', '#5E6260'],
  ['metric-registration-color.svg', '#5E6260'],
  ['metric-deposit-color.svg', '#5E6260'],
  ['metric-ftd-color.svg', '#5E6260'],
  ['mobile-registration-color.svg', '#5E6260'],
  ['menu-tablet-color.svg', '#5E6260'],
  ['menu-mobile-color.svg', '#5E6260'],
  ['table-chevron-color.svg', '#5E6260'],
  ['table-copy-color.svg', '#5E6260'],
  ['table-edit-color.svg', '#5E6260'],
  ['table-eye-color.svg', '#909693'],
  ['rail-color-layout.svg', '#5E6260'],
  ['rail-color-dashboard.svg', '#878C89'],
  ['rail-color-campaigns.svg', '#545755'],
  ['rail-color-announcements.svg', '#878C89'],
  ['rail-color-charts.svg', '#878C89'],
  ['rail-color-referrals.svg', '#878C89'],
  ['rail-color-exchange.svg', '#878C89'],
  ['rail-color-workspaces.svg', '#878C89'],
  ['rail-user.svg', '#494949'],
  ['rail-shield.svg', '#5B5B5B'],
  ['table-lock-color.svg', '#909693'],
  ['table-prev-color.svg', '#C8CCCA'],
  ['table-next-color.svg', '#5E6260'],
  ['table-lock-tablet-color.svg', '#909693'],
  ['table-eye-tablet-color.svg', '#909693'],
  ['table-copy-tablet-color.svg', '#5E6260'],
  ['table-lock-mobile-color.svg', '#909693'],
  ['table-eye-mobile-color.svg', '#909693'],
  ['table-copy-mobile-color.svg', '#5E6260'],
  ['table-edit-light-color.svg', '#5E6260'],
  ['table-chevron-light-color.svg', '#5E6260'],
]);
for (const [file, color] of semanticColors) {
  const svg = readFileSync(new URL(`../assets/media-campaigns/${file}`, root), 'utf8');
  assert.match(svg, new RegExp(`(?:fill|stroke)="${color}"`), `${file} carries its exact Figma semantic color without CSS recoloring`);
}

const rows = (html.match(/<tbody>[\s\S]*?<\/tbody>/)?.[0].match(/<tr>/g) ?? []).length;
assert.equal(rows, 10, 'Figma table uses a complete ten-row source dataset');
assert.doesNotMatch(html, /class="rail-quick"/, 'The source rail has no visible shortcut between the logo and Layout');
assert.match(html, /aria-label="Referrals"><img class="rail-glyph"[^>]*rail-color-referrals\.svg[^>]*><\/button>\s*<button aria-label="Exchange"><img class="rail-glyph"[^>]*rail-color-exchange\.svg/, 'Coins swap finishes the primary rail list');
assert.match(html, /<div class="rail-secondary">\s*<button aria-label="Workspaces"><img class="rail-glyph"[^>]*rail-color-workspaces\.svg/, 'Laptop is the lower rail control above the account group');
assert.match(css, /\.rail \{ background: transparent; border: 0;[^}]*flex: 0 0 72px/, 'The rail itself has no white surface or divider border');
assert.match(html, /class="flag[^\"]*"><img /, 'Visible country marks are exported assets, not CSS drawings');
assert.doesNotMatch(css, /\.flag-(?:de|cn|fr|gr|it)\s*\{[^}]*background:/, 'Country marks are not hand-drawn in CSS');
assert.match(css, /\.rail button \{[^}]*justify-content: flex-start[^}]*padding: 0 8px 0 14px/, 'Rail controls follow the source left inset');
assert.doesNotMatch(css, /(?:-webkit-)?mask\s*:/, 'Line icons are never rasterized through CSS masks');
assert.doesNotMatch(css, /filter\s*:/, 'Line icons are never recolored through CSS filters');
assert.doesNotMatch(css, /\.source-icon|--icon-mask|--rail-icon/, 'The page has no silhouette icon abstraction');
assert.doesNotMatch(html, /class="[^"]*source-icon|class="[^"]*rail-icon/, 'Every line icon is rendered as its complete SVG image frame');
assert.match(html, /class="rail-glyph" src="\.\.\/assets\/media-campaigns\/rail-color-layout\.svg"/, 'Layout renders the exact Figma SVG frame directly');
assert.match(html, /class="rail-glyph" src="\.\.\/assets\/media-campaigns\/rail-color-campaigns\.svg"/, 'Active Bar-chart renders the exact Figma SVG frame directly');
assert.match(html, /class="rail-account-icon" src="\.\.\/assets\/media-campaigns\/rail-user\.svg"/, 'Account profile preserves its distinct Figma source icon frame');
assert.match(css, /\.rail-brand \{[^}]*height: 56px[^}]*padding-top: 24px/, 'The hidden legacy slot no longer leaves a gap after the logo');
assert.match(css, /\.rail-main \{[^}]*gap: 8px[^}]*padding: 0 12px/, 'The first navigation control starts directly after the source logo frame');
assert.match(html, /class="rail-account"[^>]*><button class="is-active"/, 'The account rail exposes its active User tab');
assert.match(html, /class="is-active" aria-label="Media campaigns"/, 'The Bar-chart rail tab is the active source state');
assert.match(css, /th:first-child, td:first-child \{ border-right: 1px solid #f2f2f2; \}/, 'Only the first table column has a source divider');
assert.doesNotMatch(css, /th \+ th, td \+ td/, 'The table has no invented inter-column dividers');
assert.match(css, /\.tabs button \{[^}]*color: #777c79/, 'Inactive switcher text uses the source neutral color');
assert.match(css, /\.tabs \.is-selected \{[^}]*color: #3b3d3c/, 'Active switcher text uses the source active color');
assert.match(css, /\.tabs \{[^}]*border: 0[^}]*box-shadow: inset 0 0 0 1px #ebebeb[^}]*height: 48px[^}]*padding: 4px/, 'Switcher borders overlay the 48px frame so its active tab remains exactly 40px');
assert.match(css, /\.tabs \{[^}]*border-radius: 20px/, 'Desktop and tablet switcher frame keeps the source 20px radius');
assert.match(css, /\.tabs button \{[^}]*border-radius: 16px/, 'Desktop and tablet switcher tabs keep the source 16px radius');
assert.match(css, /\.tabs button:first-child \{ flex: 0 0 106px; \}\.tabs button:last-child \{ flex: 0 0 118px; \}/, 'Desktop switcher keeps the source 106px and 118px tab widths');
assert.match(css, /\.search \{[^}]*background: #fff/, 'Search preserves its source white surface');
assert.match(html, /class="date-value"[\s\S]*?<small>Select day<\/small>/, 'Desktop date field includes the source caption');
assert.match(css, /\.date \{[^}]*gap: 16px/, 'Desktop date items retain the source spacing');
assert.match(css, /\.day \{[^}]*height: 48px[^}]*padding: 0 16px/, 'Desktop Day control keeps its 48px padded hit area');
assert.match(css, /\.chart \{[^}]*overflow: visible/, 'Chart strokes are never clipped by an intermediate container');
assert.match(html, /class="metric-icon metric-ftd-icon" src="\.\.\/assets\/media-campaigns\/metric-ftd-color\.svg"[^>]*>FTD/, 'FTD renders the mapped Pie-chart SVG with its real stroke');
assert.match(html, /class="icon icon-header-chevron" src="\.\.\/assets\/media-campaigns\/header-chevron-color\.svg"/, 'Day and Profile reuse the exact header Chevron frame');
assert.match(html, /class="icon calendar" src="\.\.\/assets\/media-campaigns\/header-calendar-color\.svg"/, 'The date field renders the dedicated Calendar frame directly');
assert.match(html, /class="icon icon-create" src="\.\.\/assets\/media-campaigns\/create-color\.svg"/, 'Create renders its source SVG directly');
assert.match(html, /search-color\.svg[\s\S]*?filter-color\.svg[\s\S]*?columns-color\.svg/, 'Search and filter actions render their source-specific SVG frames directly');
assert.match(html, /class="state-icon" src="\.\.\/assets\/media-campaigns\/table-lock-color\.svg"/, 'Table state icons retain their 24px source frame');
assert.match(html, /class="copy-icon" src="\.\.\/assets\/media-campaigns\/table-copy-color\.svg"[\s\S]*?class="edit" src="\.\.\/assets\/media-campaigns\/table-edit-color\.svg"/, 'Copy and edit render their source SVG frames directly');
assert.match(html, /table-lock-mobile-color\.svg[\s\S]*?table-lock-tablet-color\.svg[\s\S]*?table-lock-color\.svg/, 'Lock switches between exact Light 16px, Medium 20px and Medium 24px source frames');
assert.match(html, /table-eye-mobile-color\.svg[\s\S]*?table-eye-tablet-color\.svg[\s\S]*?table-eye-color\.svg/, 'Eye switches between exact Light 16px, Medium 20px and Medium 24px source frames');
assert.match(html, /table-copy-mobile-color\.svg[\s\S]*?table-copy-tablet-color\.svg[\s\S]*?table-copy-color\.svg/, 'Copy switches between exact Light 16px, Medium 20px and Medium 24px source frames');
assert.match(html, /table-edit-light-color\.svg[\s\S]*?table-edit-color\.svg/, 'Pencil switches from the desktop Medium 20px frame to the Light 16px frame');
assert.match(html, /table-chevron-light-color\.svg[\s\S]*?table-chevron-color\.svg/, 'Mobile pagination uses the Light 16px Chevron instead of scaling the Medium 20px frame');
assert.match(html, /table-prev-color\.svg[\s\S]*?table-next-color\.svg/, 'Pagination uses distinct direct left and right SVG frames');
assert.match(html, /<picture class="menu-icon"><img src="\.\.\/assets\/media-campaigns\/menu-tablet-color\.svg"/, 'Tablet and mobile Menu share the approved Medium 20px source frame');
assert.match(html, /class="profile-chevron" aria-hidden="true"><img class="icon icon-profile-chevron"[^>]*><\/span>/, 'Profile Chevron is retained inside its own source button frame');
assert.match(css, /\.profile-chevron \{ align-items: center; display: flex; flex: 0 0 48px; height: 48px; justify-content: center; width: 48px; \}/, 'Desktop profile arrow keeps the source 48px control frame');
assert.match(css, /\.edit \{ display: block; flex: 0 0 20px; height: 20px; margin: 0 auto; width: 20px; \}/, 'Desktop Pencil keeps its intrinsic 20px Color frame instead of being stretched to 24px');
assert.match(css, /\.create > span:first-child \{ display: none; \}/, 'Mobile hides only the Create label, never its source icon frame');
assert.match(css, /\.filter-actions button > span:first-child, \.filter-actions i \{ display: none; \}/, 'Mobile hides action labels without removing Filter or Columns icons');
assert.match(css, /td:nth-child\(4\) \{ text-align: left; \}/, 'Desktop GEO marks are aligned to the left edge of their column');
assert.doesNotMatch(css, /@media \(min-width: 1280px\) and \(max-width: 1439px\)[\s\S]*?\.metric-card \{ flex: 0 0 440px; min-width: 440px; \}/, 'Desktop metrics retain their fluid base layout instead of locking to 440px');

// Responsive contract from the approved implementation plan.
assert.match(css, /\.date-value \.calendar \{[^}]*margin-right: 6px/, 'Desktop date icon keeps its source 6px icon-frame end spacing');
assert.match(css, /\.date-copy \{[^}]*padding-left: 2px/, 'Desktop date body keeps the additional source 2px body start spacing');
assert.match(css, /\.day \{[^}]*color: #5e6260/, 'Day label inherits its exact source neutral color');
assert.match(css, /\.date-copy \{[^}]*color: #545755/, 'Date caption and value keep their source data color');
assert.match(css, /\.rail-account-icon \{ height: 20px; width: 20px; \}/, 'Bottom rail account glyphs render at their 20px source size');
assert.match(css, /\.rail button\.is-active \{[^}]*border: 0[^}]*box-shadow: inset 0 0 0 1px #ebebeb/, 'Active navigation border overlays the 48px tab without shifting its glyph');
assert.match(css, /\.rail-account \{[^}]*border: 0[^}]*box-shadow: inset 0 0 0 1px #ebebeb[^}]*padding: 4px[^}]*width: 48px/, 'Account switcher keeps the source 4px inset and 40px tabs inside its 48px frame');
assert.match(css, /\.rail button \{[^}]*border-radius: 18px/, 'Main navigation tabs keep the source 18px radius');
assert.match(css, /\.rail-account \{[^}]*border-radius: 20px/, 'Account switcher frame keeps the source 20px radius');
assert.match(css, /\.rail-account button \{[^}]*border-radius: 16px/, 'Account switcher tabs keep the source 16px radius');
assert.match(css, /\.table-wrap footer \{[^}]*border-top: 1px solid #f2f2f2[^}]*height: 68px[^}]*padding: 12px 16px 16px/, 'Table footer keeps its source divider and 12/16px vertical padding');
assert.match(css, /\.table-wrap footer button \{[^}]*border-radius: 16px/, 'Desktop and tablet page-size control keeps the source 16px radius');
assert.match(css, /\.table-wrap footer b \{[^}]*gap: 8px/, 'Desktop pagination arrows keep the source 8px gap');
assert.match(css, /\.table-wrap footer b \.icon \{[^}]*border-radius: 16px[^}]*box-sizing: content-box[^}]*height: 20px[^}]*padding: 10px[^}]*width: 20px/, 'Desktop pagination arrows use exact 40px/16px controls around 20px Figma icons');
assert.match(css, /\.negative \{ color: #b42d4f; \}/, 'Negative metric delta uses the muted Figma token, not the brighter legacy red');
assert.match(css, /@media \(min-width: 600px\) and \(max-width: 1279px\)/, 'Tablet owns the complete 600–1279px source range');
assert.match(css, /@media \(max-width: 599px\)/, 'Mobile owns the complete ≤599px source range');
assert.match(css, /@media \(max-width: 599px\)[\s\S]*?\.tabs \{[^}]*border-radius: 18px[^}]*height: 40px[^}]*width: 200px/, 'Mobile switcher keeps the source 18px outer radius and 40px frame');
assert.match(css, /@media \(max-width: 599px\)[\s\S]*?\.tabs button \{[^}]*border-radius: 14px/, 'Mobile switcher tabs keep the source 14px radius');
assert.match(css, /@media \(max-width: 599px\)[\s\S]*?\.table-wrap footer \{[^}]*height: 56px[^}]*padding: 12px/, 'Mobile table footer uses the source 56px frame and 12px inset');
assert.match(css, /@media \(max-width: 599px\)[\s\S]*?\.campaigns:not\(\.my-space\) \.table-wrap footer \.count \{[^}]*display: block[^}]*font-size: 0/, 'Mobile Media campaigns keeps the page count while shortening its label');
assert.match(css, /@media \(max-width: 599px\)[\s\S]*?\.table-wrap footer b \{[^}]*display: flex[^}]*gap: 8px[^}]*margin-left: 6px/, 'Mobile pagination keeps both source arrow controls');
assert.match(css, /@media \(max-width: 599px\)[\s\S]*?\.table-wrap footer button \{[^}]*border-radius: 14px/, 'Mobile page-size control keeps the source 14px radius');
assert.match(css, /@media \(max-width: 599px\)[\s\S]*?\.table-wrap footer b \.icon \{[^}]*border-radius: 14px[^}]*box-sizing: content-box[^}]*flex: 0 0 16px[^}]*height: 16px[^}]*padding: 8px[^}]*width: 16px/, 'Mobile pagination arrows use exact 32px/14px controls around 16px Figma icons');
assert.match(mobilePrev, /viewBox="0 0 24 24"[\s\S]*?d="M14 18L8 12L14 6"[\s\S]*?stroke="#C8CCCA"/, 'Mobile Previous preserves the exact full-frame Light Figma vector and disabled state token');
assert.match(mobileNext, /viewBox="0 0 24 24"[\s\S]*?d="M10 18L16 12L10 6"[\s\S]*?stroke="#5E6260"/, 'Mobile Next preserves the exact full-frame Light Figma vector and enabled state token');
assert.doesNotMatch(css, /@media \(min-width: 480px\) and \(max-width: 959px\)|@media \(max-width: 479px\)/, 'Legacy 480/960 split cannot reintroduce overlapping responsive states');
assert.match(html, /max-width: 1279px/, 'Responsive table assets retain their Tablet variants through 1279px');
assert.doesNotMatch(html, /max-width: 479px/, 'Responsive table assets never restore the legacy 479px boundary');
assert.match(html, /<picture class="menu-icon"><img src="\.\.\/assets\/media-campaigns\/menu-tablet-color\.svg"/, 'Mobile keeps the Medium 20px Menu source instead of substituting a thin 16px frame');
assert.match(css, /@media \(max-width: 599px\)[\s\S]*?\.menu-icon, \.menu-icon img \{ height: 20px; width: 20px; \}/, 'Mobile Menu keeps its native 20px frame');
assert.match(css, /@media \(min-width: 600px\) and \(max-width: 1279px\)[\s\S]*?\.search \{[^}]*width: 100%/, 'Tablet search occupies its source second row throughout the tablet range');
assert.match(tabletCss, /\.tabs button:first-child, \.tabs button:last-child \{ flex: 0 0 144px; \}/, 'Tablet switcher keeps two exact 144px source tabs');
assert.match(css, /@media \(min-width: 600px\) and \(max-width: 1279px\)[\s\S]*?\.metric-card \{[^}]*flex: 1 0 252px[^}]*min-width: 252px/, 'Tablet cards expand while there is room, then hold their Figma minimum instead of shrinking');
assert.match(css, /@media \(min-width: 600px\) and \(max-width: 1279px\)[\s\S]*?\.metric-card p \{[^}]*font-size: 24px[^}]*line-height: 28px/, 'Tablet metric typography uses the fixed Figma 24/28px type scale throughout the breakpoint');
assert.doesNotMatch(css, /@media \(min-width: 600px\) and \(max-width: 1279px\)[\s\S]*?\.metric-card p \{[^}]*\b(?:clamp|vw)\b/, 'Tablet metric typography cannot scale with viewport width inside one breakpoint');
assert.match(css, /@media \(min-width: 600px\) and \(max-width: 1279px\)[\s\S]*?\.table-wrap > table \{[^}]*min-width: 892px/, 'Tablet table preserves the Figma minimum for all six source columns');
assert.match(css, /@media \(min-width: 600px\) and \(max-width: 1279px\)[\s\S]*?\.table-wrap > table \{[^}]*border-collapse: separate[^}]*border-spacing: 0/, 'Tablet avoids collapsed-table sticky behavior that causes Fixed cells to slide in Zen');
assert.match(css, /@media \(min-width: 600px\) and \(max-width: 1279px\)[\s\S]*?th:first-child, td:first-child \{[^}]*background: #fff[^}]*background-clip: padding-box[^}]*left: 16px[^}]*position: sticky/, 'Tablet keeps the Figma Fixed ID & Name column inside its 16px table inset');
assert.doesNotMatch(tabletCss, /th:first-child, td:first-child \{[^}]*box-shadow/, 'Tablet Name divider uses one source 1px border, never a doubled shadow');
assert.match(css, /@media \(min-width: 600px\) and \(max-width: 1279px\)[\s\S]*?\.col-name \{[^}]*width: 194px[^}]*\}[\s\S]*?\.col-url, \.col-reward, \.col-geo \{[^}]*width: auto[^}]*\}[\s\S]*?\.col-created \{[^}]*width: 129px[^}]*\}[\s\S]*?\.col-action \{[^}]*width: 80px/, 'Tablet preserves all six Figma columns: fixed Name, Created and Action plus three elastic middle cells');
assert.match(css, /@media \(min-width: 600px\) and \(max-width: 1279px\)[\s\S]*?th:last-child, td:last-child \{[^}]*background: #fff[^}]*border-left: 1px solid #f2f2f2[^}]*right: 16px[^}]*position: sticky/, 'Tablet Action is a fixed trailing column with a single source leading divider');
assert.doesNotMatch(tabletCss, /th:last-child, td:last-child \{[^}]*box-shadow/, 'Tablet Action divider uses one source 1px border, never a doubled shadow');
assert.match(tabletCss, /td:nth-child\(4\) \{ text-align: left; \}/, 'Tablet GEO header and flag groups align to the source left edge');
assert.match(tabletCss, /th:last-child::after, td:last-child::after \{[^}]*background: #fff[^}]*border-bottom: 1px solid #f2f2f2[^}]*content: ""[^}]*left: 100%[^}]*position: absolute[^}]*width: 16px/, 'Tablet Action paints the source 16px trailing padding instead of exposing scrolling cells');
assert.doesNotMatch(css, /@media \(min-width: 960px\) and \(max-width:/, 'No unplanned intermediate mode exists inside the Tablet range');
assert.match(css, /@media \(max-width: 599px\)[\s\S]*?\.profile \{[^}]*right: 58px/, 'Mobile profile leaves the Menu source slot free');
assert.match(css, /@media \(max-width: 599px\)[\s\S]*?\.dots \{[^}]*width: 34px/, 'Mobile indicator is the exact 34px source track, not a page-wide distribution');
assert.match(mobileCss, /\.tabs \{[^}]*height: 40px[^}]*width: 200px/, 'Mobile switcher keeps its exact 200×40px Figma frame');
assert.match(mobileCss, /\.tabs button:first-child \{ flex: 0 0 88px; \}\.tabs button:last-child \{ flex: 0 0 100px; \}/, 'Mobile tabs preserve the source 88px Active and 100px Deactivated widths');
assert.match(css, /@media \(max-width: 599px\)[\s\S]*?\.date \{[^}]*gap: 16px/, 'Mobile date control preserves the source breathing room around Day, divider, and calendar');
assert.match(mobileCss, /\.table-wrap > table \{[^}]*border-collapse: separate[^}]*border-spacing: 0[^}]*min-width: 708px[^}]*width: 708px/, 'Mobile table preserves the Figma minimum for all six source columns');
assert.match(mobileCss, /\.col-name \{ width: 120px; \}\.col-url \{ width: 140px; \}\.col-reward \{ width: 160px; \}\.col-geo \{ width: 120px; \}\.col-created \{ width: 106px; \}\.col-action \{ width: 62px; \}/, 'Mobile columns keep the exact Figma fixed and minimum widths');
assert.doesNotMatch(mobileCss, /th:nth-child\([2-6]\)[^}]*display: none|td:nth-child\([2-6]\)[^}]*display: none|\.col-(?:reward|geo|created)[^{]*\{[^}]*display: none/, 'Mobile keeps URL, Reward plan, GEO, Created at and Action in the horizontal table');
assert.match(mobileCss, /th:first-child, td:first-child \{[^}]*background: #fff[^}]*background-clip: padding-box[^}]*left: 0[^}]*position: sticky/, 'Mobile keeps the Figma 120px Fixed ID & Name column at the leading edge');
assert.doesNotMatch(mobileCss, /th:first-child, td:first-child \{[^}]*box-shadow/, 'Mobile Name divider uses one source 1px border, never a doubled shadow');
assert.match(mobileCss, /th:last-child, td:last-child \{[^}]*background: #fff[^}]*border-left: 1px solid #f2f2f2[^}]*min-width: 62px[^}]*position: sticky[^}]*right: 0/, 'Mobile Action is the fixed 62px trailing column with one source leading divider');
assert.doesNotMatch(mobileCss, /th:last-child, td:last-child \{[^}]*box-shadow/, 'Mobile Action divider uses one source 1px border, never a doubled shadow');
assert.match(css, /@media \(max-width: 599px\)[\s\S]*?th \{[^}]*height: 32px/, 'Mobile table header follows the 32px source row');
assert.match(css, /@media \(max-width: 599px\)[\s\S]*?td \{[^}]*height: 48px/, 'Mobile table body follows the 48px source rows');
assert.match(css, /@media \(min-width: 600px\) and \(max-width: 1279px\)[\s\S]*?th \{[^}]*height: 40px/, 'Tablet table header follows the 40px source row');
assert.match(css, /@media \(min-width: 600px\) and \(max-width: 1279px\)[\s\S]*?td \{[^}]*height: 56px/, 'Tablet table body follows the 56px source rows');
assert.doesNotMatch(tabletCss, /th:nth-child\([2-6]\)[^}]*display: none/, 'Tablet keeps URL, Reward plan, GEO, Created at and Action in the horizontal table');
assert.match(html, /chart-3[\s\S]*?desktop-chart-5\.svg[\s\S]*?desktop-chart-6\.svg/, 'Third metric retains the distinct desktop chart source pair');
assert.doesNotMatch(html, /chart-3[\s\S]*?tablet-chart-3-secondary\.svg/, 'Tablet third metric cannot reuse the duplicated first-chart export');
assert.match(html, /chart-1[\s\S]*?class="tablet-chart" src="\.\.\/assets\/media-campaigns\/desktop-chart-1\.svg"[\s\S]*?class="tablet-chart" src="\.\.\/assets\/media-campaigns\/desktop-chart-2\.svg"/, 'Tablet Registration reuses the approved desktop curve pair');
assert.doesNotMatch(html, /chart-1[\s\S]*?tablet-chart-1-(?:secondary|accent)\.svg/, 'Tablet Registration cannot retain its incorrect tablet-specific curve exports');
assert.match(desktopCss, /\.table-wrap > table \{[^}]*border-collapse: separate[^}]*border-spacing: 0[^}]*min-width: 1146px/, 'Desktop table preserves the six-column Figma minimum instead of compressing GEO');
assert.match(desktopCss, /\.col-name \{ width: 220px; \}\.col-url \{ width: 200px; \}\.col-reward \{ width: auto; \}\.col-geo \{ width: 180px; \}\.col-created \{ width: 136px; \}\.col-action \{ width: 90px; \}/, 'Desktop keeps the exact Figma fixed/minimum column contract');
assert.match(desktopCss, /th:first-child, td:first-child \{[^}]*background: #fff[^}]*left: 20px[^}]*position: sticky/, 'Desktop keeps the Figma Fixed ID & Name column at its 20px inset');
assert.match(desktopCss, /th:last-child, td:last-child \{[^}]*background: #fff[^}]*border-left: 1px solid #f2f2f2[^}]*right: 20px[^}]*position: sticky/, 'Desktop keeps the fixed 90px Action column and its single divider');
assert.match(desktopCss, /th:last-child::after, td:last-child::after \{[^}]*left: 100%[^}]*width: 20px/, 'Desktop Action paints the source 20px trailing padding frame');

console.log('media-campaigns Figma structure: OK');
