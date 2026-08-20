import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = dirname(fileURLToPath(import.meta.url));
const color = "#E2E2EC";

const icons = [
  {
    slug: "download-cloud-01-line-light",
    label: "Download-cloud-01 · Line Light · mixed cap",
    kind: "line",
    weight: 1,
    paths: [
      {
        d: "M 4 16.242225646972656 C 2.7940142154693604 15.434964179992676 2 14.06020736694336 2 12.5 C 2 10.156430244445801 3.791508197784424 8.231292724609375 6.079741477966309 8.019369125366211 C 6.547814846038818 5.1721320152282715 9.020243644714355 3 12 3 C 14.979756355285645 3 17.452184677124023 5.1721320152282715 17.920257568359375 8.019369125366211 C 20.2084903717041 8.231292724609375 22 10.156430244445801 22 12.5 C 22 14.060208320617676 21.20598602294922 15.434964179992676 20 16.242225646972656 M 8 17 L 12 21 M 12 21 L 16 17 M 12 21 L 12 12",
        fill: "none",
        linecap: "butt",
        linejoin: "round",
      },
    ],
  },
  {
    slug: "close-filter-funnel-02-line-medium",
    label: "Close-filter-funnel-02 · Line Medium · vector network",
    kind: "line",
    weight: 1.3,
    paths: [
      {
        d: "M 14.500259399414062 7 L 18.377269744873047 2.666872024536133 C 19.13361167907715 1.8215491771697998 19.511781692504883 1.3988876342773438 19.526046752929688 1.0396803617477417 C 19.53843879699707 0.7276372909545898 19.404342651367188 0.4277207851409912 19.163532257080078 0.2288869321346283 C 18.886323928833008 0 18.319177627563477 0 17.18488311767578 0 L 2.341952323913574 0 C 1.2076581716537476 0 0.6405112147331238 0 0.36330342292785645 0.2288869321346283 C 0.12249328196048737 0.4277207851409912 -0.011602534505072981 0.7276372909545898 0.0007892236462794244 1.0396803617477417 C 0.015053953451570123 1.3988876342773438 0.3932241201400757 1.8215484619140625 1.1495643854141235 2.666869878768921 L 6.855803489685059 9.044431686401367 C 7.00656795501709 9.212933540344238 7.08195686340332 9.29719066619873 7.135707855224609 9.393075942993164 C 7.183381080627441 9.478117942810059 7.2183613777160645 9.56967544555664 7.23953914642334 9.664840698242188 C 7.2634172439575195 9.772140502929688 7.263417720794678 9.885194778442383 7.263417720794678 10.111303329467773 L 7.263417720794678 16.81837272644043 C 7.263417720794678 17.214229583740234 7.263417720794678 17.412158966064453 7.346669673919678 17.53774642944336 C 7.4194722175598145 17.647571563720703 7.532683372497559 17.724218368530273 7.661690711975098 17.751026153564453 C 7.8092145919799805 17.781681060791016 7.992986679077148 17.708173751831055 8.360530853271484 17.561155319213867 L 9.263671875 17.19989776611328",
        transform: "translate(2.236328125 3)",
        fill: "none",
        linecap: "butt",
        linejoin: "round",
      },
      {
        d: "M 18.263671875 9 L 14.763671875 12.5 M 14.763671875 12.5 L 11.263671875 16 M 14.763671875 12.5 L 11.263671875 9 M 14.763671875 12.5 L 18.263671875 16",
        transform: "translate(2.236328125 3)",
        fill: "none",
        linecap: "butt",
        linejoin: "round",
      },
    ],
  },
  {
    slug: "bar-chart-10-plus-duotone-light",
    label: "Bar-chart-10-plus · Duotone Light · fill + vector network",
    kind: "duotone",
    weight: 1,
    paths: [
      {
        d: "M 1.5999999046325684 4 L 6.000000476837158 4 L 5.999999523162842 18 L 1.5999997854232788 18 C 1.039947509765625 18 0.7599213123321533 18 0.5460095405578613 17.891006469726562 C 0.3578474521636963 17.795133590698242 0.2048669159412384 17.642152786254883 0.1089935377240181 17.453990936279297 C 0 17.24007797241211 0 16.960052490234375 0 16.399999618530273 L 0 5.600000858306885 C 0 5.039947509765625 0 4.759921073913574 0.10899348556995392 4.546009540557861 C 0.20486685633659363 4.357847690582275 0.3578473925590515 4.204866886138916 0.5460094809532166 4.1089935302734375 C 0.7599207162857056 4 1.0399497747421265 4 1.5999999046325684 4 Z",
        transform: "translate(3 3)",
        fill: "currentColor",
        fillOpacity: 0.2,
        linecap: "butt",
        linejoin: "round",
      },
      {
        d: "M 6.000000476837158 4 L 6 1.600000023841858 C 6 1.039947509765625 6 0.7599213123321533 6.1089935302734375 0.5460096001625061 C 6.204866886138916 0.35784751176834106 6.357847690582275 0.20486700534820557 6.546009540557861 0.10899361968040466 C 6.759921073913574 0 7.039947509765625 0 7.599999904632568 0 L 10.399999618530273 0 C 10.960052490234375 0 11.240078926086426 0 11.453990936279297 0.10899345576763153 C 11.642152786254883 0.20486682653427124 11.795133590698242 0.3578473925590515 11.891007423400879 0.5460094809532166 C 12 0.7599194049835205 12 1.0399571657180786 12 1.600000262260437 L 12 8 M 5.999999523162842 18 L 9.289878845214844 18 M 18 9.600000381469727 C 18 9.485424041748047 18 9.382569313049316 17.999067306518555 9.28960132598877 C 17.995439529418945 8.928138732910156 17.97770118713379 8.716158866882324 17.891006469726562 8.546009063720703 C 17.795133590698242 8.357847213745117 17.642152786254883 8.204867362976074 17.453990936279297 8.108993530273438 C 17.24007797241211 8 16.960052490234375 8 16.399999618530273 8 L 12 8 M 12 8 L 12 10 M 16 20 L 16 16 M 16 16 L 16 12 M 16 16 L 12 16 M 16 16 L 20 16",
        transform: "translate(3 3)",
        fill: "none",
        linecap: "butt",
        linejoin: "round",
      },
    ],
  },
];

