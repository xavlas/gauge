import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  scaleColor,
  isMajorTick,
  computeTicks,
  normalizeConfig,
} from '../jauge-vintage-card.js';

test('scaleColor with factor 1 returns the same color', () => {
  assert.equal(scaleColor('#b4b4b4', 1), 'rgb(180,180,180)');
});

test('scaleColor with factor 0.5 halves each channel', () => {
  assert.equal(scaleColor('#b4b4b4', 0.5), 'rgb(90,90,90)');
});

test('isMajorTick true on multiples of majorEvery, including negatives', () => {
  assert.equal(isMajorTick(0, 2), true);
  assert.equal(isMajorTick(2, 2), true);
  assert.equal(isMajorTick(1, 2), false);
  assert.equal(isMajorTick(-4, 2), true);
  assert.equal(isMajorTick(-3, 2), false);
});

test('computeTicks returns one entry per integer in [min,max]', () => {
  const cfg = normalizeConfig({ entity: 'x', min: 0, max: 45 });
  const ticks = computeTicks(cfg, 0);
  assert.equal(ticks.length, 46);
});

test('the tick equal to temp sits on the needle line (angle 0)', () => {
  const cfg = normalizeConfig({ entity: 'x', min: 0, max: 45 });
  const ticks = computeTicks(cfg, 10);
  const onAxis = ticks.find((t) => t.value === 10);
  // angle 0 -> y equals centerY (height/2 = 175)
  assert.ok(Math.abs(onAxis.y1 - 175) < 1e-6);
  assert.equal(onAxis.major, true);
  assert.ok(onAxis.label === '10');
});

test('major ticks carry a label, minor ticks do not', () => {
  const cfg = normalizeConfig({ entity: 'x', min: 0, max: 4 });
  const ticks = computeTicks(cfg, 0);
  assert.equal(ticks.find((t) => t.value === 2).label, '2');
  assert.equal(ticks.find((t) => t.value === 1).label, null);
});
