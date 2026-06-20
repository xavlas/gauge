import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readEntityValue } from '../jauge-vintage-card.js';

const hass = (state) => ({ states: { 'sensor.temp': { state } } });

test('parses a numeric state', () => {
  assert.equal(readEntityValue(hass('21.5'), 'sensor.temp'), 21.5);
});

test('returns null for unavailable/unknown', () => {
  assert.equal(readEntityValue(hass('unavailable'), 'sensor.temp'), null);
  assert.equal(readEntityValue(hass('unknown'), 'sensor.temp'), null);
});

test('returns null when entity or hass is absent', () => {
  assert.equal(readEntityValue(hass('21'), 'sensor.missing'), null);
  assert.equal(readEntityValue(null, 'sensor.temp'), null);
});
