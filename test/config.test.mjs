import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeConfig } from '../jauge-vintage-card.js';

test('throws when entity is missing', () => {
  assert.throws(() => normalizeConfig({}), /entity/);
});

test('applies defaults when only entity is given', () => {
  const c = normalizeConfig({ entity: 'sensor.temp' });
  assert.equal(c.title, 'TEMP');
  assert.equal(c.unit, '°C');
  assert.equal(c.min, 0);
  assert.equal(c.max, 45);
  assert.equal(c.decimals, 1);
  assert.equal(c.height, 350);
  assert.equal(c.max_width, null);
  assert.equal(c.colors.background, '#000000');
  assert.deepEqual(c.colors.needle, ['#990000', '#ff3300', '#ffff66']);
  assert.equal(c.geometry.radius, 430);
  assert.equal(c.geometry.center_y, null);
  assert.equal(c.geometry.degrees_per_unit, 4);
  assert.equal(c.geometry.major_every, 2);
  assert.equal(c.animation.enabled, true);
  assert.equal(c.animation.stiffness, 0.01);
  assert.equal(c.animation.damping, 0.92);
});

test('user values override defaults, including nested sections', () => {
  const c = normalizeConfig({
    entity: 'sensor.temp',
    max: 100,
    max_width: 400,
    colors: { title: '#00ff00' },
    geometry: { radius: 500 },
    animation: { enabled: false },
  });
  assert.equal(c.max, 100);
  assert.equal(c.max_width, 400);
  assert.equal(c.colors.title, '#00ff00');
  assert.equal(c.colors.background, '#000000'); // untouched default
  assert.equal(c.geometry.radius, 500);
  assert.equal(c.geometry.degrees_per_unit, 4); // untouched default
  assert.equal(c.animation.enabled, false);
});
