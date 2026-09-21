import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('./', import.meta.url);
const html = readFileSync(new URL('./site/statistics/index.html', root), 'utf8');
const css = readFileSync(new URL('./site/statistics/style.css', root), 'utf8');
const exportIcon = readFileSync(new URL('./site/assets/statistics/export.svg', root), 'utf8');

assert.match(html, /<main class="campaigns my-space statistics" aria-label="Statistics">/, 'Statistics reuses the approved product shell');
assert.match(html, /<h1>Statistic<\/h1><p>View aggregated statistics and detailed breakdowns across all levels<\/p>/, 'Title copy matches Figma');
assert.match(html, /Home[\s\S]*Affiliate[\s\S]*Media Campaign/, 'Breadcrumb content matches all three canonical roots');
assert.doesNotMatch(html, /class="metrics"|class="tabs"|class="identity"|class="create"/, 'Statistics removes blocks absent from the design');
assert.match(html, /class="is-active" aria-label="Statistics"/, 'Statistics owns the active rail state');
assert.match(html, /Search[\s\S]*Export[\s\S]*Columns/, 'Only the approved filter controls are present');
assert.match(exportIcon, /M17\.5 10V13\.5[\s\S]*M6\.66667 5\.83333L10 2\.5L13\.3333 5\.83333M10 2\.5V12\.5/, 'Export uses the exact Medium Share-01 vector exported from Figma node 3600:198853');

const headers = [...html.matchAll(/<th>([^<]+)<\/th>/g)].map((match) => match[1]);
assert.deepEqual(headers, ['Affiliate &amp; ID', 'Clicks', 'Unique Clicks', 'Registrations', 'FTD Count', 'Reg to FTD', 'Click to Reg', 'Click to FTD', 'Repeat Deposit'], 'Only visible Statistics columns are rendered');
assert.equal((html.match(/<tbody>[\s\S]*?<\/tbody>/)?.[0].match(/<tr>/g) ?? []).length, 9, 'The visible source dataset contains nine rows');

assert.match(css, /\.statistics \.table-wrap > table \{[^}]*min-width: 1391px[^}]*table-layout: fixed[^}]*width: 1391px/, 'Desktop table uses the fixed visible-column width');
assert.match(css, /\.statistics \.col-affiliate \{ width: 200px; \}[\s\S]*?\.statistics \.col-clicks \{ width: 132px; \}[\s\S]*?\.statistics \.col-unique \{ width: 135px; \}/, 'Desktop columns preserve their exact fixed widths');
assert.match(css, /@media \(min-width: 600px\) and \(max-width: 1599px\)[\s\S]*?\.statistics \.table-wrap > table \{[^}]*width: 1221px/, 'Tablet table keeps its fixed source width');
assert.match(css, /@media \(max-width: 599px\)[\s\S]*?\.statistics \.table-wrap > table \{[^}]*width: 994px/, 'Mobile table keeps its fixed source width');
assert.match(css, /@media \(min-width: 600px\) and \(max-width: 1599px\)[\s\S]*?\.statistics \.table-wrap footer \{ height: 68px; \}/, 'Tablet Statistics footer keeps the source 68px pagination frame');
assert.match(css, /@media \(max-width: 599px\)[\s\S]*?\.statistics \.table-wrap footer > span:first-child \{[^}]*font-size: 0/, 'Mobile Statistics hides only the Items per page label, not its select control');
assert.match(html, /table-prev-light-color\.svg[\s\S]*?table-next-light-color\.svg/, 'Mobile Statistics pagination uses the shared state-aware Light Figma arrow controls');
assert.doesNotMatch(css, /@media \(max-width: 599px\)[\s\S]*?\.statistics \.my-title p \{[^}]*max-width:/, 'Wide mobile lets the Statistics subtitle use all available title width');
assert.doesNotMatch(css, /overflow-x:\s*(?:auto|scroll)/, 'Statistics clips the fixed table instead of introducing horizontal scrolling');

console.log('statistics Figma structure: OK');