function escapeAttribute(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}

function svgFor(icon) {
  const paths = icon.paths.map((path) => {
    const attrs = [
      `d="${escapeAttribute(path.d)}"`,
      path.transform ? `transform="${path.transform}"` : "",
      `fill="${path.fill}"`,
      path.fillOpacity ? `fill-opacity="${path.fillOpacity}"` : "",
      `stroke="currentColor"`,
      `stroke-width="${icon.weight}"`,
      `stroke-linecap="${path.linecap}"`,
      `stroke-linejoin="${path.linejoin}"`,
    ].filter(Boolean).join(" ");
    return `  <path ${attrs}/>`;
  }).join("\n");

  return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" color="${color}" xmlns="http://www.w3.org/2000/svg">\n${paths}\n</svg>\n`;
}

function cleanStandard(icon) {
  const raw = readFileSync(join(root, icon.slug, "download-assets-export.svg"), "utf8");
  let paths;
  if (icon.slug === "download-cloud-01-line-light") {
    paths = raw.match(/<path id="Icon"[^>]*\/>/g);
  } else if (icon.slug === "close-filter-funnel-02-line-medium") {
    paths = raw.match(/<path id="Vector"[^>]*\/>/g);
  } else {
    paths = raw.match(/<path [^>]*fill="#E2E2EC"[^>]*\/>/g);
  }
  if (!paths?.length) throw new Error(`Could not extract standard export paths for ${icon.slug}`);
  return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n${paths.join("\n")}\n</svg>\n`;
}

function validateCandidate(icon, svgPath) {
  execFileSync("xmllint", ["--noout", svgPath]);
  const svg = readFileSync(svgPath, "utf8");
  const errors = [];
  if (!/viewBox="0 0 24 24"/.test(svg)) errors.push("viewBox is not 0 0 24 24");
  if (!svg.includes('stroke="currentColor"')) errors.push("missing currentColor stroke");
  if (!svg.includes(`stroke-width="${icon.weight}"`)) errors.push(`missing stroke-width ${icon.weight}`);
  if (!svg.includes('stroke-linecap="butt"')) errors.push("linecap is not explicit");
  if (!svg.includes('stroke-linejoin="round"')) errors.push("linejoin is not explicit");
  const graphicalPaths = [...svg.matchAll(/<path\s+([^>]+)\/>/g)].map((match) => match[1]);
  if (!graphicalPaths.length) errors.push("no paths");
  for (const attributes of graphicalPaths) {
    if (!attributes.includes('stroke="currentColor"')) errors.push("path without real stroke");
    if (!attributes.includes(`stroke-width="${icon.weight}"`)) errors.push("path with wrong stroke width");
    if (icon.kind === "line" && !attributes.includes('fill="none"')) errors.push("Line path uses fill geometry");
  }
  if (icon.kind === "duotone" && !svg.includes('fill-opacity="0.2"')) errors.push("Duotone secondary fill is missing");
  return { pass: errors.length === 0, errors };
}

function classifyStandard(icon, svgPath) {
  execFileSync("xmllint", ["--noout", svgPath]);
  const svg = readFileSync(svgPath, "utf8");
  const hasStroke = /stroke="(?!none)/.test(svg);
  const hasOutlinedMain = icon.kind === "line"
    ? /<path[^>]+fill="#E2E2EC"/.test(svg)
    : /<path[^>]+fill="#E2E2EC"(?![^>]*fill-opacity)/.test(svg) && !hasStroke;
  return {
    accepted: hasStroke && !hasOutlinedMain,
    reason: hasStroke && !hasOutlinedMain
      ? "штатный экспорт уже использует Stroke"
      : "основная линия превращена в outlined Fill; атрибут stroke отсутствует",
  };
}

async function renderAtSizes(svgPath, outputDir) {
  const source = readFileSync(svgPath);
  const outputs = [];
  for (const size of [16, 24, 32, 48]) {
    const output = join(outputDir, `${size}.png`);
    await sharp(source, { density: 288 }).resize(size, size).png().toFile(output);
    outputs.push(output);
  }
  return outputs;
}

async function pixelMetrics(referencePath, candidatePath) {
  const background = { r: 18, g: 18, b: 19 };
  const reference = await sharp(referencePath).flatten({ background }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const candidate = await sharp(candidatePath, { density: 288 }).resize(reference.info.width, reference.info.height).flatten({ background }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let squared = 0;
  let maxDelta = 0;
  let changedPixels = 0;
  const pixelCount = reference.info.width * reference.info.height;
  for (let i = 0; i < reference.data.length; i += 3) {
    let pixelChanged = false;
    for (let channel = 0; channel < 3; channel += 1) {
      const delta = Math.abs(reference.data[i + channel] - candidate.data[i + channel]);
      squared += delta * delta;
      maxDelta = Math.max(maxDelta, delta);
      if (delta > 4) pixelChanged = true;
    }
    if (pixelChanged) changedPixels += 1;
  }
  return {
    rmse: Math.sqrt(squared / reference.data.length),
    maxChannelDelta: maxDelta,
    changedPixelPercent: Number((changedPixels / pixelCount * 100).toFixed(2)),
  };
}

async function renderedMetrics(referencePath, candidatePath, size) {
  const background = { r: 18, g: 18, b: 19 };
  const render = async (path) => sharp(path, { density: 288 })
    .resize(size, size)
    .flatten({ background })
    .removeAlpha()
    .raw()
    .toBuffer();
  const [reference, candidate] = await Promise.all([render(referencePath), render(candidatePath)]);
  let squared = 0;
  let changedPixels = 0;
  for (let i = 0; i < reference.length; i += 3) {
    let pixelChanged = false;
    for (let channel = 0; channel < 3; channel += 1) {
      const delta = Math.abs(reference[i + channel] - candidate[i + channel]);
      squared += delta * delta;
      if (delta > 4) pixelChanged = true;
    }
    if (pixelChanged) changedPixels += 1;
  }
  return {
    rmse: Number(Math.sqrt(squared / reference.length).toFixed(3)),
    changedPixelPercent: Number((changedPixels / (size * size) * 100).toFixed(2)),
  };
}

async function comparison(icon) {
  const sizes = [16, 24, 32, 48];
  const rows = [
    ["Figma reference", join(root, icon.slug, "figma-reference.png"), "raster"],
    ["Standard export", join(root, icon.slug, "figma-standard-clean.svg"), "svg"],
    ["Stroke candidate", join(root, icon.slug, "stroke-candidate.svg"), "svg"],
  ];
  const labelWidth = 250;
  const cellWidth = 92;
  const rowHeight = 76;
  const headerHeight = 62;
  const width = labelWidth + cellWidth * sizes.length;
  const height = headerHeight + rowHeight * rows.length;
  const canvas = sharp({create:{width,height,channels:4,background:"#121213"}});
  const composites = [];
  const headerSvg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><style>text{font-family:Arial,sans-serif;fill:#F2F2F5} .title{font-size:16px;font-weight:700}.label{font-size:13px;fill:#B8B8C3}.size{font-size:12px;fill:#8D8D99}</style><text x="16" y="25" class="title">${icon.label}</text>${sizes.map((size,index)=>`<text x="${labelWidth+index*cellWidth+cellWidth/2}" y="48" text-anchor="middle" class="size">${size}px</text>`).join("")}${rows.map((row,index)=>`<text x="16" y="${headerHeight+index*rowHeight+rowHeight/2+5}" class="label">${row[0]}</text>`).join("")}</svg>`;
  composites.push({input:Buffer.from(headerSvg),left:0,top:0});
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const [, path, type] = rows[rowIndex];
    for (let column = 0; column < sizes.length; column += 1) {
      const size = sizes[column];
      const input = type === "raster"
        ? await sharp(path).resize(size, size).png().toBuffer()
        : await sharp(readFileSync(path), {density:288}).resize(size, size).png().toBuffer();
      composites.push({
        input,
        left: labelWidth + column * cellWidth + Math.floor((cellWidth - size) / 2),
        top: headerHeight + rowIndex * rowHeight + Math.floor((rowHeight - size) / 2),
      });
    }
  }
  await canvas.composite(composites).png().toFile(join(root, icon.slug, "comparison.png"));
}

