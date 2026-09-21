import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('./', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');

const authorization = read('./site/authorization/style.css');
const campaignsCss = read('./site/media-campaigns/style.css');
const campaignsHtml = read('./site/media-campaigns/index.html');
const mySpace = read('./site/my-space/style.css');
const statistics = read('./site/statistics/style.css');

assert.match(authorization, /@media \(min-width: 600px\)/, 'Authorization enters Tablet at 600px');
assert.doesNotMatch(authorization, /@media \(min-width: 480px\)/, 'Authorization keeps 480–599px in Mobile');
assert.doesNotMatch(authorization, /\.authorization \{[^}]*border-radius: (?!0)/, 'Authorization outer frame never restores rounded corners');
assert.match(authorization, /\.authorization \{[^}]*max-width: 1600px;/, 'Authorization desktop frame can occupy the full 1600px viewport');
assert.doesNotMatch(authorization, /\.authorization \{[^}]*max-width: 1440px;/, 'Authorization is not capped at the former 1440px width');
assert.match(authorization, /\.auth-panel \{[^}]*border-radius: 24px;/, 'Authorization mobile card keeps its 24px radius');
assert.match(authorization, /@media \(min-width: 600px\)[\s\S]*?\.auth-panel \{ border-radius: 28px; \}/, 'Authorization tablet card keeps its 28px radius');
assert.match(authorization, /@media \(min-width: 1280px\)[\s\S]*?\.auth-panel \{ border-radius: 32px; \}/, 'Authorization enters Desktop at 1280px while its frame can grow to 1600px');
assert.doesNotMatch(authorization, /@media \(min-width: 960px\)/, 'Authorization never treats the Desktop scene height as a width breakpoint');
assert.match(campaignsCss, /\.campaigns \{[^}]*border-radius: 0;/, 'Shared content frame has square corners on every signed-in scene');
assert.match(campaignsCss, /\.campaigns \{[^}]*max-width: 1600px;/, 'Every signed-in desktop frame can occupy the full 1600px viewport');
assert.doesNotMatch(campaignsCss, /\.campaigns \{[^}]*max-width: 1440px;/, 'Signed-in scenes are not capped at the former 1440px width');

for (const [name, css] of [
  ['Media campaigns', campaignsCss],
  ['Media items', mySpace],
  ['Statistics', statistics],
]) {
  assert.match(css, /@media \(min-width: 600px\) and \(max-width: 1279px\)/, `${name} owns exactly the 600–1279px Tablet range`);
  assert.doesNotMatch(css, /@media \(min-width: 600px\) and \(max-width: 959px\)/, `${name} does not end Tablet at the Desktop scene height`);
}

assert.match(campaignsCss, /@media \(min-width: 1280px\)/, 'Media campaigns enters Desktop at 1280px while its frame can grow to 1600px');
assert.doesNotMatch(campaignsCss, /@media \(min-width: 960px\)/, 'Desktop scene height is never used as a width breakpoint');
assert.doesNotMatch(campaignsCss, /@media \(min-width: 960px\) and \(max-width: 1279px\)/, 'Media campaigns has no extra intermediate breakpoint');
assert.doesNotMatch(campaignsCss, /@media \(min-width: 480px\)/, 'Media campaigns has no unplanned 480px breakpoint');
assert.match(campaignsHtml, /max-width: 1279px/, 'Responsive assets retain their Tablet variants through 1279px');

console.log('responsive plan contract: OK');
