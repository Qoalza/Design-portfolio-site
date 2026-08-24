import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const controlsSource = readFileSync(
  new URL("../src/components/ui-controls.tsx", import.meta.url),
  "utf8",
);
const controlsStyles = readFileSync(
  new URL("../src/components/ui-controls.module.css", import.meta.url),
  "utf8",
);
const squareButtonSource = controlsSource.slice(
  controlsSource.indexOf("export function SquareButton"),
  controlsSource.indexOf("function ControlContent"),
);
const disabledLinkSource = squareButtonSource.slice(
  squareButtonSource.indexOf('if (props.kind === "link" && disabled)'),
  squareButtonSource.indexOf('if (props.kind === "button")'),
);

test("SquareButton has an explicit button/link discriminated union", () => {
  assert.match(controlsSource, /type SquareButtonButtonProps[\s\S]*kind: "button"/);
  assert.match(controlsSource, /type SquareButtonLinkProps[\s\S]*kind: "link"/);
  assert.match(controlsSource, /href\?: never/);
  assert.match(controlsSource, /onClick\?: never/);
});

test("disabled SquareButton links have no href or navigation semantics", () => {
  assert.match(
    disabledLinkSource,
    /if \(props\.kind === "link" && disabled\)[\s\S]*<span[\s\S]*aria-disabled="true"[\s\S]*role="link"/,
  );
  assert.doesNotMatch(disabledLinkSource, /href=/);
});

test("SquareButton owns square geometry and never relies on an empty label", () => {
  assert.match(controlsStyles, /\.squareButton\s*\{/);
  assert.match(controlsStyles, /\.squareMedium\s*\{[\s\S]*40px/);
  assert.match(controlsStyles, /\.squareSmall\s*\{[\s\S]*32px/);
  assert.doesNotMatch(squareButtonSource, /styles\.label/);
});
