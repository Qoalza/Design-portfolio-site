import assert from "node:assert/strict";
import test from "node:test";
import {
  getBuildShaAttribute,
  isExpectedBuildSha,
} from "../src/lib/build-provenance.ts";

const fullSha = "924f52824eedd29a252b63cdbdcf3402c592cd9a";
const otherFullSha = "1111111111111111111111111111111111111111";

test("ordinary development omits build provenance", () => {
  assert.equal(getBuildShaAttribute(undefined), undefined);
  assert.equal(getBuildShaAttribute(""), undefined);
});

test("review provenance accepts only a full Git SHA", () => {
  assert.equal(getBuildShaAttribute(fullSha), fullSha);
  assert.equal(getBuildShaAttribute("924f528"), undefined);
  assert.equal(getBuildShaAttribute("not-a-sha"), undefined);
});

test("review verification fails closed for missing or mismatched SHA", () => {
  assert.equal(isExpectedBuildSha(fullSha, fullSha), true);
  assert.equal(isExpectedBuildSha(undefined, fullSha), false);
  assert.equal(isExpectedBuildSha("", fullSha), false);
  assert.equal(isExpectedBuildSha("924f528", fullSha), false);
  assert.equal(isExpectedBuildSha(otherFullSha, fullSha), false);
});
