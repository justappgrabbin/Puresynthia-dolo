import test from 'node:test';
import assert from 'node:assert/strict';
import { FirstMind } from './FirstMind.mjs';
import { point, constructEquilateralTriangle } from './geometry/GeometryKernel.mjs';

const lesson = `Construct an equilateral triangle on the given finite straight line AB.
Draw a circle centered at A through B. Then draw a circle centered at B through A.
Join their intersection C to A and B. Compare AB, AC, and BC and verify that they are equal.`;

test('complete first-mind learning loop preserves, analyzes, addresses, builds, renders, and retains', async () => {
  const mind = new FirstMind();
  const result = await mind.learnOperator({
    sourceText: lesson,
    sourceMetadata: { title: 'Elements I.1' },
    contract: {
      name: 'construct-equilateral-triangle',
      inputs: ['point:A', 'point:B'],
      outputs: ['triangle:ABC'],
      constraints: ['AB=AC', 'AB=BC'],
      dependencies: ['circle-intersection', 'line-between-points'],
    },
    implementation: (a, b) => constructEquilateralTriangle(a, b),
    inputs: [point('A', 180, 320), point('B', 460, 320)],
    verifier: (output) => output.verification,
  });
  assert.equal(result.retained, true);
  assert.equal(result.report.verification.passed, true);
  assert.match(result.artifact, /<svg/);
  assert.equal(result.intake.analysis.addressed.addressBasis, 'analysis-derived-candidate');
  assert.ok(result.intake.analysis.procedures.steps.length >= 5);
  assert.equal(mind.stateSpace.editor.summary().currentPrimitives, 1);
  assert.equal(mind.pressure.current.size, 0, 'need pressure clears after the task');
  assert.equal(mind.pressure.memory.get('geometry-operator-registry').successes, 1, 'successful capacity remains learned');
});

test('semantic initialization and addresses replay deterministically', async () => {
  const first = new FirstMind();
  const second = new FirstMind();
  const a = await first.ingestText(lesson);
  const b = await second.ingestText(lesson);
  assert.equal(a.analysis.addressed.addressKey, b.analysis.addressed.addressKey);
  assert.deepEqual([...first.diseminer.semanticFields.entries()], [...second.diseminer.semanticFields.entries()]);
});

