import test from 'node:test';
import assert from 'node:assert/strict';
import { ResultFeedbackLoop } from './ResultFeedbackLoop.mjs';
import { BrowserHandOrgan } from './organs/BrowserHandOrgan.mjs';

test('result loop observes, corrects and verifies within a bound', async () => {
  const loop = new ResultFeedbackLoop({ maxCorrections: 2 });
  const result = await loop.run({
    produce: () => ({ sides: [3, 4, 6] }),
    observe: (value) => value.sides,
    verify: (sides) => ({ passed: sides[0] + sides[1] > sides[2] && sides[0] === sides[1], expected: 'isosceles triangle' }),
    correct: () => ({ sides: [4, 4, 6] }),
  });
  assert.equal(result.status, 'verified');
  assert.equal(result.attempts.length, 2);
});

test('browser hand plans without pretending a host browser is Cynthia', async () => {
  const hand = new BrowserHandOrgan();
  const result = await hand.act({ message: 'fill out a job application for me' });
  assert.equal(result.status, 'planned-awaiting-residence-hand');
  assert.equal(result.route.task, 'form-workflow');
  assert.equal(result.boundary.executorAttached, false);
  assert.equal(result.plan.finalConfirmation, 'submission');
});
