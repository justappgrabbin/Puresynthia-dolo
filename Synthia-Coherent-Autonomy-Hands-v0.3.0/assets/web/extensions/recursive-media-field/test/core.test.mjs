import assert from "node:assert/strict";
import {
  StateOperatorSwitcher,
  ChangingLineToolBridge,
} from "../src/srmf-growth-and-rig.mjs";

const switcher = new StateOperatorSwitcher();
const state = {
  movement: 0.95,
  evolution: 0.3,
  being: 0.2,
  design: 0.2,
  space: 0.3,
  tension: 0.8,
};

const before = switcher.select(state);
assert.ok(switcher.operators.length >= 16);
assert.ok(before.operator);

switcher.reinforce(state, "xor", 1);
for (let i = 0; i < 12; i += 1) {
  switcher.reinforce(state, "xor", 1);
}
const after = switcher.select(state);
assert.equal(after.operator, "xor");

const analogy = switcher.completeAnalogy(3, 12, 9, state, { operator: "xnor" });
assert.equal(analogy.operator, "xnor");
assert.ok(Number.isInteger(analogy.result));
assert.ok(analogy.result >= 0 && analogy.result <= 63);

const bridge = new ChangingLineToolBridge({ operatorSwitcher: switcher });
const generated = bridge.generateForTransition({
  fromFuXi: 3,
  toFuXi: 7,
  state,
  purpose: "morph sprite limb",
});
assert.ok(generated.event.changingLines.length > 0);
assert.ok(generated.tool);
assert.ok(generated.tool.id);

console.log("SRMF v1.1 core tests: PASS");
