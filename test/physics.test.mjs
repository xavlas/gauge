import { test } from 'node:test';
import assert from 'node:assert/strict';
import { physicsStep } from '../jauge-vintage-card.js';

test('moves displayTemp toward target', () => {
  const s = physicsStep(0, 10, 0, 0.01, 0.92);
  assert.ok(s.displayTemp > 0, 'should advance toward 10');
  assert.ok(s.displayTemp < 10, 'should not overshoot to target instantly');
  assert.equal(s.settled, false);
});

test('snaps and settles when very close and slow', () => {
  const s = physicsStep(9.999, 10, 0.0001, 0.01, 0.92);
  assert.equal(s.displayTemp, 10);
  assert.equal(s.velocity, 0);
  assert.equal(s.settled, true);
});

test('converges to the target after many steps', () => {
  let d = 0, v = 0;
  for (let i = 0; i < 2000; i++) {
    const s = physicsStep(d, 25, v, 0.01, 0.92);
    d = s.displayTemp; v = s.velocity;
    if (s.settled) break;
  }
  assert.ok(Math.abs(d - 25) < 0.01);
});