const results = [];
for (const icon of icons) {
  const dir = join(root, icon.slug);
  mkdirSync(dir, { recursive: true });
  const standardPath = join(dir, "figma-standard-clean.svg");
  const candidatePath = join(dir, "stroke-candidate.svg");
  writeFileSync(standardPath, cleanStandard(icon));
  writeFileSync(candidatePath, svgFor(icon));
  const candidate = validateCandidate(icon, candidatePath);
  const standard = classifyStandard(icon, standardPath);
  const renderDir = join(dir, "sizes");
  mkdirSync(renderDir, { recursive: true });
  await renderAtSizes(candidatePath, renderDir);
  const figmaToCandidate = await pixelMetrics(join(dir, "figma-reference.png"), candidatePath);
  const standardToCandidate = {};
  for (const size of [16, 24, 32, 48]) {
    standardToCandidate[size] = await renderedMetrics(standardPath, candidatePath, size);
  }
  await comparison(icon);
  results.push({ slug: icon.slug, weight: icon.weight, standard, candidate, metrics: { figmaToCandidate, standardToCandidate } });
}

writeFileSync(join(root, "results.json"), `${JSON.stringify(results, null, 2)}\n`);
const comparisonBuffers = await Promise.all(icons.map((icon) => sharp(join(root, icon.slug, "comparison.png")).png().toBuffer({ resolveWithObject: true })));
const combinedWidth = Math.max(...comparisonBuffers.map((item) => item.info.width));
const gap = 12;
const combinedHeight = comparisonBuffers.reduce((sum, item) => sum + item.info.height, 0) + gap * (comparisonBuffers.length - 1);
let top = 0;
const combinedLayers = comparisonBuffers.map((item) => {
  const layer = { input: item.data, left: 0, top };
  top += item.info.height + gap;
  return layer;
});
await sharp({ create: { width: combinedWidth, height: combinedHeight, channels: 4, background: "#121213" } })
  .composite(combinedLayers)
  .png()
  .toFile(join(root, "comparison-all.png"));
console.log(JSON.stringify(results, null, 2));
