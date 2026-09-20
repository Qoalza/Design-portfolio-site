import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const root = new URL('./', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');

const activeBase = read('site/shared/base.css');
const activeAuthorization = read('site/authorization/style.css');
const activeCampaigns = read('site/media-campaigns/style.css');
const activeItemsCss = read('site/my-space/style.css');
const activeHtml = [
  read('site/authorization/index.html'),
  read('site/media-campaigns/index.html'),
  read('site/my-space/index.html'),
  read('site/statistics/index.html'),
].join('\n');
const activeCss = [activeBase, activeAuthorization, activeCampaigns, activeItemsCss, read('site/statistics/style.css')].join('\n');
const archivedBase = read('archive/tt-norms/source/shared/base.css');
const archivedCampaigns = read('archive/tt-norms/source/media-campaigns/style.css');
const authorizationIcons = ['user.svg', 'globe.svg', 'send.svg', 'chevron-down.svg', 'eye.svg']
  .map((file) => read(`site/assets/authorization/${file}`));

assert.match(activeBase, /fonts\.googleapis\.com\/css2\?family=Manrope:wght@400;500;600&display=swap/, 'The working scenes load approved Manrope weights with display=swap');
assert.match(activeBase, /font-family: 'Manrope', sans-serif/, 'Manrope is the working shared font contract');
assert.doesNotMatch(activeHtml + activeCss, /TT Norms Pro|assets\/fonts|base-manrope|(?:authorization|media-campaigns|my-space|statistics)-manrope/, 'Working scenes contain no TT Norms or preview-only paths');
assert.match(activeAuthorization, /font-family: 'Manrope', sans-serif/, 'Authorization uses the working Manrope contract');
assert.match(activeCampaigns, /font-family: 'Manrope', sans-serif/, 'Signed-in scenes use the working Manrope contract');
assert.match(activeAuthorization, /\.form-heading h2 \{[^}]*font-weight: 600/, 'Authorization main heading keeps the approved 600 weight');
assert.match(activeAuthorization, /\.promo-copy h1 \{[^}]*font-weight: 600/, 'Authorization promotional heading keeps the approved 600 weight');
assert.match(activeCampaigns, /\.title h1 \{[^}]*font-weight: 600/, 'Media campaigns main heading keeps the approved 600 weight');
assert.match(activeItemsCss, /\.my-space \.my-title h1 \{[^}]*font-weight: 600/, 'Media items and Statistics main headings keep the approved 600 weight');
assert.match(activeCampaigns, /\.metric-card header \{[^}]*font-weight: 500/, 'KPI headings keep the approved 500 weight');
for (const icon of authorizationIcons) assert.match(icon, /stroke-width="1\.3"/, 'Authorization controls retain their exact Medium 1.3px Figma strokes');

assert.match(archivedBase, /TT Norms Pro/, 'The historical TT Norms font contract remains archived');
assert.match(archivedCampaigns, /font-family: 'TT Norms Pro'/, 'The historical TT Norms scene CSS remains archived');
for (const path of ['site/authorization-manrope', 'site/media-campaigns-manrope', 'site/my-space-manrope', 'site/statistics-manrope']) {
  assert.equal(existsSync(new URL(path, root)), false, `${path} is no longer a parallel working route`);
}

console.log('working Manrope and archived TT Norms contracts: OK');
