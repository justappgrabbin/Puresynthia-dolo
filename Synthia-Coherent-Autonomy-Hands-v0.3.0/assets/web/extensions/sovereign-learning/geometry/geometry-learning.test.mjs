import test from 'node:test';
import assert from 'node:assert/strict';
import { point, constructEquilateralTriangle } from './GeometryKernel.mjs';
import { GeometryOperatorRegistry } from './GeometryOperatorRegistry.mjs';
import { renderSvg } from './MorphSvgRenderer.mjs';

test('learns, verifies, renders, and retains Euclid I.1 as an executable operator', () => {
  const registry = new GeometryOperatorRegistry();
  const candidate = registry.propose({
    name: 'construct-equilateral-triangle',
    inputs: ['point:A', 'point:B'],
    outputs: ['triangle:ABC'],
    constraints: ['AB=AC', 'AB=BC'],
    dependencies: ['circle-intersection', 'line-between-points'],
    source: 'Euclid Elements I.1',
  }, (a, b) => constructEquilateralTriangle(a, b), { procedure: 'two equal-radius circles; join their intersection to the endpoints' });
  const report = registry.evaluate(candidate.id, [point('A', 180, 320), point('B', 460, 320)], (output) => output.verification);
  assert.equal(report.verification.passed, true);
  assert.equal(registry.list().length, 1);
  const svg = renderSvg(report.output.primitives);
  assert.match(svg, /data-id="AB"/);
  assert.match(svg, /data-id="circle-A"/);
});

